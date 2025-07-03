import {Arc} from './arc';
import {Node} from './node';
import {Place} from './place';
import {Transition} from './transition';

export class Net {

    /* attributes */

    private _nodes : (Node | undefined)[];
    private _transitions : Transition[];
    private _places : Place[];
    private _sourcePlaces : Place[];
    private _sinkPlaces : Place[];
    private _nodeCount : number;
    private _arcs : (Arc | undefined)[];
    private _arcCount : number;

    private _empty : boolean;
    private _workflow : boolean;
    private _unsavedSequence : boolean;
    private _nextSequenceEntry : number;
    private _activeSequence : {
        firedTransition : Transition,
        addedToSequence : (Transition | Place | Arc)[],
        markingValidity : boolean
    }[];
    private _simulationLog : {
        firedTransition : Transition,
        addedToSequence : (Transition | Place | Arc)[],
        markingValidity : boolean
    }[][];
    private _completedSequences : number;
    private _markedTransitions : Transition[];
    private _markedPlaces : Place[];
    private _markedArcs : Arc[];
    private _seqLogTransitions : Transition[];
    private _seqLogPlaces : Place[];
    private _seqLogArcs : Arc[];
    private _seqPastTransitions : Transition[];
    private _seqPastPlaces : Place[];
    private _seqPastArcs : Arc[];
    private _seqNextTransitions : Transition[];
    private _seqNextPlaces : Place[];
    private _seqNextArcs : Arc[];
    private _errLvl1Transitions : Transition[];
    private _errLvl1Places : Place[];
    private _errLvl1Arcs : Arc[];
    private _errLvl2Transitions : Transition[];
    private _errLvl2Places : Place[];
    private _errLvl2Arcs : Arc[];

    private _errors : {
        nSeq : number,
        iSeq : number,
        dTrs : number
    };

    /* methods : constructor */

    public constructor() {
        this._nodes = [];
        this._transitions = [];
        this._places = [];
        this._sourcePlaces = [];
        this._sinkPlaces = [];
        this._nodeCount = 0;
        this._arcs = [];
        this._arcCount = 0;
        this._empty = true;
        this._workflow = false;
        this._unsavedSequence = true;
        this._nextSequenceEntry = 0;
        this._activeSequence = [];
        this._simulationLog = [];
        this._completedSequences = 0;
        this._markedTransitions = [];
        this._markedPlaces = [];
        this._markedArcs = [];
        this._seqLogTransitions = [];
        this._seqLogPlaces = [];
        this._seqLogArcs = [];
        this._seqPastTransitions = [];
        this._seqPastPlaces = [];
        this._seqPastArcs = [];
        this._seqNextTransitions = [];
        this._seqNextPlaces = [];
        this._seqNextArcs = [];
        this._errLvl1Transitions = [];
        this._errLvl1Places = [];
        this._errLvl1Arcs = [];
        this._errLvl2Transitions = [];
        this._errLvl2Places = [];
        this._errLvl2Arcs = [];
        this._errors = {
            nSeq : 0,
            iSeq : 0,
            dTrs : 0
        };
    };

    /* methods : getters */

    public get nodes() : (Node | undefined)[] {
        return this._nodes;
    };

    public get transitions() : Transition[] {
        return this._transitions;
    };

    public get places() : Place[] {
        return this._places;
    };

    public get sourcePlaces() : Place[] {
        return this._sourcePlaces;
    };

    public get sinkPlaces() : Place[] {
        return this._sinkPlaces;
    };

    public get arcs() : (Arc | undefined)[] {
        return this._arcs;
    };

    public get nodeCount() : number {
        return this._nodeCount;
    };

    public get arcCount() : number {
        return this._arcCount;
    };

    public get empty(): boolean {
        return this._empty;
    };

    public get workflow(): boolean {
        return this._workflow;
    };

    public get unsavedSequence() : boolean {
        return this._unsavedSequence;
    };

    public get nextSequenceEntry(): number {
        return this._nextSequenceEntry;
    };

    public get activeSequence() : {
        firedTransition : Transition,
        addedToSequence : (Transition | Place | Arc)[],
        markingValidity : boolean
    }[] {
        return this._activeSequence;
    };

    public get simulationLog() : {
        firedTransition : Transition,
        addedToSequence : (Transition | Place | Arc)[],
        markingValidity : boolean
    }[][] {
        return this._simulationLog;
    };

    public get completedSequences(): number {
        return this._completedSequences;
    };

    public get markedTransitions() : Transition[] {
        return this._markedTransitions;
    };

    public get markedPlaces() : Place[] {
        return this._markedPlaces;
    };
    
    public get markedArcs() : Arc[] {
        return this._markedArcs;
    };

    public get seqLogTransitions() : Transition[] {
        return this._seqLogTransitions;
    };

    public get seqLogPlaces() : Place[] {
        return this._seqLogPlaces;
    };
    
    public get seqLogArcs() : Arc[] {
        return this._seqLogArcs;
    };

    public get seqPastTransitions() : Transition[] {
        return this._seqPastTransitions;
    };

    public get seqPastPlaces() : Place[] {
        return this._seqPastPlaces;
    };
    
    public get seqPastArcs() : Arc[] {
        return this._seqPastArcs;
    };

    public get seqNextTransitions() : Transition[] {
        return this._seqNextTransitions;
    };

