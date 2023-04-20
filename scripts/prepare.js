const chalk = require("chalk");
const fs = require("fs");
const jsyaml = require("js-yaml");
const mustache = require("mustache");
const graph = require("@graphprotocol/graph-cli/src/cli");

const PREFIXES = ["v1", "v2", "v3", "shared"];

const network = process.argv.slice(2)[0];

if (!network) {
  console.log(chalk.red("Network undefined"));
  process.exit(1);
}

console.log(`Network: ${chalk.cyan.bold(network)}\n`);

const configTemplate = JSON.parse(fs.readFileSync(`config/template.json`));

const config = JSON.parse(fs.readFileSync(`config/${network}.json`));

if (!config) {
  console.log(chalk.red("Missing config file"));
  process.exit(1);
}

config.network = network;

// Clear /generated and /build folder
fs.rm("build", { force: true, recursive: true }, () => null);
fs.rm("generated", { force: true, recursive: true }, () => null);

// Write all contract addresses in config to a .ts file
function writeContractAddresses() {
  const contractAddressesPath = "src/contractAddresses.ts";

  // Delete contractAddresses file if exists
  fs.rmSync(contractAddressesPath, { force: true });

  let fileContents = "";

  for (p of PREFIXES) {
    // Iterate over all var names declared in config template
    // Add to fileContents using values from actual config
    const contractNames = configTemplate[p];

    fileContents += `${contractNames
      .map((c) => {
        // Use null if no address exists in config
        const address =
          config[p] && config[p][c] && config[p][c].address
            ? `"${config[p][c].address}"`
            : null;
        return `export const address_${p}_${c}: string | null = ${address};\n`;
      })
      .join("")}\n`;
  }

  // Write fileContents to file
  try {
    fs.writeFileSync(contractAddressesPath, fileContents);
  } catch (e) {
    console.log("Error writing" + contractAddressesPath, e);
  }

  console.log(chalk.green("✔") + ` Wrote ${contractAddressesPath}\n`);
}

// Write all start blocks in config to a .ts file
function writeStartBlocks() {
  const startBlocksPath = "src/startBlocks.ts";

  // Delete startBlocks file if exists
  fs.rmSync(startBlocksPath, { force: true });

  let fileContents = "";

  for (p of PREFIXES) {
    // Iterate over all var names declared in config template
    // Add to fileContents using values from actual config
    const contractNames = configTemplate[p];

    fileContents += `${contractNames
      .map((c) => {
        // Use null if no address exists in config
        const startBlock =
          config[p] && config[p][c] ? `${config[p][c].startBlock || 0}` : 0; // must be 0: `number` cannot be nullable
        return `export const startBlock_${p}_${c}: number = ${startBlock};\n`;
      })
      .join("")}\n`;
  }

  // Write fileContents to file
  try {
    fs.writeFileSync(startBlocksPath, fileContents);
  } catch (e) {
    console.log("Error writing" + startBlocksPath, e);
  }

  console.log(chalk.green("✔") + ` Wrote ${startBlocksPath}\n`);
}

// Write subgraph.yaml file from config
function writeSubgraph() {
  const subgraphPath = "subgraph.yaml";

  // Delete subgraph.yaml if exists
  fs.rmSync(subgraphPath, { force: true });

  // Build dataSource snippets from configs
  // We give this to subgraph.template.yaml to render subgraph.yaml
  const dataSourceSnippets = {};
  for (p of PREFIXES) {
    dataSourceSnippets[`dataSources_${p}`] = mustache
      .render(fs.readFileSync(`${p}.template.yaml`).toString(), config)
      .toString();
  }

  const graftConfig = config.graft
    ? `  - grafting
graft:
  base: ${config.graft.base}
  block: ${config.graft.startBlock}`
    : undefined;

  if (graftConfig) {
    console.log(chalk.cyan.bold("Grafting:"), config.graft);
  }

  // Write new subgraph.yaml
  try {
    fs.writeFileSync(
      subgraphPath,
      mustache
        .render(fs.readFileSync("subgraph.template.yaml").toString(), {
          // subgraph.template.yaml also needs config.network
          network: config.network,
          graftConfig,
          ...dataSourceSnippets,
        })
        .toString()
    );
  } catch (e) {
    console.log(chalk.red("Error writing subgraph.yaml"), e);
  }

  console.log(chalk.green("✔") + " Wrote subgraph.yaml\n");
}

