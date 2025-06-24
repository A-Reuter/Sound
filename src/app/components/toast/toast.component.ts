import {Component, Input, OnInit, OnDestroy} from '@angular/core';

@Component({
    selector: 'app-toast',
    templateUrl: './toast.component.html',
    styleUrls: ['./toast.component.css'],
    standalone: true
})
export class ToastComponent implements OnInit, OnDestroy {

    @Input() type : ('toast' | 'panel') = 'toast';
    @Input() content : ('info' | 'success' | 'warning' | 'error') = 'info';
    @Input() duration : number = 3000;
    @Input() message : string[] = [''];

    /* attributes */

    private timer: any;

    /* methods - constructor */

    constructor() {};

    /* methods - on init */

    ngOnInit() {
        // toast disappears after set duration
        this.timer = setTimeout(() => {
            this.close();
        }, this.duration);
    };

    /* methods - on destroy */

    ngOnDestroy() {
        // cleanup timer when component is being destroyed
        if (this.timer) {
            clearTimeout(this.timer);
        };
    };

    /* methods - other */

    close() {
        // event triggering to remove toast or usage of service to remove toast
    };

};