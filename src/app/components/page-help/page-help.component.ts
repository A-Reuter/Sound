import {Component} from '@angular/core';
import {RouterOutlet} from '@angular/router';

import {HelpNavComponent} from '../help-nav/help-nav.component';

@Component({
    selector: 'help-page',
    templateUrl: './page-help.component.html',
    styleUrls: ['./page-help.component.css'],
    standalone: true,
    imports: [
        HelpNavComponent,
        RouterOutlet
    ]
})
export class HelpComponent {};