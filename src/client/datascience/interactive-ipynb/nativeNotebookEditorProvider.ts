// // Copyright (c) Microsoft Corporation. All rights reserved.
// // Licensed under the MIT License.

// 'use strict';

// import { nbformat } from '@jupyterlab/coreutils';
// import { inject, injectable } from 'inversify';
// // tslint:disable-next-line: no-require-imports
// import cloneDeep = require('lodash/cloneDeep');
// import * as uuid from 'uuid/v4';
// import * as vscode from 'vscode';
// // tslint:disable-next-line: no-duplicate-imports
// import {
//     CancellationToken,
//     CellDisplayOutput,
//     CellErrorOutput,
//     CellKind,
//     CellOutput,
//     CellOutputKind,
//     CellStreamOutput,
//     notebook,
//     NotebookCell,
//     NotebookCellData,
//     NotebookCellRunState,
//     NotebookContentProvider,
//     NotebookData,
//     NotebookDocument,
//     NotebookDocumentEditEvent,
//     NotebookOutputRenderer
// } from 'vscode';
// import { concatMultilineStringInput, concatMultilineStringOutput } from '../../../datascience-ui/common';
// import { MARKDOWN_LANGUAGE, PYTHON_LANGUAGE } from '../../common/constants';
// import { ReadWrite } from '../../common/types';
// import { createDeferred } from '../../common/utils/async';
// import { traceError, traceWarning } from '../../logging';
// import { INotebookModelModifyChange } from '../interactive-common/interactiveWindowTypes';
// import { ICell, INotebookModel, INotebookProvider } from '../types';
// import { INotebookStorageProvider } from './notebookStorageProvider';
// // tslint:disable: no-any

// export class NteractRenderer implements NotebookOutputRenderer {
//     private _preloads: vscode.Uri[] = [];

//     get preloads(): vscode.Uri[] {
//         return this._preloads;
//     }

//     constructor() {
//         this._preloads.push(vscode.Uri.file('/Users/donjayamanne/Desktop/Development/vsc/pythonVSCode/wow.js'));
//     }

//     // @ts-ignore
//     public render(document: NotebookDocument, output: CellOutput, mimeType: string): string {
//         return `
//         <div>
//             <img src="./wow.png" />
//         </div>
//         `;
//         // return `
//         // 	<script type="application/vnd.nteract.view+json">
//         // 		{}
//         // 	</script>
//         // 	<script>console.error('Initial script');console.error('Display${JSON.stringify(output)}')</script>
//         // `;
//     }
// }
// export class OutputRenderer implements NotebookOutputRenderer {
//     private _preloads: vscode.Uri[] = [];

//     get preloads(): vscode.Uri[] {
//         return this._preloads;
//     }

//     constructor() {
//         this._preloads.push(vscode.Uri.file('/Users/donjayamanne/Desktop/Development/vsc/pythonVSCode/wow.js'));
//         // this._preloads.push(
//         //     Uri.file(
//         //         '/Users/donjayamanne/Desktop/Development/vsc/pythonVSCode/out/datascience-ui/renderers/require.js'
//         //     )
//         // );
//         // this._preloads.push(
//         //     Uri.file(
//         //         '/Users/donjayamanne/Desktop/Development/vsc/pythonVSCode/out/datascience-ui/renderers/ipywidgets.js'
//         //     )
//         // );
//         // this._preloads.push(
//         //     Uri.file(
//         //         '/Users/donjayamanne/Desktop/Development/vsc/pythonVSCode/out/datascience-ui/renderers/common.initial.bundle.js'
//         //     )
//         // );
//         this._preloads.push(
//             vscode.Uri.file(
//                 '/Users/donjayamanne/Desktop/Development/vsc/pythonVSCode/out/datascience-ui/renderers/renderer.js'
//             )
//         );
//     }