    public get seqNextPlaces() : Place[] {
        return this._seqNextPlaces;
    };
    
    public get seqNextArcs() : Arc[] {
        return this._seqNextArcs;
    };

    public get errLvl1Transitions() : Transition[] {
        return this._errLvl1Transitions;
    };

    public get errLvl1Places() : Place[] {
        return this._errLvl1Places;
    };
    
    public get errLvl1Arcs() : Arc[] {
        return this._errLvl1Arcs;
    };

    public get errLvl2Transitions() : Transition[] {
        return this._errLvl2Transitions;
    };

    public get errLvl2Places() : Place[] {
        return this._errLvl2Places;
    };
    
    public get errLvl2Arcs() : Arc[] {
        return this._errLvl2Arcs;
    };
    
    public get errors() : {
        nSeq : number,
        iSeq : number,
        dTrs : number
    } {
        return this._errors;
    };

    /* methods : setters */

    public set workflow(inValue : boolean) {
        this._workflow = inValue;
    };

    public set unsavedSequence(inValue : boolean)  {
        this._unsavedSequence = inValue;
    };

    public set nextSequenceEntry(inNumber : number) {
        this._nextSequenceEntry = inNumber;
    };

    public set activeSequence(
        inSequence : {
            firedTransition : Transition,
            addedToSequence : (Transition | Place | Arc)[],
            markingValidity : boolean
        }[]
    )  {
        this._activeSequence = inSequence;
    };

    public set simulationLog(
        inLog : {
            firedTransition : Transition,
            addedToSequence : (Transition | Place | Arc)[],
            markingValidity : boolean
        }[][]
    ) {
        this._simulationLog = inLog;
        if (this._empty) {
            this._empty = false;
        };
    };

    public set completedSequences(inNumber : number) {
        this._completedSequences = inNumber;
    };

    public set markedTransitions(inTransitions : Transition[]) {
        this._markedTransitions = inTransitions;
    };

    public set markedPlaces(inPlaces : Place[]) {
        this._markedPlaces = inPlaces;
    };
    
    public set markedArcs(inArcs : Arc[]) {
        this._markedArcs = inArcs;
    };

    public set seqLogTransitions(inTransitions : Transition[]) {
        this._seqLogTransitions = inTransitions;
    };

    public set seqLogPlaces(inPlaces : Place[]) {
        this._seqLogPlaces = inPlaces;
    };
    
    public set seqLogArcs(inArcs : Arc[]) {
        this._seqLogArcs = inArcs;
    };

    public set seqPastTransitions(inTransitions : Transition[]) {
        this._seqPastTransitions = inTransitions;
    };

    public set seqPastPlaces(inPlaces : Place[]) {
        this._seqPastPlaces = inPlaces;
    };
    
    public set seqPastArcs(inArcs : Arc[]) {
        this._seqPastArcs = inArcs;
    };

    public set seqNextTransitions(inTransitions : Transition[]) {
        this._seqNextTransitions = inTransitions;
    };

    public set seqNextPlaces(inPlaces : Place[]) {
        this._seqNextPlaces = inPlaces;
    };
    
    public set seqNextArcs(inArcs : Arc[]) {
        this._seqNextArcs = inArcs;
    };

    public set errLvl1Transitions(inTransitions : Transition[]) {
        this._errLvl1Transitions = inTransitions;
    };

    public set errLvl1Places(inPlaces : Place[]) {
        this._errLvl1Places = inPlaces;
    };
    
    public set errLvl1Arcs(inArcs : Arc[]) {
        this._errLvl1Arcs = inArcs;
    };

    public set errLvl2Transitions(inTransitions : Transition[]) {
        this._errLvl2Transitions = inTransitions;
    };

    public set errLvl2Places(inPlaces : Place[]) {
        this._errLvl2Places = inPlaces;
    };
    
    public set errLvl2Arcs(inArcs : Arc[]) {
        this._errLvl2Arcs = inArcs;
    };
    
    public set errors(inErrors : {
        nSeq : number,
        iSeq : number,
        dTrs : number
    }) {
        this._errors = inErrors;
    };

    /* methods : other */

    public checkLogEntry(
        inFiringSequence : {
            firedTransition : Transition,
            addedToSequence : (Node | Arc)[],
            markingValidity : boolean
        }[]
    ) : {
        entryFound : boolean, 
        foundIndices : number[]
    } {
        let currentIndex : number = 0;
        let foundIndices : number[] = [];
        for (const logFiringSequence of this._simulationLog) {
            if (logFiringSequence.length !== inFiringSequence.length) {
                currentIndex++;
                continue;
            } else {
                let sequencesEqual : boolean = true;
                for (let seqIdx = 0; seqIdx < logFiringSequence.length; seqIdx++) {
                    if (logFiringSequence[seqIdx].firedTransition !== inFiringSequence[seqIdx].firedTransition) {
                        sequencesEqual = false;
                        break;
                    } else {
                        if (logFiringSequence[seqIdx].addedToSequence.length !== inFiringSequence[seqIdx].addedToSequence.length) {
                            sequencesEqual = false;
                            break;
                        } else {
                            for (let trvIdx = 0; trvIdx < logFiringSequence[seqIdx].addedToSequence.length; trvIdx++) {
                                if (logFiringSequence[seqIdx].addedToSequence[trvIdx] !== inFiringSequence[seqIdx].addedToSequence[trvIdx]) {
                                    sequencesEqual = false;
                                    break;
                                };
                            };
                            if (!sequencesEqual) {
                                break;
                            } else {
                                if (logFiringSequence[seqIdx].markingValidity !== inFiringSequence[seqIdx].markingValidity) {
                                    sequencesEqual = false;
                                    break;
                                };
                            };
                        };
                    };
                };
                if (sequencesEqual) {
                    foundIndices.push(currentIndex);
                    currentIndex++;
                } else {
                    currentIndex++;
                    continue;
                };
            };
        };
        if (foundIndices.length !== 0) {
            return {
                entryFound : true,
                foundIndices : foundIndices
            };
        } else {
            return {
                entryFound : false, 
                foundIndices : foundIndices
            };
        };
    };

