# Questions for VSC:

## Bugs

-   Two markdown entries in language picker
-   Output error overflows bounds
    -   Execute a cell with errors, stacktrace goes out of cell.
-   Select a cell, bring find control
    -   Move cell up (scroll down), you'll see the outline of cell goes over the find control.
-   Hover doesn't go away
    -   `time.sleep(5)` hover over `p` and type `(5)`, then arrow down to next cell.
    -   Now move mouse, tooltip doesn't go away.
-   Clear does not clear state, status message.
    -   Currently if we add status with total time to execute or successfully executed, then clearing cells needs to clear status.
    -   Similarly if there was an error, clearing output should clear status as well.
    -   Clearing error, does not clear error message in status.
    -   Either VSC should clear them or we need a hook.

## Editor Questions

-   Find is simple, no regex?
    -   Reasons? (WIP)
-   How should renderers communicate with extension, do we have `acquireVsCodeApi` similar to what we have in WebView.
    -   Or do we just use `postMessage`, and `onMessage`
    -   (WIP)

## Missing

-   No command to delete all cells (File Github issue)
-   How do we know when an editor has closed? (WIP)
    -   We need this informaiton to clean up resources.
-   No toolbar (kernel display)
    -   Yes we can add commands for editor, but there are many, and not enough space.

## Things we expected to work (but not yet)

-   Language services do not work across cells (what do we need to do to get these working)

    -   Basically they get a single cell document, but we need to send everything.

-   Allow ability to collapse a cell (likce code folding) - (WIP)
    -   We could do this by adding an icon to cell toolbar and display only first line and hide output.
-   Local image references do not work in markdown/html. (file an issue)
    -   Not sure how this will work even with our own renderer!
    -   Not supported in markdown either (VSC doesn't support this).

## Execution

-   Run all waits for current cell to finish before going to next
    -   As a user I can run multiple cells at once and let nb handle execution. Why not run all (instead of one by one).
    -   This means VSC is mandating how execution will take place, I would have expected extension to handle this.
    -   (Ongoing discussiong, we'll need to discuss with VSC. Check with team/designer)
-   Stop button does not send cancellation
    -   When u run a cell, the play turns into a stop.
    -   The cancellation token isn't cancelled (token sent in `executeCell`).
    -   (Bug)

## Confusions

-   Undo is confusing.
    -   Then again, better than jupyter notebook. They do not support cell undo.
    -   (ongoing)
-   Cell number is displayed in problems window, but not in editor
    -   How will a user know which one is which?
    -   I found that it is exposed via query string in cell Uri. Is this official, can we use this as an identifier?
    -   (WIP)


## Renderers

-   We need to pre-load js before rendering some UI (GitHub Issue)
    -   We can do this by rendering something in first cell, but what if first cell does not have any output.
    -   Today even if there is no UI rendered, we display a grey area.
    -   Can we have output of type `CellScriptOutput` (which will not render any UI element but will execute the preload scripts).
-   Can we register links in markdown that are then captured by our code.

    -   1. Or do we have to still hook into document click events?
    -   2. Or do we have to create our own renderer?
    -   Not sure how this will work for markdowns (as we aren't rendering them)
    -   We need to handle click events of some output link plotly to enable saving to png (it might work, needs to be seen)
    -   When output is too long we add messages with links to update settings or the like.
    -   Supposed to work in webviews and other places, but not not markdown
        https://code.visualstudio.com/api/extension-guides/command#command-uris

-   Can we get the styles for vscode markdown in some way?
    -   Currently there is no CSS file.
    -   This way if we use our own markdown (which we might have to do to support latex), then we have similar styles
-   Why no security model like viewers?
    -   One can load any script file in here, but not in webviews!
    -   (will change)
-   Run by line issues (debugger)

## TODO

-   Try Tqdm (progressbar), ipywidget
-   Are matplotlib plots svg or png?
    -   Who needs to handle the background issue?
    -   I.e. will native VSC renderers handle this or will we have to create our own renderer?

## Variable explorer

-   How to display in notebook?
    -   Custom output cell? We can, but against like toolbar is not scrollable

## Interactive window using NB

-   Ability to display variable explorer
-   Ability to display input box at the bottom
-   Ability to collapse code (display oneline, can add command to cell toolbar to kinda achieve this)

## Us

-   We have done some work with scrolling inside outputs and the like
    -   Are we concened about those? At the end of the day its their problem.
    -   Should we identify them or let users report them (I prefer the latter, cuz i think not many will complain, only a few).
    -   #ASK VSC
-   Jedi doesn't work with notebook
-   Formatting, linting, refactor doesn't work either
    -   We will need to fix core extension
-   Interactive Window

    -   Remap keyboard shorcuts to take notebook context into account. Else Shift+Enter works in cells and launches interactive window
    -   We can use notebook, but need to be able to dock a cell to the bottom and toolbar/var explorer to the top, else everything else is great.
    -   No way to collapse cells (we'd have to display editor with one liner)

-   Remove editor synchronizer (completely)
-   Found why we render multiple times, we aren't handling responses correctly.
    -   Basically we're triggering updates when status is reported (basically when nothing changes we still update cell and UI).
    -   Easy fix
-   We have live shar stuff in hostJupyterNotebook that is causing issues
-   Prepare to remove live share related host/gues hierarchy
-   Prepare to remove intellisense
-   Do we want renderers as a separate extension? Yes
    -   These are updated very rarely, and smaller downloads as well.
    -   We can always add them as dependencies (extension dependencies) or even prompt user to install them.
    -   Used by other languages, .NET, julia, etc.
    -   Makse sense to split if others make other notebook engines, e.g. .net, julia, and get others to contribute and manage.
    -   Doing this encourages community to build more and we can some day not have to maintain these...
    -   Faster builds, downloads, maintenance
-   Undo is interesting,
    -   If in a cell, they undo text edits
    -   If outside, they undo cell actions.
    -   #Mention to VSC
-   Icon to launch plot viewer
