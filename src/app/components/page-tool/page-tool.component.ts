import {Component, OnDestroy} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormControl, ReactiveFormsModule} from '@angular/forms';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';

import {Subscription} from 'rxjs';

import {Net} from '../../classes/net-representation/net';

import {AutorunButtonComponent} from '../button_toggle-autorun/autorun-button.component';
import {CanvasComponent} from '../canvas/canvas.component';
import {CanvasLegendComponent} from '../canvas-legend/canvas-legend.component';
import {DeleteButtonComponent} from '../button_delete-net/delete-button.component';
import {DisplayButtonComponent} from '../button_switch-display-mode/display-button.component';
import {EmbedderButtonComponent} from '../button_toggle-spring-embedder/embedder-button.component';
import {ErrorNetButtonComponent} from '../button_error-net/error-n-button.component';
import {ErrorNetInfoComponent} from '../error-info-net/error-info-net.component';
import {ErrorSeqButtonComponent} from '../button_error-sequence/error-s-button.component';
import {ErrorSeqInfoComponent} from '../error-info-seq/error-info-seq.component';
import {ExampleFileComponent} from '../example-file/example-file.component';
import {FilesButtonComponent} from '../button_toggle-example-files/files-button.component';
import {FocusButtonComponent} from '../button_focus-view/focus-button.component';
import {LegendButtonComponent} from '../button_canvas-legend/legend-button.component';
import {LogComponent} from '../log/log.component';
import {MenuBarComponent} from '../menu-bar/menu-bar.component';
import {RedoButtonComponent} from '../button_redo-step/redo-button.component';
import {ResetButtonComponent} from '../button_reset-net/reset-button.component';
import {ToastComponent} from '../toast/toast.component';
import {UndoButtonComponent} from '../button_undo-step/undo-button.component';

import {DisplayService} from '../../services/visualization/display.service';
import {FileParserService} from '../../services/io/file-parser.service';
import {PopupService} from '../../services/notifications/popup.service';
import {SettingsService} from "../../services/config/settings.service";
import {ToastService} from '../../services/notifications/toast.service';

@Component({
    selector: 'tool-page',
    templateUrl: './page-tool.component.html',
    styleUrls: ['./page-tool.component.css'],
    standalone: true,
    imports: [
        AutorunButtonComponent,
        CanvasComponent,
        CanvasLegendComponent,
        CommonModule,
        DeleteButtonComponent,
        DisplayButtonComponent,
        EmbedderButtonComponent,
        ErrorNetButtonComponent,
        ErrorNetInfoComponent,
        ErrorSeqButtonComponent,
        ErrorSeqInfoComponent,
        ExampleFileComponent,
        FilesButtonComponent,
        FocusButtonComponent,
        LegendButtonComponent,
        LogComponent,
        MatFormFieldModule,
        MatInputModule,
        MenuBarComponent,
        ReactiveFormsModule,
        RedoButtonComponent,
        ResetButtonComponent,
        ToastComponent,
        UndoButtonComponent
    ]
})
export class ToolComponent implements OnDestroy {

    /* attributes */

    private _settingsSubscription : Subscription;
    private _toastSubscription : Subscription;

    private _fileAreaFc : FormControl;

    private _toastMessages : {
        type : ('toast' | 'panel'),
        content : ('info' | 'success' | 'warning' | 'error'),
        duration : number,
        message : string[]
    }[] = [];

    private _autorunActive : boolean;
    private _canvasLegendEnabled : boolean;
    private _errorInNet : boolean;
    private _errorInSequence : boolean;
    private _errorInfoNetEnabled : boolean;
    private _errorInfoSeqEnabled : boolean;
    private _exampleFilesEnabled : boolean;

    /* methods - constructor */

    constructor(
        private readonly displayService : DisplayService,
        private readonly fileParserService : FileParserService,
        private readonly popupService : PopupService,
        private readonly settingsService : SettingsService,
        private readonly toastService : ToastService,
    ) {
        this._fileAreaFc = new FormControl();
        this._fileAreaFc.disable();
        this.displayService.setToolComponent(this);
        this._autorunActive = this.settingsService.state.autorunExec;
        this._canvasLegendEnabled = this.settingsService.state.canvasLegendEnabled;
        this._errorInNet = this.settingsService.state.errorInNet;
        this._errorInSequence = this.settingsService.state.errorInSequence;
        this._errorInfoNetEnabled = this.settingsService.state.errorInfoNetEnabled;
        this._errorInfoSeqEnabled = this.settingsService.state.errorInfoSeqEnabled;
        this._exampleFilesEnabled = this.settingsService.state.exampleFilesEnabled;
        this._settingsSubscription = this.settingsService.state$.subscribe(
            state => {
                if (this._autorunActive !== state.autorunExec) {
                    this._autorunActive = state.autorunExec;
                };
                if (this._canvasLegendEnabled !== state.canvasLegendEnabled) {
                    this._canvasLegendEnabled = state.canvasLegendEnabled;
                };
                if (this._errorInfoNetEnabled !== state.errorInfoNetEnabled) {
                    this._errorInfoNetEnabled = state.errorInfoNetEnabled;
                };
                if (this._errorInfoSeqEnabled !== state.errorInfoSeqEnabled) {
                    this._errorInfoSeqEnabled = state.errorInfoSeqEnabled;
                };
                if (this._errorInNet !== state.errorInNet) {
                    this._errorInNet = state.errorInNet;
                };
                if (this._errorInSequence !== state.errorInSequence) {
                    this._errorInSequence = state.errorInSequence;
                };
                if (this._exampleFilesEnabled !== state.exampleFilesEnabled) {
                    this._exampleFilesEnabled = state.exampleFilesEnabled;
                };
            }
        );
        this._toastSubscription = this.toastService.toast$.subscribe(toast => {
            this._toastMessages.push(toast);
            setTimeout(() => {this._toastMessages.shift()}, toast.duration);
        });
        this.init();
    };