//     // @ts-ignore
//     public render(document: NotebookDocument, output: CellOutput, mimeType: string): string {
//         const divId = uuid();
//         return `
//         <div style="display:none" id="${divId}">${JSON.stringify(output)}</div>
//         <script type="text/javascript" data-json-container-id="${divId}">
//             window.renderOutput(document.currentScript, ${JSON.stringify(output)});
//         </script>
//         `;
//         // return `
//         // 	<script type="application/vnd.nteract.view+json">
//         // 		{}
//         // 	</script>
//         // 	<script>console.error('Initial script');console.error('Display${JSON.stringify(output)}')</script>
//         // `;
//     }
// }

// export function createNotebookCellDataFromCell(cell: ICell): NotebookCellData | undefined {
//     if (cell.data.cell_type !== 'code' && cell.data.cell_type !== 'markdown') {
//         traceError(`Conversion of Cell into VS Code NotebookCell not supported ${cell.data.cell_type}`);
//         return;
//     }

//     return {
//         cellKind: cell.data.cell_type === 'code' ? CellKind.Code : CellKind.Markdown,
//         language: cell.data.cell_type === 'code' ? PYTHON_LANGUAGE : MARKDOWN_LANGUAGE,
//         metadata: {
//             editable: true,
//             executionOrder: typeof cell.data.execution_count === 'number' ? cell.data.execution_count : undefined,
//             runState: NotebookCellRunState.Idle,
//             runnable: true
//         },
//         source: concatMultilineStringInput(cell.data.source),
//         outputs: translateCellOutputs(cell.data.outputs as any)
//     };
// }

// function translateCellOutputs(outputs?: nbformat.IOutput[]): CellOutput[] {
//     const cellOutputs: nbformat.IOutput[] = Array.isArray(outputs) ? (outputs as []) : [];
//     return cellOutputs
//         .map(translateCellOutput)
//         .filter((item) => !!item)
//         .map((item) => item!);
// }
// const cellOutputMappers = new Map<nbformat.OutputType, (output: nbformat.IOutput) => CellOutput | undefined>();
// // tslint:disable-next-line: no-any
// cellOutputMappers.set('display_data', translateDisplayDataOutput as any);
// // tslint:disable-next-line: no-any
// cellOutputMappers.set('error', translateErrorOutput as any);
// // tslint:disable-next-line: no-any
// cellOutputMappers.set('execute_result', translateDisplayDataOutput as any);
// // tslint:disable-next-line: no-any
// cellOutputMappers.set('stream', translateStreamOutput as any);
// // tslint:disable-next-line: no-any
// cellOutputMappers.set('update_display_data', translateDisplayDataOutput as any);
// export function translateCellOutput(output: nbformat.IOutput): CellOutput | undefined {
//     const fn = cellOutputMappers.get(output.output_type as nbformat.OutputType);
//     if (fn) {
//         return fn(output);
//     }
//     traceWarning(`Unable to translate cell from ${output.output_type} to NotebookCellData for VS Code.`);
// }
// export function translateDisplayDataOutput(output: nbformat.IDisplayData): CellDisplayOutput {
//     return {
//         outputKind: CellOutputKind.Rich,
//         data: output.data
//     };
// }
// export function translateStreamOutput(output: nbformat.IStream): CellStreamOutput {
//     return {
//         outputKind: CellOutputKind.Text,
//         text: concatMultilineStringOutput(output.text)
//     };
// }
// export function translateErrorOutput(output: nbformat.IError): CellErrorOutput {
//     return {
//         ename: output.ename,
//         evalue: output.evalue,
//         outputKind: CellOutputKind.Error,
//         traceback: output.traceback
//     };
// }
// /**
//  * An ultra-minimal sample provider that lets the user type in JSON, and then
//  * outputs JSON cells. Doesn't read files or save anything.
//  */
// @injectable()
// export class NativeNotebookEditorProvider implements NotebookContentProvider {
//     public onDidChangeNotebook = new vscode.EventEmitter<NotebookDocumentEditEvent>().event;
//     private model?: INotebookModel;
//     private registeredIOPubListener?: boolean;
//     constructor(
//         // @inject(IServiceContainer) private readonly serviceContainer: IServiceContainer,
//         @inject(INotebookProvider) private readonly notebookProvider: INotebookProvider,
//         @inject(INotebookStorageProvider) private readonly notebookStorage: INotebookStorageProvider
//     ) {
//         notebook.registerNotebookOutputRenderer(
//             'jupyter-notebook-renderer',
//             {
//                 type: 'display_data',
//                 subTypes: [
//                     'text/plain',
//                     'text/markdown',
//                     'image/png',
//                     'image/svg+xml',
//                     'text/latex',
//                     'application/vnd.plotly.v1+json',
//                     'application/vnd.vega.v5+json'
//                 ]
//             },
//             new OutputRenderer()
//         );
//         // notebook.registerNotebookOutputRenderer(
//         //     'python-vscode-extension',
//         //     {
//         //         type: '',
//         //         subTypes: ['text/plain', 'text/html']
//         //     },
//         //     new OutputRenderer()
//         // );
//         vscode.commands.registerCommand('python.testNotebook', () => {
//             notebook.activeNotebookDocument?.cells.forEach((cell) => {
//                 cell.outputs = [];
//             });
//         });
//     }
//     public async openNotebook(uri: vscode.Uri): Promise<NotebookData> {
//         const model = (this.model = await this.notebookStorage.load(uri));

