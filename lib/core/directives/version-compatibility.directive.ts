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

import { Directive, Input, ViewContainerRef, TemplateRef } from '@angular/core';
import { VersionCompatibilityService } from '../services/version-compatibility.service';

@Directive({
    selector: '[adf-acs-version]'
})
export class VersionCompatibilityDirective {

    /** Minimum version required for component to work correctly . */
    @Input('adf-acs-version')
    set version(requiredVersion: string) {
        this.validateAcsVersion(requiredVersion);
    }

    constructor(
        private templateRef: TemplateRef<any>,
        private viewContainer: ViewContainerRef,
        private versionCompatibilityService: VersionCompatibilityService
    ) {
    }

    private validateAcsVersion(requiredVersion: string) {
        if (requiredVersion && this.versionCompatibilityService.isAcsVersionSupported(requiredVersion)) {
            this.viewContainer.createEmbeddedView(this.templateRef);
        } else {
            this.viewContainer.clear();
        }
    }
}
