import {Component, ElementRef, EventEmitter, HostListener, OnDestroy, Output, ViewChild} from '@angular/core';
import {HttpClient} from '@angular/common/http';

import {catchError, of, Subscription, take} from 'rxjs';

import {DisplayService} from '../../services/visualization/display.service';
import {FileReaderService} from '../../services/io/file-reader.service';
import {GraphicsConfigService} from '../../services/config/graphics-config.service';
import {PopupService} from '../../services/notifications/popup.service';
import {RenderService} from '../../services/visualization/render.service';
import {SettingsService} from '../../services/config/settings.service';
import {SimulationService} from '../../services/logic/simulation.service'; 
import {SvgService} from '../../services/visualization/svg.service';
import {ToastService} from '../../services/notifications/toast.service';

import {ExampleFileComponent} from '../example-file/example-file.component';

import {Arc} from '../../classes/net-representation/arc';
import {Net} from '../../classes/net-representation/net';
import {Node} from '../../classes/net-representation/node';
import {Place} from '../../classes/net-representation/place';
import {Transition} from '../../classes/net-representation/transition';

@Component({
    selector: 'net-canvas',
    templateUrl: './canvas.component.html',
    styleUrls: ['./canvas.component.css'],
    standalone: true
})
export class CanvasComponent implements OnDestroy {

    /* properties */

    @ViewChild('drawingArea') drawingArea : (ElementRef<SVGElement> | undefined);

    @Output('fileData') fileData : EventEmitter<{fileType : string, fileContent : string}>;

    @HostListener("window:keyup", ['$event'])
        onKeyUp(event:KeyboardEvent) {
            this.processKeyPress(event);
        };

    /* attributes - references */

    private net : Net;

    /* attributes - own */

    private readonly _netSubscription : Subscription;
    private readonly _settingsSubscription : Subscription;

    private readonly _iterationOverwriteSE : number = 100;

    private _renderConfig : boolean = true;

    private _netUpdates : number = 0;

    private _activeElement : ('transition' | 'place' | 'arc' | 'none') = 'none';
    private _activeTransition : (Transition | undefined) = undefined;
    private _activePlace : (Place | undefined) = undefined;
    private _activeArc : (Arc | undefined) = undefined;

    private _selectionType : ('primary' | 'secondary' | 'none') = 'none';
    private _selectedElement : ('transition' | 'place' | 'arc' | 'none') = 'none';
    private _selectedTransition : (Transition | undefined) = undefined;
    private _selectedPlace : (Place | undefined) = undefined;
    private _selectedArc : (Arc | undefined) = undefined;

    private _draggedElement : ('transition' | 'place' | 'none') = 'none';
    private _draggedTransition : (Transition | undefined) = undefined;
    private _draggedPlace : (Place | undefined) = undefined;

    private _infoDisplayed : boolean = false;
    private _displayedInfo : (Node | undefined);

    private _viewBox : {
        origin_x : number, 
        origin_y : number, 
        width : (number | undefined), 
        height : (number | undefined)
    } = {
        origin_x : 0, 
        origin_y : 0, 
        width : undefined, 
        height : undefined
    };
 
    /* methods - constructor */

    public constructor(
        private readonly displayService : DisplayService,
        private readonly fileReaderService : FileReaderService,
        private readonly graphicsConfigService : GraphicsConfigService,
        private readonly popupService : PopupService,
        private readonly renderService : RenderService,
        private readonly settingsService : SettingsService,
        private readonly simulationService : SimulationService,
        private readonly svgService : SvgService,
        private readonly toastService : ToastService,
        private readonly http : HttpClient,
    ) {
        this.fileData = new EventEmitter<{fileType : string, fileContent : string}>();
        this.displayService.setCanvasComponent(this);
        this.net = this.displayService.net;
        this._netSubscription = this.displayService.net$.subscribe(
            net => {
                this.net = this.displayService.net;
                this._netUpdates++;
                if (this._netUpdates < this.displayService.netUpdates) {
                    this.draw(true);
                    this._netUpdates = this.displayService.netUpdates;
                } else {
                    if (this._netUpdates > this.displayService.netUpdates) {
                        console.warn('CanvasComponent got more net updates than got sent by DisplayService');
                        this._netUpdates = this.displayService.netUpdates;
                    };
                    this.draw(false);
                };
            }
        );
        this._settingsSubscription = this.settingsService.state$.subscribe(
            state => {
                if (this.settingsService.state.springEmbedderEnabled) {
                    if (!(this._renderConfig)) {
                        this.net = this.renderService.applySpringEmbedder(this.net, [], this._iterationOverwriteSE);
                        for (const transition of this.net.transitions) {
                            this.svgService.setSvgTransitionPosition(transition);
                            this.svgService.setSvgNodeSymbolPosition(transition);
                            this.svgService.setSvgNodeLabelPosition(transition);
                            this.svgService.setSvgNodeIdPosition(transition);
                            this.svgService.setSvgNodeInfoPosition(transition);
                            this.svgService.setSVGTransitionInfoTextP(transition);
                        };
                        for (const place of this.net.places) {
                            this.svgService.setSvgPlacePosition(place);
                            this.svgService.setSvgNodeSymbolPosition(place);
                            this.svgService.setSvgNodeLabelPosition(place);
                            this.svgService.setSvgNodeIdPosition(place);
                            this.svgService.setSvgNodeInfoPosition(place);
                            this.svgService.setSVGPlaceInfoTextP(place);
                        };
                        for (const arc of this.net.arcs) {
                            if (arc) {
                                this.svgService.setSvgArcPosition(arc);
                                this.svgService.setSvgArcWeightPosition(arc);
                            };
                        };
                    };
                    this._renderConfig = true;
                } else {
                    this._renderConfig = false;
                };
            }
        );
    };

    /* methods - on destroy */

    ngOnDestroy() : void {
        this._netSubscription.unsubscribe();
        this._settingsSubscription.unsubscribe();
        this.fileData.complete();
    };

    /* methods : getters */

    public get state() : ('default' | 'error' | 'success') {
        if (this.settingsService.state.errorInSequence) {
            return 'error';
        } else if (this.settingsService.state.sequenceTerminated) {
            return 'success';
        } else {
            return 'default';
        };
    };

    /* methods - other */

