import {Arc} from './arc';
import {Node} from './node';
import {Place} from './place';

export class Transition extends Node {
    
    /* attributes */

    private _enabled : boolean;

    private _input : [Place, Arc][];
    private _output : [Place, Arc][];

    /* methods : constructor */

    public constructor(
        id : number, 
        label : string, 
        xCoordinate : number, 
        yCoordinate : number
    ) {
        let shortLabel : string = label.replace(/\s/g, "");
        if (shortLabel.length > 2) {
            shortLabel = (shortLabel[0] + shortLabel[1] + shortLabel[2]);
        } else if (shortLabel.length > 1) {
            shortLabel = (shortLabel[0] + shortLabel[1]);
        } else if (shortLabel.length > 0) {
            shortLabel = (shortLabel[0]);
        };
        super(id, 'transition', label, shortLabel, xCoordinate, yCoordinate);
        this._enabled = false;
        this._input = [];
        this._output = [];
    };

    /* methods : getters */

    public get enabled() : boolean {
        return this._enabled;
    };

    public get input() : [Place, Arc][] {
        return this._input;
    };

    public get output() : [Place, Arc][] {
        return this._output;
    };

    /* methods : setters */

    public set enabled(inValue : boolean) {
        this._enabled = inValue;
    };

};