import {ChangeDetectionStrategy, Component, inject} from '@angular/core';
import {MatButtonModule} from '@angular/material/button';
import {MAT_DIALOG_DATA, MatDialogActions, MatDialogClose, MatDialogContent, MatDialogTitle,} from '@angular/material/dialog';

@Component({
    selector: 'confirm-dialog',
    templateUrl: './dialog_confirm.component.html',
    styleUrls: ['./dialog_confirm.component.css'],
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
export class ConfirmDialogComponent {
    data : ConfirmDialogData = inject(MAT_DIALOG_DATA);
};

export interface ConfirmDialogData {
    message : ({style : string, content: string} | undefined)[],
    title? : string
};