    private getArc(inArcId : number) : Arc {
        const arc : (Arc | undefined) = this.net.arcs[inArcId];
        if (arc) {
            return arc;
        } else {
            throw new Error('#cmp.cnv.gta.000: ' + 'arc retrieval failed - arc with given id (' + inArcId + ') is undefined');
        };
    };

    private getNode(inNodeId : number) : Node {
        const node : (Node | undefined) = this.net.nodes[inNodeId];
        if (node) {
            return node;
        } else {
            throw new Error('#cmp.cnv.gtn.000: ' + 'node retrieval failed - node with given id (' + inNodeId + ') is undefined');
        };
    };

    private getPlace(inNodeId : number) : Place {
        const node : (Node | undefined) = this.net.nodes[inNodeId];
        if (node) {
            if (node instanceof Place) {
                return node;
            } else {
                throw new Error('#cmp.cnv.gtp.000: ' + 'place retrieval failed - node with given id (' + inNodeId + ') is not of type \'Place\'');
            };
        } else {
            throw new Error('#cmp.cnv.gtp.001: ' + 'place retrieval failed - node with given id (' + inNodeId + ') is undefined');
        };
    };

    private getTransition(inNodeId : number) : Transition {
        const node : (Node | undefined) = this.net.nodes[inNodeId];
        if (node) {
            if (node instanceof Transition) {
                return node;
            } else {
                throw new Error('#cmp.cnv.gtt.000: ' + 'transition retrieval failed - node with given id (' + inNodeId + ') is not of type \'Transition\'');
            };
        } else {
            throw new Error('#cmp.cnv.gtt.001: ' + 'transition retrieval failed - node with given id (' + inNodeId + ') is undefined');
        };
    };

    private getMousePositionInSvg(inEvent : MouseEvent, inSvgElement : SVGSVGElement) : {svg_x : number, svg_y : number} {
        const svgPoint = inSvgElement.createSVGPoint();
        svgPoint.x = inEvent.clientX;
        svgPoint.y = inEvent.clientY;
        const matrix = inSvgElement.getScreenCTM();
        if (!matrix) {
            return {
                svg_x : inEvent.clientX,
                svg_y : inEvent.clientY
            };
        };
        const inverseMatrix = matrix.inverse();
        const transformedPoint = svgPoint.matrixTransform(inverseMatrix);
        return {
            svg_x : transformedPoint.x,
            svg_y : transformedPoint.y
        };
    };

    private getMouseTarget(inMouseEvent : MouseEvent) : [('transition' | 'place' | 'arc' | 'else'), number] {
        inMouseEvent.preventDefault();
        const target = inMouseEvent.target;
        if (target instanceof SVGElement) {
            const targetId : (string | null) = target.getAttribute('id');
            if (targetId !== null) {
                const svgId : string[]  = targetId.split('_');
                if (svgId[0] === 'transition') {
                    return ['transition', parseInt(svgId[1])];
                } else if (svgId[0] === 'place') {
                    return ['place', parseInt(svgId[1])];
                } else if (svgId[0] === 'arc') {
                    return ['arc', parseInt(svgId[1])];
                };
            };
        };
        return ['else', 0];
    };

