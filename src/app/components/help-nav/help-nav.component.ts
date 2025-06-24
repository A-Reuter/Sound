import {Component} from '@angular/core';
import {MatIconModule} from '@angular/material/icon';
import {RouterModule} from '@angular/router';

@Component({
    selector: 'help-nav',
    templateUrl: './help-nav.component.html',
    styleUrls: ['./help-nav.component.css'],
    standalone: true,
    imports: [
        MatIconModule,
        RouterModule,
    ]
})
export class HelpNavComponent {

    /* attributes - own */
    
    private readonly _subpages = [
        {
            route : 'reference',
            label : 'Quick Guide',
            icon : 'menu_book'
        },
        {
            route : 'controls',
            label : 'Controls',
            icon : 'tune'
        },
        {
            route : 'settings',
            label : 'Settings',
            icon : 'settings'
        },
        {
            route : 'definitions',
            label : 'Definitions',
            icon : 'format_quote'
        },
        {
            route : 'overview',
            label : 'Info',
            icon : 'info_outline'
        }
    ];

    /* methods - getters */

    public get subpages() : {
        route : string,
        label : string,
        icon : string
    }[] {
        return this._subpages;
    };

    /* methods - other */

    public resetScroll() : void {
        window.scrollTo(0,0);
    };

};