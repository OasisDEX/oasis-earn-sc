# @oasisdex/dma-contracts

## Run Before Using @dma-contracts
You need to create a symlink, to include `ajna-contracts` in `dma-contracts` for proper solc compilation.
```bash
/oasis-earn-sc/packages/dma-contracts$ ln -s ~/absolute_path_to_the_repository/oasis-earn-sc/packages/ajna-contracts/contracts/ajna ./contracts/
```

## Circular dependencies

Some HH Tasks in @dma-contracts depend on the library.
A special script has been created to run these tasks
```bash
yarn hardhat run scripts/run-dependent-task.ts --network local
```

Please do not import tasks that are dependent on @dma-library into hardhat.config.ts
```