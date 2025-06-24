import {inject, Injectable} from '@angular/core';
import {MatDialog, MatDialogRef} from '@angular/material/dialog';

import {ConfirmDialogComponent} from '../../components/dialog_confirm/dialog_confirm.component';
import {ErrorDialogComponent} from '../../components/dialog_error/dialog_error.component';
import {InfoDialogComponent} from '../../components/dialog_info/dialog_info.component';
import {NoteDialogComponent} from '../../components/dialog_note/dialog_note.component';
import {QuestionDialogComponent} from '../../components/dialog_question/dialog_question.component';
import {TutorialDialogComponent} from '../../components/dialog_tutorial/dialog_tutorial.component';

import {SettingsService} from '../config/settings.service';
import {ToastService} from '../notifications/toast.service';

@Injectable({
    providedIn: 'root',
})
export class PopupService {

    /* attributes - own */

    readonly dialog = inject(MatDialog);

    /* methods - constructor */
 
    constructor(
        private readonly settingsService : SettingsService,
        private readonly toastService : ToastService,
    ) {};

    /* methods - other */

    private async openConfirmDialog(
        message : ({style : string, content: string} | undefined)[],
        title? : string
    ) : Promise<boolean> {
        const dialogRef : MatDialogRef<ConfirmDialogComponent> = this.dialog.open(
            ConfirmDialogComponent, 
            {data: {
                message : message,
                title : title
            }}
        );
        const promise : Promise<boolean> = new Promise((resolve) => {
            dialogRef.afterClosed().subscribe(result => {
                resolve(result);
            })
        });
        return promise;
    };

    private openErrorDialog(
        errorCode : string,
        message : string,
        advice? : string
    ) {
        this.dialog.open(
            ErrorDialogComponent, 
            {data: {
                errorCode: errorCode, 
                message : message,
                advice : advice
            }}
        );
    };

    private openInfoDialog(
        message : ({style : string, content: string} | undefined)[],
        title? : string
    ) : void {
        this.dialog.open(
            InfoDialogComponent, 
            {data: {
                message : message,
                title : title
            }}
        );
    };

    private openNoteDialog(
        message : ({style : string, content: string, list? : boolean} | undefined)[],
        title? : string,
        style? : string,
        button? : string
    ) : void {
        this.dialog.open(
            NoteDialogComponent, 
            {data: {
                message : message,
                title : title,
                style : style,
                button : button
            }}
        );
    };

    private async openQuestionDialog(
        message : ({style : string, content: string, list? : boolean} | undefined)[],
        title? : {style : string, content: string, list? : boolean},
        style? : string,
        buttonFalse? : string,
        buttonTrue? : string
    ) : Promise<boolean> {
        const dialogRef : MatDialogRef<QuestionDialogComponent> = this.dialog.open(
            QuestionDialogComponent, 
            {data: {
                message : message,
                title : title,
                style : style,
                buttonFalse : buttonFalse,
                buttonTrue : buttonTrue
            }}
        );
        const promise : Promise<boolean> = new Promise((resolve) => {
            dialogRef.afterClosed().subscribe(result => {
                resolve(result);
            })
        });
        return promise;
    };

    private async openTutorialDialog() : Promise<boolean> {
        const dialogRef : MatDialogRef<TutorialDialogComponent> = this.dialog.open(TutorialDialogComponent);
        const promise : Promise<boolean> = new Promise((resolve) => {
            dialogRef.afterClosed().subscribe(result => {
                resolve(result);
            })
        });
        return promise;
    };

    public confirm(
        message : ({style : string, content: string} | undefined)[],
        title? : string
    ) : Promise<boolean> {
        switch (this.settingsService.state.notifyConfirm) {
            case 'dialog' : {
                return (this.openConfirmDialog(message, title));
            }
            case 'popup' : {
                let content : string = '';
                if (title) {
                    content = (title + '\n' + '\n');
                };
                for (const line of message) {
                    if (line) {
                        content = (content + line.content);
                    } else {
                        content = (content + '\n');
                    };
                };
                return (new Promise((resolve) => {resolve(window.confirm(content))}))
            }
            case 'none' : {
                return (new Promise((resolve) => {resolve(true)}));
            }
        };
    };
    
    public error(
        errorCode : string,
        message : string,
        advice? : string
    ) : void {
        switch (this.settingsService.state.notifyError) {
            case 'dialog' : {
                this.openErrorDialog(errorCode, message, advice);
                break;
            }
            case 'popup' : {
                if (advice) {
                    window.alert('ERROR - ' + message + '\n' + '               (ErrorCode : ' + errorCode + ')' + '\n' + '\n' +advice);
                } else {
                    window.alert('ERROR - ' + message + '\n' + '               (ErrorCode : ' + errorCode + ')');
                };
                break;
            }
            case 'toast' : {
                this.toastService.showPanel('error', ['ERROR - ' + message, '(ErrorCode : ' + errorCode + ')']);
                break;
            }
        };
    };

    public info(
        message : ({style : string, content: string} | undefined)[],
        title? : string
    ) : void {
        this.openInfoDialog(message, title);
    };

    public note(
        message : ({style : string, content: string, list? : boolean} | undefined)[],
        title? : string,
        style? : string,
        button? : string
    ) : void {
        this.openNoteDialog(message, title, style, button);
    };

    public question(
        message : ({style : string, content: string, list? : boolean} | undefined)[],
        title? : {style : string, content: string, list? : boolean},
        style? : string,
        buttonFalse? : string,
        buttonTrue? : string
    ) : Promise<boolean> {
        return (this.openQuestionDialog(message, title, style, buttonFalse, buttonTrue));
    };

    public tutorial() : Promise<boolean> {
        return (this.openTutorialDialog());
    };

};