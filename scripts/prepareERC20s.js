const fs = require("fs");

const network = process.argv.slice(2)[0];

const erc20s = JSON.parse(
  fs.readFileSync(`config/${network}.json`)
).erc20s.sort((a, b) => (a.projectId < b.projectId ? -1 : 1));

if (!fs.existsSync("src/erc20")) fs.mkdirSync("src/erc20");

// Write ERC20 handlers
fs.writeFileSync(
  `src/erc20/v1.x/mapping.ts`,
  erc20s?.length
    ? `import { BigInt } from "@graphprotocol/graph-ts";
import { Transfer } from "../../../generated/templates/ERC20/ERC20";
import { handleProjectERC20Transfer } from "../../utils";

${erc20s
  .map(
    (token) =>
      `export function handle${token.symbol}${token.projectId}Transfer(event: Transfer): void {
  handleProjectERC20Transfer(BigInt.fromString("${token.projectId}"), event);
}`
  )
  .join("\n \n")}`
    : ""
);

// Write ERC20 indexed list
fs.writeFileSync(
  `src/erc20/v1.x/indexedERC20s.ts`,
  `export const indexedERC20s: string[] = [${erc20s
    .map((token) => `"${token.projectId}"`)
    .join(", ")}]`
);
