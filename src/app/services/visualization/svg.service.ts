import {Injectable, OnDestroy} from '@angular/core';

import {Subscription} from 'rxjs';

import {DisplayService} from './display.service'; 
import {PopupService} from '../notifications/popup.service';
import {GraphicsConfigService} from '../config/graphics-config.service';
import {SettingsService} from '../config/settings.service';

import {Arc} from '../../classes/net-representation/arc';
import {Net} from '../../classes/net-representation/net';
import {Node} from '../../classes/net-representation/node';
import {Place} from '../../classes/net-representation/place';
import {Transition} from '../../classes/net-representation/transition';

@Injectable({
    providedIn: 'root'
})
export class SvgService implements OnDestroy {

    /* attributes - references */
    
    private net : Net = new Net();

    private displayMode : ('default' | 'traveled' | 'errors');
    private hideLowMarkings : boolean;
    private hideLowWeights : boolean;
    private showArcWeights : boolean;
    private showNodeInfos : boolean;
    private showPlaceIds : boolean;
    private showPlaceLabels : boolean;
    private showPlaceMarkings : boolean;
    private showTransitionIds : boolean;
    private showTransitionLabels : boolean;
    private showTransitionTags : boolean;

    private viewBox : {
        origin_x : number, 
        origin_y : number, 
        width : number, 
        height : number
    } = {
        origin_x : 0, 
        origin_y : 0, 
        width : this.graphicsConfigService.canvasWidth, 
        height : this.graphicsConfigService.canvasHeight
    };

    /* attributes - own */

    private readonly _netSubscription : Subscription;
    private readonly _settingsSubscription : Subscription;

    private readonly _arrowSVG : SVGElement;
    private readonly _infosSVG : SVGElement;

    private readonly _nodeRadius : number;

    private readonly _logEntryFrame : number;
    private readonly _logEntryHeight : number;

    /* methods - constructor */

    public constructor(
        private readonly displayService : DisplayService,
        private readonly graphicsConfigService : GraphicsConfigService,
        private readonly popupService : PopupService,
        private readonly settingsService: SettingsService,
    ) {
        this._arrowSVG = this.initArrow();
        this._infosSVG = this.initInfos();
        this._nodeRadius = this.graphicsConfigService.defaultNodeRadius;
        this._logEntryFrame = (this.graphicsConfigService.defaultOuterLogStrokeWidth * 3);
        this._logEntryHeight = (2 * (this.graphicsConfigService.defaultInnerLogElementRadius + this._logEntryFrame));
        this.displayMode = this.settingsService.state.displayMode;
        this.hideLowMarkings = this.settingsService.state.hideLowMarkings;
        this.hideLowWeights = this.settingsService.state.hideLowWeights;
        this.showArcWeights = this.settingsService.state.showArcWeights;
        this.showNodeInfos = this.settingsService.state.showNodeInfos;
        this.showPlaceIds = this.settingsService.state.showPlaceIds;
        this.showPlaceLabels = this.settingsService.state.showPlaceLabels;
        this.showPlaceMarkings = this.settingsService.state.showPlaceMarkings;
        this.showTransitionIds = this.settingsService.state.showTransitionIds;
        this.showTransitionLabels = this.settingsService.state.showTransitionLabels;
        this.showTransitionTags = this.settingsService.state.showTransitionTags;
        this._netSubscription = this.displayService.net$.subscribe(
            net => {
                this.net = this.displayService.net;
            }
        );
        this._settingsSubscription = this.settingsService.state$.subscribe(
            (state) => {
                if (this.displayMode !== state.displayMode) {
                    this.displayMode = state.displayMode;
                    this.toggleDispayMode();
                };
                if (this.hideLowMarkings !== state.hideLowMarkings) {
                    this.hideLowMarkings = state.hideLowMarkings;
                    this.togglePlaceMarkings();
                };
                if (this.hideLowWeights !== state.hideLowWeights) {
                    this.hideLowWeights = state.hideLowWeights;
                    this.toggleArcWeights();
                };
                if (this.showArcWeights !== state.showArcWeights) {
                    this.showArcWeights = state.showArcWeights;
                    this.toggleArcWeights();
                };
                if (this.showNodeInfos !== state.showNodeInfos) {
                    this.showNodeInfos = state.showNodeInfos;
                    this.toggleNodeInfos();
                };
                if (this.showPlaceIds !== state.showPlaceIds) {
                    this.showPlaceIds = state.showPlaceIds;
                    this.togglePlaceIds();
                };
                if (this.showPlaceLabels !== state.showPlaceLabels) {
                    this.showPlaceLabels = state.showPlaceLabels;
                    this.togglePlaceLabels();
                };
                if (this.showPlaceMarkings !== state.showPlaceMarkings) {
                    this.showPlaceMarkings = state.showPlaceMarkings;
                    this.togglePlaceMarkings();
                };
                if (this.showTransitionIds !== state.showTransitionIds) {
                    this.showTransitionIds = state.showTransitionIds;
                    this.toggleTransitionIds();
                };
                if (this.showTransitionLabels !== state.showTransitionLabels) {
                    this.showTransitionLabels = state.showTransitionLabels;
                    this.toggleTransitionLabels();
                };
                if (this.showTransitionTags !== state.showTransitionTags) {
                    this.showTransitionTags = state.showTransitionTags;
                    this.toggleTransitionTags();
                };
            }
        );
    };

    /* methods - on destroy */

    ngOnDestroy(): void {
        this._netSubscription.unsubscribe();
        this._settingsSubscription.unsubscribe();
    };

    /* methods - getters */

    public get nodeRadius() : number {
        return this._nodeRadius;
    };

    public get logEntryHeight() : number {
        return this._logEntryHeight;
    };

    public getViewBox() : {
        origin_x : number, 
        origin_y : number, 
        width : number, 
        height : number
    } {
        return this.viewBox;
    };

    /* methods - setters */

    public setViewBox(
        inX : number, 
        inY : number, 
        inW : (number | undefined), 
        inH : (number | undefined)
    ) : void {
        this.viewBox.origin_x = inX;
        this.viewBox.origin_y = inY;
        if (inW) this.viewBox.width = inW;
        if (inH) this.viewBox.height = inH;
    };

    /* methods - other */

    private initArrow() : SVGElement {
        const arrowSVG : SVGElement = this.createSvgElement('svg')
        arrowSVG.setAttribute('customType', 'arrow-svg');
        arrowSVG.setAttribute('id', `arrow-svg`);
        arrowSVG.setAttribute('width', '0');
        arrowSVG.setAttribute('height', '0');
        arrowSVG.setAttribute('x', '0');
        arrowSVG.setAttribute('y', '0');
        const arrowDefs : SVGElement = this.createSvgElement('defs');
        arrowDefs.setAttribute('customType', 'arrow-defs');
        arrowDefs.setAttribute('width', '0');
        arrowDefs.setAttribute('height', '0');
        arrowDefs.setAttribute('x', '0');
        arrowDefs.setAttribute('y', '0');
        arrowSVG.appendChild(arrowDefs);
        const arrowMarkDf : SVGElement = this.createSvgElement('marker');
        arrowMarkDf.setAttribute('id', 'arrow_head_default');
        arrowMarkDf.setAttribute('viewBox', `0 0 ${this.graphicsConfigService.defaultArrowRadius * 2} ${this.graphicsConfigService.defaultArrowRadius * 2}`);
        arrowMarkDf.setAttribute('refX', `${(this.graphicsConfigService.defaultArrowRadius * 2) + Math.floor(this.graphicsConfigService.defaultNodeRadius / 6)}`);
        arrowMarkDf.setAttribute('refY', `${this.graphicsConfigService.defaultArrowRadius}`);
        arrowMarkDf.setAttribute('markerHeight', `${this.graphicsConfigService.defaultArrowRadius * 2}`);
        arrowMarkDf.setAttribute('markerWidth', `${this.graphicsConfigService.defaultArrowRadius * 2}`);
        arrowMarkDf.setAttribute('markerUnits', 'strokeWidth');
        arrowMarkDf.setAttribute('orient', 'auto');
        const arrowPathDf : SVGElement = this.createSvgElement('path');
        arrowPathDf.setAttribute('d', `M 0 0 L ${this.graphicsConfigService.defaultArrowRadius * 2} ${this.graphicsConfigService.defaultArrowRadius} L 0 ${this.graphicsConfigService.defaultArrowRadius * 2} z`);
        arrowPathDf.setAttribute('fill', this.graphicsConfigService.defaultStroke);
        arrowMarkDf.appendChild(arrowPathDf);
        arrowDefs.appendChild(arrowMarkDf);
        const arrowMarkAc : SVGElement = this.createSvgElement('marker');
        arrowMarkAc.setAttribute('id', 'arrow_head_active');
        arrowMarkAc.setAttribute('viewBox', `0 0 ${this.graphicsConfigService.defaultArrowRadius * 2} ${this.graphicsConfigService.defaultArrowRadius * 2}`);
        arrowMarkAc.setAttribute('refX', `${(this.graphicsConfigService.defaultArrowRadius * 2) + Math.floor(this.graphicsConfigService.defaultNodeRadius / 6)}`);
        arrowMarkAc.setAttribute('refY', `${this.graphicsConfigService.defaultArrowRadius}`);
        arrowMarkAc.setAttribute('markerHeight', `${this.graphicsConfigService.defaultArrowRadius * 2}`);
        arrowMarkAc.setAttribute('markerWidth', `${this.graphicsConfigService.defaultArrowRadius * 2}`);
        arrowMarkAc.setAttribute('markerUnits', 'strokeWidth');
        arrowMarkAc.setAttribute('orient', 'auto');
        const arrowPathAc : SVGElement = this.createSvgElement('path');
        arrowPathAc.setAttribute('d', `M 0 0 L ${this.graphicsConfigService.defaultArrowRadius * 2} ${this.graphicsConfigService.defaultArrowRadius} L 0 ${this.graphicsConfigService.defaultArrowRadius * 2} z`);
        arrowPathAc.setAttribute('fill', this.graphicsConfigService.activeStroke);
        arrowMarkAc.appendChild(arrowPathAc);
        arrowDefs.appendChild(arrowMarkAc);
        const arrowMarkMk : SVGElement = this.createSvgElement('marker');
        arrowMarkMk.setAttribute('id', 'arrow_head_marked');
        arrowMarkMk.setAttribute('viewBox', `0 0 ${this.graphicsConfigService.defaultArrowRadius * 2} ${this.graphicsConfigService.defaultArrowRadius * 2}`);
        arrowMarkMk.setAttribute('refX', `${(this.graphicsConfigService.defaultArrowRadius * 2) + Math.floor(this.graphicsConfigService.defaultNodeRadius / 6)}`);
        arrowMarkMk.setAttribute('refY', `${this.graphicsConfigService.defaultArrowRadius}`);
        arrowMarkMk.setAttribute('markerHeight', `${this.graphicsConfigService.defaultArrowRadius * 2}`);
        arrowMarkMk.setAttribute('markerWidth', `${this.graphicsConfigService.defaultArrowRadius * 2}`);
        arrowMarkMk.setAttribute('markerUnits', 'strokeWidth');
        arrowMarkMk.setAttribute('orient', 'auto');
        const arrowPathMk : SVGElement = this.createSvgElement('path');
        arrowPathMk.setAttribute('d', `M 0 0 L ${this.graphicsConfigService.defaultArrowRadius * 2} ${this.graphicsConfigService.defaultArrowRadius} L 0 ${this.graphicsConfigService.defaultArrowRadius * 2} z`);
        arrowPathMk.setAttribute('fill', this.graphicsConfigService.markedStroke);
        arrowMarkMk.appendChild(arrowPathMk);
        arrowDefs.appendChild(arrowMarkMk);
        const arrowMarkLg : SVGElement = this.createSvgElement('marker');
        arrowMarkLg.setAttribute('id', 'arrow_head_seqlog');
        arrowMarkLg.setAttribute('viewBox', `0 0 ${this.graphicsConfigService.defaultArrowRadius * 2} ${this.graphicsConfigService.defaultArrowRadius * 2}`);
        arrowMarkLg.setAttribute('refX', `${(this.graphicsConfigService.defaultArrowRadius * 2) + Math.floor(this.graphicsConfigService.defaultNodeRadius / 6)}`);
        arrowMarkLg.setAttribute('refY', `${this.graphicsConfigService.defaultArrowRadius}`);
        arrowMarkLg.setAttribute('markerHeight', `${this.graphicsConfigService.defaultArrowRadius * 2}`);
        arrowMarkLg.setAttribute('markerWidth', `${this.graphicsConfigService.defaultArrowRadius * 2}`);
        arrowMarkLg.setAttribute('markerUnits', 'strokeWidth');
        arrowMarkLg.setAttribute('orient', 'auto');
        const arrowPathLg : SVGElement = this.createSvgElement('path');
        arrowPathLg.setAttribute('d', `M 0 0 L ${this.graphicsConfigService.defaultArrowRadius * 2} ${this.graphicsConfigService.defaultArrowRadius} L 0 ${this.graphicsConfigService.defaultArrowRadius * 2} z`);
        arrowPathLg.setAttribute('fill', this.graphicsConfigService.seqLogStroke);
        arrowMarkLg.appendChild(arrowPathLg);
        arrowDefs.appendChild(arrowMarkLg);
        const arrowMarkPs : SVGElement = this.createSvgElement('marker');
        arrowMarkPs.setAttribute('id', 'arrow_head_seqpast');
        arrowMarkPs.setAttribute('viewBox', `0 0 ${this.graphicsConfigService.defaultArrowRadius * 2} ${this.graphicsConfigService.defaultArrowRadius * 2}`);
        arrowMarkPs.setAttribute('refX', `${(this.graphicsConfigService.defaultArrowRadius * 2) + Math.floor(this.graphicsConfigService.defaultNodeRadius / 6)}`);
        arrowMarkPs.setAttribute('refY', `${this.graphicsConfigService.defaultArrowRadius}`);
        arrowMarkPs.setAttribute('markerHeight', `${this.graphicsConfigService.defaultArrowRadius * 2}`);
        arrowMarkPs.setAttribute('markerWidth', `${this.graphicsConfigService.defaultArrowRadius * 2}`);
        arrowMarkPs.setAttribute('markerUnits', 'strokeWidth');
        arrowMarkPs.setAttribute('orient', 'auto');
        const arrowPathPs : SVGElement = this.createSvgElement('path');
        arrowPathPs.setAttribute('d', `M 0 0 L ${this.graphicsConfigService.defaultArrowRadius * 2} ${this.graphicsConfigService.defaultArrowRadius} L 0 ${this.graphicsConfigService.defaultArrowRadius * 2} z`);
        arrowPathPs.setAttribute('fill', this.graphicsConfigService.seqPastStroke);
        arrowMarkPs.appendChild(arrowPathPs);
        arrowDefs.appendChild(arrowMarkPs);
        const arrowMarkNx : SVGElement = this.createSvgElement('marker');
        arrowMarkNx.setAttribute('id', 'arrow_head_seqnext');
        arrowMarkNx.setAttribute('viewBox', `0 0 ${this.graphicsConfigService.defaultArrowRadius * 2} ${this.graphicsConfigService.defaultArrowRadius * 2}`);
        arrowMarkNx.setAttribute('refX', `${(this.graphicsConfigService.defaultArrowRadius * 2) + Math.floor(this.graphicsConfigService.defaultNodeRadius / 6)}`);
        arrowMarkNx.setAttribute('refY', `${this.graphicsConfigService.defaultArrowRadius}`);
        arrowMarkNx.setAttribute('markerHeight', `${this.graphicsConfigService.defaultArrowRadius * 2}`);
        arrowMarkNx.setAttribute('markerWidth', `${this.graphicsConfigService.defaultArrowRadius * 2}`);
        arrowMarkNx.setAttribute('markerUnits', 'strokeWidth');
        arrowMarkNx.setAttribute('orient', 'auto');
        const arrowPathNx : SVGElement = this.createSvgElement('path');
        arrowPathNx.setAttribute('d', `M 0 0 L ${this.graphicsConfigService.defaultArrowRadius * 2} ${this.graphicsConfigService.defaultArrowRadius} L 0 ${this.graphicsConfigService.defaultArrowRadius * 2} z`);
        arrowPathNx.setAttribute('fill', this.graphicsConfigService.seqNextStroke);
        arrowMarkNx.appendChild(arrowPathNx);
        arrowDefs.appendChild(arrowMarkNx);
        const arrowMarkUt : SVGElement = this.createSvgElement('marker');
        arrowMarkUt.setAttribute('id', 'arrow_head_untrv');
        arrowMarkUt.setAttribute('viewBox', `0 0 ${this.graphicsConfigService.defaultArrowRadius * 2} ${this.graphicsConfigService.defaultArrowRadius * 2}`);
        arrowMarkUt.setAttribute('refX', `${(this.graphicsConfigService.defaultArrowRadius * 2) + Math.floor(this.graphicsConfigService.defaultNodeRadius / 6)}`);
        arrowMarkUt.setAttribute('refY', `${this.graphicsConfigService.defaultArrowRadius}`);
        arrowMarkUt.setAttribute('markerHeight', `${this.graphicsConfigService.defaultArrowRadius * 2}`);
        arrowMarkUt.setAttribute('markerWidth', `${this.graphicsConfigService.defaultArrowRadius * 2}`);
        arrowMarkUt.setAttribute('markerUnits', 'strokeWidth');
        arrowMarkUt.setAttribute('orient', 'auto');
        const arrowPathUt : SVGElement = this.createSvgElement('path');
        arrowPathUt.setAttribute('d', `M 0 0 L ${this.graphicsConfigService.defaultArrowRadius * 2} ${this.graphicsConfigService.defaultArrowRadius} L 0 ${this.graphicsConfigService.defaultArrowRadius * 2} z`);
        arrowPathUt.setAttribute('fill', this.graphicsConfigService.untrvStroke);
        arrowMarkUt.appendChild(arrowPathUt);
        arrowDefs.appendChild(arrowMarkUt);
        const arrowMarkE0 : SVGElement = this.createSvgElement('marker');
        arrowMarkE0.setAttribute('id', 'arrow_head_errlvl0');
        arrowMarkE0.setAttribute('viewBox', `0 0 ${this.graphicsConfigService.defaultArrowRadius * 2} ${this.graphicsConfigService.defaultArrowRadius * 2}`);
        arrowMarkE0.setAttribute('refX', `${(this.graphicsConfigService.defaultArrowRadius * 2) + Math.floor(this.graphicsConfigService.defaultNodeRadius / 6)}`);
        arrowMarkE0.setAttribute('refY', `${this.graphicsConfigService.defaultArrowRadius}`);
        arrowMarkE0.setAttribute('markerHeight', `${this.graphicsConfigService.defaultArrowRadius * 2}`);
        arrowMarkE0.setAttribute('markerWidth', `${this.graphicsConfigService.defaultArrowRadius * 2}`);
        arrowMarkE0.setAttribute('markerUnits', 'strokeWidth');
        arrowMarkE0.setAttribute('orient', 'auto');
        const arrowPathE0 : SVGElement = this.createSvgElement('path');
        arrowPathE0.setAttribute('d', `M 0 0 L ${this.graphicsConfigService.defaultArrowRadius * 2} ${this.graphicsConfigService.defaultArrowRadius} L 0 ${this.graphicsConfigService.defaultArrowRadius * 2} z`);
        arrowPathE0.setAttribute('fill', this.graphicsConfigService.errLvl0Stroke);
        arrowMarkE0.appendChild(arrowPathE0);
        arrowDefs.appendChild(arrowMarkE0);
        const arrowMarkE1 : SVGElement = this.createSvgElement('marker');
        arrowMarkE1.setAttribute('id', 'arrow_head_errlvl1');
        arrowMarkE1.setAttribute('viewBox', `0 0 ${this.graphicsConfigService.defaultArrowRadius * 2} ${this.graphicsConfigService.defaultArrowRadius * 2}`);
        arrowMarkE1.setAttribute('refX', `${(this.graphicsConfigService.defaultArrowRadius * 2) + Math.floor(this.graphicsConfigService.defaultNodeRadius / 6)}`);
        arrowMarkE1.setAttribute('refY', `${this.graphicsConfigService.defaultArrowRadius}`);
        arrowMarkE1.setAttribute('markerHeight', `${this.graphicsConfigService.defaultArrowRadius * 2}`);
        arrowMarkE1.setAttribute('markerWidth', `${this.graphicsConfigService.defaultArrowRadius * 2}`);
        arrowMarkE1.setAttribute('markerUnits', 'strokeWidth');
        arrowMarkE1.setAttribute('orient', 'auto');
        const arrowPathE1 : SVGElement = this.createSvgElement('path');
        arrowPathE1.setAttribute('d', `M 0 0 L ${this.graphicsConfigService.defaultArrowRadius * 2} ${this.graphicsConfigService.defaultArrowRadius} L 0 ${this.graphicsConfigService.defaultArrowRadius * 2} z`);
        arrowPathE1.setAttribute('fill', this.graphicsConfigService.errLvl1Stroke);
        arrowMarkE1.appendChild(arrowPathE1);
        arrowDefs.appendChild(arrowMarkE1);
        const arrowMarkE2 : SVGElement = this.createSvgElement('marker');
        arrowMarkE2.setAttribute('id', 'arrow_head_errlvl2');
        arrowMarkE2.setAttribute('viewBox', `0 0 ${this.graphicsConfigService.defaultArrowRadius * 2} ${this.graphicsConfigService.defaultArrowRadius * 2}`);
        arrowMarkE2.setAttribute('refX', `${(this.graphicsConfigService.defaultArrowRadius * 2) + Math.floor(this.graphicsConfigService.defaultNodeRadius / 6)}`);
        arrowMarkE2.setAttribute('refY', `${this.graphicsConfigService.defaultArrowRadius}`);
        arrowMarkE2.setAttribute('markerHeight', `${this.graphicsConfigService.defaultArrowRadius * 2}`);
        arrowMarkE2.setAttribute('markerWidth', `${this.graphicsConfigService.defaultArrowRadius * 2}`);
        arrowMarkE2.setAttribute('markerUnits', 'strokeWidth');
        arrowMarkE2.setAttribute('orient', 'auto');
        const arrowPathE2 : SVGElement = this.createSvgElement('path');
        arrowPathE2.setAttribute('d', `M 0 0 L ${this.graphicsConfigService.defaultArrowRadius * 2} ${this.graphicsConfigService.defaultArrowRadius} L 0 ${this.graphicsConfigService.defaultArrowRadius * 2} z`);
        arrowPathE2.setAttribute('fill', this.graphicsConfigService.errLvl2Stroke);
        arrowMarkE2.appendChild(arrowPathE2);
        arrowDefs.appendChild(arrowMarkE2);
        const arrowMarkSi : SVGElement = this.createSvgElement('marker');
        arrowMarkSi.setAttribute('id', 'arrow_head_simlog');
        arrowMarkSi.setAttribute('viewBox', `0 0 ${this.graphicsConfigService.defaultInnerLogArrowRadius * 2} ${this.graphicsConfigService.defaultInnerLogArrowRadius * 2}`);
        arrowMarkSi.setAttribute('refX', `${(this.graphicsConfigService.defaultInnerLogArrowRadius * 2) + Math.floor(this.graphicsConfigService.defaultInnerLogElementRadius / 4.2)}`);
        arrowMarkSi.setAttribute('refY', `${this.graphicsConfigService.defaultInnerLogArrowRadius}`);
        arrowMarkSi.setAttribute('markerHeight', `${this.graphicsConfigService.defaultInnerLogArrowRadius * 2}`);
        arrowMarkSi.setAttribute('markerWidth', `${this.graphicsConfigService.defaultInnerLogArrowRadius * 2}`);
        arrowMarkSi.setAttribute('markerUnits', 'strokeWidth');
        arrowMarkSi.setAttribute('orient', 'auto');
        const arrowPathSi : SVGElement = this.createSvgElement('path');
        arrowPathSi.setAttribute('d', `M 0 0 L ${this.graphicsConfigService.defaultInnerLogArrowRadius * 2} ${this.graphicsConfigService.defaultInnerLogArrowRadius} L 0 ${this.graphicsConfigService.defaultInnerLogArrowRadius * 2} z`);
        arrowPathSi.setAttribute('fill', this.graphicsConfigService.logBoxStroke);
        arrowMarkSi.appendChild(arrowPathSi);
        arrowDefs.appendChild(arrowMarkSi);
        return arrowSVG;
    };

