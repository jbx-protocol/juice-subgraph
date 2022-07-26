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

## Deploying

To deploy a new subgraph version, first prepare the subgraph for the intended network:

```bash
yarn prepare <network-name> # mainnet, rinkeby
```

- Compiles new gitignored `subgraph.yaml` from `subgraph.template.yaml`, using data defined in `config/<network>.json`
- Generates TS types for the schema defined in `schema.graphql`
- Checks for missing event handler references. Will error if a handler function has been written in a mapping file, but not referenced in the subgraph.template.yaml

First you will need to authenticate with the proper deploy key for the given network (you'll only need to do this once).

```bash
graph auth  --studio ${your-key}
```
Once authenticated:

```bash
graph deploy --studio <subgraph-name>
```

To check health of a deployed subgraph: 

```
curl -X POST -d '{ "query": "{indexingStatuses(subgraphs: [\"<deployment-id>\"]) {synced health fatalError {message block { number } handler } subgraph chains { chainHeadBlock { number } latestBlock { number }}}}"}' https://api.thegraph.com/index-node/graphql
```
