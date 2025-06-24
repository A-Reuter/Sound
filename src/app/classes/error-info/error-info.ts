export class ErrorInfo {

    /* attributes */

    private readonly _paragraphs : ErrorParagraph[];

    /* methods : constructor */

    public constructor(paragraphs : ErrorParagraph[]) {
        this._paragraphs = paragraphs;
    };

    /* methods : getters */

    public get paragraphs() : ErrorParagraph[] {
        return this._paragraphs;
    };

};

export class ErrorParagraph {

    /* attributes */

    private readonly _title : string;

    private readonly _content : ErrorItemBucket[];

    /* methods : constructor */

    public constructor(title : string, content: ErrorItemBucket[]) {
        this._title = title;
        this._content = content;
    };

    /* methods : getters */

    public get title() : string {
        return this._title;
    };

    public get content() : ErrorItemBucket[] {
        return this._content;
    };

};

export class ErrorItemBucket {

    /* attributes */

    private readonly _type : ('text' | 'list');
    private readonly _items : string[];
    private readonly _ending : boolean;

    /* methods : constructor */

    public constructor(type : ('text' | 'list'), items : string[], ending : boolean) {
        this._type = type;
        this._items = items;
        this._ending = ending;
    };

    /* methods : getters */

    public get type() : string {
        return this._type;
    };

    public get items() : string[] {
        return this._items;
    };

    public get ending() : boolean {
        return this._ending;
    };

};