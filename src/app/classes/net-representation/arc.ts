import {Node} from './node';
import {Place} from './place';
import {Transition} from './transition';

export class Arc {
    
    /* attributes */

    private readonly _id : number;
    private readonly _sourceNode : Node;
    private readonly _targetNode : Node;
    private readonly _place : Place;
    private readonly _transition : Transition;
    private readonly _placeIsSource : boolean;

    private _weight : number;

    private _reverseExists : boolean;

    private _active : boolean;
    private _marked : boolean;
    private _errorLevel1 : boolean;
    private _errorLevel2 : boolean;
    private _inSequenceLog : boolean;
    private _inSequencePast : boolean;
    private _inSequenceNext : boolean;

    private _overrideHover : boolean;

    private _svgElements : {
        arc    : SVGElement | undefined,
        weight : SVGElement | undefined,
    };
    
    /* methods : constructor */

    public constructor(
        id : number, 
        place : Place, 
        transition : Transition, 
        placeIsSource : boolean, 
        weight : number, 
        reverseExists : boolean
    ) {
        this._id = id;
        this._place = place;
        this._transition = transition;
        this._placeIsSource = placeIsSource;
        if (placeIsSource) {
            this._sourceNode = place;
            this._targetNode = transition;
        } else {
            this._sourceNode = transition;
            this._targetNode = place;
        };
        this._weight = weight;
        this._reverseExists = reverseExists;
        this._active = false;
        this._marked = false;
        this._errorLevel1 = false;
        this._errorLevel2 = false;
        this._inSequenceLog = false;
        this._inSequencePast = false;
        this._inSequenceNext = false;
        this._overrideHover = false;
        this._svgElements = {
            arc    : undefined,
            weight : undefined,
        };
    };

    /* methods : getters */

    public get id() : number {
        return this._id;
    };

    public get source() : Node {
        return this._sourceNode;
    };

    public get target() : Node {
        return this._targetNode;
    };

    public get place() : Place {
        return this._place;
    };

    public get transition() : Transition {
        return this._transition;
    };

    public get placeIsSource() : boolean {
        return this._placeIsSource;
    };

    public get weight() : number {
        return this._weight;
    };

    public get reverseExists() : boolean {
        return this._reverseExists;
    };

    public get active() : boolean {
        return this._active;
    };

    public get marked() : boolean {
        return this._marked;
    };

    public get errorLevel1() : boolean {
        return this._errorLevel1;
    };

    public get errorLevel2() : boolean {
        return this._errorLevel2;
    };

    public get inSequenceLog() : boolean {
        return this._inSequenceLog;
    };

    public get inSequencePast() : boolean {
        return this._inSequencePast;
    };

    public get inSequenceNext() : boolean {
        return this._inSequenceNext;
    };

    public get overrideHover() : boolean {
        return this._overrideHover;
    };

    public get svgElements() : {
        arc    : SVGElement | undefined,
        weight : SVGElement | undefined,
    } {
        return this._svgElements;
    };
    
    /* methods : setters */

    public set weight(inWeight : number) {
        this._weight = inWeight;
    };

    public set reverseExists(inValue: boolean) {
        this._reverseExists = inValue;
    };

    public set active(inValue : boolean) {
        this._active = inValue;
    };

    public set marked(inValue : boolean) {
        this._marked = inValue;
    };

    public set errorLevel1(inValue : boolean) {
        this._errorLevel1 = inValue;
    };

    public set errorLevel2(inValue : boolean) {
        this._errorLevel2 = inValue;
    };

    public set inSequenceLog(inValue : boolean) {
        this._inSequenceLog = inValue;
    };

    public set inSequencePast(inValue : boolean) {
        this._inSequencePast = inValue;
    };

    public set inSequenceNext(inValue : boolean) {
        this._inSequenceNext = inValue;
    };

    public set overrideHover(inValue : boolean) {
        this._overrideHover = inValue;
    };
    
    public set svgElements(inSvgElements : {
        arc    : SVGElement | undefined,
        weight : SVGElement | undefined,
    }) {
        this._svgElements = inSvgElements;
    };

};