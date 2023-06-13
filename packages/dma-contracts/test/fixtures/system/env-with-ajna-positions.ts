import { prepareEnv as prepareAjnaEnv } from '@ajna-contracts/scripts'
import { System } from '@deploy-configurations/types/deployed-system'
import { Network } from '@deploy-configurations/types/network'
import { ONE, TEN } from '@dma-common/constants'
import { createDPMAccount, oneInchCallMock, swapUniswapTokens } from '@dma-common/test-utils'
import { RuntimeConfig } from '@dma-common/types/common'
import { amountToWei } from '@dma-common/utils/common'
import { DeploymentSystem } from '@dma-contracts/scripts/deployment/deploy'
import { testBlockNumbersForAjna } from '@dma-contracts/test/config'
import { ajnaFactories } from '@dma-contracts/test/fixtures/factories/ajna'
import { USDC } from '@dma-contracts/test/fixtures/factories/common'
import {
  AjnaPositionDetails,
  AjnaPositions,
  AjnaSystem,
  EnvWithAjnaPositions,
  StrategyDependenciesAjna,
} from '@dma-contracts/test/fixtures/types'
import { mapAjnaPoolDataTypes } from '@dma-contracts/test/utils/ajna/map-ajna-pool-type'
import { AjnaPool } from '@dma-library/types/ajna/ajna-pool'
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
    const { ds, config } = await setupDmaDeploymentSystemHelper(
      hre,
      systemConfigPath,
      configExtensionPaths,
      hideLogging,
    )
    await resetNode(ds, network)
    const ajnaSystem = await prepareAjnaEnv(hre, true)
    const dmaSystem = await deployDmaSystem(ds, ajnaSystem)
    await configureSwapContract(dmaSystem)
    const dependencies = await buildDependencies(dmaSystem, ajnaSystem, config)
    await getQuoteTokenForPoolSetup(ajnaSystem.users, config, hre, network, dependencies)
    const supportedPositions = getSupportedAjnaPositions(network)
    const proxies = await createProxies(dmaSystem, supportedPositions.length)
    const positions = await createAjnaPositions(
      proxies,
      supportedPositions,
      dependencies,
      dmaSystem,
      ajnaSystem,
      config,
    )

    return buildEnv(config, hre, dmaSystem, ajnaSystem, dependencies, positions)
  }

function checkIfSupportedNetwork(network: Network): network is Network.MAINNET | Network.OPTIMISM {
  if (network !== Network.MAINNET && network !== Network.OPTIMISM)
    throw new Error('Unsupported network')

  return true
}

/** Some tokens cannot be acquired via the storage manipulation, so we to use a swap */
async function getQuoteTokenForPoolSetup(
  users: AjnaSystem['users'],
  config: RuntimeConfig,
  _hre: HardhatRuntimeEnvironment,
  network: Network,
  dependencies: StrategyDependenciesAjna,
) {
  if (!checkIfSupportedNetwork(network)) return

  const usdc = new USDC(dependencies.addresses)

  const lender = users[1]
  const lenderAddress = await lender.signer.getAddress()
  await swapUniswapTokens(
    dependencies.WETH,
    usdc.address,
    amountToWei(TEN.times(TEN)).toFixed(0),
    amountToWei(ONE, usdc.precision).toFixed(0),
    lenderAddress,
    config,
    _hre,
    network,
  )
}

async function setupDmaDeploymentSystemHelper(
  _hre: HardhatRuntimeEnvironment,
  systemConfigPath?: string,
  configExtensionPaths?: string[],
  hideLogging?: boolean,
) {
  const ds = new DeploymentSystem(_hre)
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
  if (!checkIfSupportedNetwork(network)) return
  if (testBlockNumbersForAjna[network]) {
    await ds.resetNode(testBlockNumbersForAjna[network])
  }
}

