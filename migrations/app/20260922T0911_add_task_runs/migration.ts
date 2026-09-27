#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/47b4cfdd5c8fec3df33f2e3b3f4d22bdc9f7ac596d8f1e9db358987f9da46896/contract';
import endContract from '../../snapshots/47b4cfdd5c8fec3df33f2e3b3f4d22bdc9f7ac596d8f1e9db358987f9da46896/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/59626a603c1362eb56b57ffb44284006acbff0e08044c4ef5463cc932fb60de4/contract';
import startContract from '../../snapshots/59626a603c1362eb56b57ffb44284006acbff0e08044c4ef5463cc932fb60de4/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, fn, primaryKey } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.createTable({
        schema: 'public',
        table: 'taskRun',
        columns: [
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('projectId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('runId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('userId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.addUnique({
        schema: 'public',
        table: 'taskRun',
        constraint: 'taskRun_runId_key',
        columns: ['runId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'taskRun',
        index: 'taskRun_runId_idx_a6016437',
        columns: ['runId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'taskRun',
        index: 'taskRun_userId_projectId_idx_a2a73bc7',
        columns: ['userId', 'projectId'],
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
