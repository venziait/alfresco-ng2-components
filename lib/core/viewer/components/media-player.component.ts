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

import { Component, Input, OnChanges, SimpleChanges, ViewEncapsulation, ViewChild, ElementRef } from '@angular/core';
import { ContentService } from '../../services/content.service';
import { WebVTTValidatorService } from '../services/webvtt-validator.service';

@Component({
    selector: 'adf-media-player',
    templateUrl: './media-player.component.html',
    styleUrls: ['./media-player.component.scss'],
    host: { 'class': 'adf-media-player' },
    encapsulation: ViewEncapsulation.None
})
export class MediaPlayerComponent implements OnChanges {

    @Input()
    urlFile: string;

    @Input()
    blobFile: Blob;

    @Input()
    mimeType: string;

    @Input()
    nameFile: string;

    @Input()
    webVTT: string;

    @ViewChild('videoPlayer')
    videoPlayer: ElementRef;

    constructor(private contentService: ContentService, private webVTTValidatorService: WebVTTValidatorService) { }

    ngOnChanges(changes: SimpleChanges) {
        const blobFile = changes['blobFile'];
        if (blobFile && blobFile.currentValue) {
            this.urlFile = this.contentService.createTrustedUrl(this.blobFile);
            return;
        }

        if (!this.urlFile && !this.blobFile) {
            throw new Error('Attribute urlFile or blobFile is required');
        }

        if (this.webVTT) {
            const track: TextTrack = this.videoPlayer.nativeElement.addTextTrack('caption', 'Captions');
            if (this.addCuesFromWebVTT(track, this.webVTT)) {
                track.mode = 'showing';
            }
        }
    }

    addCuesFromWebVTT(track: TextTrack, input: string): boolean {
        try {
            const inputValidationResult = this.webVTTValidatorService.parse(input);
            if (inputValidationResult.errors.length === 0) {
                inputValidationResult.cues.forEach(cue => track.addCue(new VTTCue(cue.start, cue.end, cue.text)));
            }
            return inputValidationResult.errors.length === 0;
        } catch (e) {
            return false;
        }
    }
}
