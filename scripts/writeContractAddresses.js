const fs = require("fs");

const network = process.argv.slice(2)[0];

const config = JSON.parse(fs.readFileSync(`config/${network}.json`));

// Write ERC20 handlers
fs.writeFileSync(
  `src/contractAddresses.ts`,
  `${Object.keys(config)
    .filter((key) => key.startsWith("address_"))
    .map((key) => `export const ${key} = "${config[key]}";\n`)
    .join("")}
`
);
