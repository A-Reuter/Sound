import {Injectable} from '@angular/core';

import {Subject} from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class ToastService {

    /* attributes */

    private toastSubject = new Subject<{
        type : ('toast' | 'panel'),
        content : ('info' | 'success' | 'warning' | 'error'),
        duration : number,
        message : string[]
    }>();

    toast$ = this.toastSubject.asObservable();

    /* methods - other */
    
    showToast(
        content : ('info' | 'success' | 'warning' | 'error'),
        message : string[],
        duration : number = 3000
    ) : void {
        this.toastSubject.next({type : 'toast', content, duration, message});
    };

    showPanel(
        content: ('info' | 'warning' | 'error'),
        message: string[]
    ) : void {
        this.toastSubject.next({type : 'panel', content, duration : 6000, message});
    };
    
};