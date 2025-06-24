import {Component, EventEmitter, OnDestroy, Output} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {MatButtonModule} from '@angular/material/button';
import {MatButtonToggleModule} from '@angular/material/button-toggle';
import {MatCheckboxModule} from '@angular/material/checkbox';
import {MatDividerModule} from '@angular/material/divider';
import {MatIconModule} from '@angular/material/icon';
import {MatInputModule} from '@angular/material/input';
import {MatMenuModule} from '@angular/material/menu';
import {MatSliderModule} from '@angular/material/slider';
import {MatTooltipModule} from '@angular/material/tooltip';
import {RouterLink} from '@angular/router';

import {Subscription, take} from 'rxjs';

import {DisplayService} from '../../services/visualization/display.service';
import {FileReaderService} from '../../services/io/file-reader.service';
import {FileWriterService} from '../../services/io/file-writer.service';
import {PopupService} from '../../services/notifications/popup.service';
import {SettingsService} from '../../services/config/settings.service';
import {SimulationService} from '../../services/logic/simulation.service';

@Component({
    selector: 'menu-bar',
    templateUrl: './menu-bar.component.html',
    styleUrls: ['./menu-bar.component.css'],
    standalone: true,
    imports: [
        FormsModule,
        MatButtonModule,
        MatButtonToggleModule,
        MatCheckboxModule,
        MatDividerModule,
        MatIconModule,
        MatInputModule,
        MatMenuModule,
        MatSliderModule,
        MatTooltipModule,
        RouterLink,
    ]
})
export class MenuBarComponent implements OnDestroy {

    /* properties */

    @Output('fileData') fileData : EventEmitter<{fileType : string, fileContent : string}>;

    /* attributes - own */

    private readonly _netSubscription : Subscription;
    
    private readonly _settingsSubscription : Subscription;
    
    private readonly _simulationSubscription : Subscription;

    private _netEmpty : boolean;
    private _noWorkflow : boolean;

    private _autorunActive : boolean;

    private _displayMode : ('default' | 'traveled' | 'errors');

    private _exampleFilesEnabled : boolean;

    private _showArcWeights : boolean;
    private _showNodeInfos : boolean;
    private _showPlaceIds : boolean;
    private _showPlaceLabels : boolean;
    private _showPlaceMarkings : boolean;
    private _showTransitionIds : boolean;
    private _showTransitionLabels : boolean;
    private _showTransitionTags : boolean;

    private _switchOnError : boolean;
    private _switchOnLoadF : boolean;
    private _switchOnLoadL : boolean;
    private _switchOnRun : boolean;

    private _embedderEnabled : boolean;
    private _embedderExemptions : boolean;
    private _embedderTethering : ('loose' | 'balanced' | 'tight');

    private _notifyError : ('dialog' | 'popup' | 'toast');
    private _notifyConfirm : ('dialog' | 'popup' | 'none');
    private _notifyInfo : ('dialog' | 'popup' | 'toast' | 'none');

    private _strictWorkflowChecks : boolean;

    private _outIdPrefix : number = 0;
    private _outIdSuffix : number = 0;

    private _sliderValue : number;

    /* methods - constructor */

