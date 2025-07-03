import {Injectable} from '@angular/core';

@Injectable({
    providedIn: 'root',
})
export class GraphicsConfigService {

    /* attributes */

    /* dimensions of the canvas */
    private readonly _canvasWidth : number = 1800;
    private readonly _canvasHeight : number = 600;

    /* dimensions of nodes, arcs & arrowheads */
    private readonly _defaultNodeRadius : number = 20;
    private readonly _defaultArrowRadius : number = 2;
    private readonly _defaultNetStrokeWidth : number = 5;

    /* dimensions of log elements */
    private readonly _defaultInnerLogElementRadius : number = 25;
    private readonly _defaultInnerLogArrowRadius : number = 2;
    private readonly _defaultInnerLogStrokeWidth : number = 4;
    private readonly _defaultOuterLogStrokeWidth : number = 5;

    /* dimensions of nodeinfo-textboxes */
    private readonly _defaultTextBoxWidth : number = 400;
    private readonly _defaultTextBoxHeight : number = 90;
    private readonly _defaultMaxTextWidth : number = Math.floor(Math.ceil(this._defaultTextBoxWidth - (this._defaultTextBoxWidth / 10)) / 10);

    /* offset for symbols displayed directly on top of node objects */
    private readonly _defaultNodeSymbolOffset : number = (0.3 * this._defaultNodeRadius);
    private readonly _reducedNodeSymbolOffset : number = (0.575 * this._defaultNodeRadius);
    private readonly _minimalNodeSymbolOffset : number = (0.725 * this._defaultNodeRadius);

    /* delay for animations */
    private readonly _defaultInfoHoverDelay : number = 750;
    // private readonly _defaultTraceAnimationDelay : number = 2;

    /* colors for nodes, arcs, traces, and text */
    private readonly _defaultStroke  = 'rgb(0,0,0)';
    private readonly _defaultFill    = 'rgb(200, 200, 200)';
    private readonly _activeStroke   = 'rgb(0, 255, 255)';
    private readonly _activeFill     = 'rgb(125, 255, 255)';
    private readonly _markedStroke   = 'rgb(255, 0, 255)';
    private readonly _markedFill     = 'rgb(255, 125, 255)';
    private readonly _sourceStroke   = 'rgb(0, 0, 255)';
    private readonly _sourceFill     = 'rgb(125, 155, 255)';
    private readonly _sinkStroke     = 'rgb(255, 125, 0)';
    private readonly _sinkFill       = 'rgb(255, 175, 100)';
    private readonly _enabledStroke  = 'rgb(0, 255, 0)';
    private readonly _enabledFill    = 'rgb(125, 255, 125)';
    private readonly _seqErrStroke   = 'rgb(255, 150, 150)';
    private readonly _seqErrFill     = 'rgb(255, 180, 180)';
    private readonly _seqLogStroke   = 'rgb(200, 200, 200)';
    private readonly _seqLogFill     = 'rgb(225, 225, 225)';
    private readonly _seqPastStroke  = 'rgb(0, 150, 0)';
    private readonly _seqPastFill    = 'rgb(110, 175, 110)';
    private readonly _seqNextStroke  = 'rgb(0, 90, 255)';
    private readonly _seqNextFill    = 'rgb(55, 125, 255)';
    private readonly _untrvStroke    = 'rgb(255, 195, 0)';
    private readonly _untrvFill      = 'rgb(255, 220, 105)';
    private readonly _errLvl0Stroke  = 'rgb(200, 200, 200)';
    private readonly _errLvl0Fill    = 'rgb(225, 225, 225)';
    private readonly _errLvl1Stroke  = 'rgb(255, 255, 0)';
    private readonly _errLvl1Fill    = 'rgb(255, 255, 125)';
    private readonly _errLvl2Stroke  = 'rgb(255, 0, 0)';
    private readonly _errLvl2Fill    = 'rgb(255, 125, 125)';
    private readonly _textBoxStroke  = 'rgb(0,0,0)';
    private readonly _textBoxFill    = 'rgb(255,255,255)';
    private readonly _textFill       = 'rgb(0,0,0)';
    private readonly _logBoxFill     = 'rgb(255,255,255)';
    private readonly _neutralFill    = 'rgb(225, 225, 225)';
    private readonly _logBoxStroke   = 'rgb(60, 60, 60)';
    private readonly _invalidFill    = 'rgb(255, 175, 175)';
    private readonly _invalidStrokeA = 'rgb(255, 175, 175)';
    private readonly _invalidStrokeB = 'rgb(255, 95, 95)';
    private readonly _validFill      = 'rgb(175, 255, 175)';
    private readonly _validStrokeA   = 'rgb(175, 255, 175)';
    private readonly _validStrokeB   = 'rgb(95, 255, 95)';