    private initInfos() : SVGElement {
        const infosSVG : SVGElement = this.createSvgElement('svg')
        infosSVG.setAttribute('customType', 'infos-svg');
        infosSVG.setAttribute('id', `infos-svg`);
        infosSVG.setAttribute('width', '0');
        infosSVG.setAttribute('height', '0');
        infosSVG.setAttribute('x', '0');
        infosSVG.setAttribute('y', '0');
        return infosSVG;
    };

    public createSvgStatics() : [
        svgHelpElements : SVGElement[], 
        svgNetElements : SVGElement[], 
        svgDescriptors : SVGElement[], 
        svgInfoBoxes : SVGElement[]
    ] {
        const svgHelpElements : SVGElement[] = [this._arrowSVG, this._infosSVG];
        const svgNetElements : SVGElement[] = [];
        const svgDescriptors : SVGElement[] = [];
        const svgInfoBoxes : SVGElement[] = [];
        for (const arc of this.net.arcs) {
            if (arc) {
                svgNetElements.push(this.createSvgArc(arc));
                svgDescriptors.push(this.createSvgArcWeight(arc));
            };
        };
        for (const node of this.net.nodes) {
            if (node) {
                switch (node.type) {
                    case 'place' : {
                        if (node instanceof Place) {
                            svgNetElements.push(this.createSvgPlace(node));
                            svgNetElements.push(this.createSvgPlaceSymbol(node));
                            svgDescriptors.push(this.createSvgPlaceLabel(node));
                            svgDescriptors.push(this.createSvgPlaceId(node));
                            svgInfoBoxes.push(this.createSvgPlaceInfo(node));
                        } else {
                            this.popupService.error('srv.svg.css.000', 'inconsistent internal data state', 'it is recommended to restart the tool');
                            throw new Error('#srv.svg.css.000: ' + 'creation of node-svgs failed - for node (label : ' + node.label + ', id: ' + node.id + ') node.type is set to \'place\', but the node is not of that type');
                        };
                        break;
                    }
                    case 'transition' : {
                        if (node instanceof Transition) {
                            svgNetElements.push(this.createSvgTransition(node));
                            svgNetElements.push(this.createSvgTransitionSymbol(node));
                            svgDescriptors.push(this.createSvgTransitionLabel(node));
                            svgDescriptors.push(this.createSvgTransitionId(node));
                            svgInfoBoxes.push(this.createSvgTransitionInfo(node));
                        } else {
                            this.popupService.error('srv.svg.css.001', 'inconsistent internal data state', 'it is recommended to restart the tool');
                            throw new Error('#srv.svg.css.001: ' + 'creation of node-svgs failed - for node (label : ' + node.label + ', id: ' + node.id + ') node.type is set to \'transition\', but the node is not of that type');
                        };
                        break;
                    }
                    default : {
                        this.popupService.error('srv.svg.css.002', 'inconsistent internal data state', 'it is recommended to restart the tool');
                        throw new Error('#srv.svg.css.002: ' + 'creation of node-svgs failed - for node (label : ' + node.label + ', id: ' + node.id + ') node.type is neither \'place\' nor \'transition\'');
                    }
                };
            };
        };
        return [svgHelpElements, svgNetElements, svgDescriptors, svgInfoBoxes];
    };

