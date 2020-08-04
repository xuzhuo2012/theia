/********************************************************************************
 * Copyright (C) 2019 Red Hat, Inc. and others.
 *
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License v. 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0.
 *
 * This Source Code may also be made available under the following Secondary
 * Licenses when the conditions for such availability set forth in the Eclipse
 * Public License v. 2.0 are satisfied: GNU General Public License, version 2
 * with the GNU Classpath Exception which is available at
 * https://www.gnu.org/software/classpath/license.html.
 *
 * SPDX-License-Identifier: EPL-2.0 OR GPL-2.0 WITH Classpath-exception-2.0
 ********************************************************************************/
import { Plugin, TimelineCommandArg, TimelineExt, TimelineMain } from '../common';
import { RPCProtocol } from '../common/rpc-protocol';
import { Disposable, ThemeIcon } from './types-impl';
import { PLUGIN_RPC_CONTEXT } from '../common';
import { CancellationToken } from '@theia/core/lib/common/cancellation';
import { DisposableCollection } from '@theia/core/lib/common/disposable';
import { URI } from 'vscode-uri';
import { PluginIconPath } from './plugin-icon-path';
import { CommandRegistryImpl } from './command-registry';
import * as theia from '@theia/plugin';
import { Timeline, TimelineItem, TimelineOptions } from '@theia/timeline/lib/common/timeline-model';

/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
// some code copied and modified from https://github.com/microsoft/vscode/blob/afacd2bdfe7060f09df9b9139521718915949757/src/vs/workbench/api/common/extHostTimeline.ts

export class TimelineExtImpl implements TimelineExt {
    private readonly proxy: TimelineMain;
    private providers = new Map<string, theia.TimelineProvider>();
    private plugin: Plugin;

    private itemsBySourceAndUriMap = new Map<string, Map<string | undefined, Map<string, theia.TimelineItem>>>();

    constructor(readonly rpc: RPCProtocol, private readonly commands: CommandRegistryImpl) {
        this.proxy = rpc.getProxy(PLUGIN_RPC_CONTEXT.TIMELINE_MAIN);

        commands.registerArgumentProcessor({
            processArgument: arg => {
                if (!TimelineCommandArg.is(arg)) {
                    return arg;
                }
                if (arg.isSingleUri) {
                    return URI.parse(arg.uri);
                } else {
                    return this.itemsBySourceAndUriMap.get(arg.source)?.get(arg.uri?.toString())?.get(arg.timelineHandle);
                }
            }
        });
    }

    async $getTimeline(id: string, uri: string, options: TimelineOptions, internalOptions?: TimelineOptions): Promise<Timeline | undefined> {
        const provider = this.providers.get(id);
        const timeline = await provider?.provideTimeline(URI.parse(uri), options, CancellationToken.None);
        let items: Map<string, theia.TimelineItem> | undefined;
        if (timeline) {
            let itemsByUri = this.itemsBySourceAndUriMap.get(id);
            if (itemsByUri === undefined) {
                itemsByUri = new Map();
                this.itemsBySourceAndUriMap.set(id, itemsByUri);
            }

            const uriKey = uri;
            items = itemsByUri.get(uriKey);
            if (items === undefined) {
                items = new Map();
                itemsByUri.set(uriKey, items);
            }
            return {
                items: timeline.items.map(item => {
                    let icon;
                    let iconUrl;
                    let themeIconId;
                    const { iconPath } = item;
                    if (typeof iconPath === 'string' && iconPath.indexOf('fa-') !== -1) {
                        icon = iconPath;
                    } else if (iconPath instanceof ThemeIcon) {
                        themeIconId = iconPath.id;
                    } else {
                        iconUrl = PluginIconPath.toUrl(<PluginIconPath | undefined>iconPath, this.plugin);
                    }
                    const handle = `${id}|${item.id ?? item.timestamp}`;
                    if (items) {
                        items.set(handle, item);
                    }
                    const toDispose = new DisposableCollection();
                    return {
                        source: id,
                        uri,
                        id: item.id,
                        label: item.label,
                        description: item.description,
                        detail: item.detail,
                        timestamp: item.timestamp,
                        contextValue: item.contextValue,
                        icon,
                        iconUrl,
                        themeIconId,
                        handle,
                        command: this.commands.converter.toSafeCommand(item.command, toDispose)
                    } as TimelineItem;
                }),
                paging: timeline.paging,
                source: id
            };
        }
    }

    registerTimelineProvider(plugin: Plugin, scheme: string | string[], provider: theia.TimelineProvider): Disposable {
        const existing = this.providers.get(provider.id);
        if (existing) {
            throw new Error(`Timeline Provider ${provider.id} already exists.`);
        }
        let disposable: Disposable | undefined;
        if (provider.onDidChange) {
            disposable = Disposable.from(provider.onDidChange(e => this.proxy.$fireTimelineChanged({
                uri: e?.uri ? e.uri.path.toString() : undefined,
                reset: true,
                id: provider.id
            }), this));
        }
        this.proxy.$registerTimelineProvider(provider.id, provider.label, scheme);
        this.providers.set(provider.id, provider);
        return  Disposable.create(() => {
            if (disposable) {
                disposable.dispose();
            }
            this.providers.delete(provider.id);
            this.proxy.$unregisterTimelineProvider(provider.id);
        });
    }
}
