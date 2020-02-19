/********************************************************************************
 * Copyright (C) 2019 Arm and others.
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

import { injectable, inject, interfaces } from 'inversify';
import { Command, CommandContribution, CommandRegistry, CommandHandler } from '@theia/core';
import { FrontendApplicationContribution, LabelProviderContribution } from '@theia/core/lib/browser';
import { SampleDynamicLabelProviderContribution } from './sample-dynamic-label-provider-contribution';
import URI from '@theia/core/lib/common/uri';
import { EditorManager } from '@theia/editor/lib/browser';
import { FileNavigatorContribution } from '@theia/navigator/lib/browser/navigator-contribution';
import { FileSearchService } from '@theia/file-search/lib/common/file-search-service';
import { WorkspaceService } from '@theia/workspace/lib/browser';

export namespace ExampleLabelProviderCommands {
    const EXAMPLE_CATEGORY = 'Examples';
    export const TOGGLE_SAMPLE: Command = {
        id: 'example_label_provider.toggle',
        category: EXAMPLE_CATEGORY,
        label: 'Toggle Dynamically-Changing Labels'
    };
}

@injectable()
export class SampleDynamicLabelProviderCommandContribution implements FrontendApplicationContribution, CommandContribution {

    @inject(SampleDynamicLabelProviderContribution)
    protected readonly labelProviderContribution: SampleDynamicLabelProviderContribution;

    @inject(EditorManager)
    protected readonly editorManager: EditorManager;

    @inject(FileNavigatorContribution)
    protected readonly navigatorContribution: FileNavigatorContribution;

    @inject(FileSearchService)
    protected readonly fileSearch: FileSearchService;

    @inject(WorkspaceService)
    protected readonly workspaceService: WorkspaceService;

    initialize(): void { }

    registerCommands(commands: CommandRegistry): void {
        commands.registerCommand(ExampleLabelProviderCommands.TOGGLE_SAMPLE, new ExampleLabelProviderCommandHandler(this.labelProviderContribution));
    }

    onStart(): void {
        this.navigatorContribution.openView({ activate: true }).then(() => {
            this.workspaceService.roots.then(roots => {
                if (roots.length) {
                    const rootUris = roots.map(({ uri }) => uri);
                    this.fileSearch.find('.ts', { rootUris, limit: 5 }).then(results => {
                        for (const configUri of results) {
                            this.editorManager.open(new URI(configUri), { mode: 'activate' });
                        }
                    });
                }
            });
        });
    }

}

export class ExampleLabelProviderCommandHandler implements CommandHandler {

    constructor(private readonly labelProviderContribution: SampleDynamicLabelProviderContribution) {
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    execute(...args: any[]): any {
        this.labelProviderContribution.toggle();
    }

}

export const bindDynamicLabelProvider = (bind: interfaces.Bind) => {
    bind(SampleDynamicLabelProviderContribution).toSelf().inSingletonScope();
    bind(LabelProviderContribution).toService(SampleDynamicLabelProviderContribution);
    bind(CommandContribution).to(SampleDynamicLabelProviderCommandContribution).inSingletonScope();
};