    constructor(
        private readonly displayService : DisplayService,
        private readonly fileReaderService : FileReaderService,
        private readonly fileWriterService : FileWriterService,
        private readonly popupService : PopupService,
        private readonly settingsService : SettingsService,
        private readonly simulationService : SimulationService,
    ) {
        this.fileData = new EventEmitter<{fileType : string, fileContent : string}>();
        this._autorunActive = this.settingsService.state.autorunExec;
        this._displayMode = this.settingsService.state.displayMode;
        this._embedderEnabled = this.settingsService.state.springEmbedderEnabled;
        this._embedderExemptions = this.settingsService.state.springEmbedderExemptions;
        this._embedderTethering = this.settingsService.state.springEmbedderTethering;
        this._exampleFilesEnabled = this.settingsService.state.exampleFilesEnabled;
        this._notifyError = this.settingsService.state.notifyError;
        this._notifyConfirm = this.settingsService.state.notifyConfirm;
        this._notifyInfo = this.settingsService.state.notifyInfo;
        this._showArcWeights = this.settingsService.state.showArcWeights;
        this._showNodeInfos = this.settingsService.state.showNodeInfos;
        this._showPlaceIds = this.settingsService.state.showPlaceIds;
        this._showPlaceLabels = this.settingsService.state.showPlaceLabels;
        this._showPlaceMarkings = this.settingsService.state.showPlaceMarkings;
        this._showTransitionIds = this.settingsService.state.showTransitionIds;
        this._showTransitionLabels = this.settingsService.state.showTransitionLabels;
        this._showTransitionTags = this.settingsService.state.showTransitionTags;
        this._strictWorkflowChecks = this.settingsService.state.strictWorkflowChecks;
        this._switchOnError = this.settingsService.state.switchDisplayModeOnError;
        this._switchOnLoadF = this.settingsService.state.switchDisplayModeOnLoadFromFile;
        this._switchOnLoadL = this.settingsService.state.switchDisplayModeOnLoadFromLog;
        this._switchOnRun = this.settingsService.state.switchDisplayModeOnRun;
        this._settingsSubscription = this.settingsService.state$.subscribe(
            (state) => {
                if (this._autorunActive !== state.autorunExec) {
                    this._autorunActive = state.autorunExec;
                };
                if (this._displayMode !== state.displayMode) {
                    this._displayMode = state.displayMode;
                };
                if (this._embedderEnabled !== state.springEmbedderEnabled) {
                    this._embedderEnabled = state.springEmbedderEnabled;
                };
                if (this._embedderExemptions !== state.springEmbedderExemptions) {
                    this._embedderExemptions = state.springEmbedderExemptions;
                };
                if (this._embedderTethering !== state.springEmbedderTethering) {
                    this._embedderTethering = state.springEmbedderTethering;
                };
                if (this._exampleFilesEnabled !== state.exampleFilesEnabled) {
                    this._exampleFilesEnabled = state.exampleFilesEnabled;
                };
                if (this._notifyError !== state.notifyError) {
                    this._notifyError = state.notifyError;
                };
                if (this._notifyConfirm !== state.notifyConfirm) {
                    this._notifyConfirm = state.notifyConfirm;
                };
                if (this._notifyInfo !== state.notifyInfo) {
                    this._notifyInfo = state.notifyInfo;
                };
                if (this._showArcWeights !== state.showArcWeights) {
                    this._showArcWeights = state.showArcWeights;
                };
                if (this._showNodeInfos !== state.showNodeInfos) {
                    this._showNodeInfos = state.showNodeInfos;
                };
                if (this._showPlaceIds !== state.showPlaceIds) {
                    this._showPlaceIds = state.showPlaceIds;
                };
                if (this._showPlaceLabels !== state.showPlaceLabels) {
                    this._showPlaceLabels = state.showPlaceLabels;
                };
                if (this._showPlaceMarkings !== state.showPlaceMarkings) {
                    this._showPlaceMarkings = state.showPlaceMarkings;
                };
                if (this._showTransitionIds !== state.showTransitionIds) {
                    this._showTransitionIds = state.showTransitionIds;
                };
                if (this._showTransitionLabels !== state.showTransitionLabels) {
                    this._showTransitionLabels = state.showTransitionLabels;
                };
                if (this._showTransitionTags !== state.showTransitionTags) {
                    this._showTransitionTags = state.showTransitionTags;
                };
                if (this._switchOnError !== state.switchDisplayModeOnError) {
                    this._switchOnError = state.switchDisplayModeOnError;
                };
                if (this._switchOnLoadF !== state.switchDisplayModeOnLoadFromFile) {
                    this._switchOnLoadF = state.switchDisplayModeOnLoadFromFile;
                };
                if (this._switchOnLoadL !== state.switchDisplayModeOnLoadFromLog) {
                    this._switchOnLoadL = state.switchDisplayModeOnLoadFromLog;
                };
                if (this._switchOnRun !== state.switchDisplayModeOnRun) {
                    this._switchOnRun = state.switchDisplayModeOnRun;
                };
                if (this._strictWorkflowChecks !== state.strictWorkflowChecks) {
                    this._strictWorkflowChecks = state.strictWorkflowChecks;
                };
            }
        );
        this._noWorkflow = !this.simulationService.workflow;
        this._simulationSubscription  = this.simulationService.workflow$.subscribe(
            workflow => {
                if (this._noWorkflow === workflow) {
                    this._noWorkflow = !workflow;
                };
            }
        );
        this._netEmpty = this.displayService.net.empty;
        this._netSubscription  = this.displayService.net$.subscribe(
            net => {
                if (this._netEmpty !== net.empty) {
                    this._netEmpty = net.empty;
                };
                this._outIdPrefix++;
                this._outIdSuffix = 0;
            }
        );
        this._sliderValue = this.settingsService.state.autorunTime;
    };

