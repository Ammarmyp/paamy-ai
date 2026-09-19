#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/59626a603c1362eb56b57ffb44284006acbff0e08044c4ef5463cc932fb60de4/contract';
import endContract from '../../snapshots/59626a603c1362eb56b57ffb44284006acbff0e08044c4ef5463cc932fb60de4/contract.json' with { type: 'json' };
import {
  Migration,
  MigrationCLI,
  checkExpression,
  col,
  fn,
  lit,
  primaryKey,
} from '@prisma/orm-postgres/migration';

export default class M extends Migration<never, End> {
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.createSchema({ schema: 'public' }),
      this.createTable({
        schema: 'public',
        table: 'project',
        columns: [
          col('canvasJsonPath', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('description', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('name', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('ownerId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('status', 'text', {
            notNull: true,
            default: lit('DRAFT'),
            codecRef: { codecId: 'pg/text@1' },
          }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression('project_status_check_bee39d02', "\"status\" IN ('DRAFT', 'ARCHIVED')"),
        ],
      }),
      this.createTable({
        schema: 'public',
        table: 'projectCollaborator',
        columns: [
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('email', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('projectId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.addUnique({
        schema: 'public',
        table: 'projectCollaborator',
        constraint: 'projectCollaborator_projectId_email_key',
        columns: ['projectId', 'email'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'project',
        index: 'project_createdAt_idx_9575dbd7',
        columns: ['createdAt'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'project',
        index: 'project_ownerId_idx_e2d0c1ef',
        columns: ['ownerId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'projectCollaborator',
        index: 'projectCollaborator_email_idx_46df9cad',
        columns: ['email'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'projectCollaborator',
        index: 'projectCollaborator_projectId_createdAt_idx_d2d6484f',
        columns: ['projectId', 'createdAt'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'projectCollaborator',
        index: 'projectCollaborator_projectId_idx_a96e4d92',
        columns: ['projectId'],
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'projectCollaborator',
        foreignKey: {
          name: 'projectCollaborator_projectId_fkey',
          columns: ['projectId'],
          references: { schema: 'public', table: 'project', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