    private determineActiveElement(inMouseEvent : MouseEvent) : (Transition | Place | Arc | undefined) {
        const targetInfo : [('transition' | 'place' | 'arc' | 'else'), number] = this.getMouseTarget(inMouseEvent);
        switch (targetInfo[0]) {
            case 'transition' : {
                const targetTransition : Transition = this.getTransition(targetInfo[1]);
                switch (this._activeElement) {
                    case 'transition' : {
                        if (this._activeTransition) {
                            if (this._activeTransition !== targetTransition) {
                                if (this._infoDisplayed) {
                                    if (this._displayedInfo) {
                                        this._displayedInfo.infoActive = false;
                                        this.svgService.setSvgNodeInfoVisibility(this._displayedInfo);
                                        this._displayedInfo = undefined;
                                        this._infoDisplayed = false;
                                    } else {
                                        throw new Error('#cmp.cnv.dae.008: ' + 'deactivation of active info failed - affiliated node is undefined');
                                    };
                                } else if (this._activeTransition.hoverActive) {
                                    this._activeTransition.hoverCancelled = true;
                                };
                                if (this._selectionType === 'secondary') {
                                    this.resetSelectedElements();
                                };
                                this._activeTransition.active = false;
                                this.svgService.setSvgTransitionColors(this._activeTransition);
                                this._activeTransition = targetTransition;
                                this._activeTransition.active = true;
                                this.svgService.setSvgTransitionColors(this._activeTransition);
                                this._activeTransition.hoverActive = true;
                                this.checkMouseHover(this._activeTransition);
                            };
                        } else {
                            throw new Error('#cmp.cnv.dae.009: ' + 'deactivation of active transition failed - affiliated node is undefined');
                        };
                        break;
                    }
                    case 'place' : {
                        if (this._activePlace) {
                            if (this._infoDisplayed) {
                                if (this._displayedInfo) {
                                    this._displayedInfo.infoActive = false;
                                    this.svgService.setSvgNodeInfoVisibility(this._displayedInfo);
                                    this._displayedInfo = undefined;
                                    this._infoDisplayed = false;
                                } else {
                                    throw new Error('#cmp.cnv.dae.006: ' + 'deactivation of active info failed - affiliated node is undefined');
                                };
                            } else if (this._activePlace.hoverActive) {
                                this._activePlace.hoverCancelled = true;
                            };
                            this._activePlace.active = false;
                            this.svgService.setSvgPlaceColors(this._activePlace);
                        } else {
                            throw new Error('#cmp.cnv.dae.007: ' + 'deactivation of active place failed - affiliated node is undefined');
                        };
                        if (this._selectionType === 'secondary') {
                            this.resetSelectedElements();
                        };
                        this._activeElement = 'transition';
                        this._activeTransition = targetTransition;
                        this._activeTransition.active = true;
                        this.svgService.setSvgTransitionColors(this._activeTransition);
                        this._activeTransition.hoverActive = true;
                        this.checkMouseHover(this._activeTransition);
                        break;
                    }
                    case 'arc' : {
                        if (this._activeArc) {
                            this._activeArc.active = false;
                            this.svgService.setSvgArcColors(this._activeArc);
                            this._activeArc = undefined;
                        } else {
                            throw new Error('#cmp.cnv.dae.010: ' + 'deactivation of active arc failed - affiliated arc is undefined');
                        };
                        if (this._selectionType === 'secondary') {
                            this.resetSelectedElements();
                        };
                        this._activeElement = 'transition';
                        this._activeTransition = targetTransition;
                        this._activeTransition.active = true;
                        this.svgService.setSvgTransitionColors(this._activeTransition);
                        this._activeTransition.hoverActive = true;
                        this.checkMouseHover(this._activeTransition);
                        break;
                    }
                    case 'none' : {
                        if (this._selectionType === 'secondary') {
                            this.resetSelectedElements();
                        };
                        this._activeElement = 'transition';
                        this._activeTransition = targetTransition;
                        this._activeTransition.active = true;
                        this.svgService.setSvgTransitionColors(this._activeTransition);
                        this._activeTransition.hoverActive = true;
                        this.checkMouseHover(this._activeTransition);
                    }
                };
                return (this._activeTransition);
            }
            case 'place' : {
                const targetPlace : Place = this.getPlace(targetInfo[1]);
                switch (this._activeElement) {
                    case 'transition' : {
                        if (this._activeTransition) {
                            if (this._infoDisplayed) {
                                if (this._displayedInfo) {
                                    this._displayedInfo.infoActive = false;
                                    this.svgService.setSvgNodeInfoVisibility(this._displayedInfo);
                                    this._displayedInfo = undefined;
                                    this._infoDisplayed = false;
                                } else {
                                    throw new Error('#cmp.cnv.dae.002: ' + 'deactivation of active info failed - affiliated node is undefined');
                                };
                            } else if (this._activeTransition.hoverActive) {
                                this._activeTransition.hoverCancelled = true;
                            };
                            this._activeTransition.active = false;
                            this.svgService.setSvgTransitionColors(this._activeTransition);
                        } else {
                            throw new Error('#cmp.cnv.dae.003: ' + 'deactivation of active transition failed - affiliated node is undefined');
                        };
                        if (this._selectionType === 'secondary') {
                            this.resetSelectedElements();
                        };
                        this._activeElement = 'place';
                        this._activePlace = targetPlace;
                        this._activePlace.active = true;
                        this.svgService.setSvgPlaceColors(this._activePlace);
                        this._activePlace.hoverActive = true;
                        this.checkMouseHover(this._activePlace);
                        break;
                    }
                    case 'place' : {
                        if (this._activePlace) {
                            if (this._activePlace !== targetPlace) {
                                if (this._infoDisplayed) {
                                    if (this._displayedInfo) {
                                        this._displayedInfo.infoActive = false;
                                        this.svgService.setSvgNodeInfoVisibility(this._displayedInfo);
                                        this._displayedInfo = undefined;
                                        this._infoDisplayed = false;
                                    } else {
                                        throw new Error('#cmp.cnv.dae.000: ' + 'deactivation of active info failed - affiliated node is undefined');
                                    };
                                } else if (this._activePlace.hoverActive) {
                                    this._activePlace.hoverCancelled = true;
                                };
                                if (this._selectionType === 'secondary') {
                                    this.resetSelectedElements();
                                };
                                this._activePlace.active = false;
                                this.svgService.setSvgPlaceColors(this._activePlace);
                                this._activePlace = targetPlace;
                                this._activePlace.active = true;
                                this.svgService.setSvgPlaceColors(this._activePlace);
                                this._activePlace.hoverActive = true;
                                this.checkMouseHover(this._activePlace);
                            };
                        } else {
                            throw new Error('#cmp.cnv.dae.001: ' + 'deactivation of active place failed - affiliated node is undefined');
                        };
                        break;
                    }
                    case 'arc' : {
                        if (this._activeArc) {
                            this._activeArc.active = false;
                            this.svgService.setSvgArcColors(this._activeArc);
                            this._activeArc = undefined;
                        } else {
                            throw new Error('#cmp.cnv.dae.004: ' + 'deactivation of active arc failed - affiliated arc is undefined');
                        };
                        if (this._selectionType === 'secondary') {
                            this.resetSelectedElements();
                        };
                        this._activeElement = 'place';
                        this._activePlace = targetPlace;
                        this._activePlace.active = true;
                        this.svgService.setSvgPlaceColors(this._activePlace);
                        this._activePlace.hoverActive = true;
                        this.checkMouseHover(this._activePlace);
                        break;
                    }
                    case 'none' : {
                        if (this._selectionType === 'secondary') {
                            this.resetSelectedElements();
                        };
                        this._activeElement = 'place';
                        this._activePlace = targetPlace;
                        this._activePlace.active = true;
                        this.svgService.setSvgPlaceColors(this._activePlace);
                        this._activePlace.hoverActive = true;
                        this.checkMouseHover(this._activePlace);
                    }
                };
                return (this._activePlace);
            }
            case 'arc' : {
                const targetArc : Arc = this.getArc(targetInfo[1]);
                switch (this._activeElement) {
                    case 'transition' : {
                        if (this._activeTransition) {
                            if (this._infoDisplayed) {
                                if (this._displayedInfo) {
                                    this._displayedInfo.infoActive = false;
                                    this.svgService.setSvgNodeInfoVisibility(this._displayedInfo);
                                    this._displayedInfo = undefined;
                                    this._infoDisplayed = false;
                                } else {
                                    throw new Error('#cmp.cnv.dae.014: ' + 'deactivation of active info failed - affiliated node is undefined');
                                };
                            } else if (this._activeTransition.hoverActive) {
                                this._activeTransition.hoverCancelled = true;
                            };
                            this._activeTransition.active = false;
                            this.svgService.setSvgTransitionColors(this._activeTransition);
                        } else {
                            throw new Error('#cmp.cnv.dae.015: ' + 'deactivation of active transition failed - affiliated node is undefined');
                        };
                        if (this._selectionType === 'secondary') {
                            this.resetSelectedElements();
                        };
                        this._activeElement = 'arc';
                        this._activeArc = targetArc;
                        this._activeArc.active = true;
                        this.svgService.setSvgArcColors(this._activeArc);
                        break;
                    }
                    case 'place' : {
                        if (this._activePlace) {
                            if (this._infoDisplayed) {
                                if (this._displayedInfo) {
                                    this._displayedInfo.infoActive = false;
                                    this.svgService.setSvgNodeInfoVisibility(this._displayedInfo);
                                    this._displayedInfo = undefined;
                                    this._infoDisplayed = false;
                                } else {
                                    throw new Error('#cmp.cnv.dae.012: ' + 'deactivation of active info failed - affiliated node is undefined');
                                };
                            } else if (this._activePlace.hoverActive) {
                                this._activePlace.hoverCancelled = true;
                            };
                            this._activePlace.active = false;
                            this.svgService.setSvgPlaceColors(this._activePlace);
                        } else {
                            throw new Error('#cmp.cnv.dae.013: ' + 'deactivation of active place failed - affiliated node is undefined');
                        };
                        if (this._selectionType === 'secondary') {
                            this.resetSelectedElements();
                        };
                        this._activeElement = 'arc';
                        this._activeArc = targetArc;
                        this._activeArc.active = true;
                        this.svgService.setSvgArcColors(this._activeArc);
                        break;
                    }
                    case 'arc' : {
                        if (this._activeArc) {
                            if (this._activeArc !== targetArc) {
                                if (this._selectionType === 'secondary') {
                                    this.resetSelectedElements();
                                };
                                this._activeArc.active = false;
                                this.svgService.setSvgArcColors(this._activeArc);
                                this._activeArc = targetArc;
                                this._activeArc.active = true;
                                this.svgService.setSvgArcColors(this._activeArc);
                            };
                        } else {
                            throw new Error('#cmp.cnv.dae.016: ' + 'deactivation of active transition failed - affiliated node is undefined');
                        };
                        break;
                    }
                    case 'none' : {
                        if (this._selectionType === 'secondary') {
                            this.resetSelectedElements();
                        };
                        this._activeElement = 'arc';
                        this._activeArc = targetArc;
                        this._activeArc.active = true;
                        this.svgService.setSvgArcColors(this._activeArc);
                    }
                };
                return (this._activeArc);
            }
            case 'else' : {
                if (this._selectionType === 'secondary') {
                    this.resetSelectedElements();
                };
                this.resetActiveElements();
                return (undefined);
            }
        };
    };

