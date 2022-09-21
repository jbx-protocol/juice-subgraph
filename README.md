# Juicebox Subgraph

## Overview

[Peel](https://discord.gg/b4rpjgGPHX) maintains multiple subgraphs for the Juicebox protocol. These subgraphs live in a Graph Studio owned by the [Peel Gnosis safe](https://gnosis-safe.io/app/eth:0x0e9D15e28e3De9bB3CF64FFbC2f2F49Da9Ac545B).

Juicebox mainnet subgraph is published here: https://thegraph.com/explorer/subgraph?id=FVmuv3TndQDNd2BWARV8Y27yuKKukryKXPzvAS5E7htC&view=Overview

Contract addresses and startBlocks are defined in `config/<network>.json`

Subgraph data sources (contract definitions and event handlers) are defined in `subgraph.template.yaml`

_`subgraph.yaml` is gitignored and should not be edited._

## Getting started

1. Install TheGraph's CLI globally.

   ```bash
   yarn global add @graphprotocol/graph-cli
   ```

1. Install the `juice-subgraph` dependencies.

   ```bash
   yarn install
   ```

## Deploy a new subgraph version

To deploy a new subgraph version, complete the following steps:

1. Prepare the subgraph for the intended network:

   ```bash
   yarn prep <network-name> # mainnet, rinkeby
   ```

   This command performs the following:

   - Compiles new gitignored `subgraph.yaml` from `subgraph.template.yaml`, using data defined in `config/<network>.json`.
   - Generates TS types for the schema defined in `schema.graphql`.
   - Checks for missing event handler references. Will error if a handler function has been written in a mapping file, but not referenced in the subgraph.template.yaml.

2. Authenticate with the proper deploy key for the given network (you'll only need to do this once):

   ```bash
   graph auth --studio ${your-key}
   ```

3. Deploy the subgraph:

   ```bash
   graph deploy --studio <subgraph-name>
   ```

> Note: previous subgraph versions will be automatically archived when new versions are deployed, and must be manually unarchived if needed.

### Check the health of a deployed subgraph

To check health of a deployed subgraph, run the following `curl` command:

```
curl -X POST -d '{ "query": "{indexingStatuses(subgraphs: [\"<deployment-id>\"]) {synced health fatalError {message block { number } handler } subgraph chains { chainHeadBlock { number } latestBlock { number }}}}"}' https://api.thegraph.com/index-node/graphql
```
