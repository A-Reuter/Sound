import {Component, ElementRef, OnDestroy, ViewChild} from '@angular/core';

import {Subscription} from 'rxjs';

import {DisplayService} from '../../services/visualization/display.service';
import {GraphicsConfigService} from '../../services/config/graphics-config.service';
import {PopupService} from '../../services/notifications/popup.service';
import {SimulationService} from '../../services/logic/simulation.service'; 
import {SvgService} from '../../services/visualization/svg.service';

import {Net} from '../../classes/net-representation/net';

@Component({
    selector: 'log-area',
    templateUrl: './log.component.html',
    styleUrls: ['./log.component.css'],
    standalone: true
})
export class LogComponent implements OnDestroy {

    /* properties */

    @ViewChild('logArea') logArea : (ElementRef<HTMLDivElement> | undefined);

    /* attributes - references */

    private net : Net;

    /* attributes - own */

    private readonly _netSubscription : Subscription;

    private _logEntrySvgArray : {
        outer : SVGElement, 
        inner : SVGElement, 
        valid : boolean
    }[] = [];

    private _logEntrySvgMap : {
        [logID : number] : {
            outer : SVGElement, 
            inner : SVGElement, 
            valid : boolean
        }
    } = {};

    private _logEntryHover : (
        [
            SVGElement, 
            boolean
        ] | undefined
    ) = undefined;

    /* methods - constructor */

    public constructor(
        private readonly displayService : DisplayService,
        private readonly graphicsConfigService : GraphicsConfigService,
        private readonly popupService : PopupService,
        private readonly simulationService : SimulationService,
        private readonly svgService : SvgService,
    ) {
        this.simulationService.registerLogComponent(this);
        this.net = this.displayService.net;
        this._netSubscription = this.displayService.net$.subscribe(
            net => {
                this.net = this.displayService.net;
                this.draw();
            }
        );
    };

    /* methods - on destroy */

    ngOnDestroy() : void {
        this._netSubscription.unsubscribe();
    };

    /* methods - getters */

    public get sequence() : boolean {
        return (this.net.completedSequences > 0);
    };

    public get completed() : number {
        return (this.net.completedSequences);
    };

    public get unique() : number {
        return (this.net.simulationLog.length);
    };

    public get invalid() : number {
        return (this.net.errors.nSeq + this.net.errors.iSeq);
    };

    /* methods - other */

    private getMouseTarget(inMouseEvent : MouseEvent) : (number | undefined) {
        inMouseEvent.preventDefault();
        const target = inMouseEvent.target;
        if (target instanceof SVGElement) {
            const targetId : (string | null) = target.getAttribute('id');
            if (targetId !== null) {
                const svgId : string[]  = targetId.split('_');
                if (svgId[0] === 'logEntry') {
                    return (parseInt(svgId[1]));
                };
            };
        };
        // /* do not remove - alternative implementation (using <svg> and <div> elements) */
        //
        // } else if (target instanceof HTMLDivElement) {
        //     /* TODO : remove console output */
        //     console.debug('target is div');
        //     const targetId : (string | null) = target.getAttribute('id');
        //     if (targetId !== null) {
        //         const svgId : string[]  = targetId.split('_');
        //         if (svgId[0] === 'logEntry') {
        //             /* TODO : remove console output */
        //             console.debug(' --> target id is ' + parseInt(svgId[1]));
        //             return (parseInt(svgId[1]));
        //         };
        //     };
        // };
        return undefined;
    };

    public processMouseEnter(inMouseEvent : MouseEvent) {
        inMouseEvent.preventDefault();
        const target = (inMouseEvent.target as HTMLDivElement);
        target.classList.add('mouse-hover');
    };

    public processMouseMove(inMouseEvent : MouseEvent) {
        inMouseEvent.preventDefault();
        const strokeWidthA : number = this.graphicsConfigService.defaultOuterLogStrokeWidth;
        const strokeWidthB : number = (this.graphicsConfigService.defaultOuterLogStrokeWidth + 1);
        const strokeValidA : string = this.graphicsConfigService.validStrokeA;
        const strokeValidB : string = this.graphicsConfigService.validStrokeB;
        const strokeInvalidA : string = this.graphicsConfigService.invalidStrokeA;
        const strokeInvalidB : string = this.graphicsConfigService.invalidStrokeB;
        const target : (number | undefined) = this.getMouseTarget(inMouseEvent);
        if (target !== undefined) {
            const targetedEntry : {
                outer : SVGElement, 
                inner : SVGElement, 
                valid : boolean
            } = this._logEntrySvgMap[target];
            const newHover : SVGElement = targetedEntry.inner;
            if (this._logEntryHover) {
                const oldHover : SVGElement = this._logEntryHover[0];
                if (oldHover !== targetedEntry.inner) {
                    if (this._logEntryHover[1]) {
                        oldHover.setAttribute('stroke', strokeValidA);
                        oldHover.setAttribute('stroke-width', `${strokeWidthA}`);
                        oldHover.setAttribute('stroke-dasharray', `${strokeWidthA},${strokeWidthA}`);
                    } else {
                        oldHover.setAttribute('stroke', strokeInvalidA);
                        oldHover.setAttribute('stroke-width', `${strokeWidthA}`);
                        oldHover.setAttribute('stroke-dasharray', `${strokeWidthA},${strokeWidthA}`);
                    };
                } else {
                    return;
                };
            };
            if (targetedEntry.valid) {
                newHover.setAttribute('stroke', strokeValidB);
                newHover.setAttribute('stroke-width', `${strokeWidthB}`);
                newHover.setAttribute('stroke-dasharray', `${strokeWidthB},${strokeWidthB}`);
            } else {
                newHover.setAttribute('stroke', strokeInvalidB);
                newHover.setAttribute('stroke-width', `${strokeWidthB}`);
                newHover.setAttribute('stroke-dasharray', `${strokeWidthB},${strokeWidthB}`);
            };
            this._logEntryHover = [targetedEntry.inner, targetedEntry.valid];
        } else {
            if (this._logEntryHover) {
                const oldHover : SVGElement = this._logEntryHover[0];
                if (this._logEntryHover[1]) {
                    oldHover.setAttribute('stroke', strokeValidA);
                    oldHover.setAttribute('stroke-width', `${strokeWidthA}`);
                    oldHover.setAttribute('stroke-dasharray', `${strokeWidthA},${strokeWidthA}`);
                } else {
                    oldHover.setAttribute('stroke', strokeInvalidA);
                    oldHover.setAttribute('stroke-width', `${strokeWidthA}`);
                    oldHover.setAttribute('stroke-dasharray', `${strokeWidthA},${strokeWidthA}`);
                };
                this._logEntryHover = undefined;
            };
        };
    };

