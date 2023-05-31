import { System } from '@deploy-configurations/types/deployed-system'
import { Network } from '@deploy-configurations/types/network'
import { createDPMAccount, oneInchCallMock } from '@dma-common/test-utils'
import { RuntimeConfig } from '@dma-common/types/common'
import { DeploymentSystem } from '@dma-contracts/scripts/deployment/deploy'
import { testBlockNumbersForAjna } from '@dma-contracts/test/config'
import { ajnaFactories } from '@dma-contracts/test/fixtures/factories/ajna'
import {
  AjnaPositions,
  EnvWithAjnaPositions,
  GetTokenFn,
  PositionDetails,
  StrategyDependenciesAjna,
} from '@dma-contracts/test/fixtures/types'
import { buildGetTokenByImpersonateFunction } from '@dma-contracts/test/utils/aave'
import { AaveVersion, protocols, strategies } from '@dma-library'
import hre from 'hardhat'
import { HardhatRuntimeEnvironment } from 'hardhat/types'

type SupportedAjnaPositions = Array<{
  name: AjnaPositions
  allowedNetworks?: Array<Network | null>
}>

export function getSupportedAjnaPositions(network?: Network): SupportedAjnaPositions {
  const supportedPositions: SupportedAjnaPositions = [{ name: 'ETH/USDC Multiply' as const }]
  return supportedPositions.filter(s =>
    network ? !s.allowedNetworks || s.allowedNetworks.includes(network) : true,
  )
}

export const envWithAjnaPositions = ({
  network,
  hideLogging,
  systemConfigPath,
  configExtensionPaths,
}: {
  network: Network
  hideLogging?: boolean
  systemConfigPath: string
  configExtensionPaths: string[]
}) =>
  async function fixture(): Promise<EnvWithAjnaPositions> {
    const { ds, config } = await setupDeploymentSystemHelper(
      systemConfigPath,
      configExtensionPaths,
      hideLogging,
    )
    await resetNode(ds, network)
    const dsSystem = await deploySystem(ds)
    const swapAddress = await setupSwapContract(dsSystem)
    const dependencies = await buildDependencies(dsSystem, config)
    const supportedPositions = getSupportedAjnaPositions(network)
    const proxies = await createProxies(dsSystem, supportedPositions.length)
    const utils = gatherUtils(config, hre, network)
    const positions = await createAjnaPositions(proxies, supportedPositions)

    return buildEnv(config, hre, dsSystem, dependencies, positions, utils)
  }

async function setupDeploymentSystemHelper(
  systemConfigPath?: string,
  configExtensionPaths?: string[],
  hideLogging?: boolean,
) {
  const ds = new DeploymentSystem(hre)
  const config: RuntimeConfig = await ds.init(hideLogging)
  await ds.loadConfig(systemConfigPath)
  if (configExtensionPaths) {
    for (const configPath of configExtensionPaths) {
      await ds.extendConfig(configPath)
    }
  }

  return { ds, config }
}

async function resetNode(ds, network) {
  if (network !== Network.MAINNET && network !== Network.OPTIMISM)
    throw new Error('Unsupported network')

  if (testBlockNumbersForAjna[network]) {
    await ds.resetNode(testBlockNumbersForAjna[network])
  }
}

async function deploySystem(ds: DeploymentSystem) {
  await ds.deployAll()
  await ds.addAllEntries()

  return ds.getSystem() as System
}

async function setupSwapContract(dsSystem: System) {
  const swapContract = dsSystem.system.uSwap
    ? dsSystem.system.uSwap.contract
    : dsSystem.system.Swap.contract

  await swapContract.addFeeTier(0)
  await swapContract.addFeeTier(7)
  await dsSystem.system.AccountGuard.contract.setWhitelist(
    dsSystem.system.OperationExecutor.contract.address,
    true,
  )

  return swapContract.address
}

function buildDependencies(dsSystem: System, config: RuntimeConfig) {
  const { config: systemConfig, system } = dsSystem
  const dependencies: StrategyDependenciesAjna = {
    addresses: {
      DAI: systemConfig.common.DAI.address,
      ETH: systemConfig.common.ETH.address,
      USDC: systemConfig.common.USDC.address,
      WETH: systemConfig.common.WETH.address,
      WSTETH: systemConfig.common.WSTETH.address,
      WBTC: systemConfig.common.WBTC.address,
      chainlinkEthUsdPriceFeed: systemConfig.common.ChainlinkPriceOracle_ETHUSD.address,
      aaveOracle: systemConfig.aave.v3.AaveOracle.address,
      pool: systemConfig.aave.v3.Pool.address,
      poolDataProvider: systemConfig.aave.v3.AavePoolDataProvider.address,
      accountFactory: system.AccountFactory.contract.address,
      operationExecutor: system.OperationExecutor.contract.address,
    },
    contracts: {
      operationExecutor: system.OperationExecutor.contract,
    },
    provider: config.provider,
    user: config.address,
    protocol: {
      version: AaveVersion.v3,
      getCurrentPosition: strategies.aave.v3.view,
      getProtocolData: protocols.aave.getAaveProtocolData,
    },
    getSwapData: (marketPrice, precision) => oneInchCallMock(marketPrice, precision),
  }
  return dependencies
}

