import {Component, HostListener, OnDestroy} from '@angular/core';
import {MatIconButton} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';

import {Subscription} from 'rxjs';

import {GraphicsConfigService} from '../../services/config/graphics-config.service';
import {SettingsService} from '../../services/config/settings.service';

@Component({
    selector: 'canvas-legend',
    templateUrl: './canvas-legend.component.html',
    styleUrls: ['./canvas-legend.component.css'],
    standalone: true,
    imports: [
        MatIconButton,
        MatIconModule
    ]
})
export class CanvasLegendComponent implements OnDestroy {

    /* properties */

    @HostListener("window:keyup", ['$event'])
        onKeyUp(event:KeyboardEvent) {
            this.processKeyPress(event);
        };

    /* attributes - own */
    
    private readonly _settingsSubscription : Subscription;

    private _hovered : boolean;

    private _displayMode : ('default' | 'traveled' | 'errors');

    /* methods - constructor */

    public constructor(
        private readonly graphicsConfigService : GraphicsConfigService,
        private readonly settingsService : SettingsService,
    ) {
        this._hovered = false;
        this._displayMode = this.settingsService.state.displayMode;
        this._settingsSubscription = this.settingsService.state$.subscribe(
            state => {
                if (this._displayMode !== state.displayMode) {
                    this._displayMode = state.displayMode;
                };
            }
        );
    };

    /* methods - on destroy */

    ngOnDestroy() : void {
        this._settingsSubscription.unsubscribe();
    };

    /* methods - getters */
    
    public get displaymode() : ('default' | 'traveled' | 'errors') {
        return this._displayMode;
    };
    
    public get defaultStyleS() : string {
        return ('background-color:' + this.graphicsConfigService.defaultStroke);
    };
    
    public get defaultStyleF() : string {
        return ('background-color:' + this.graphicsConfigService.defaultFill);
    };
    
    public get activeStyleS() : string {
        return ('background-color:' + this.graphicsConfigService.activeStroke);
    };
    
    public get activeStyleF() : string {
        return ('background-color:' + this.graphicsConfigService.activeFill);
    };
    
    public get markedStyleS() : string {
        return ('background-color:' + this.graphicsConfigService.markedStroke);
    };
    
    public get markedStyleF() : string {
        return ('background-color:' + this.graphicsConfigService.markedFill);
    };
    
    public get sourceStyleS() : string {
        return ('background-color:' + this.graphicsConfigService.sourceStroke);
    };
    
    public get sourceStyleF() : string {
        return ('background-color:' + this.graphicsConfigService.sourceFill);
    };
    
    public get sinkStyleS() : string {
        return ('background-color:' + this.graphicsConfigService.sinkStroke);
    };
    
    public get sinkStyleF() : string {
        return ('background-color:' + this.graphicsConfigService.sinkFill);
    };
    
    public get enabledStyleS() : string {
        return ('background-color:' + this.graphicsConfigService.enabledStroke);
    };
    
    public get enabledStyleF() : string {
        return ('background-color:' + this.graphicsConfigService.enabledFill);
    };
    
    public get seqLogStyleS() : string {
        return ('background-color:' + this.graphicsConfigService.seqLogStroke);
    };
    
    public get seqLogStyleF() : string {
        return ('background-color:' + this.graphicsConfigService.seqLogFill);
    };
    
    public get seqPastStyleS() : string {
        return ('background-color:' + this.graphicsConfigService.seqPastStroke);
    };
    
    public get seqPastStyleF() : string {
        return ('background-color:' + this.graphicsConfigService.seqPastFill);
    };
    
    public get seqNextStyleS() : string {
        return ('background-color:' + this.graphicsConfigService.seqNextStroke);
    };
    
    public get seqNextStyleF() : string {
        return ('background-color:' + this.graphicsConfigService.seqNextFill);
    };
    
    public get untrvStyleS() : string {
        return ('background-color:' + this.graphicsConfigService.untrvStroke);
    };
    
    public get untrvStyleF() : string {
        return ('background-color:' + this.graphicsConfigService.untrvFill);
    };
    
    public get errLvl0StyleS() : string {
        return ('background-color:' + this.graphicsConfigService.errLvl0Stroke);
    };
    
    public get errLvl0StyleF() : string {
        return ('background-color:' + this.graphicsConfigService.errLvl0Fill);
    };
    
    public get errLvl1StyleS() : string {
        return ('background-color:' + this.graphicsConfigService.errLvl1Stroke);
    };
    
    public get errLvl1StyleF() : string {
        return ('background-color:' + this.graphicsConfigService.errLvl1Fill);
    };
    
    public get errLvl2StyleS() : string {
        return ('background-color:' + this.graphicsConfigService.errLvl2Stroke);
    };
    
    public get errLvl2StyleF() : string {
        return ('background-color:' + this.graphicsConfigService.errLvl2Fill);
    };

    /* methods - other */

    public processMouseEnter() {
        this._hovered = true;
    };

    public processMouseLeave() {
        this._hovered = false;
    };

    private processKeyPress(inKeyboardEvent : KeyboardEvent) {
        inKeyboardEvent.preventDefault();
        if (this._hovered) {
            if (inKeyboardEvent.key === 'Escape') {
                this.settingsService.update({canvasLegendEnabled : false})
            };
        };
    };

    public processButtonClick() {
        this.settingsService.update({canvasLegendEnabled : false});
    };

};