const fs = require("fs");

const network = process.argv.slice(2)[0];

const { projectTokens } = JSON.parse(fs.readFileSync(`config/${network}.json`));

// Write ERC20 handlers
fs.writeFileSync(
  `src/mappings/projectTokens.ts`,
  `import { BigInt } from "@graphprotocol/graph-ts";
import { Transfer } from "../../generated/templates/TreasuryToken/ERC20";
import { handleProjectERC20Transfer } from "./erc20";

${projectTokens
  .filter((token) => token.address) // Only add handler for config with address
  .map(
    (token) =>
      `export function handle${token.name}Transfer(event: Transfer): void {
  handleProjectERC20Transfer(new BigInt(${token.projectId}), event);
}`
  )
  .join("\n \n")}`
);
