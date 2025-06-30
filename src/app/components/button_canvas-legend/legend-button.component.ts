import {Component, OnDestroy} from '@angular/core';
import {MatFabButton} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatTooltipModule} from '@angular/material/tooltip';

import {Subscription} from 'rxjs';

import {SettingsService} from '../../services/config/settings.service';

@Component({
    selector: 'legend-button',
    templateUrl: './legend-button.component.html',
    styleUrls: ['./legend-button.component.css'],
    standalone: true,
    imports: [
        MatFabButton,
        MatIconModule,
        MatTooltipModule,
    ]
})
export class LegendButtonComponent implements OnDestroy {

    /* attributes - own */

    private readonly _settingsSubscription : Subscription;

    private _legendEnabled : boolean;

    /* methods - constructor */

    constructor(
        private readonly settingsService : SettingsService
    ) {
        this._legendEnabled = this.settingsService.state.canvasLegendEnabled;
        this._settingsSubscription = this.settingsService.state$.subscribe(
            state => {
                if (this._legendEnabled !== state.canvasLegendEnabled) {
                    this._legendEnabled = state.canvasLegendEnabled;
                };
            }
        );
    };

    /* methods - on destroy */

    ngOnDestroy(): void {
        this._settingsSubscription.unsubscribe();
    };

    /* methods - getters */

    public get legendEnabled() : boolean {
        return this._legendEnabled;
    };

    public get tooltip() {
        if (this._legendEnabled) {
            return 'close color legend';
        } else {
            return 'canvas color legend';
        };
    };

    /* methods - other */

    public processMouseClick() {
        if (this.settingsService.state.canvasLegendEnabled) {
            this.settingsService.update({
                canvasLegendEnabled : false
            });
        } else {
            this.settingsService.update({
            canvasLegendEnabled : true, 
            errorInfoNetEnabled : false, 
            errorInfoSeqEnabled : false
            });
        };
    };

};