    private async checkMouseHover(inNode : Node) : Promise<void> {
        await new Promise(resolve => setTimeout(resolve, this.graphicsConfigService.defaultInfoHoverDelay));
        if (inNode.hoverActive) {
            if (inNode.hoverCancelled) {
                inNode.hoverActive = false;
                inNode.hoverCancelled = false;
            } else {
                this._displayedInfo = inNode;
                this._infoDisplayed = true;
                inNode.infoActive = true;
                inNode.hoverActive = false;
                inNode.hoverCancelled = false;
                this.svgService.setSvgNodeInfoVisibility(inNode);
            }
        };
    };

    public processMouseEvent(inMouseEvent : MouseEvent) : void {
        inMouseEvent.preventDefault();
    };

    public processMouseEnter(inMouseEvent : MouseEvent) {
        inMouseEvent.preventDefault();
    };

    public processMouseDown(inMouseEvent : MouseEvent) {
        inMouseEvent.preventDefault();
        if (this._selectionType === 'none') {
            if (this._selectedElement !== 'none') {
                this.resetSelectedElements();
                throw new Error('#cmp.cnv.pmd.000: ' + 'element selection failed - previous selection was not properly reset');
            };
            let mouseAction : ('primary' | 'secondary' | 'none');
            switch (inMouseEvent.button) {
                case 0 : {
                    mouseAction = 'primary';
                    break;
                }
                case 1 : {
                    mouseAction = 'secondary';
                    break;
                }
                default : {
                    mouseAction = 'none';
                    break;
                }
            };
            if (mouseAction !== 'none') {
                const activatedElement : (Transition | Place | Arc | undefined) = this.determineActiveElement(inMouseEvent);
                if (activatedElement) {
                    if (activatedElement instanceof Transition) {
                        this._selectionType = mouseAction;
                        this._selectedElement = 'transition';
                        this._selectedTransition = activatedElement;
                    } else if (activatedElement instanceof Place) {
                        this._selectionType = mouseAction;
                        this._selectedElement = 'place';
                        this._selectedPlace = activatedElement;
                    } else {
                        this._selectionType = mouseAction;
                        this._selectedElement = 'arc';
                        this._selectedArc = activatedElement;
                    };
                };
            };
        };
    };

