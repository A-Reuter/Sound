import {Injectable, OnDestroy} from '@angular/core';

import {BehaviorSubject, Observable, Subscription} from 'rxjs';

import {Arc} from '../../classes/net-representation/arc';
import {Net} from '../../classes/net-representation/net';
import {Place} from '../../classes/net-representation/place';
import {Transition} from '../../classes/net-representation/transition';
import {ErrorInfo, ErrorItemBucket, ErrorParagraph} from '../../classes/error-info/error-info';

import {LogComponent} from '../../components/log/log.component';

import {DisplayService} from '../visualization/display.service';
import {PopupService} from '../notifications/popup.service';
import {SettingsService} from '../config/settings.service';
import {SvgService} from '../visualization/svg.service';
import {ToastService} from '../notifications/toast.service';


@Injectable({
    providedIn: 'root'
})
export class SimulationService implements OnDestroy {

    /* attributes - references */

    private logComponent : (LogComponent | undefined);

    private net : Net = new Net();

    /* attributes - own */

    private readonly _netSubscription : Subscription;

    private readonly _defaultErrorInfo = (new ErrorInfo([new ErrorParagraph('(no info available)', [])]));
    private readonly _errorInfoSubject = (new BehaviorSubject<ErrorInfo>(this._defaultErrorInfo));
    private readonly _errorInfo$: Observable<ErrorInfo> = this._errorInfoSubject.asObservable();

    private readonly _errorsSubject = (new BehaviorSubject<{nSeq:number,iSeq:number,dTrs:number}>({nSeq:0,iSeq:0,dTrs:0}));
    private readonly _errors$: Observable<{nSeq:number,iSeq:number,dTrs:number}> = this._errorsSubject.asObservable();

    private readonly _workflowSubject = (new BehaviorSubject<boolean>(false));
    private readonly _workflow$: Observable<boolean> = this._workflowSubject.asObservable();

    private _foundError : ('noTermination' | 'invalidTermination' | 'deadTransitions' | 'noError') = 'noError';

    private _strictWorkflowChecksEnabled : boolean;
    private _workflowInvalidArcs : Arc[] = [];

    private _deadTransitions : Transition[] = [];

    private _modeAutoChanged : boolean = false;
    private _previousMode : ('default' | 'traveled' | 'errors') = 'default';

    private _lastResult : ({sequenceTerminated : boolean, validMarking : boolean} | undefined) = undefined;

    private _currentlyEnabled : Transition[] = [];

    private _initializedState : boolean = false;

    /* methods : constructor */

    public constructor(
        private readonly displayService : DisplayService,
        private readonly popupService : PopupService,
        private readonly settingsService : SettingsService,
        private readonly svgService : SvgService,
        private readonly toastService : ToastService,
    ) {
        this._strictWorkflowChecksEnabled = this.settingsService.state.strictWorkflowChecks;
        this._netSubscription = this.displayService.net$.subscribe(
            net => {
                this.net = this.displayService.net;
                this.settingsService.update({
                    errorInfoNetEnabled : false,
                    errorInfoSeqEnabled : false, 
                    errorInSequence : false, 
                    firingEnabled : false, 
                    sequenceTerminated : false
                });
                if ((this.net.errors.nSeq > 0) || (this.net.errors.iSeq > 0) || (this.net.errors.dTrs > 0)) {
                    this.settingsService.update({errorInNet : true});
                } else {
                    this.settingsService.update({errorInNet : false});
                };
                if (this.settingsService.state.switchDisplayModeOnLoadFromFile) {
                    this.settingsService.update({displayMode : 'default'});
                };
                this._errorInfoSubject.next(this._defaultErrorInfo);
                this._errorsSubject.next(this.net.errors);
                this._foundError = 'noError';
                this._workflowInvalidArcs = [];
                this._deadTransitions = [];
                if (this.net.empty) {
                    this._currentlyEnabled = [];
                    this._initializedState = true;
                    this._lastResult = undefined;
                } else {
                    this.setSpecialPlaces();
                    const workflow : boolean = this.testWorkflow();
                    if (workflow) {
                        this._deadTransitions = this.testCoverability().dead;
                        this.testMarking();
                    } else {
                        this.testEnabled();
                        this.testInitialMarking();
                    };
                };
            }
        );
    };

    /* methods - on destroy */

    ngOnDestroy() : void {
        this._netSubscription.unsubscribe();
    };

    /* methods - getters */

    public get errorInfo() : ErrorInfo {
        return this._errorInfoSubject.getValue();
    };

    public get errorInfo$() : Observable<ErrorInfo> {
        return this._errorInfo$;
    };
        
    public get errors() : {nSeq:number,iSeq:number,dTrs:number} {
        return this._errorsSubject.getValue();
    };
        
    public get errors$() : Observable<{nSeq:number,iSeq:number,dTrs:number}> {
        return this._errors$
    };
        
    public get workflow() : boolean {
        return this._workflowSubject.getValue();
    };
        
    public get workflow$() : Observable<boolean> {
        return this._workflow$
    };

    public get initializedState() : boolean {
        return this._initializedState;
    };

    /* methods : other */

    public registerLogComponent(inComponent : LogComponent) {
        this.logComponent = inComponent;
    };

    private setSpecialPlaces() : void {
        while (this.net.sourcePlaces.length > 0) {
            this.net.sourcePlaces.pop();
        };
        while (this.net.sinkPlaces.length > 0) {
            this.net.sinkPlaces.pop();
        };
        for (const place of this.net.places) {
            if (place.incoming.length === 0) {
                place.isSource = true;
                this.net.sourcePlaces.push(place);
            };
            if (place.outgoing.length === 0) {
                place.isSink = true;
                this.net.sinkPlaces.push(place);
            };
        };
    };

    private testInitialMarking() : boolean {
        if (this.net.activeSequence.length !== 0) {
            this._initializedState = false;
            return false;
        };
        if (this.net.nextSequenceEntry !== 0) {
            this._initializedState = false;
            return false;
        };
        if (this.net.unsavedSequence !== true) {
            this._initializedState = false;
            return false;
        };
        for (const place of this.net.places) {
            if (place.marking !== place.initialMarking) {
                this._initializedState = false;
                return false;
            };
        };
        this._initializedState = true;
        return true;
    };

