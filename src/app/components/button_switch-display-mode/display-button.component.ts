import {Component, OnDestroy} from '@angular/core';
import {MatTooltipModule} from '@angular/material/tooltip';
import {MatButtonToggleModule} from '@angular/material/button-toggle';

import {Subscription} from 'rxjs';

import {SettingsService} from '../../services/config/settings.service';

@Component({
    selector: 'display-button',
    templateUrl: './display-button.component.html',
    styleUrls: ['./display-button.component.css'],
    standalone: true,
    imports: [
        MatTooltipModule,
        MatButtonToggleModule,
    ]
})
export class DisplayButtonComponent implements OnDestroy {

    /* attributes */
    
    private readonly _settingsSubscription : Subscription;

    private _displayMode : ('default' | 'traveled' | 'errors') = 'default';

    /* methods - constructor */

    constructor(
        private readonly settingsService : SettingsService,
    ) {
        this._settingsSubscription = this.settingsService.state$.subscribe(
            (state) => {
                this._displayMode = state.displayMode;
            }
        );
    };

    /* methods - on destroy */

    ngOnDestroy() : void {
        this._settingsSubscription.unsubscribe();
    };

    /* methods - getters */

    public get displayMode() : ('default' | 'traveled' | 'errors') {
        return this._displayMode;
    };

    public get tooltip() : string {
        if (this._displayMode === 'default') {
            return 'highlighting special nodes';
        } else if (this._displayMode === 'traveled') {
            return 'highlighting traveled paths';
        } else {
            return 'highlighting occurring errors';
        };
    };

    /* methods - other */

    public processMouseClickA() {
        if (this._displayMode !== 'default') {
            this._displayMode = 'default';
            this.settingsService.update({displayMode : 'default'});
        };
    };

    public processMouseClickB() {
        if (this._displayMode !== 'traveled') {
            this._displayMode = 'traveled';
            this.settingsService.update({displayMode : 'traveled'});
        };
    };

    public processMouseClickC() {
        if (this._displayMode !== 'errors') {
            this._displayMode = 'errors';
            this.settingsService.update({displayMode : 'errors'});
        };
    };

};