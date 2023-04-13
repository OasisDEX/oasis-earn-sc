// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import DS_PROXY_REGISTRY_ABI from '@oasisdex/abis/external/libs/DS/ds-proxy-registry.json'
import { NetworkByChainId } from '@oasisdex/dma-common/utils/network'
import { OperationsRegistry, ServiceRegistry } from '@oasisdex/dma-common/utils/wrappers'
import { operationDefinition as aaveV2CloseOp } from '@oasisdex/dma-library/src/operations/aave/v2/close'
import { operationDefinition as aaveV2OpenOp } from '@oasisdex/dma-library/src/operations/aave/v2/open'
import { operationDefinition as aaveV3CloseOp } from '@oasisdex/dma-library/src/operations/aave/v3/close'
import { operationDefinition as aaveV3OpenOp } from '@oasisdex/dma-library/src/operations/aave/v3/open'
import Safe from '@safe-global/safe-core-sdk'
import { SafeTransactionDataPartial } from '@safe-global/safe-core-sdk-types'
import EthersAdapter from '@safe-global/safe-ethers-lib'
import SafeServiceClient from '@safe-global/safe-service-client'
import axios from 'axios'
import BigNumber from 'bignumber.js'
import {
  BigNumber as EthersBN,
  Contract,
  ContractFactory,
  ethers,
  providers,
  Signer,
  utils,
} from 'ethers'
import hre from 'hardhat'
import { HardhatRuntimeEnvironment } from 'hardhat/types'
import _ from 'lodash'
import NodeCache from 'node-cache'
import * as path from 'path'
import prompts from 'prompts'
import { inspect } from 'util'

import { DeploymentConfig, SystemConfig, SystemConfigItem } from '../types/deployment-config'
import { EtherscanGasPrice } from '@oasisdex/dma-common/utils/common'
import { Network } from '../types/network'

const restrictedNetworks = [Network.MAINNET, Network.OPT_MAINNET, Network.GOERLI]

const rpcUrls: any = {
  [Network.MAINNET]: 'https://eth-mainnet.alchemyapi.io/v2/TPEGdU79CfRDkqQ4RoOCTRzUX4GUAO44',
  [Network.OPT_MAINNET]: 'https://opt-mainnet.g.alchemy.com/v2/d2-w3caSVd_wPT05UkXyA3kr3un3Wx_g',
  [Network.GOERLI]: 'https://eth-goerli.alchemyapi.io/v2/TPEGdU79CfRDkqQ4RoOCTRzUX4GUAO44',
}

const gnosisSafeServiceUrl: any = {
  [Network.MAINNET]: '',
  [Network.OPT_MAINNET]: '',
  [Network.GOERLI]: 'https://safe-transaction.goerli.gnosis.io',
  [Network.HARDHAT]: '',
}

// HELPERS --------------------------
abstract class DeployedSystemHelpers {
  public chainId = 0
  public network: Network = Network.LOCAL
  public forkedNetwork: Network | undefined = undefined
  public rpcUrl = ''
  public isRestrictedNetwork = false
  public ethers: any = hre.ethers
  public provider: providers.JsonRpcProvider | undefined
  public signer: Signer | undefined
  public signerAddress: string | undefined
  public feeRecipient: string | undefined
  public serviceRegistryHelper: ServiceRegistry | undefined

  async getForkedNetworkChainId(provider: providers.JsonRpcProvider) {
    try {
      const metadata = await provider.send('hardhat_metadata', [])
      return metadata.forkedNetwork.chainId
    } catch (e) {
      console.log('\x1b[33m[ WARN ] Current network is not a fork! \x1b[0m')
    }

    return 0
  }

  getNetworkFromChainId(chainId: number): Network {
    return NetworkByChainId[chainId]
  }

  getRpcUrl(network: Network): string {
    return rpcUrls[network]
  }

