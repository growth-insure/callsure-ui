const { spawnSync } = require("child_process");
const path = require("path");

const localNode = path.resolve(
  __dirname,
  "..",
  "node_modules",
  "node",
  "bin",
  process.platform === "win32" ? "node.exe" : "node"
);

const nextCli = path.resolve(
  __dirname,
  "..",
  "node_modules",
  "next",
  "dist",
  "bin",
  "next"
);

const args = process.argv.slice(2);
const result = spawnSync(localNode, [nextCli, ...args], { stdio: "inherit" });

if (result.error) {
  console.error(result.error.message);
  process.exit(1);
}

process.exit(result.status ?? 1);
