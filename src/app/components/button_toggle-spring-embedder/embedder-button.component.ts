import {Component, OnDestroy} from '@angular/core';
import {MatFabButton} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatTooltipModule} from '@angular/material/tooltip';

import {Subscription} from 'rxjs';

import {SettingsService} from '../../services/config/settings.service';

@Component({
    selector: 'embedder-button',
    templateUrl: './embedder-button.component.html',
    styleUrls: ['./embedder-button.component.css'],
    standalone: true,
    imports: [
        MatFabButton,
        MatIconModule,
        MatTooltipModule,
    ]
})
export class EmbedderButtonComponent implements OnDestroy {

    /* attributes */

    private readonly _settingsSubscription : Subscription;

    private _springEmbedderEnabled : boolean;

    /* methods - constructor */

    constructor(
        private readonly settingsService : SettingsService,
    ) {
        this._springEmbedderEnabled = this.settingsService.state.springEmbedderEnabled;
        this._settingsSubscription  = this.settingsService.state$.subscribe(
            state => {
                if (this._springEmbedderEnabled !== this.settingsService.state.springEmbedderEnabled) {
                    this._springEmbedderEnabled = this.settingsService.state.springEmbedderEnabled;
                }
            }
        );
    };

    /* methods - on destroy */

    ngOnDestroy(): void {
        this._settingsSubscription.unsubscribe();
    };

    /* methods - getters */

    public get embedderEnabled() : boolean {
        return this._springEmbedderEnabled;
    };

    public get tooltip() : string {
        if (this._springEmbedderEnabled) {
            return 'automated node arrangement';
        } else {
            return 'free node arrangement';
        };
    };

    /* methods - other */

    public processMouseClick() {
        this.settingsService.update({springEmbedderEnabled : (!(this._springEmbedderEnabled))});
    };

};