    /* methods - on destroy */

    ngOnDestroy() : void {
        this._netSubscription.unsubscribe();
        this._settingsSubscription.unsubscribe();
        this._simulationSubscription.unsubscribe();
        this.fileData.complete();
    };

    /* methods - getters */

    public get autoRunActive() : boolean {
        return (this._autorunActive);
    };

    public get displayModeDefault() : boolean {
        return (this._displayMode === 'default');
    };

    public get displayModeTraveled() : boolean {
        return (this._displayMode === 'traveled');
    };

    public get displayModeErrors() : boolean {
        return (this._displayMode === 'errors');
    };

    public get embedderEnabled() : boolean {
        return (this._embedderEnabled);
    };

    public get embedderExemptions() : boolean {
        return (this._embedderExemptions);
    };

    public get embedderTetheringLoose() : boolean {
        return (this._embedderTethering === 'loose');
    };

    public get embedderTetheringBalanced() : boolean {
        return (this._embedderTethering === 'balanced');
    };

    public get embedderTetheringTight() : boolean {
        return (this._embedderTethering === 'tight');
    };

    public get exampleFilesEnabled() : boolean {
        return (this._exampleFilesEnabled);
    };

    public get notifyErrorDialog() : boolean {
        return (this._notifyError === 'dialog');
    };

    public get notifyErrorPopup() : boolean {
        return (this._notifyError === 'popup');
    };

    public get notifyErrorToast() : boolean {
        return (this._notifyError === 'toast');
    };

    public get notifyConfirmDialog() : boolean {
        return (this._notifyConfirm === 'dialog');
    };

    public get notifyConfirmPopup() : boolean {
        return (this._notifyConfirm === 'popup');
    };

    public get notifyConfirmNone() : boolean {
        return (this._notifyConfirm === 'none');
    };

    public get notifyInfoDialog() : boolean {
        return (this._notifyInfo === 'dialog');
    };

    public get notifyInfoPopup() : boolean {
        return (this._notifyInfo === 'popup');
    };

    public get notifyInfoToast() : boolean {
        return (this._notifyInfo === 'toast');
    };

    public get notifyInfoNone() : boolean {
        return (this._notifyInfo === 'none');
    };

    public get showArcWeights() : boolean {
        return (this._showArcWeights);
    };

    public get showNodeInfos() : boolean {
        return (this._showNodeInfos);
    };

    public get showPlaceIds() : boolean {
        return (this._showPlaceIds);
    };

    public get showPlaceLabels() : boolean {
        return (this._showPlaceLabels);
    };

    public get showPlaceMarkings() : boolean {
        return (this._showPlaceMarkings);
    };

    public get showTransitionIds() : boolean {
        return (this._showTransitionIds);
    };

    public get showTransitionLabels() : boolean {
        return (this._showTransitionLabels);
    };

    public get showTransitionTags() : boolean {
        return (this._showTransitionTags);
    };

    public get strictWorkflowChecks() : boolean {
        return (this._strictWorkflowChecks);
    };

    public get switchOnError() : boolean {
        return (this._switchOnError);
    };

    public get switchOnLoadF() : boolean {
        return (this._switchOnLoadF);
    };

    public get switchOnLoadL() : boolean {
        return (this._switchOnLoadL);
    };