//         const nb: ReadWrite<NotebookData> & { originalModel: INotebookModel } = {
//             cells: [],
//             languages: [PYTHON_LANGUAGE, MARKDOWN_LANGUAGE],
//             metadata: {
//                 cellEditable: true,
//                 cellRunnable: true,
//                 editable: true,
//                 hasExecutionOrder: true,
//                 runnable: true
//             },
//             originalModel: model
//         };
//         const metadata = model.metadata;
//         this.notebookProvider
//             .getOrCreateNotebook({
//                 identity: uri,
//                 metadata,
//                 disableUI: true
//             })
//             .ignoreErrors();
//         nb.cells = model.cells
//             .map(createNotebookCellDataFromCell)
//             .filter((item) => !!item)
//             .map((item) => item!);
//         return nb;
//     }
//     public async saveNotebook(_document: NotebookDocument, _cancellation: CancellationToken) {
//         // throw new Error('Method not implemented.');
//         console.log('Ok');
//     }
//     public saveNotebookAs(
//         _targetResource: vscode.Uri,
//         _document: NotebookDocument,
//         _cancellation: CancellationToken
//     ): Promise<void> {
//         throw new Error('Method not implemented.');
//     }
//     public async save(_document: NotebookDocument): Promise<boolean> {
//         // Noop.
//         return true;
//     }
//     /**
//      * @inheritdoc
//      */
//     public async executeCell(
//         document: NotebookDocument,
//         cell: NotebookCell | undefined,
//         token: CancellationToken
//     ): Promise<void> {
//         if (!cell) {
//             return;
//         }

//         if (process.env.WOW1234) {
//             //     cell.metadata.runState = NotebookCellRunState.Running;
//             //     await sleep(5_000);
//             //     cell.outputs = [
//             //         {
//             //             // tslint:disable-next-line: no-use-before-declare
//             //             ...output1,
//             //             outputKind: CellOutputKind.Rich
//             //         }
//             //     ];
//             //     await sleep(5_000);