    private testWorkflow() : boolean {
        let error : boolean = false;
        const errorArray : ErrorItemBucket[] = [];
        while (this._workflowInvalidArcs.length > 0) {
            const arc : (Arc | undefined) = this._workflowInvalidArcs.pop();
            if (arc) {
                this.svgService.setElementErrLvl1Flag(arc, false);
                this.svgService.setElementErrLvl2Flag(arc, false);
            };
        };
        /* check 1 & 2 - source places & sink places */
        let error1 : boolean = false;
        if (this.net.sourcePlaces.length !== 1) {
            error = true;
            error1 = true;
            if (this.net.sourcePlaces.length < 1) {
                errorArray.push(new ErrorItemBucket('text', ['', 'workflow check 1 failed: no source place detected'], true));
            } else {
                errorArray.push(new ErrorItemBucket('text', ['', 'workflow check 1 failed: more than one source place detected'], false));
                const errorItems : string[] = [];
                for (const source of this.net.sourcePlaces) {
                    errorItems.push('place with id \'' + source.id + '\'');
                    this.svgService.setElementErrLvl2Flag(source, true);
                };
                errorArray.push(new ErrorItemBucket('list', errorItems, true));
            };
        };
        if (!error1) {
            errorArray.push(new ErrorItemBucket('text', ['', 'workflow check 1 passed: net contains exactly one source place'], true));
        };
        let error2 : boolean = false;
        if (this.net.sinkPlaces.length !== 1) {
            error = true;
            error2 = true;
            if (this.net.sinkPlaces.length < 1) {
                errorArray.push(new ErrorItemBucket('text', ['', 'workflow check 2 failed: no sink place detected'], true));
            } else {
                errorArray.push(new ErrorItemBucket('text', ['', 'workflow check 2 failed: more than one sink place detected'], false));
                const errorItems : string[] = [];
                for (const sink of this.net.sinkPlaces) {
                    errorItems.push('place with id \'' + sink.id + '\'');
                    this.svgService.setElementErrLvl2Flag(sink, true);
                };
                errorArray.push(new ErrorItemBucket('list', errorItems, true));
            };
        };
        if (!error2) {
            errorArray.push(new ErrorItemBucket('text', ['', 'workflow check 2 passed: net contains exactly one sink place'], true));
        };
        /* check 3 - initial marking */
        if ((this.net.sourcePlaces.length !== 1) || (this.net.sinkPlaces.length !== 1)) {
            errorArray.push(new ErrorItemBucket('text', ['', 'workflow check 3 impossible: exactly one source place and one sink place required to check initial marking'], true));
        } else {
            let error3 : boolean = false;
            const source : Place = this.net.sourcePlaces[0];
            const invalidPlaces : Place[] = [];
            for (const place of this.net.places) {
                if (place !== source) {
                    if (place.initialMarking !== 0) {
                        invalidPlaces.push(place);
                    };
                } else {
                    if (place.initialMarking !== 1) {
                        invalidPlaces.push(place);
                    };
                };
            };
            if (invalidPlaces.length > 0) {
                error = true;
                error3 = true;
                if (invalidPlaces.length === 1) {
                    errorArray.push(new ErrorItemBucket('text', ['', 'workflow check 3 failed: place with invalid initial marking detected'], false));
                    if (invalidPlaces[0] !== source) {
                        errorArray.push(new ErrorItemBucket('list', ['place with id ' + invalidPlaces[0].id + ' - initial marking of ' + invalidPlaces[0].initialMarking + ' (should be 0)'], true));
                    } else {
                        errorArray.push(new ErrorItemBucket('list', ['source place with id ' + invalidPlaces[0].id + ' - initial marking of ' + invalidPlaces[0].initialMarking + ' (should be 1)'], true));
                    };
                    this.svgService.setElementErrLvl2Flag(invalidPlaces[0], true);
                } else {
                    errorArray.push(new ErrorItemBucket('text', ['', 'workflow check 3 failed: places with invalid initial marking detected'], false));
                    const errorItems : string[] = [];
                    for (const place of invalidPlaces) {
                        if (place !== source) {
                            errorItems.push('place with id ' + place.id + ' - initial marking of ' + place.initialMarking + ' (should be 0)');
                        } else {
                            errorItems.push('source place with id ' + place.id + ' - initial marking of ' + place.initialMarking + ' (should be 1)');
                        };
                        this.svgService.setElementErrLvl2Flag(place, true);
                    };
                    errorArray.push(new ErrorItemBucket('list', errorItems, true));
                };
            };
            if (!error3) {
                errorArray.push(new ErrorItemBucket('text', ['', 'workflow check 3 passed: initial marking consists of one token on the source place'], true));
            };
        };
        /* check 4 - reachability */
        if ((this.net.sourcePlaces.length !== 1) || (this.net.sinkPlaces.length !== 1)) {
            errorArray.push(new ErrorItemBucket('text', ['', 'workflow check 4 impossible: exactly one source place and one sink place required to check paths'], true));
        } else {
            const source : Place = this.net.sourcePlaces[0]
            const sink : Place = this.net.sinkPlaces[0];
            const sourceReach : {[nodeId : number] : boolean} = {};
            const sourceQueue : (Place | Transition)[] = [source];
            while (sourceQueue.length > 0) {
                const queuePop : (Place | Transition | undefined) = sourceQueue.pop();
                if (!queuePop) {
                    this.popupService.error('srv.sim.twf.000', 'inconsistent internal data state', 'it is recommended to restart the tool');
                    throw new Error('#srv.sim.twf.000: ' + 'workflow test failed - pop from nonempty queue returned undefined');
                };
                if (queuePop instanceof Place) {
                    for (const out of queuePop.outgoing) {
                        if (sourceReach[out.transition.id] === undefined) {
                            sourceQueue.push(out.transition);
                        };
                    };
                } else {
                    for (const out of queuePop.output) {
                        if (sourceReach[out[0].id] === undefined) {
                            sourceQueue.push(out[0]);
                        };
                    };
                };
                sourceReach[queuePop.id] = true;
            };
            const invalidNodes : [(Place | Transition), ('i' | 'o' | 'io')][] = [];
            for (const node of this.net.nodes) {
                if (!node) {
                    continue;
                };
                if (node === source) {
                    continue;
                };
                if (node === sink) {
                    continue;
                };
                if ((node instanceof Place) || (node instanceof Transition)) {
                    let sinkReached : boolean = false;
                    const nodeReach : {[nodeId : number] : boolean} = {};
                    const nodeQueue : (Place | Transition)[] = [node];
                    while (nodeQueue.length > 0) {
                        const queuePop : (Place | Transition | undefined) = nodeQueue.pop();
                        if (!queuePop) {
                            this.popupService.error('srv.sim.twf.001', 'inconsistent internal data state', 'it is recommended to restart the tool');
                            throw new Error('#srv.sim.twf.001: ' + 'workflow test failed - pop from nonempty queue returned undefined');
                        };
                        if (queuePop === sink) {
                            sinkReached = true;
                            break;
                        } else {
                            if (queuePop instanceof Place) {
                                for (const out of queuePop.outgoing) {
                                    if (nodeReach[out.transition.id] === undefined) {
                                        nodeQueue.push(out.transition);
                                    };
                                };
                            } else {
                                for (const out of queuePop.output) {
                                    if (nodeReach[out[0].id] === undefined) {
                                        nodeQueue.push(out[0]);
                                    };
                                };
                            };
                            nodeReach[queuePop.id] = true;
                        };
                    };
                    if (sourceReach[node.id] !== true) {
                        if (sinkReached) {
                            invalidNodes.push([node, 'i']);
                        } else {
                            invalidNodes.push([node, 'io']);
                        };
                    } else {
                        if (!sinkReached) {
                            invalidNodes.push([node, 'o']);
                        };
                    };
                } else {
                    this.popupService.error('srv.sim.twf.002', 'inconsistent internal data state', 'it is recommended to restart the tool');
                    throw new Error('#srv.sim.twf.002: ' + 'workflow test failed - node of unknown type detected');
                };
            };
            let error4 : boolean = false;
            if (invalidNodes.length > 0) {
                error = true;
                error4 = true;
                if (invalidNodes.length === 1) {
                    errorArray.push(new ErrorItemBucket('text', ['', 'workflow check 4 failed: detected inner node that is not part of a path from the source place to the target place'], false));
                    if (invalidNodes[0][1] === 'i') {
                        errorArray.push(new ErrorItemBucket('list', ['node with id ' + invalidNodes[0][0].id + ' (node not reachable from source place)'], true));
                    } else if (invalidNodes[0][1] === 'o') {
                        errorArray.push(new ErrorItemBucket('list', ['node with id ' + invalidNodes[0][0].id + ' (sink place not reachable from node)'], true));
                    } else {
                        errorArray.push(new ErrorItemBucket('list', ['node with id ' + invalidNodes[0][0].id + ' (node not reachable from source place, sink place not reachable from node)'], true));
                    };
                    this.svgService.setElementErrLvl2Flag(invalidNodes[0][0], true);
                } else {
                    errorArray.push(new ErrorItemBucket('text', ['', 'workflow check 4 failed: detected inner nodes that are not part of a path from the source place to the target place'], false));
                    const errorItems : string[] = [];
                    for (const entry of invalidNodes) {
                        if (entry[1] === 'i') {
                            errorItems.push('node with id ' + entry[0].id + ' (node not reachable from source place)');
                        } else if (entry[1] === 'o') {
                            errorItems.push('node with id ' + entry[0].id + ' (sink place not reachable from node)');
                        } else {
                            errorItems.push('node with id ' + entry[0].id + ' (node not reachable from source place, sink place not reachable from node)');
                        };
                        this.svgService.setElementErrLvl2Flag(entry[0], true);
                    };
                    errorArray.push(new ErrorItemBucket('list', errorItems, true));
                };
            };
            if (!error4) {
                errorArray.push(new ErrorItemBucket('text', ['', 'workflow check 4 passed: every inner node is part of a path from the source place to the target place'], true));
            };
        };
        /* check 5 - arc weights */
        if (this.settingsService.state.strictWorkflowChecks) {
            for (const arc of this.net.arcs) {
                if (arc) {
                    if (arc.weight !== 1) {
                        this._workflowInvalidArcs.push(arc);
                    };
                };
            };
            let error5 : boolean = false;
            if (this._workflowInvalidArcs.length > 0) {
                error = true;
                error5 = true;
                if (this._workflowInvalidArcs.length === 1) {
                    errorArray.push(new ErrorItemBucket('text', ['', 'workflow check 5 failed: arc with weight exeeding one detected'], false));
                    errorArray.push(new ErrorItemBucket('list', ['arc with id ' + this._workflowInvalidArcs[0].id + ' - weight of ' + this._workflowInvalidArcs[0].weight], true));
                    this.svgService.setElementErrLvl2Flag(this._workflowInvalidArcs[0], true);
                } else {
                    errorArray.push(new ErrorItemBucket('text', ['', 'workflow check 5 failed: arcs with weight exeeding one detected'], false));
                    const errorItems : string[] = [];
                    for (const arc of this._workflowInvalidArcs) {
                        errorItems.push('arc with id ' + arc.id + ' - weight of ' + arc.weight);
                        this.svgService.setElementErrLvl2Flag(arc, true);
                    };
                    errorArray.push(new ErrorItemBucket('list', errorItems, true));
                };
            };
            if (!error5) {
                errorArray.push(new ErrorItemBucket('text', ['', 'workflow check 5 passed: no arc has a weight greater than one'], true));
            };
        };
        if (error) {
            this._errorInfoSubject.next(new ErrorInfo([new ErrorParagraph('net is not a workflow net', errorArray)]));
            if (this.settingsService.state.switchDisplayModeOnError) {
                this._previousMode = this.settingsService.state.displayMode;
                this.settingsService.update({displayMode : 'errors'});
                this._modeAutoChanged = true;
            };
            this.settingsService.update({errorInSequence : true});
            this.net.workflow = false;
            this._workflowSubject.next(false);
            if (this.settingsService.state.tutorialErr === false) {
                let noCookie : boolean = true;
                let cookieCont : string = '';
                const decodedCookieString = decodeURIComponent(document.cookie);
                const cookieArray = decodedCookieString.split(';');
                for(const cookie of cookieArray) {
                    cookie.trim();
                    if (cookie.indexOf('sound.ts=') === 0) {
                        cookieCont = cookie.substring('sound.ts='.length, cookie.length);
                        noCookie = false;
                        break;
                    };
                };
                if (noCookie) {
                    if (this.settingsService.state.tutorialLog) {
                        document.cookie = 'sound.ts=i,l; expires=session; path=/';
                        cookieCont = 'i,l';
                    } else {
                        document.cookie = 'sound.ts=i; expires=session; path=/';
                        cookieCont = 'i';
                    };
                };
                const tutorialState : string[] = cookieCont.split(',');
                let noErrTutorial : boolean = true;
                for (const entry of tutorialState) {
                    if (entry === 'e') {
                        noErrTutorial = false;
                        break;
                    };
                };
                if (noErrTutorial) {
                    this.popupService.note([{
                        style : 'margin-top:5px;margin-left:10px;margin-right:5px;margin-bottom:0px;',
                        content : 'An error state has been triggered.'
                    }, {
                        style : 'margin-top:5px;margin-left:10px;margin-right:5px;margin-bottom:0px;',
                        content : 'Detailed information about the error can be accessed by using the question mark button in the top right corner of the canvas.',
                    }], 'Tutorial - Error States', 'max-width:450px;', 'Got it!');
                    const cookieUpdate : string = ('sound.ts=' + cookieCont + ',e' + '; expires=session; path=/');
                    document.cookie = cookieUpdate;
                };
                this.settingsService.update({tutorialErr : true});
            };
            return false;
        } else {
            this._errorInfoSubject.next(new ErrorInfo([new ErrorParagraph('net is a workflow net', errorArray)]));
            this.net.workflow = true;
            this._workflowSubject.next(true);
            return true;
        };
    };