    public createSvgLogEntry(
        inLogEntryId : number, 
        inLogEntry : {
            firedTransition : Transition,
            addedToSequence : (Transition | Place | Arc)[],
            markingValidity : boolean
        }[]
    ) : {
        outer : SVGElement, 
        inner : SVGElement, 
        valid : boolean
    } {
        const id : string = `logEntry_${inLogEntryId}`;
        const frame : number = this._logEntryFrame;
        const radius : number = this.graphicsConfigService.defaultInnerLogElementRadius;
        const strokeI : number = this.graphicsConfigService.defaultInnerLogStrokeWidth;
        const strokeO : number = this.graphicsConfigService.defaultOuterLogStrokeWidth;
        const offsetL : number = (0.3 * radius);
        const offsetM : number = (0.525 * radius);
        const offsetS : number = (0.75 * radius);
        const fillFrame : string = this.graphicsConfigService.logBoxFill;
        const fillNeutral : string = this.graphicsConfigService.neutralFill;
        const fillInvalid : string = this.graphicsConfigService.invalidFill;
        const fillValid : string = this.graphicsConfigService.validFill;
        const strokeDefault : string = this.graphicsConfigService.logBoxStroke;
        const strokeInvalid : string = this.graphicsConfigService.invalidStrokeA;
        const strokeValid : string = this.graphicsConfigService.validStrokeA;
        const svgContainer : SVGElement = this.createSvgElement('svg');
        svgContainer.setAttribute('customType', 'log-element');
        svgContainer.setAttribute('id', id);
        svgContainer.setAttribute('visibility', 'hidden');
        svgContainer.setAttribute('display', 'block');
        const svgFrame : SVGElement = this.createSvgElement('rect');
        svgFrame.setAttribute('customType', 'log-element');
        svgFrame.setAttribute('id', id);
        svgFrame.setAttribute('visibility', 'visible');
        svgFrame.setAttribute('rx', `${frame}`);
        svgFrame.setAttribute('x', `${frame}`);
        svgFrame.setAttribute('y', `${frame}`);
        const cY : number = ((2 * frame) + radius);
        const svgSource : SVGElement = this.createSvgElement('circle');
        svgSource.setAttribute('customType', 'log-element');
        svgSource.setAttribute('id', id);
        svgSource.setAttribute('visibility', 'visible');
        svgSource.setAttribute('r', `${Math.ceil(radius * 0.9)}`);
        svgSource.setAttribute('cx', `${cY}`);
        svgSource.setAttribute('cy', `${cY}`);
        svgSource.setAttribute('stroke-width', `${strokeI}`);
        svgSource.setAttribute('stroke', strokeDefault);
        svgSource.setAttribute('fill', fillValid);
        const vertices : SVGElement[] = [svgSource];
        const edges : SVGElement[] = [];
        const labels : SVGElement[] = [];
        let valid : boolean = true;
        let width : number = ((2 * frame) + (3 * radius));
        for (const step of inLogEntry) {
            const svgEdge1 : SVGElement = this.createSvgElement('line');
            svgEdge1.setAttribute('customType', 'log-element');
            svgEdge1.setAttribute('id', id);
            svgEdge1.setAttribute('visibility', 'visible');
            svgEdge1.setAttribute('x1', `${width - (2 * radius)}`);
            svgEdge1.setAttribute('y1', `${cY}`);
            svgEdge1.setAttribute('x2', `${width + radius}`);
            svgEdge1.setAttribute('y2', `${cY}`);
            svgEdge1.setAttribute('stroke-width', `${strokeI}`);
            svgEdge1.setAttribute('stroke', strokeDefault);
            svgEdge1.setAttribute('marker-end', 'url(#arrow_head_simlog)');
            edges.push(svgEdge1);
            const svgEdge2 : SVGElement = this.createSvgElement('line');
            svgEdge2.setAttribute('customType', 'log-element');
            svgEdge2.setAttribute('id', id);
            svgEdge2.setAttribute('visibility', 'visible');
            svgEdge2.setAttribute('x1', `${width + radius}`);
            svgEdge2.setAttribute('y1', `${cY}`);
            svgEdge2.setAttribute('x2', `${width + (4 * radius)}`);
            svgEdge2.setAttribute('y2', `${cY}`);
            svgEdge2.setAttribute('stroke-width', `${strokeI}`);
            svgEdge2.setAttribute('stroke', strokeDefault);
            svgEdge2.setAttribute('marker-end', 'url(#arrow_head_simlog)');
            edges.push(svgEdge2);
            const svgTransition : SVGElement = this.createSvgElement('rect');
            svgTransition.setAttribute('customType', 'log-element');
            svgTransition.setAttribute('id', id);
            svgTransition.setAttribute('visibility', 'visible');
            svgTransition.setAttribute('rx', `${0}`);
            svgTransition.setAttribute('x', `${width}`);
            svgTransition.setAttribute('y', `${(2 * frame)}`);
            svgTransition.setAttribute('width', `${(2 * radius)}`);
            svgTransition.setAttribute('height', `${(2 * radius)}`);
            svgTransition.setAttribute('stroke-width', `${strokeI}`);
            svgTransition.setAttribute('stroke', strokeDefault);
            svgTransition.setAttribute('fill', fillNeutral);
            vertices.push(svgTransition);
            const svgLabel : SVGElement = this.createSvgElement('text');
            svgLabel.setAttribute('customType', 'log-element');
            svgLabel.setAttribute('id', id);
            svgLabel.setAttribute('visibility', 'visible');
            svgLabel.setAttribute('x', `${width + radius - offsetL}`);
            svgLabel.setAttribute('y', `${(2 * frame) + radius + offsetL}`);
            svgLabel.setAttribute('fill', strokeDefault);
            svgLabel.setAttribute('font-size', `${radius}`);
            svgLabel.textContent = (`${step.firedTransition.short}`);
            if (svgLabel.textContent.length > 1) {
                if (svgLabel.textContent.length > 2) {
                    svgLabel.setAttribute('textLength', '30');
                    svgLabel.setAttribute('lengthAdjust', 'spacingAndGlyphs');
                    svgLabel.setAttribute('x', `${width + radius - offsetS}`);
                } else {
                    svgLabel.removeAttribute('textLength');
                    svgLabel.removeAttribute('lengthAdjust');
                    svgLabel.setAttribute('x', `${width + radius - offsetM}`);
                };
            };
            labels.push(svgLabel);
            const svgState : SVGElement = this.createSvgElement('circle');
            svgState.setAttribute('customType', 'log-element');
            svgState.setAttribute('id', id);
            svgState.setAttribute('visibility', 'visible');
            svgState.setAttribute('r', `${Math.ceil(radius * 0.9)}`);
            svgState.setAttribute('cx', `${width + (4 * radius)}`);
            svgState.setAttribute('cy', `${cY}`);
            svgState.setAttribute('stroke-width', `${strokeI}`);
            svgState.setAttribute('stroke', strokeDefault);
            if (step.markingValidity) {
                svgState.setAttribute('fill', fillValid);
            } else {
                valid = false;
                svgState.setAttribute('fill', fillInvalid);
            };
            vertices.push(svgState);
            width = (width + (6 * radius));
        };
        width = (width - radius);
        svgFrame.setAttribute('width', `${width}`);
        svgFrame.setAttribute('height', `${this._logEntryHeight}`);
        svgFrame.setAttribute('stroke-width', `${strokeO}`);
        svgFrame.setAttribute('stroke-dasharray', `${strokeO},${strokeO}`);
        if (valid) {
            svgFrame.setAttribute('stroke', strokeValid);
        } else {
            svgFrame.setAttribute('stroke', strokeInvalid);
        };
        svgFrame.setAttribute('fill', fillFrame);
        svgContainer.setAttribute('width', `${width + (2 * frame)}`);
        svgContainer.setAttribute('height', `${this._logEntryHeight + (2 * frame)}`);
        svgContainer.appendChild(svgFrame);
        for (const edge of edges) {
            this._arrowSVG.appendChild(edge);
            svgContainer.appendChild(edge);
        };
        for (const vertex of vertices) {
            svgContainer.appendChild(vertex);
        };
        for (const label of labels) {
            svgContainer.appendChild(label);
        };
        return {
            outer : svgContainer, 
            inner : svgFrame, 
            valid : valid
        };
    };

    private createSvgPlace(inPlace : Place) : SVGElement {
        const svg : SVGElement = this.createSvgElement('circle');
        svg.setAttribute('customType', 'place-node');
        svg.setAttribute('id', `place_${inPlace.id}`);
        svg.setAttribute('visibility', 'visible');
        svg.setAttribute('r', `${this.graphicsConfigService.defaultNodeRadius}`);
        svg.setAttribute('stroke-width', `${this.graphicsConfigService.defaultNetStrokeWidth}`);
        inPlace.svgElements.node = svg;
        this.setSvgPlacePosition(inPlace);
        this.setSvgPlaceColors(inPlace);
        return svg;
    };

    private createSvgTransition(inTransition : Transition) : SVGElement {
        const svg : SVGElement = this.createSvgElement('rect');
        svg.setAttribute('customType', 'transition-node');
        svg.setAttribute('id', `transition_${inTransition.id}`);
        svg.setAttribute('visibility', 'visible');
        svg.setAttribute('width', `${(this.graphicsConfigService.defaultNodeRadius * 2) - 1}`);
        svg.setAttribute('height', `${(this.graphicsConfigService.defaultNodeRadius * 2) - 1}`);
        svg.setAttribute('rx', `${0}`);
        svg.setAttribute('stroke-width', `${this.graphicsConfigService.defaultNetStrokeWidth}`);
        inTransition.svgElements.node = svg;
        this.setSvgTransitionPosition(inTransition);
        this.setSvgTransitionColors(inTransition);
        return svg;
    };

    private createSvgPlaceSymbol(inPlace : Place) : SVGElement {
        const svg : SVGElement = this.createSvgElement('svg');
        const symbol : SVGElement = this.createSvgElement('text');
        const background : SVGElement = this.createSvgElement('text');
        svg.setAttribute('customType', 'place-marking');
        svg.setAttribute('id', `${inPlace.type}_${inPlace.id}`);
        symbol.setAttribute('id', `${inPlace.type}_${inPlace.id}`);
        symbol.setAttribute('x', `${this.graphicsConfigService.defaultNodeRadius - this.graphicsConfigService.defaultNodeSymbolOffset}`);
        symbol.setAttribute('y', `${this.graphicsConfigService.defaultNodeRadius + this.graphicsConfigService.defaultNodeSymbolOffset}`);
        symbol.setAttribute('fill', 'Black');
        symbol.setAttribute('font-size', `${this.graphicsConfigService.defaultNodeRadius}`);
        background.setAttribute('id', `${inPlace.type}_${inPlace.id}`);
        background.setAttribute('x', `${this.graphicsConfigService.defaultNodeRadius - this.graphicsConfigService.defaultNodeSymbolOffset}`);
        background.setAttribute('y', `${this.graphicsConfigService.defaultNodeRadius + this.graphicsConfigService.defaultNodeSymbolOffset}`);
        background.setAttribute('fill', 'White');
        background.setAttribute('stroke', 'White');
        background.setAttribute('stroke-width', '3');
        background.setAttribute('font-size', `${this.graphicsConfigService.defaultNodeRadius}`);
        svg.appendChild(background);
        svg.appendChild(symbol);
        inPlace.svgElements.symbol = svg;
        inPlace.svgElements.symbolText = symbol;
        inPlace.svgElements.symbolBackground = background;
        this.setSvgPlaceSymbolVisibility(inPlace);
        this.setSvgNodeSymbolPosition(inPlace);
        this.setSvgPlaceSymbolContent(inPlace);
        return svg;
    };

    private createSvgTransitionSymbol(inTransition : Transition) : SVGElement {
        const svg : SVGElement = this.createSvgElement('svg');
        const symbol : SVGElement = this.createSvgElement('text');
        const background : SVGElement = this.createSvgElement('text');
        svg.setAttribute('customType', 'transition-tag');
        svg.setAttribute('id', `${inTransition.type}_${inTransition.id}`);
        symbol.setAttribute('id', `${inTransition.type}_${inTransition.id}`);
        symbol.setAttribute('x', `${this.graphicsConfigService.defaultNodeRadius - this.graphicsConfigService.defaultNodeSymbolOffset}`);
        symbol.setAttribute('y', `${this.graphicsConfigService.defaultNodeRadius + this.graphicsConfigService.defaultNodeSymbolOffset}`);
        symbol.setAttribute('fill', 'Black');
        symbol.setAttribute('font-size', `${this.graphicsConfigService.defaultNodeRadius}`);
        background.setAttribute('id', `${inTransition.type}_${inTransition.id}`);
        background.setAttribute('x', `${this.graphicsConfigService.defaultNodeRadius - this.graphicsConfigService.defaultNodeSymbolOffset}`);
        background.setAttribute('y', `${this.graphicsConfigService.defaultNodeRadius + this.graphicsConfigService.defaultNodeSymbolOffset}`);
        background.setAttribute('fill', 'White');
        background.setAttribute('stroke', 'White');
        background.setAttribute('stroke-width', '3');
        background.setAttribute('font-size', `${this.graphicsConfigService.defaultNodeRadius}`);
        symbol.textContent = (`${inTransition.short}`);
        background.textContent = (`${inTransition.short}`);
        if (symbol.textContent.length > 1) {
            if (symbol.textContent.length > 2) {
                symbol.setAttribute('textLength', '30');
                background.setAttribute('textLength', '30');
                symbol.setAttribute('lengthAdjust', 'spacingAndGlyphs');
                background.setAttribute('lengthAdjust', 'spacingAndGlyphs');
                symbol.setAttribute('x', `${this.graphicsConfigService.defaultNodeRadius - this.graphicsConfigService.minimalNodeSymbolOffset}`);
                background.setAttribute('x', `${this.graphicsConfigService.defaultNodeRadius - this.graphicsConfigService.minimalNodeSymbolOffset}`);
            } else {
                symbol.removeAttribute('textLength');
                background.removeAttribute('textLength');
                symbol.removeAttribute('lengthAdjust');
                background.removeAttribute('lengthAdjust');
                symbol.setAttribute('x', `${this.graphicsConfigService.defaultNodeRadius - this.graphicsConfigService.reducedNodeSymbolOffset}`);
                background.setAttribute('x', `${this.graphicsConfigService.defaultNodeRadius - this.graphicsConfigService.reducedNodeSymbolOffset}`);
            };
        };
        svg.appendChild(background);
        svg.appendChild(symbol);
        inTransition.svgElements.symbol = svg;
        inTransition.svgElements.symbolText = symbol;
        inTransition.svgElements.symbolBackground = background;
        this.setSvgTransitionSymbolVisibility(inTransition);
        this.setSvgNodeSymbolPosition(inTransition);
        return svg;
    };

    private createSvgPlaceId(inPlace : Place) : SVGElement {
        const svg : SVGElement = this.createSvgElement('text');
        svg.setAttribute('customType', 'place-id');
        svg.setAttribute('fill', 'Black');
        svg.textContent = (`<-- {${inPlace.id}}`);
        inPlace.svgElements.id = svg;
        this.setSvgPlaceIdVisibility(inPlace);
        this.setSvgNodeIdPosition(inPlace);
        return svg;
    };

    private createSvgPlaceLabel(inPlace : Place) : SVGElement {
        const svg : SVGElement = this.createSvgElement('text');
        svg.setAttribute('customType', 'place-label');
        svg.setAttribute('fill', 'Black');
        svg.textContent = (`<-- {${inPlace.label}}`);
        inPlace.svgElements.label = svg;
        this.setSvgPlaceLabelVisibility(inPlace);
        this.setSvgNodeLabelPosition(inPlace);
        return svg;
    };

    private createSvgTransitionId(inTransition : Transition) : SVGElement {
        const svg : SVGElement = this.createSvgElement('text');
        svg.setAttribute('customType', 'transition-label');
        svg.setAttribute('fill', 'Black');
        svg.textContent = (`<-- {${inTransition.id}}`);
        inTransition.svgElements.id = svg;
        this.setSvgTransitionIdVisibility(inTransition);
        this.setSvgNodeIdPosition(inTransition);
        return svg;
    };

    private createSvgTransitionLabel(inTransition : Transition) : SVGElement {
        const svg : SVGElement = this.createSvgElement('text');
        svg.setAttribute('customType', 'transition-label');
        svg.setAttribute('fill', 'Black');
        svg.textContent = (`<-- {${inTransition.label}}`);
        inTransition.svgElements.label = svg;
        this.setSvgTransitionLabelVisibility(inTransition);
        this.setSvgNodeLabelPosition(inTransition);
        return svg;
    };

