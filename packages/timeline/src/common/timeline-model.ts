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

/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
// some code copied and modified from https://github.com/microsoft/vscode/blob/3aab025eaebde6c9544293b6c7554f3f583e15d0/src/vs/workbench/contrib/timeline/common/timeline.ts

import { Command, Disposable, Event } from '@theia/core/lib/common';
import URI from '@theia/core/lib/common/uri';

export class TimelineItem {
    source: string;
    uri: string;
    handle: string;
    timestamp: number;
    label: string;
    id?: string;
    description?: string;
    detail?: string;
    command?: Command;
    contextValue?: string;
    constructor(label: string, timestamp: number) {
        this.label = label;
        this.timestamp = timestamp;
    }
}

export interface TimelineChangeEvent {
    id: string;
    uri: URI | undefined;
    reset: boolean
}

export interface TimelineProvidersChangeEvent {
    readonly added?: string[];
    readonly removed?: string[];
}

export interface TimelineOptions {
    cursor?: string;
    limit?: number | { timestamp: number; id?: string };
}

export interface Timeline {
    source: string;

    paging?: {
        readonly cursor: string | undefined;
    }

    items: TimelineItem[];
}

export interface TimelineProvider extends Disposable {
    id: string;
    label: string;
    scheme: string | string[];
    onDidChange?: Event<TimelineChangeEvent>;
    provideTimeline(uri: URI, options: TimelineOptions ): Promise<Timeline | undefined>;
}

export interface TimelineSource {
    id: string;
    label: string;
}
