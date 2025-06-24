import {Component, OnDestroy} from '@angular/core';
import {MatFabButton} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatTooltipModule} from '@angular/material/tooltip';

import {Subscription} from 'rxjs';

import {DisplayService} from '../../services/visualization/display.service';
import {SettingsService} from '../../services/config/settings.service';

@Component({
    selector: 'delete-button',
    templateUrl: './delete-button.component.html',
    styleUrls: ['./delete-button.component.css'],
    standalone: true,
    imports: [
        MatFabButton,
        MatIconModule,
        MatTooltipModule,
    ]
})
export class DeleteButtonComponent implements OnDestroy {

    /* attributes - own */

    private readonly _netSubscription : Subscription;
    private readonly _settingsSubscription : Subscription;

    private _netEmpty : boolean;
    private _noData : boolean;
    private _autorunActive : boolean;

    /* methods - constructor */

    constructor(
        private readonly displayService : DisplayService,
                private readonly settingsService : SettingsService,
    ) {
        this._netEmpty = this.displayService.net.empty;
        this._noData = !(this.settingsService.state.dataLoaded);
        this._autorunActive = this.settingsService.state.autorunExec;
        this._netSubscription  = this.displayService.net$.subscribe(
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
                if (this._noData === this.settingsService.state.dataLoaded) {
                    this._noData = !(this.settingsService.state.dataLoaded);
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
        if (this._noData) {
            return true;
        } else if (this._autorunActive) {
            return true;
        } else {
            return false;
        };
    };

    public get tooltip() : string {
        if (this._noData) {
            return 'no data loaded';
        } else if (this._autorunActive) {
            return 'sequence automation is active';
        } else if (this._netEmpty) {
            return 'delete data';
        } else {
            return 'delete net';
        };
    };

    /* methods - other */

    public processMouseClick() {
        this.displayService.deleteData();
    };

};