    public appendLogEntry(
        inFiringSequence : {
            firedTransition : Transition,
            addedToSequence : (Transition | Place | Arc)[],
            markingValidity : boolean
        }[]
    ) : number {
        const length : number = this._simulationLog.push(inFiringSequence);
        if (this._empty) {
            this._empty = false;
        };
        return (length - 1);
    };

    public checkNode(
        inNode : Node
    ) : {
        nodeFound : boolean, 
        foundIndices : number[]
    } {
        let currentIndex : number = 0;
        let foundIndices : number[] = [];
        for (const node of this._nodes) {
            if (node !== inNode) {
                currentIndex++;
                continue;
            } else {
                foundIndices.push(currentIndex);
                currentIndex++;
            };
        };
        if (foundIndices.length !== 0) {
            return {
        nodeFound : true,
        foundIndices : foundIndices
    };
        } else {
            return {
                nodeFound : false, 
                foundIndices : foundIndices
            };
        };
    };

    public addTransition(
        inLabel : string, 
        inX : (number | undefined), 
        inY : (number | undefined)
    ) : {
        arr_idx : number, 
        obj_ref : Transition
    } {
        let x : number;
        let y : number;
        if (inX !== undefined) {
            x = inX;
        } else {
            x = (Math.floor(Math.random() * 1600) + 100);
        };
        if (inY !== undefined) {
            y = inY;
        } else {
            y = (Math.floor(Math.random() * 400) + 100);
        };
        const newTransition = new Transition(this._nodes.length, inLabel, x, y);
        const newIdx = (this._nodes.push(newTransition) - 1);
        this._transitions.push(newTransition);
        this._nodeCount++;
        if (this._empty) {
            this._empty = false;
        };
        return {
            arr_idx : newIdx, 
            obj_ref : newTransition
        };
    };

    public addPlace(
        inLabel : string, 
        inInitialMarking : number, 
        inX : (number | undefined), 
        inY : (number | undefined)
    ) : {
        arr_idx : number, 
        obj_ref : Place
    } {
        let x : number;
        let y : number;
        if (inX !== undefined) {
            x = inX;
        } else {
            x = (Math.floor(Math.random() * 1600) + 100);
        };
        if (inY !== undefined) {
            y = inY;
        } else {
            y = (Math.floor(Math.random() * 400) + 100);
        };
        const newPlace = new Place(this._nodes.length, inLabel, inInitialMarking, x, y);
        const newIdx = (this._nodes.push(newPlace) - 1);
        this._places.push(newPlace);
        this._nodeCount++;
        if (this._empty) {
            this._empty = false;
        };
        return {
            arr_idx : newIdx, 
            obj_ref : newPlace
        };
    };