  async init() {
    this.ethers = hre.ethers
    this.provider = hre.ethers.provider
    this.signer = this.provider.getSigner()

    this.signerAddress = await this.signer.getAddress()
    this.isRestrictedNetwork = restrictedNetworks.includes(this.network)
    this.chainId = await this.getForkedNetworkChainId(this.provider)
    this.forkedNetwork = this.getNetworkFromChainId(this.chainId)

    this.rpcUrl = this.getRpcUrl(this.forkedNetwork)
    console.log('NETWORK / FORKED NETWORK', `${this.network} / ${this.forkedNetwork}`)

    return {
      provider: this.provider,
      signer: this.signer,
      address: this.signerAddress,
    }
  }
}

// MAIN CLASS ===============================================
export class DeploymentSystem extends DeployedSystemHelpers {
  public config: SystemConfig | undefined
  public deployedSystem: any = {}
  private readonly _cache = new NodeCache()

  constructor(public readonly hre: HardhatRuntimeEnvironment) {
    super()
    this.network = hre.network.name as Network
  }

  async loadConfig(configFileName?: string) {
    if (configFileName) {
      this.config = (await import(this.getConfigPath(`./${configFileName}`))).config
    } else {
      // if forked other network then merge configs files
      if (this.forkedNetwork) {
        const baseConfig = (await import(this.getConfigPath(`./${this.forkedNetwork}.conf`))).config
        const extendedConfig = (await import(this.getConfigPath(`./local-extend.conf`))).config
        this.config = _.merge(baseConfig, extendedConfig)
      } else {
        // otherwise load just one config file
        this.config = (await import(this.getConfigPath(`./${this.network}.conf`))).config
      }
    }
  }

  async extendConfig(configFileName?: string) {
    if (!this.config) {
      await this.loadConfig(configFileName)
    } else {
      this.config = _.merge(
        this.config,
        (await import(this.getConfigPath(`./${configFileName}`))).config,
      )
    }
  }

  async saveConfig() {
    const { writeFile } = await import('fs')

    const configString = inspect(this.config, { depth: null })

    writeFile(
      this.getConfigPath(`./${this.network}.conf.ts`),
      `export const config = ${configString}`,
      (error: any) => {
        if (error) {
          console.log('ERROR: ', error)
        }
      },
    )
  }

  getConfigPath(localPath: string) {
    const baseDirectory = '../configs'
    const configPath = path.join(baseDirectory, localPath)
    console.log('USING CONFIG', localPath)
    return configPath
  }

  async postInstantiation(configItem: DeploymentConfig, contract: Contract) {
    console.log('POST INITIALIZATION', configItem.name, contract.address)
  }

  async postRegistryEntry(configItem: DeploymentConfig, address: string) {
    if (!configItem.serviceRegistryName) throw new Error('No service registry name provided')
    console.log(
      'POST REGISTRY ENTRY',
      configItem.name,
      this.getRegistryEntryHash(configItem.serviceRegistryName),
      address,
    )
  }

  async verifyContract(address: string, constructorArguments: any[]) {
    try {
      await hre.run('verify:verify', {
        address,
        constructorArguments,
      })
    } catch (e: any) {
      console.log(`DEBUG: Error during verification of ${address}: ${e.message}`)
    }
  }

