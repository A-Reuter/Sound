import {ChangeDetectionStrategy, Component, inject} from '@angular/core';
import {MatButtonModule} from '@angular/material/button';
import {MAT_DIALOG_DATA, MatDialogActions, MatDialogClose, MatDialogContent, MatDialogTitle,} from '@angular/material/dialog';

@Component({
    selector: 'error-dialog',
    templateUrl: './dialog_error.component.html',
    styleUrls: ['./dialog_error.component.css'],
    standalone: true,
    imports: [
        MatDialogTitle, 
        MatDialogContent, 
        MatDialogActions, 
        MatDialogClose, 
        MatButtonModule
    ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ErrorDialogComponent {
    data : ErrorDialogData = inject(MAT_DIALOG_DATA);
};

export interface ErrorDialogData {
    errorCode : string,
    message : string,
    advice? : string
};