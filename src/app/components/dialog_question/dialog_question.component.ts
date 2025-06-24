import {ChangeDetectionStrategy, Component, inject} from '@angular/core';
import {MatButtonModule} from '@angular/material/button';
import {MAT_DIALOG_DATA, MatDialogActions, MatDialogClose, MatDialogContent, MatDialogTitle,} from '@angular/material/dialog';

@Component({
    selector: 'question-dialog',
    templateUrl: './dialog_question.component.html',
    styleUrls: ['./dialog_question.component.css'],
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
export class QuestionDialogComponent {
    data : QuestionDialogData = inject(MAT_DIALOG_DATA);
};

export interface QuestionDialogData {
    message : ({style : string, content: string} | undefined)[],
    title? : {style : string, content: string},
    style? : string,
    buttonFalse? : string,
    buttonTrue? : string
};