    public processMouseMove(inMouseEvent : MouseEvent) {
        inMouseEvent.preventDefault();
        if (this._selectionType === 'primary') {
            if (this._selectedElement === 'transition') {
                if (this._selectedTransition) {
                    const svgDrawingArea = this.drawingArea?.nativeElement as SVGSVGElement;
                    const {svg_x, svg_y} = this.getMousePositionInSvg(inMouseEvent, svgDrawingArea);
                    this._draggedElement = 'transition';
                    this._draggedTransition = this._selectedTransition;
                    this._draggedTransition.x = Math.round(svg_x);
                    this._draggedTransition.y = Math.round(svg_y);
                    if (this._draggedTransition.hoverActive) {
                        this._draggedTransition.hoverCancelled;
                    } else if (this._draggedTransition.infoActive) {
                        if (this._infoDisplayed) {
                            if (this._displayedInfo) {
                                if (this._displayedInfo === this._draggedTransition) {
                                    this._displayedInfo.infoActive = false;
                                    this.svgService.setSvgNodeInfoVisibility(this._displayedInfo);
                                    this._displayedInfo = undefined;
                                    this._infoDisplayed = false;
                                } else {
                                    this._displayedInfo.infoActive = false;
                                    this.svgService.setSvgNodeInfoVisibility(this._displayedInfo);
                                    this._displayedInfo = undefined;
                                    this._infoDisplayed = false;
                                    throw new Error('#cmp.cnv.pmm.000: ' + 'element drag failed - selected transition has active info, but does not match global info display');
                                };
                            } else {
                                this._displayedInfo = undefined;
                                this._infoDisplayed = false;
                                throw new Error('#cmp.cnv.pmm.001: ' + 'element drag failed - global info display flag is set to true, but info to be displayed is undefined');
                            };
                        } else {
                            throw new Error('#cmp.cnv.pmm.002: ' + 'element drag failed - selected transition has active info, but global info display flag is set to false');
                        };
                    };
                    if (this.settingsService.state.springEmbedderEnabled) {
                        if (this.settingsService.state.springEmbedderExemptions) {
                            this.net = this.renderService.applySpringEmbedder(this.net, [this._draggedTransition]);
                        } else {
                            this.net = this.renderService.applySpringEmbedder(this.net, []);
                        };
                        for (const transition of this.net.transitions) {
                            this.svgService.setSvgTransitionPosition(transition);
                            this.svgService.setSvgNodeSymbolPosition(transition);
                            this.svgService.setSvgNodeLabelPosition(transition);
                            this.svgService.setSvgNodeIdPosition(transition);
                            this.svgService.setSvgNodeInfoPosition(transition);
                            this.svgService.setSVGTransitionInfoTextP(transition);
                        };
                        for (const place of this.net.places) {
                            this.svgService.setSvgPlacePosition(place);
                            this.svgService.setSvgNodeSymbolPosition(place);
                            this.svgService.setSvgNodeLabelPosition(place);
                            this.svgService.setSvgNodeIdPosition(place);
                            this.svgService.setSvgNodeInfoPosition(place);
                            this.svgService.setSVGPlaceInfoTextP(place);
                        };
                    for (const arc of this.net.arcs) {
                        if (arc) {
                            this.svgService.setSvgArcPosition(arc);
                            this.svgService.setSvgArcWeightPosition(arc);
                        };
                    };
                    } else {
                        this.svgService.setSvgTransitionPosition(this._draggedTransition);
                        this.svgService.setSvgNodeSymbolPosition(this._draggedTransition);
                        this.svgService.setSvgNodeLabelPosition(this._draggedTransition);
                        this.svgService.setSvgNodeIdPosition(this._draggedTransition);
                        this.svgService.setSvgNodeInfoPosition(this._draggedTransition);
                        this.svgService.setSVGTransitionInfoTextP(this._draggedTransition);
                        for (const arc of this.net.arcs) {
                            if (arc) {
                                if (arc.transition === this._draggedTransition) {
                                    this.svgService.setSvgArcPosition(arc);
                                    this.svgService.setSvgArcWeightPosition(arc);
                                };
                            };
                        };
                    };
                } else {
                    throw new Error('#cmp.cnv.pmm.004: ' + 'element drag failed - selected transition is undefined');
                };
            } else if (this._selectedElement === 'place') {
                if (this._selectedPlace) {
                    const svgDrawingArea = this.drawingArea?.nativeElement as SVGSVGElement;
                    const {svg_x, svg_y} = this.getMousePositionInSvg(inMouseEvent, svgDrawingArea);
                    this._draggedElement = 'place';
                    this._draggedPlace = this._selectedPlace;
                    this._draggedPlace.x = Math.round(svg_x);
                    this._draggedPlace.y = Math.round(svg_y);
                    if (this._draggedPlace.hoverActive) {
                        this._draggedPlace.hoverCancelled;
                    } else if (this._draggedPlace.infoActive) {
                        if (this._infoDisplayed) {
                            if (this._displayedInfo) {
                                if (this._displayedInfo === this._draggedPlace) {
                                    this._displayedInfo.infoActive = false;
                                    this.svgService.setSvgNodeInfoVisibility(this._displayedInfo);
                                    this._displayedInfo = undefined;
                                    this._infoDisplayed = false;
                                } else {
                                    this._displayedInfo.infoActive = false;
                                    this.svgService.setSvgNodeInfoVisibility(this._displayedInfo);
                                    this._displayedInfo = undefined;
                                    this._infoDisplayed = false;
                                    throw new Error('#cmp.cnv.pmm.005: ' + 'element drag failed - selected place has active info, but does not match global info display');
                                };
                            } else {
                                this._displayedInfo = undefined;
                                this._infoDisplayed = false;
                                throw new Error('#cmp.cnv.pmm.006: ' + 'element drag failed - global info display flag is set to true, but info to be displayed is undefined');
                            };
                        } else {
                            throw new Error('#cmp.cnv.pmm.007: ' + 'element drag failed - selected place has active info, but global info display flag is set to false');
                        };
                    };
                    if (this.settingsService.state.springEmbedderEnabled) {
                        if (this.settingsService.state.springEmbedderExemptions) {
                            this.net = this.renderService.applySpringEmbedder(this.net, [this._draggedPlace]);
                        } else {
                            this.net = this.renderService.applySpringEmbedder(this.net, []);
                        };
                        for (const transition of this.net.transitions) {
                            this.svgService.setSvgTransitionPosition(transition);
                            this.svgService.setSvgNodeSymbolPosition(transition);
                            this.svgService.setSvgNodeLabelPosition(transition);
                            this.svgService.setSvgNodeIdPosition(transition);
                            this.svgService.setSvgNodeInfoPosition(transition);
                            this.svgService.setSVGTransitionInfoTextP(transition);
                        };
                        for (const place of this.net.places) {
                            this.svgService.setSvgPlacePosition(place);
                            this.svgService.setSvgNodeSymbolPosition(place);
                            this.svgService.setSvgNodeLabelPosition(place);
                            this.svgService.setSvgNodeIdPosition(place);
                            this.svgService.setSvgNodeInfoPosition(place);
                            this.svgService.setSVGPlaceInfoTextP(place);
                        };
                        for (const arc of this.net.arcs) {
                            if (arc) {
                                this.svgService.setSvgArcPosition(arc);
                                this.svgService.setSvgArcWeightPosition(arc);
                            };
                        };
                    } else {
                        this.svgService.setSvgPlacePosition(this._draggedPlace);
                        this.svgService.setSvgNodeSymbolPosition(this._draggedPlace);
                        this.svgService.setSvgNodeLabelPosition(this._draggedPlace);
                        this.svgService.setSvgNodeIdPosition(this._draggedPlace);
                        this.svgService.setSvgNodeInfoPosition(this._draggedPlace);
                        this.svgService.setSVGPlaceInfoTextP(this._draggedPlace);
                        for (const arc of this.net.arcs) {
                            if (arc) {
                                if (arc.place === this._draggedPlace) {
                                    this.svgService.setSvgArcPosition(arc);
                                    this.svgService.setSvgArcWeightPosition(arc);
                                };
                            };
                        };
                    };
                } else {
                    throw new Error('#cmp.cnv.pmm.009: ' + 'element drag failed - selected place is undefined');
                };
            };
        } else {
            this.determineActiveElement(inMouseEvent);
        };
    };

