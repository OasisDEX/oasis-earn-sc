# @oasisdex/deploy-configurations

## Deployment configurations

See configs directory. There are primary mainnet and testnet configs. There are also test deployment configs for use 
by tests only. These are housed in /configs/test.

Please review these configs before proceeding with a deployment to see what contracts are marked for deployment or
redeployment.

## AaveLike addresses

Protocol system contracts are named slightly differently across Aave V2, Aave V3 and Spark protocol.
To simplify our lives so the same addresses can be passed to the library via the FE, we have opted to standardise these names across protocols.

Our standardised names are as follows:
`Oracle` is equivalent to contracts named `PriceOracle | AaveOracle | Oracle`
`LendingPool` is equivalent to contracts named `LendingPool | Pool` 
`PoolDataProvider` is equivalent to contracts named `ProtocolDataProvider`