    private createSvgPlaceInfo(inPlace : Place) : SVGElement {
        const svg : SVGElement = this.createSvgElement('svg');
        svg.setAttribute('customType', 'place-info-panel');
        svg.setAttribute('id', `${inPlace.type}_${inPlace.id}`);
        svg.setAttribute('width', `${this.graphicsConfigService.defaultTextBoxWidth + 20}`);
        svg.setAttribute('height', `${this.graphicsConfigService.defaultTextBoxHeight + 20}`);
        const rect : SVGElement = this.createSvgElement('rect');
        rect.setAttribute('id', `${inPlace.type}_${inPlace.id}`);
        rect.setAttribute('x', `${10}`);
        rect.setAttribute('y', `${10}`);
        rect.setAttribute('width', `${this.graphicsConfigService.defaultTextBoxWidth}`);
        rect.setAttribute('height', `${this.graphicsConfigService.defaultTextBoxHeight}`);
        rect.setAttribute('fill', this.graphicsConfigService.textBoxFill);
        rect.setAttribute('stroke', this.graphicsConfigService.textBoxStroke);
        rect.setAttribute('stroke-width', '2');
        rect.setAttribute('rx', '10');
        svg.appendChild(rect);
        const cont : SVGElement = this.createSvgElement('g');
        cont.setAttribute('id', `${inPlace.type}_${inPlace.id}`);
        cont.setAttribute('x', `${0}`);
        cont.setAttribute('y', `${0}`);
        cont.setAttribute('width', `${this.graphicsConfigService.defaultTextBoxWidth}`);
        cont.setAttribute('height', `${this.graphicsConfigService.defaultTextBoxHeight}`);
        svg.appendChild(cont);
        const text0 : SVGElement = this.createSvgElement('text');
        text0.setAttribute('id', `${inPlace.type}_${inPlace.id}`);
        text0.setAttribute('x', `${20}`);
        text0.setAttribute('y', `${10}`);
        text0.setAttribute('dy', '0.4em');
        text0.setAttribute('fill', this.graphicsConfigService.textBoxFill);
        text0.textContent = ('...');
        cont.appendChild(text0);
        const text1 : SVGElement = this.createSvgElement('text');
        text1.setAttribute('id', `${inPlace.type}_${inPlace.id}`);
        text1.setAttribute('x', `${20}`);
        text1.setAttribute('y', `${10}`);
        text1.setAttribute('dy', '1.1em');
        text1.setAttribute('fill', this.graphicsConfigService.textFill);
        text1.textContent = (`id : ` + `${inPlace.id}`);
        if (text1.textContent.length > this.graphicsConfigService.defaultMaxTextWidth) {
            text1.setAttribute('textLength', `${this.graphicsConfigService.defaultTextBoxWidth - 20}`);
            text1.setAttribute('lengthAdjust', 'spacingAndGlyphs');
        } else {
            text1.removeAttribute('textLength');
            text1.removeAttribute('lengthAdjust');
        };
        cont.appendChild(text1);
        const text2 : SVGElement = this.createSvgElement('text');
        text2.setAttribute('id', `${inPlace.type}_${inPlace.id}`);
        text2.setAttribute('x', `${20}`);
        text2.setAttribute('y', `${10}`);
        text2.setAttribute('dy', '2.1em');
        text2.setAttribute('fill', 'Black');
        text2.textContent = (`label : ` + `'${inPlace.label}'`);
        if (text2.textContent.length > this.graphicsConfigService.defaultMaxTextWidth) {
            text2.setAttribute('textLength', `${this.graphicsConfigService.defaultTextBoxWidth - 20}`);
            text2.setAttribute('lengthAdjust', 'spacingAndGlyphs');
        } else {
            text2.removeAttribute('textLength');
            text2.removeAttribute('lengthAdjust');
        };
        cont.appendChild(text2);
        const text3 : SVGElement = this.createSvgElement('text');
        text3.setAttribute('id', `${inPlace.type}_${inPlace.id}`);
        text3.setAttribute('x', `${20}`);
        text3.setAttribute('y', `${10}`);
        text3.setAttribute('dy', '3.1em');
        text3.setAttribute('fill', this.graphicsConfigService.textFill);
        text3.textContent = (`type : ` + inPlace.type);
        if (text3.textContent.length > this.graphicsConfigService.defaultMaxTextWidth) {
            text3.setAttribute('textLength', `${this.graphicsConfigService.defaultTextBoxWidth - 20}`);
            text3.setAttribute('lengthAdjust', 'spacingAndGlyphs');
        } else {
            text3.removeAttribute('textLength');
            text3.removeAttribute('lengthAdjust');
        };
        cont.appendChild(text3);
        const text4 : SVGElement = this.createSvgElement('text');
        text4.setAttribute('id', `${inPlace.type}_${inPlace.id}`);
        text4.setAttribute('x', `${20}`);
        text4.setAttribute('y', `${10}`);
        text4.setAttribute('dy', '4.1em');
        text4.setAttribute('fill', this.graphicsConfigService.textFill);
        cont.appendChild(text4);
        const text5 : SVGElement = this.createSvgElement('text');
        text5.setAttribute('id', `${inPlace.type}_${inPlace.id}`);
        text5.setAttribute('x', `${20}`);
        text5.setAttribute('y', `${10}`);
        text5.setAttribute('dy', '5.1em');
        text5.setAttribute('fill', this.graphicsConfigService.textFill);
        cont.appendChild(text5);
        this._infosSVG.appendChild(svg);
        inPlace.svgElements.info = svg;
        inPlace.svgElements.infoTextType = text4;
        inPlace.svgElements.infoTextPosition = text5;
        this.setSvgNodeInfoVisibility(inPlace);
        this.setSvgNodeInfoPosition(inPlace);
        this.setSVGPlaceInfoTextM(inPlace);
        this.setSVGPlaceInfoTextP(inPlace);
        return svg;
    };

    private createSvgTransitionInfo(inTransition : Transition) : SVGElement {
        const svg : SVGElement = this.createSvgElement('svg');
        svg.setAttribute('customType', 'place-info-panel');
        svg.setAttribute('id', `${inTransition.type}_${inTransition.id}`);
        svg.setAttribute('width', `${this.graphicsConfigService.defaultTextBoxWidth + 20}`);
        svg.setAttribute('height', `${this.graphicsConfigService.defaultTextBoxHeight + 20}`);
        const rect : SVGElement = this.createSvgElement('rect');
        rect.setAttribute('id', `${inTransition.type}_${inTransition.id}`);
        rect.setAttribute('x', `${10}`);
        rect.setAttribute('y', `${10}`);
        rect.setAttribute('width', `${this.graphicsConfigService.defaultTextBoxWidth}`);
        rect.setAttribute('height', `${this.graphicsConfigService.defaultTextBoxHeight}`);
        rect.setAttribute('fill', this.graphicsConfigService.textBoxFill);
        rect.setAttribute('stroke', this.graphicsConfigService.textBoxStroke);
        rect.setAttribute('stroke-width', '2');
        rect.setAttribute('rx', '10');
        svg.appendChild(rect);
        const cont : SVGElement = this.createSvgElement('g');
        cont.setAttribute('id', `${inTransition.type}_${inTransition.id}`);
        cont.setAttribute('x', `${0}`);
        cont.setAttribute('y', `${0}`);
        cont.setAttribute('width', `${this.graphicsConfigService.defaultTextBoxWidth}`);
        cont.setAttribute('height', `${this.graphicsConfigService.defaultTextBoxHeight}`);
        svg.appendChild(cont);
        const text0 : SVGElement = this.createSvgElement('text');
        text0.setAttribute('id', `${inTransition.type}_${inTransition.id}`);
        text0.setAttribute('x', `${20}`);
        text0.setAttribute('y', `${10}`);
        text0.setAttribute('dy', '0.4em');
        text0.setAttribute('fill', this.graphicsConfigService.textBoxFill);
        text0.textContent = ('...');
        cont.appendChild(text0);
        const text1 : SVGElement = this.createSvgElement('text');
        text1.setAttribute('id', `${inTransition.type}_${inTransition.id}`);
        text1.setAttribute('x', `${20}`);
        text1.setAttribute('y', `${10}`);
        text1.setAttribute('dy', '1.1em');
        text1.setAttribute('fill', this.graphicsConfigService.textFill);
        text1.textContent = (`id : ` + `${inTransition.id}`);
        if (text1.textContent.length > this.graphicsConfigService.defaultMaxTextWidth) {
            text1.setAttribute('textLength', `${this.graphicsConfigService.defaultTextBoxWidth - 20}`);
            text1.setAttribute('lengthAdjust', 'spacingAndGlyphs');
        } else {
            text1.removeAttribute('textLength');
            text1.removeAttribute('lengthAdjust');
        };
        cont.appendChild(text1);
        const text2 : SVGElement = this.createSvgElement('text');
        text2.setAttribute('id', `${inTransition.type}_${inTransition.id}`);
        text2.setAttribute('x', `${20}`);
        text2.setAttribute('y', `${10}`);
        text2.setAttribute('dy', '2.1em');
        text2.setAttribute('fill', 'Black');
        text2.textContent = (`label : ` + `'${inTransition.label}'`);
        if (text2.textContent.length > this.graphicsConfigService.defaultMaxTextWidth) {
            text2.setAttribute('textLength', `${this.graphicsConfigService.defaultTextBoxWidth - 20}`);
            text2.setAttribute('lengthAdjust', 'spacingAndGlyphs');
        } else {
            text2.removeAttribute('textLength');
            text2.removeAttribute('lengthAdjust');
        };
        cont.appendChild(text2);
        const text3 : SVGElement = this.createSvgElement('text');
        text3.setAttribute('id', `${inTransition.type}_${inTransition.id}`);
        text3.setAttribute('x', `${20}`);
        text3.setAttribute('y', `${10}`);
        text3.setAttribute('dy', '3.1em');
        text3.setAttribute('fill', this.graphicsConfigService.textFill);
        text3.textContent = (`type : ` + inTransition.type);
        if (text3.textContent.length > this.graphicsConfigService.defaultMaxTextWidth) {
            text3.setAttribute('textLength', `${this.graphicsConfigService.defaultTextBoxWidth - 20}`);
            text3.setAttribute('lengthAdjust', 'spacingAndGlyphs');
        } else {
            text3.removeAttribute('textLength');
            text3.removeAttribute('lengthAdjust');
        };
        cont.appendChild(text3);
        const text4 : SVGElement = this.createSvgElement('text');
        text4.setAttribute('id', `${inTransition.type}_${inTransition.id}`);
        text4.setAttribute('x', `${20}`);
        text4.setAttribute('y', `${10}`);
        text4.setAttribute('dy', '4.1em');
        text4.setAttribute('fill', this.graphicsConfigService.textFill);
        cont.appendChild(text4);
        const text5 : SVGElement = this.createSvgElement('text');
        text5.setAttribute('id', `${inTransition.type}_${inTransition.id}`);
        text5.setAttribute('x', `${20}`);
        text5.setAttribute('y', `${10}`);
        text5.setAttribute('dy', '5.1em');
        text5.setAttribute('fill', this.graphicsConfigService.textFill);
        cont.appendChild(text5);
        this._infosSVG.appendChild(svg);
        inTransition.svgElements.info = svg;
        inTransition.svgElements.infoTextType = text4;
        inTransition.svgElements.infoTextPosition = text5;
        this.setSvgNodeInfoVisibility(inTransition);
        this.setSvgNodeInfoPosition(inTransition);
        this.setSVGTransitionInfoTextE(inTransition);
        this.setSVGTransitionInfoTextP(inTransition);
        return svg;
    };

    private createSvgArc(inArc : Arc): SVGElement {
        const svg : SVGElement = this.createSvgElement('line');
        svg.setAttribute('customType', 'arc');
        svg.setAttribute('id', `arc_${inArc.id}`);
        svg.setAttribute('visibility', 'visible');
        svg.setAttribute('stroke-width', `${this.graphicsConfigService.defaultNetStrokeWidth}`);
        this._arrowSVG.appendChild(svg);
        inArc.svgElements.arc = svg;
        this.setSvgArcPosition(inArc);
        this.setSvgArcColors(inArc);
        return svg;
    };

    // /* do not remove - alternative implementation (rounded arcs) */
    //
    // private createSvgArc(inArc : Arc): SVGElement {
    //     const svg : SVGElement = this.createSvgElement('path');
    //     svg.setAttribute('customType', 'arc');
    //     svg.setAttribute('id', ('arc_' + inArc.id));
    //     svg.setAttribute('visibility', 'visible');
    //     svg.setAttribute('fill', 'Transparent');
    //     svg.setAttribute('stroke-width', `${this.graphicsConfigService.defaultNetStrokeWidth}`);
    //     let arcVectorX : number = ((inArc.target.x) - (inArc.source.x));
    //     let arcVectorY : number = ((inArc.target.y) - (inArc.source.y));
    //     let halfX : number = ((arcVectorX) / (2));
    //     let halfY : number = ((arcVectorY) / (2));
    //     let controlX : number = ((inArc.source.x) + (halfX) - (halfY));
    //     let controlY : number = ((inArc.source.y) + (halfY) + (halfX));
    //     if (inArc.reverseExists) {
    //         svg.setAttribute('d', `M ${inArc.source.x} ${inArc.source.y} Q ${controlX} ${controlY} ${inArc.target.x} ${inArc.target.y}`);
    //     } else {
    //         svg.setAttribute('d', `M ${inArc.source.x} ${inArc.source.y} ${inArc.target.x} ${inArc.target.y}`);
    //     };
    //     if (inArc.marked) {
    //         svg.setAttribute('stroke', this.graphicsConfigService.markedStroke);
    //         svg.setAttribute('marker-end', 'url(#arrow_head_marked)');
    //     } else {
    //         svg.setAttribute('stroke', this.graphicsConfigService.defaultStroke);
    //         svg.setAttribute('marker-end', 'url(#arrow_head_default)');
    //     };
    //     this._arrowSVG.appendChild(svg);
    //     inArc.svgElements.arc = svg;
    //     return svg;
    // };

    private createSvgArcWeight(inArc : Arc) : SVGElement {
        const svg : SVGElement = this.createSvgElement('text');
        svg.setAttribute('customType', 'arc-weight');
        svg.setAttribute('id', `arc_${inArc.id}`);
        svg.setAttribute('fill', 'Black');
        svg.textContent = (`[${inArc.weight}]`);
        inArc.svgElements.weight = svg;
        this.setSvgArcWeightVisibility(inArc);
        this.setSvgArcWeightPosition(inArc);
        return svg;
    };

    private createSvgElement(inName : string) : SVGElement {
        return (document.createElementNS('http://www.w3.org/2000/svg', inName));
    };

    public setSvgPlacePosition(inPlace : Place) {
        const svg : (SVGElement | undefined) = inPlace.svgElements.node;
        if (svg) {
            svg.setAttribute('cx', `${inPlace.x}`);
            svg.setAttribute('cy', `${inPlace.y}`);
        };
    };
    
    public setSvgPlaceColors(inPlace : Place) : void {
        const svg : (SVGElement | undefined) = inPlace.svgElements.node;
        if (svg) {
            switch (this.displayMode) {
                case 'default' : {
                    if (inPlace.marked) {
                        svg.setAttribute('stroke', this.graphicsConfigService.markedStroke);
                    } else if (inPlace.active) {
                        svg.setAttribute('stroke', this.graphicsConfigService.activeStroke);
                    } else if (inPlace.isSink) {
                        svg.setAttribute('stroke', this.graphicsConfigService.sinkStroke);
                    } else if (inPlace.isSource) {
                        svg.setAttribute('stroke', this.graphicsConfigService.sourceStroke);
                    } else {
                        svg.setAttribute('stroke', this.graphicsConfigService.defaultStroke);
                    };
                    if (inPlace.active) {
                        svg.setAttribute('fill', this.graphicsConfigService.activeFill);
                    } else if (inPlace.isSource) {
                        svg.setAttribute('fill', this.graphicsConfigService.sourceFill);
                    } else if (inPlace.isSink) {
                        svg.setAttribute('fill', this.graphicsConfigService.sinkFill);
                    } else {
                        svg.setAttribute('fill', this.graphicsConfigService.defaultFill);
                    };
                    break;
                }
                case 'traveled' : {
                    if (inPlace.marked) {
                        svg.setAttribute('stroke', this.graphicsConfigService.markedStroke);
                    } else if (inPlace.active) {
                        svg.setAttribute('stroke', this.graphicsConfigService.activeStroke);
                    } else if (inPlace.inSequenceNext) {
                        svg.setAttribute('stroke', this.graphicsConfigService.seqNextStroke);
                    } else if (inPlace.inSequencePast) {
                        svg.setAttribute('stroke', this.graphicsConfigService.seqPastStroke);
                    } else if (inPlace.inSequenceLog) {
                        svg.setAttribute('stroke', this.graphicsConfigService.seqLogStroke);
                    } else {
                        svg.setAttribute('stroke', this.graphicsConfigService.untrvStroke);
                    };
                    if (inPlace.active) {
                        svg.setAttribute('fill', this.graphicsConfigService.activeFill);
                    } else if (inPlace.inSequenceNext) {
                        svg.setAttribute('fill', this.graphicsConfigService.seqNextFill);
                    } else if (inPlace.inSequencePast) {
                        svg.setAttribute('fill', this.graphicsConfigService.seqPastFill);
                    } else if (inPlace.inSequenceLog) {
                        svg.setAttribute('fill', this.graphicsConfigService.seqLogFill);
                    } else {
                        svg.setAttribute('fill', this.graphicsConfigService.untrvFill);
                    };
                    break;
                }
                case 'errors' : {
                    if (inPlace.marked) {
                        svg.setAttribute('stroke', this.graphicsConfigService.markedStroke);
                    } else if (inPlace.active) {
                        svg.setAttribute('stroke', this.graphicsConfigService.activeStroke);
                    } else if (inPlace.errorLevel2) {
                        svg.setAttribute('stroke', this.graphicsConfigService.errLvl2Stroke);
                    } else if (inPlace.errorLevel1) {
                        svg.setAttribute('stroke', this.graphicsConfigService.errLvl1Stroke);
                    } else {
                        svg.setAttribute('stroke', this.graphicsConfigService.errLvl0Stroke);
                    };
                    if (inPlace.active) {
                        svg.setAttribute('fill', this.graphicsConfigService.activeFill);
                    } else if (inPlace.errorLevel2) {
                        svg.setAttribute('fill', this.graphicsConfigService.errLvl2Fill);
                    } else if (inPlace.errorLevel1) {
                        svg.setAttribute('fill', this.graphicsConfigService.errLvl1Fill);
                    } else {
                        svg.setAttribute('fill', this.graphicsConfigService.errLvl0Fill);
                    };
                    break;
                }
            };
        };
    };

