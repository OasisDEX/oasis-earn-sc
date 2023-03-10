// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import { ServiceRegistry } from '@helpers/serviceRegistry'
import { RuntimeConfig } from '@helpers/types/common'
import { OperationsRegistry } from '@helpers/wrappers/operationsRegistry'
import { CONTRACT_NAMES } from '@oasisdex/oasis-actions/src'
import { operationDefinition as aaveV2CloseOp } from '@oasisdex/oasis-actions/src/operations/aave/v2/close'
import { operationDefinition as aaveV2OpenOp } from '@oasisdex/oasis-actions/src/operations/aave/v2/open'
import { operationDefinition as aaveV3CloseOp } from '@oasisdex/oasis-actions/src/operations/aave/v3/close'
import { operationDefinition as aaveV3OpenOp } from '@oasisdex/oasis-actions/src/operations/aave/v3/open'
import axios from 'axios'
import BigNumber from 'bignumber.js'
// @ts-ignore
import configLoader from 'config-json'
import { BigNumber as EthersBN, Contract, ContractFactory, providers, Signer, utils } from 'ethers'
import hre from 'hardhat'
import { HardhatRuntimeEnvironment } from 'hardhat/types'
import _ from 'lodash'
import NodeCache from 'node-cache'
import prompts from 'prompts'

import DS_PROXY_REGISTRY_ABI from '../../abi/ds-proxy-registry.json'
import { EtherscanGasPrice, Network } from '../common'

configLoader.setBaseDir('./scripts/deployment20/')

export const ChainById: { [key: number]: Network } = {
  1: Network.MAINNET,
  5: Network.GOERLI,
  10: Network.OPT_MAINNET,
}

const restrictedNetworks = [
  Network.MAINNET,
  // Network.LOCAL,
  Network.GOERLI,
]

const rpcUrls: any = {
  [Network.MAINNET]: 'https://eth-mainnet.alchemyapi.io/v2/TPEGdU79CfRDkqQ4RoOCTRzUX4GUAO44',
  [Network.OPT_MAINNET]: 'https://opt-mainnet.g.alchemy.com/v2/d2-w3caSVd_wPT05UkXyA3kr3un3Wx_g',
  [Network.GOERLI]: 'https://eth-goerli.alchemyapi.io/v2/TPEGdU79CfRDkqQ4RoOCTRzUX4GUAO44',
}

export const impersonateAccount = async (account: string) => {
  await hre.network.provider.request({
    method: 'hardhat_impersonateAccount',
    params: [account],
  })
}

export const stopImpersonatingAccount = async (account: string) => {
  await hre.network.provider.request({
    method: 'hardhat_stopImpersonatingAccount',
    params: [account],
  })
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
      console.error('error getting forked network chain id', e)
    }

    return 0
  }

  getNetworkFromChainId(chainId: number): Network {
    return ChainById[chainId]
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
    console.log('NETWORK/FORKED NETWORK', `${this.network}/${this.forkedNetwork}`)

    return {
      provider: this.provider,
      signer: this.signer,
      address: this.signerAddress,
    }
  }

  getRuntimeConfig(): RuntimeConfig {
    return {
      provider: this.provider!,
      signer: this.signer!,
      address: this.signerAddress!,
    }
  }
}

// MAIN CLASS ===============================================
export class DeploymentSystem extends DeployedSystemHelpers {
  private readonly _cache = new NodeCache()

  public config: any = {}
  public deployedSystem: any = {}
  public addresses: any = []  // remove? 

  constructor(public readonly hre: HardhatRuntimeEnvironment) {
    super()
    this.network = hre.network.name as Network
  }

  async loadConfig(configFileName?: string) {
    if (configFileName) {

      this.config = (await import(`./${configFileName}`)).config

      console.log('LOADED CONFIG', this.config);

      // configLoader.load(configFileName)
      // this.config = configLoader.get()
    } else {
      // if forked other network then merge configs files
      if (this.forkedNetwork) {
        console.log('LOAD COMBINED CONFIGS', this.forkedNetwork)
        // configLoader.load(`${this.forkedNetwork}.conf.json`)
        // const baseConfig = configLoader.get()
        const baseConfig = (await import(`./${this.forkedNetwork}.conf`)).config

        console.log('BASE', baseConfig );
        
        // configLoader.load('local-extend.conf.json')
        // const extendedConfig = configLoader.get()
        const extendedConfig = (await import('./local-extend.conf')).config


        console.log('EXTENDED', extendedConfig );
        
        this.config = _.merge(baseConfig, extendedConfig)

        console.log('COMBINED CONFIG', this.config.mpa.actions );
        
      } else {
        console.log('LOAD NETWORK CONFIG ONLY')

        // otherwise load just one config file
        configLoader.load(`${this.network}.conf.json`)
        this.config = configLoader.get()
      }
    }
  }

