import { execFileSync } from "node:child_process";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";

export default function globalSetup() {
  const dataDirectory = path.join(process.cwd(), "prisma", "data");
  for (const suffix of ["", "-journal", "-shm", "-wal"]) {
    rmSync(path.join(dataDirectory, `e2e.db${suffix}`), { force: true });
  }
  mkdirSync(dataDirectory, { recursive: true });
  writeFileSync(path.join(dataDirectory, "e2e.db"), "");

  execFileSync(path.join(process.cwd(), "node_modules", ".bin", "prisma"), ["migrate", "deploy"], {
    cwd: process.cwd(),
    env: { ...process.env, DATABASE_URL: "file:./data/e2e.db" },
    stdio: "inherit",
  });
}
