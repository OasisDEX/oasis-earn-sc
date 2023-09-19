# @oasisdex/dma-contracts

## Deploying contracts

Decide which network you want to deploy to. The following networks are supported:

- `local` - local hardhat node
- `mainnet` - mainnet
- `goerli` - goerli testnet
- `optimism` - optimism mainnet
- `arbitrum` - arbitrum mainnet

Then run the following command:

```bash
yarn hardhat run scripts/deployment/deploy-<network-name>.ts --network <network-name>
```

If the network is a protected network you will be asked to confirm the action.

Finally, please review the configs in @oasisdex/deploy-configurations to see which contracts have
the deploy flag set to `true`. Only contracts with the deploy flag set to `true` will be deployed.

For more info see the deployment configs [readme](../deploy-configurations/README.md).

After deployment, the addresses of the deployed contracts will be saved directly in the deployment
configs.

## Add Operation Definitions to OperationRegistry

Currently, the GnosisSafe integration is not working so additions are manual.

To assist this process you can log out the Operation Definition using the logOp helper in
`scripts/deployment/deploy.ts`

Here are the steps to log out Operation Definitions to console:

- Find the appropriate config for the network you're deploying for
- Mark both ServiceRegistry and OperationsRegistry for deployment (deploy: true)
- Ensure that the log flag is set to true for each OpDefinition you want to log out
- Ensure that your chosen script has a function call such as `await ds.addOperationEntries()` and
  it's not commented out
- Run the script against a local node eg `yarn hardhat run scripts/deployment/deploy-mainnet.ts`
  (without network specified which will default to Hardhat)
- When run locally the addOperationEntries script will update network to use the network fork (in
  this case mainnet)

## Symlink contracts before Using @dma-contracts

You need to create a symlink, to include `ajna-contracts` in `dma-contracts` for proper solc
compilation.

```bash
/oasis-earn-sc/packages/dma-contracts$ ln -s ~/absolute_path_to_the_repository/oasis-earn-sc/packages/ajna-contracts/contracts/ajna ./contracts/
```

You can also run the following script to create the symlink from the project root

```
yarn symlink
```

## Circular dependencies

Some HH Tasks in @dma-contracts depend on the library. A special script has been created to run
these tasks

```bash
yarn hardhat run scripts/run-dependent-task.ts --network local
```

Please do not import tasks that are dependent on @dma-library into hardhat.config.ts

## Verify deployments and Operations

Two tasks have been included to verify deployments and operations. They are still in beta but they
can be useful to verify the current deployments and also to understand which actions and operations
are missing in some of the L2s.

```bash
$ yarn hardhat run scripts/verify-deployments.ts --network <network>
```

It will verify the addresses of the given network, make sure that the `ServiceRegistry` is deployed
and that the addresses in the deploy configurations match the ones in the `ServiceRegistry`.

```bash
$ yarn hardhat run scripts/verify-operations.ts --network <network>
```

It will make sure that the operations definitions are the same in the `OperationsRegistry`. If there
is no definition, it will try to get which actions are still missing for the specific operation to
be enabled.

The new tasks are making use of Typechain. This has the drawback that the very first compilation
will fail if the `@typechain` directory is not present. There is a supposed workaround by issuing
the following command:

```bash
$ TS_NODE_TRANSPILE_ONLY=1 npx hardhat compile
```

but it is not working. If you need to compile the contracts, you may need to comment out the
inclusion of the tools in the `hardhat.config.ts` file:

```typescript
//import './tasks/verify-deployment'
//import './tasks/verify-operations'
```
