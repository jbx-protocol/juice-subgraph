# Juicebox Subgraph

## Overview

Multiple subgraphs are maintained by [Peel](https://discord.gg/b4rpjgGPHX) in a Graph Studio owned by the [Peel Gnosis safe](https://gnosis-safe.io/app/eth:0x0e9D15e28e3De9bB3CF64FFbC2f2F49Da9Ac545B).

Juicebox mainnet subgraph is published here: https://thegraph.com/explorer/subgraph?id=FVmuv3TndQDNd2BWARV8Y27yuKKukryKXPzvAS5E7htC&view=Overview

Contract addresses and startBlocks are defined in `config/<network>.json`

Subgraph data sources (contract definitions and event handlers) are defined in `subgraph.template.yaml`

*`subgraph.yaml` is gitignored and should not be edited.*

## Getting started

```bash
yarn install

yarn global add @graphprotocol/graph-cli
```

## Config

`config/*.json` files define addresses and start blocks for contracts on specific networks. Usually, a contract's start block should be the block where that contract was deployed.

## Generating subgraph.yaml

Subgraphs are defined by a `subgraph.yaml` file, which is generated from `*.template.yaml` files. To make it easier to support multiple contract versions, there is a template file for each version as well as "shared".

Running `yarn prep <network>` will run `scripts/prepare.js` to construct a `subgraph.yaml` file for that network, using yaml template files and the contracts defined in `config/<network>.json`. 

The `prepare.js` script also performs a safety check for mismatches between the generated `subgraph.yaml` and the mapping files. Warnings will be shown if:
- a function is referenced in the `subgraph.yaml` that isn't defined in any mapping files
- a function defined in a mapping file isn't referenced in the `subgraph.yaml`

## Grafting

[Grafting](https://thegraph.com/docs/en/developing/creating-a-subgraph/#grafting-onto-existing-subgraphs) allows a new subgraph to use data from a pre-indexed subgraph version up to a specific block height, requiring less time for the new subgraph to index. 

A grafting configuration can be defined with an optional `graft` property in `config/<network>.json`, like:
```
"graft": {
  "base": "<subgraph-id>", # Qm...
  "startBlock": <block-number> # 123...
},
```

> Note: Grafting is only supported on the hosted service and cannot be used in a subgraph deployed on the decentralized network

## Deploying

To deploy a new subgraph version, first prepare the subgraph for the intended network:

```bash
yarn prep <network-name> # mainnet, goerli
```

- Generates TS types for the schema defined in `schema.graphql`
- Compiles new gitignored `subgraph.yaml`

First you will need to authenticate with the proper deploy key for the given network (you'll only need to do this once).

```bash
graph auth --studio ${your-key}
```
Once authenticated:

```bash
graph deploy --studio <subgraph-name>
```

> Note: previous subgraph versions will be automatically archived when new versions are deployed, and must be manually unarchived if needed.

To check health of a deployed subgraph: 

```
curl -X POST -d '{ "query": "{indexingStatuses(subgraphs: [\"<deployment-id>\"]) {synced health fatalError {message block { number } handler } subgraph chains { chainHeadBlock { number } latestBlock { number }}}}"}' https://api.thegraph.com/index-node/graphql
```
