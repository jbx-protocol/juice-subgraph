const fs = require("fs");
const jsyaml = require("js-yaml");

console.log("Checking for missing references to mappings...");

let mappings = {};

function recursiveReadDirSync(dir) {
  const items = fs.readdirSync(dir);
  items.forEach((x) => {
    const path = dir + "/" + x;
    x.endsWith(".ts")
      ? (mappings[path] = fs.readFileSync(path).toString())
      : recursiveReadDirSync(path);
  });
}

recursiveReadDirSync("./src/mappings");

const subgraph = fs.readFileSync("subgraph.yaml").toString();

const tofind = "\nexport function";
const mappingHandlers = {};

// Map names of all handlers in mapping file to file path
Object.keys(mappings).forEach((key) => {
  // Indexes of all instances of "export function"
  const indexes = [...mappings[key].matchAll(new RegExp(tofind, "g"))].map(
    (x) => x.index
  );

  mappingHandlers[key] = indexes.map((i) => {
    const startIndex = i + tofind.length + 1;
    return mappings[key].substring(startIndex, startIndex + 50).split("(")[0];
  });
});

const sources = [
  ...jsyaml.load(subgraph)["dataSources"],
  ...jsyaml.load(subgraph)["templates"],
];

Object.keys(mappingHandlers).forEach((key) => {
  process.stdout.write(`Checking ${key}...`);

  const src = sources.find((d) => d.mapping.file === key);

  const handlerNames = [];

  src.mapping.eventHandlers.forEach((h) => handlerNames.push(h.handler));

  const missingHandlers = [];

  mappingHandlers[key].forEach((h) => {
    if (!handlerNames.includes(h)) missingHandlers.push(h);
  });

  if (missingHandlers.length) {
    missingHandlers.forEach((x) =>
      process.stdout.write(
        `\n 🛑 Missing reference in subgraph template to "${key}": ${x}\n`
      )
    );
  } else {
    process.stdout.write(` ✅ \n`);
  }
});
