const fs = require("fs");

const network = process.argv.slice(2)[0];

const projectTokens = JSON.parse(
  fs.readFileSync(`config/${network}.json`)
).projectTokens.filter((token) => token.address); // Only use tokens with address

// Write ERC20 handlers
fs.writeFileSync(
  `src/mappings/projectTokens.ts`,
  `import { BigInt } from "@graphprotocol/graph-ts";
import { Transfer } from "../../generated/templates/TreasuryToken/ERC20";
import { handleProjectERC20Transfer } from "./erc20";

export const indexedProjectERC20s: string[] = [${projectTokens
    .map((token) => `"${token.projectId}"`)
    .join(", ")}]

${projectTokens
  .map(
    (token) =>
      `export function handle${token.name}Transfer(event: Transfer): void {
  handleProjectERC20Transfer(BigInt.fromString("${token.projectId}"), event);
}`
  )
  .join("\n \n")}`
);
