/*!
 * @license
 * Copyright 2019 Alfresco Software, Ltd.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { Directive, Input } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { AlfrescoApiService, DownloadService } from '../services';
import { DirectDownloadZipDialogComponent } from '../dialogs/download-zip/direct-download-zip.dialog';
import { NodeEntry, NodesApi, VersionEntry } from '@alfresco/js-api';
import { AbstractDownloadDirective } from './abstract-download.directive';

@Directive({
    selector: '[adf-direct-download]'
})
export class DirectDownloadDirective extends AbstractDownloadDirective {

    /** Nodes to download. */
    @Input('adf-direct-download')
    nodes: NodeEntry | NodeEntry[];

    @Input()
    version: VersionEntry;

    constructor(
        private apiService: AlfrescoApiService,
        private downloadService: DownloadService,
        private dialog: MatDialog ) {
            super();
    }

    downloadVersion(nodeId: string, versionId: string, fileName: string) {
        new NodesApi(this.apiService.getInstance()).requestContentUrl_2(nodeId, versionId).then(
            directAccessUrlEntry => {
                this.downloadService.downloadUrl(directAccessUrlEntry.entry.contentUrl, fileName);
            }
        );
    }

    downloadContent(nodeId: string, fileName: string) {
        new NodesApi(this.apiService.getInstance()).requestContentUrl(nodeId).then(
            directAccessUrlEntry => {
                this.downloadService.downloadUrl(directAccessUrlEntry.entry.contentUrl, fileName);
            }
        );
    }

    downloadZip(selection: Array<NodeEntry>) {
        if (selection && selection.length > 0) {
            // nodeId for Shared node
            const nodeIds = selection.map((node: any) => (node.entry.nodeId || node.entry.id));

            this.dialog.open(DirectDownloadZipDialogComponent, {
                width: '600px',
                disableClose: true,
                data: {
                    nodeIds
                }
            });
        }
    }
}