    public processMouseUp(inMouseEvent : MouseEvent) {
        inMouseEvent.preventDefault();
        if (this._selectionType === 'primary') {
            if (inMouseEvent.button === 0) {
                if (this._draggedElement === 'none') {
                    if (this._selectedElement === 'transition') {
                        if (this._selectedTransition) {
                            this.simulationService.fireTransition(this._selectedTransition);
                            this._selectedTransition = undefined;
                            this._selectedElement = 'none';
                            this._selectionType = 'none';
                        } else {
                            this.resetDraggedElements();
                            this.resetSelectedElements();
                            throw new Error('#cmp.cnv.pmu.000: ' + 'firing transition failed - selected transition is undefined');
                        };
                    };
                };
                this.resetDraggedElements();
                this.resetSelectedElements();
            };
        } else if (this._selectionType === 'secondary') {
            if (inMouseEvent.button === 1) {
                switch (this._selectedElement) {
                    case 'transition' : {
                        if (this._selectedTransition) {
                            this.svgService.setElementMarkedFlag((this._selectedTransition), (!(this._selectedTransition.marked)));
                            this._selectedTransition = undefined;
                            this._selectedElement = 'none';
                            this._selectionType = 'none';
                        } else {
                            this.resetDraggedElements();
                            this.resetSelectedElements();
                            throw new Error('#cmp.cnv.pmu.001: ' + 'element deselection failed - selected transition is undefined');
                        };
                        break;
                    }
                    case 'place' : {
                        if (this._selectedPlace) {
                            this.svgService.setElementMarkedFlag((this._selectedPlace), (!(this._selectedPlace.marked)));
                            this._selectedPlace = undefined;
                            this._selectedElement = 'none';
                            this._selectionType = 'none';
                        } else {
                            this.resetDraggedElements();
                            this.resetSelectedElements();
                            throw new Error('#cmp.cnv.pmu.002: ' + 'element deselection failed - selected place is undefined');
                        };
                        break;
                    }
                    case 'arc' : {
                        if (this._selectedArc) {
                            this._selectedArc.overrideHover = true;
                            this.svgService.setElementMarkedFlag((this._selectedArc), (!(this._selectedArc.marked)));
                            this._selectedArc.overrideHover = false;
                            this._selectedArc = undefined;
                            this._selectedElement = 'none';
                            this._selectionType = 'none';
                        } else {
                            this.resetDraggedElements();
                            this.resetSelectedElements();
                            throw new Error('#cmp.cnv.pmu.003: ' + 'element deselection failed - selected arc is undefined');
                        };
                        break;
                    }
                    case 'none' : {
                        this.resetDraggedElements();
                        this.resetSelectedElements();
                        throw new Error('#cmp.cnv.pmu.004: ' + 'element deselection failed - selection was not properly set');
                    }
                };
            };
        };
    };

    public processMouseLeave(inMouseEvent : MouseEvent) {
        inMouseEvent.preventDefault();
        this.resetDraggedElements();
        this.resetSelectedElements();
        this.resetActiveElements();
    };

    public processMouseWheel(inWheelEvent: WheelEvent) {
        if (this.net.empty) return;
        if (!this.drawingArea?.nativeElement) return;
        this._viewBox.width ??= this.drawingArea?.nativeElement.clientWidth;
        this._viewBox.height ??= this.drawingArea?.nativeElement.clientHeight;
        this.drawingArea?.nativeElement.setAttribute('viewBox', `${this._viewBox.origin_x} ${this._viewBox.origin_y} ${this._viewBox.width} ${this._viewBox.height}`);
        if ((!(this._viewBox.height)) || (!(this._viewBox.width))) return;
        if(inWheelEvent.deltaY < 0) {
            this.drawingArea.nativeElement.style.cursor = 'zoom-in';
        } else {
            this.drawingArea.nativeElement.style.cursor = 'zoom-out';
        };
        inWheelEvent.preventDefault();
        var mx = inWheelEvent.offsetX;
        var my = inWheelEvent.offsetY;
        var dw = (this._viewBox.width * Math.sign(inWheelEvent.deltaY) * -0.05);
        var dh = (this._viewBox.height * Math.sign(inWheelEvent.deltaY) * -0.05);
        var dx = (dw * mx / this.drawingArea?.nativeElement.clientWidth);
        var dy = (dh * my / this.drawingArea?.nativeElement.clientHeight);
        this.updateViewBox((this._viewBox.origin_x + dx), (this._viewBox.origin_y + dy), (this._viewBox.width - dw), (this._viewBox.height - dh));
        setTimeout(
            () => {
                if (this.drawingArea) {
                    this.drawingArea.nativeElement.style.cursor = 'default';
                };
            }, 200
        )
    };

    private processKeyPress(inKeyboardEvent : KeyboardEvent) {
        inKeyboardEvent.preventDefault();
        if ((inKeyboardEvent.key === 'i') || (inKeyboardEvent.key === 'I')) {
            switch (this._activeElement) {
                case 'transition' : {
                    if (this._activeTransition) {
                        this._activeTransition.infoOverride = (!(this._activeTransition.infoOverride));
                        this.svgService.setSvgNodeInfoVisibility(this._activeTransition);
                    } else {
                        throw new Error('#cmp.cnv.pkp.001: ' + 'inversion of node info override failed - active transition is undefined');
                    };
                    break;
                }
                case 'place' : {
                    if (this._activePlace) {
                        this._activePlace.infoOverride = (!(this._activePlace.infoOverride));
                        this.svgService.setSvgNodeInfoVisibility(this._activePlace);
                    } else {
                        throw new Error('#cmp.cnv.pkp.000: ' + 'inversion of node info override failed - active place is undefined');
                    };
                    break;
                }
            };
        } else if ((inKeyboardEvent.key === 'm') || (inKeyboardEvent.key === 'M')) {
            switch (this._activeElement) {
                case 'transition' : {
                    if (this._activeTransition) {
                        this.svgService.setElementMarkedFlag((this._activeTransition), (!(this._activeTransition.marked)));
                    } else {
                        throw new Error('#cmp.cnv.pkp.003: ' + 'inversion of node marked flag failed - active transition is undefined');
                    };
                    break;
                }
                case 'place' : {
                    if (this._activePlace) {
                        this.svgService.setElementMarkedFlag((this._activePlace), (!(this._activePlace.marked)));
                    } else {
                        throw new Error('#cmp.cnv.pkp.002: ' + 'inversion of node marked flag failed - active place is undefined');
                    };
                    break;
                }
                case 'arc' : {
                    if (this._activeArc) {
                        this._activeArc.overrideHover = true;
                        this.svgService.setElementMarkedFlag((this._activeArc), (!(this._activeArc.marked)));
                        this._activeArc.overrideHover = false;
                    } else {
                        throw new Error('#cmp.cnv.pkp.004: ' + 'inversion of arc marked flag failed - active arc is undefined');
                    };
                    break;
                }
            };
        };
    };