    private testCoverability() : {
        dead : Transition[]
    } {
        type State = {
            [placeID : number] : (number | 'infinite')
        };
        type AdvState = {
            current : State,
            previous : State[]
        };
        let initialState : AdvState = {
            current : {},
            previous : []
        };
        for (const place of this.net.places) {
            initialState.current[place.id] = place.initialMarking;
        };
        let checkedStates : AdvState[] = [];
        let uncheckedStates : AdvState[] = [initialState];
        let unfiredTransitions : Transition[] = [];
        for (const transition of this.net.transitions) {
            unfiredTransitions.push(transition);
        };
        // 
        // /* do not remove - alternative implementation (test all states for omega) */
        // 
        // let omega : boolean = false;
        // while (uncheckedStates.length > 0) {
        while ((uncheckedStates.length > 0) && (unfiredTransitions.length > 0)) {
            let state : (AdvState | undefined) = uncheckedStates.pop();
            if (state === undefined) {
                this.popupService.error('srv.sim.tcg.000', 'inconsistent internal data state', 'it is recommended to restart the tool');
                throw new Error('#srv.sim.tcg.000: ' + 'coverability test failed - array of unchecked states returned undefined entry while array end has not been reached');
            };
            for (const transition of this.net.transitions) {
                let unfireable : boolean = false;
                for (const input of transition.input) {
                    const marking : (number | 'infinite') = state.current[input[0].id];
                    if (marking !== 'infinite') {
                        if (marking < input[1].weight) {
                            unfireable = true;
                            break;
                        };
                    };
                };
                if (unfireable) {
                    continue;
                };
                const followState : State = {};
                for (const place of this.net.places) {
                    followState[place.id] = state.current[place.id];
                };
                for (const input of transition.input) {
                    const marking : (number | 'infinite') = followState[input[0].id];
                    if (marking !== 'infinite') {
                        followState[input[0].id] = (marking - input[1].weight);
                    };
                };
                for (const output of transition.output) {
                    const marking : (number | 'infinite') = followState[output[0].id];
                    if (marking !== 'infinite') {
                        followState[output[0].id] = (marking + output[1].weight);
                    };
                };
                for (const pastState of state.previous) {
                    let greaterMarking : boolean = true;
                    let toInfinitePlaceIds : number[] = [];
                    for (const place of this.net.places) {
                        if (followState[place.id] !== 'infinite') {
                            if (pastState[place.id] !== 'infinite') {
                                if (pastState[place.id] > followState[place.id]) {
                                    greaterMarking = false;
                                    break;
                                } else if (pastState[place.id] < followState[place.id]) {
                                    toInfinitePlaceIds.push(place.id);
                                };
                            } else {
                                this.popupService.error('srv.sim.tcg.001', 'inconsistent internal data state', 'it is recommended to restart the tool');
                                throw new Error('#srv.sim.tcg.001: ' + 'coverability test failed - state with a certain numeric place marking has a predecessor state where the same marking is infinite');
                            };
                        };
                    };
                    if (greaterMarking) {
                        for (const id of toInfinitePlaceIds) {
                            followState[id] = 'infinite';
                            // 
                            // /* do not remove - alternative implementation (test all states for omega) */
                            // 
                            // omega = true;
                        };
                    };
                };
                let unreached : boolean = true;
                let equal : boolean = true;
                for (const place of this.net.places) {
                    if (followState[place.id] !== state.current[place.id]) {
                        equal = false;
                        break;
                    };
                };
                unreached = (!(equal));
                if (unreached) {
                    for (const checked of checkedStates) {
                        equal = true;
                        for (const place of this.net.places) {
                            if (followState[place.id] !== checked.current[place.id]) {
                                equal = false;
                                break;
                            };
                        };
                        if (equal) {
                            break;
                        };
                    };
                };
                unreached = (!(equal));
                if (unreached) {
                    for (const unchecked of uncheckedStates) {
                        equal = true;
                        for (const place of this.net.places) {
                            if (followState[place.id] !== unchecked.current[place.id]) {
                                equal = false;
                                break;
                            };
                        };
                        if (equal) {
                            break;
                        };
                    };
                };
                unreached = (!(equal));
                if (unreached) {
                    const followAdv : AdvState = {
                        current : followState,
                        previous : []
                    };
                    for (const prev of state.previous) {
                        followAdv.previous.push(prev);
                    };
                    followAdv.previous.push(state.current);
                    uncheckedStates.push(followAdv);
                };
                for (let idx = 0; idx < unfiredTransitions.length; idx++) {
                    if (unfiredTransitions[idx] === transition) {
                        unfiredTransitions.splice(idx, 1);
                    };
                };
            };
            checkedStates.push(state);
        };
        // 
        // /* do not remove - alternative implementation (test all states for omega) */
        // 
        // if (omega) {
        //     console.debug('omega state found while testing coverability')
        // };
        return {dead : unfiredTransitions};
    };

