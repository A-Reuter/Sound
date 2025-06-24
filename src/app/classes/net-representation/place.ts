import {Arc} from './arc';
import {Node} from './node';

export class Place extends Node {
    
    /* attributes */

    private readonly _initialMarking : number;

    private _marking : number;
    
    private _isSource : boolean;
    private _isSink : boolean;
    
    private _incoming : Arc[];
    private _outgoing : Arc[];

    /* methods : constructor */

    public constructor(
        id : number, 
        label : string, 
        initialMarking : number, 
        xCoordinate : number, 
        yCoordinate : number
    ) {
        let shortLabel : string = label.replace(/\s/g, "");
        if (shortLabel.length !== 0) {
            shortLabel = shortLabel[0];
        };
        super(id, 'place', label, shortLabel, xCoordinate, yCoordinate);
        this._initialMarking = initialMarking;
        this._marking = initialMarking;
        this._isSource = false;
        this._isSink = false;
        this._incoming = [];
        this._outgoing = [];
    };

    /* methods : getters */

    public get initialMarking() : number {
        return this._initialMarking;
    };

    public get marking() : number {
        return this._marking;
    };

    public get isSource() : boolean {
        return this._isSource;
    };

    public get isSink() : boolean {
        return this._isSink;
    };

    public get incoming() : Arc[] {
        return this._incoming;
    };

    public get outgoing() : Arc[] {
        return this._outgoing;
    };

    /* methods : setters */

    public set marking(inMarking : number) {
        this._marking = inMarking;
    };

    public set isSource(inValue : boolean) {
        this._isSource = inValue;
    };

    public set isSink(inValue : boolean) {
        this._isSink = inValue;
    };

};