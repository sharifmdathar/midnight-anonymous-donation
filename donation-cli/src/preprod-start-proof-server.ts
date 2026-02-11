// This file is part of anonymous-donation.
// Copyright (C) 2025 Midnight Foundation
// SPDX-License-Identifier: Apache-2.0
// Licensed under the Apache License, Version 2.0 (the "License");
// You may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import { createLogger } from './logger-utils.js';
import { currentDir, PreprodConfig } from './config.js';
import path from 'node:path';
import util from 'node:util';

function safeStr(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (err == null) return 'null/undefined';
  try {
    return String(err);
  } catch {
    return Object.prototype.toString.call(err);
  }
}

function safeInspect(err: unknown): string {
  try {
    return util.inspect(err, { depth: 5, breakLength: 80 });
  } catch {
    return Object.prototype.toString.call(err);
  }
}

async function main() {
  try {
    const { DockerComposeEnvironment, Wait } = await import('testcontainers');
    const { run } = await import('./cli.js');

    const config = new PreprodConfig();
    const dockerEnv = new DockerComposeEnvironment(path.resolve(currentDir, '..'), 'proof-server.yml')
      .withWaitStrategy(
        'proof-server',
        Wait.forListeningPorts().withStartupTimeout(120_000),
      );
    const logger = await createLogger(config.logDir);
    await run(config, logger, dockerEnv);
  } catch (err) {
    const msg = safeStr(err);
    const stack = err instanceof Error ? err.stack : undefined;
    process.stderr.write('Fatal error: ' + msg + '\n');
    if (stack) process.stderr.write(stack + '\n');
    process.stderr.write('Error value: ' + safeInspect(err) + '\n');
    process.exit(1);
  }
}

main();