    public deleteNode(
        inNode : Node
    ) : void {
        if (this._nodes.length > inNode.id) {
            if (this._nodes[inNode.id] === inNode) {
                switch (inNode.type) {
                    case 'place' : {
                        let plcFound : boolean = false;
                        for (let plcPos = 0; plcPos < this._places.length; plcPos++) {
                            if (this._places[plcPos] !== inNode) {
                                continue;
                            } else {
                                this._places.splice(plcPos, 1);
                                plcFound = true;
                                break;
                            };
                        };
                        if (!(plcFound)) {
                            throw new Error('#cls.net.dln.000: ' + 'node deletion failed - the node to be deleted (id: ' + inNode.id + ', label: ' + inNode.label + ') is a place, but could not be found within the places array');
                        };
                        if (inNode.marked) {
                            let mrkFound : boolean = false;
                            for (let mrkPos = 0; mrkPos < this._markedPlaces.length; mrkPos++) {
                                if (this._markedPlaces[mrkPos] !== inNode) {
                                    continue;
                                } else {
                                    this._markedPlaces.splice(mrkPos, 1);
                                    mrkFound = true;
                                    break;
                                };
                            };
                            if (!(mrkFound)) {
                                throw new Error('#cls.net.dln.001: ' + 'node deletion failed - the place to be deleted (id: ' + inNode.id + ', label : ' + inNode.label + ') is flagged as marked, but could not be located within the marked places array');
                            };
                        };
                        if (inNode.inSequenceLog) {
                            let sqlFound : boolean = false;
                            for (let sqlPos = 0; sqlPos < this._seqLogPlaces.length; sqlPos++) {
                                if (this._seqLogPlaces[sqlPos] !== inNode) {
                                    continue;
                                } else {
                                    this._seqLogPlaces.splice(sqlPos, 1);
                                    sqlFound = true;
                                    break;
                                };
                            };
                            if (!(sqlFound)) {
                                throw new Error('#cls.net.dln.002: ' + 'node deletion failed - the place to be deleted (id: ' + inNode.id + ', label : ' + inNode.label + ') is flagged as part of the sequence log, but could not be located within the seqLog places array');
                            };
                        };
                        if (inNode.inSequencePast) {
                            let sqpFound : boolean = false;
                            for (let sqpPos = 0; sqpPos < this._seqPastPlaces.length; sqpPos++) {
                                if (this._seqPastPlaces[sqpPos] !== inNode) {
                                    continue;
                                } else {
                                    this._seqPastPlaces.splice(sqpPos, 1);
                                    sqpFound = true;
                                    break;
                                };
                            };
                            if (!(sqpFound)) {
                                throw new Error('#cls.net.dln.003: ' + 'node deletion failed - the place to be deleted (id: ' + inNode.id + ', label : ' + inNode.label + ') is flagged as a completed part of the active sequence, but could not be located within the seqPast places array');
                            };
                        };
                        if (inNode.inSequenceNext) {
                            let sqnFound : boolean = false;
                            for (let sqnPos = 0; sqnPos < this._seqNextPlaces.length; sqnPos++) {
                                if (this._seqNextPlaces[sqnPos] !== inNode) {
                                    continue;
                                } else {
                                    this._seqNextPlaces.splice(sqnPos, 1);
                                    sqnFound = true;
                                    break;
                                };
                            };
                            if (!(sqnFound)) {
                                throw new Error('#cls.net.dln.004: ' + 'node deletion failed - the place to be deleted (id: ' + inNode.id + ', label : ' + inNode.label + ') is flagged as an upcoming part of the active sequence, but could not be located within the seqNext places array');
                            };
                        };
                        if (inNode.errorLevel1) {
                            let el1Found : boolean = false;
                            for (let el1Pos = 0; el1Pos < this._errLvl1Places.length; el1Pos++) {
                                if (this._errLvl1Places[el1Pos] !== inNode) {
                                    continue;
                                } else {
                                    this._errLvl1Places.splice(el1Pos, 1);
                                    el1Found = true;
                                    break;
                                };
                            };
                            if (!(el1Found)) {
                                throw new Error('#cls.net.dln.005: ' + 'node deletion failed - the place to be deleted (id: ' + inNode.id + ', label : ' + inNode.label + ') is flagged as part of a level 1 error state, but could not be located within the errLvl1 places array');
                            };
                        };
                        if (inNode.errorLevel2) {
                            let el2Found : boolean = false;
                            for (let el2Pos = 0; el2Pos < this._errLvl2Places.length; el2Pos++) {
                                if (this._errLvl2Places[el2Pos] !== inNode) {
                                    continue;
                                } else {
                                    this._errLvl2Places.splice(el2Pos, 1);
                                    el2Found = true;
                                    break;
                                };
                            };
                            if (!(el2Found)) {
                                throw new Error('#cls.net.dln.006: ' + 'node deletion failed - the place to be deleted (id: ' + inNode.id + ', label : ' + inNode.label + ') is flagged as part of a level 2 error state, but could not be located within the errLvl2 places array');
                            };
                        };
                        break;
                    }
                    case 'transition' : {
                        let trsFound : boolean = false;
                        for (let trsPos = 0; trsPos < this._transitions.length; trsPos++) {
                            if (this._transitions[trsPos] !== inNode) {
                                continue;
                            } else {
                                this._transitions.splice(trsPos, 1);
                                trsFound = true;
                                break;
                            };
                        };
                        if (!(trsFound)) {
                            throw new Error('#cls.net.dln.007: ' + 'node deletion failed - the node to be deleted (id: ' + inNode.id + ', label: ' + inNode.label + ') is a transition, but could not be found within the transitions array');
                        };
                        if (inNode.marked) {
                            let mrkFound : boolean = false;
                            for (let mrkPos = 0; mrkPos < this._markedTransitions.length; mrkPos++) {
                                if (this._markedTransitions[mrkPos] !== inNode) {
                                    continue;
                                } else {
                                    this._markedTransitions.splice(mrkPos, 1);
                                    mrkFound = true;
                                    break;
                                };
                            };
                            if (!(mrkFound)) {
                                throw new Error('#cls.net.dln.008: ' + 'node deletion failed - the transition to be deleted (id: ' + inNode.id + ', label : ' + inNode.label + ') is flagged as marked, but could not be located within the marked transitions array');
                            };
                        };
                        if (inNode.inSequenceLog) {
                            let sqlFound : boolean = false;
                            for (let sqlPos = 0; sqlPos < this._seqLogTransitions.length; sqlPos++) {
                                if (this._seqLogTransitions[sqlPos] !== inNode) {
                                    continue;
                                } else {
                                    this._seqLogTransitions.splice(sqlPos, 1);
                                    sqlFound = true;
                                    break;
                                };
                            };
                            if (!(sqlFound)) {
                                throw new Error('#cls.net.dln.009: ' + 'node deletion failed - the transition to be deleted (id: ' + inNode.id + ', label : ' + inNode.label + ') is flagged as part of the sequence log, but could not be located within the seqLog transitions array');
                            };
                        };
                        if (inNode.inSequencePast) {
                            let sqpFound : boolean = false;
                            for (let sqpPos = 0; sqpPos < this._seqPastTransitions.length; sqpPos++) {
                                if (this._seqPastTransitions[sqpPos] !== inNode) {
                                    continue;
                                } else {
                                    this._seqPastTransitions.splice(sqpPos, 1);
                                    sqpFound = true;
                                    break;
                                };
                            };
                            if (!(sqpFound)) {
                                throw new Error('#cls.net.dln.010: ' + 'node deletion failed - the transition to be deleted (id: ' + inNode.id + ', label : ' + inNode.label + ') is flagged as a completed part of the active sequence, but could not be located within the seqPast transitions array');
                            };
                        };
                        if (inNode.inSequenceNext) {
                            let sqnFound : boolean = false;
                            for (let sqnPos = 0; sqnPos < this._seqNextTransitions.length; sqnPos++) {
                                if (this._seqNextTransitions[sqnPos] !== inNode) {
                                    continue;
                                } else {
                                    this._seqNextTransitions.splice(sqnPos, 1);
                                    sqnFound = true;
                                    break;
                                };
                            };
                            if (!(sqnFound)) {
                                throw new Error('#cls.net.dln.011: ' + 'node deletion failed - the transition to be deleted (id: ' + inNode.id + ', label : ' + inNode.label + ') is flagged as an upcoming part of the active sequence, but could not be located within the seqNext transitions array');
                            };
                        };
                        if (inNode.errorLevel1) {
                            let el1Found : boolean = false;
                            for (let el1Pos = 0; el1Pos < this._errLvl1Transitions.length; el1Pos++) {
                                if (this._errLvl1Transitions[el1Pos] !== inNode) {
                                    continue;
                                } else {
                                    this._errLvl1Transitions.splice(el1Pos, 1);
                                    el1Found = true;
                                    break;
                                };
                            };
                            if (!(el1Found)) {
                                throw new Error('#cls.net.dln.012: ' + 'node deletion failed - the transition to be deleted (id: ' + inNode.id + ', label : ' + inNode.label + ') is flagged as part of a level 1 error state, but could not be located within the errLvl1 transitions array');
                            };
                        };
                        if (inNode.errorLevel2) {
                            let el2Found : boolean = false;
                            for (let el2Pos = 0; el2Pos < this._errLvl2Transitions.length; el2Pos++) {
                                if (this._errLvl2Transitions[el2Pos] !== inNode) {
                                    continue;
                                } else {
                                    this._errLvl2Transitions.splice(el2Pos, 1);
                                    el2Found = true;
                                    break;
                                };
                            };
                            if (!(el2Found)) {
                                throw new Error('#cls.net.dln.013: ' + 'node deletion failed - the transition to be deleted (id: ' + inNode.id + ', label : ' + inNode.label + ') is flagged as part of a level 2 error state, but could not be located within the errLvl2 transitions array');
                            };
                        };
                        break;
                    }
                };
                this._nodeCount--;
                this._nodes[inNode.id] = undefined;
            } else {
                throw new Error('#cls.net.dln.014: ' + 'node deletion failed - the node to be deleted (id: ' + inNode.id + ', label:' + inNode.label + ') could not be found at its supposed position within the nodes array');
            };
        } else {
            throw new Error('#cls.net.dln.015: ' + 'node deletion failed - the node to be deleted (id: ' + inNode.id + ', label: ' + inNode.label + ') has an id that is greater than the highest index within the nodes array (' + (this._nodes.length - 1) + ')');
        };
    };

