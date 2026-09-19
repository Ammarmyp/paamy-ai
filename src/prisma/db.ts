import "dotenv/config";
import postgres from "@prisma/orm-postgres/runtime";
import type { Contract } from "./contract.d";
import contractJson from "./contract.json" with { type: "json" };

function createDb() {
  return postgres<Contract>({
    contractJson,
    url: process.env["DATABASE_URL"]!,
  });
}

const globalForPrisma = globalThis as typeof globalThis & {
  prisma?: ReturnType<typeof createDb>;
};

export const db = globalForPrisma.prisma ?? createDb();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