    /* methods - on destroy */

    ngOnDestroy(): void {
        this._settingsSubscription.unsubscribe();
        this._toastSubscription.unsubscribe();
    };

    /* methods - getters */

    public get fileAreaFc() : FormControl {
        return this._fileAreaFc;
    };

    public get toastMessages() {
        return this._toastMessages;
    };

    public get canvasLegendEnabled() {
        return this._canvasLegendEnabled;
    };

    public get errorInfoNetEnabled() {
        return this._errorInfoNetEnabled;
    };

    public get errorInfoSeqEnabled() {
        return this._errorInfoSeqEnabled;
    };

    public get errorNetButton() {
        return (this._errorInNet && (!(this._errorInfoNetEnabled)));
    };

    public get errorSeqButton() {
        return (this._errorInSequence && (!(this._errorInfoSeqEnabled)));
    };

    public get exampleFilesEnabled() {
        return this._exampleFilesEnabled;
    };

    public get noAutorun() {
        return (!(this._autorunActive));
    };

    /* methods - other */

    public async init() {
        if (this.settingsService.state.tutorialIni === false) {
            let noCookie : boolean = true;
            const decodedCookieString = decodeURIComponent(document.cookie);
            const cookieArray = decodedCookieString.split(';');
            for(const cookie of cookieArray) {
                cookie.trim();
                if (cookie.indexOf('sound.ts=') === 0) {
                    noCookie = false;
                    break;
                };
            };
            if (noCookie) {
                const skipTutorials : boolean = await this.popupService.tutorial();
                if (skipTutorials) {
                    document.cookie = 'sound.ts=i,e,l,r; expires=session; path=/';
                } else {
                    document.cookie = 'sound.ts=i; expires=session; path=/';
                };
            };
            this.settingsService.update({tutorialIni : true});
        };
    };

    public clearFileArea() : void {
        this._fileAreaFc.setValue(undefined);
    };

    public processSourceChange(inSourceData : {fileType: string, fileContent: string}) : void {
        this.settingsService.update({dataLoaded : true});
        this._fileAreaFc.setValue(inSourceData.fileContent);
        let parsedContent : (Net | undefined);
        switch (inSourceData.fileType) {
            case 'json' : {
                parsedContent = this.fileParserService.parse(inSourceData.fileContent, 'json');
                break;
            }
            case 'pnml' : {
                parsedContent = this.fileParserService.parse(inSourceData.fileContent, 'pnml');
                break;
            }
            case 'sav' : {
                parsedContent = this.fileParserService.parse(inSourceData.fileContent, 'sav');
                break;
            }
            case 'txt' : {
                parsedContent = this.fileParserService.parse(inSourceData.fileContent, 'txt');
                break;
            }
            default : {
                switch (this.settingsService.state.notifyInfo) {
                    case 'dialog' : {
                        this.popupService.info([{
                            style : 'margin-top:10px;margin-left:10px;',
                            content : 'valid types are:'
                        }, {
                            style : 'text-align:right;margin-top:0px;margin-right:5px;margin-bottom:0px;color:darkgrey;',
                            content : '.pnml'
                        }, {
                            style : 'text-align:right;margin-top:0px;margin-right:5px;margin-bottom:0px;color:darkgrey;',
                            content : '.json'
                        }, {
                            style : 'text-align:right;margin-top:0px;margin-right:5px;margin-bottom:0px;color:darkgrey;',
                            content : '.sav'
                        }, {
                            style : 'text-align:right;margin-top:0px;margin-right:5px;margin-bottom:0px;color:darkgrey;',
                            content : '.txt'
                        }], 'Invalid Input File Type (.' + inSourceData.fileType + ')');
                        break;
                    }
                    case 'popup' : {
                        window.alert('Invalid Input File Type - valid types are: ' + '\n' + '\n' + '   .pnml' + '\n' + '   .json' + '\n' + '   .sav' + '\n' + '   .txt');
                        break;
                    }
                    case 'toast' : {
                        this.toastService.showPanel('info', ['Invalid Input File Type - valid types are: ', '.json', '.pnml', '.sav', '.txt']);
                        break;
                    }
                };
            }
        };
        this.displayService.updateData(parsedContent);
    };

};