    public processMouseLeave(inMouseEvent : MouseEvent) {
        inMouseEvent.preventDefault();
        if (this._logEntryHover) {
            if (this._logEntryHover[1]) {
                this._logEntryHover[0].setAttribute('stroke', this.graphicsConfigService.validStrokeB);
            } else {
                this._logEntryHover[0].setAttribute('stroke', this.graphicsConfigService.invalidStrokeB);
            };
            this._logEntryHover = undefined;
        };
        const target = (inMouseEvent.target as HTMLDivElement);
        target.classList.remove('mouse-hover');
    };

    public processMouseClick(inMouseEvent : MouseEvent) {
        inMouseEvent.preventDefault();
        const sequenceId : (number | undefined) = this.getMouseTarget(inMouseEvent);
        if (sequenceId !== undefined) {
            this.simulationService.loadLogSequence(sequenceId);
        };
    };

    public prependSequence(inLogIndex : number) : void {
        if (this._logEntrySvgMap[inLogIndex] !== undefined) {
            this.popupService.error('cmp.log.pps.000', 'inconsistent internal data state', 'it is recommended to restart the tool');
            throw new Error('#cmp.log.pps.000: ' + 'prepending sequence failed - log entry index \'' + (inLogIndex) + '\' already exists');
        };
        const logArea = this.logArea?.nativeElement;
        if (logArea === undefined) {
            this.popupService.error('cmp.log.pps.001', 'component malfunction', 'it is recommended to restart the tool');
            throw new Error('#cmp.log.pps.001: ' + 'prepending sequence failed - the log area returns undefined');
        };
        while (logArea.childElementCount > 0) {
            logArea.removeChild(logArea.lastChild as ChildNode);
        };
        const reverseArray : SVGElement[] = [];
        for (const entry of this._logEntrySvgArray) {
            reverseArray.push(entry.outer);
        };
        const svgLogEntry : {
            outer : SVGElement, 
            inner : SVGElement, 
            valid : boolean
        } = this.svgService.createSvgLogEntry(inLogIndex, this.net.simulationLog[inLogIndex]);
        reverseArray.push(svgLogEntry.outer);
        this._logEntrySvgArray.push(svgLogEntry);
        this._logEntrySvgMap[inLogIndex] = svgLogEntry;
        while (reverseArray.length > 0) {
            const svg = reverseArray.pop();
            if (svg) {
                logArea.appendChild(svg);
            };
        };
    };

    private async draw() : Promise<void> {
        const time : number = 50;
        let tries : number = 0;
        while (tries < 4) {
            if (this.logArea === undefined) {
                await new Promise(resolve => setTimeout(resolve, time));
                tries++;
            } else {
                break;
            };
        };
        if (this.logArea === undefined) {
            if (this.displayService.net.empty) {
                console.debug('log area not initialized yet');
            } else {
                console.warn('LogComponent failed to draw log - the log area is undefined (tried drawing ' + tries + ' times over ' + (tries * time) + 'ms)');
            };
            return;
        };
        this.clearLogArea();
        const reverseArray : SVGElement[] = []
        for (let logIdx = 0; logIdx < this.net.simulationLog.length; logIdx++) {
            const svgLogEntry : {
                outer : SVGElement, 
                inner : SVGElement, 
                valid : boolean
            } = this.svgService.createSvgLogEntry(logIdx, this.net.simulationLog[logIdx]);
            reverseArray.push(svgLogEntry.outer);
            this._logEntrySvgArray.push(svgLogEntry);
            this._logEntrySvgMap[logIdx] = svgLogEntry;
        };
        while (reverseArray.length > 0) {
            const svg = reverseArray.pop();
            if (svg) {
                this.logArea.nativeElement.appendChild(svg);
            }
        };
    };

    private clearLogArea() : void {
        const logArea = this.logArea?.nativeElement;
        if (logArea?.childElementCount === undefined) {
            return;
        };
        while (logArea.childElementCount > 0) {
            logArea.removeChild(logArea.lastChild as ChildNode);
        };
        this._logEntrySvgArray = [];
        this._logEntrySvgMap = {};
    };
    
};