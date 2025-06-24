import {Component} from '@angular/core';
import {RouterOutlet} from '@angular/router';

import {FooterComponent} from '../page-footer/page-footer.component';
import {HeaderComponent} from '../page-header/page-header.component';

@Component({
    selector: 'routing-root',
    templateUrl: './page-root.component.html',
    styleUrls: ['./page-root.component.css'],
    standalone: true,
    imports: [
        FooterComponent,
        HeaderComponent,
        RouterOutlet
    ]
})
export class RootComponent {};