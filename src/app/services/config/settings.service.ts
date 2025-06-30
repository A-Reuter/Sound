import {Injectable} from '@angular/core';

import {BehaviorSubject, Observable} from 'rxjs';

export interface Settings {
    /** 
     * specifies whether the automated firing sequence execution is active
     */
    autorunExec : boolean;
    /** 
     * specifies whether the automated firing sequence execution is to be deactivated after completion of the next iteration
     */
    autorunStop : boolean;
    /** 
     * specifies the amount of time the automated firing sequence execution idles after each firing action before executing the next
     */
    autorunTime : number;
    /** 
     * specifies whether the panel displaying the canvas color legend is visible
     */
    canvasLegendEnabled : boolean;
    /** 
     * specifies whether data has been loaded from a file
     */
    dataLoaded : boolean;
    /** 
     * specifies the way a petri net is displayed on the canvas
     * @value 'default'  : highlights source and sink places aswell as enabled transitions
     * @value 'traveled' : highlights parts of the net present within the sequence log or the active firing sequence
     * @value 'errors'   : highlights parts of the net that are directly or indirectly tied to the invalidity of a net marking
     */
    displayMode : ('default' | 'traveled' | 'errors');
    /** 
     * specifies whether the panel displaying information about previously encountered errors is visible
     */
    errorInfoNetEnabled : boolean;
    /** 
     * specifies whether the panel displaying additional information about an error within the active sequence is visible
     */
    errorInfoSeqEnabled : boolean;
    /** 
     * specifies whether an error has been found within the net
     */
    errorInNet : boolean;
    /** 
     * specifies whether an error has occurred within the active sequence
     */
    errorInSequence : boolean;
    /** 
     * specifies whether the prepared example files are visible
     */
    exampleFilesEnabled : boolean;
    /** 
     * specifies whether additional checks to verify the integrity of the internal net model are performed at certain points
     * @value 'safe' : additional checks are performed, increasing execution time
     * @value 'fast' : additional checks are skipped to decrease execution time
     */
    executionMode : ('safe' | 'fast');
    /** 
     * specifies whether it is possible to fire enabled transitions
     */
    firingEnabled : boolean;
    /** 
     * specifies whether all aplace markings below one are hidden
     */
    hideLowMarkings : boolean;
    /** 
     * specifies whether all arc weights below two are hidden
     */
    hideLowWeights : boolean;
    /** 
     * specifies the way the user is approached to confirm an action
     * @value 'dialog' : shows a dialog window
     * @value 'popup'  : shows a popup window
     * @value 'none'   : shows no window (the action is confirmed automatically)
     */
    notifyConfirm : ('dialog' | 'popup' | 'none');
    /** 
     * specifies the way the user is notified about the occurrence of any expected, yet unsolvable software malfunction
     * @value 'dialog' : shows a dialog window
     * @value 'popup'  : shows a popup window
     * @value 'toast'  : shows a toast message
     */
    notifyError : ('dialog' | 'popup' | 'toast');
    /** 
     * specifies the way the user is presented important information
     * @value 'dialog' : shows a dialog window
     * @value 'popup'  : shows a popup window
     * @value 'toast'  : shows a toast message
     * @value 'none'   : shows no info
     */
    notifyInfo : ('dialog' | 'popup' | 'toast' | 'none');
    /** 
     * specifies whether the current firing sequence has terminated
     */
    sequenceTerminated : boolean;
    /** 
     * specifies whether the arc weights of a petri net displayed on the canvas are shown
     */
    showArcWeights : boolean;
    /** 
     * specifies whether the node information panels of a petri net displayed on the canvas are shown
     */
    showNodeInfos : boolean;
    /** 
     * specifies whether the place ids of a petri net displayed on the canvas are shown
     */
    showPlaceIds : boolean;
    /** 
     * specifies whether the place labels of a petri net displayed on the canvas are shown
     */
    showPlaceLabels : boolean;
    /** 
     * specifies whether the place markings of a petri net displayed on the canvas are shown
     */
    showPlaceMarkings : boolean;
    /** 
     * specifies whether the transition ids of a petri net displayed on the canvas are shown
     */
    showTransitionIds : boolean;
    /** 
     * specifies whether the transition labels of a petri net displayed on the canvas are shown
     */
    showTransitionLabels : boolean;
    /** 
     * specifies whether the transition tags of a petri net displayed on the canvas are shown
     */
    showTransitionTags : boolean;
    /** 
     * specifies whether the elements of a petri net displayed on the canvas are automatically arranged by the spring embedder algorithm
     */
    springEmbedderEnabled : boolean;
    /** 
     * specifies whether the spring embedder is applied to all or just most elements of a petri net displayed on the canvas
     * @value 'true'  : elements that are being dragged across the canvas by the user are exempt from being affected by the spring embedder
     * @value 'false' : the spring embedder is universally applied to all net elements
     */
    springEmbedderExemptions : boolean;
    /** 
     * specifies the degree to which nodes of a petri net are tethered together by the spring embedder algorithm
     */
    springEmbedderTethering : ('loose' | 'balanced' | 'tight');
    /** 
     * specifies whether additional tests are applied when checking if a given petri net is a workflow net
     * @value 'true'  : additional tests are applied, narrowing the workflow net definition down
     * @value 'false' : only the tests pertaining to the original workflow net definition are applied
     */
    strictWorkflowChecks : boolean;
    /** 
     * specifies whether the display mode is automatically switched to the 'errors' setting when an invalid marking is encountered
     */
    switchDisplayModeOnError : boolean;
    /** 
     * specifies whether the display mode is automatically switched to the 'default' setting when a new net is loaded
     */
    switchDisplayModeOnLoadFromFile : boolean;
    /** 
     * specifies whether the display mode is automatically switched to the 'traveled' setting when a log sequence is loaded
     */
    switchDisplayModeOnLoadFromLog : boolean;
    /** 
     * specifies whether the display mode is automatically switched to the 'traveled' setting when the firing sequence automation is enabled
     */
    switchDisplayModeOnRun : boolean;
    /** 
     * specifies whether the error tutorial has been displayed before
     */
    tutorialErr : boolean;
    /** 
     * specifies whether the initial tutorial has been displayed before
     */
    tutorialIni : boolean;
    /** 
     * specifies whether the log tutorial has been displayed before
     */
    tutorialLog : boolean;
    /** 
     * specifies whether the auto run tutorial has been displayed before
     */
    tutorialRun : boolean;
};

