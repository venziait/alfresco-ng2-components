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

import { Injectable } from '@angular/core';

export interface WebVTTValidation {
    valid: boolean;
    strict: boolean;
    cues: Cue[];
    errors: any[];
    meta?: {
        [key: string]: string;
    };
}

export interface Cue {
    identifier: string;
    start: number;
    end: number;
    text: string;
    styles: string;
}

const TIMESTAMP_REGEXP = /([0-9]{1,2})?:?([0-9]{2}):([0-9]{2}\.[0-9]{2,3})/;

@Injectable({
    providedIn: 'root'
})
export class WebVTTValidatorService {
    parse(input, options?): WebVTTValidation {
        if (!options) {
            options = {};
        }

        const { meta = false, strict = true } = options;

        if (typeof input !== 'string') {
            throw new Error('Input must be a string');
        }

        input = input.trim();
        input = input.replace(/\r\n/g, '\n');
        input = input.replace(/\r/g, '\n');

        const parts = input.split('\n\n');
        const header = parts.shift();

        if (!header.startsWith('WEBVTT')) {
            throw new Error('Must start with "WEBVTT"');
        }

        const headerParts = header.split('\n');

        const headerComments = headerParts[0].replace('WEBVTT', '');

        if (headerComments.length > 0
            && (headerComments[0] !== ' ' && headerComments[0] !== '\t')
        ) {
            throw new Error('Header comment must start with space or tab');
        }

        // nothing of interests, return early
        if (parts.length === 0 && headerParts.length === 1) {
            return { valid: true, strict, cues: [], errors: [] };
        }

        if (!meta && headerParts.length > 1 && headerParts[1] !== '') {
            throw new Error('Missing blank line after signature');
        }

        const { cues, errors } = this.parseCues(parts, strict);

        if (strict && errors.length > 0) {
            throw errors[0];
        }

        const headerMeta = meta ? this.parseMeta(headerParts) : null;

        const result: WebVTTValidation = { valid: errors.length === 0, strict, cues, errors };

        if (meta) {
            result.meta = headerMeta;
        }

        return result;
    }

    private parseMeta(headerParts) {
        const meta = {};
        headerParts.slice(1).forEach(header => {
            const splitIdx = header.indexOf(':');
            const key = header.slice(0, splitIdx).trim();
            const value = header.slice(splitIdx + 1).trim();
            meta[key] = value;
        });
        return Object.keys(meta).length > 0 ? meta : null;
    }

    private parseCues(cues, strict) {
        const errors = [];

        const parsedCues = cues
            .map((cue, i) => {
                try {
                    return this.parseCue(cue, i, strict);
                } catch (e) {
                    errors.push(e);
                    return null;
                }
            })
            .filter(Boolean);

        return {
            cues: parsedCues,
            errors
        };
    }

    /**
     * Parse a single cue block.
     *
     * @param {array} cue Array of content for the cue
     * @param {number} i Index of cue in array
     *
     * @returns {object} cue Cue object with start, end, text and styles.
     *                       Null if it's a note
     */
    private parseCue(cue, i, strict) {
        let identifier = '';
        let start = 0;
        let end = 0.01;
        let text = '';
        let styles = '';

        // split and remove empty lines
        const lines = cue.split('\n').filter(Boolean);

        if (lines.length > 0 && lines[0].trim().startsWith('NOTE')) {
            return null;
        }

        if (lines.length === 1 && !lines[0].includes('-->')) {
            throw new Error(`Cue identifier cannot be standalone (cue #${i})`);
        }

        if (lines.length > 1 &&
            !(lines[0].includes('-->') || lines[1].includes('-->'))) {
            const msg = `Cue identifier needs to be followed by timestamp (cue #${i})`;
            throw new Error(msg);
        }

        if (lines.length > 1 && lines[1].includes('-->')) {
            identifier = lines.shift();
        }

        const times = lines[0].split(' --> ');

        if (times.length !== 2 ||
            !this.validTimestamp(times[0]) ||
            !this.validTimestamp(times[1])) {
            throw new Error(`Invalid cue timestamp (cue #${i})`);
        }

        start = this.parseTimestamp(times[0]);
        end = this.parseTimestamp(times[1]);

        if (strict) {
            if (start > end) {
                throw new Error(`Start timestamp greater than end (cue #${i})`);
            }

            if (end <= start) {
                throw new Error(`End must be greater than start (cue #${i})`);
            }
        }

        if (!strict && end < start) {
            throw new Error(
                `End must be greater or equal to start when not strict (cue #${i})`
            );
        }

        styles = times[1].replace(TIMESTAMP_REGEXP, '').trim();

        lines.shift();

        text = lines.join('\n');

        if (!text) {
            return false;
        }

        return { identifier, start, end, text, styles };
    }

    private validTimestamp(timestamp) {
        return TIMESTAMP_REGEXP.test(timestamp);
    }

    private parseTimestamp(timestamp) {
        const matches = timestamp.match(TIMESTAMP_REGEXP);
        let secs = parseFloat(matches[1] || 0) * 60 * 60; // hours
        secs += parseFloat(matches[2]) * 60; // mins
        secs += parseFloat(matches[3]);
        // secs += parseFloat(matches[4]);
        return secs;
    }
}