  async postDeployment(configItem: any, contract: Contract, constructorArguments: any) {
    if (!this.provider) throw new Error('No provider set')
    if (!this.config) throw new Error('No config set')
    if (!this.serviceRegistryHelper) throw new Error('ServiceRegistryHelper not initialized')
    console.log('POST DEPLOYMENT', configItem.name, configItem.address)

    // SERVICE REGISTRY addition
    if (configItem.serviceRegistryName) {
      if (gnosisSafeServiceUrl[this.network] !== '') {
        const signer = this.provider.getSigner(1)
        const ethAdapter = new EthersAdapter({ ethers, signerOrProvider: signer })

        const safeSdk: Safe = await Safe.create({
          ethAdapter: ethAdapter,
          safeAddress: this.config.common.GNOSIS_SAFE.address,
        })

        const safeService = new SafeServiceClient({
          txServiceUrl: gnosisSafeServiceUrl[this.network],
          ethAdapter,
        })

        const safeInfo = await safeService.getSafeInfo(this.config.common.GNOSIS_SAFE.address)

        const encodedData = await this.serviceRegistryHelper.addEntryCalldata(
          configItem.serviceRegistryName,
          contract.address,
        )

        const safeTransactionData: Omit<SafeTransactionDataPartial, 'value'> & { value: number } = {
          to: this.deployedSystem.ServiceRegistry.contract.address,
          data: encodedData,
          value: 0, // !!has to be a number!! Despite the type in SafeTransactionDataPartial. Otherwise proposeTransaction is failing
          nonce: safeInfo.nonce,
        }
        const safeTransaction = await safeSdk.createTransaction({
          safeTransactionData: safeTransactionData as unknown as SafeTransactionDataPartial,
        })
        const safeTransactionHash = await safeSdk.getTransactionHash(safeTransaction)
        const ownerSignature = await safeSdk.signTransactionHash(safeTransactionHash)

        const address = await signer.getAddress()

        await safeService.proposeTransaction({
          safeAddress: ethers.utils.getAddress(this.config.common.GNOSIS_SAFE.address),
          safeTransactionData: safeTransaction.data,
          safeTxHash: safeTransactionHash,
          senderAddress: ethers.utils.getAddress(address),
          senderSignature: ownerSignature.data,
        })
      } else {
        await this.serviceRegistryHelper.addEntry(configItem.serviceRegistryName, contract.address)
      }
    }

    // ETHERSCAN VERIFICATION (only for mainnet and L1 testnets)
    if (this.network === Network.MAINNET || this.network === Network.GOERLI) {
      this.verifyContract(contract.address, constructorArguments)
    }
  }

  getRegistryEntryHash(name: string) {
    if (name !== '') {
      return utils.keccak256(Buffer.from(name))
      // await this.serviceRegistryHelper!.getEntryHash(name as ContractNames)
    }

    return ''
  }

  async addRegistryEntries(addressesConfig: DeploymentConfig[]) {
    if (!this.serviceRegistryHelper) throw new Error('No service registry helper set')
    for (const configItem of addressesConfig) {
      if (configItem.serviceRegistryName) {
        const address = this.deployedSystem[configItem.name]?.contract.address || configItem.address
        await this.addRegistryEntry(configItem, address)
      }
    }
  }

  async addRegistryEntry(configItem: DeploymentConfig, address: string) {
    if (!this.serviceRegistryHelper) throw new Error('ServiceRegistryHelper not initialized')
    if (configItem.serviceRegistryName) {
      await this.serviceRegistryHelper.addEntry(configItem.serviceRegistryName, address)
      await this.postRegistryEntry(configItem, address)
    }
  }

  async instantiateContracts(addressesConfig: DeploymentConfig[]) {
    if (!this.signer) throw new Error('Signer not initialized')
    for (const configItem of addressesConfig) {
      console.log('INSTANTIATING ', configItem.name, configItem.address)
      const contractInstance = await this.ethers.getContractAt(configItem.name, configItem.address)

      this.deployedSystem[configItem.name] = {
        contract: contractInstance,
        config: configItem,
        hash: this.getRegistryEntryHash(configItem.serviceRegistryName || ''),
      }
      const isServiceRegistry = configItem.name === 'ServiceRegistry'
      !configItem.serviceRegistryName &&
        !isServiceRegistry &&
        console.warn(
          'No Service Registry name for: ',
          configItem.name,
          configItem.serviceRegistryName || '',
        )

      if (configItem.name === 'ServiceRegistry') {
        this.serviceRegistryHelper = new ServiceRegistry(configItem.address, this.signer)
      }

      await this.postInstantiation(configItem, contractInstance)
    }
  }

  async promptBeforeDeployment() {
    console.log(
      '\x1b[33m[ WARN ]: You are deploying to a restricted network. Please make sure you know what you are doing.\x1b[0m',
    )
    const response = await prompts({
      type: 'text',
      name: 'value',
      message: `Please type "${this.network}" to continue`,
    })

    if (response.value !== this.network) {
      process.exit(1)
    }
  }

