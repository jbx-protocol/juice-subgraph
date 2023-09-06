const chalk = require("chalk");
const fs = require("fs");
const jsyaml = require("js-yaml");
const mustache = require("mustache");
const graph = require("@graphprotocol/graph-cli/src/cli");

const PREFIXES = ["v1", "v2", "v3", "shared"];

const network = process.argv.slice(2)[0];

const { stdout, exit } = process;

if (!network) {
  stdout.write(chalk.red("Network undefined\n"));
  exit(1);
}

stdout.write(`Network: ${chalk.cyan.bold(network)}\n`);

const configTemplatePath = `config/template.json`;
const configTemplate = JSON.parse(fs.readFileSync(configTemplatePath));

const graftConfigPath = `config/graft.${network}.json`;

const config = JSON.parse(fs.readFileSync(`config/${network}.json`));

if (!config) {
  stdout.write(chalk.red("Missing config file\n"));
  exit(1);
}

// Clear /generated and /build folder
fs.rm("build", { force: true, recursive: true }, () => null);
fs.rm("generated", { force: true, recursive: true }, () => null);

function writeFilesFromTemplate() {
  const addressesPath = "src/contractAddresses.ts";
  const startBlocksPath = "src/startBlocks.ts";

  // Delete files if exists
  fs.rmSync(addressesPath, { force: true });
  fs.rmSync(startBlocksPath, { force: true });

  let addressesFileContents = "";
  let startBlocksFileContents = "";

  let templateContractsCount = 0;
  let configContractsCount = 0;

  stdout.write(`\nUsing contracts in ${configTemplatePath}...\n`);

  for (const p of PREFIXES) {
    // Iterate over all var names declared in config template
    // Add to fileContents using values from actual config
    const contractNames = configTemplate[p];

    contractNames.forEach((c) => {
      const contract = config[p] && config[p][c] ? config[p][c] : undefined;

      stdout.write(chalk.gray(`  ${p}_${c}...`));

      templateContractsCount++;

      if (!contract) {
        stdout.write(chalk.yellow(" No config\n"));
      } else {
        configContractsCount++;
        stdout.write(" OK\n");
      }

      const address =
        contract && contract.address ? `"${contract.address}"` : null;
      const startBlock =
        contract && contract.startBlock ? contract.startBlock : 0;

      addressesFileContents += `export const address_${p}_${c}: string | null = ${address};\n`;
      startBlocksFileContents += `export const startBlock_${p}_${c}: number = ${startBlock};\n`;
    });
  }

  stdout.write(
    chalk[configContractsCount < templateContractsCount ? "yellow" : "green"](
      `Found config for ${configContractsCount}/${templateContractsCount} contracts in template\n`
    )
  );

  // Write addressesFileContents to file
  try {
    fs.writeFileSync(addressesPath, addressesFileContents);
    stdout.write(chalk.green("✔") + ` Wrote ${addressesPath}\n`);
  } catch (e) {
    stdout.write("Error writing" + addressesPath, e);
  }

  // Write startBlocksFileContents to file
  try {
    fs.writeFileSync(startBlocksPath, startBlocksFileContents);
    stdout.write(chalk.green("✔") + ` Wrote ${startBlocksPath}\n`);
  } catch (e) {
    stdout.write("Error writing" + startBlocksPath, e);
  }
}

// Write subgraph.yaml file from config
function writeSubgraph() {
  stdout.write(`\nWriting subgraph.yaml from dataSource snippets...\n`);

  const subgraphPath = "subgraph.yaml";

  // Delete subgraph.yaml if exists
  fs.rmSync(subgraphPath, { force: true });

  // Build dataSource snippets from configs
  // We give this to subgraph.template.yaml to render subgraph.yaml
  const dataSourceSnippets = {};
  for (const p of PREFIXES) {
    stdout.write(chalk.gray(`  ${p}...\n`));

    dataSourceSnippets[`dataSources_${p}`] = mustache
      .render(fs.readFileSync(`${p}.template.yaml`).toString(), config)
      .toString();
  }

  let graftConfig;
  try {
    const _graftConfig = JSON.parse(fs.readFileSync(graftConfigPath));

    if (_graftConfig) {
      if (_graftConfig.skip === true) {
        stdout.write(chalk.cyan.bold(`Skipping graft config\n`));
      } else {
        graftConfig = _graftConfig;
        stdout.write(
          chalk.cyan.bold(`Grafting: ${JSON.stringify(graftConfig)}\n`)
        );
      }
    }
  } catch (_) {
    stdout.write(`No grafting config found\n`);
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
    stdout.write(chalk.red("Error writing subgraph.yaml"), e, "\n");
  }

  stdout.write(chalk.green("✔") + " Wrote subgraph.yaml\n");
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

  stdout.write(
    `\nSafety checking that functions defined in mapping files are referenced in subgraph.yaml...\n`
  );

  let missingHandlersCount = 0;
  let missingSourcesCount = 0;

  Object.keys(mappingHandlers).forEach((key) => {
    stdout.write(chalk.gray(`  ${key}...`));

    const src = subgraphYamlContents.find((d) => d.mapping.file === key);

    if (!src) {
      // Mapping file is not referenced in the generated in the subgraph.yaml
      stdout.write(chalk.yellow(` No reference\n`));

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
        stdout.write(chalk.yellow(`\nNo reference to "${x}"\n`))
      );

      missingHandlersCount++;
    } else {
      stdout.write(" OK\n");
    }
  });

  if (missingHandlersCount) {
    stdout.write(
      chalk.yellow(
        `WARNING: ${missingHandlersCount} missing handler functions.`
      ) +
        " Some handler functions defined in mapping files have no reference in the subgraph.yaml.\n\n"
    );
  }

  if (missingSourcesCount) {
    stdout.write(
      chalk.yellow(`WARNING: ${missingSourcesCount} missing mapping files.`) +
        " Some mapping files have no reference in the subgraph.yaml.\n\n"
    );
  }

  if (!missingHandlersCount && !missingSourcesCount) {
    stdout.write(chalk.green("✔") + " All good\n\n");
  }
}

writeFilesFromTemplate();

writeSubgraph();

checkHandlers();

graph.run("codegen");