    public get switchOnRun() : boolean {
        return (this._switchOnRun);
    };

    public get sliderValue() : number {
        return (this._sliderValue);
    };

    public get loadDisabled() : boolean {
        return (this._autorunActive);
    };

    public get loadTooltip() : string {
        if (this._autorunActive) {
            return 'sequence automation is active';
        } else {
            return '';
        };
    };

    public get saveMenuDisabled() : boolean {
        return this._autorunActive;
    };

    public get saveMenuTooltip() : string {
        if (this._autorunActive) {
            return 'sequence automation is active';
        } else {
            return '';
        };
    };

    public get saveDisabled() : boolean {
        if (this._netEmpty) {
            return true;
        } else if (this._noWorkflow) {
            return true;
        } else if (this._autorunActive) {
            return true;
        } else {
            return false;
        };
    };

    public get saveTooltip() : string {
        if (this._netEmpty) {
            return 'net is empty';
        } else if (this._noWorkflow) {
            return 'net is not a workflow net';
        } else if (this._autorunActive) {
            return 'sequence automation is active';
        } else {
            return '';
        };
    };

    public get exportDisabled() : boolean {
        if (this._netEmpty) {
            return true;
        } else if (this._autorunActive) {
            return true;
        } else {
            return false;
        };
    };

    public get exportTooltip() : string {
        if (this._netEmpty) {
            return 'net is empty';
        } else if (this._autorunActive) {
            return 'sequence automation is active';
        } else {
            return '';
        };
    };

    public get deleteDisabled() : boolean {
        if (this._netEmpty) {
            return true;
        } else if (this._autorunActive) {
            return true;
        } else {
            return false;
        };
    };

    public get deleteTooltip() : string {
        if (this._netEmpty) {
            return 'net is empty';
        } else if (this._autorunActive) {
            return 'sequence automation is active';
        } else {
            return '';
        };
    };

    public get resetDisabled() : boolean {
        if (this._netEmpty) {
            return true;
        } else if (this._autorunActive) {
            return true;
        } else if (this.simulationService.initializedState) {
            return true;
        } else {
            return false;
        };
    };

    public get resetTooltip() : string {
        if (this._netEmpty) {
            return 'net is empty';
        } else if (this._autorunActive) {
            return 'sequence automation is active';
        } else if (this.simulationService.initializedState) {
            return 'net is already in initial state';
        } else {
            return '';
        };
    };

    public get undoDisabled() : boolean {
        if (this._netEmpty) {
            return true;
        } else if (this._noWorkflow) {
            return true;
        } else if (this._autorunActive) {
            return true;
        } else if (this.displayService.net.nextSequenceEntry < 1) {
            return true;
        } else {
            return false;
        };
    };

    public get undoTooltip() : string {
        if (this._netEmpty) {
            return 'net is empty';
        } else if (this._noWorkflow) {
            return 'net is not a workflow net';
        } else if (this._autorunActive) {
            return 'sequence automation is active';
        } else if (this.displayService.net.nextSequenceEntry < 1) {
            return 'no last step to undo';
        } else {
            return '';
        };
    };

    public get redoDisabled() : boolean {
        if (this._netEmpty) {
            return true;
        } else if (this._noWorkflow) {
            return true;
        } else if (this._autorunActive) {
            return true;
        } else if (this.displayService.net.nextSequenceEntry >= this.displayService.net.activeSequence.length) {
            return true;
        } else {
            return false;
        };
    };

    public get redoTooltip() : string {
        if (this._netEmpty) {
            return 'net is empty';
        } else if (this._noWorkflow) {
            return 'net is not a workflow net';
        } else if (this._autorunActive) {
            return 'sequence automation is active';
        } else if (this.displayService.net.nextSequenceEntry >= this.displayService.net.activeSequence.length) {
            return 'no next step to redo';
        } else {
            return '';
        };
    };

    public get autorunDisabled() : boolean {
        if (this._netEmpty) {
            return true;
        } else if (this._noWorkflow) {
            return true;
        } else {
            return false;
        };
    };

