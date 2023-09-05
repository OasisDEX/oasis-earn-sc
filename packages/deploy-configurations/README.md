# @oasisdex/deploy-configurations

## Deployment configurations

See configs directory. There are primary mainnet and testnet configs. There are also test deployment configs for use 
by tests only. These are housed in /configs/test.

Please review these configs before proceeding with a deployment to see what contracts are marked for deployment or
redeployment.

## Operation (DMA) definitions
Are defined in the `operation-definitions` directory. These are used to define the operations that are to be executed
by the OperationExecutor in DMA.

By giving a definition the log field and marking it as true you'll be able to log out the definition in the format
expected by the OperationRegistry when adding new operations.

This is stop gap whilst we have issues with GnosisSafe client.

## AaveLike addresses

Protocol system contracts are named slightly differently across Aave V2, Aave V3 and Spark protocol.
To simplify our lives so the same addresses can be passed to the library via the FE, we have opted to standardise these names across protocols.

Our standardised names are as follows:
`Oracle` is equivalent to contracts named `PriceOracle | AaveOracle | Oracle`
`LendingPool` is equivalent to contracts named `LendingPool | Pool` 
`PoolDataProvider` is equivalent to contracts named `ProtocolDataProvider`