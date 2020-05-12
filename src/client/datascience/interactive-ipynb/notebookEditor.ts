// import { Uri } from 'vscode';
// import { INotebookEditor, INotebookModel } from '../types';

// export interface INotebookModelProvider {
//     getModel(uri: Uri): Promise<INotebookModel>;
// }

// export class NotebookModelProvider implements INotebookModelProvider {
//     private readonly models: Map<string, INotebookModel>;
//     getModel(uri: Uri): Promise<INotebookModel> {
//         throw new Error('Method not implemented.');
//     }
// }
// export class NotebookEditor implements INotebookEditor {
//     public onDidChangeViewState: import('vscode').Event<void>;
//     public closed: import('vscode').Event<INotebookEditor>;
//     public executed: import('vscode').Event<INotebookEditor>;
//     public modified: import('vscode').Event<INotebookEditor>;
//     public saved: import('vscode').Event<INotebookEditor>;
//     public isUntitled: boolean;
//     public isDirty: boolean;
//     public file: import('vscode').Uri;
//     public visible: boolean;
//     public active: boolean;
//     public model: import('../types').INotebookModel | undefined;
//     public onExecutedCode: import('vscode').Event<string>;
//     public notebook?: import('../types').INotebook | undefined;
//     constructor(public readonly notebookUri: string) {}
//     public load(
//         storage: import('../types').INotebookModel,
//         webViewPanel?: import('vscode').WebviewPanel | undefined
//     ): Promise<void> {
//         throw new Error('Method not implemented.');
//     }
//     public runAllCells(): void {
//         throw new Error('Method not implemented.');
//     }
//     public runSelectedCell(): void {
//         throw new Error('Method not implemented.');
//     }
//     public addCellBelow(): void {
//         throw new Error('Method not implemented.');
//     }
//     public show(): Promise<void> {
//         throw new Error('Method not implemented.');
//     }
//     public startProgress(): void {
//         throw new Error('Method not implemented.');
//     }
//     public stopProgress(): void {
//         throw new Error('Method not implemented.');
//     }
//     public undoCells(): void {
//         throw new Error('Method not implemented.');
//     }
//     public redoCells(): void {
//         throw new Error('Method not implemented.');
//     }
//     public removeAllCells(): void {
//         throw new Error('Method not implemented.');
//     }
//     public interruptKernel(): Promise<void> {
//         throw new Error('Method not implemented.');
//     }
//     public restartKernel(): Promise<void> {
//         throw new Error('Method not implemented.');
//     }
//     public dispose() {
//         throw new Error('Method not implemented.');
//     }
// }