    public get autorunTooltip() : string {
        if (this._netEmpty) {
            return 'net is empty';
        } else if (this._noWorkflow) {
            return 'net is not a workflow net';
        } else if (this._autorunActive) {
            return '';
        } else {
            return 'generates random firing sequences by repeatedly choosing an enabled transition at random and then firing it (algorithm loops until stopped)';
            // return 'repeatedly chooses a random enabled transition and fires it (will loop until stopped)';
        };
    };

    public get embedderTooltip() : string {
        if (this._embedderEnabled) {
            return 'toggle to freely arrange nodes';
        } else {
            return 'toggle to algorithmically arrange nodes';
        };
    };

    public get focusDisabled() : boolean {
        if (this._netEmpty) {
            return true;
        } else {
            return false;
        };
    };

    public get focusTooltip() : string {
        if (this._netEmpty) {
            return 'net is empty';
        } else {
            return 'focus the canvas view on the currently displayed net';
        };
    };

    public get layoutDisabled() : boolean {
        if (this._netEmpty) {
            return true;
        } else {
            return false;
        };
    };

    public get layoutTooltip() : string {
        if (this._netEmpty) {
            return 'net is empty';
        } else {
            return 'try to force the source places to the left and the sink places to the right';
        };
    };

    public get embedderExemptionsTooltip() : string {
        if (this.embedderExemptions) {
            return 'dragged nodes are exempt from algorithmic arrangement';
        } else {
            return 'all nodes are algorithmically arranged';
        };
    };

    /* methods - setters */

    public set sliderValue(inValue : number) {
        this._sliderValue = inValue;
        this.settingsService.update({autorunTime : inValue});
    };

    /* methods - other */
    
    public preventPropagation(event : Event) : void {
        event.stopPropagation();
    };
    
    public processFileSelection(event : any) : void {
        if (event.target.files !== undefined) {
            if (event.target.files[0] !== undefined) {
                if (event.target.files[0].type !== undefined) {
                    this.readInput(event.target.files);
                };
            };
        };
    };

    public processSaveAction(inFileType : ('json' | 'pnml' | 'sav' | 'txt')) : void {
        let fileName : string = 'saved_net_' + this._outIdPrefix + '.' + this._outIdSuffix;
        switch (inFileType) {
            case 'json' : {
                this.fileWriterService.writeToJSON(fileName, this.displayService.net);
                break;
            }
            case 'pnml' : {
                this.fileWriterService.writeToPNML(fileName, this.displayService.net);
                break;
            }
            case 'sav' : {
                this.fileWriterService.writeToSAV(fileName, this.displayService.net);
                break;
            }
            case 'txt' : {
                this.fileWriterService.writeToTXT(fileName, this.displayService.net);
                break;
            }
        };
        this._outIdSuffix++;
    };

    public processDeleteAction() : void {
        this.displayService.deleteData();
    };

    public processResetAction() : void {
        this.simulationService.resetMarking();
    };

    public processAutoAction() : void {
        if (this.settingsService.state.autorunExec) {
            if (!(this.settingsService.state.autorunStop)) {
                this.settingsService.update({autorunStop : true});
            };
        } else {
            this.simulationService.executeRandomSequence();
        };
    };

    public processUndoAction() : void {
        this.simulationService.undoSequenceEntry();
    };

    public processRedoAction() : void {
        this.simulationService.redoSequenceEntry();
    };

    public processModeSelection(inSelection : ('D' | 'T' | 'E')) : void {
        switch (inSelection) {
            case 'D' : {
                if (this.settingsService.state.displayMode !== 'default') {
                    this.settingsService.update({displayMode : 'default'});
                };
                break;
            }
            case 'T' : {
                if (this.settingsService.state.displayMode !== 'traveled') {
                    this.settingsService.update({displayMode : 'traveled'});
                };
                break;
            }
            case 'E' : {
                if (this.settingsService.state.displayMode !== 'errors') {
                    this.settingsService.update({displayMode : 'errors'});
                };
                break;
            }
        };
    };

