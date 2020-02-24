/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {
  BuildEvent,
  Builder,
  BuilderConfiguration,
  BuilderContext
} from '@angular-devkit/architect';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import * as browserSync from 'browser-sync'

export interface BuildWebpackServerSchema {
  browserTarget: string;
  port: number;
  open: boolean;
  watch: boolean;
  logLevel: string;
}

export class ServerBuilder implements Builder<BuildWebpackServerSchema> {

  constructor(public context: BuilderContext) { }
  run(builderConfig: BuilderConfiguration<BuildWebpackServerSchema>): Observable<BuildEvent> {

    const options = builderConfig.options;

    // TODO: verify using of(null) to kickstart things is a pattern.
    return of({ success: true }).pipe(
      tap(async() => {
        const outputPath = 'dist';
        browserSync.init({
          port: options.port,
          server: options.browserTarget,
          watch: false,
          open: options.open
        });
        this.context.logger.info(`lite-serve serving folder ${outputPath} on port ${options.port}`);
      })
    );
  }
}

export default LiteServeBuilder;
