import {Component, HostListener, OnDestroy} from '@angular/core';
import {MatIconButton} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';

import {Subscription} from 'rxjs';

import {SettingsService} from '../../services/config/settings.service';
import {SimulationService} from '../../services/logic/simulation.service';

@Component({
    selector: 'error-info-net',
    templateUrl: './error-info-net.component.html',
    styleUrls: ['./error-info-net.component.css'],
    standalone: true,
    imports: [
        MatIconButton,
        MatIconModule
    ]
})
export class ErrorNetInfoComponent implements OnDestroy {

    /* properties */

    @HostListener("window:keyup", ['$event'])
        onKeyUp(event:KeyboardEvent) {
            this.processKeyPress(event);
        };

    /* attributes - own */
    
    private readonly _errorsSubscription : Subscription;
    private readonly _settingsSubscription : Subscription;

    private _hovered : boolean;

    private _errorsFound : boolean;

    private _foundErrors : {
        nSeq : number, 
        iSeq : number, 
        dTrs : number
    };

    /* methods - constructor */

    public constructor(
        private readonly simulationService : SimulationService,
        private readonly settingsService : SettingsService
    ) {
        this._hovered = false;
        this._errorsFound = this.settingsService.state.errorInNet;
        this._foundErrors = this.simulationService.errors;
        this._errorsSubscription = this.simulationService.errors$.subscribe(
            errors => {
                if (this._foundErrors !== errors) {
                    this._foundErrors = errors;
                };
            }
        );
        this._settingsSubscription = this.settingsService.state$.subscribe(
            state => {
                if (this._errorsFound !== state.errorInNet) {
                    this._errorsFound = state.errorInNet;
                };
            }
        );
    };

    /* methods - on destroy */

    ngOnDestroy() : void {
        this._errorsSubscription.unsubscribe();
        this._settingsSubscription.unsubscribe();
    };

    /* methods - getters */
    
    public get errorsFound() : boolean {
        return this._errorsFound;
    };
    
    public get foundErrors() : {
        nSeq : number, 
        iSeq : number, 
        dTrs : number
    } {
        return this._foundErrors;
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
                this.settingsService.update({errorInfoNetEnabled : false})
            };
        };
    };

    public processButtonClick() {
        this.settingsService.update({errorInfoNetEnabled : false});
    };

};