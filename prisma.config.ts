import 'dotenv/config'
import { definePrismaConfig } from '@prisma/cli-engine'
import { defineConfig as ormConfig } from '@prisma/orm-postgres/config'
import { normalizeDatabaseUrl } from './src/lib/database-url'

export default definePrismaConfig({
  orm: ormConfig({
    contract: "./src/prisma/contract.prisma",
    db: {
      connection: normalizeDatabaseUrl(process.env['DATABASE_URL']!),
    },
  }),
})
