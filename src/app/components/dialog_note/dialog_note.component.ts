import {ChangeDetectionStrategy, Component, inject} from '@angular/core';
import {MatButtonModule} from '@angular/material/button';
import {MAT_DIALOG_DATA, MatDialogActions, MatDialogClose, MatDialogContent, MatDialogTitle,} from '@angular/material/dialog';

@Component({
    selector: 'note-dialog',
    templateUrl: './dialog_note.component.html',
    styleUrls: ['./dialog_note.component.css'],
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
export class NoteDialogComponent {
    data : NoteDialogData = inject(MAT_DIALOG_DATA);
};

export interface NoteDialogData {
    message : ({style : string, content: string, list? : boolean} | undefined)[],
    title? : string,
    style? : string,
    button? : string
};