async function createProxies(dsSystem: System, count: number) {
  const { system } = dsSystem

  const proxies = await Promise.all(
    Array.from(Array(count)).map(async () => {
      const [proxy] = await createDPMAccount(system.AccountFactory.contract)
      return proxy
    }),
  )

  if (proxies.some(p => p === undefined)) {
    throw new Error('Cant create a DPM proxy')
  }

  return proxies.filter((proxy): proxy is string => proxy !== undefined)
}

function gatherUtils(config: RuntimeConfig, hre: HardhatRuntimeEnvironment, network: Network) {
  return {
    sendLotsOfMoney: buildGetTokenByImpersonateFunction(config, hre, network),
  }
}

async function createAjnaPositions(proxies: string[], supportedPositions: SupportedAjnaPositions) {
  const positions = {}
  for (const [idx, position] of supportedPositions.entries()) {
    const factory = ajnaFactories[position.name]
    const proxy = proxies[idx]

    if (!factory) {
      throw new Error(`Unsupported position ${position.name}`)
    }

    positions[position.name] = await factory({
      proxy,
    })
  }

  return positions as Record<AjnaPositions, PositionDetails>

  // console.log(result) // <-- Will be the final result
  // const positions = supportedPositions.reduce(({ name }, idx) => {
  //   const proxy = proxies[idx]
  //
  //   const factory = ajnaFactories[name]
  //   if (!factory) throw new Error(`Unsupported position ${name}`)
  //
  //   const positionDetails = await factory({
  //     proxy,
  //     // proxy,
  //     // isDPM,
  //     // use1inch,
  //     // swapAddress,
  //     // dependencies,
  //     // config,
  //     // feeRecipient: systemConfig.common.FeeRecipient.address,
  //   })
  //
  //   return positionDetails
  // }, {} as Record<AjnaPositions, PositionDetails>)

  // const data = await array.reduce(async (accumP, current, index) => {
  //   const accum = await accumP;
  // }, Promise.resolve(…));
  //
  // // { name: 'ETH-USDC-Multiply', details: {} },
  //
  // return positions

  // const ethUsdcMultiplyPosition = await ethUsdcMultiplyAavePosition({
  //   proxy: dpmProxyForMultiplyEthUsdc,
  //   isDPM: true,
  //   use1inch,
  //   swapAddress,
  //   dependencies,
  //   config,
  //   feeRecipient: systemConfig.common.FeeRecipient.address,
  // })
  //
  // let wstethEthEarnPosition: PositionDetails | undefined
  // /*
  //   Re use1inch: Wsteth lacks sufficient liquidity on uniswap
  //   Re network: wsteth supply cap on optimism reached for now 20/04/23
  //   TODO: Monitor if wstETH optimism & mainnet increase supply cap or update test to modify storage
  // */
  // if (use1inch && network !== Network.OPTIMISM && network !== Network.MAINNET) {
  //   wstethEthEarnPosition = await wstethEthEarnAavePosition({
  //     proxy: dpmProxyForEarnWstEthEth,
  //     isDPM: true,
  //     use1inch,
  //     swapAddress,
  //     dependencies,
  //     config,
  //     feeRecipient: systemConfig.common.FeeRecipient.address,
  //   })
  // }
  //
  // const dsProxyEthUsdcMultiplyPosition = await ethUsdcMultiplyAavePosition({
  //   proxy: dsProxy.address,
  //   isDPM: false,
  //   use1inch,
  //   swapAddress,
  //   dependencies,
  //   config,
  //   feeRecipient: systemConfig.common.FeeRecipient.address,
  // })
}

function buildEnv(
  config: RuntimeConfig,
  hre: HardhatRuntimeEnvironment,
  dsSystem: System,
  dependencies: StrategyDependenciesAjna,
  positions: Record<AjnaPositions, PositionDetails>,
  utils: {
    sendLotsOfMoney: GetTokenFn
  },
): EnvWithAjnaPositions {
  return {
    config,
    hre,
    dsSystem,
    dependencies: dependencies,
    positions,
    utils,
  }
}
