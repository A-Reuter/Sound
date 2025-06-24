import {Injectable} from '@angular/core';

import {Observable, ReplaySubject} from 'rxjs';

import {PopupService} from '../notifications/popup.service';

@Injectable({
    providedIn: 'root'
})
export class FileReaderService {
    
    /* methods - constructor */

    constructor(
        private readonly popupService : PopupService,
    ) {};

    /* methods - other */

    public readFile(file : File) : Observable<string> {
        const reader = new FileReader();
        const result = new ReplaySubject<string>(1);
        reader.onerror = (error) => {
            this.popupService.error('srv.frs.rdf.000', 'failed to read from file', 'consider checking format and content of the file');
            console.error('Error: #srv.frs.rdf.000: ' + 'failed to read file', error);
            console.error('File: ', file);
            result.complete();
        };
        reader.onloadend = () => {
            result.next(reader.result as string);
            result.complete();
        };
        reader.readAsText(file);
        return result.asObservable();
    };

};