  async saveConfig() {
    const configString = JSON.stringify(this.config, null, 2)
    const { writeFile } = await import('fs')
    writeFile(`./scripts/deployment20/${this.network}.conf.json`, configString, (error: any) => {
      if (error) {
        console.log('ERROR: ', error)
      }
    })
  }

  async postInstantiation(configItem: any, contract: Contract) {
    console.log('POST INITIALIZATION', configItem.name, contract.address)
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
    if (!this.serviceRegistryHelper) throw new Error('ServiceRegistryHelper not initialized')
    console.log('POST DEPLOYMENT', configItem.name)

    // SERVICE REGISTRY addition
    if (configItem.serviceRegistryName) {
      await this.serviceRegistryHelper.addEntry(configItem.serviceRegistryName, contract.address)
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

  async instantiateContracts(addressesConfig: any) {
    if (!this.signer) throw new Error('Signer not initialized')
    for (const configItem of addressesConfig) {
      console.log('INSTANTIATING ', configItem.name)
      const contractInstance = await this.ethers.getContractAt(configItem.name, configItem.address)

      this.deployedSystem[configItem.name] = {
        contract: contractInstance,
        config: configItem,
        hash: this.getRegistryEntryHash(configItem.serviceRegistryName),
      }

      if (configItem.name === 'ServiceRegistry') {
        this.serviceRegistryHelper = new ServiceRegistry(configItem.address, this.signer)
      }

      await this.postInstantiation(configItem, contractInstance)
    }
  }

  async promptBeforeDeployment() {
    console.log(
      'WARNING: You are deploying to a restricted network. Please make sure you know what you are doing.',
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

  async deployContracts(addressesConfig: any) {
    if (!this.signer) throw new Error('Signer not initialized')
    if (this.isRestrictedNetwork) {
      await this.promptBeforeDeployment()
    }
    for (const configItem of addressesConfig) {
      let constructorParams = []

      if (configItem.constructorArgs?.length !== 0) {
        constructorParams = configItem.constructorArgs.map((param: any) => {
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
        hash: this.getRegistryEntryHash(configItem.serviceRegistryName),
      }

      if (configItem.address !== '') {
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
    await this.instantiateContracts(
      Object.values(this.config.mpa.core).filter((item: any) => item.address !== '' && !item.deploy),
    )
    await this.deployContracts(Object.values(this.config.mpa.core).filter((item: any) => item.deploy))
  }

  async deployActions() {
    await this.instantiateContracts(
      Object.values(this.config.mpa.actions).filter((item: any) => item.address !== '' && !item.deploy),
    )
    await this.deployContracts(Object.values(this.config.mpa.actions).filter((item: any) => item.deploy))
  }

  async deployAll() {
    await this.deployCore()
    await this.deployActions()
  }

  // mapAddresses() {

  //   console.log('this.config.external', this.config.external );

  //   this.config.external.forEach((item: any) => {
  //     this.addresses[item.name] = item.address
  //     if (item.name === 'FeeRecipient') {
  //       this.feeRecipient = item.address
  //     }
  //   })
  // }
  async setupLocalSystem(useInch?: boolean) {
    if (!this.signer) throw new Error('No signer set')
    if (!this.signerAddress) throw new Error('No signer address set')
    if (!this.serviceRegistryHelper) throw new Error('No service registry helper set')

    const deploySwapContract = await this.deployContract(
      this.ethers.getContractFactory(useInch ? 'Swap' : 'uSwap', this.signer),
      [
        this.signerAddress,
        this.feeRecipient || this.signerAddress, // Fallback to signer address if no fee recipient is set
        0,
        this.deployedSystem['ServiceRegistry'].contract.address,
      ],
    )

    const commonAddresses = this.config.common

    !useInch && (await deploySwapContract.setPool(commonAddresses.STETH.address, commonAddresses.WETH.address, 10000))

    await deploySwapContract.addFeeTier(20)

    this.deployedSystem['Swap'] = { contract: deploySwapContract, config: {}, hash: '' }

    await this.serviceRegistryHelper.addEntry('Swap', deploySwapContract.address)

    this.deployedSystem.AccountGuard.contract.setWhitelist(
      this.deployedSystem.OperationExecutor.contract.address,
      true,
    )

    const operationsRegistry: OperationsRegistry = new OperationsRegistry(
      this.deployedSystem.OperationsRegistry.contract.address,
      this.signer,
    )

    const dsProxyRegistry = await this.ethers.getContractAt(
      DS_PROXY_REGISTRY_ABI,
      commonAddresses.DsProxyRegistry.address,
      this.signer,
    )

    this.deployedSystem['DsProxyRegistry'] = { contract: dsProxyRegistry, config: {}, hash: '' }

    //-- Add Token Contract Entries

    for(let item of Object.values(commonAddresses)) {
      if("serviceRegistryName" in (item as any)) {
        console.log('ADDING TO SR', item );
        await this.serviceRegistryHelper.addEntry((item as any).serviceRegistryName, (item as any).address)
      }
    };

    // await this.serviceRegistryHelper.addEntry(CONTRACT_NAMES.common.WETH, this.addresses.WETH)
    // await this.serviceRegistryHelper.addEntry(CONTRACT_NAMES.common.DAI, this.addresses.DAI)
    // await this.serviceRegistryHelper.addEntry(CONTRACT_NAMES.common.USDC, this.addresses.USDC)

    // await this.serviceRegistryHelper.addEntry(
    //   CONTRACT_NAMES.common.UNISWAP_ROUTER,
    //   this.addresses.UniswapRouterV3,
    // )
    // await this.serviceRegistryHelper.addEntry(
    //   CONTRACT_NAMES.common.ONE_INCH_AGGREGATOR,
    //   this.addresses.OneInchAggregator,
    // )
    // await this.serviceRegistryHelper.addEntry(
    //   CONTRACT_NAMES.maker.FLASH_MINT_MODULE,
    //   this.addresses.FlashMintModule,
    // )
    // await this.serviceRegistryHelper.addEntry(
    //   CONTRACT_NAMES.common.BALANCER_VAULT,
    //   this.addresses.BalancerVault,
    // )
    // await this.serviceRegistryHelper.addEntry(
    //   CONTRACT_NAMES.aave.v2.LENDING_POOL,
    //   this.addresses.AaveV2LendingPool,
    // )
    // await this.serviceRegistryHelper.addEntry(
    //   CONTRACT_NAMES.aave.v2.WETH_GATEWAY,
    //   this.addresses.WETHGateway,
    // )
    // await this.serviceRegistryHelper.addEntry(
    //   CONTRACT_NAMES.aave.v3.AAVE_POOL,
    //   this.addresses.AaveV3Pool,
    // )

    // Add AAVE Operations
    await operationsRegistry.addOp(aaveV2OpenOp.name, aaveV2OpenOp.actions)
    await operationsRegistry.addOp(aaveV2CloseOp.name, aaveV2CloseOp.actions)
    await operationsRegistry.addOp(aaveV3OpenOp.name, aaveV3OpenOp.actions)
    await operationsRegistry.addOp(aaveV3CloseOp.name, aaveV3CloseOp.actions)
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
    return {
      system: this.deployedSystem,
      registry: this.serviceRegistryHelper,
    }
  }
}

// async function main() {
//   const signer = hre.ethers.provider.getSigner(0)
//   const network = hre.network.name || ''
//   console.log(`Deployer address: ${await signer.getAddress()}`)
//   console.log(`Network: ${network}`)

//   const ds = new DeploymentSystem(hre) // TODO add forked param and in init get chainId and forked Network + set as attribute
//   await ds.init()
//   // await ds.loadConfig('mainnet.conf')
//   await ds.loadConfig()
//   // ds.mapAddresses()
//   await ds.deployAll()
//   await ds.setupLocalSystem()

//   // ds.saveConfig()
// }

// // We recommend this pattern to be able to use async/await everywhere
// // and properly handle errors.
// main().catch(error => {
//   console.error(error)
//   process.exitCode = 1
// })
