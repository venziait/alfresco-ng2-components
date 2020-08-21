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
import { map } from 'rxjs/operators';
import { Apollo } from 'apollo-angular';
import gql from 'graphql-tag';

@Component({
    selector: 'adf-user-activity-info',
    templateUrl: './user-activity-info.component.html',
    styleUrls: ['./user-activity-info.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class UserActivityInfoComponent implements OnInit {
    notifications = [];
    badgeValue;
    showNotifications = false;

    subscriptionQuery = gql`
        subscription {
            engineEvents(eventType: [TASK_CREATED, TASK_UPDATED, PROCESS_STARTED, TASK_ASSIGNED]) {
                eventType
                entity
            }
        }
    `;

    constructor(private apollo: Apollo) {
        this.apollo
            .watchQuery({
                query: gql`
                    {
                        hello
                    }
                `,
            })
            .valueChanges.subscribe(({ data }) => {
                // console.log('hello query', data);
            });
    }
    ngOnInit() {
        this.listen();
    }

    listen() {
        this.apollo
            .subscribe({ query: this.subscriptionQuery })
            .pipe(
                map((events: any) => {
                    return events.data.engineEvents;
                })
            )
            .subscribe((result) => {
                this.notifications = [].concat(result);
            });
    }

    getNotificationCount(): any {
        return this.notifications.length ? this.notifications.length : '';
    }

    getMessage(notification: any) {
        let name = '';
        switch (notification.eventType) {
            case 'TASK_ASSIGNED': {
                name = `${notification.entity.name} task has been assigned to ${notification.entity.assignee}`;
                break;
            }
            case 'TASK_CREATED': {
                name = `${notification.entity.name} task has been created`;
                break;
            }
            case 'PROCESS_STARTED': {
                name = `${notification.entity.name} process has been started`;
                break;
            }
            case 'TASK_UPDATED': {
                name = `${notification.entity.name} task details has been updated`;
                break;
            }
            default: {
                name = 'No notifications';
                break;
            }
        }

        return name;
    }
}
