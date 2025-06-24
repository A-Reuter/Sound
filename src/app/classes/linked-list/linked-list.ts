import {LinkedListEntry} from './linked-list-entry';

export class LinkedList<T> {

    /* attributes */

    private length : number;

    private firstEntry : LinkedListEntry<T> | undefined;
    private lastEntry : LinkedListEntry<T> | undefined;

    /* methods : constructor*/

    public constructor() {
        this.length = 0;
        this.firstEntry = undefined;
        this.lastEntry = undefined;
    };

    /* methods : getters */

    public getLength() : number {
        return this.length;
    };

    public getFirstEntry() : LinkedListEntry<T> | undefined {
        return this.firstEntry;
    };

    public getLastEntry() : LinkedListEntry<T> | undefined {
        return this.lastEntry;
    };

    /* methods : other */

    public prependData(inData : T) : void {
        this.prependEntry(new LinkedListEntry(inData));
    };

    private prependEntry(inEntry : LinkedListEntry<T>) : void {
        if (inEntry !== undefined) {
            if (this.length === 0) {
                this.firstEntry = inEntry;
                this.lastEntry = inEntry;
            } else if (this.firstEntry === undefined) {
                throw new Error('#cls.lll.ppe..001: ' + 'prepend failed - list has more than 0 entries but first entry is undefined');
            } else {
                inEntry.setNext(this.firstEntry);
                this.firstEntry.setPrev(inEntry);
                this.firstEntry = inEntry;
            };
            this.length++;
        } else {
            throw new Error('#cls.lll.ppe.000: ' + 'prepend failed - entry to prepend is undefined');
        };
    };

    public appendData(inData : T) : void {
        this.appendEntry(new LinkedListEntry(inData));
    };

    private appendEntry(inEntry : LinkedListEntry<T>) : void {
        if (inEntry !== undefined) {
            if (this.length === 0) {
                this.firstEntry = inEntry;
                this.lastEntry = inEntry;
            } else if (this.lastEntry === undefined) {
                throw new Error('#cls.lll.ape.001: ' + 'append failed - list has > 0 entries but last entry is undefined');
            } else {
                inEntry.setPrev(this.lastEntry);
                this.lastEntry.setNext(inEntry);
                this.lastEntry = inEntry;
            };
            this.length++;
        } else {
            throw new Error('#cls.lll.ape.000: ' + 'append failed - entry to append is undefined');
        };
    };

    public deleteEntry(inEntry : LinkedListEntry<T>) : void {
        if (this.length > 0) {
            if (inEntry === this.firstEntry) {
                if (inEntry === this.lastEntry) {
                    this.firstEntry = undefined;
                    this.lastEntry = undefined;
                }
                else {
                    if (this.firstEntry.getNext() !== undefined) {
                        this.firstEntry = this.firstEntry.getNext();
                        if (this.firstEntry !== undefined) {
                            if (this.firstEntry.getPrev() !== undefined) {
                                this.firstEntry.getPrev()?.setNext(undefined);
                            } else {
                                throw new Error('#cls.lll.dle.004: delete failed - previous entry of second entry is undefined');
                            };
                        } else {
                            throw new Error('#cls.lll.dle.003: delete failed - impossible error');
                        };
                        this.firstEntry.setPrev(undefined);
                    } else {
                        throw new Error('#cls.lll.dle.002: ' + 'delete failed - first entry and last entry are not equal, but next entry of first entry is undefined');
                    };
                };
            }
            else if (inEntry === this.lastEntry) {
                if (this.lastEntry.getPrev() !== undefined) {
                    this.lastEntry = this.lastEntry.getPrev();
                    if (this.lastEntry !== undefined) {
                        if (this.lastEntry.getNext() !== undefined) {
                            this.lastEntry.getNext()?.setPrev(undefined);
                        } else {
                            throw new Error('#cls.lll.dle.007: delete failed - next entry of second-to-last entry is undefined');
                        };
                    } else {
                        throw new Error('#cls.lll.dle.006: delete failed - impossible error');
                    };
                    this.lastEntry.setNext(undefined);
                } else {
                    throw new Error('#cls.lll.dle.005: ' + 'delete failed - first entry and last entry are not equal, but previousd entry of last entry is undefined');
                };
            }
            else {
                if (inEntry.getPrev() !== undefined) {
                    if (inEntry.getNext() !== undefined) {
                        inEntry.getPrev()?.setNext(inEntry.getNext());
                        inEntry.getNext()?.setPrev(inEntry.getPrev());
                        inEntry.setPrev(undefined);
                        inEntry.setNext(undefined);
                    } else {
                        throw new Error('#cls.lll.dle.009: delete failed - given entry is not the last entry, but the next entry of the given entry is undefined');
                    };
                } else {
                    throw new Error('#cls.lll.dle.008: delete failed - given entry is not the first entry, but the previous entry of the given entry is undefined');
                };
            };
            this.length--;
        } else if (this.length === 0) {
            throw new Error('#cls.lll.dle.001: ' + 'delete failed - list has 0 entries');
        } else {
            throw new Error('#cls.lll.dle.000: ' + 'delete failed - list has less than 0 entries (' + this.length + ')');
        };
    };

};