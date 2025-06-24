export abstract class Node {
    
    /* attributes */

    private readonly _id : number;
    private readonly _type : ('place' | 'transition');
    private readonly _label : string;
    private readonly _short : string;

    private _x_coordinate : number;
    private _y_coordinate : number;

    private _active : boolean;
    private _marked : boolean;
    private _errorLevel1 : boolean;
    private _errorLevel2 : boolean;
    private _inSequenceLog : boolean;
    private _inSequencePast : boolean;
    private _inSequenceNext : boolean;

    private _infoOverride : boolean;
    private _infoActive : boolean;
    private _hoverActive : boolean;
    private _hoverCancelled : boolean;

    private _svgElements : {
        node             : SVGElement | undefined,
        symbol           : SVGElement | undefined,
        symbolText       : SVGElement | undefined,
        symbolBackground : SVGElement | undefined,
        label            : SVGElement | undefined,
        id               : SVGElement | undefined,
        info             : SVGElement | undefined,
        infoTextType     : SVGElement | undefined,
        infoTextPosition : SVGElement | undefined,
    };

    /* methods : constructor */

    public constructor(
        id : number, 
        type : ('place' | 'transition'), 
        label : string, 
        short : string, 
        xCoordinate : number, 
        yCoordinate : number
    ) {
        this._id = id;
        this._type = type;
        this._label = label;
        this._short = short;
        this._x_coordinate = xCoordinate;
        this._y_coordinate = yCoordinate;
        this._active = false;
        this._marked = false;
        this._errorLevel1 = false;
        this._errorLevel2 = false;
        this._inSequenceLog = false;
        this._inSequencePast = false;
        this._inSequenceNext = false;
        this._infoOverride = false;
        this._infoActive = false;
        this._hoverActive = false;
        this._hoverCancelled = false;
        this._svgElements = {
            node : undefined,
            symbol : undefined,
            symbolText : undefined,
            symbolBackground : undefined,
            label : undefined,
            id : undefined,
            info : undefined,
            infoTextType : undefined,
            infoTextPosition : undefined,
        };
    };

    /* methods : getters */

    public get id() : number {
        return this._id;
    };

    public get type() : ('place' | 'transition') {
        return this._type;
    };

    public get label() : string {
        return this._label;
    };

    public get short() : string {
        return this._short;
    };

    public get x() : number {
        return this._x_coordinate;
    };

    public get y() : number {
        return this._y_coordinate;
    };

    public get coordinates() : [x : number, y : number] {
        return [this._x_coordinate, this._y_coordinate];
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

    public get infoOverride() : boolean {
        return this._infoOverride;
    };

    public get infoActive() : boolean {
        return this._infoActive;
    };

    public get hoverActive() : boolean {
        return this._hoverActive;
    };

    public get hoverCancelled() : boolean {
        return this._hoverCancelled;
    };
    
    public get svgElements() : {
        node             : SVGElement | undefined,
        symbol           : SVGElement | undefined,
        symbolText       : SVGElement | undefined,
        symbolBackground : SVGElement | undefined,
        label            : SVGElement | undefined,
        id               : SVGElement | undefined,
        info             : SVGElement | undefined,
        infoTextType     : SVGElement | undefined,
        infoTextPosition : SVGElement | undefined,
    } {
        return this._svgElements;
    };

    /* methods : setters */

    public set x(inX : number) {
        this._x_coordinate = inX;
    };

    public set y(inY : number) {
        this._y_coordinate = inY;
    };

    public set coordinates(inCoords : [inX : number, inY : number]) {
        this._x_coordinate = inCoords[0];
        this._y_coordinate = inCoords[1];
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

    public set infoOverride(inValue : boolean) {
        this._infoOverride = inValue;
    };

    public set infoActive(inValue : boolean) {
        this._infoActive = inValue;
    };

    public set hoverActive(inValue : boolean) {
        this._hoverActive = inValue;
    };

    public set hoverCancelled(inValue : boolean) {
        this._hoverCancelled = inValue;
    };
    
    public set svgElements(inSvgElements : {
        node             : SVGElement | undefined,
        symbol           : SVGElement | undefined,
        symbolText       : SVGElement | undefined,
        symbolBackground : SVGElement | undefined,
        label            : SVGElement | undefined,
        id               : SVGElement | undefined,
        info             : SVGElement | undefined,
        infoTextType     : SVGElement | undefined,
        infoTextPosition : SVGElement | undefined,
    }) {
        this._svgElements = inSvgElements;
    };

};