    private checkArc(
        inSource : Node, 
        inTarget : Node
    ) : {
        arcFound : boolean, 
        foundIndices : number[]
    } {
        let currentIndex : number = 0;
        let foundIndices : number[] = [];
        for (const arc of this._arcs) {
            if (arc !== undefined) {
                if (arc.source !== inSource) {
                    currentIndex++;
                    continue;
                } else if (arc.target !== inTarget) {
                    currentIndex++;
                    continue;
                } else {
                    foundIndices.push(currentIndex);
                    currentIndex++;
                };
            } else {
                currentIndex++;
                continue;
            };
        };
        if (foundIndices.length !== 0) {
            return {
                arcFound : true, 
                foundIndices : foundIndices
            };
        } else {
            return {
                arcFound : false, 
                foundIndices : foundIndices
            };
        };
    };

    public addArc(
        inPlace : Place, 
        inTransition : Transition, 
        inPlaceIsSource : boolean, 
        inWeight? : number
    ) : {
        new_add : boolean, 
        arr_idx : number, 
        obj_ref : Arc
    } {
        let arcWeight : number;
        if (inWeight !== undefined) {
            if (inWeight > 0) {
                arcWeight = inWeight;
            } else if (inWeight === 0) {
                throw new Error('#cls.net.ada.000: ' + 'arc addition failed - cannot add arc with weight of zero');
            } else {
                throw new Error('#cls.net.ada.001: ' + 'arc addition failed - cannot add arc with negative weight');
            };
        } else {
            arcWeight = 1;
        };
        let sourceNode : Node;
        let targetNode : Node;
        if (inPlaceIsSource) {
            sourceNode = inPlace;
            targetNode = inTransition;
        } else {
            sourceNode = inTransition;
            targetNode = inPlace;
        };
        const arcExists : {arcFound : boolean, foundIndices : number[]} = this.checkArc(sourceNode, targetNode);
        if (arcExists.arcFound) {
            if (arcExists.foundIndices.length === 1) {
                const foundArc : (Arc | undefined) = this._arcs[arcExists.foundIndices[0]]
                if (foundArc !== undefined) {
                    if (foundArc.id === arcExists.foundIndices[0]) {
                        foundArc.weight = (foundArc.weight + arcWeight);
                        this._arcCount = (this._arcCount + arcWeight);
                        return {
                            new_add : false, 
                            arr_idx : foundArc.id, 
                            obj_ref : foundArc
                        };
                    } else {
                        throw new Error('#cls.net.ada.002: ' + 'arc addition failed - arc to be added (' + sourceNode.label + ' to ' + targetNode.label + ') was found within the arcs array, but the id of the found arc (' + foundArc.id + ') does not match its index (' + arcExists.foundIndices[0] + ')');                        };
                } else {
                    throw new Error('#cls.net.ada.003: ' + 'arc addition failed - arc to be added (' + sourceNode.label + ' to ' + targetNode.label + ') was found within the arcs array, but the returned arc with id (' + arcExists.foundIndices[0] + ') is undefined');
                };
            } else {
                if (arcExists.foundIndices.length > 1) {
                    throw new Error('#cls.net.ada.004: ' + 'arc addition failed - arc to be added (' + sourceNode.label + ' to ' + targetNode.label + ') was found at multiple postions within the arcs array (' + arcExists.foundIndices + ')');
                } else {
                    throw new Error('#cls.net.ada.005: ' + 'arc addition failed - arc to be added (' + sourceNode.label + ' to ' + targetNode.label + ') was found within the arcs array, but the returned list of indices has a length of (' + arcExists.foundIndices.length + ')');
                };
            };
        } else {
            const reverseExists : {arcFound : boolean, foundIndices : number[]} = this.checkArc(targetNode, sourceNode);
            if (reverseExists.arcFound) {
                if (reverseExists.foundIndices.length === 1) {
                    const reverseArc : (Arc | undefined) = this._arcs[reverseExists.foundIndices[0]]
                    if (reverseArc !== undefined) {
                        if (reverseArc.id === reverseExists.foundIndices[0]) {
                            reverseArc.reverseExists = true;
                        } else {
                            throw new Error('#cls.net.ada.006: ' + 'arc addition failed - arc to be added (' + sourceNode.label + ' to ' + targetNode.label + ') has reverse within the arcs array, but the id of the reverse arc (' + reverseArc.id + ') does not match its index (' + reverseExists.foundIndices[0] + ')');
                        };
                    } else {
                        throw new Error('#cls.net.ada.007: ' + 'arc addition failed - arc to be added (' + sourceNode.label + ' to ' + targetNode.label + ') has reverse within the arcs array, but the returned reverse arc with id (' + reverseExists.foundIndices[0] + ') is undefined');
                    };
                } else {
                    if (reverseExists.foundIndices.length > 1) {
                        throw new Error('#cls.net.ada.008: ' + 'arc addition failed - arc to be added (' + sourceNode.label + ' to ' + targetNode.label + ') has reverse arcs at multiple positions within the arcs array (' + reverseExists.foundIndices + ')');
                    } else {
                        throw new Error('#cls.net.ada.009: ' + 'arc addition failed - arc to be added (' + sourceNode.label + ' to ' + targetNode.label + ') has reverse within the arcs array, but the returned list of reverse arc indices has a length of (' + reverseExists.foundIndices.length + ')');
                    };
                };
            };
            const newArc = new Arc(this._arcs.length, inPlace, inTransition, inPlaceIsSource, arcWeight, (reverseExists.arcFound));
            if (inPlaceIsSource) {
                inPlace.outgoing.push(newArc);
                inTransition.input.push([inPlace, newArc]);
            } else {
                inTransition.output.push([inPlace, newArc]);
                inPlace.incoming.push(newArc);
            };
            const arcsLength = this._arcs.push(newArc);
            this._arcCount = this._arcCount + arcWeight;
            if (this._empty) {
                this._empty = false;
            };
            return {
                new_add : true, 
                arr_idx : (arcsLength - 1), 
                obj_ref : newArc
            };
        };
    };