//             // tslint:disable: no-use-before-declare
//             // cell.outputs = [...cell.outputs, { ...output2, outputKind: CellOutputKind.Rich }];
//             cell.outputs = myOutputs as any;
//             cell.metadata.runState = NotebookCellRunState.Success;
//             return;
//         }
//         console.error(notebook.activeNotebookEditor!);
//         const metadata = this.model?.metadata;
//         const nb = await this.notebookProvider.getOrCreateNotebook({
//             identity: document.uri,
//             metadata,
//             disableUI: false
//         });
//         if (!this.registeredIOPubListener && nb) {
//             this.registeredIOPubListener = true;
//             //tslint:disable-next-line:no-require-imports
//             const jupyterLab = require('@jupyterlab/services') as typeof import('@jupyterlab/services');
//             nb?.registerIOPubListener(async (msg) => {
//                 if (!jupyterLab.KernelMessage.isUpdateDisplayDataMsg(msg)) {
//                     return;
//                 }
//                 // Find any cells that have this display_id
//                 this.model?.cells.forEach((c, index) => {
//                     if (c.data.cell_type !== 'code') {
//                         return;
//                     }
//                     let isMatch = false;
//                     const data: nbformat.ICodeCell = c.data as nbformat.ICodeCell;
//                     const changedOutputs = data.outputs.map((o) => {
//                         if (
//                             (o.output_type === 'display_data' || o.output_type === 'execute_result') &&
//                             o.transient &&
//                             // tslint:disable-next-line: no-any
//                             (o.transient as any).display_id === msg.content.transient.display_id
//                         ) {
//                             // Remember this as a match
//                             isMatch = true;

//                             // If the output has this display_id, update the output
//                             return {
//                                 ...o,
//                                 data: msg.content.data,
//                                 metadata: msg.content.metadata
//                             };
//                         } else {
//                             return o;
//                         }
//                     });

//                     if (!isMatch) {
//                         return;
//                     }
//                     const newCell: ICell = {
//                         ...c,
//                         data: {
//                             ...c.data,
//                             outputs: changedOutputs
//                         }
//                     };
//                     const updateCell: INotebookModelModifyChange = {
//                         kind: 'modify',
//                         newCells: [newCell],
//                         oldCells: [c],
//                         newDirty: true,
//                         oldDirty: this.model?.isDirty === true,
//                         source: 'user'
//                     };
//                     this.model?.update(updateCell);

//                     // Find the same cells in original notebook and update the output.
//                     const uiCellToUpdate = document.cells[index];
//                     uiCellToUpdate.outputs = translateCellOutputs(newCell.data.outputs as any);
//                 });
//             });
//         }