  async deployContracts(addressesConfig: SystemConfigItem[]) {
    if (!this.signer) throw new Error('Signer not initialized')
    if (this.isRestrictedNetwork) {
      await this.promptBeforeDeployment()
    }
    for (const configItem of addressesConfig) {
      let constructorParams: Array<string | number> = []

      if (configItem.constructorArgs && configItem.constructorArgs?.length !== 0) {
        constructorParams = configItem.constructorArgs.map((param: string | number) => {
          if (typeof param === 'string' && param.indexOf('address:') >= 0) {
            const contractName = (param as string).replace('address:', '')
            return this.deployedSystem[contractName].contract.address
          }
          return param
        })
      }

      const contractInstance = await this.deployContract(
        this.ethers.getContractFactory(configItem.name as string, this.signer),
        constructorParams,
      )

      if (configItem.name === 'ServiceRegistry') {
        this.serviceRegistryHelper = new ServiceRegistry(contractInstance.address, this.signer)
      }

      this.deployedSystem[configItem.name] = {
        contract: contractInstance,
        config: configItem,
        hash: this.getRegistryEntryHash(configItem.serviceRegistryName || ''),
      }

      const isServiceRegistry = configItem.name === 'ServiceRegistry'
      !configItem.serviceRegistryName &&
        !isServiceRegistry &&
        console.warn(
          'No Service Registry name for: ',
          configItem.name,
          configItem.serviceRegistryName || '',
        )

      if (configItem.history && configItem.address !== '') {
        configItem.history.push(configItem.address)
      }
      configItem.address = contractInstance.address

      await this.postDeployment(configItem, contractInstance, constructorParams)
    }
  }

  public async deployContract<F extends ContractFactory, C extends Contract>(
    _factory: F | Promise<F>,
    params: Parameters<F['deploy']>,
  ): Promise<C> {
    const factory = await _factory
    const deployment = await factory.deploy(...params, await this.getGasSettings())
    return (await deployment.deployed()) as C
  }

  public async getGasSettings() {
    if (this.hre.network.name !== Network.MAINNET) {
      return {}
    }

    const { suggestBaseFee } = await this.getGasPrice()
    const maxPriorityFeePerGas = new BigNumber(2).shiftedBy(9).toFixed(0)
    const maxFeePerGas = new BigNumber(suggestBaseFee)
      .shiftedBy(9)
      .plus(maxPriorityFeePerGas)
      .toFixed(0)
    return {
      maxFeePerGas: EthersBN.from(maxFeePerGas),
      maxPriorityFeePerGas: EthersBN.from(maxPriorityFeePerGas),
    }
  }

  public async getGasPrice(): Promise<EtherscanGasPrice['result']> {
    const cached = this._cache.get<EtherscanGasPrice['result']>('gasprice')
    if (cached) {
      return cached
    }

    const { data } = await axios.get<EtherscanGasPrice>('https://api.etherscan.io/api', {
      params: {
        module: 'gastracker',
        action: 'gasoracle',
        apikey: process.env.ETHERSCAN_API_KEY,
      },
    })
    this._cache.set('gasprice', data.result, 10)
    return data.result
  }

  async deployCore() {
    if (!this.config) throw new Error('No config set')
    await this.instantiateContracts(
      Object.values(this.config.mpa.core).filter(
        (item: SystemConfigItem) => item.address !== '' && !item.deploy,
      ),
    )
    await this.deployContracts(
      Object.values(this.config.mpa.core).filter((item: SystemConfigItem) => item.deploy),
    )
  }

  async deployActions() {
    if (!this.config) throw new Error('No config set')
    await this.instantiateContracts(
      Object.values(this.config.mpa.actions).filter(
        (item: any) => item.address !== '' && !item.deploy,
      ),
    )
    await this.deployContracts(
      Object.values(this.config.mpa.actions).filter((item: any) => item.deploy),
    )
  }

  async deployAll() {
    await this.deployCore()
    await this.deployActions()
  }

  async addCommonEntries() {
    if (!this.config) throw new Error('No config set')
    await this.addRegistryEntries(
      Object.values(this.config.common).filter(
        (item: DeploymentConfig) => item.address !== '' && item.serviceRegistryName,
      ),
    )
  }

  async addAaveEntries() {
    if (!this.config) throw new Error('No config set')
    await this.addRegistryEntries(
      Object.values(this.config.aave.v2 || {}).filter(
        (item: DeploymentConfig) => item.address !== '' && item.serviceRegistryName,
      ),
    )
    await this.addRegistryEntries(
      Object.values(this.config.aave.v3 || {}).filter(
        (item: DeploymentConfig) => item.address !== '' && item.serviceRegistryName,
      ),
    )
  }

