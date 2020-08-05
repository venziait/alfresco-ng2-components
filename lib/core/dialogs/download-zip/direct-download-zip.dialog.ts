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

import { Component, Inject, ViewEncapsulation } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { DownloadEntry, DirectAccessUrlEntry } from '@alfresco/js-api';
import { LogService } from '../../services/log.service';
import { DownloadZipService } from '../../services/download-zip.service';
import { AbstractDownloadZipDialogComponent } from './abstract-download-zip.dialog';

@Component({
    selector: 'adf-direct-download-zip-dialog',
    templateUrl: './download-zip.dialog.html',
    styleUrls: ['./download-zip.dialog.scss'],
    host: { 'class': 'adf-direct-download-zip-dialog' },
    encapsulation: ViewEncapsulation.None
})
export class DirectDownloadZipDialogComponent extends AbstractDownloadZipDialogComponent {

    constructor(dialogRef: MatDialogRef<DirectDownloadZipDialogComponent>,
                @Inject(MAT_DIALOG_DATA)
                public data: any,
                logService: LogService,
                downloadZipService: DownloadZipService) {
        super(dialogRef, data, logService, downloadZipService);
    }

    directDownload(nodeId: string, fileName: string): void {
        this.downloadZipService.getDirectAccessUrl(nodeId).subscribe((urlEntry: DirectAccessUrlEntry) => {
            this.download(urlEntry.entry.contentUrl, fileName);
        });
    }
    waitAndDownload(downloadId: string, fileName: string): void {
        if (this.cancelled) {
            return;
        }

        this.downloadZipService.getDownload(downloadId).subscribe((downloadEntry: DownloadEntry) => {
            if (downloadEntry.entry) {
                if (downloadEntry.entry.status === 'DONE') {
                    this.directDownload(downloadId, fileName);
                } else {
                    setTimeout(() => {
                        this.waitAndDownload(downloadId, fileName);
                    }, 1000);
                }
            }
        });
    }
}