@Injectable({
    providedIn: 'root'
})
export class SettingsService {

    /* attributes - own*/

    private readonly _stateSubject = new BehaviorSubject<Settings>({
        autorunExec                     : false,
        autorunStop                     : false,
        autorunTime                     : 1000,
        canvasLegendEnabled             : false,
        dataLoaded                      : false,
        displayMode                     : 'default',
        errorInfoNetEnabled             : false,
        errorInfoSeqEnabled             : false,
        errorInNet                      : false,
        errorInSequence                 : false,
        exampleFilesEnabled             : true,
        executionMode                   : 'safe',
        firingEnabled                   : false,
        hideLowMarkings                 : true,
        hideLowWeights                  : true,
        notifyConfirm                   : 'dialog',
        notifyError                     : 'dialog',
        notifyInfo                      : 'dialog',
        sequenceTerminated              : false,
        showArcWeights                  : true,
        showNodeInfos                   : false,
        showPlaceIds                    : false,
        showPlaceLabels                 : false,
        showPlaceMarkings               : true,
        showTransitionIds               : false,
        showTransitionLabels            : false,
        showTransitionTags              : true,
        springEmbedderEnabled           : false,
        springEmbedderExemptions        : true,
        springEmbedderTethering         : 'balanced',
        strictWorkflowChecks            : false,
        switchDisplayModeOnError        : true,
        switchDisplayModeOnLoadFromFile : true,
        switchDisplayModeOnLoadFromLog  : true,
        switchDisplayModeOnRun          : true,
        tutorialErr                     : false,
        tutorialIni                     : false,
        tutorialLog                     : false,
        tutorialRun                     : false,
    });

    private readonly _state$ : Observable<Settings> = this._stateSubject.asObservable();

    /* methods - getters */
    
    public get state() : Settings {
        return this._stateSubject.getValue();
    };
    
    public get state$() : Observable<Settings> {
        return this._state$
    };

    /* methods - other */

    update(newState : Partial<Settings>) : void {
        const updatedState = { ...this.state, ...newState };
        this._stateSubject.next(updatedState);
    };
    
};