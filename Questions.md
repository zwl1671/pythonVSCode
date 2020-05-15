The new api is as follows: `NotebookContentProvider.openNotebook(uri: Uri): NotebookData | Promise<NotebookData>;`
The cell information in `NotebookData` is defined as `NotebookCellData`.

Is it possible for extension authors to add custom metadata to the `NotebookData` object such that it would flow over to the corresponding `NotebookDocument` object. Making this information available in other parts.
Similarly can we add custom metadata to the `NotebookCellData`, such that when a cell is executed or similar, we have access to all of that information via the `NotebookCell` object.

Basically extension authors return `NotebookData` and `NotebookCellData` to VS Code.
Any custom metadata we have, we'll need to store it elsewhere and perform the necessary mapping to get them back.
I.e. when VS Code invokes `NotebookContentProvider.executeCell(NotebookDocument, NotebookCell)` at this point we do not have the custom metadata from the first two arguments.
We'll need to go back to our mapping and figure out thye custom metadata.
In the case of cells, I dont' think we can even perform such a mapping to get the original jupyter cell metadata out of the VS Code cells.

Doing this, also helps extension authors use a single model for both VS Code as well as our own use.
Else we need to implement custom maps to find the corresponding information.

Our notebook object (json model) is very much different from what is expected by VS Code (that's not an issue).
We can do the necessary mapping. The same applies to cells.
The notebook and cells in the VS Code model have a concept of metadata and they are very specific.

For instance a Jupyter notebook has metadata that provides information about the kernel. We can get this out of the Json (in ipynb).
Now, when vsc invokes the `executeCell` method, it passes in a NotebookDocument, at this point this object doesn't contain the metadata.
We'd need to keep track of this metadata in some dictionary keyed to the Uri of the document. That works.

Now lets look at metadata in cells. We also have metadata in cells and the output contains more information that the Cell data structure defined by VSCode. Again we can do the necessary mapping. However, when VS Code invokes the method `executeCell`, we do not have the original cell information (metadata and output). Looking at the current API there's no way for me to map between VS Code cells and the cells we originally provided in the `openNotebook` method.

Basically what I'm asking for is the ability to stick custom metadata onto the `NotebookData/NotebookDocument` & the `Cell` so that it will be available at all times when VSCode invokes other methods in the extension.

Here's an example:

```typescript
class MyNotebookData implements vscode.NotebookData {
    cells: NotebookCellData[];
    languages: string[];
    metadata: NotebookDocumentMetadata;

    // Custom properties.
    kernelMetadata: IKernelMetadata;
    someOtherMetadata: ISomeOtherMetadata;
}

NotebookContentProvider.openNotebook(uri:Uri) {
    return new MyNotebookData();
}

// Later when VSC inbokes execute cell, we can get the kernel information from this document.
NotebookContentProvider.executeCell(document: NotebookDocument, cell..){
    // Someway access the custom metadata we attached to the notebook object.
    console.log(document...kernelMetata);

    // If this isn't possible we can store this in a map else where and retrieve it
    console.log(Map<string, MyNotebookData>.get(document.uri.fsPath).kernelMetadata);
}
```

Here's an example where such a work around isn't as simple:

```
class MyNotebookData implements vscode.NotebookData {
    cells: NotebookCellData[];
    languages: string[];
    metadata: NotebookDocumentMetadata;

    // Custom properties.
    kernelMetadata: IKernelMetadata;
    someOtherMetadata: ISomeOtherMetadata;
}

NotebookContentProvider.openNotebook(uri:Uri) {
    // Jupyter cells have a lot of information (custom metadata and their output contains a lot more information as well).
    const cells = jupyterCells.map(cell => {
        return {
            cellKind:...,
            source:...,
            outputs: transform Jupyter Cell output to a format VSC supports,
            metadata: VSCode specific properties
        }
    });
    // Assume we have three cells, cell1, cell2, cell3 each with output and some custom metadata.
    // We can translate the cells and give it to VS Code.
    return new MyNotebookData();
}

// Later when VSC inbokes execute cell
NotebookContentProvider.executeCell(document: NotebookDocument, cell: NotebookCell){
    // Assume user is executing cell2, and execution of cell2 results in changes to output in cell1.
    // At this point, we need to find cell1.
    // Looking at `document.cells`, we no longer know which one is cell1, 2 or 3.
}
```

# Possible solutions:

-   We can create a map between the real jupyter cells and the VSCode cells we generate and return in the `NotebookData` object created and returned in `NotebookContentProvider.openNotebook`
    -   I.e. we store a reference to the VSCode cells against the jupyter cells.
    -   Will this work? Is it safe to assume that cells returns in `NotebookData.cells` are also used in `NotebookDocument.cells`.
    -   More specifically are the references or copies?
    -   If possible great, however this doesn't feel like a great API (relying on object references as opposed to a clearly defined contract)
-   Allow us to provide an `id` when creating the `NotebookCellData`
    -   We can use this to uniquely identify a jupyter cell (by us creating a map key=id, value = jupyter cell)
-   Allow us to store arbitrary metadata aginst the NotebookData and NotebookCellData.
    -   Any metadata we add will be added by VS Code into the corresponding `NotebookDocument` and `NotebookCell`
    -   The other benefit for us as extension authors is the fact that we don't need to keep track of the metadata in some other store and key it to the Uri or the document or some key used to uniquely identify the original Jupyter cell information.

Does VS Code use the same instance of the NotebookData class everywhere (for the same Uri)?
I.e. can i create a custom class with custom properties and return this as the NotebookData (yes it will implement the right interface).
This way when ever VSCode calls methods such as `saveNotebook`, `saveNotebookAs`, `executeCell`, then we have all of the `additional` information we need in the `document`
