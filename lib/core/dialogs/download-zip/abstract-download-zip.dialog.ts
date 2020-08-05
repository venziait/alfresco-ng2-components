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

import { Inject, OnInit, Component } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { DownloadEntry, NodeEntry } from '@alfresco/js-api';
import { LogService } from '../../services/log.service';
import { DownloadZipService } from '../../services/download-zip.service';

@Component({
    templateUrl: './download-zip.dialog.html',
    styleUrls: ['./download-zip.dialog.scss']
})
export abstract class AbstractDownloadZipDialogComponent implements OnInit {

    // flag for async threads
    cancelled = false;
    downloadId: string;

    constructor(protected dialogRef: MatDialogRef<AbstractDownloadZipDialogComponent>,
                @Inject(MAT_DIALOG_DATA)
                public data: any,
                protected logService: LogService,
                protected downloadZipService: DownloadZipService) {
    }

    ngOnInit() {
        if (this.data && this.data.nodeIds && this.data.nodeIds.length > 0) {
            if (!this.cancelled) {
                this.downloadZip(this.data.nodeIds);
            } else {
                this.logService.log('Cancelled');
            }
        }
    }

    cancelDownload() {
        this.cancelled = true;
        this.downloadZipService.cancelDownload(this.downloadId);
        this.dialogRef.close(false);
    }

    abstract waitAndDownload(downloadId: string, fileName: string): void;

    private downloadZip(nodeIds: string[]) {
        if (nodeIds && nodeIds.length > 0) {

            this.downloadZipService.createDownload({ nodeIds }).subscribe((data: DownloadEntry) => {
                if (data && data.entry && data.entry.id) {

                    this.downloadZipService.getNode(data.entry.id).subscribe((downloadNode: NodeEntry) => {
                        this.logService.log(downloadNode);
                        const fileName = downloadNode.entry.name;
                        this.downloadId = data.entry.id;
                        this.waitAndDownload(data.entry.id, fileName);
                    });
                }
            });
        }
    }

    protected download(url: string, fileName: string) {
        if (url && fileName) {
            const link = document.createElement('a');

            link.style.display = 'none';
            link.download = fileName;
            link.href = url;

            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
        this.dialogRef.close(true);
    }
}
