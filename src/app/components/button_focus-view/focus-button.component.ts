import {Component, OnDestroy} from '@angular/core';
import {MatFabButton} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatTooltipModule} from '@angular/material/tooltip';

import {Subscription} from 'rxjs';

import {DisplayService} from '../../services/visualization/display.service';

@Component({
    selector: 'focus-button',
    templateUrl: './focus-button.component.html',
    styleUrls: ['./focus-button.component.css'],
    standalone: true,
    imports: [
        MatFabButton,
        MatIconModule,
        MatTooltipModule,
    ]
})
export class FocusButtonComponent implements OnDestroy {

    /* attributes - own */

    private readonly _netSubscription : Subscription;

    private _netEmpty : boolean;

    /* methods - constructor */

    constructor(
        private readonly displayService : DisplayService,
    ) {
        this._netEmpty = this.displayService.net.empty;
        this._netSubscription = this.displayService.net$.subscribe(
            net => {
                if (this.displayService.net.empty) {
                    this._netEmpty = true;
                } else {
                    this._netEmpty = false;
                };
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
            return 'net is empty';
        } else {
            return 'focus view on net';
        };
    };

    /* methods - other */

    public processMouseClick() {
        if (this.displayService.canvas) {
            this.displayService.canvas.focusViewBox();
        };
    };

};