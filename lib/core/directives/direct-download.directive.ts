/*!
 * @license
 * Copyright 2020 Alfresco Software, Ltd.
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
import { Directive, Input, HostListener } from '@angular/core';
// import { MatDialog } from '@angular/material/dialog';
import { AlfrescoApiService } from '@alfresco/adf-core';
// import { DownloadZipDialogComponent } from '../dialogs/download-zip/download-zip.dialog';
import { NodeEntry, NodesApi } from '@alfresco/js-api';
import { DownloadService } from '../services/download.service';

@Directive({
    selector: '[adf-direct-download]'
})
export class DirectDownloadDirective {

    private nodesApi: NodesApi;

    /** Nodes to download. */
    @Input('adf-direct-download')
    nodes: NodeEntry | NodeEntry[];

    @HostListener('click')
    onClick() {
        // tslint:disable-next-line: no-console
        console.log('direct-access-button clicked');
        // this.directAccessDownloads(this.nodes);
    }

    constructor(
        apiService: AlfrescoApiService,
        private downloadService: DownloadService/*,
         private dialog: MatDialog */) {
            this.nodesApi = new NodesApi(apiService.getInstance());
    }

    /**
     * Downloads a single node.
     * Packs result into a .ZIP archive is the node is a Folder.
     * @param node Node to download
     */
    downloadNode(node: NodeEntry) {
        if (node && node.entry) {
            const entry = node.entry;

            if (entry.isFile) {
                this.downloadFile(node);
            }

            // if (entry.isFolder) {
            //     this.downloadZip([node]);
            // }

            // // Check if there's nodeId for Shared Files
            // if (!entry.isFile && !entry.isFolder && (<any> entry).nodeId) {
            //     this.downloadFile(node);
            // }
        }
    }

    private isSelectionValid(selection: NodeEntry | Array<NodeEntry>) {
        return selection || (selection instanceof Array && selection.length > 0);
    }

    private downloadFile(node: NodeEntry) {
        if (node && node.entry) {
            // nodeId for Shared node
            const id = (<any> node.entry).nodeId || node.entry.id;

            this.nodesApi.requestContentUrl(id).then(
                directAccessUrlEntry => {
                    const fileName = node.entry.name;
                    const url = directAccessUrlEntry.entry.contentUrl;
                    this.downloadService.downloadUrl(url, fileName);
                }
            );
        }
    }

    /**
     * Downloads multiple selected nodes.
     * Packs result into a .ZIP archive if there is more than one node selected.
     * @param selection Multiple selected nodes to download
     */
    directAccessDownloads(selection: NodeEntry | Array<NodeEntry>) {

        if (!this.isSelectionValid(selection)) {
            return;
        }
        if (selection instanceof Array) {
            if (selection.length === 1) {
                this.downloadNode(selection[0]);
            } else {
                return; // this.downloadZip(selection);
            }
        } else {
            this.downloadNode(selection);
        }
    }
    /** TODO */
    // private downloadZip(selection: Array<NodeEntry>) {
    //     if (selection && selection.length > 0) {
    //         // nodeId for Shared node
    //         const nodeIds = selection.map((node: any) => (node.entry.nodeId || node.entry.id));

    //         this.dialog.open(DownloadZipDialogComponent, {
    //             width: '600px',
    //             disableClose: true,
    //             data: {
    //                 nodeIds
    //             }
    //         });
    //     }
    // }
}