//         const deferred = createDeferred();
//         cell.metadata.runState = NotebookCellRunState.Running;
//         try {
//             token.onCancellationRequested(() => {
//                 if (deferred.completed) {
//                     return;
//                 }
//                 deferred.resolve();
//                 cell.metadata.runState = NotebookCellRunState.Idle;
//                 nb?.interruptKernel(1_000).ignoreErrors();
//             });
//             nb?.clear(cell.uri.fsPath);
//             const observable = nb?.executeObservable(cell.source, document.fileName, 0, cell.uri.fsPath, false);
//             let outputs: any[] = [];
//             observable?.subscribe(
//                 (cells) => {
//                     if (token.isCancellationRequested) {
//                         return;
//                     }
//                     // tslint:disable-next-line: no-console
//                     console.log(cells);
//                     cells = cells.filter((item) => item.id === cell.uri.fsPath);
//                     outputs = cells
//                         .flatMap((item) => item.data.outputs)
//                         .filter((output) => {
//                             const streamOutput = output as nbformat.IStream;
//                             const execResult = output as nbformat.IExecuteResult;
//                             const errorResult = output as nbformat.IError;
//                             if (streamOutput.output_type === 'stream') {
//                                 return true;
//                             } else if (execResult.output_type === 'execute_result' && 'text/plain' in execResult.data) {
//                                 return true;
//                             } else if (
//                                 output &&
//                                 (output as any).output_type === 'display_data' &&
//                                 (!('transient' in (output as any)) ||
//                                     ('transient' in (output as any) &&
//                                         Object.keys((output as any).transient).length === 0))
//                             ) {
//                                 // cell!.outputs = [];
//                                 // this.model!.cells[0].data.outputs = [output];
//                                 return true;
//                             } else if (errorResult.output_type === 'error') {
//                                 return true;
//                             }
//                             return false;
//                         })
//                         .map((output) => {
//                             const streamOutput = output as nbformat.IStream;
//                             const execResult = output as nbformat.IExecuteResult;
//                             const errorResult = output as nbformat.IError;
//                             if (streamOutput.output_type === 'stream') {
//                                 return {
//                                     outputKind: CellOutputKind.Text,
//                                     text: concatMultilineStringOutput(streamOutput.text)
//                                 };
//                             } else if (errorResult.output_type === 'error') {
//                                 return {
//                                     outputKind: CellOutputKind.Error,
//                                     ename: errorResult.ename,
//                                     evalue: errorResult.evalue,
//                                     traceback: errorResult.traceback
//                                 };
//                             } else {
//                                 return {
//                                     outputKind: CellOutputKind.Rich,
//                                     data: cloneDeep(execResult.data)
//                                 };
//                             }
//                         });
//                     // tslint:disable-next-line: no-any
//                     // cell.outputs = outputs as any;
//                 },
//                 (error) => {
//                     cell.outputs = [
//                         {
//                             outputKind: CellOutputKind.Error,
//                             ename: 'e.constructor.name',
//                             evalue: 'e.message',
//                             traceback: error.stack
//                         }
//                     ];
//                     cell.metadata.runState = NotebookCellRunState.Error;
//                     cell.metadata.statusMessage = 'Kaboom';
//                     deferred.resolve();
//                 },
//                 () => {
//                     cell.outputs = outputs as any;
//                     cell.outputs = myOutputs as any;
//                     // cell.outputs = [
//                     //     { ...output1, outputKind: CellOutputKind.Rich },
//                     //     { ...output2, outputKind: CellOutputKind.Rich }
//                     // ];
//                     cell.metadata.runState = NotebookCellRunState.Success;
//                     cell.metadata.statusMessage = 'Finished';
//                     deferred.resolve();
//                 }
//             );
//         } catch (ex) {
//             deferred.resolve();
//             // await deferred.promise;
//             cell.outputs = [
//                 {
//                     outputKind: CellOutputKind.Error,
//                     ename: ex.message,
//                     evalue: ex.toString(),
//                     traceback: ex.stack
//                 }
//             ];
//             cell.metadata.runState = NotebookCellRunState.Error;
//             cell.metadata.statusMessage = 'Kaboom';
//         }
//         await deferred.promise;
//         // notebook.activeNotebookDocument!.cells[0].outputs = [
//         //     {
//         //         outputKind: CellOutputKind.Text,
//         //         text: 'Hello There'
//         //     }
//         // ];
//         notebook.activeNotebookDocument!.cells[0].metadata.runState = NotebookCellRunState.Idle;
//     }
// }

// const myOutputs = [
//     {
//         outputKind: 3,
//         data: {
//             'text/plain': 'First Plot',
//             'image/svg+xml':
//                 '<?xml version="1.0" encoding="utf-8"?><!DOCTYPE svg><svg width="220px" height="120px"  xmlns="http://www.w3.org/2000/svg"><g><text font-size="32"  x="25" y="60">First Plot!</text></g></svg>\n',
//             'image/png':
//                 'iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgljNBAAO9TXL0Y4OHwAAAABJRU5ErkJggg==\n'
//         }
//     },
//     {
//         outputKind: 3,
//         data: {
//             'text/plain': 'Second Plot',
//             'image/svg+xml':
//                 '<?xml version="1.0" encoding="utf-8"?><!DOCTYPE svg><svg width="220px" height="120px"  xmlns="http://www.w3.org/2000/svg"><g><text font-size="32"  x="25" y="60">First Plot!</text></g></svg>\n',
//             'image/png':
//                 'iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgljNBAAO9TXL0Y4OHwAAAABJRU5ErkJggg==\n'
//         }
//     }
// ];