    public processElementSelection(inSelection : ('AW' | 'NI' | 'PI' | 'PL' | 'PM' | 'TI' | 'TL' | 'TT'), inValue : boolean) : void {
        switch (inSelection) {
            case 'AW' : {
                if (this.settingsService.state.showArcWeights !== inValue) {
                    this.settingsService.update({showArcWeights : inValue});
                };
                break;
            }
            case 'NI' : {
                if (this.settingsService.state.showNodeInfos !== inValue) {
                    this.settingsService.update({showNodeInfos : inValue});
                };
                break;
            }
            case 'PI' : {
                if (this.settingsService.state.showPlaceIds !== inValue) {
                    if ((inValue) && (this.settingsService.state.showPlaceLabels)) {
                        this.settingsService.update({
                            showPlaceIds : inValue,
                            showPlaceLabels : !inValue
                        });
                    } else {
                        this.settingsService.update({showPlaceIds : inValue});
                    };
                };
                break;
            }
            case 'PL' : {
                if (this.settingsService.state.showPlaceLabels !== inValue) {
                    if ((inValue) && (this.settingsService.state.showPlaceIds)) {
                        this.settingsService.update({
                            showPlaceIds : !inValue,
                            showPlaceLabels : inValue
                        });
                    } else {
                        this.settingsService.update({showPlaceLabels : inValue});
                    };
                };
                break;
            }
            case 'PM' : {
                if (this.settingsService.state.showPlaceMarkings !== inValue) {
                    this.settingsService.update({showPlaceMarkings : inValue});
                };
                break;
            }
            case 'TI' : {
                if (this.settingsService.state.showTransitionIds !== inValue) {
                    if ((inValue) && (this.settingsService.state.showTransitionLabels)) {
                        this.settingsService.update({
                            showTransitionIds : inValue,
                            showTransitionLabels : !inValue
                        });
                    } else {
                        this.settingsService.update({showTransitionIds : inValue});
                    };
                };
                break;
            }
            case 'TL' : {
                if (this.settingsService.state.showTransitionLabels !== inValue) {
                    if ((inValue) && (this.settingsService.state.showTransitionIds)) {
                        this.settingsService.update({
                            showTransitionIds : !inValue,
                            showTransitionLabels : inValue
                        });
                    } else {
                        this.settingsService.update({showTransitionLabels : inValue});
                    };
                };
                break;
            }
            case 'TT' : {
                if (this.settingsService.state.showTransitionTags !== inValue) {
                    this.settingsService.update({showTransitionTags : inValue});
                };
                break;
            }
        };
    };

    public processEmbedderAction() : void {
        this.settingsService.update({springEmbedderEnabled : (!(this.embedderEnabled))});
    };

    public processFocusAction() : void {
        if (this.displayService.canvas) {
            this.displayService.canvas.focusViewBox();
        };
    };

    public processLayoutAction() : void {
        if (this.displayService.canvas) {
            this.displayService.canvas.forceLayout();
        };
    };

    public processChangeSelection(inSelection : ('E' | 'F' | 'L' | 'R'), inValue : boolean) : void {
        switch (inSelection) {
            case 'E' : {
                if (this.settingsService.state.switchDisplayModeOnError !== inValue) {
                    this.settingsService.update({switchDisplayModeOnError : inValue});
                };
                break;
            }
            case 'F' : {
                if (this.settingsService.state.switchDisplayModeOnLoadFromFile !== inValue) {
                    this.settingsService.update({switchDisplayModeOnLoadFromFile : inValue});
                };
                break;
            }
            case 'L' : {
                if (this.settingsService.state.switchDisplayModeOnLoadFromLog !== inValue) {
                    this.settingsService.update({switchDisplayModeOnLoadFromLog : inValue});
                };
                break;
            }
            case 'R' : {
                if (this.settingsService.state.switchDisplayModeOnRun !== inValue) {
                    this.settingsService.update({switchDisplayModeOnRun : inValue});
                };
                break;
            }
        };
    };

    public processEmbedderUniversalAction(inValue : boolean) : void {
        if (this.settingsService.state.springEmbedderExemptions !== inValue) {
            this.settingsService.update({springEmbedderExemptions : inValue});
        };
    };