    public deleteArc(
        inArc : Arc
    ) : void {
        if (this._arcs.length > inArc.id) {
            if (this._arcs[inArc.id] === inArc) {
                if (inArc.marked) {
                    let mrkFound : boolean = false;
                    for (let mrkPos = 0; mrkPos < this._markedArcs.length; mrkPos++) {
                        if (this._markedArcs[mrkPos] !== inArc) {
                            continue;
                        } else {
                            this._markedArcs.splice(mrkPos, 1);
                            mrkFound = true;
                            break;
                        };
                    };
                    if (!(mrkFound)) {
                        throw new Error('#cls.net.dla.000: ' + 'arc deletion failed - the arc to be deleted (id : ' + inArc.id + ') is flagged as marked, but could not be located within the marked arcs array');
                    };
                };
                if (inArc.inSequenceLog) {
                    let sqlFound : boolean = false;
                    for (let sqlPos = 0; sqlPos < this._seqLogArcs.length; sqlPos++) {
                        if (this._seqLogArcs[sqlPos] !== inArc) {
                            continue;
                        } else {
                            this._seqLogArcs.splice(sqlPos, 1);
                            sqlFound = true;
                            break;
                        };
                    };
                    if (!(sqlFound)) {
                        throw new Error('#cls.net.dla.001: ' + 'arc deletion failed - the arc to be deleted (id : ' + inArc.id + ') is flagged as part of the sequence log, but could not be located within the seqLog nodes array');
                    };
                };
                if (inArc.inSequencePast) {
                    let sqpFound : boolean = false;
                    for (let sqpPos = 0; sqpPos < this._seqPastArcs.length; sqpPos++) {
                        if (this._seqPastArcs[sqpPos] !== inArc) {
                            continue;
                        } else {
                            this._seqPastArcs.splice(sqpPos, 1);
                            sqpFound = true;
                            break;
                        };
                    };
                    if (!(sqpFound)) {
                        throw new Error('#cls.net.dla.002: ' + 'arc deletion failed - the arc to be deleted (id : ' + inArc.id + ') is flagged as a completed part of the active sequence, but could not be located within the seqPast nodes array');
                    };
                };
                if (inArc.inSequenceNext) {
                    let sqnFound : boolean = false;
                    for (let sqnPos = 0; sqnPos < this._seqNextArcs.length; sqnPos++) {
                        if (this._seqNextArcs[sqnPos] !== inArc) {
                            continue;
                        } else {
                            this._seqNextArcs.splice(sqnPos, 1);
                            sqnFound = true;
                            break;
                        };
                    };
                    if (!(sqnFound)) {
                        throw new Error('#cls.net.dla.003: ' + 'arc deletion failed - the arc to be deleted (id : ' + inArc.id + ') is flagged as an upcoming part of the active sequence, but could not be located within the seqNext nodes array');
                    };
                };
                if (inArc.errorLevel1) {
                    let el1Found : boolean = false;
                    for (let el1Pos = 0; el1Pos < this._errLvl1Arcs.length; el1Pos++) {
                        if (this._errLvl1Arcs[el1Pos] !== inArc) {
                            continue;
                        } else {
                            this._errLvl1Arcs.splice(el1Pos, 1);
                            el1Found = true;
                            break;
                        };
                    };
                    if (!(el1Found)) {
                        throw new Error('#cls.net.dla.004: ' + 'arc deletion failed - the arc to be deleted (id : ' + inArc.id + ') is flagged as part of a level 1 error state, but could not be located within the errLvl1 arcs array');
                    };
                };
                if (inArc.errorLevel2) {
                    let el2Found : boolean = false;
                    for (let el2Pos = 0; el2Pos < this._errLvl2Arcs.length; el2Pos++) {
                        if (this._errLvl2Arcs[el2Pos] !== inArc) {
                            continue;
                        } else {
                            this._errLvl2Arcs.splice(el2Pos, 1);
                            el2Found = true;
                            break;
                        };
                    };
                    if (!(el2Found)) {
                        throw new Error('#cls.net.dla.005: ' + 'arc deletion failed - the arc to be deleted (id : ' + inArc.id + ') is flagged as part of a level 2 error state, but could not be located within the errLvl2 arcs array');
                    };
                };
                if (inArc.reverseExists) {
                    const reverseExists : {arcFound : boolean, foundIndices : number[]} = this.checkArc(inArc.target, inArc.source);
                    if (reverseExists.arcFound) {
                        if (reverseExists.foundIndices.length === 1) {
                            const reverseArc : (Arc | undefined) = this._arcs[reverseExists.foundIndices[0]]
                            if (reverseArc !== undefined) {
                                if (reverseArc.id === reverseExists.foundIndices[0]) {
                                    reverseArc.reverseExists = false;
                                } else {
                                    throw new Error('#cls.net.dla.006: ' + 'arc deletion failed - arc to be deleted (id : ' + inArc.id + ') has a reverse arc within the arcs array, but the id of the reverse arc (' + reverseArc.id + ') does not match its index (' + reverseExists.foundIndices[0] + ')');
                                };
                            } else {
                                throw new Error('#cls.net.dla.007: ' + 'arc deletion failed - arc to be deleted (id : ' + inArc.id + ') has a reverse arc within the arcs array, but the returned reverse arc with id (' + reverseExists.foundIndices[0] + ') is undefined');
                            };
                        } else {
                            if (reverseExists.foundIndices.length > 1) {
                                throw new Error('#cls.net.dla.008: ' + 'arc deletion failed - arc to be deleted (id : ' + inArc.id + ') has reverse arcs at multiple positions within the arcs array (' + reverseExists.foundIndices + ')');
                            } else {
                                throw new Error('#cls.net.dla.009: ' + 'arc deletion failed - arc to be deleted (id : ' + inArc.id + ') has a reverse arc within the arcs array, but the returned list of reverse arc indices has a length of (' + reverseExists.foundIndices.length + ')');
                            };
                        };
                    };
                };
                if (inArc.placeIsSource) {
                    const foundPlcOut : number[] = [];
                    const foundTrsIn : number[] = [];
                    for (let o = 0; o < inArc.place.outgoing.length; o++) {
                        if (inArc.place.outgoing[o] !== inArc) {
                            continue;
                        } else {
                            foundPlcOut.push(o);
                        };
                    };
                    if (foundPlcOut.length === 1) {
                        inArc.place.outgoing.splice(foundPlcOut[0], 1);
                    } else {
                        if (foundPlcOut.length > 1) {
                            throw new Error('#cls.net.dla.010: ' + 'arc deletion failed - arc to be deleted (id : ' + inArc.id + ') is listed ' + foundPlcOut.length + ' times as an outgoing arc of the source place (id : ' + inArc.place.id + ')');
                        } else {
                            throw new Error('#cls.net.dla.011: ' + 'arc deletion failed - arc to be deleted (id : ' + inArc.id + ') should be listed as an outgoing arc of the source place (id : ' + inArc.place.id + '), but the search returned an array of length ' + foundPlcOut.length);
                        };
                    };
                    for (let i = 0; i < inArc.transition.input.length; i++) {
                        if (inArc.transition.input[i][0] !== inArc.place) {
                            continue;
                        } else {
                            if (inArc.transition.input[i][1] !== inArc) {
                                continue;
                            } else {
                                foundTrsIn.push(i);
                            };
                        };
                    };
                    if (foundTrsIn.length === 1) {
                        inArc.transition.input.splice(foundTrsIn[0], 1);
                    } else {
                        if (foundTrsIn.length > 1) {
                            throw new Error('#cls.net.dla.012: ' + 'arc deletion failed - arc to be deleted (id : ' + inArc.id + ') is listed ' + foundTrsIn.length + ' times as an input of the target transition (id : ' + inArc.transition.id + ')');
                        } else {
                            throw new Error('#cls.net.dla.013: ' + 'arc deletion failed - arc to be deleted (id : ' + inArc.id + ') should be listed as an input of the target transition (id : ' + inArc.transition.id + '), but the search returned an array of length ' + foundTrsIn.length);
                        };
                    };
                } else {
                    const foundTrsOut : number[] = [];
                    const foundPlcIn : number[] = [];
                    for (let o = 0; o < inArc.transition.output.length; o++) {
                        if (inArc.transition.output[o][0] !== inArc.place) {
                            continue;
                        } else {
                            if (inArc.transition.output[o][1] !== inArc) {
                                continue;
                            } else {
                                foundTrsOut.push(o);
                            };
                        };
                    };
                    if (foundTrsOut.length === 1) {
                        inArc.transition.output.splice(foundTrsOut[0], 1);
                    } else {
                        if (foundTrsOut.length > 1) {
                            throw new Error('#cls.net.dla.014: ' + 'arc deletion failed - arc to be deleted (id : ' + inArc.id + ') is listed ' + foundTrsOut.length + ' times as an output of the source transition (id : ' + inArc.transition.id + ')');
                        } else {
                            throw new Error('#cls.net.dla.015: ' + 'arc deletion failed - arc to be deleted (id : ' + inArc.id + ') should be listed as an output of the source transition (id : ' + inArc.transition.id + '), but the search returned an array of length ' + foundTrsOut.length);
                        };
                    };
                    for (let i = 0; i < inArc.place.incoming.length; i++) {
                        if (inArc.place.incoming[i] !== inArc) {
                            continue;
                        } else {
                            foundPlcIn.push(i);
                        };
                    };
                    if (foundPlcIn.length === 1) {
                        inArc.place.incoming.splice(foundPlcIn[0], 1);
                    } else {
                        if (foundPlcIn.length > 1) {
                            throw new Error('#cls.net.dla.016: ' + 'arc deletion failed - arc to be deleted (id : ' + inArc.id + ') is listed ' + foundPlcIn.length + ' times as an incoming arc of the target place (id : ' + inArc.place.id + ')');
                        } else {
                            throw new Error('#cls.net.dla.017: ' + 'arc deletion failed - arc to be deleted (id : ' + inArc.id + ') should be listed as an incoming arc of the target place (id : ' + inArc.place.id + '), but the search returned an array of length ' + foundPlcIn.length);
                        };
                    };
                };
                this._arcCount = (this._arcCount - inArc.weight);
                this._arcs[inArc.id] = undefined;
            } else {
                throw new Error('#cls.net.dla.018: ' + 'arc deletion failed - the arc to be deleted (id: ' + inArc.id + ') could not be found at its supposed position within the arcs array');
            };
        } else {
            throw new Error('#cls.net.dla.019: ' + 'arc deletion failed - the arc to be deleted (id: ' + inArc.id + ') has an id that is greater than the highest index within the arcs array (' + (this._arcs.length - 1) + ')');
        };
    };

    public updateArcWeight(
        inArc : Arc, 
        inWeight : number
    ) : void {
        if (this._arcs.length > inArc.id) {
            if (this._arcs[inArc.id] === inArc) {
                if (inWeight > 0) {
                    const weightDifference : number = (inWeight - inArc.weight)
                    if (weightDifference !== 0) {
                        inArc.weight = inArc.weight + weightDifference;
                        this._arcCount = this._arcCount + weightDifference;
                    };
                } else if (inWeight === 0) {
                    return this.deleteArc(inArc);
                } else {
                    throw new Error('#cls.net.uaw.000: ' + 'updating arc weight failed - cannot set arc weight to negative value');
                };
            } else {
                throw new Error('#cls.net.uaw.001: ' + 'updating arc weight failed - the arc to be updated (id: ' + inArc.id + ') could not be found at its supposed position within the arcs array');
            };
        } else {
            throw new Error('#cls.net.uaw.002: ' + 'updating arc weight failed - the arc to be updated (id: ' + inArc.id + ') has an id that is greater than the highest index within the arcs array (' + (this._arcs.length - 1) + ')');
        };
    };

};