import {Component, OnDestroy} from '@angular/core';
import {MatFabButton} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatTooltipModule} from '@angular/material/tooltip';

import {Subscription} from 'rxjs';

import {DisplayService} from '../../services/visualization/display.service';
import {SettingsService} from '../../services/config/settings.service';
import {SimulationService} from '../../services/logic/simulation.service';

@Component({
    selector: 'reset-button',
    templateUrl: './reset-button.component.html',
    styleUrls: ['./reset-button.component.css'],
    standalone: true,
    imports: [
        MatFabButton,
        MatIconModule,
        MatTooltipModule,
    ]
})
export class ResetButtonComponent implements OnDestroy {

    /* attributes - own */

    private readonly _netSubscription : Subscription;
    private readonly _settingsSubscription : Subscription;

    private _netEmpty : boolean;
    private _autorunActive : boolean;

    /* methods - constructor */

    constructor(
        private readonly displayService : DisplayService,
        private readonly settingsService : SettingsService,
        private readonly simulationService : SimulationService,
    ) {
        this._netEmpty = this.displayService.net.empty;
        this._autorunActive = this.settingsService.state.autorunExec;
        this._netSubscription = this.displayService.net$.subscribe(
            net => {
                if (this.displayService.net.empty) {
                    this._netEmpty = true;
                } else {
                    this._netEmpty = false;
                };
            }
        );
        this._settingsSubscription = this.settingsService.state$.subscribe(
            state => {
                if (this._autorunActive !== this.settingsService.state.autorunExec) {
                    this._autorunActive = this.settingsService.state.autorunExec;
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

    public get disabled() : boolean {
        if (this._netEmpty) {
            return true;
        } else if (this._autorunActive) {
            return true;
        } else if (this.simulationService.initializedState) {
            return true;
        } else {
            return false;
        };
    };

    public get tooltip() : string {
        if (this._netEmpty) {
            return 'net is empty';
        } else if (this._autorunActive) {
            return 'sequence automation is active';
        } else if (this.simulationService.initializedState) {
            return 'net is already in initial state';
        } else {
            return 'reset net to initial marking';
        };
    };

    /* methods - other */

    public processMouseClick() {
        this.simulationService.resetMarking();
    };

};