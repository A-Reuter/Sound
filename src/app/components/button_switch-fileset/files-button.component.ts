import {Component, OnDestroy} from '@angular/core';
import {MatFabButton} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatTooltipModule} from '@angular/material/tooltip';

import {Subscription} from 'rxjs';

import {SettingsService} from '../../services/config/settings.service';

@Component({
    selector: 'files-button',
    templateUrl: './files-button.component.html',
    styleUrls: ['./files-button.component.css'],
    standalone: true,
    imports: [
        MatFabButton,
        MatIconModule,
        MatTooltipModule,
    ]
})
export class FilesButtonComponent implements OnDestroy {

    /* attributes - own */

    private readonly _settingsSubscription : Subscription;

    private _displayedFileset : ('examples' | 'exercises');

    /* methods - constructor */

    constructor(
        private readonly settingsService : SettingsService,
    ) {
        this._displayedFileset = this.settingsService.state.displayedFileset;
        this._settingsSubscription  = this.settingsService.state$.subscribe(
            net => {
                if (this._displayedFileset !== this.settingsService.state.displayedFileset) {
                    this._displayedFileset = this.settingsService.state.displayedFileset;
                };
            }
        );
    };

    /* methods - on destroy */

    ngOnDestroy(): void {
        this._settingsSubscription.unsubscribe();
    };

    /* methods - getters */

    public get examples() : boolean {
        return (this._displayedFileset === 'examples');
    };

    public get tooltip() : string {
        if (this._displayedFileset !== 'examples') {
            return 'switch to example files';
        } else {
            return 'switch to exercise files';
        };
    };

    /* methods - other */

    public processMouseClick() {
        if (this._displayedFileset !== 'examples') {
            this.settingsService.update({displayedFileset : 'examples'});
        } else {
            this.settingsService.update({displayedFileset : 'exercises'});
        };
    };

};