    private testMarking() : {
        sequenceTerminated : boolean,
        validMarking : boolean
    } {
        this.testInitialMarking();
        this._foundError = 'noError';
        const errorArray : ErrorItemBucket[] = [];
        if (this.net.sourcePlaces.length !== 1) {
            this.popupService.error('srv.sim.tmk.000', 'inconsistent internal data state', 'it is recommended to restart the tool');
            throw new Error('#srv.sim.tmk.000: ' + 'marking test failed - net source place is not well-defined');
        };
        if (this.net.sinkPlaces.length !== 1) {
            this.popupService.error('srv.sim.tmk.001', 'inconsistent internal data state', 'it is recommended to restart the tool');
            throw new Error('#srv.sim.tmk.001: ' + 'marking test failed - net sink place is not well-defined');
        };
        const sink : Place = this.net.sinkPlaces[0];
        const result : {
            validMarking : boolean,
            sequenceTerminated : boolean
        } = {
            validMarking : false,
            sequenceTerminated : false
        };
        const enabled : number = this.testEnabled();
        if (sink.marking > 0) {
            const invalidPlaces : Place[] = [];
            for (const place of this.net.places) {
                if (place === sink) {
                    continue
                };
                if (place.marking > 0) {
                    invalidPlaces.push(place);
                };
            };
            if (invalidPlaces.length > 0) {
                if (sink.marking > 1) {
                    errorArray.push(new ErrorItemBucket('text', ['', 'soundness condition 2 not met - the process terminated incorrectly: the reached marking contains more than one token on the sink place'], false));
                    errorArray.push(new ErrorItemBucket('list', ['sink place with id ' + sink.id + ' - marking of ' + sink.marking + ' (should be 1)'], true));
                    this.svgService.setElementErrLvl2Flag(sink, true);
                } else {
                    this.svgService.setElementErrLvl1Flag(sink, true);
                };
                errorArray.push(new ErrorItemBucket('text', ['', 'soundness condition 2 not met - the process terminated incorrectly: the reached marking contains a token on the sink place while there are other marked places'], false));
                const errorItems : string[] = [];
                for (const place of invalidPlaces) {
                    errorItems.push('place with id ' + place.id + ' - marking of ' + place.marking + ' (should be 0)');
                    this.svgService.setElementErrLvl2Flag(place, true);
                };
                errorArray.push(new ErrorItemBucket('list', errorItems, true));
                result.validMarking = false;
                result.sequenceTerminated = true;
                this._foundError = 'invalidTermination';
            } else {
                if (sink.marking > 1) {
                    errorArray.push(new ErrorItemBucket('text', ['', 'soundness condition 2 not met - the process terminated incorrectly: the reached marking contains more than one token on the sink place'], false));
                    errorArray.push(new ErrorItemBucket('list', ['sink place with id ' + sink.id + ' - marking of ' + sink.marking + ' (should be 1)'], true));
                    this.svgService.setElementErrLvl2Flag(sink, true);
                    result.validMarking = false;
                    result.sequenceTerminated = true;
                    this._foundError = 'invalidTermination';
                } else {
                    result.validMarking = true;
                    result.sequenceTerminated = true;
                };
            };
        } else {
            if (enabled > 0) {
                result.validMarking = true;
                result.sequenceTerminated = false;
            } else {
                errorArray.push(new ErrorItemBucket('text', ['', 'soundness condition 1 not met - the process cannot terminate: the reached marking does not enable any transitions'], true));
                for (const place of this.net.places) {
                    if (place.marking > 0) {
                        this.svgService.setElementErrLvl2Flag(place, true);
                    };
                };
                this.svgService.setElementErrLvl1Flag(sink, true);
                result.validMarking = false;
                result.sequenceTerminated = true;
                this._foundError = 'noTermination';
            };
        };
        let notDead = true;
        if ((this._deadTransitions.length > 0) && (result.sequenceTerminated)) {
            let noLiveUntraveled : boolean = true;
            for (const transition of this.net.transitions) {
                let notDead : boolean = true;
                for (const dead of this._deadTransitions) {
                    if (transition === dead) {
                        notDead = false;
                        break;
                    };
                };
                if (notDead) {
                    if ((!(transition.inSequenceLog)) && (!(transition.inSequencePast))) {
                        noLiveUntraveled = false;
                        break;
                    };
                } else {
                    if ((transition.inSequenceLog) || (transition.inSequencePast) || (transition.inSequenceNext)) {
                        this.popupService.error('srv.sim.tmk.002', 'inconsistent internal data state', 'it is recommended to restart the tool');
                        throw new Error('#srv.sim.tmk.002: ' + 'marking test failed - dead transition is flagged as part of a sequence');
                    };
                    this._foundError = 'deadTransitions';
                };
            };
            if (noLiveUntraveled) {
                if (this._deadTransitions.length === 1) {
                    errorArray.push(new ErrorItemBucket('text', ['', 'soundness condition 3 not met - an activity of the process is not executable: the net contains a dead transition'], false));
                    errorArray.push(new ErrorItemBucket('list', ['transition with id ' + this._deadTransitions[0].id + ''], true));
                    this.svgService.setElementErrLvl2Flag(this._deadTransitions[0], true);
                } else {
                    errorArray.push(new ErrorItemBucket('text', ['', 'soundness condition 3 not met - multiple activities of the process are not executable: the net contains dead transitions'], false));
                    const errorItems : string[] = [];
                    for (const dead of this._deadTransitions) {
                        errorItems.push('transition with id ' + dead.id + '');
                        this.svgService.setElementErrLvl2Flag(dead, true);
                    };
                    errorArray.push(new ErrorItemBucket('list', errorItems, true));
                };
                notDead = false;
            };
        };
        if ((result.validMarking) && (notDead)) {
            this._errorInfoSubject.next(new ErrorInfo([new ErrorParagraph('marking does not contradict soundness', errorArray)]));
            if ((this.settingsService.state.switchDisplayModeOnError) && (this._modeAutoChanged)) {
                this.settingsService.update({displayMode : this._previousMode});
                this._modeAutoChanged = false;
            };
            if (result.sequenceTerminated) {
                this.settingsService.update({
                    errorInfoSeqEnabled : false, 
                    errorInSequence : false, 
                    firingEnabled : false, 
                    sequenceTerminated : true
                });
                this.toastService.showToast('success', ['sequence terminated successfully']);
            } else {
                this.settingsService.update({
                    errorInfoSeqEnabled : false, 
                    errorInSequence : false, 
                    firingEnabled : true, 
                    sequenceTerminated : false
                });
            };
        } else {
            this._errorInfoSubject.next(new ErrorInfo([new ErrorParagraph('net is not sound', errorArray)]));
            if (this.settingsService.state.switchDisplayModeOnError) {
                this._previousMode = this.settingsService.state.displayMode;
                this.settingsService.update({displayMode : 'errors'});
                this._modeAutoChanged = true;
            };
            this.settingsService.update({
                errorInfoSeqEnabled : false, 
                errorInSequence : true, 
                firingEnabled : false, 
                sequenceTerminated : true
            });
            this.toastService.showToast('error', ['sequence terminated with error \xa0']);
        };
        if (this.settingsService.state.autorunExec === false) {
            if ((result.validMarking === false) && (this.settingsService.state.tutorialErr === false)) {
                let noCookie : boolean = true;
                let cookieCont : string = '';
                const decodedCookieString = decodeURIComponent(document.cookie);
                const cookieArray = decodedCookieString.split(';');
                for(const cookie of cookieArray) {
                    cookie.trim();
                    if (cookie.indexOf('sound.ts=') === 0) {
                        cookieCont = cookie.substring('sound.ts='.length, cookie.length);
                        noCookie = false;
                        break;
                    };
                };
                if (noCookie) {
                    if (this.settingsService.state.tutorialLog && this.settingsService.state.tutorialRun) {
                        document.cookie = 'sound.ts=i,l,r; expires=session; path=/';
                        cookieCont = 'i,l,r';
                    } else if (this.settingsService.state.tutorialLog) {
                        document.cookie = 'sound.ts=i,l; expires=session; path=/';
                        cookieCont = 'i,l';
                    } else if (this.settingsService.state.tutorialRun) {
                        document.cookie = 'sound.ts=i,r; expires=session; path=/';
                        cookieCont = 'i,r';
                    } else {
                        document.cookie = 'sound.ts=i; expires=session; path=/';
                        cookieCont = 'i';
                    };
                };
                const tutorialState : string[] = cookieCont.split(',');
                let noErrTutorial : boolean = true;
                for (const entry of tutorialState) {
                    if (entry === 'e') {
                        noErrTutorial = false;
                        break;
                    };
                };
                if (noErrTutorial) {
                    this.popupService.note([{
                        style : 'margin-top:5px;margin-left:10px;margin-right:5px;margin-bottom:0px;',
                        content : 'An error state has been triggered.'
                    }, {
                        style : 'margin-top:5px;margin-left:10px;margin-right:5px;margin-bottom:0px;',
                        content : 'Detailed information about the error can be accessed by using the question mark button in the top right corner of the canvas.',
                    }], 'Tutorial - Error States', 'max-width:450px;', 'Got it!');
                    const cookieUpdate : string = ('sound.ts=' + cookieCont + ',e' + '; expires=session; path=/');
                    document.cookie = cookieUpdate;
                };
                this.settingsService.update({tutorialErr : true});
            } else if ((result.sequenceTerminated) && (this.settingsService.state.tutorialLog === false)) {
                let noCookie : boolean = true;
                let cookieCont : string = '';
                const decodedCookieString = decodeURIComponent(document.cookie);
                const cookieArray = decodedCookieString.split(';');
                for(const cookie of cookieArray) {
                    cookie.trim();
                    if (cookie.indexOf('sound.ts=') === 0) {
                        cookieCont = cookie.substring('sound.ts='.length, cookie.length);
                        noCookie = false;
                        break;
                    };
                };
                if (noCookie) {
                    if (this.settingsService.state.tutorialErr && this.settingsService.state.tutorialRun) {
                        document.cookie = 'sound.ts=i,e,r; expires=session; path=/';
                        cookieCont = 'i,e,r';
                    } else if (this.settingsService.state.tutorialErr) {
                        document.cookie = 'sound.ts=i,e; expires=session; path=/';
                        cookieCont = 'i,e';
                    } else if (this.settingsService.state.tutorialRun) {
                        document.cookie = 'sound.ts=i,r; expires=session; path=/';
                        cookieCont = 'i,r';
                    } else {
                        document.cookie = 'sound.ts=i; expires=session; path=/';
                        cookieCont = 'i';
                    };
                };
                const tutorialState : string[] = cookieCont.split(',');
                let noLogTutorial : boolean = true;
                for (const entry of tutorialState) {
                    if (entry === 'l') {
                        noLogTutorial = false;
                        break;
                    };
                };
                if (noLogTutorial) {
                    this.popupService.note([{
                        style : 'margin-top:5px;margin-left:10px;margin-right:5px;margin-bottom:0px;',
                        content : 'The current firing sequence has terminated.'
                    }, {
                        style : 'margin-top:5px;margin-left:10px;margin-right:5px;margin-bottom:0px;',
                        content : 'Whenever a sequence terminates, whether an error occurred or not, the tool checks if this exact sequence has been executed before.',
                    }, {
                        style : 'margin-top:5px;margin-left:10px;margin-right:5px;margin-bottom:0px;',
                        content : 'Newly discovered sequences are appended to the log displayed below the canvas.',
                    }, {
                        style : 'margin-top:5px;margin-left:10px;margin-right:5px;margin-bottom:0px;',
                        content : 'Previously completed sequences can be loaded by selecting them from the log.',
                    }], 'Tutorial - Sequence Log', 'max-width:450px;', 'Got it!');
                    const cookieUpdate : string = ('sound.ts=' + cookieCont + ',l' + '; expires=session; path=/');
                    document.cookie = cookieUpdate;
                };
                this.settingsService.update({tutorialLog : true});
            };
        };
        this._lastResult = result;
        return result;
    };

