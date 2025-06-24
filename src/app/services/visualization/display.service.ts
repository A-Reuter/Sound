import {Injectable, OnDestroy} from '@angular/core';

import {BehaviorSubject, Observable} from 'rxjs';

import {SettingsService} from '../config/settings.service';

import {CanvasComponent} from '../../components/canvas/canvas.component';
import {ToolComponent} from '../../components/page-tool/page-tool.component';

import {Net} from '../../classes/net-representation/net';

@Injectable({
    providedIn: 'root'
})
export class DisplayService implements OnDestroy {

    /* attributes - references */

    private canvasComponent : (CanvasComponent | undefined);
    private toolComponent : (ToolComponent | undefined);

    /* attributes - own */

    private readonly _net$: BehaviorSubject<Net>;

    private _netUpdates : number = 1;

    /* methods - constructor */

    public constructor(
        private settingsService : SettingsService,
    ) {
        this._net$ = new BehaviorSubject<Net>(new Net());
    };

    /* methods - on destroy */

    ngOnDestroy(): void {
        this._net$.complete();
    };

    /* methods - getters */

    public get net$(): Observable<Net> {
        return this._net$.asObservable();
    };

    public get net(): Net {
        return this._net$.getValue();
    };

    public get netUpdates() : number {
        return this._netUpdates;
    };

    public get canvas() : (CanvasComponent | undefined) {
        return this.canvasComponent;
    };

    /* methods - other */

    public setCanvasComponent(inComponent : CanvasComponent) {
        this.canvasComponent = inComponent;
    };

    public setToolComponent(inComponent : ToolComponent) {
        this.toolComponent = inComponent;
    };

    public deleteData(): void {
        this.settingsService.update({dataLoaded : false});
        this.toolComponent?.clearFileArea();
        this.updateData(undefined);
    };

    public refreshData(): void {
        this.updateData(this._net$.getValue());
    };
    
    public async updateData(
        inNet : (Net | undefined)
    ) {
        return await new Promise(
            resolve => {
                this._netUpdates++;
                if (inNet !== undefined) {
                    if ((inNet.nodes.length !== 0) || (inNet.arcs.length !== 0)) {
                        this._net$.next(inNet);
                        return;
                    };
                };
                this._net$.next(new Net());
            }
        );
    };

};