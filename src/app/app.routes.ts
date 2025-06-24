import {Routes} from '@angular/router';

import {ToolComponent} from './components/page-tool/page-tool.component';
import {HelpComponent} from './components/page-help/page-help.component';
import {HelpOverviewComponent} from './components/help-overview/help-overview.component';
import {HelpDefinitionsComponent} from './components/help-definitions/help-definitions.component';
import {HelpReferenceComponent} from './components/help-reference/help-reference.component';
import {HelpControlsComponent} from './components/help-controls/help-controls.component';
import {HelpSettingsComponent} from './components/help-settings/help-settings.component';

export const routes : Routes = [
    {
        path: '', redirectTo: 'tool', pathMatch: 'full' 
    },
    {
        path: 'tool', component: ToolComponent
    },
    {
        path: 'help', component: HelpComponent, 
        children : [
            {
                path: '', redirectTo: 'reference', pathMatch: 'full'
            }, 
            {
                path: 'overview', component: HelpOverviewComponent
            }, 
            {
                path: 'definitions', component: HelpDefinitionsComponent
            }, 
            {
                path: 'reference', component: HelpReferenceComponent
            }, 
            {
                path: 'controls', component: HelpControlsComponent
            }, 
            {
                path: 'settings', component: HelpSettingsComponent
            }
        ]
    },
    
];