    private testEnabled() : number {
        this._currentlyEnabled = [];
        for (const transition of this.net.transitions) {
            let fireable : boolean = true;
            for (const input of transition.input) {
                if (input[0].marking < input[1].weight) {
                    fireable = false;
                    break;
                };
            };
            if (fireable) {
                this._currentlyEnabled.push(transition);
                transition.enabled = true;
                this.svgService.setSvgTransitionColors(transition);
                this.svgService.setSVGTransitionInfoTextE(transition);
            } else {
                transition.enabled = false;
                this.svgService.setSvgTransitionColors(transition);
                this.svgService.setSVGTransitionInfoTextE(transition);
            };
        };
        return (this._currentlyEnabled.length);
    };

    public retest() : void {
        if (this._strictWorkflowChecksEnabled !== this.settingsService.state.strictWorkflowChecks) {
            this._strictWorkflowChecksEnabled = this.settingsService.state.strictWorkflowChecks;
            if (!(this.net.empty)) {
                this.settingsService.update({firingEnabled : false});
                const workflow : boolean = this.testWorkflow();
                if (workflow) {
                    this.testMarking();
                } else {
                    this.testEnabled();
                };
            }; 
        };
    };

    public fireTransition(inTransition : Transition) : void {
        if (this.settingsService.state.firingEnabled) {
            if (inTransition.enabled) {
                if (this.net.nextSequenceEntry < this.net.activeSequence.length) {
                    this.net.activeSequence = this.net.activeSequence.slice(0, this.net.nextSequenceEntry);
                    this.svgService.resetAllSeqNextFlags();
                };
                const newlyVisitedElements : (Transition | Place | Arc)[] = [];
                if (!(inTransition.inSequencePast)) {
                    newlyVisitedElements.push(inTransition);
                    this.svgService.setElementSeqPastFlag(inTransition, true);
                };
                for (const input of inTransition.input) {
                    input[0].marking = (input[0].marking - input[1].weight);
                    this.svgService.setSvgPlaceSymbolContent(input[0]);
                    this.svgService.setSVGPlaceInfoTextM(input[0]);
                    if (!(input[0].inSequencePast)) {
                        newlyVisitedElements.push(input[0]);
                        this.svgService.setElementSeqPastFlag(input[0], true);
                    };
                    if (!(input[1].inSequencePast)) {
                        newlyVisitedElements.push(input[1]);
                        this.svgService.setElementSeqPastFlag(input[1], true);
                    };
                    if (this.settingsService.state.showPlaceMarkings) {
                        this.svgService.setSvgPlaceSymbolVisibility(input[0]);
                    };
                };
                for (const output of inTransition.output) {
                    output[0].marking = (output[0].marking + output[1].weight);
                    this.svgService.setSvgPlaceSymbolContent(output[0]);
                    this.svgService.setSVGPlaceInfoTextM(output[0]);
                    if (!(output[0].inSequencePast)) {
                        newlyVisitedElements.push(output[0]);
                        this.svgService.setElementSeqPastFlag(output[0], true);
                    };
                    if (!(output[1].inSequencePast)) {
                        newlyVisitedElements.push(output[1]);
                        this.svgService.setElementSeqPastFlag(output[1], true);
                    };
                    if (this.settingsService.state.showPlaceMarkings) {
                        this.svgService.setSvgPlaceSymbolVisibility(output[0]);
                    };
                };
                let result : {
                    validMarking : boolean,
                    sequenceTerminated : boolean
                } = this.testMarking();
                this.net.activeSequence.push({
                    firedTransition : inTransition,
                    addedToSequence : newlyVisitedElements,
                    markingValidity : result.validMarking
                });
                this.net.nextSequenceEntry++;
                this.net.unsavedSequence = true;
                if (result.sequenceTerminated) {
                    this.saveFinishedSequence();
                };
            } else {
                switch (this.settingsService.state.notifyInfo) {
                    case 'dialog' : {
                    this.popupService.info([{
                            style : 'text-align:center;margin-top:10px;',
                            content : 'the selected transition is not enabled'
                        }], 'Transition Not Fireable');
                        break;
                    }
                    case 'popup' : {
                        window.alert('Transition Not Fireable' + '\n' + '\n' + ' (the selected transition is not enabled)');
                        break;
                    }
                    case 'toast' : {
                        this.toastService.showPanel('info', ['Transition Not Fireable', '(the selected transition is not enabled)']);
                        break;
                    }
                };
            };
        } else {
            let reason : string;
            if (!this.workflow) {
                reason = 'the net is not a workflow net';
            } else if ((this._lastResult) && (!(this._lastResult.validMarking))) {
                reason = 'the net marking is invalid';
            } else if ((this._lastResult) && (this._lastResult.sequenceTerminated)) {
                reason = 'the sequence has terminated';
            } else {
                reason = '';
            };
            switch (this.settingsService.state.notifyInfo) {
                case 'dialog' : {
                    this.popupService.info([{
                        style : 'text-align:center;margin-top:10px;',
                        content : reason
                    }], 'Transition Firing Disabled');
                    break;
                }
                case 'popup' : {
                    window.alert('Transition Firing Disabled' + '\n' + '\n' + ' (' + reason + ')');
                    break;
                }
                case 'toast' : {
                    this.toastService.showPanel('info', ['Transition Firing Disabled', '(' + reason + ')']);
                    break;
                }
            };
        };
    };

