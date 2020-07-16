/********************************************************************************
 * Copyright (C) 2020 TypeFox and others.
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

import * as bent from 'bent';
import * as semver from 'semver';
import { injectable, inject } from 'inversify';
import { VSXExtensionRaw, VSXSearchParam, VSXSearchResult, VSXAllVersions } from './vsx-registry-types';
import { VSXEnvironment } from './vsx-environment';

const fetchText = bent('GET', 'string', 200);
const fetchJson = bent('GET', 'json', 200);

export interface VSXResponseError extends Error {
    statusCode: number
}
export namespace VSXResponseError {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    export function is(error: any): error is VSXResponseError {
        return !!error && typeof error === 'object'
            && 'statusCode' in error && typeof error['statusCode'] === 'number';
    }
}

@injectable()
export class VSXRegistryAPI {

    @inject(VSXEnvironment)
    protected readonly environment: VSXEnvironment;

    async search(param?: VSXSearchParam): Promise<VSXSearchResult> {
        const apiUri = await this.environment.getRegistryApiUri();
        let searchUri = apiUri.resolve('-/search').toString();
        if (param) {
            let query = '';
            if (param.query) {
                query += 'query=' + encodeURIComponent(param.query);
            }
            if (param.category) {
                query += 'category=' + encodeURIComponent(param.category);
            }
            if (param.size) {
                query += 'size=' + param.size;
            }
            if (param.offset) {
                query += 'offset=' + param.offset;
            }
            if (query) {
                searchUri += '?' + query;
            }
        }
        return this.fetchJson<VSXSearchResult>(searchUri);
    }

    async getExtension(id: string): Promise<VSXExtensionRaw> {
        const apiUri = await this.environment.getRegistryApiUri();
        return this.fetchJson(apiUri.resolve(id.replace('.', '/')).toString());
    }

    async getExtensionVersion(id: string, version?: string): Promise<VSXExtensionRaw> {
        const apiUri = await this.environment.getRegistryApiUri();
        return this.fetchJson(apiUri.resolve(id.replace('.', '/')).toString() + `/${version}`);
    }

    protected async fetchJson<T>(url: string): Promise<T> {
        const result = await fetchJson(url);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return result as any as T;
    }

    fetchText(url: string): Promise<string> {
        return fetchText(url);
    }

    /**
     * Get the latest compatible extension version.
     * - an extension satisfies compatibility if its `engines.vscode` version is supported.
     * @param id the extension id.
     *
     * @returns the data for the latest compatible extension version if available, else `undefined`.
     */
    async getLatestCompatibleExtension(id: string): Promise<VSXExtensionRaw | undefined> {
        const extension = await this.getExtension(id);
        for (const extensionVersion in extension.allVersions) {
            if (extensionVersion === 'latest') {
                continue;
            }
            const apiUri = await this.environment.getRegistryApiUri();
            const data: VSXExtensionRaw = await this.fetchJson(apiUri.resolve(id.replace('.', '/')).toString() + `/${extensionVersion}`);
            if (data.engines && await this.isEngineValid(data.engines.vscode)) {
                return data;
            }
        }
    }

    /**
     * Get the latest compatible version of an extension.
     * @param versions the `allVersions` property.
     *
     * @returns the latest compatible version of an extension if it exists, else `undefined`.
     */
    async getLatestCompatibleVersion(id: string, versions: VSXAllVersions[]): Promise<VSXExtensionRaw | undefined> {
        for (const data of versions) {
            if (!data.engines) {
                continue;
            }
            if (await this.isEngineValid(data.engines.vscode)) {
                return this.getExtensionVersion(id, data.version);
            }
        }
        return undefined;
    }

    /**
     * Determine if the engine is valid.
     * @param engine the engine.
     *
     * @returns `true` if the engine satisfies the API version.
     */
    protected async isEngineValid(engine?: string): Promise<boolean> {
        if (!engine) {
            return false;
        }
        const apiVersion = await this.environment.getVscodeApiVersion();
        return engine === '*' || semver.satisfies(apiVersion, engine);
    }

}