    public processDropEvent(inDragEvent : DragEvent) : void {
        inDragEvent.preventDefault();
        if (this.settingsService.state.autorunExec) {
            switch (this.settingsService.state.notifyInfo) {
                case 'dialog' : {
                    this.popupService.info([{
                        style : 'text-align:center;margin-top:10px;',
                        content : 'the automated sequence execution is active'
                    }], 'File Loading Disabled');
                    break;
                }
                case 'popup' : {
                    window.alert('File Loading Disabled' + '\n' + '\n' + ' (the automated sequence execution is active)');
                    break;
                }
                case 'toast' : {
                    this.toastService.showPanel('info', ['File Loading Disabled', '(the automated sequence execution is active)']);
                    break;
                }
            };
            return;
        };
        const inputLocation = inDragEvent.dataTransfer?.getData(ExampleFileComponent.META_DATA_CODE);
        if (inputLocation) {
            this.fetchInput(inputLocation);
        } else {
            this.readInput(inDragEvent.dataTransfer?.files);
        };
    };

    public prevent(inEvent : DragEvent) : void {
        /* dragover must be prevented for drop to work */
        inEvent.preventDefault();
    };

    private fetchInput(inLink : string) : void {
        this.http.get(
            inLink,
            { responseType: 'text' }
        ).pipe(
            catchError(
                error => {
                    console.error('error occurred while fetching file from link', inLink, error);
                    return of(undefined);
                }
            ),
            take(1)
        ).subscribe(
            fileContent => {
                const fileType : (string | undefined) = inLink.split('.').pop();
                if (fileType !== undefined) {
                    this.emitFileData(fileType, fileContent);
                } else {
                    this.popupService.error('cmp.cnv.fti.000', 'failed to fetch input', 'consider checking format and content of the input file');
                    console.error('Error: #cmp.cnv.fti.000: ' + 'fetching from input link failed - filetype was assigned "undefined"');
                    console.error('Input: ', inLink);
                }
            }
        );
    };

    private readInput(inList : (FileList | undefined | null)) : void {
        if ((inList === undefined) || (inList === null) || (inList.length === 0)) {
            return;
        }
        const fileType : (string | undefined) = inList[0].name.split('.').pop();
        if (fileType !== undefined) {
            this.fileReaderService.readFile(inList[0]).pipe(take(1)).subscribe(
                fileContent => {
                    this.emitFileData(fileType, fileContent);
                }
            );
        } else {
            this.popupService.error('cmp.cnv.rdi.000', 'failed to read input', 'consider checking format and content of the input file');
            console.error('Error: #cmp.cnv.rdi.000: ' + 'reading from input list failed - filetype was assigned "undefined"');
            console.error('Input: ', inList);
        };
    };

    private emitFileData(inFileType : (string | undefined), inFileContent : (string | undefined)) : void {
        if ((inFileType === undefined) || (inFileContent === undefined)) {
            return;
        }
        this.fileData.emit({fileType : inFileType, fileContent : inFileContent});
    };

    private async draw(redraw : boolean) : Promise<void> {
        const time : number = 50;
        let tries : number = 0;
        while (tries < 4) {
            if (this.drawingArea === undefined) {
                await new Promise(resolve => setTimeout(resolve, time));
                tries++;
            } else {
                break;
            };
        };
        if (this.drawingArea === undefined) {
            if (this.displayService.net.empty) {
                console.debug('drawing area not initialized yet');
            } else {
                console.warn('CanvasComponent failed to draw net - the drawing area is undefined (tried drawing ' + tries + ' times over ' + (tries * time) + 'ms)');
            };
            return;
        };
        if (!redraw) {
            if (this.settingsService.state.springEmbedderEnabled) {
                this.net = this.renderService.applySpringEmbedder(this.net, [], this._iterationOverwriteSE);
                // const canvasWidth = this.drawingArea.nativeElement.clientWidth;
                // const canvasHeight = this.drawingArea.nativeElement.clientHeight;
                // this.resizeNetToFitCanvas(this._net, canvasWidth, canvasHeight);
            } else {
                this.net = this.renderService.roundNodeCoordinates(this.net);
            };
            this.focusViewBox();
        } else {
            const lastViewBox : {origin_x : number, origin_y : number, width : number, height : number} = this.svgService.getViewBox();
            this.updateViewBox(lastViewBox.origin_x, lastViewBox.origin_y, lastViewBox.width, lastViewBox.height);
        };
        this.clearDrawingArea();
        const svgLayers : [SVGElement[], SVGElement[], SVGElement[], SVGElement[]] = this.svgService.createSvgStatics();
        const svgHelpElements : SVGElement[] = svgLayers[0];
        const svgNetElements : SVGElement[] = svgLayers[1];
        const svgDescriptors : SVGElement[] = svgLayers[2];
        const svgInfoBoxes : SVGElement[] = svgLayers[3];
        for (const svg of svgHelpElements) {
            this.drawingArea.nativeElement.appendChild(svg);
        };
        for (const svg of svgNetElements) {
            this.drawingArea.nativeElement.appendChild(svg);
        };
        for (const svg of svgDescriptors) {
            this.drawingArea.nativeElement.appendChild(svg);
        };
        for (const svg of svgInfoBoxes) {
            this.drawingArea.nativeElement.appendChild(svg);
        };
    };

    private clearDrawingArea() : void {
        const drawingArea = this.drawingArea?.nativeElement;
        if (drawingArea?.childElementCount === undefined) {
            return;
        };
        while (drawingArea.childElementCount > 0) {
            drawingArea.removeChild(drawingArea.lastChild as ChildNode);
        };
    };

    private resetViewBox() {
        this.updateViewBox(0, 0, this.drawingArea?.nativeElement.clientWidth, this.drawingArea?.nativeElement.clientHeight);
    };

    private updateViewBox(
        inX : number, 
        inY : number, 
        inW : (number | undefined), 
        inH : (number | undefined)
    ) {
        this._viewBox = {
            origin_x : inX, 
            origin_y : inY, 
            width : inW, 
            height : inH
        };
        this.svgService.setViewBox(this._viewBox.origin_x, this._viewBox.origin_y, this._viewBox.width, this._viewBox.height);
        this.drawingArea?.nativeElement.setAttribute('viewBox', `${this._viewBox.origin_x} ${this._viewBox.origin_y} ${this._viewBox.width} ${this._viewBox.height}`);
    };

