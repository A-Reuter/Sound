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

    private _exampleFilesEnabled : boolean;

    /* methods - constructor */

    constructor(
        private readonly settingsService : SettingsService,
    ) {
        this._exampleFilesEnabled = this.settingsService.state.exampleFilesEnabled;
        this._settingsSubscription  = this.settingsService.state$.subscribe(
            net => {
                if (this._exampleFilesEnabled !== this.settingsService.state.exampleFilesEnabled) {
                    this._exampleFilesEnabled = this.settingsService.state.exampleFilesEnabled;
                };
            }
        );
    };

    /* methods - on destroy */

    ngOnDestroy(): void {
        this._settingsSubscription.unsubscribe();
    };

    /* methods - getters */

    public get filesEnabled() : boolean {
        return this._exampleFilesEnabled;
    };

    public get tooltip() : string {
        if (this._exampleFilesEnabled) {
            return 'hide example files';
        } else {
            return 'show example files';
        };
    };

    /* methods - other */

    public processMouseClick() {
        this.settingsService.update({exampleFilesEnabled : (!(this._exampleFilesEnabled))});
    };

};