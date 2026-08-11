import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const dbPath = path.join(process.cwd(), "prisma", "runtime-template.db");
if (fs.existsSync(dbPath)) fs.unlinkSync(dbPath);
// Prisma SQLite는 상대 file: 경로를 스키마 위치 기준으로도 해석하므로 절대 경로 사용
const url = `file:${dbPath.replace(/\\/g, "/")}`;
const env = { ...process.env, DATABASE_URL: url };

console.log("[prepare-runtime-db]", url);
execSync("npx prisma migrate deploy", { stdio: "inherit", env });
execSync("npx tsx prisma/seed.ts", { stdio: "inherit", env });
console.log("[prepare-runtime-db] ready", dbPath);
