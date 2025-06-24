import {LinkedListEntry} from './linked-list-entry';
import {LinkedList} from './linked-list';

export class LinkedListIterator<T> {

    /* attributes */

    private currentEntry : LinkedListEntry<T> | undefined;

    /* methods : constructor */

    public constructor(list : LinkedList<T>, inArg0 : 'first' | 'last') {
        if (inArg0 === 'first') {
            this.currentEntry = list.getFirstEntry();
        }
        else {
            this.currentEntry = list.getLastEntry();
        };
    };

    /* methods : getters */

    public getCurrentEntry() : LinkedListEntry<T> | undefined {
        return this.currentEntry;
    };

    /* methods : other */

    public toPreviousEntry() : void {
        if (this.currentEntry !== undefined) {
            if (this.currentEntry.getPrev() !== undefined) {
                this.currentEntry = this.currentEntry.getPrev();
            } else {
                throw new Error('#cls.lli.pve.001: ' + 'iterator step to prev failed - previous entry is undefined');
            };
        } else {
            throw new Error('#cls.lli.pve.000: ' + 'iterator step to prev failed - current entry is undefined');
        };
    };

    public toNextEntry() : void {
        if (this.currentEntry !== undefined) {
            if (this.currentEntry.getNext() !== undefined) {
                this.currentEntry = this.currentEntry.getNext();
            } else {
                throw new Error('#cls.lli.nxe.001: ' + 'iterator step to next failed - next entry is undefined');
            };
        } else {
            throw new Error('#cls.lli.nxe.000: ' + 'iterator step to next failed - current entry is undefined');
        };
    };

};