async function deployDmaSystem(ds: DeploymentSystem, ajnaSystem: AjnaSystem) {
  await ds.deployCore()
  const _ds = updateDmaConfigWithLocalAjnaDeploy(ds, ajnaSystem)
  await _ds.addCommonEntries()
  // We need to add Ajna entries before deploying actions
  // because the actions depend on the Ajna pool info
  await _ds.addAjnaEntries()
  await _ds.deployActions()
  await _ds.addOperationEntries()

  return _ds.getSystem() as System
}

function updateDmaConfigWithLocalAjnaDeploy(ds: DeploymentSystem, ajnaSystem: AjnaSystem) {
  if (!ds.config) throw new Error('No config')
  ds.config.ajna.AjnaPoolInfo.address = ajnaSystem.poolInfo.address
  ds.config.ajna.ERC20PoolFactory.address = ajnaSystem.erc20PoolFactory.address

  return ds
}

async function configureSwapContract(dsSystem: System) {
  const swapContract = dsSystem.system.uSwap
    ? dsSystem.system.uSwap.contract
    : dsSystem.system.Swap.contract

  await swapContract.addFeeTier(0)
  await swapContract.addFeeTier(7)
  await dsSystem.system.AccountGuard.contract.setWhitelist(
    dsSystem.system.OperationExecutor.contract.address,
    true,
  )

  // Not necessary unless using 1inch to complete the swap
  return swapContract.address
}

function buildDependencies(dsSystem: System, ajnaSystem: AjnaSystem, config: RuntimeConfig) {
  const { config: systemConfig, system } = dsSystem

  const dependencies: StrategyDependenciesAjna = {
    provider: config.provider,
    getSwapData: (marketPrice, precision) => oneInchCallMock(marketPrice, precision),
    user: config.address,
    poolInfoAddress: ajnaSystem.poolInfo.address,
    operationExecutor: system.OperationExecutor.contract.address,
    WETH: systemConfig.common.WETH.address,
    getPoolData: mapGetPoolDataFunction(ajnaSystem),
    addresses: {
      DAI: systemConfig.common.DAI.address,
      ETH: systemConfig.common.ETH.address,
      USDC: systemConfig.common.USDC.address,
      WSTETH: systemConfig.common.WSTETH.address,
      WBTC: systemConfig.common.WBTC.address,
    },
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

async function createAjnaPositions(
  proxies: string[],
  supportedPositions: SupportedAjnaPositions,
  dependencies: StrategyDependenciesAjna,
  dsSystem: System,
  ajnaSystem: AjnaSystem,
  config: RuntimeConfig,
) {
  const positions: Partial<Record<AjnaPositions, AjnaPositionDetails>> = {}
  for (const [idx, position] of supportedPositions.entries()) {
    const factory = ajnaFactories[position.name]
    const proxy = proxies[idx]

    if (!factory) {
      throw new Error(`Unsupported position ${position.name}`)
    }

    positions[position.name] = await factory({
      proxy,
      ajnaSystem,
      dependencies: dependencies,
      config: config,
      feeRecipient: dsSystem.config.common.FeeRecipient.address,
    })
  }

  return positions as Record<AjnaPositions, AjnaPositionDetails>
}

function buildEnv(
  config: RuntimeConfig,
  hre: HardhatRuntimeEnvironment,
  dsSystem: System,
  ajnaSystem: AjnaSystem,
  dependencies: StrategyDependenciesAjna,
  positions: Record<AjnaPositions, AjnaPositionDetails>,
): EnvWithAjnaPositions {
  return {
    config,
    hre,
    ajnaSystem,
    dsSystem,
    dependencies: dependencies,
    positions,
  }
}

function mapGetPoolDataFunction(ajnaSystem: AjnaSystem) {
  return async (poolAddress: string): Promise<AjnaPool> => {
    const pool = await ajnaSystem.getPoolData(poolAddress)
    return mapAjnaPoolDataTypes(poolAddress, pool)
  }
}
