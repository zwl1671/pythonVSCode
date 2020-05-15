-   [ ] Create interface for NotebookContentProvider once VSC API has been finalized, hence no point creating things that can change every week.
-   [ ] Review and finalyze user friendly display name of notebook `jupyter-notebook`
-   [ ] Review and finalyze user friendly display name of notebook renderer `jupyter-notebook-renderer`
-   [ ] Should we be interrupting cells when user clicks stop button in a cell. I think yes.
-   [ ] How can user download/save image
        (no right click menu)?
-   [ ] Change priority of rendering, check Jupyter NB, is HTML preferred over PNG/JPEG.
    -   [ ] If yes, then we're doing it wrong.
-   [ ] File issue, no scroll bars in output
    -   [ ] Render a large image and it doesn't scroll horizontally.
-   [ ] When cloning a cell, will the metadata be copied across?
    -   [ ] Yikes, we use this to uniquely identify a cell.
-   [ ] Need to handle new cells.
    -   [ ] When cells are added/updated/deleted we need to update our model.
    -   [ ] Even before user clicks save. (else export and the like don't work, even execution is busted)
    -   [ ] I.e. don't make assumptions.
-   What's the purpose of NotebookDocumentChangedEvent
-   Need CellId
-   Create new untitled file and save as nb.
-   Register models with NotebookStorageProvider
    -   This way when we create an untitled model and we try to load it, it is available.
-   How do we open untitled files.
    -   We don't want users to create a file.
-   When using SaveAs, then we load a new document & editor for the new Uri

    -   At this point, all state is lost (IPyWidgets will stop working).
    -   If user has two copies of same file opened,
        -   Now we need to decide how to handle the session.
        -   Do both editors share the same session. No way, when using save as, then new document will need to start a whole new session.
        -   However, if user has only one file opened, now we need to keep the session (else saving untitled files means user looses everything).
        -   Solution - We need to handle onDidCloseNotebookDocument
            -   If original doc was closed, then we know the session can be migrated.
            -   If not closed, then we know theres a duplicate editor, now pointing to old file.
    -   However onDidCloseNotebookDocument is not firing correctly
        -   It only fires once and incorrectly.
        -   I.e. if we close first editor, then document is deemed closed.
        -   Standard editors seem to do the same thing.
        -   I think having a disposed event on NotebookDocument would be better, (similar to CustomEditor, which implements a Dispose method).

-   If we have multiple editors, then which one receives the postMessages.

    -   If it is only the active editor, then things might not work as expected.
    -   E.g. ipywidgets might not work at all. (or we could only ensure ipywidgets work in one editor).
    -   However if user keeps toggling between the two, then we change state only in one webview.
    -   We need a way to determine which one is which, and id or so.
    -   We might want to send messages to both editors.
    -   Will state be preserved in editors even if user opens a new file and notebook is no longer active/visible (but opened in list of open editors)?

-   Renderers do not work unless we execute something.

    -   I.e. open existing notebook, and it doesn't use custom renderer (cuz the scripts are not preloaded).

-   Cell executions are no longer cancellable.
    -   Any reason, was planning on using that.

*   Create method `createNewModel` in `INotebookStorageProvider`
    -   This will return a model with an untitled file

-   Classes to deprecate with NB

    -   [ ] AutoSaveService (no need)
    -   [ ] IntellisenseProvider (only for Interactive Window not nb)
    -   [ ] IPyWidgetScriptSource (only for interactive window or re-use or create new, which is easier)
    -   [ ] IPyWidgetHandler (only for interactive window or re-use or create new, which is easier)

-   Classes to delete completely

    -   [ ] Synchronization
        -   Even for custom editor we can disable opening multiple editors.
    -   onExecutedCode: Event<string> in INotebookEditor.
    -   onExecutedCode: Event<string> in IInteractiveWindowProvider.

*   [ ] InteractiveWindowListener
    -   [ ] Depreacte postInternalMessage (used only in one place)
        -   [ ] Easier to create a new way than adding backwards compatibility to do this.
        -   [ ] Used only in ipywidgets
    -   [ ] onViewStateChagned
        -   [ ] Easier to create a new way than adding backwards compatibility to do this.
        -   [ ] Used only in auto save
    -   [ ] dataScienceSurveyBanner
        -   [ ] Only needs to know number of cells executed.
        -   [ ] (can use different approach and not interactive window listener)
        -   [ ] Only needs `onMessage`
    -   [ ] codeLensFactory
        -   [ ] No need in NB
        -   [ ] Only needs `onMessage`
    -   [ ] gatherListener
        -   [ ] Only needs `onMessage`
    -   [ ] DebuggerListener
        -   [ ] Just needs to send message StartDebugging and StopDebugging
        -   [ ] Uses `postMessage` to send two messsages.
    -   [ ] INtellisenseProvider
        -   [ ] Only required in interactive window (intellisense in input)
        -   [ ] Uses `postMessage` to send two messsages.
    -   [ ] LinkProvider
        -   [ ] Only needs `onMessage`
        -   [ ] For just two messages
    -   [ ] showPlotListener
        -   [ ] Only needs `onMessage`
        -   [ ] For just one messages
    -   [ ] autoSaveService
        -   [ ] Only needs `onMessage` & `postMessage`
        -   [ ] No need in NB
    -   [ ] RunByLline
        -   [ ] Isn't it easier to re-write this, & use VSC API.
        -   [ ] Refactor/re-write (one for old and one for new).
    -   [ ] IPyWidgetScriptSource
        -   [ ] Need this
    -   [ ] IPyWidgetHandler
        -   [ ] I think its easier to say, sorry no ipywidgest for multiple editors.
        -   [ ] Will need to refactor.

# Terminology

# TODO:

-   [ ] Update cell output in extension instead of UI side when we have display_ids
-   [ ] CellOutput.tsx (without any viewmodels, only accepts nbformat.CellOutput)

-   [ ] We have 3 flavours of notebooks/cells, ipynb, INotebookModel/ICell & VSCodes
-   [ ] Suggestion

    -   [ ] Raw = For ipynb (RawNotebook, RawCell), leave interfaces as they are, using jupyterlab/services
    -   [ ] INotebookModel, INotebookCellModel/ICell (we're used to this)
        -   [ ] But I prefer to be explict
    -   [ ] VSCodes ones (NotebookDocument, NotebookCell, NotebookDocumentData, NotebookDocumentCell)
    -   [ ] Note: VSCode has two models (NotebookDocument and NotebookDocumentData)
    -   [ ] So in reality we have 4 all over the place.

# Questions

-   [ ] How important is live share in Notebooks?
    -   [ ] Do we want to keep supporting this as it is today?
    -   [ ] Check telemetry
-   [ ] Sepearate extension for renderers
    -   Faster builds (CI, tests, etc)
    -   No need to build this
    -   Smaller extension size
    -   Renderer extension does not need to ship everytime
    -   Once users have this, we don't need to download again
    -   Easier to manage
    -   Can update out of band

# Features /tech that needs to be supported

-   [ ] Interactive window listeners
-   [ ] Live share (leave for VSCode)
-   [ ] Gather, debug, and & interactive window listeners
-   [ ] Keyboard shortcuts (nativeEditorCommandListener)
    -   Add jupyter keyboard shortcuts
    -   Map to VSC notebook commands
    -   Should this be part of our extension or separate extension?
    -   Identify all keyboard shortcuts and create mappings
-   [ ] Telemetry
-   [ ] Variable viewer
-   [ ] Hover provider.
-   [ ] Data Frame/Plot viewer
-   [ ] Multiple editors (widgets)
-   [ ] Jupyter tab (for var viewer)
-   [ ] Experiments

# Code to refactor (re-write)

-   [ ] Pull out export
-   [ ] Updating metadata (after selecting a kernel)
-   [ ] Telemetry for execution and the like
-   [ ] Save cells to ipynb and open ipynb
-   [ ] Restart/Interrupt kernel messages
-   [ ] Start/stop notebook

# INotebookExecutionLogger and IINteractiveWindowListener

-   [ ] Do same thing, we should get rid of onKernelRestarted
    -   [ ] This can be done as interactive window listener
    -   [ ] No harm, but more work to maintain such interfaces when we already have a way of doing this.
-   [ ] Remove preHandleIOPub
    -   [ ] Used only in one place and used via INotebookExecutionLogger
    -   [ ] Why does cellHashProvider have to do this?
    -   [ ] Move it out and one less method support.
    -   [ ] Right now cell hash provider is doing somethign lot more important.
    -   [ ] Cell Hash provider is understood to be crucial only for debuggin, however we're doing something different here.
-   [ ] HoverProvider

    -   [ ] Does this work for NB?
    -   [ ] Might need to refactor.

-

*   Disable code lenses & interactive window related stuff in pyton files when in nb

# MVP

-   Load & save nb
-   Create new nb
-   Add/delete/move cells
-   Run cells
-   Interrupt & restart
-   Jupyter keyboard shortcuts
-   Undo/redo
-   Theming
-   Accessibility
-   No kernel selection (defaults to current interpreter)
-   Render only
-   Intellisense (if not Jedi, then always use MS LSP (.NET or Node))
-   Clicking plots to save not MVP
-   Scrolling text/output not MVP
-   Refactoring not MVP
-   Formatting not MVP

# For VSC

-   We need asWebViewUri in renderer
    -   We split bundles and we need to defined base Uri for webpack to load bundles.
    -   Hence in pre-load script we need to be able to define the baseuri.
-   To provide the value in preload script we need to generate js file with this value hardcoded.

