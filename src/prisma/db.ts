import "dotenv/config"
import postgres from "@prisma/orm-postgres/runtime"
import { normalizeDatabaseUrl } from "@/lib/database-url"
import type { Contract } from "./contract.d"
import contractJson from "./contract.json" with { type: "json" }

type Db = ReturnType<typeof createDb>

function createDb() {
  return postgres<Contract>({
    contractJson,
    url: normalizeDatabaseUrl(process.env["DATABASE_URL"]!),
  })
}

/** Storage hash of the contract used to build the cached client. */
function contractStorageHash(json: typeof contractJson): string {
  const storage = (json as { storage?: { storageHash?: string } }).storage
  return typeof storage?.storageHash === "string" ? storage.storageHash : ""
}

const globalForPrisma = globalThis as typeof globalThis & {
  prisma?: Db
  prismaContractHash?: string
}

const currentHash = contractStorageHash(contractJson)
const cachedHash = globalForPrisma.prismaContractHash

// Recreate when the contract changes (e.g. after adding TaskRun) so the
// HMR-persisted singleton does not keep a stale model surface.
if (
  process.env.NODE_ENV !== "production" &&
  globalForPrisma.prisma &&
  cachedHash !== currentHash
) {
  void globalForPrisma.prisma.close().catch(() => {})
  globalForPrisma.prisma = undefined
  globalForPrisma.prismaContractHash = undefined
}

export const db = globalForPrisma.prisma ?? createDb()

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db
  globalForPrisma.prismaContractHash = currentHash
}
