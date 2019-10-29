/********************************************************************************
 * Copyright (C) 2020 Ericsson and others.
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

// import URI from '@theia/core/lib/common/uri';
// import { MaybePromise } from '@theia/core/lib/common';
// import { BrowserWindow, BrowserWindowConstructorOptions, dialog } from 'electron';
// import { realpathSync } from 'fs';
// import { inject, injectable } from 'inversify';
// import { resolve } from 'path';
// import { Argv } from 'yargs';
// import { ElectronApplication, ElectronApplicationContribution, ElectronApplicationSettings, ExecutionParams } from './electron-application';
// const Storage = require('electron-store');
// const createYargs: (argv?: string[], cwd?: string) => Argv = require('yargs/yargs');

// /**
//  * Override this binding to setup your own electron behavior, i.e.: What to do
//  * when a user launches your application.
//  */
// export const ElectronBehavior = Symbol('ElectronBehavior');
// export interface ElectronBehavior {

//     openDefaultWindow(): MaybePromise<BrowserWindow>;

//     openWindowWithWorkspace(workspace: string): MaybePromise<BrowserWindow>;

// }

// /**
//  * Options passed to the main/default command handler.
//  */
// export interface MainCommandOptions {

//     /**
//      * By default, the first positional argument. Should be a file or a folder.
//      */
//     file?: string

// }

// @injectable()
// export class DefaultElectronBehavior implements ElectronApplicationContribution, ElectronBehavior {

//     @inject(ElectronApplication)
//     protected readonly app: ElectronApplication;

// }
