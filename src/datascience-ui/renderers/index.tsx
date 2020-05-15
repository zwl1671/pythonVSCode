// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

'use strict';

// This must be on top, do not change. Required by webpack.
import '../common/main';
// This must be on top, do not change. Required by webpack.

import { nbformat } from '@jupyterlab/coreutils';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import '../../client/common/extensions';
import { noop } from '../../client/common/utils/misc';
import { InteractiveWindowMessages } from '../../client/datascience/interactive-common/interactiveWindowTypes';
import { handleLinkClick } from '../interactive-common/handlers';
import type { IVsCodeApi } from '../react-common/postOffice';
import { CellOutput, ICellOutputProps } from './render';
export declare function acquireVsCodeApi(): IVsCodeApi;

// // __webpack_public_path__ =
// //     'vscode-resource:///Users/donjayamanne/Desktop/Development/vsc/pythonVSCode/out/datascience-ui/renderers/';
function renderOutput(tag: HTMLScriptElement, _mimeType: string, output: nbformat.IOutput) {
    let container: HTMLElement;
    // Create an element to render in, or reuse a previous element.
    if (tag.nextElementSibling instanceof HTMLDivElement) {
        container = tag.nextElementSibling;
        // tslint:disable-next-line: no-inner-html
        container.innerHTML = '';
    } else {
        container = document.createElement('div');
        tag.parentNode?.insertBefore(container, tag.nextSibling);
    }
    tag.parentElement?.removeChild(tag);
    const cellOutputProps: ICellOutputProps = {
        baseTheme: '',
        expandImage: noop,
        widgetFailed: noop,
        output
    };
    // tslint:disable-next-line: no-use-before-declare
    ReactDOM.render(React.createElement(CellOutput, cellOutputProps, null), container);
}

function renderOnLoad() {
    document
        .querySelectorAll<HTMLScriptElement>('script[type="application/vscode-jupyter+json"]')
        .forEach((tag) => renderOutput(tag, tag.dataset.mimeType as string, JSON.parse(tag.innerHTML)));
}

// tslint:disable-next-line: no-any
function postToExtension(type: string, payload: any) {
    acquireVsCodeApi().postMessage({ type, payload });
}
function linkHandler(href: string) {
    if (href.startsWith('data:image/png')) {
        postToExtension(InteractiveWindowMessages.SavePng, href);
    } else {
        postToExtension(InteractiveWindowMessages.OpenLink, href);
    }
}

// tslint:disable-next-line: no-any
function initialize(global: Record<string, any>) {
    global['vscode-jupyter'] = {};
    global['vscode-jupyter'].renderOutput = renderOutput;
    document.addEventListener('click', (e) => handleLinkClick(e, linkHandler), true);
    renderOnLoad();
}

// tslint:disable-next-line: no-any
(window as any).renderOutput = renderOutput;
initialize(window);