    public undoSequenceEntry() : void {
        if (this.net.nextSequenceEntry > 0) {
            const lastEntry : {
                firedTransition : Transition,
                addedToSequence : (Transition | Place | Arc)[],
                markingValidity : boolean
            } = this.net.activeSequence[(this.net.nextSequenceEntry - 1)];
            if (!(lastEntry.markingValidity)) {
                this.svgService.resetAllErrLvl1Flags();
                this.svgService.resetAllErrLvl2Flags();
            };
            for (const output of lastEntry.firedTransition.output) {
                if (output[0].marking < output[1].weight) {
                    this.popupService.error('srv.sim.use.000', 'inconsistent internal data state', 'it is recommended to restart the tool');
                    throw new Error('#srv.sim.use.000: ' + 'undoing sequence entry failed - an output node of the last activated transition (place index : ' + (output[0].id) + ', marking : ' + (output[0].marking) + ') does not contain enough tokens for reversing the firing process (arc id : ' + (output[1].id) + ', arc weight : ' + (output[1].weight) + ')');
                };
                output[0].marking = (output[0].marking - output[1].weight);
                this.svgService.setSvgPlaceSymbolContent(output[0]);
                this.svgService.setSVGPlaceInfoTextM(output[0]);
                if (this.settingsService.state.showPlaceMarkings) {
                    this.svgService.setSvgPlaceSymbolVisibility(output[0]);
                };
            };
            for (const input of lastEntry.firedTransition.input) {
                input[0].marking = (input[0].marking + input[1].weight);
                this.svgService.setSvgPlaceSymbolContent(input[0]);
                this.svgService.setSVGPlaceInfoTextM(input[0]);
                if (this.settingsService.state.showPlaceMarkings) {
                    this.svgService.setSvgPlaceSymbolVisibility(input[0]);
                };
            };
            for (const elem of lastEntry.addedToSequence) {
                if (elem.inSequencePast) {
                    this.svgService.setElementSeqPastFlag(elem, false, 'no-update');
                    this.svgService.setElementSeqNextFlag(elem, true);
                    
                } else {
                    this.popupService.error('srv.sim.use.001', 'inconsistent internal data state', 'it is recommended to restart the tool');
                    throw new Error('#srv.sim.use.001: ' + 'undoing sequence entry failed - the element (index : ' + (elem.id) + ') was added to the \'previously visited\' elements as part of the undone step, but is not flagged accordingly');
                };
            };
            const result : {
                validMarking : boolean,
                sequenceTerminated : boolean
            } = this.testMarking();
            if (!result.validMarking) {
                this.popupService.error('srv.sim.use.002', 'inconsistent internal data state', 'it is recommended to restart the tool');
                throw new Error('#srv.sim.use.002: ' + 'undoing sequence entry failed - the performed undo action lead to an invalid net marking');
            };
            if (result.sequenceTerminated) {
                this.popupService.error('srv.sim.use.003', 'inconsistent internal data state', 'it is recommended to restart the tool');
                throw new Error('#srv.sim.use.003: ' + 'undoing sequence entry failed - the performed undo action lead to sequence termination');
            };
            this.net.nextSequenceEntry--;
        };
    };

    public redoSequenceEntry() : void {
        if (this.net.nextSequenceEntry < this.net.activeSequence.length) {
            const nextEntry : {
                firedTransition : Transition,
                addedToSequence : (Transition | Place | Arc)[],
                markingValidity : boolean
            } = this.net.activeSequence[this.net.nextSequenceEntry];
            if (this.settingsService.state.firingEnabled) {
                if (nextEntry.firedTransition.enabled) {
                    const newlyVisitedElements : (Transition | Place | Arc)[] = [];
                    if (nextEntry.firedTransition.inSequenceNext) {
                        newlyVisitedElements.push(nextEntry.firedTransition);
                        this.svgService.setElementSeqNextFlag(nextEntry.firedTransition, false, 'no-update');
                        this.svgService.setElementSeqPastFlag(nextEntry.firedTransition, true);
                    } else if (!(nextEntry.firedTransition.inSequencePast)) {
                        this.popupService.error('srv.sim.rse.000', 'inconsistent internal data state', 'it is recommended to restart the tool');
                        throw new Error('#srv.sim.rse.000: ' + 'redoing sequence entry failed - the transition (index : ' + (nextEntry.firedTransition.id) + ', label : ' + (nextEntry.firedTransition.label) + ') that is to be fired as part of the redo action is neither flagged as \'to be visited\', nor as \'already visited\'');
                    };
                    for (const input of nextEntry.firedTransition.input) {
                        input[0].marking = (input[0].marking - input[1].weight);
                        this.svgService.setSvgPlaceSymbolContent(input[0]);
                        this.svgService.setSVGPlaceInfoTextM(input[0]);
                        if (input[0].inSequenceNext) {
                            newlyVisitedElements.push(input[0]);
                            this.svgService.setElementSeqNextFlag(input[0], false, 'no-update');
                            this.svgService.setElementSeqPastFlag(input[0], true);
                        } else if (!(input[0].inSequencePast)) {
                            this.popupService.error('srv.sim.rse.001', 'inconsistent internal data state', 'it is recommended to restart the tool');
                            throw new Error('#srv.sim.rse.001: ' + 'redoing sequence entry failed - an input place (index : ' + (input[0].id) + ', label : ' + (input[0].label) + ') of the transition that is to be fired as part of the redo action is neither flagged as \'to be visited\', nor as \'already visited\'');
                        };
                        if (input[1].inSequenceNext) {
                            newlyVisitedElements.push(input[1]);
                            this.svgService.setElementSeqNextFlag(input[1], false, 'no-update');
                            this.svgService.setElementSeqPastFlag(input[1], true);
                        } else if (!(input[1].inSequencePast)) {
                            this.popupService.error('srv.sim.rse.002', 'inconsistent internal data state', 'it is recommended to restart the tool');
                            throw new Error('#srv.sim.rse.002: ' + 'redoing sequence entry failed - an input arc (index : ' + (input[1].id) + ') of the transition that is to be fired as part of the redo action is neither flagged as \'to be visited\', nor as \'already visited\'');
                        };
                        if (this.settingsService.state.showPlaceMarkings) {
                            this.svgService.setSvgPlaceSymbolVisibility(input[0]);
                        };
                    };
                    for (const output of nextEntry.firedTransition.output) {
                        output[0].marking = (output[0].marking + output[1].weight);
                        this.svgService.setSvgPlaceSymbolContent(output[0]);
                        this.svgService.setSVGPlaceInfoTextM(output[0]);
                        if (output[0].inSequenceNext) {
                            newlyVisitedElements.push(output[0]);
                            this.svgService.setElementSeqNextFlag(output[0], false, 'no-update');
                            this.svgService.setElementSeqPastFlag(output[0], true);
                        } else if (!(output[0].inSequencePast)) {
                            this.popupService.error('srv.sim.rse.003', 'inconsistent internal data state', 'it is recommended to restart the tool');
                            throw new Error('#srv.sim.rse.003: ' + 'redoing sequence entry failed - an output place (index : ' + (output[0].id) + ', label : ' + (output[0].label) + ') of the transition that is to be fired as part of the redo action is neither flagged as \'to be visited\', nor as \'already visited\'');
                        };
                        if (output[1].inSequenceNext) {
                            newlyVisitedElements.push(output[1]);
                            this.svgService.setElementSeqNextFlag(output[1], false, 'no-update');
                            this.svgService.setElementSeqPastFlag(output[1], true);
                        } else if (!(output[1].inSequencePast)) {
                            this.popupService.error('srv.sim.rse.004', 'inconsistent internal data state', 'it is recommended to restart the tool');
                            throw new Error('#srv.sim.rse.004: ' + 'redoing sequence entry failed - an output arc (index : ' + (output[1].id) + ') of the transition that is to be fired as part of the redo action is neither flagged as \'to be visited\', nor as \'already visited\'');
                        };
                        if (this.settingsService.state.showPlaceMarkings) {
                            this.svgService.setSvgPlaceSymbolVisibility(output[0]);
                        };
                    };
                    const result : {
                        validMarking : boolean,
                        sequenceTerminated : boolean
                    } = this.testMarking();
                    if (result.validMarking !== nextEntry.markingValidity) {
                        this.popupService.error('srv.sim.rse.005', 'inconsistent internal data state', 'it is recommended to restart the tool');
                        throw new Error('#srv.sim.rse.005: ' + 'redoing sequence entry failed - the performed redo action (transition index : ' + (nextEntry.firedTransition.id) + ', new marking validity : ' + (result.validMarking) + ') lead to a marking validity that is different from the one recorded within the log (position : ' + (this.net.nextSequenceEntry) + ', recorded marking validity : ' + (nextEntry.markingValidity) + ')');
                    };
                    this.net.nextSequenceEntry++;
                    if (result.sequenceTerminated) {
                        if (this.net.nextSequenceEntry !== this.net.activeSequence.length) {
                            this.popupService.error('srv.sim.rse.006', 'inconsistent internal data state', 'it is recommended to restart the tool');
                            throw new Error('#srv.sim.rse.006: ' + 'redoing sequence entry failed - the performed redo action lead to sequence termination, but the active sequence still contains previously undone firing actions');
                        } else {
                            this.saveFinishedSequence();
                        };
                    };
                } else {
                    this.popupService.error('srv.sim.rse.007', 'inconsistent internal data state', 'it is recommended to restart the tool');
                    throw new Error('#srv.sim.rse.007: ' + 'redoing sequence entry failed - the next transition from the log (index : ' + (nextEntry.firedTransition.id) + ', label : ' + (nextEntry.firedTransition.label) + ') is not enabled');
                };
            } else {
                this.popupService.error('srv.sim.rse.008', 'inconsistent internal data state', 'it is recommended to restart the tool');
                throw new Error('#srv.sim.rse.008: ' + 'redoing sequence entry failed - firing transitions is disabled');
            };
        };
    };

