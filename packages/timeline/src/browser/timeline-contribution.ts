/********************************************************************************
 * Copyright (C) 2020 RedHat and others.
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

import { injectable, inject } from 'inversify';
import {
    FrontendApplicationContribution,
    FrontendApplication,
    ViewContainer,
    WidgetManager,
    Widget,
    ApplicationShell,
    Navigatable
} from '@theia/core/lib/browser';
import { FileNavigatorContribution } from '@theia/navigator/lib/browser/navigator-contribution';
import { EXPLORER_VIEW_CONTAINER_ID } from '@theia/navigator/lib/browser';
import { TimelineWidget } from './timeline-widget';
import { TimelineService } from './timeline-service';
import { Command, CommandRegistry } from '@theia/core/lib/common';
import { TabBarToolbarRegistry } from '@theia/core/lib/browser/shell/tab-bar-toolbar';

@injectable()
export class TimelineContribution implements FrontendApplicationContribution {

    @inject(FileNavigatorContribution)
    protected readonly explorer: FileNavigatorContribution;
    @inject(WidgetManager)
    protected readonly widgetManager: WidgetManager;
    @inject(TimelineService)
    protected readonly timelineService: TimelineService;
    @inject(CommandRegistry)
    protected readonly commandRegistry: CommandRegistry;
    @inject(TabBarToolbarRegistry)
    protected readonly tabBarToolbar: TabBarToolbarRegistry;
    @inject(ApplicationShell)
    protected readonly shell: ApplicationShell;

    public static readonly LOAD_MORE_COMMAND: Command = {
        id: 'timeline-load-more'
    };

    async onDidInitializeLayout?(app: FrontendApplication): Promise<void> {
        const explorer = await this.widgetManager.getWidget(EXPLORER_VIEW_CONTAINER_ID);
        let timeline: TimelineWidget;
        this.timelineService.onDidChangeProviders( async event => {
            if (explorer instanceof ViewContainer) {
                if (event.added && event.added.length > 0 && explorer.getTrackableWidgets().indexOf(timeline) === -1) {
                    timeline = await this.widgetManager.getOrCreateWidget(TimelineWidget.ID);
                    explorer.addWidget(timeline, { initiallyCollapsed: true });
                } else if (event.removed && this.timelineService.getSources().length === 0) {
                    timeline.close();
                }
            }
        });
        const toolbarItem = {
            id: 'timeline-refresh-toolbar-item',
            command: 'timeline-refresh',
            tooltip: 'Refresh',
            icon: 'fa fa-refresh'
        };
        this.commandRegistry.registerCommand({ id: toolbarItem.command }, {
            execute: widget => this.checkWidget(widget, () => {
                if (timeline) {
                    timeline.refreshList();
                }
            }),
            isEnabled: widget => this.checkWidget(widget, () => true),
            isVisible: widget => this.checkWidget(widget, () => true)
        });
        let navigable: Navigatable;
        this.shell.onDidChangeCurrentWidget(event => {
            const oldValue = event.oldValue;
            if (oldValue && Navigatable.is(oldValue)) {
                navigable = oldValue;
            }
        });
        this.commandRegistry.registerCommand(TimelineContribution.LOAD_MORE_COMMAND, {
            execute: () => {
                if (navigable) {
                    const uri = navigable.getResourceUri();
                    if (uri) {
                        timeline.loadTimeline(uri, false);
                    }
                }
            }
        });
        this.tabBarToolbar.registerItem(toolbarItem);
    }

    private checkWidget<T>(widget: Widget, cb: () => T): T | false {
        if (widget instanceof TimelineWidget && widget.id === TimelineWidget.ID) {
            return cb();
        }
        return false;
    }
}
