import {Component, HostListener, OnDestroy} from '@angular/core';
import {FormControl} from '@angular/forms';
import {MatIconButton} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';

import {Subscription} from 'rxjs';

import {ErrorInfo} from '../../classes/error-info/error-info';

import {SettingsService} from '../../services/config/settings.service';
import {SimulationService} from '../../services/logic/simulation.service';

@Component({
    selector: 'error-info',
    templateUrl: './error-info.component.html',
    styleUrls: ['./error-info.component.css'],
    standalone: true,
    imports: [
        MatIconButton,
        MatIconModule
    ]
})
export class ErrorInfoComponent implements OnDestroy {

    /* properties */

    @HostListener("window:keyup", ['$event'])
        onKeyUp(event:KeyboardEvent) {
            this.processKeyPress(event);
        };

    /* attributes - own */
    
    private readonly _errorSubscription : Subscription;

    private readonly _infoAreaFc : FormControl;

    private _hovered : boolean;

    private _errorInfo : ErrorInfo;

    /* methods - constructor */

    public constructor(
        private readonly settingsService : SettingsService,
        private readonly simulationService : SimulationService
    ) {
        this._hovered = false;
        this._infoAreaFc = new FormControl();
        this._infoAreaFc.disable();
        this._errorInfo = this.simulationService.errorInfo;
        this._errorSubscription = this.simulationService.errorInfo$.subscribe(
            errorInfo => {
                this._errorInfo = this.simulationService.errorInfo;
                this._infoAreaFc.setValue(this._errorInfo);
            }
        );
    };

    /* methods - on destroy */

    ngOnDestroy() : void {
        this._errorSubscription.unsubscribe();
    };

    /* methods - getters */
    
    public get infoAreaFc() : FormControl {
        return this._infoAreaFc;
    };
    
    public get errorInfo() : ErrorInfo {
        return this._errorInfo;
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
                this.settingsService.update({errorInfoEnabled : false})
            };
        };
    };

    public processButtonClick() {
        this.settingsService.update({errorInfoEnabled : false});
    };

};