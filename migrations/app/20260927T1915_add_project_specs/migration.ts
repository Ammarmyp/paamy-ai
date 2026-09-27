#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/47b4cfdd5c8fec3df33f2e3b3f4d22bdc9f7ac596d8f1e9db358987f9da46896/contract';
import startContract from '../../snapshots/47b4cfdd5c8fec3df33f2e3b3f4d22bdc9f7ac596d8f1e9db358987f9da46896/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/6e0c2c49aa43f6dcea6563eb95dcb60b6a4c49129c3a9f4bf56d969390745e62/contract';
import endContract from '../../snapshots/6e0c2c49aa43f6dcea6563eb95dcb60b6a4c49129c3a9f4bf56d969390745e62/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, fn, primaryKey } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.createTable({
        schema: 'public',
        table: 'projectSpec',
        columns: [
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('filePath', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('projectId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createIndex({
        schema: 'public',
        table: 'projectSpec',
        index: 'projectSpec_projectId_createdAt_idx_d2d6484f',
        columns: ['projectId', 'createdAt'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'projectSpec',
        index: 'projectSpec_projectId_idx_a96e4d92',
        columns: ['projectId'],
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'projectSpec',
        foreignKey: {
          name: 'projectSpec_projectId_fkey',
          columns: ['projectId'],
          references: { schema: 'public', table: 'project', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
