/********************************************************************************
 * Copyright (C) 2018 TypeFox and others.
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

import '../../src/browser/style/index.css';
import '../../src/browser/style/symbol-sprite.svg';
import '../../src/browser/style/symbol-icons.css';

import { ContainerModule, decorate, injectable, interfaces } from 'inversify';
import { MenuContribution, CommandContribution } from '@theia/core/lib/common';
import {
    QuickOpenService, FrontendApplicationContribution, KeybindingContribution,
    PreferenceService, PreferenceSchemaProvider, createPreferenceProxy, QuickOpenContribution, PreferenceChanges, PreferenceScope
} from '@theia/core/lib/browser';
import { TextEditorProvider, DiffNavigatorProvider } from '@theia/editor/lib/browser';
import { StrictEditorTextFocusContext } from '@theia/editor/lib/browser/editor-keybinding-contexts';
import { MonacoEditorProvider, MonacoEditorFactory } from './monaco-editor-provider';
import { MonacoEditorMenuContribution } from './monaco-menu';
import { MonacoEditorCommandHandlers } from './monaco-command';
import { MonacoKeybindingContribution } from './monaco-keybinding';
import { MonacoLanguages } from './monaco-languages';
import { MonacoWorkspace } from './monaco-workspace';
import { MonacoEditorService } from './monaco-editor-service';
import { MonacoTextModelService, MonacoEditorModelFactory } from './monaco-text-model-service';
import { MonacoContextMenuService } from './monaco-context-menu';
import { MonacoOutlineContribution } from './monaco-outline-contribution';
import { MonacoStatusBarContribution } from './monaco-status-bar-contribution';
import { MonacoCommandService, MonacoCommandServiceFactory } from './monaco-command-service';
import { MonacoCommandRegistry } from './monaco-command-registry';
import { MonacoQuickOpenService } from './monaco-quick-open-service';
import { MonacoDiffNavigatorFactory } from './monaco-diff-navigator-factory';
import { MonacoStrictEditorTextFocusContext } from './monaco-keybinding-contexts';
import { MonacoFrontendApplicationContribution } from './monaco-frontend-application-contribution';
import MonacoTextmateModuleBinder from './textmate/monaco-textmate-frontend-bindings';
import { MonacoBulkEditService } from './monaco-bulk-edit-service';
import { MonacoOutlineDecorator } from './monaco-outline-decorator';
import { OutlineTreeDecorator } from '@theia/outline-view/lib/browser/outline-decorator-service';
import { MonacoSnippetSuggestProvider } from './monaco-snippet-suggest-provider';
import { ContextKeyService } from '@theia/core/lib/browser/context-key-service';
import { MonacoContextKeyService } from './monaco-context-key-service';
import { MonacoMimeService } from './monaco-mime-service';
import { MimeService } from '@theia/core/lib/browser/mime-service';
import { MonacoEditorServices } from './monaco-editor';
import { MonacoColorRegistry } from './monaco-color-registry';
import { ColorRegistry } from '@theia/core/lib/browser/color-registry';
import { MonacoThemingService } from './monaco-theming-service';
import { bindContributionProvider } from '@theia/core';
import { WorkspaceSymbolCommand } from './workspace-symbol-command';
import { LanguageService } from '@theia/core/lib/browser/language-service';
import { MonacoToProtocolConverter } from './monaco-to-protocol-converter';
import { ProtocolToMonacoConverter } from './protocol-to-monaco-converter';

decorate(injectable(), monaco.contextKeyService.ContextKeyService);

MonacoThemingService.init();

export default new ContainerModule((bind, unbind, isBound, rebind) => {
    bind(MonacoThemingService).toSelf().inSingletonScope();

    bind(MonacoContextKeyService).toSelf().inSingletonScope();
    rebind(ContextKeyService).toService(MonacoContextKeyService);

    bind(MonacoSnippetSuggestProvider).toSelf().inSingletonScope();
    bind(FrontendApplicationContribution).to(MonacoFrontendApplicationContribution).inSingletonScope();

    bind(MonacoToProtocolConverter).toSelf().inSingletonScope();
    bind(ProtocolToMonacoConverter).toSelf().inSingletonScope();

    bind(MonacoLanguages).toSelf().inSingletonScope();
    rebind(LanguageService).toService(MonacoLanguages);
    bind(WorkspaceSymbolCommand).toSelf().inSingletonScope();
    for (const identifier of [CommandContribution, KeybindingContribution, QuickOpenContribution]) {
        bind(identifier).toService(WorkspaceSymbolCommand);
    }

    bind(MonacoWorkspace).toSelf().inSingletonScope();

    bind(MonacoConfigurationService).toDynamicValue(({ container }) =>
        createMonacoConfigurationService(container)
    ).inSingletonScope();
    bind(monaco.contextKeyService.ContextKeyService).toDynamicValue(({ container }) =>
        new monaco.contextKeyService.ContextKeyService(container.get(MonacoConfigurationService))
    ).inSingletonScope();
    bind(MonacoBulkEditService).toSelf().inSingletonScope();
    bind(MonacoEditorService).toSelf().inSingletonScope();
    bind(MonacoTextModelService).toSelf().inSingletonScope();
    bind(MonacoContextMenuService).toSelf().inSingletonScope();
    bind(MonacoEditorServices).toSelf().inSingletonScope();
    bind(MonacoEditorProvider).toSelf().inSingletonScope();
    bindContributionProvider(bind, MonacoEditorFactory);
    bindContributionProvider(bind, MonacoEditorModelFactory);
    bind(MonacoCommandService).toSelf().inTransientScope();
    bind(MonacoCommandServiceFactory).toAutoFactory(MonacoCommandService);
    bind(TextEditorProvider).toProvider(context =>
        uri => context.container.get(MonacoEditorProvider).get(uri)
    );
    bind(MonacoDiffNavigatorFactory).toSelf().inSingletonScope();
    bind(DiffNavigatorProvider).toFactory(context =>
        editor => context.container.get(MonacoEditorProvider).getDiffNavigator(editor)
    );

    bind(MonacoOutlineContribution).toSelf().inSingletonScope();
    bind(FrontendApplicationContribution).toService(MonacoOutlineContribution);

    bind(MonacoStatusBarContribution).toSelf().inSingletonScope();
    bind(FrontendApplicationContribution).toService(MonacoStatusBarContribution);

    bind(MonacoCommandRegistry).toSelf().inSingletonScope();
    bind(CommandContribution).to(MonacoEditorCommandHandlers).inSingletonScope();
    bind(MonacoEditorMenuContribution).toSelf().inSingletonScope();
    bind(MenuContribution).toService(MonacoEditorMenuContribution);
    bind(MonacoKeybindingContribution).toSelf().inSingletonScope();
    bind(KeybindingContribution).toService(MonacoKeybindingContribution);
    rebind(StrictEditorTextFocusContext).to(MonacoStrictEditorTextFocusContext).inSingletonScope();

    bind(MonacoQuickOpenService).toSelf().inSingletonScope();
    rebind(QuickOpenService).toService(MonacoQuickOpenService);

    MonacoTextmateModuleBinder(bind, unbind, isBound, rebind);

    bind(MonacoOutlineDecorator).toSelf().inSingletonScope();
    bind(OutlineTreeDecorator).toService(MonacoOutlineDecorator);

    bind(MonacoMimeService).toSelf().inSingletonScope();
    rebind(MimeService).toService(MonacoMimeService);

    bind(MonacoColorRegistry).toSelf().inSingletonScope();
    rebind(ColorRegistry).toService(MonacoColorRegistry);
});

export const MonacoConfigurationService = Symbol('MonacoConfigurationService');
export function createMonacoConfigurationService(container: interfaces.Container): monaco.services.IConfigurationService {
    const preferences = container.get<PreferenceService>(PreferenceService);
    const preferenceSchemaProvider = container.get<PreferenceSchemaProvider>(PreferenceSchemaProvider);
    const service = monaco.services.StaticServices.configurationService.get();
    const _configuration = service._configuration;

    _configuration.getValue = (section, overrides, workspace) => {
        const overrideIdentifier = overrides && 'overrideIdentifier' in overrides && overrides['overrideIdentifier'] as string || undefined;
        const resourceUri = overrides && 'resource' in overrides && !!overrides['resource'] && overrides['resource'].toString();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const proxy = createPreferenceProxy<{ [key: string]: any }>(preferences, preferenceSchemaProvider.getCombinedSchema(), {
            resourceUri, overrideIdentifier, style: 'both'
        });
        if (section) {
            return proxy[section];
        }
        return proxy;
    };

    const parseSections = (changes?: PreferenceChanges) => {
        if (!changes) {
            return undefined;
        }
        const sections = [];
        for (let key of Object.keys(changes)) {
            const hasOverride = key.startsWith('[');
            while (key) {
                sections.push(key);
                if (hasOverride && key.indexOf('.') !== -1) {
                    sections.push(key.substr(key.indexOf('.')));
                }
                const index = key.lastIndexOf('.');
                key = key.substring(0, index);
            }
        }
        return sections;
    };

    const toTarget = (scope: PreferenceScope): monaco.services.ConfigurationTarget => {
        switch (scope) {
            case PreferenceScope.Default: return monaco.services.ConfigurationTarget.DEFAULT;
            case PreferenceScope.User: return monaco.services.ConfigurationTarget.USER;
            case PreferenceScope.Workspace: return monaco.services.ConfigurationTarget.WORKSPACE;
            case PreferenceScope.Folder: return monaco.services.ConfigurationTarget.WORKSPACE_FOLDER;
        }
    };

    preferences.onPreferencesChanged((changes?: PreferenceChanges) => {
        const affectedSections = parseSections(changes);

        let target: monaco.services.ConfigurationTarget | undefined;
        if (changes && affectedSections && affectedSections.length > 0) {
            const change = changes[affectedSections[0]];
            target = toTarget(change.scope);
        }

        if (affectedSections) {
            const keys = affectedSections || [];
            const previous = { data: service._configuration.toData() };
            const event = new monaco.services.ConfigurationChangeEvent({ keys, overrides: [] }, previous, service._configuration);

            if (target) {
                event.source = target;
            }

            service._onDidChangeConfiguration.fire(event);
        }
    });

    return service;
}