    public async executeRandomSequence() : Promise<void> {
        let abortRun : boolean = false;
        if (this.settingsService.state.tutorialRun === false) {
            let noCookie : boolean = true;
            let cookieCont : string = '';
            const decodedCookieString = decodeURIComponent(document.cookie);
            const cookieArray = decodedCookieString.split(';');
            for(const cookie of cookieArray) {
                cookie.trim();
                if (cookie.indexOf('sound.ts=') === 0) {
                    cookieCont = cookie.substring('sound.ts='.length, cookie.length);
                    noCookie = false;
                    break;
                };
            };
            if (noCookie) {
                if (this.settingsService.state.tutorialErr && this.settingsService.state.tutorialLog) {
                    document.cookie = 'sound.ts=i,e,l; expires=session; path=/';
                    cookieCont = 'i,e,l';
                } else if (this.settingsService.state.tutorialErr) {
                    document.cookie = 'sound.ts=i,e; expires=session; path=/';
                    cookieCont = 'i,e';
                } else if (this.settingsService.state.tutorialLog) {
                    document.cookie = 'sound.ts=i,l; expires=session; path=/';
                    cookieCont = 'i,l';
                } else {
                    document.cookie = 'sound.ts=i; expires=session; path=/';
                    cookieCont = 'i';
                };
            };
            const tutorialState : string[] = cookieCont.split(',');
            let noRunTutorial : boolean = true;
            for (const entry of tutorialState) {
                if (entry === 'r') {
                    noRunTutorial = false;
                    break;
                };
            };
            if (noRunTutorial) {
                const proceed : boolean = await this.popupService.question([{
                    style : 'margin-top:5px;margin-left:10px;margin-right:5px;margin-bottom:0px;',
                    content : 'You are about to activate the sequence automation.'
                }, {
                    style : 'margin-top:5px;margin-left:10px;margin-right:5px;margin-bottom:0px;',
                    content : 'The underlying algorithm will generate sequences by repeatedly choosing a random transition from all enabled transitions and firing it, looping on sequence termination until it is manually deactivated again.'
                }, {
                    style : 'margin-top:5px;margin-left:10px;margin-right:5px;margin-bottom:0px;',
                    content : 'This feature is not intended to be used as the primary tool for net analysis, but rather to be used complimentary to manual transition firing. It will effectively find whether a given net is sound through a brute-force approach.'
                },
                undefined, 
                {
                    style : 'margin-top:5px;margin-left:10px;margin-right:5px;margin-bottom:0px;',
                    content : 'Are you sure you want to use this feature?',
                }], {
                    style : 'text-align:left',
                    content : 'Tutorial - Automated Sequence Execution',
                }, 'max-width:500px;', 'Cancel', 'Proceed');
                const cookieUpdate : string = ('sound.ts=' + cookieCont + ',r' + '; expires=session; path=/');
                document.cookie = cookieUpdate;
                abortRun = (!proceed);
            };
            this.settingsService.update({tutorialRun : true});
        };
        if (abortRun) {
            return;
        };
        const originalConfigDM : ('default' | 'traveled' | 'errors') = this.settingsService.state.displayMode;
        const originalConfigSM : boolean = this.settingsService.state.switchDisplayModeOnError;
        if (this.settingsService.state.switchDisplayModeOnRun) {
            this.settingsService.update({
                autorunExec : true, 
                autorunStop : false, 
                displayMode : 'traveled', 
                switchDisplayModeOnError : false
            });
        } else {
            this.settingsService.update({
                autorunExec : true, 
                autorunStop : false, 
                switchDisplayModeOnError : false
            });
        };
        if (this._lastResult === undefined) {
            this.popupService.error('srv.sim.ers.000', 'inconsistent internal data state', 'it is recommended to restart the tool');
            throw new Error('#srv.sim.ers.000: ' + 'executing random sequence failed - firing sequence automation was enabled while last marking test result is undefined');
        };
        while ((this.settingsService.state.autorunExec) && (!(this.settingsService.state.autorunStop))) {
            if (this._lastResult.sequenceTerminated) {
                this.initializeMarking();
            } else {
                const arraySize : number = this._currentlyEnabled.length;
                if (arraySize <= 0) {
                    this.popupService.error('srv.sim.ers.001', 'inconsistent internal data state', 'it is recommended to restart the tool');
                    throw new Error('#srv.sim.ers.001: ' + 'executing random sequence failed - last marking test result did not flag the sequence as terminated, but there are no enabled transitions');
                };
                const randomDraw : number = Math.floor(Math.random() * arraySize);
                const chosenTransition : (Transition | undefined) = this._currentlyEnabled[randomDraw];
                if (chosenTransition === undefined) {
                    this.popupService.error('srv.sim.ers.002', 'inconsistent internal data state', 'it is recommended to restart the tool');
                    throw new Error('#srv.sim.ers.002: ' + 'executing random sequence failed - the transition chosen to be fired is undefined');
                };
                this.fireTransition(chosenTransition);
            };
            await new Promise(resolve => setTimeout(resolve, this.settingsService.state.autorunTime));
        };
        if (this.settingsService.state.switchDisplayModeOnRun) {
            this.settingsService.update({
                autorunExec : false, 
                autorunStop : false, 
                displayMode : originalConfigDM, 
                switchDisplayModeOnError : originalConfigSM
            });
        } else {
            this.settingsService.update({
                autorunExec : false, 
                autorunStop : false, 
                switchDisplayModeOnError : originalConfigSM
            });
        };
    };

