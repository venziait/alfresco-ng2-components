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

import {
    Component,
    ViewEncapsulation,
    OnInit
} from '@angular/core';
import { interval, of } from 'rxjs';
import { switchMap, take } from 'rxjs/operators';

@Component({
    selector: 'adf-user-activity-info',
    templateUrl: './user-activity-info.component.html',
    styleUrls: ['./user-activity-info.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class UserActivityInfoComponent implements OnInit {
    updates = [];
    badgeValue;
    showNotifications = false;
    iconConfig = {
        'TASK_CLAIMED': 'accent',
        'TASK_CREATED': 'warn',
        'TASK_COMPLETED': 'primary'
    };

    ngOnInit() {
        setTimeout(() => this.setUpdates(), 5000);
    }

    setUpdates() {
        interval(1000)
        .pipe(
            take(30),
            switchMap(() => of(
                {
                    type: 'TASK_CLAIMED',
                    data: {
                        task_name: 'Supplier_Task',
                        claimer: 'Admin Admin'
                    }
                },
                {
                    type: 'TASK_CREATED',
                    data: {
                        task_name: 'Approval_Task'
                    }
                },
                {
                    type: 'TASK_COMPLETED',
                    data: {
                        task_name: 'Invoice_Task_3'
                    }
                }
            ))
        )
        .subscribe((notification) => {
            this.updates.push(notification);
        });
    }

    removeNotification(index) {
        this.updates.splice(index, 1);
    }
}
