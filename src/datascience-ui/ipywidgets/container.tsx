// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

'use strict';

import * as isonline from 'is-online';
import * as React from 'react';
import { Store } from 'redux';
import { createDeferred, Deferred } from '../../client/common/utils/async';
import {
    IInteractiveWindowMapping,
    IPyWidgetMessages
} from '../../client/datascience/interactive-common/interactiveWindowTypes';
import { WidgetScriptSource } from '../../client/datascience/ipywidgets/types';
import { SharedMessages } from '../../client/datascience/messages';
import { IDataScienceExtraSettings } from '../../client/datascience/types';
import {
    CommonAction,
    CommonActionType,
    ILoadIPyWidgetClassFailureAction,
    LoadIPyWidgetClassDisabledAction
} from '../interactive-common/redux/reducers/types';
import { IStore } from '../interactive-common/redux/store';
import { PostOffice } from '../react-common/postOffice';
import { WidgetManager } from './manager';

type Props = {
    postOffice: PostOffice;
    widgetContainerId: string;
    store: Store<IStore> & { dispatch: unknown };
};

type NonPartial<T> = {
    [P in keyof T]-?: T[P];
};

export class WidgetManagerComponent extends React.Component<Props> {
    private readonly widgetManager: WidgetManager;
    private readonly widgetSourceRequests = new Map<string, Deferred<void>>();
    private readonly loaderSettings = {
        // Whether to allow loading widgets from 3rd party (cdn).
        loadWidgetScriptsFromThirdPartySource: false,
        // Total time to wait for a script to load. This includes ipywidgets making a request to extension for a Uri of a widget,
        // then extension replying back with the Uri (max 5 seconds round trip time).
        // If expires, then Widget downloader will attempt to download with what ever information it has (potentially failing).
        timeoutWaitingForScriptToLoad: 5_000,
        // List of widgets that must always be loaded using requirejs instead of using a CDN or the like.
        widgetsToLoadFromRequirejs: new Set<string>(),
        // Callback when loading a widget fails.
        errorHandler: this.handleLoadError.bind(this),
        // Callback when requesting a module be registered with requirejs (if possible).
        loadWidgetScript: this.loadWidgetScript.bind(this)
    };
    constructor(props: Props) {
        super(props);
        this.loaderSettings.loadWidgetScriptsFromThirdPartySource =
            props.store.getState().main.settings?.loadWidgetScriptsFromThirdPartySource === true;

        this.widgetManager = new WidgetManager(
            document.getElementById(this.props.widgetContainerId)!,
            this.props.postOffice,
            this.loaderSettings
        );

        props.postOffice.addHandler({
            // tslint:disable-next-line: no-any
            handleMessage: (type: string, payload?: any) => {
                if (type === SharedMessages.UpdateSettings) {
                    const settings = JSON.parse(payload) as IDataScienceExtraSettings;
                    this.loaderSettings.loadWidgetScriptsFromThirdPartySource =
                        settings.loadWidgetScriptsFromThirdPartySource === true;
                } else if (type === IPyWidgetMessages.IPyWidgets_AllWidgetScriptSourcesResponse) {
                    this.registerScriptSourcesInRequirejs(payload as WidgetScriptSource[]);
                } else if (type === IPyWidgetMessages.IPyWidgets_WidgetScriptSourceResponse) {
                    this.registerScriptSourceInRequirejs(payload as WidgetScriptSource);
                } else if (
                    type === IPyWidgetMessages.IPyWidgets_kernelOptions ||
                    type === IPyWidgetMessages.IPyWidgets_onKernelChanged
                ) {
                    // This happens when we have restarted a kernel.
                    // If user changed the kernel, then some widgets might exist now and some might now.
                    this.widgetSourceRequests.clear();
                    // Request again.
                    this.props.postOffice.sendMessage<IInteractiveWindowMapping>(
                        IPyWidgetMessages.IPyWidgets_AllWidgetScriptSourcesRequest
                    );
                }
                return true;
            }
        });
    }
    public render() {
        return null;
    }
    public componentWillUnmount() {
        this.widgetManager.dispose();
    }
    /**
     * Given a list of the widgets along with the sources, we will need to register them with requirejs.
     * IPyWidgets uses requirejs to dynamically load modules.
     * (https://requirejs.org/docs/api.html)
     * All we're doing here is given a widget (module) name, we register the path where the widget (module) can be loaded from.
     * E.g.
     * requirejs.config({ paths:{
     *  'widget_xyz': '<Url of script without trailing .js>'
     * }});
     */
    private registerScriptSourcesInRequirejs(sources: WidgetScriptSource[]) {
        if (!Array.isArray(sources) || sources.length === 0) {
            return;
        }
        // tslint:disable-next-line: no-any
        const requirejs = (window as any).requirejs as { config: Function };
        if (!requirejs) {
            return window.console.error('Requirejs not found');
        }
        const config: { paths: Record<string, string> } = {
            paths: {}
        };
        sources
            .map((source) => {
                // We have fetched the script sources for all of these modules.
                // In some cases we might not have the source, meaning we don't have it or couldn't find it.
                let deferred = this.widgetSourceRequests.get(source.moduleName);
                if (!deferred) {
                    deferred = createDeferred();
                    this.widgetSourceRequests.set(source.moduleName, deferred);
                }
                deferred.resolve();
                return source;
            })
            .filter((source) => source.scriptUri)
            .map((source) => source as NonPartial<WidgetScriptSource>)
            .forEach((source) => {
                this.loaderSettings.widgetsToLoadFromRequirejs.add(source.moduleName);
                // Register the script source into requirejs so it gets loaded via requirejs.
                config.paths[source.moduleName] = source.scriptUri;
            });

        requirejs.config(config);
    }
    private registerScriptSourceInRequirejs(source?: WidgetScriptSource) {
        if (!source) {
            return;
        }
        // tslint:disable-next-line: no-console
        console.log(`Source for IPyWidget ${source.moduleName} ${source.scriptUri ? 'Not found' : source.scriptUri}`);
        this.registerScriptSourcesInRequirejs([source]);
    }
    private createLoadErrorAction(
        className: string,
        moduleName: string,
        moduleVersion: string,
        isOnline: boolean,
        // tslint:disable-next-line: no-any
        error: any
    ): CommonAction<ILoadIPyWidgetClassFailureAction> {
        return {
            type: CommonActionType.LOAD_IPYWIDGET_CLASS_FAILURE,
            payload: { messageDirection: 'incoming', data: { className, moduleName, moduleVersion, isOnline, error } }
        };
    }
    private createLoadDisabledErrorAction(
        className: string,
        moduleName: string,
        moduleVersion: string
    ): CommonAction<LoadIPyWidgetClassDisabledAction> {
        return {
            type: CommonActionType.LOAD_IPYWIDGET_CLASS_DISABLED_FAILURE,
            payload: { messageDirection: 'incoming', data: { className, moduleName, moduleVersion } }
        };
    }

    // tslint:disable-next-line: no-any
    private async handleLoadError(className: string, moduleName: string, moduleVersion: string, error: any) {
        if (this.loaderSettings.loadWidgetScriptsFromThirdPartySource) {
            const isOnline = await isonline.default({ timeout: 1000 });
            this.props.store.dispatch(
                this.createLoadErrorAction(className, moduleName, moduleVersion, isOnline, error)
            );
        } else {
            this.props.store.dispatch(this.createLoadDisabledErrorAction(className, moduleName, moduleVersion));
        }
    }

    private loadWidgetScript(moduleName: string, cb: () => void) {
        // tslint:disable-next-line: no-console
        console.log(`Load IPyWidget ${moduleName}`);
        let deferred = this.widgetSourceRequests.get(moduleName);
        if (!deferred) {
            deferred = createDeferred<void>();
            this.widgetSourceRequests.set(moduleName, deferred);
            this.props.postOffice.sendMessage<IInteractiveWindowMapping>(
                IPyWidgetMessages.IPyWidgets_WidgetScriptSourceRequest,
                moduleName
            );
        }

        // tslint:disable-next-line: no-console
        deferred.promise.finally(cb).catch((ex) => console.log('Failed to load Widget Script from Extension', ex));
    }
}
