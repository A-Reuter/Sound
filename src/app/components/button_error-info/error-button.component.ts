import {Component, OnDestroy} from '@angular/core';
import {MatIconButton} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatTooltipModule} from '@angular/material/tooltip';

import {Subscription} from 'rxjs';

import {DisplayService} from '../../services/visualization/display.service';
import {SettingsService} from '../../services/config/settings.service';

@Component({
    selector: 'error-button',
    templateUrl: './error-button.component.html',
    styleUrls: ['./error-button.component.css'],
    standalone: true,
    imports: [
        MatIconButton,
        MatIconModule,
        MatTooltipModule,
    ]
})
export class ErrorButtonComponent implements OnDestroy {

    /* attributes */

    private readonly _netSubscription : Subscription;

    private _netEmpty : boolean;

    /* methods - constructor */

    constructor(
        private readonly settingsService : SettingsService,
        private readonly displayService : DisplayService,
    ) {
        this._netEmpty = false;
        this._netSubscription  = this.displayService.net$.subscribe(
            net => {
                if (this.displayService.net.empty) {
                    this._netEmpty = true;
                } else {
                    this._netEmpty = false;
                }
            }
        );
    };

    /* methods - on destroy */

    ngOnDestroy(): void {
        this._netSubscription.unsubscribe();
    };

    /* methods - getters */

    public get disabled() : boolean {
        if (this._netEmpty) {
            return true;
        } else {
            return false;
        };
    };

    public get tooltip() : string {
        if (this._netEmpty) {
            return 'net empty';
        } else {
            return 'show detailed information about the error';
        };
    };

    /* methods - other */

    public processMouseClick() {
        this.settingsService.update({
            canvasLegendEnabled : false, 
            errorInfoEnabled : true
        });
    };

};