    public setSvgPlaceSymbolVisibility(inPlace : Place) : void {
        const svg : (SVGElement | undefined) = inPlace.svgElements.symbol;
        if (svg) {
            if (this.showPlaceMarkings) {
                if ((this.hideLowMarkings) && (inPlace.marking < 1)) {
                    svg.setAttribute('visibility', 'hidden');
                } else {
                    svg.setAttribute('visibility', 'visible');
                };
            } else {
                svg.setAttribute('visibility', 'hidden');
            };
        };
    };

    public setSvgPlaceSymbolContent(inPlace : Place) : void {
        const bg : (SVGElement | undefined) = inPlace.svgElements.symbolBackground;
        const txt : (SVGElement | undefined) = inPlace.svgElements.symbolText;
        if (bg && txt) {
            bg.textContent = (`${inPlace.marking}`);
            txt.textContent = (`${inPlace.marking}`);
            if (txt.textContent.length > 1) {
                if (txt.textContent.length > 2) {
                    bg.setAttribute('textLength', '30');
                    txt.setAttribute('textLength', '30');
                    bg.setAttribute('lengthAdjust', 'spacingAndGlyphs');
                    txt.setAttribute('lengthAdjust', 'spacingAndGlyphs');
                    bg.setAttribute('x', `${this.graphicsConfigService.defaultNodeRadius - this.graphicsConfigService.minimalNodeSymbolOffset}`);
                    txt.setAttribute('x', `${this.graphicsConfigService.defaultNodeRadius - this.graphicsConfigService.minimalNodeSymbolOffset}`);
                } else {
                    bg.removeAttribute('textLength');
                    txt.removeAttribute('textLength');
                    bg.removeAttribute('lengthAdjust');
                    txt.removeAttribute('lengthAdjust');
                    bg.setAttribute('x', `${this.graphicsConfigService.defaultNodeRadius - this.graphicsConfigService.reducedNodeSymbolOffset}`);
                    txt.setAttribute('x', `${this.graphicsConfigService.defaultNodeRadius - this.graphicsConfigService.reducedNodeSymbolOffset}`);
                };
            };
        };
    };

    public setSvgPlaceIdVisibility(inPlace : Place) : void {
        const svg : (SVGElement | undefined) = inPlace.svgElements.id;
        if (svg) {  
            if (this.showPlaceIds) {
                svg.setAttribute('visibility', 'visible');
            } else {
                svg.setAttribute('visibility', 'hidden');
            };
        };
    };

    public setSvgPlaceLabelVisibility(inPlace : Place) : void {
        const svg : (SVGElement | undefined) = inPlace.svgElements.label;
        if (svg) {
            if (this.showPlaceLabels) {
                svg.setAttribute('visibility', 'visible');
            } else {
                svg.setAttribute('visibility', 'hidden');
            };
        };
    };
    
    public setSVGPlaceInfoTextM(inPlace : Place) : void {
        const svg : (SVGElement | undefined) = inPlace.svgElements.infoTextType;
        if (svg) {
            svg.textContent = (`marking : ` + `${inPlace.marking}`);
            if (svg.textContent.length > this.graphicsConfigService.defaultMaxTextWidth) {
                svg.setAttribute('textLength', `${this.graphicsConfigService.defaultTextBoxWidth - 20}`);
                svg.setAttribute('lengthAdjust', 'spacingAndGlyphs');
            } else {
                svg.removeAttribute('textLength');
                svg.removeAttribute('lengthAdjust');
            };
        };
    };

    public setSVGPlaceInfoTextP(inPlace : Place) : void {
        const svg : (SVGElement | undefined) = inPlace.svgElements.infoTextPosition;
        if (svg) {
            svg.textContent = (`coords : ` + `(${inPlace.x}|${inPlace.y})`);
            if (svg.textContent.length > this.graphicsConfigService.defaultMaxTextWidth) {
                svg.setAttribute('textLength', `${this.graphicsConfigService.defaultTextBoxWidth - 20}`);
                svg.setAttribute('lengthAdjust', 'spacingAndGlyphs');
            } else {
                svg.removeAttribute('textLength');
                svg.removeAttribute('lengthAdjust');
            };
        };
    };

    public setSvgTransitionPosition(inTransition : Transition) : void {
        const svg : (SVGElement | undefined) = inTransition.svgElements.node;
        if (svg) {
            svg.setAttribute('x', `${inTransition.x - this.graphicsConfigService.defaultNodeRadius + 1}`);
            svg.setAttribute('y', `${inTransition.y - this.graphicsConfigService.defaultNodeRadius + 1}`);
        };
    };

    public setSvgTransitionColors(inTransition : Transition) : void {
        const svg : (SVGElement | undefined) = inTransition.svgElements.node;
        if (svg) {
            switch (this.displayMode) {
                case 'default' : {
                    if (inTransition.marked) {
                        svg.setAttribute('stroke', this.graphicsConfigService.markedStroke);
                    } else if (inTransition.active) {
                        svg.setAttribute('stroke', this.graphicsConfigService.activeStroke);
                    } else if (inTransition.enabled) {
                        svg.setAttribute('stroke', this.graphicsConfigService.enabledStroke);
                    } else {
                        svg.setAttribute('stroke', this.graphicsConfigService.defaultStroke);
                    };
                    if (inTransition.active) {
                        svg.setAttribute('fill', this.graphicsConfigService.activeFill);
                    } else if (inTransition.enabled) {
                        svg.setAttribute('fill', this.graphicsConfigService.enabledFill);
                    } else {
                        svg.setAttribute('fill', this.graphicsConfigService.defaultFill);
                    };
                    break;
                }
                case 'traveled' : {
                    if (inTransition.marked) {
                        svg.setAttribute('stroke', this.graphicsConfigService.markedStroke);
                    } else if (inTransition.active) {
                        svg.setAttribute('stroke', this.graphicsConfigService.activeStroke);
                    } else if (inTransition.inSequenceNext) {
                        svg.setAttribute('stroke', this.graphicsConfigService.seqNextStroke);
                    } else if (inTransition.inSequencePast) {
                        svg.setAttribute('stroke', this.graphicsConfigService.seqPastStroke);
                    } else if (inTransition.inSequenceLog) {
                        svg.setAttribute('stroke', this.graphicsConfigService.seqLogStroke);
                    } else {
                        svg.setAttribute('stroke', this.graphicsConfigService.untrvStroke);
                    };
                    if (inTransition.active) {
                        svg.setAttribute('fill', this.graphicsConfigService.activeFill);
                    } else if (inTransition.inSequenceNext) {
                        svg.setAttribute('fill', this.graphicsConfigService.seqNextFill);
                    } else if (inTransition.inSequencePast) {
                        svg.setAttribute('fill', this.graphicsConfigService.seqPastFill);
                    } else if (inTransition.inSequenceLog) {
                        svg.setAttribute('fill', this.graphicsConfigService.seqLogFill);
                    } else {
                        svg.setAttribute('fill', this.graphicsConfigService.untrvFill);
                    };
                    break;
                }
                case 'errors' : {
                    if (inTransition.marked) {
                        svg.setAttribute('stroke', this.graphicsConfigService.markedStroke);
                    } else if (inTransition.active) {
                        svg.setAttribute('stroke', this.graphicsConfigService.activeStroke);
                    } else if (inTransition.errorLevel2) {
                        svg.setAttribute('stroke', this.graphicsConfigService.errLvl2Stroke);
                    } else if (inTransition.errorLevel1) {
                        svg.setAttribute('stroke', this.graphicsConfigService.errLvl1Stroke);
                    } else {
                        svg.setAttribute('stroke', this.graphicsConfigService.errLvl0Stroke);
                    };
                    if (inTransition.active) {
                        svg.setAttribute('fill', this.graphicsConfigService.activeFill);
                    } else if (inTransition.errorLevel2) {
                        svg.setAttribute('fill', this.graphicsConfigService.errLvl2Fill);
                    } else if (inTransition.errorLevel1) {
                        svg.setAttribute('fill', this.graphicsConfigService.errLvl1Fill);
                    } else {
                        svg.setAttribute('fill', this.graphicsConfigService.errLvl0Fill);
                    };
                    break;
                }
            };
        };
    };

    public setSvgTransitionSymbolVisibility(inTransition : Transition) : void {
        const svg : (SVGElement | undefined) = inTransition.svgElements.symbol;
        if (svg) {
            if (this.showTransitionTags) {
                svg.setAttribute('visibility', 'visible');
            } else {
                svg.setAttribute('visibility', 'hidden');
            };
        };
    };

    public setSVGTransitionInfoTextE(inTransition : Transition) : void {
        const svg : (SVGElement | undefined) = inTransition.svgElements.infoTextType;
        if (svg) {
            svg.textContent = (`enabled : ` + `${inTransition.enabled}`);
            if (svg.textContent.length > this.graphicsConfigService.defaultMaxTextWidth) {
                svg.setAttribute('textLength', `${this.graphicsConfigService.defaultTextBoxWidth - 20}`);
                svg.setAttribute('lengthAdjust', 'spacingAndGlyphs');
            } else {
                svg.removeAttribute('textLength');
                svg.removeAttribute('lengthAdjust');
            };
        };
    };

    public setSVGTransitionInfoTextP(inTransition : Transition) : void {
        const svg : (SVGElement | undefined) = inTransition.svgElements.infoTextPosition;
        if (svg) {
            svg.textContent = (`coords : ` + `(${inTransition.x}|${inTransition.y})`);
            if (svg.textContent.length > this.graphicsConfigService.defaultMaxTextWidth) {
                svg.setAttribute('textLength', `${this.graphicsConfigService.defaultTextBoxWidth - 20}`);
                svg.setAttribute('lengthAdjust', 'spacingAndGlyphs');
            } else {
                svg.removeAttribute('textLength');
                svg.removeAttribute('lengthAdjust');
            };
        };
    };

    public setSvgTransitionIdVisibility(inTransition : Transition) : void {
        const svg : (SVGElement | undefined) = inTransition.svgElements.id;
        if (svg) {  
            if (this.showTransitionIds) {
                svg.setAttribute('visibility', 'visible');
            } else {
                svg.setAttribute('visibility', 'hidden');
            };
        };
    };

    public setSvgTransitionLabelVisibility(inTransition : Transition) : void {
        const svg : (SVGElement | undefined) = inTransition.svgElements.label;
        if (svg) {
            if (this.showTransitionLabels) {
                svg.setAttribute('visibility', 'visible');
            } else {
                svg.setAttribute('visibility', 'hidden');
            };
        };
    };

    public setSvgNodeIdPosition(inNode : Node) : void {
        const svg : (SVGElement | undefined) = inNode.svgElements.id;
        if (svg) {
            svg.setAttribute('x', `${Math.floor(inNode.x + (this.graphicsConfigService.defaultNodeRadius * 3 / 2))}`);
            svg.setAttribute('y', `${Math.floor(inNode.y)}`);
        };
    };

    public setSvgNodeLabelPosition(inNode : Node) : void {
        const svg : (SVGElement | undefined) = inNode.svgElements.label;
        if (svg) {
            svg.setAttribute('x', `${Math.floor(inNode.x + (this.graphicsConfigService.defaultNodeRadius * 3 / 2))}`);
            svg.setAttribute('y', `${Math.floor(inNode.y)}`);
        };
    };

    public setSvgNodeSymbolPosition(inNode : Node) : void {
        const svg : (SVGElement | undefined) = inNode.svgElements.symbol;
        if (svg) {
            svg.setAttribute('x', `${inNode.x - this.graphicsConfigService.defaultNodeRadius}`);
            svg.setAttribute('y', `${inNode.y - this.graphicsConfigService.defaultNodeRadius}`);
        };
    };

    public setSvgNodeInfoVisibility(inNode : Node) : void {
        const svg : (SVGElement | undefined) = inNode.svgElements.info;
        if (svg) {  
            if ((this.showNodeInfos) || (inNode.infoActive) || (inNode.infoOverride)) {
                svg.setAttribute('visibility', 'visible');
            } else {
                svg.setAttribute('visibility', 'hidden');
            };
        };
    };

    public setSvgNodeInfoPosition(inNode : Node) : void {
        const svg : (SVGElement | undefined) = inNode.svgElements.info;
        if (svg) {
            let x : number;
            let y : number;
            const canvasMidX = (this.viewBox.origin_x + (this.viewBox.width / 2));
            const canvasMidY = (this.viewBox.origin_y + (this.viewBox.height / 2));
            if (inNode.x < Math.ceil(canvasMidX)) {
                if (inNode.y < Math.ceil(canvasMidY)) {
                    x = inNode.x + (this.graphicsConfigService.defaultNodeRadius + 3);
                    y = inNode.y + (this.graphicsConfigService.defaultNodeRadius + 3);
                } else {
                    x = inNode.x + (this.graphicsConfigService.defaultNodeRadius + 3);
                    y = inNode.y - (this.graphicsConfigService.defaultNodeRadius + 3 + this.graphicsConfigService.defaultTextBoxHeight);
                };
            } else {
                if (inNode.y < Math.ceil(canvasMidY)) {
                    x = inNode.x - (this.graphicsConfigService.defaultNodeRadius + 3 + this.graphicsConfigService.defaultTextBoxWidth);
                    y = inNode.y + (this.graphicsConfigService.defaultNodeRadius + 3);
                } else {
                    x = inNode.x - (this.graphicsConfigService.defaultNodeRadius + 3 + this.graphicsConfigService.defaultTextBoxWidth);
                    y = inNode.y - (this.graphicsConfigService.defaultNodeRadius + 3 + this.graphicsConfigService.defaultTextBoxHeight);
                };
            };
            svg.setAttribute('x', `${x - 10}`);
            svg.setAttribute('y', `${y - 10}`);
        };
    };

