export class LinkedListEntry<T> {

    /* attributes */

    private readonly data : T;

    private prev : LinkedListEntry<T> | undefined;
    private next : LinkedListEntry<T> | undefined;

    /* methods : constructor */

    public constructor(data : T) {
        this.data = data;
        this.prev = undefined;
        this.next = undefined;
    };

    /* methods : getters */

    public getData() : T {
        return this.data;
    };
    public getPrev() : LinkedListEntry<T> | undefined {
        return this.prev;
    };
    public getNext() : LinkedListEntry<T> | undefined {
        return this.next;
    };

    /* methods : setters */

    public setPrev(inEntry : LinkedListEntry<T> | undefined) : void {
        this.prev = inEntry;
    };
    public setNext(inEntry : LinkedListEntry<T> | undefined) : void {
        this.next = inEntry;
    };

};