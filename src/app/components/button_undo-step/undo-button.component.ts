import {Component, OnDestroy} from '@angular/core';
import {MatFabButton} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatTooltipModule} from '@angular/material/tooltip';

import {Subscription} from 'rxjs';

import {DisplayService} from '../../services/visualization/display.service';
import {SettingsService} from '../../services/config/settings.service';
import {SimulationService} from '../../services/logic/simulation.service';

@Component({
    selector: 'undo-button',
    templateUrl: './undo-button.component.html',
    styleUrls: ['./undo-button.component.css'],
    standalone: true,
    imports: [
        MatFabButton,
        MatIconModule,
        MatTooltipModule,
    ]
})
export class UndoButtonComponent implements OnDestroy {

    /* attributes - own */

    private readonly _netSubscription : Subscription;
    private readonly _settingsSubscription : Subscription;
    private readonly _simulationSubscription : Subscription;

    private _netEmpty : boolean;
    private _noWorkflow : boolean;
    private _autorunActive : boolean;

    /* methods - constructor */

    constructor(
        private readonly displayService : DisplayService,
        private readonly settingsService : SettingsService,
        private readonly simulationService : SimulationService,
    ) {
        this._netEmpty = this.displayService.net.empty;
        this._noWorkflow = !this.simulationService.workflow;
        this._autorunActive = this.settingsService.state.autorunExec;
        this._netSubscription  = this.displayService.net$.subscribe(
            net => {
                if (this.displayService.net.empty) {
                    this._netEmpty = true;
                } else {
                    this._netEmpty = false;
                };
                if (this.displayService.net.workflow) {
                    this._noWorkflow = false;
                } else {
                    this._noWorkflow = true;
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
        this._simulationSubscription = this.simulationService.workflow$.subscribe(
            workflow => {
                if (this._noWorkflow === workflow) {
                    this._noWorkflow = !workflow;
                };
            }
        );
    };

    /* methods - on destroy */

    ngOnDestroy(): void {
        this._netSubscription.unsubscribe();
        this._settingsSubscription.unsubscribe();
        this._simulationSubscription.unsubscribe();
    };

    /* methods - getters */

    public get disabled() : boolean {
        if (this._netEmpty) {
            return true;
        } else if (this._noWorkflow) {
            return true;
        } else if (this._autorunActive) {
            return true;
        } else if (this.displayService.net.nextSequenceEntry < 1) {
            return true;
        } else {
            return false;
        };
    };

    public get tooltip() : string {
        if (this._netEmpty) {
            return 'net is empty';
        } else if (this._noWorkflow) {
            return 'net is not a workflow net';
        } else if (this._autorunActive) {
            return 'sequence automation is active';
        } else if (this.displayService.net.nextSequenceEntry < 1) {
            return 'no last step to undo';
        } else {
            return 'undo last step';
        };
    };

    /* methods - other */

    public processMouseClick() {
        this.simulationService.undoSequenceEntry();
    };

};