    public setSvgArcPosition(inArc : Arc) : void {
        const svg : (SVGElement | undefined) = inArc.svgElements.arc;
        if (svg) {
            const arcVectorX : number = ((inArc.target.x) - (inArc.source.x));
            const arcVectorY : number = ((inArc.target.y) - (inArc.source.y));
            const arcVectorLength : number = (Math.sqrt((arcVectorX * arcVectorX) + (arcVectorY * arcVectorY)));
            let offVectorLength : number;
            if (arcVectorLength !== 0) {
                offVectorLength = ((this.graphicsConfigService.defaultNodeRadius / 4) / arcVectorLength);
            } else {
                offVectorLength = 0;
            };
            const offsetX : number = (Math.floor(offVectorLength * arcVectorY));
            const offsetY : number = (Math.floor(offVectorLength * arcVectorX * (-1)));
            if (inArc.reverseExists) {
                svg.setAttribute('x1', `${(inArc.source.x + offsetX)}`);
                svg.setAttribute('y1', `${(inArc.source.y + offsetY)}`);
                svg.setAttribute('x2', `${(inArc.target.x + offsetX)}`);
                svg.setAttribute('y2', `${(inArc.target.y + offsetY)}`);
            } else {
                svg.setAttribute('x1', `${inArc.source.x}`);
                svg.setAttribute('y1', `${inArc.source.y}`);
                svg.setAttribute('x2', `${inArc.target.x}`);
                svg.setAttribute('y2', `${inArc.target.y}`);
            };
        };
    };
    
    public setSvgArcColors(inArc : Arc) : void {
        const svg : (SVGElement | undefined) = inArc.svgElements.arc;
        if (svg) {
            switch (this.displayMode) {
                case 'default' : {
                    if ((inArc.active) && (!(inArc.overrideHover))) {
                        svg.setAttribute('stroke', this.graphicsConfigService.activeStroke);
                        svg.setAttribute('marker-end', 'url(#arrow_head_active)');
                    } else if (inArc.marked) {
                        svg.setAttribute('stroke', this.graphicsConfigService.markedStroke);
                        svg.setAttribute('marker-end', 'url(#arrow_head_marked)');
                    } else {
                        svg.setAttribute('stroke', this.graphicsConfigService.defaultStroke);
                        svg.setAttribute('marker-end', 'url(#arrow_head_default)');
                    };
                    break;
                }
                case 'traveled' : {
                    if ((inArc.active) && (!(inArc.overrideHover))) {
                        svg.setAttribute('stroke', this.graphicsConfigService.activeStroke);
                        svg.setAttribute('marker-end', 'url(#arrow_head_active)');
                    } else if (inArc.marked) {
                        svg.setAttribute('stroke', this.graphicsConfigService.markedStroke);
                        svg.setAttribute('marker-end', 'url(#arrow_head_marked)');
                    } else if (inArc.inSequenceNext) {
                        svg.setAttribute('stroke', this.graphicsConfigService.seqNextStroke);
                        svg.setAttribute('marker-end', 'url(#arrow_head_seqnext)');
                    } else if (inArc.inSequencePast) {
                        svg.setAttribute('stroke', this.graphicsConfigService.seqPastStroke);
                        svg.setAttribute('marker-end', 'url(#arrow_head_seqpast)');
                    } else if (inArc.inSequenceLog) {
                        svg.setAttribute('stroke', this.graphicsConfigService.seqLogStroke);
                        svg.setAttribute('marker-end', 'url(#arrow_head_seqlog)');
                    } else {
                        svg.setAttribute('stroke', this.graphicsConfigService.untrvStroke);
                        svg.setAttribute('marker-end', 'url(#arrow_head_untrv)');
                    };
                    break;
                }
                case 'errors' : {
                    if ((inArc.active) && (!(inArc.overrideHover))) {
                        svg.setAttribute('stroke', this.graphicsConfigService.activeStroke);
                        svg.setAttribute('marker-end', 'url(#arrow_head_active)');
                    } else if (inArc.marked) {
                        svg.setAttribute('stroke', this.graphicsConfigService.markedStroke);
                        svg.setAttribute('marker-end', 'url(#arrow_head_marked)');
                    } else if (inArc.errorLevel2) {
                        svg.setAttribute('stroke', this.graphicsConfigService.errLvl2Stroke);
                        svg.setAttribute('marker-end', 'url(#arrow_head_errlvl2)');
                    } else if (inArc.errorLevel1) {
                        svg.setAttribute('stroke', this.graphicsConfigService.errLvl1Stroke);
                        svg.setAttribute('marker-end', 'url(#arrow_head_errlvl1)');
                    } else {
                        svg.setAttribute('stroke', this.graphicsConfigService.errLvl0Stroke);
                        svg.setAttribute('marker-end', 'url(#arrow_head_errlvl0)');
                    };
                    break;
                }
            };
        };
    };

    public setSvgArcWeightVisibility(inArc : Arc) : void {
        const svg : (SVGElement | undefined) = inArc.svgElements.weight;
        if (svg) {
            if (this.showArcWeights) {
                if ((this.hideLowWeights) && (inArc.weight < 2)) {
                    svg.setAttribute('visibility', 'hidden');
                } else {
                    svg.setAttribute('visibility', 'visible');
                };
            } else {
                svg.setAttribute('visibility', 'hidden');
            };
        };
    };

    public setSvgArcWeightPosition(inArc : Arc) : void {
        const svg : (SVGElement | undefined) = inArc.svgElements.weight;
        if (svg && svg.textContent) {
            let x : number;
            let y : number;
            const arcVectorX : number = ((inArc.target.x) - (inArc.source.x));
            const arcVectorY : number = ((inArc.target.y) - (inArc.source.y));
            const halfVectorX : number = ((arcVectorX) / (2));
            const halfVectorY : number = ((arcVectorY) / (2));
            const arcVectorLength : number = (Math.sqrt((arcVectorX * arcVectorX) + (arcVectorY * arcVectorY)));
            let offVectorLength : number;
            if (arcVectorLength !== 0) {
                offVectorLength = ((this.graphicsConfigService.defaultNodeRadius) / arcVectorLength);
            } else {
                offVectorLength = 0;
            };
            let offsetX : number = (Math.floor(offVectorLength * arcVectorY));
            let offsetY : number = (Math.floor(offVectorLength * arcVectorX * (-1)));
            if (arcVectorY < 0) {
                offsetX = (offsetX + (offsetX * (svg.textContent.length / 2)));
                offsetY = (offsetY + Math.min(((-arcVectorY)), (8)));
            };
            x = (Math.floor((inArc.source.x) + (halfVectorX) + (offsetX)));
            y = (Math.floor((inArc.source.y) + (halfVectorY) + (offsetY) + 5));
            svg.setAttribute('x', `${x}`);
            svg.setAttribute('y', `${y}`);
        };
    };

    private toggleDispayMode() : void {
        for (const place of this.net.places) {
            this.setSvgPlaceColors(place);
        };
        for (const transition of this.net.transitions) {
            this.setSvgTransitionColors(transition);
        };
        for (const arc of this.net.arcs) {
            if (arc) { 
                this.setSvgArcColors(arc);
            };
        };
    };

    private togglePlaceIds() : void {
        for (const place of this.net.places) {
            if (place) {
                this.setSvgPlaceIdVisibility(place);
            };
        };
    };

    private togglePlaceLabels() : void {
        for (const place of this.net.places) {
            if (place) {
                this.setSvgPlaceLabelVisibility(place);
            };
        };
    };

    private togglePlaceMarkings() : void {
        for (const place of this.net.places) {
            if (place) {
                this.setSvgPlaceSymbolVisibility(place);
            };
        };
    };

    private toggleTransitionIds() : void {
        for (const transition of this.net.transitions) {
            if (transition) {
                this.setSvgTransitionIdVisibility(transition);
            };
        };
    };

    private toggleTransitionLabels() : void {
        for (const transition of this.net.transitions) {
            if (transition) {
                this.setSvgTransitionLabelVisibility(transition);
            };
        };
    };

    private toggleTransitionTags() : void {
        for (const transition of this.net.transitions) {
            if (transition) {
                this.setSvgTransitionSymbolVisibility(transition);
            };
        };
    };

    private toggleNodeInfos() : void {
        for (const node of this.net.nodes) {
            if (node) {
                this.setSvgNodeInfoVisibility(node);
            };
        };
    };

    private toggleArcWeights() : void {
        for (const arc of this.net.arcs) {
            if (arc) {
                this.setSvgArcWeightVisibility(arc);
            };
        };
    };

    public updateTransitionPosition(
        inTransition : Transition,
        inX : number,
        inY : number
    ) {
        inTransition.x = inX;
        inTransition.y = inY;
        this.setSvgTransitionPosition(inTransition);
        this.setSvgNodeSymbolPosition(inTransition);
        this.setSvgNodeLabelPosition(inTransition);
        this.setSvgNodeIdPosition(inTransition);
        this.setSvgNodeInfoPosition(inTransition);
        this.setSVGTransitionInfoTextP(inTransition);
    };

    public updatePlacePosition(
        inPlace : Place,
        inX : number,
        inY : number
    ) {
        inPlace.x = inX;
        inPlace.y = inY;
        this.setSvgPlacePosition(inPlace);
        this.setSvgNodeSymbolPosition(inPlace);
        this.setSvgNodeLabelPosition(inPlace);
        this.setSvgNodeIdPosition(inPlace);
        this.setSvgNodeInfoPosition(inPlace);
        this.setSVGPlaceInfoTextP(inPlace);
    };

    public updateArcPosition(
        inArc : Arc
    ) {
        this.setSvgArcPosition(inArc);
        this.setSvgArcWeightPosition(inArc);
    };

    public setElementMarkedFlag(
        inElement : (Transition | Place | Arc),
        inValue : boolean, 
        inArg? : ('no-update')
    ) : void {
        if (inValue !== inElement.marked) {
            if (inElement instanceof Transition) {
                if (inValue) {
                    this.net.markedTransitions.push(inElement);
                    inElement.marked = true;
                    if (inArg !== 'no-update') {
                        this.setSvgTransitionColors(inElement);
                    };
                } else {
                    let trsId : number = 0;
                    let foundElement : boolean = false;
                    for (const transition of this.net.markedTransitions) {
                        if (transition !== inElement) {
                            trsId++;
                        } else {
                            foundElement = true;
                            this.net.markedTransitions.splice(trsId, 1);
                            inElement.marked = false;
                            if (inArg !== 'no-update') {
                                this.setSvgTransitionColors(inElement);
                            };
                        };
                    };
                    if (!foundElement) {
                        this.popupService.error('srv.dsp.smk.000', 'inconsistent internal data state', 'it is recommended to restart the tool');
                        throw new Error('#srv.dsp.smk.000: ' + 'reset of transition flag failed - given transition (id: ' + inElement.id + ') is flagged as marked, but could not be found within the marked transitions array');
                    };
                };
            } else if (inElement instanceof Place) {
                if (inValue) {
                    this.net.markedPlaces.push(inElement);
                    inElement.marked = true;
                    if (inArg !== 'no-update') {
                        this.setSvgPlaceColors(inElement);
                    };
                } else {
                    let plcId : number = 0;
                    let foundElement : boolean = false;
                    for (const place of this.net.markedPlaces) {
                        if (place !== inElement) {
                            plcId++;
                        } else {
                            foundElement = true;
                            this.net.markedPlaces.splice(plcId, 1);
                            inElement.marked = false;
                            if (inArg !== 'no-update') {
                                this.setSvgPlaceColors(inElement);
                            };
                        };
                    };
                    if (!foundElement) {
                        this.popupService.error('srv.dsp.smk.001', 'inconsistent internal data state', 'it is recommended to restart the tool');
                        throw new Error('#srv.dsp.smk.001: ' + 'reset of place flag failed - given place (id: ' + inElement.id + ') is flagged as marked, but could not be found within the marked places array');
                    };
                };
            } else {
                if (inValue) {
                    this.net.markedArcs.push(inElement);
                    inElement.marked = true;
                    if (inArg !== 'no-update') {
                        this.setSvgArcColors(inElement);
                    };
                } else {
                    let arcId : number = 0;
                    let foundElement : boolean = false;
                    for (const arc of this.net.markedArcs) {
                        if (arc !== inElement) {
                            arcId++;
                        } else {
                            foundElement = true;
                            this.net.markedArcs.splice(arcId, 1);
                            inElement.marked = false;
                            if (inArg !== 'no-update') {
                                this.setSvgArcColors(inElement);
                            };
                        };
                    };
                    if (!foundElement) {
                        this.popupService.error('srv.dsp.smk.002', 'inconsistent internal data state', 'it is recommended to restart the tool');
                        throw new Error('#srv.dsp.smk.002: ' + 'reset of arc flag failed - given arc (id: ' + inElement.id + ') is flagged as marked, but could not be found within the marked arcs array');
                    };
                };
            };
        };
    };

    public setElementSeqLogFlag(
        inElement : (Transition | Place | Arc),
        inValue : boolean, 
        inArg? : ('no-update')
    ) : void {
        if (inValue !== inElement.inSequenceLog) {
            if (inElement instanceof Transition) {
                if (inValue) {
                    this.net.seqLogTransitions.push(inElement);
                    inElement.inSequenceLog = true;
                    if (inArg !== 'no-update') {
                        this.setSvgTransitionColors(inElement);
                    };
                } else {
                    let trsId : number = 0;
                    let foundElement : boolean = false;
                    for (const transition of this.net.seqLogTransitions) {
                        if (transition !== inElement) {
                            trsId++;
                        } else {
                            foundElement = true;
                            this.net.seqLogTransitions.splice(trsId, 1);
                            inElement.inSequenceLog = false;
                            if (inArg !== 'no-update') {
                                this.setSvgTransitionColors(inElement);
                            };
                        };
                    };
                    if (!foundElement) {
                        this.popupService.error('srv.dsp.ssl.000', 'inconsistent internal data state', 'it is recommended to restart the tool');
                        throw new Error('#srv.dsp.ssl.000: ' + 'reset of transition flag failed - given transition (id: ' + inElement.id + ') is flagged as part of the sequence log, but could not be found within the seqLog transitions array');
                    };
                };
            } else if (inElement instanceof Place) {
                if (inValue) {
                    this.net.seqLogPlaces.push(inElement);
                    inElement.inSequenceLog = true;
                    if (inArg !== 'no-update') {
                        this.setSvgPlaceColors(inElement);
                    };
                } else {
                    let plcId : number = 0;
                    let foundElement : boolean = false;
                    for (const place of this.net.seqLogPlaces) {
                        if (place !== inElement) {
                            plcId++;
                        } else {
                            foundElement = true;
                            this.net.seqLogPlaces.splice(plcId, 1);
                            inElement.inSequenceLog = false;
                            if (inArg !== 'no-update') {
                                this.setSvgPlaceColors(inElement);
                            };
                        };
                    };
                    if (!foundElement) {
                        this.popupService.error('srv.dsp.ssl.001', 'inconsistent internal data state', 'it is recommended to restart the tool');
                        throw new Error('#srv.dsp.ssl.001: ' + 'reset of place flag failed - given place (id: ' + inElement.id + ') is flagged as part of the sequence log, but could not be found within the seqLog places array');
                    };
                };
            } else {
                if (inValue) {
                    this.net.seqLogArcs.push(inElement);
                    inElement.inSequenceLog = true;
                    if (inArg !== 'no-update') {
                        this.setSvgArcColors(inElement);
                    };
                } else {
                    let arcId : number = 0;
                    let foundElement : boolean = false;
                    for (const arc of this.net.seqLogArcs) {
                        if (arc !== inElement) {
                            arcId++;
                        } else {
                            foundElement = true;
                            this.net.seqLogArcs.splice(arcId, 1);
                            inElement.inSequenceLog = false;
                            if (inArg !== 'no-update') {
                                this.setSvgArcColors(inElement);
                            };
                        };
                    };
                    if (!foundElement) {
                        this.popupService.error('srv.dsp.ssl.002', 'inconsistent internal data state', 'it is recommended to restart the tool');
                        throw new Error('#srv.dsp.ssl.002: ' + 'reset of arc flag failed - given arc (id: ' + inElement.id + ') is flagged as part of the sequence log, but could not be found within the seqLog arcs array');
                    };
                };
            };
        };
    };