    private saveFinishedSequence() : void {
        if (this.net.unsavedSequence) {
            let currentIndex : number = 0;
            let foundIndices : number[] = [];
            for (const logFiringSequence of this.net.simulationLog) {
                if (logFiringSequence.length !== this.net.activeSequence.length) {
                    currentIndex++;
                    continue;
                } else {
                    let sequencesEqual : boolean = true;
                    for (let seqIdx = 0; seqIdx < logFiringSequence.length; seqIdx++) {
                        if (logFiringSequence[seqIdx].firedTransition !== this.net.activeSequence[seqIdx].firedTransition) {
                            sequencesEqual = false;
                            break;
                        } else {
                            if (logFiringSequence[seqIdx].addedToSequence.length !== this.net.activeSequence[seqIdx].addedToSequence.length) {
                                sequencesEqual = false;
                                break;
                            } else {
                                if (this.settingsService.state.executionMode === 'safe') {
                                    for (let atsIdx = 0; atsIdx < logFiringSequence[seqIdx].addedToSequence.length; atsIdx++) {
                                        if (logFiringSequence[seqIdx].addedToSequence[atsIdx] !== this.net.activeSequence[seqIdx].addedToSequence[atsIdx]) {
                                            sequencesEqual = false;
                                            break;
                                        };
                                    };
                                    if (!sequencesEqual) {
                                        break;
                                    };
                                };
                                if (logFiringSequence[seqIdx].markingValidity !== this.net.activeSequence[seqIdx].markingValidity) {
                                    sequencesEqual = false;
                                    break;
                                };
                            };
                        };
                    };
                    if (sequencesEqual) {
                        foundIndices.push(currentIndex);
                        if (this.settingsService.state.executionMode === 'safe') {
                            currentIndex++;
                            continue;
                        } else {
                            break;
                        };
                    } else {
                        currentIndex++;
                        continue;
                    };
                };
            };
            if (foundIndices.length === 0) {
                for (let seqIdx = 0; seqIdx < this.net.activeSequence.length; seqIdx++) {
                    for (let atsIdx = 0; atsIdx < this.net.activeSequence[seqIdx].addedToSequence.length; atsIdx++) {
                        this.svgService.setElementSeqLogFlag(this.net.activeSequence[seqIdx].addedToSequence[atsIdx], true);
                    };
                };
                const seqIdx : number = this.net.appendLogEntry(this.net.activeSequence);
                if (this.logComponent) {
                    this.logComponent.prependSequence(seqIdx);
                } else {
                    this.popupService.error('srv.sim.sfs.000', 'component malfunction', 'it is recommended to restart the tool');
                    throw new Error('#srv.sim.sfs.000: ' + 'saving sequence failed - the log component is undefined');
                };
                const errState : {
                    nSeq : number,
                    iSeq : number,
                    dTrs : number
                } = this.net.errors;
                switch (this._foundError) {
                    case 'noTermination' : {
                        console.log('nTerm error')
                        this.net.errors = {
                            nSeq : (this.net.errors.nSeq + 1), 
                            iSeq : (this.net.errors.iSeq), 
                            dTrs : (this.net.errors.dTrs)
                        };
                        this._errorsSubject.next(this.net.errors);
                        this.settingsService.update({errorInNet : true});
                        break;
                    }
                    case 'invalidTermination' : {
                        console.log('iTerm error')
                        console.log(this.net.errors)
                        this.net.errors = {
                            nSeq : (this.net.errors.nSeq), 
                            iSeq : (this.net.errors.iSeq + 1), 
                            dTrs : (this.net.errors.dTrs)
                        };
                        console.log(this.net.errors)
                        this._errorsSubject.next(this.net.errors);
                        this.settingsService.update({errorInNet : true});
                        break;
                    }
                    case 'deadTransitions' : {
                        console.log('dTran error')
                        this.net.errors = {
                            nSeq : (this.net.errors.nSeq), 
                            iSeq : (this.net.errors.iSeq), 
                            dTrs : (this._deadTransitions.length)
                        };
                        this._errorsSubject.next(this.net.errors);
                        this.settingsService.update({errorInNet : true});
                        break;
                    }
                };
            } else if (foundIndices.length > 1){
                this.popupService.error('srv.sim.sfs.002', 'inconsistent internal data state', 'it is recommended to restart the tool');
                throw new Error('#srv.sim.sfs.002: ' + 'saving sequence failed - the firing sequence to be saved was found at ' + foundIndices.length + ' locations within the log');
            };
            this.net.unsavedSequence = false;
        };
    };

    public async loadLogSequence(inLogEntryIndex : number) : Promise<void> {
        if (this.workflow) {
            if ((inLogEntryIndex < 0) || (inLogEntryIndex >= this.net.simulationLog.length)) {
                this.popupService.error('srv.sim.lls.000', 'inconsistent internal data state', 'it is recommended to restart the tool');
                throw new Error('#srv.sim.lls.000: ' + 'loading log sequence failed - given index (' + inLogEntryIndex + ') lies outside the bounds of the log array (0 to ' + (this.net.simulationLog.length - 1) + ')');
            };
            if ((this.net.activeSequence.length > 0) && (this.net.unsavedSequence)) {
                const userConfirmation : boolean = await this.popupService.confirm([
                    {
                        style : 'text-align:left;margin-top:10px;margin-left:20px;margin-right:20px;margin-bottom:0px;color:darkgrey;', 
                        content : 'When loading a firing sequence from the log before the currently '
                    }, {
                        style : 'text-align:left;margin-top:0px;margin-left:20px;margin-right:20px;margin-bottom:0px;color:darkgrey;', 
                        content : 'active firing sequence has terminated, the current sequence is '
                    }, {
                        style : 'text-align:left;margin-top:0px;margin-left:20px;margin-right:20px;margin-bottom:0px;color:darkgrey;', 
                        content : 'deleted without being appended to the log.'
                    },
                    undefined, 
                    {
                        style : 'text-align:center;margin-top:0px;', 
                        content : 'Are you sure you want to load the sequence?'
                    }
                ], 'Overwrite Firing Sequence?');
                if (!userConfirmation) {
                    return;
                };
            };
            this.svgService.resetAllSeqPastFlags();
            this.svgService.resetAllSeqNextFlags();
            this.svgService.resetAllErrLvl1Flags();
            this.svgService.resetAllErrLvl2Flags();
            for (const place of this.net.places) {
                place.marking = place.initialMarking;
                this.svgService.setSVGPlaceInfoTextM(place);
                this.svgService.setSvgPlaceSymbolContent(place);
                this.svgService.setSvgPlaceSymbolVisibility(place);
            };
            if (this.settingsService.state.switchDisplayModeOnLoadFromLog) {
                this.settingsService.update({displayMode : 'traveled'});
            };
            this.net.activeSequence = this.net.simulationLog[inLogEntryIndex];
            this.net.nextSequenceEntry = 0;
            this.net.unsavedSequence = false;
            for (let seqIdx = 0; seqIdx < this.net.activeSequence.length; seqIdx++) {
                for (let atsIdx = 0; atsIdx < this.net.activeSequence[seqIdx].addedToSequence.length; atsIdx++) {
                    this.svgService.setElementSeqNextFlag(this.net.activeSequence[seqIdx].addedToSequence[atsIdx], true);
                };
            };
            this.testMarking();
        } else {
            switch (this.settingsService.state.notifyInfo) {
                case 'dialog' : {
                    this.popupService.info([{
                        style : 'text-align:center;margin-top:10px;',
                        content : 'the net is not a workflow net'
                    }], 'Sequence Loading Disabled');
                    break;
                }
                case 'popup' : {
                    window.alert('Sequence Loading Disabled' + '\n' + '\n' + ' (the net is not a workflow net)');
                    break;
                }
                case 'toast' : {
                    this.toastService.showPanel('info', ['Sequence Loading Disabled', '(the net is not a workflow net)']);
                    break;
                }
            };
        };
    };

    public async resetMarking() : Promise<void> {
        if ((this.net.activeSequence.length > 0) && (this.net.unsavedSequence)) {
            const userConfirmation : boolean = await this.popupService.confirm([
                {
                    style : 'text-align:left;margin-top:10px;margin-left:20px;margin-right:20px;margin-bottom:0px;color:darkgrey;', 
                    content : 'When resetting the net marking before the currently '
                }, {
                    style : 'text-align:left;margin-top:0px;margin-left:20px;margin-right:20px;margin-bottom:0px;color:darkgrey;', 
                    content : 'active firing sequence has terminated, the current '
                }, {
                    style : 'text-align:left;margin-top:0px;margin-left:20px;margin-right:20px;margin-bottom:0px;color:darkgrey;', 
                    content : 'sequence is deleted without being appended to the log.'
                }, 
                undefined, 
                {
                    style : 'text-align:center;margin-top:0px;margin-left:10px;', 
                    content : 'Are you sure you want to reset the marking?'
                }
            ], 'Overwrite Firing Sequence?');
            if (!userConfirmation) {
                return;
            };
        };
        this.initializeMarking();
    };

    private initializeMarking() : void {
        this.svgService.resetAllSeqPastFlags();
        this.svgService.resetAllSeqNextFlags();
        this.svgService.resetAllErrLvl1Flags();
        this.svgService.resetAllErrLvl2Flags();
        for (const place of this.net.places) {
            place.marking = place.initialMarking;
            this.svgService.setSVGPlaceInfoTextM(place);
            this.svgService.setSvgPlaceSymbolContent(place);
            this.svgService.setSvgPlaceSymbolVisibility(place);
        };
        this.net.activeSequence = [];
        this.net.nextSequenceEntry = 0;
        this.net.unsavedSequence = true;
        this.testMarking();
    };

};