  async addMakerEntries() {
    if (!this.config) throw new Error('No config set')
    await this.addRegistryEntries(
      Object.values(this.config.maker).filter(
        (item: DeploymentConfig) => item.address !== '' && item.serviceRegistryName,
      ),
    )
  }

  async addOperationEntries() {
    if (!this.signer) throw new Error('No signer set')
    const operationsRegistry = new OperationsRegistry(
      this.deployedSystem.OperationsRegistry.contract.address,
      this.signer,
    )
    await operationsRegistry.addOp(aaveV2OpenOp.name, aaveV2OpenOp.actions)
    await operationsRegistry.addOp(aaveV2CloseOp.name, aaveV2CloseOp.actions)
    await operationsRegistry.addOp(aaveV3OpenOp.name, aaveV3OpenOp.actions)
    await operationsRegistry.addOp(aaveV3CloseOp.name, aaveV3CloseOp.actions)
  }

  async addAllEntries() {
    await this.addCommonEntries()
    await this.addAaveEntries()
    await this.addMakerEntries()
    await this.addOperationEntries()
  }

  async setupLocalSystem(useInch?: boolean) {
    if (!this.signer) throw new Error('No signer set')
    if (!this.signerAddress) throw new Error('No signer address set')
    if (!this.serviceRegistryHelper) throw new Error('No service registry helper set')
    if (!this.config) throw new Error('No config set')
    const addLocalEntries = this.config.mpa.core['ServiceRegistry'].deploy

    const deploySwapContract = addLocalEntries
      ? await this.deployContract(
          this.ethers.getContractFactory(useInch ? 'Swap' : 'uSwap', this.signer),
          [
            this.signerAddress,
            this.config.common.FeeRecipient.address,
            0,
            this.deployedSystem['ServiceRegistry'].contract.address,
          ],
        )
      : await this.ethers.getContractAt(
          this.config.mpa.core['Swap'].name,
          this.config.mpa.core['Swap'].address,
        )

    !useInch &&
      addLocalEntries &&
      (await deploySwapContract.setPool(
        this.config.common.STETH.address,
        this.config.common.WETH.address,
        10000,
      ))

    addLocalEntries && (await deploySwapContract.addFeeTier(20))

    this.deployedSystem['Swap'] = { contract: deploySwapContract, config: {}, hash: '' }

    addLocalEntries &&
      (await this.serviceRegistryHelper.addEntry('Swap', deploySwapContract.address))

    this.deployedSystem.AccountGuard.contract.setWhitelist(
      this.deployedSystem.OperationExecutor.contract.address,
      true,
    )

    const dsProxyRegistry = await this.ethers.getContractAt(
      DS_PROXY_REGISTRY_ABI,
      this.config.common.DSProxyRegistry.address,
      this.signer,
    )

    this.deployedSystem['DSProxyRegistry'] = { contract: dsProxyRegistry, config: {}, hash: '' }

    await this.addAllEntries()
  }

  // TODO unify resetNode and resetNodeToLatestBlock into one function
  async resetNode(blockNumber: number) {
    if (!this.provider) throw new Error('No provider set')
    console.log(`\x1b[90mResetting fork to block number: ${blockNumber}\x1b[0m`)
    await this.provider.send('hardhat_reset', [
      {
        forking: {
          jsonRpcUrl: this.rpcUrl,
          blockNumber,
        },
      },
    ])
  }

  async resetNodeToLatestBlock() {
    if (!this.provider) throw new Error('No provider set')
    await this.provider.send('hardhat_reset', [
      {
        forking: {
          jsonRpcUrl: this.rpcUrl,
        },
      },
    ])
  }

  getSystem() {
    if (!this.serviceRegistryHelper) throw new Error('No service registry helper set')
    if (!this.config) throw new Error('No config set')
    return {
      system: this.deployedSystem,
      registry: this.serviceRegistryHelper,
      config: this.config,
    }
  }
}