    public setElementSeqPastFlag(
        inElement : (Transition | Place | Arc),
        inValue : boolean, 
        inArg? : ('no-update')
    ) : void {
        if (inValue !== inElement.inSequencePast) {
            if (inElement instanceof Transition) {
                if (inValue) {
                    this.net.seqPastTransitions.push(inElement);
                    inElement.inSequencePast = true;
                    if (inArg !== 'no-update') {
                        this.setSvgTransitionColors(inElement);
                    };
                } else {
                    let trsId : number = 0;
                    let foundElement : boolean = false;
                    for (const transition of this.net.seqPastTransitions) {
                        if (transition !== inElement) {
                            trsId++;
                        } else {
                            foundElement = true;
                            this.net.seqPastTransitions.splice(trsId, 1);
                            inElement.inSequencePast = false;
                            if (inArg !== 'no-update') {
                                this.setSvgTransitionColors(inElement);
                            };
                        };
                    };
                    if (!foundElement) {
                        this.popupService.error('srv.dsp.ssp.000', 'inconsistent internal data state', 'it is recommended to restart the tool');
                        throw new Error('#srv.dsp.ssp.000: ' + 'reset of transition flag failed - given transition (id: ' + inElement.id + ') is flagged as part of the already visited section of the active sequence, but could not be found within the seqPast transitions array');
                    };
                };
            } else if (inElement instanceof Place) {
                if (inValue) {
                    this.net.seqPastPlaces.push(inElement);
                    inElement.inSequencePast = true;
                    if (inArg !== 'no-update') {
                        this.setSvgPlaceColors(inElement);
                    };
                } else {
                    let plcId : number = 0;
                    let foundElement : boolean = false;
                    for (const place of this.net.seqPastPlaces) {
                        if (place !== inElement) {
                            plcId++;
                        } else {
                            foundElement = true;
                            this.net.seqPastPlaces.splice(plcId, 1);
                            inElement.inSequencePast = false;
                            if (inArg !== 'no-update') {
                                this.setSvgPlaceColors(inElement);
                            };
                        };
                    };
                    if (!foundElement) {
                        this.popupService.error('srv.dsp.ssp.001', 'inconsistent internal data state', 'it is recommended to restart the tool');
                        throw new Error('#srv.dsp.ssp.001: ' + 'reset of place flag failed - given place (id: ' + inElement.id + ') is flagged as part of the already visited section of the active sequence, but could not be found within the seqPast places array');
                    };
                };
            } else {
                if (inValue) {
                    this.net.seqPastArcs.push(inElement);
                    inElement.inSequencePast = true;
                    if (inArg !== 'no-update') {
                        this.setSvgArcColors(inElement);
                    };
                } else {
                    let arcId : number = 0;
                    let foundElement : boolean = false;
                    for (const arc of this.net.seqPastArcs) {
                        if (arc !== inElement) {
                            arcId++;
                        } else {
                            foundElement = true;
                            this.net.seqPastArcs.splice(arcId, 1);
                            inElement.inSequencePast = false;
                            if (inArg !== 'no-update') {
                                this.setSvgArcColors(inElement);
                            };
                        };
                    };
                    if (!foundElement) {
                        this.popupService.error('srv.dsp.ssp.002', 'inconsistent internal data state', 'it is recommended to restart the tool');
                        throw new Error('#srv.dsp.ssp.002: ' + 'reset of arc flag failed - given arc (id: ' + inElement.id + ') is flagged as part of the already visited section of the active sequence, but could not be found within the seqPast arcs array');
                    };
                };
            };
        };
    };

    public setElementSeqNextFlag(
        inElement : (Transition | Place | Arc),
        inValue : boolean, 
        inArg? : ('no-update')
    ) : void {
        if (inValue !== inElement.inSequenceNext) {
            if (inElement instanceof Transition) {
                if (inValue) {
                    this.net.seqNextTransitions.push(inElement);
                    inElement.inSequenceNext = true;
                    if (inArg !== 'no-update') {
                        this.setSvgTransitionColors(inElement);
                    };
                } else {
                    let trsId : number = 0;
                    let foundElement : boolean = false;
                    for (const transition of this.net.seqNextTransitions) {
                        if (transition !== inElement) {
                            trsId++;
                        } else {
                            foundElement = true;
                            this.net.seqNextTransitions.splice(trsId, 1);
                            inElement.inSequenceNext = false;
                            if (inArg !== 'no-update') {
                                this.setSvgTransitionColors(inElement);
                            };
                        };
                    };
                    if (!foundElement) {
                        this.popupService.error('srv.dsp.ssn.000', 'inconsistent internal data state', 'it is recommended to restart the tool');
                        throw new Error('#srv.dsp.ssn.000: ' + 'reset of transition flag failed - given transition (id: ' + inElement.id + ') is flagged as part of the still to be visited section of the active sequence, but could not be found within the seqNext transitions array');
                    };
                };
            } else if (inElement instanceof Place) {
                if (inValue) {
                    this.net.seqNextPlaces.push(inElement);
                    inElement.inSequenceNext = true;
                    if (inArg !== 'no-update') {
                        this.setSvgPlaceColors(inElement);
                    };
                } else {
                    let plcId : number = 0;
                    let foundElement : boolean = false;
                    for (const place of this.net.seqNextPlaces) {
                        if (place !== inElement) {
                            plcId++;
                        } else {
                            foundElement = true;
                            this.net.seqNextPlaces.splice(plcId, 1);
                            inElement.inSequenceNext = false;
                            if (inArg !== 'no-update') {
                                this.setSvgPlaceColors(inElement);
                            };
                        };
                    };
                    if (!foundElement) {
                        this.popupService.error('srv.dsp.ssn.001', 'inconsistent internal data state', 'it is recommended to restart the tool');
                        throw new Error('#srv.dsp.ssn.001: ' + 'reset of place flag failed - given place (id: ' + inElement.id + ') is flagged as part of the still to be visited section of the active sequence, but could not be found within the seqNext places array');
                    };
                };
            } else {
                if (inValue) {
                    this.net.seqNextArcs.push(inElement);
                    inElement.inSequenceNext = true;
                    if (inArg !== 'no-update') {
                        this.setSvgArcColors(inElement);
                    };
                } else {
                    let arcId : number = 0;
                    let foundElement : boolean = false;
                    for (const arc of this.net.seqNextArcs) {
                        if (arc !== inElement) {
                            arcId++;
                        } else {
                            foundElement = true;
                            this.net.seqNextArcs.splice(arcId, 1);
                            inElement.inSequenceNext = false;
                            if (inArg !== 'no-update') {
                                this.setSvgArcColors(inElement);
                            };
                        };
                    };
                    if (!foundElement) {
                        this.popupService.error('srv.dsp.ssn.002', 'inconsistent internal data state', 'it is recommended to restart the tool');
                        throw new Error('#srv.dsp.ssn.002: ' + 'reset of arc flag failed - given arc (id: ' + inElement.id + ') is flagged as part of the still to be visited section of the active sequence, but could not be found within the seqNext arcs array');
                    };
                };
            };
        };
    };

    public setElementErrLvl1Flag(
        inElement : (Transition | Place | Arc),
        inValue : boolean, 
        inArg? : ('no-update')
    ) : void {
        if (inValue !== inElement.errorLevel1) {
            if (inElement instanceof Transition) {
                if (inValue) {
                    this.net.errLvl1Transitions.push(inElement);
                    inElement.errorLevel1 = true;
                    if (inArg !== 'no-update') {
                        this.setSvgTransitionColors(inElement);
                    };
                } else {
                    let trsId : number = 0;
                    let foundElement : boolean = false;
                    for (const transition of this.net.errLvl1Transitions) {
                        if (transition !== inElement) {
                            trsId++;
                        } else {
                            foundElement = true;
                            this.net.errLvl1Transitions.splice(trsId, 1);
                            inElement.errorLevel1 = false;
                            if (inArg !== 'no-update') {
                                this.setSvgTransitionColors(inElement);
                            };
                        };
                    };
                    if (!foundElement) {
                        this.popupService.error('srv.dsp.se1.000', 'inconsistent internal data state', 'it is recommended to restart the tool');
                        throw new Error('#srv.dsp.se1.000: ' + 'reset of transition flag failed - given transition (id: ' + inElement.id + ') is flagged as part of a level 1 error state, but could not be found within the errLvl1 transitions array');
                    };
                };
            } else if (inElement instanceof Place) {
                if (inValue) {
                    this.net.errLvl1Places.push(inElement);
                    inElement.errorLevel1 = true;
                    if (inArg !== 'no-update') {
                        this.setSvgPlaceColors(inElement);
                    };
                } else {
                    let plcId : number = 0;
                    let foundElement : boolean = false;
                    for (const place of this.net.errLvl1Places) {
                        if (place !== inElement) {
                            plcId++;
                        } else {
                            foundElement = true;
                            this.net.errLvl1Places.splice(plcId, 1);
                            inElement.errorLevel1 = false;
                            if (inArg !== 'no-update') {
                                this.setSvgPlaceColors(inElement);
                            };
                        };
                    };
                    if (!foundElement) {
                        this.popupService.error('srv.dsp.se1.001', 'inconsistent internal data state', 'it is recommended to restart the tool');
                        throw new Error('#srv.dsp.se1.001: ' + 'reset of place flag failed - given place (id: ' + inElement.id + ') is flagged as part of a level 1 error state, but could not be found within the errLvl1 places array');
                    };
                };
            } else {
                if (inValue) {
                    this.net.errLvl1Arcs.push(inElement);
                    inElement.errorLevel1 = true;
                    if (inArg !== 'no-update') {
                        this.setSvgArcColors(inElement);
                    };
                } else {
                    let arcId : number = 0;
                    let foundElement : boolean = false;
                    for (const arc of this.net.errLvl1Arcs) {
                        if (arc !== inElement) {
                            arcId++;
                        } else {
                            foundElement = true;
                            this.net.errLvl1Arcs.splice(arcId, 1);
                            inElement.errorLevel1 = false;
                            if (inArg !== 'no-update') {
                                this.setSvgArcColors(inElement);
                            };
                        };
                    };
                    if (!foundElement) {
                        this.popupService.error('srv.dsp.se1.002', 'inconsistent internal data state', 'it is recommended to restart the tool');
                        throw new Error('#srv.dsp.se1.002: ' + 'reset of arc flag failed - given arc (id: ' + inElement.id + ') is flagged as part of a level 1 error state, but could not be found within the errLvl1 arcs array');
                    };
                };
            };
        };
    };

    public setElementErrLvl2Flag(
        inElement : (Transition | Place | Arc),
        inValue : boolean, 
        inArg? : ('no-update')
    ) : void {
        if (inValue !== inElement.errorLevel2) {
            if (inElement instanceof Transition) {
                if (inValue) {
                    this.net.errLvl2Transitions.push(inElement);
                    inElement.errorLevel2 = true;
                    if (inArg !== 'no-update') {
                        this.setSvgTransitionColors(inElement);
                    };
                } else {
                    let trsId : number = 0;
                    let foundElement : boolean = false;
                    for (const transition of this.net.errLvl2Transitions) {
                        if (transition !== inElement) {
                            trsId++;
                        } else {
                            foundElement = true;
                            this.net.errLvl2Transitions.splice(trsId, 1);
                            inElement.errorLevel2 = false;
                            if (inArg !== 'no-update') {
                                this.setSvgTransitionColors(inElement);
                            };
                        };
                    };
                    if (!foundElement) {
                        this.popupService.error('srv.dsp.se2.000', 'inconsistent internal data state', 'it is recommended to restart the tool');
                        throw new Error('#srv.dsp.se2.000: ' + 'reset of transition flag failed - given transition (id: ' + inElement.id + ') is flagged as part of a level 2 error state, but could not be found within the errLvl2 transitions array');
                    };
                };
            } else if (inElement instanceof Place) {
                if (inValue) {
                    this.net.errLvl2Places.push(inElement);
                    inElement.errorLevel2 = true;
                    if (inArg !== 'no-update') {
                        this.setSvgPlaceColors(inElement);
                    };
                } else {
                    let plcId : number = 0;
                    let foundElement : boolean = false;
                    for (const place of this.net.errLvl2Places) {
                        if (place !== inElement) {
                            plcId++;
                        } else {
                            foundElement = true;
                            this.net.errLvl2Places.splice(plcId, 1);
                            inElement.errorLevel2 = false;
                            if (inArg !== 'no-update') {
                                this.setSvgPlaceColors(inElement);
                            };
                        };
                    };
                    if (!foundElement) {
                        this.popupService.error('srv.dsp.se2.001', 'inconsistent internal data state', 'it is recommended to restart the tool');
                        throw new Error('#srv.dsp.se2.001: ' + 'reset of place flag failed - given place (id: ' + inElement.id + ') is flagged as part of a level 2 error state, but could not be found within the errLvl2 places array');
                    };
                };
            } else {
                if (inValue) {
                    this.net.errLvl2Arcs.push(inElement);
                    inElement.errorLevel2 = true;
                    if (inArg !== 'no-update') {
                        this.setSvgArcColors(inElement);
                    };
                } else {
                    let arcId : number = 0;
                    let foundElement : boolean = false;
                    for (const arc of this.net.errLvl2Arcs) {
                        if (arc !== inElement) {
                            arcId++;
                        } else {
                            foundElement = true;
                            this.net.errLvl2Arcs.splice(arcId, 1);
                            inElement.errorLevel2 = false;
                            if (inArg !== 'no-update') {
                                this.setSvgArcColors(inElement);
                            };
                        };
                    };
                    if (!foundElement) {
                        this.popupService.error('srv.dsp.se2.002', 'inconsistent internal data state', 'it is recommended to restart the tool');
                        throw new Error('#srv.dsp.se2.002: ' + 'reset of arc flag failed - given arc (id: ' + inElement.id + ') is flagged as part of a level 2 error state, but could not be found within the errLvl2 arcs array');
                    };
                };
            };
        };
    };