    /* methods : getters */

    public get canvasWidth(): number {
        return this._canvasWidth;
    };

    public get canvasHeight(): number {
        return this._canvasHeight;
    };

    public get defaultNodeRadius(): number {
        return this._defaultNodeRadius;
    };

    public get defaultArrowRadius(): number {
        return this._defaultArrowRadius;
    };

    public get defaultNetStrokeWidth(): number {
        return this._defaultNetStrokeWidth;
    };

    public get defaultInnerLogElementRadius(): number {
        return this._defaultInnerLogElementRadius;
    };

    public get defaultInnerLogArrowRadius(): number {
        return this._defaultInnerLogArrowRadius;
    };

    public get defaultInnerLogStrokeWidth(): number {
        return this._defaultInnerLogStrokeWidth;
    };

    public get defaultOuterLogStrokeWidth(): number {
        return this._defaultOuterLogStrokeWidth;
    };

    public get defaultTextBoxWidth(): number {
        return this._defaultTextBoxWidth;
    };

    public get defaultTextBoxHeight(): number {
        return this._defaultTextBoxHeight;
    };

    public get defaultMaxTextWidth(): number {
        return this._defaultMaxTextWidth;
    };

    public get defaultNodeSymbolOffset(): number {
        return this._defaultNodeSymbolOffset;
    };

    public get reducedNodeSymbolOffset(): number {
        return this._reducedNodeSymbolOffset;
    };

    public get minimalNodeSymbolOffset(): number {
        return this._minimalNodeSymbolOffset;
    };

    public get defaultInfoHoverDelay(): number {
        return this._defaultInfoHoverDelay;
    };

    public get defaultStroke(): string {
        return this._defaultStroke;
    };

    public get defaultFill(): string {
        return this._defaultFill;
    };

    public get activeStroke(): string {
        return this._activeStroke;
    };

    public get activeFill(): string {
        return this._activeFill;
    };

    public get markedStroke(): string {
        return this._markedStroke;
    };

    public get markedFill(): string {
        return this._markedFill;
    };

    public get sourceStroke(): string {
        return this._sourceStroke;
    };

    public get sourceFill(): string {
        return this._sourceFill;
    };

    public get sinkStroke(): string {
        return this._sinkStroke;
    };

    public get sinkFill(): string {
        return this._sinkFill;
    };

    public get enabledStroke(): string {
        return this._enabledStroke;
    };

    public get enabledFill(): string {
        return this._enabledFill;
    };

    public get seqErrStroke(): string {
        return this._seqErrStroke;
    };

    public get seqErrFill(): string {
        return this._seqErrFill;
    };

    public get seqLogStroke(): string {
        return this._seqLogStroke;
    };

    public get seqLogFill(): string {
        return this._seqLogFill;
    };

    public get seqPastStroke(): string {
        return this._seqPastStroke;
    };

    public get seqPastFill(): string {
        return this._seqPastFill;
    };

    public get seqNextStroke(): string {
        return this._seqNextStroke;
    };

    public get seqNextFill(): string {
        return this._seqNextFill;
    };

    public get untrvStroke(): string {
        return this._untrvStroke;
    };

    public get untrvFill(): string {
        return this._untrvFill;
    };

    public get errLvl0Stroke(): string {
        return this._errLvl0Stroke;
    };

    public get errLvl0Fill(): string {
        return this._errLvl0Fill;
    };

    public get errLvl1Stroke(): string {
        return this._errLvl1Stroke;
    };

    public get errLvl1Fill(): string {
        return this._errLvl1Fill;
    };

    public get errLvl2Stroke(): string {
        return this._errLvl2Stroke;
    };

    public get errLvl2Fill(): string {
        return this._errLvl2Fill;
    };

    public get textBoxStroke(): string {
        return this._textBoxStroke;
    };

    public get textBoxFill(): string {
        return this._textBoxFill;
    };

    public get textFill(): string {
        return this._textFill;
    };

    public get logBoxFill(): string {
        return this._logBoxFill;
    };

    public get logBoxStroke(): string {
        return this._logBoxStroke;
    };

    public get neutralFill(): string {
        return this._neutralFill;
    };

    public get invalidFill(): string {
        return this._invalidFill;
    };

    public get invalidStrokeA(): string {
        return this._invalidStrokeA;
    };

    public get invalidStrokeB(): string {
        return this._invalidStrokeB;
    };

    public get validFill(): string {
        return this._validFill;
    };

    public get validStrokeA(): string {
        return this._validStrokeA;
    };

    public get validStrokeB(): string {
        return this._validStrokeB;
    };

};