// Sanity check to ensure that all functions exported from mapping files are defined in subgraph.yaml
function checkHandlers() {
  /**
   * First recursively read all mapping .ts files and
   * save their contents by file path
   */

  let mappingFiles = {};

  function recursiveReadDirSync(dir) {
    const items = fs.readdirSync(dir);
    items.forEach((x) => {
      const path = dir + "/" + x;
      x.endsWith(".ts")
        ? (mappingFiles[path] = fs.readFileSync(path).toString())
        : recursiveReadDirSync(path);
    });
  }

  recursiveReadDirSync("./src/mappings");

  const fnKey = "\nexport function";
  const mappingHandlers = {};

  // Iterate over file paths to mapping files
  Object.keys(mappingFiles).forEach((key) => {
    // Indexes of all instances of `fnKey` in mapping file
    const indexes = [...mappingFiles[key].matchAll(new RegExp(fnKey, "g"))].map(
      (x) => x.index
    );

    // Map names of all handler functions in mapping file by file path
    mappingHandlers[key] = indexes.map((i) => {
      const startIndex = i + fnKey.length + 1;
      return mappingFiles[key]
        .substring(startIndex, startIndex + 50)
        .split("(")[0];
    });
  });

  /**
   * Next get all mapping functions referenced in the generated subgraph.yaml
   */

  // Read already generated subgraph.yaml file
  const subgraphYaml = fs.readFileSync("subgraph.yaml").toString();
  // Get only templates and dataSources
  const subgraphYamlContents = [
    ...jsyaml.load(subgraphYaml)["dataSources"],
    ...jsyaml.load(subgraphYaml)["templates"],
  ];

  /**
   * Now we compare all function names found in mapping files
   * to those found in the subgraph.yaml file
   */

  console.log(
    `Checking that functions defined in mapping files are referenced in subgraph.yaml...`
  );

  let missingHandlersCount = 0;
  let missingSourcesCount = 0;

  Object.keys(mappingHandlers).forEach((key) => {
    process.stdout.write(chalk.gray(`  ${key}...`));

    const src = subgraphYamlContents.find((d) => d.mapping.file === key);

    if (!src) {
      // Mapping file is not referenced in the generated in the subgraph.yaml
      console.log(chalk.yellow(` No reference`));

      missingSourcesCount++;
      return;
    }

    // Get array of all function names referenced in eventHandlers and blockHandlers of subgraph.yaml source
    const sourceFnNames = [];
    src.mapping.eventHandlers?.forEach((h) => sourceFnNames.push(h.handler));
    src.mapping.blockHandlers?.forEach((h) => sourceFnNames.push(h.handler));

    // Get list of handler functions not referenced in subgraph.yaml source
    const missingHandlers = [];
    mappingHandlers[key].forEach((fnName) => {
      // Handlers is missing if its function name isn't found in the source's list of handlers
      if (!sourceFnNames.includes(fnName)) missingHandlers.push(fnName);
    });

    // Deliver the news
    if (missingHandlers.length) {
      missingHandlers.forEach((x) =>
        process.stdout.write(chalk.yellow(`\nNo reference to "${x}"\n`))
      );

      missingHandlersCount++;
    } else {
      process.stdout.write(" OK\n");
    }
  });

  if (missingHandlersCount) {
    console.log(
      chalk.yellow(
        `WARNING: ${missingHandlersCount} missing handler functions.`
      ) +
        " Some handler functions defined in mapping files have no reference in the subgraph.yaml."
    );
  }

  if (missingSourcesCount) {
    console.log(
      chalk.yellow(`WARNING: ${missingSourcesCount} missing mapping files.`) +
        " Some mapping files have no reference in the subgraph.yaml.\n"
    );
  }

  if (!missingHandlersCount && !missingSourcesCount) {
    console.log(chalk.green("✔") + " All good\n");
  }
}

writeContractAddresses();

writeStartBlocks();

writeSubgraph();

checkHandlers();

graph.run("codegen");