    public resetAllMarkedFlags() : void {
        for (const transition of this.net.markedTransitions) {
            if (transition.marked) {
                transition.marked = false;
                this.setSvgTransitionColors(transition);
            } else {
                this.popupService.error('srv.dsp.rmk.000', 'inconsistent internal data state', 'it is recommended to restart the tool');
                throw new Error('#cls.grp.rmk.000: ' + 'resetting mark flag of all marked elements failed - the marked transitions array contains a transition not flagged as marked (id: ' + transition.id + ')');
            };
        };
        this.net.markedTransitions = [];
        for (const place of this.net.markedPlaces) {
            if (place.marked) {
                place.marked = false;
                this.setSvgPlaceColors(place);
            } else {
                this.popupService.error('srv.dsp.rmk.001', 'inconsistent internal data state', 'it is recommended to restart the tool');
                throw new Error('#cls.grp.rmk.001: ' + 'resetting mark flag of all marked elements failed - the marked places array contains a place not flagged as marked (id: ' + place.id + ')');
            };
        };
        this.net.markedPlaces = [];
        for (const arc of this.net.markedArcs) {
            if (arc.marked) {
                arc.marked = false;
                this.setSvgArcColors(arc);
            } else {
                this.popupService.error('srv.dsp.rmk.002', 'inconsistent internal data state', 'it is recommended to restart the tool');
                throw new Error('#cls.grp.rmk.002: ' + 'resetting mark flag of all marked elements failed - the marked arcs array contains an arc not flagged as marked (id: ' + arc.id + ')');
            };
        };
        this.net.markedArcs = [];
        if (this.settingsService.state.executionMode === 'safe') {
            for (const node of this.net.nodes) {
                if (node) {
                    if (node.marked) {
                        this.popupService.error('srv.dsp.rmk.003', 'inconsistent internal data state', 'it is recommended to restart the tool');
                        throw new Error('#cls.grp.rmk.003: ' + 'resetting mark flag of all marked elements failed - found a marked node that is not part of the marked nodes array (' + node + ')');
                    };
                };
            };
            for (const arc of this.net.arcs) {
                if (arc) {
                    if (arc.marked) {
                        this.popupService.error('srv.dsp.rmk.004', 'inconsistent internal data state', 'it is recommended to restart the tool');
                        throw new Error('#cls.grp.rmk.004: ' + 'resetting mark flag of all marked elements failed - found a marked arc that is not part of the marked arcs array (' + arc + ')');
                    };
                };
            };
        };
    };

    public resetAllSeqLogFlags() : void {
        for (const transition of this.net.seqLogTransitions) {
            if (transition.inSequenceLog) {
                transition.inSequenceLog = false;
                this.setSvgTransitionColors(transition);
            } else {
                this.popupService.error('srv.dsp.rsq.000', 'inconsistent internal data state', 'it is recommended to restart the tool');
                throw new Error('#cls.grp.rsq.000: ' + 'resetting seqLog flag of all seqLog elements failed - the seqLog transitions array contains a transition not flagged as seqLog (id: ' + transition.id + ')');
            };
        };
        this.net.seqLogTransitions = [];
        for (const place of this.net.seqLogPlaces) {
            if (place.inSequenceLog) {
                place.inSequenceLog = false;
                this.setSvgPlaceColors(place);
            } else {
                this.popupService.error('srv.dsp.rsq.001', 'inconsistent internal data state', 'it is recommended to restart the tool');
                throw new Error('#cls.grp.rsq.001: ' + 'resetting seqLog flag of all seqLog elements failed - the seqLog places array contains a place not flagged as seqLog (id: ' + place.id + ')');
            };
        };
        this.net.seqLogPlaces = [];
        for (const arc of this.net.seqLogArcs) {
            if (arc.inSequenceLog) {
                arc.inSequenceLog = false;
                this.setSvgArcColors(arc);
            } else {
                this.popupService.error('srv.dsp.rsq.002', 'inconsistent internal data state', 'it is recommended to restart the tool');
                throw new Error('#cls.grp.rsq.002: ' + 'resetting seqLog flag of all seqLog elements failed - the seqLog arcs array contains an arc not flagged as seqLog (id: ' + arc.id + ')');
            };
        };
        this.net.seqLogArcs = [];
        if (this.settingsService.state.executionMode === 'safe') {
            for (const node of this.net.nodes) {
                if (node) {
                    if (node.inSequenceLog) {
                        this.popupService.error('srv.dsp.rsq.003', 'inconsistent internal data state', 'it is recommended to restart the tool');
                        throw new Error('#cls.grp.rsq.003: ' + 'resetting seqLog flag of all seqLog elements failed - found a seqLog node that is not part of the seqLog nodes array (' + node + ')');
                    };
                };
            };
            for (const arc of this.net.arcs) {
                if (arc) {
                    if (arc.inSequenceLog) {
                        this.popupService.error('srv.dsp.rsq.004', 'inconsistent internal data state', 'it is recommended to restart the tool');
                        throw new Error('#cls.grp.rsq.004: ' + 'resetting seqLog flag of all seqLog elements failed - found a seqLog arc that is not part of the seqLog arcs array (' + arc + ')');
                    };
                };
            };
        };
    };

    public resetAllSeqPastFlags() : void {
        for (const transition of this.net.seqPastTransitions) {
            if (transition.inSequencePast) {
                transition.inSequencePast = false;
                this.setSvgTransitionColors(transition);
            } else {
                this.popupService.error('srv.dsp.rsp.000', 'inconsistent internal data state', 'it is recommended to restart the tool');
                throw new Error('#cls.grp.rsp.000: ' + 'resetting seqPast flag of all seqPast elements failed - the seqPast transitions array contains a transition not flagged as seqPast (id: ' + transition.id + ')');
            };
        };
        this.net.seqPastTransitions = [];
        for (const place of this.net.seqPastPlaces) {
            if (place.inSequencePast) {
                place.inSequencePast = false;
                this.setSvgPlaceColors(place);
            } else {
                this.popupService.error('srv.dsp.rsp.001', 'inconsistent internal data state', 'it is recommended to restart the tool');
                throw new Error('#cls.grp.rsp.001: ' + 'resetting seqPast flag of all seqPast elements failed - the seqPast places array contains a place not flagged as seqPast (id: ' + place.id + ')');
            };
        };
        this.net.seqPastPlaces = [];
        for (const arc of this.net.seqPastArcs) {
            if (arc.inSequencePast) {
                arc.inSequencePast = false;
                this.setSvgArcColors(arc);
            } else {
                this.popupService.error('srv.dsp.rsp.002', 'inconsistent internal data state', 'it is recommended to restart the tool');
                throw new Error('#cls.grp.rsp.002: ' + 'resetting seqPast flag of all seqPast elements failed - the seqPast arcs array contains an arc not flagged as seqPast (id: ' + arc.id + ')');
            };
        };
        this.net.seqPastArcs = [];
        if (this.settingsService.state.executionMode === 'safe') {
            for (const node of this.net.nodes) {
                if (node) {
                    if (node.inSequencePast) {
                        this.popupService.error('srv.dsp.rsp.003', 'inconsistent internal data state', 'it is recommended to restart the tool');
                        throw new Error('#cls.grp.rsp.003: ' + 'resetting seqPast flag of all seqPast elements failed - found a seqPast node that is not part of the seqPast nodes array (' + node + ')');
                    };
                };
            };
            for (const arc of this.net.arcs) {
                if (arc) {
                    if (arc.inSequencePast) {
                        this.popupService.error('srv.dsp.rsp.004', 'inconsistent internal data state', 'it is recommended to restart the tool');
                        throw new Error('#cls.grp.rsp.004: ' + 'resetting seqPast flag of all seqPast elements failed - found a seqPast arc that is not part of the seqPast arcs array (' + arc + ')');
                    };
                };
            };
        };
    };

    public resetAllSeqNextFlags() : void {
        for (const transition of this.net.seqNextTransitions) {
            if (transition.inSequenceNext) {
                transition.inSequenceNext = false;
                this.setSvgTransitionColors(transition);
            } else {
                this.popupService.error('srv.dsp.rsn.000', 'inconsistent internal data state', 'it is recommended to restart the tool');
                throw new Error('#cls.grp.rsn.000: ' + 'resetting seqNext flag of all seqNext elements failed - the seqNext transitions array contains a transition not flagged as seqNext (id: ' + transition.id + ')');
            };
        };
        this.net.seqNextTransitions = [];
        for (const place of this.net.seqNextPlaces) {
            if (place.inSequenceNext) {
                place.inSequenceNext = false;
                this.setSvgPlaceColors(place);
            } else {
                this.popupService.error('srv.dsp.rsn.001', 'inconsistent internal data state', 'it is recommended to restart the tool');
                throw new Error('#cls.grp.rsn.001: ' + 'resetting seqNext flag of all seqNext elements failed - the seqNext places array contains a place not flagged as seqNext (id: ' + place.id + ')');
            };
        };
        this.net.seqNextPlaces = [];
        for (const arc of this.net.seqNextArcs) {
            if (arc.inSequenceNext) {
                arc.inSequenceNext = false;
                this.setSvgArcColors(arc);
            } else {
                this.popupService.error('srv.dsp.rsn.002', 'inconsistent internal data state', 'it is recommended to restart the tool');
                throw new Error('#cls.grp.rsn.002: ' + 'resetting seqNext flag of all seqNext elements failed - the seqNext arcs array contains an arc not flagged as seqNext (id: ' + arc.id + ')');
            };
        };
        this.net.seqNextArcs = [];
        if (this.settingsService.state.executionMode === 'safe') {
            for (const node of this.net.nodes) {
                if (node) {
                    if (node.inSequenceNext) {
                        this.popupService.error('srv.dsp.rsn.003', 'inconsistent internal data state', 'it is recommended to restart the tool');
                        throw new Error('#cls.grp.rsn.003: ' + 'resetting seqNext flag of all seqNext elements failed - found a seqNext node that is not part of the seqNext nodes array (' + node + ')');
                    };
                };
            };
            for (const arc of this.net.arcs) {
                if (arc) {
                    if (arc.inSequenceNext) {
                        this.popupService.error('srv.dsp.rsn.004', 'inconsistent internal data state', 'it is recommended to restart the tool');
                        throw new Error('#cls.grp.rsn.004: ' + 'resetting seqNext flag of all seqNext elements failed - found a seqNext arc that is not part of the seqNext arcs array (' + arc + ')');
                    };
                };
            };
        };
    };

    public resetAllErrLvl1Flags() : void {
        for (const transition of this.net.errLvl1Transitions) {
            if (transition.errorLevel1) {
                transition.errorLevel1 = false;
                this.setSvgTransitionColors(transition);
            } else {
                this.popupService.error('srv.dsp.re1.000', 'inconsistent internal data state', 'it is recommended to restart the tool');
                throw new Error('#cls.grp.re1.000: ' + 'resetting errLvl1 flag of all errLvl1 elements failed - the errLvl1 transitions array contains a transition not flagged as errLvl1 (id: ' + transition.id + ')');
            };
        };
        this.net.errLvl1Transitions = [];
        for (const place of this.net.errLvl1Places) {
            if (place.errorLevel1) {
                place.errorLevel1 = false;
                this.setSvgPlaceColors(place);
            } else {
                this.popupService.error('srv.dsp.re1.001', 'inconsistent internal data state', 'it is recommended to restart the tool');
                throw new Error('#cls.grp.re1.001: ' + 'resetting errLvl1 flag of all errLvl1 elements failed - the errLvl1 places array contains a place not flagged as errLvl1 (id: ' + place.id + ')');
            };
        };
        this.net.errLvl1Places = [];
        for (const arc of this.net.errLvl1Arcs) {
            if (arc.errorLevel1) {
                arc.errorLevel1 = false;
                this.setSvgArcColors(arc);
            } else {
                this.popupService.error('srv.dsp.re1.002', 'inconsistent internal data state', 'it is recommended to restart the tool');
                throw new Error('#cls.grp.re1.002: ' + 'resetting errLvl1 flag of all errLvl1 elements failed - the errLvl1 arcs array contains an arc not flagged as errLvl1 (id: ' + arc.id + ')');
            };
        };
        this.net.errLvl1Arcs = [];
        if (this.settingsService.state.executionMode === 'safe') {
            for (const node of this.net.nodes) {
                if (node) {
                    if (node.errorLevel1) {
                        this.popupService.error('srv.dsp.re1.003', 'inconsistent internal data state', 'it is recommended to restart the tool');
                        throw new Error('#cls.grp.re1.003: ' + 'resetting errLvl1 flag of all errLvl1 elements failed - found a errLvl1 node that is not part of the errLvl1 nodes array (' + node + ')');
                    };
                };
            };
            for (const arc of this.net.arcs) {
                if (arc) {
                    if (arc.errorLevel1) {
                        this.popupService.error('srv.dsp.re1.004', 'inconsistent internal data state', 'it is recommended to restart the tool');
                        throw new Error('#cls.grp.re1.004: ' + 'resetting errLvl1 flag of all errLvl1 elements failed - found a errLvl1 arc that is not part of the errLvl1 arcs array (' + arc + ')');
                    };
                };
            };
        };
    };

    public resetAllErrLvl2Flags() : void {
        for (const transition of this.net.errLvl2Transitions) {
            if (transition.errorLevel2) {
                transition.errorLevel2 = false;
                this.setSvgTransitionColors(transition);
            } else {
                this.popupService.error('srv.dsp.re2.000', 'inconsistent internal data state', 'it is recommended to restart the tool');
                throw new Error('#cls.grp.re2.000: ' + 'resetting errLvl2 flag of all errLvl2 elements failed - the errLvl2 transitions array contains a transition not flagged as errLvl2 (id: ' + transition.id + ')');
            };
        };
        this.net.errLvl2Transitions = [];
        for (const place of this.net.errLvl2Places) {
            if (place.errorLevel2) {
                place.errorLevel2 = false;
                this.setSvgPlaceColors(place);
            } else {
                this.popupService.error('srv.dsp.re2.001', 'inconsistent internal data state', 'it is recommended to restart the tool');
                throw new Error('#cls.grp.re2.001: ' + 'resetting errLvl2 flag of all errLvl2 elements failed - the errLvl2 places array contains a place not flagged as errLvl2 (id: ' + place.id + ')');
            };
        };
        this.net.errLvl2Places = [];
        for (const arc of this.net.errLvl2Arcs) {
            if (arc.errorLevel2) {
                arc.errorLevel2 = false;
                this.setSvgArcColors(arc);
            } else {
                this.popupService.error('srv.dsp.re2.002', 'inconsistent internal data state', 'it is recommended to restart the tool');
                throw new Error('#cls.grp.re2.002: ' + 'resetting errLvl2 flag of all errLvl2 elements failed - the errLvl2 arcs array contains an arc not flagged as errLvl2 (id: ' + arc.id + ')');
            };
        };
        this.net.errLvl2Arcs = [];
        if (this.settingsService.state.executionMode === 'safe') {
            for (const node of this.net.nodes) {
                if (node) {
                    if (node.errorLevel2) {
                        this.popupService.error('srv.dsp.re2.003', 'inconsistent internal data state', 'it is recommended to restart the tool');
                        throw new Error('#cls.grp.re2.003: ' + 'resetting errLvl2 flag of all errLvl2 elements failed - found a errLvl2 node that is not part of the errLvl2 nodes array (' + node + ')');
                    };
                };
            };
            for (const arc of this.net.arcs) {
                if (arc) {
                    if (arc.errorLevel2) {
                        this.popupService.error('srv.dsp.re2.004', 'inconsistent internal data state', 'it is recommended to restart the tool');
                        throw new Error('#cls.grp.re2.004: ' + 'resetting errLvl2 flag of all errLvl2 elements failed - found a errLvl2 arc that is not part of the errLvl2 arcs array (' + arc + ')');
                    };
                };
            };
        };
    };

};