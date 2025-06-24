import {NgModule} from '@angular/core';
import {APP_BASE_HREF, PlatformLocation} from "@angular/common";
import {provideHttpClient, withInterceptorsFromDi} from "@angular/common/http";
import {provideRouter} from '@angular/router';
import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';

import {routes} from './app.routes';

import {AppComponent} from './app.component';
import {RootComponent} from './components/page-root/page-root.component';



@NgModule({
    declarations: [
        AppComponent
    ],bootstrap: [
        AppComponent
    ], imports: [
        BrowserAnimationsModule,
        BrowserModule,
        RootComponent
    ], providers: [
        {
            provide: APP_BASE_HREF,
            useFactory: (s: PlatformLocation) => s.getBaseHrefFromDOM(),
            deps: [PlatformLocation]
        },
        provideHttpClient(withInterceptorsFromDi()),
        provideRouter(routes)
    ]
})
export class AppModule {}