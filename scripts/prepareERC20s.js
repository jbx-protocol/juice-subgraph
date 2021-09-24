const fs = require("fs");

const network = process.argv.slice(2)[0];

const { projectTokens } = JSON.parse(fs.readFileSync(`config/${network}.json`));

// Write ERC20 handlers
fs.writeFileSync(
  `src/ERC20Tokens.ts`,
  `import { BigInt } from "@graphprotocol/graph-ts";
import { TransferEvent } from "./types";
import { handleERC20Transfer } from "./utils";

${projectTokens
  .filter((token) => token.address) // Only add handler for config with address
  .map(
    (token) =>
      `export function handle${token.name}Transfer(event: TransferEvent): void {
  handleERC20Transfer(new BigInt(${token.projectId}), event);
}`
  )
  .join("\n \n")}`
);

// Write trackTokensForProjectIds
fs.writeFileSync(
  `src/trackTokensForProjectIds.ts`,
  `export const trackTokensForProjectIds: number[] = [${projectTokens.map(
    (token) => token.projectId
  )}];`
);