    public focusViewBox() : void {
        let x_min : number = 0;
        let x_max : number = 0;
        let y_min : number = 0;
        let y_max : number = 0;
        let nodeFound : boolean = false;
        for (const node of this.net.nodes) {
            if (node) {
                x_min = node.x;
                x_max = node.x;
                y_min = node.y;
                y_max = node.y;
                nodeFound = true;
                break;
            };
        };
        if (nodeFound) {
            for (const node of this.net.nodes) {
                if (node) {
                    if (node.x < x_min) {
                        x_min = node.x;
                    } else if (node.x > x_max) {
                        x_max = node.x;
                    };
                    if (node.y < y_min) {
                        y_min = node.y;
                    } else if (node.y > y_max) {
                        y_max = node.y;
                    };
                };
            };
            let canvas_width : number;
            let canvas_heigth : number;
            if (this.drawingArea) {
                canvas_width = this.drawingArea.nativeElement.clientWidth;
                canvas_heigth = this.drawingArea.nativeElement.clientHeight;
            } else {
                canvas_width = this.graphicsConfigService.canvasWidth;
                canvas_heigth = this.graphicsConfigService.canvasHeight;
            };
            const graph_width : number = (x_max - x_min);
            const graph_height : number = (y_max - y_min);
            const frame_space : number = (Math.max((graph_width * 0.1), (graph_height * 0.1), (this.graphicsConfigService.defaultNodeRadius * 4)));
            const scaling_x : number = ((frame_space + graph_width + frame_space) / (canvas_width));
            const scaling_y : number = ((frame_space + graph_height + frame_space) / (canvas_heigth));
            const scaling_factor : number = (Math.max(scaling_x, scaling_y));
            const box_width : number = (Math.round(canvas_width * scaling_factor));
            const box_height : number = (Math.round(canvas_heigth * scaling_factor));
            const box_x : number = (Math.round(x_min - ((box_width - graph_width) / 2)));
            const box_y : number = (Math.round(y_min - ((box_height - graph_height) / 2)));
            this.updateViewBox(box_x, box_y, box_width, box_height);
        } else {
            this.resetViewBox();
        };
    };

    private resizeNetToFitCanvas(inNet : Net, inCanvasWidth : number, inCanvasHeight : number) : void {
        /* margin around the net */
        const margin = 20;
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        /* calculate bounding box of the net */
        inNet.nodes.forEach(
            (node) => {
                if (node) {
                    minX = Math.min(minX, node.x);
                    minY = Math.min(minY, node.y);
                    maxX = Math.max(maxX, node.x);
                    maxY = Math.max(maxY, node.y);
                };
            }
        );
        const netWidth = maxX - minX;
        const netHeight = maxY - minY;
        /* calculate scaling factors to fit net within canvas */
        const scaleX = (inCanvasWidth - margin * 2) / netWidth;
        const scaleY = (inCanvasHeight - margin * 2) / netHeight;
        /* maintain aspect ratio */
        const scale = Math.min(scaleX, scaleY);
        /* calculate offsets to center the net in the canvas */
        const offsetX = (inCanvasWidth - netWidth * scale) / 2 - minX * scale;
        const offsetY = (inCanvasHeight - netHeight * scale) / 2 - minY * scale;
        /* apply scaling and centering */
        inNet.nodes.forEach(
            (node) => {
                if (node) {
                    node.x = Math.floor(node.x * scale + offsetX);
                    node.y = Math.floor(node.y * scale + offsetY);
                };
            }
        );
    };

    public forceLayout() : void {
        this.renderService.orderLeftRight(this.net);
        for (const transition of this.net.transitions) {
            this.svgService.setSvgTransitionPosition(transition);
            this.svgService.setSvgNodeSymbolPosition(transition);
            this.svgService.setSvgNodeLabelPosition(transition);
            this.svgService.setSvgNodeIdPosition(transition);
            this.svgService.setSvgNodeInfoPosition(transition);
            this.svgService.setSVGTransitionInfoTextP(transition);
        };
        for (const place of this.net.places) {
            this.svgService.setSvgPlacePosition(place);
            this.svgService.setSvgNodeSymbolPosition(place);
            this.svgService.setSvgNodeLabelPosition(place);
            this.svgService.setSvgNodeIdPosition(place);
            this.svgService.setSvgNodeInfoPosition(place);
            this.svgService.setSVGPlaceInfoTextP(place);
        };
        for (const arc of this.net.arcs) {
            if (arc) {
                this.svgService.setSvgArcPosition(arc);
                this.svgService.setSvgArcWeightPosition(arc);
            };
        };
        this.focusViewBox();
    };

    private resetActiveElements() : void {
        if (this._activeArc) {
            this._activeArc.active = false;
            this.svgService.setSvgArcColors(this._activeArc);
            this._activeArc = undefined;
        };
        if (this._activePlace) {
            if (this._activePlace.hoverActive) {
                this._activePlace.hoverCancelled = true;
            };
            this._activePlace.active = false;
            this.svgService.setSvgPlaceColors(this._activePlace);
            this._activePlace = undefined;
        };
        if (this._activeTransition) {
            if (this._activeTransition.hoverActive) {
                this._activeTransition.hoverCancelled = true;
            };
            this._activeTransition.active = false;
            this.svgService.setSvgTransitionColors(this._activeTransition);
            this._activeTransition = undefined;
        };
        if (this._displayedInfo) {
            this._displayedInfo.infoActive = false;
            this.svgService.setSvgNodeInfoVisibility(this._displayedInfo);
            this._displayedInfo = undefined;
        };
        this._infoDisplayed = false;
        this._activeElement = 'none';
    };

    private resetSelectedElements() : void {
        if (this._selectedArc) {
            this._selectedArc = undefined;
        };
        if (this._selectedPlace) {
            this._selectedPlace = undefined;
        };
        if (this._selectedTransition) {
            this._selectedTransition = undefined;
        };
        this._selectionType = 'none';
        this._selectedElement = 'none';
    };

    private resetDraggedElements() : void {
        if (this._draggedPlace) {
            this._draggedPlace = undefined;
        };
        if (this._draggedTransition) {
            this._draggedTransition = undefined;
        };
        this._draggedElement = 'none';
    };
    
};