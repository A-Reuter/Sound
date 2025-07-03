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
        let characters : string = label.replace(/(\s|\r|\n)/g, "");
        let first : string = characters.slice(0, 1);
        let consonants : (string[] | null) = characters.slice(1).match(/[^AEIOU]/gi);
        let short : string;
        if (characters.length > 3) {
            if ((first) && (consonants) && (consonants.length > 1)) {
                short = (first + consonants[0] + consonants[1]);
            } else {
                short = (characters.slice(0, 3));
            };
        } else {
            short = (characters);
        };
        super(id, 'transition', label, short, xCoordinate, yCoordinate);
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