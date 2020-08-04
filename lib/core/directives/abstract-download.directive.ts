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

import { HostListener, Directive } from '@angular/core';
import { NodeEntry, VersionEntry } from '@alfresco/js-api';

@Directive({
})
export abstract class AbstractDownloadDirective {

    /** Nodes to download. */
    abstract nodes: NodeEntry | NodeEntry[];

    /** Node's version to download. */
    abstract version: VersionEntry;

    @HostListener('click')
    onClick() {
        this.downloadNodes(this.nodes);
    }

    constructor() {
    }

    /**
     * Downloads multiple selected nodes.
     * Packs result into a .ZIP archive if there is more than one node selected.
     * @param selection Multiple selected nodes to download
     */
    downloadNodes(selection: NodeEntry | Array<NodeEntry>): void {
        if (!this.isSelectionValid(selection)) {
            return;
        }
        if (selection instanceof Array) {
            if (selection.length === 1) {
                this.downloadNode(selection[0]);
            } else {
                this.downloadZip(selection);
            }
        } else {
            this.downloadNode(selection);
        }
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

            if (entry.isFolder) {
                this.downloadZip([node]);
            }

            // Check if there's nodeId for Shared Files
            if (!entry.isFile && !entry.isFolder && (<any> entry).nodeId) {
                this.downloadFile(node);
            }
        }
    }

    protected isSelectionValid(selection: NodeEntry | Array<NodeEntry>) {
        return selection || (selection instanceof Array && selection.length > 0);
    }

    abstract downloadFile(node: NodeEntry): void;
    abstract downloadZip(selection: Array<NodeEntry>): void;
}