    public processTetheringSelection(inSelection : ('L' | 'B' | 'T')) : void {
        switch (inSelection) {
            case 'L' : {
                if (this.settingsService.state.springEmbedderTethering !== 'loose') {
                    this.settingsService.update({springEmbedderTethering : 'loose'});
                };
                break;
            }
            case 'B' : {
                if (this.settingsService.state.springEmbedderTethering !== 'balanced') {
                    this.settingsService.update({springEmbedderTethering : 'balanced'});
                };
                break;
            }
            case 'T' : {
                if (this.settingsService.state.springEmbedderTethering !== 'tight') {
                    this.settingsService.update({springEmbedderTethering : 'tight'});
                };
                break;
            }
        };
    };

    public processChecksAction() : void {
        this.settingsService.update({strictWorkflowChecks : (!(this._strictWorkflowChecks))});
        this.simulationService.retest();
    };

    public processExampleAction() : void {
        this.settingsService.update({exampleFilesEnabled : (!(this._exampleFilesEnabled))});
    };

    public processNotificationSelection(inSelection : ('ED' | 'EP' | 'ET' | 'CD' | 'CP' | 'CN' | 'ID' | 'IP' | 'IT' | 'IN')) : void {
        switch (inSelection) {
            case 'ED' : {
                if (this.settingsService.state.notifyError !== 'dialog') {
                    this.settingsService.update({notifyError : 'dialog'});
                };
                break;
            }
            case 'EP' : {
                if (this.settingsService.state.notifyError !== 'popup') {
                    this.settingsService.update({notifyError : 'popup'});
                };
                break;
            }
            case 'ET' : {
                if (this.settingsService.state.notifyError !== 'toast') {
                    this.settingsService.update({notifyError : 'toast'});
                };
                break;
            }
            case 'CD' : {
                if (this.settingsService.state.notifyConfirm !== 'dialog') {
                    this.settingsService.update({notifyConfirm : 'dialog'});
                };
                break;
            }
            case 'CP' : {
                if (this.settingsService.state.notifyConfirm !== 'popup') {
                    this.settingsService.update({notifyConfirm : 'popup'});
                };
                break;
            }
            case 'CN' : {
                if (this.settingsService.state.notifyConfirm !== 'none') {
                    this.settingsService.update({notifyConfirm : 'none'});
                };
                break;
            }
            case 'ID' : {
                if (this.settingsService.state.notifyInfo !== 'dialog') {
                    this.settingsService.update({notifyInfo : 'dialog'});
                };
                break;
            }
            case 'IP' : {
                if (this.settingsService.state.notifyInfo !== 'popup') {
                    this.settingsService.update({notifyInfo : 'popup'});
                };
                break;
            }
            case 'IT' : {
                if (this.settingsService.state.notifyInfo !== 'toast') {
                    this.settingsService.update({notifyInfo : 'toast'});
                };
                break;
            }
            case 'IN' : {
                if (this.settingsService.state.notifyInfo !== 'none') {
                    this.settingsService.update({notifyInfo : 'none'});
                };
                break;
            }
        };
    };

    private readInput(inList : (FileList | undefined | null)) : void {
        if ((inList === undefined) || (inList === null) || (inList.length === 0)) {
            return;
        };
        const fileType : (string | undefined) = inList[0].name.split('.').pop();
        if (fileType !== undefined) {
            this.fileReaderService.readFile(inList[0]).pipe(take(1)).subscribe(
                fileContent => {
                    this.emitFileData(fileType, fileContent);
                }
            );
        } else {
            this.popupService.error('cmp.mbr.rdi.000', 'failed to read input', 'consider checking format and content of the input file');
            console.error('Error: #cmp.mbr.rdi.000: ' + 'reading from input list failed - filetype was assigned "undefined"');
            console.error('Input: ', inList[0]);
        };
    };

    private emitFileData(inFileType : (string | undefined), inFileContent : (string | undefined)) : void {
        if ((inFileType === undefined) || (inFileContent === undefined)) {
            return;
        }
        this.fileData.emit({fileType : inFileType, fileContent : inFileContent});
    };

};