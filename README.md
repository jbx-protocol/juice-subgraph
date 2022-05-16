# Juicebox Subgraph

- Mainnet: https://thegraph.com/explorer/subgraph?id=0x63a2368f4b509438ca90186cb1c15156713d5834-0&view=Overview
- Rinkeby: [unpublished]

### Install

```bash
yarn install
```

### Prepare

```bash
yarn prepare:${network} (mainnet, rinkeby)
```

- Compiles subgraph.yaml from subgraph.template.yaml
- Generates types from schema.graphql
- Checks for missing eventHandler references. `scripts/checkHandlers.js` will warn if a handler function has been written in a mapping file, but not referenced in the subgraph.template.yaml)

### Deploy

First you will need to authenticate with the proper deploy key for the given network. Or you can create your own Subgraph and deploy key for testing:

```bash
graph auth  --studio ${your-key}
```

If you are deploying one of the official Juicebox subgraphs:

```bash
yarn deploy:${network}
```

If you are deploying your own Subgraph for testing:

```bash
graph deploy --node https://api.studio.thegraph.com/deploy/${project}
```

To check health of a deployed subgraph: 

```
curl -X POST -d '{ "query": "{indexingStatuses(subgraphs: [\"<deployment-id>\"]) {synced health fatalError {message block { number } handler } subgraph chains { chainHeadBlock { number } latestBlock { number }}}}"}' https://api.thegraph.com/index-node/graphql
```
