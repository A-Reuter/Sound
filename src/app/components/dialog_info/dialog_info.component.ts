import {ChangeDetectionStrategy, Component, inject} from '@angular/core';
import {MatButtonModule} from '@angular/material/button';
import {MAT_DIALOG_DATA, MatDialogActions, MatDialogClose, MatDialogContent, MatDialogTitle,} from '@angular/material/dialog';

@Component({
    selector: 'info-dialog',
    templateUrl: './dialog_info.component.html',
    styleUrls: ['./dialog_info.component.css'],
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
export class InfoDialogComponent {
    data : InfoDialogData = inject(MAT_DIALOG_DATA);
};

export interface InfoDialogData {
    message : ({style : string, content: string} | undefined)[],
    title? : string
};