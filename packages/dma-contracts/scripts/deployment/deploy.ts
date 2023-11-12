// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import {
  getAaveAdjustDownV2OperationDefinition,
  getAaveAdjustDownV3OperationDefinition,
  getAaveAdjustUpV2OperationDefinition,
  getAaveAdjustUpV3OperationDefinition,
  getAaveBorrowV2OperationDefinition,
  getAaveBorrowV3OperationDefinition,
  getAaveCloseV2OperationDefinition,
  getAaveCloseV3OperationDefinition,
  getAaveDepositBorrowV2OperationDefinition,
  getAaveDepositBorrowV3OperationDefinition,
  getAaveDepositV2OperationDefinition,
  getAaveDepositV3OperationDefinition,
  getAaveMigrateEOAV3OperationDefinition,
  getAaveOpenDepositBorrowV3OperationDefinition,
  getAaveOpenV2OperationDefinition,
  getAaveOpenV3OperationDefinition,
  getAavePaybackWithdrawV2OperationDefinition,
  getAavePaybackWithdrawV3OperationDefinition,
  getAjnaAdjustDownOperationDefinition,
  getAjnaAdjustUpOperationDefinition,
  getAjnaCloseToCollateralOperationDefinition,
  getAjnaCloseToQuoteOperationDefinition,
  getAjnaOpenOperationDefinition,
  getMorphoBlueAdjustDownOperationDefinition,
  getMorphoBlueAdjustUpOperationDefinition,
  getMorphoBlueBorrowOperationDefinition,
  getMorphoBlueCloseOperationDefinition,
  getMorphoBlueDepositBorrowOperationDefinition,
  getMorphoBlueDepositOperationDefinition,
  getMorphoBlueOpenDepositBorrowOperationDefinition,
  getMorphoBlueOpenOperationDefinition,
  getMorphoBluePaybackWithdrawOperationDefinition,
  getSparkAdjustDownOperationDefinition,
  getSparkAdjustUpOperationDefinition,
  getSparkBorrowOperationDefinition,
  getSparkCloseOperationDefinition,
  getSparkDepositBorrowOperationDefinition,
  getSparkDepositOperationDefinition,
  getSparkMigrateEOAOperationDefinition,
  getSparkOpenDepositBorrowOperationDefinition,
  getSparkOpenOperationDefinition,
  getSparkPaybackWithdrawOperationDefinition,
} from '@deploy-configurations/operation-definitions'
import {
  ContractProps,
  DeployedSystem,
  System,
  SystemTemplate,
} from '@deploy-configurations/types/deployed-system'
import {
  ConfigEntry,
  SystemConfig,
  SystemConfigEntry,
  SystemContracts,
} from '@deploy-configurations/types/deployment-config'
import { EtherscanGasPrice } from '@deploy-configurations/types/etherscan'
import { Network } from '@deploy-configurations/types/network'
import { NetworkByChainId } from '@deploy-configurations/utils/network/index'
import { OperationsRegistry, ServiceRegistry } from '@deploy-configurations/utils/wrappers/index'
import { loadContractNames } from '@dma-contracts/../deploy-configurations/constants'
import { RecursivePartial } from '@dma-contracts/utils/recursive-partial'
import Safe from '@safe-global/safe-core-sdk'
import { SafeTransactionDataPartial } from '@safe-global/safe-core-sdk-types'
import EthersAdapter from '@safe-global/safe-ethers-lib'
import SafeServiceClient from '@safe-global/safe-service-client'
import axios from 'axios'
import BigNumber from 'bignumber.js'
import {
  BigNumber as EthersBN,
  constants,
  Contract,
  ContractFactory,
  ethers,
  providers,
  Signer,
  utils,
} from 'ethers'
import { HardhatRuntimeEnvironment } from 'hardhat/types'
import _ from 'lodash'
import NodeCache from 'node-cache'
import * as path from 'path'
import prompts from 'prompts'
import { inspect } from 'util'

const restrictedNetworks = [Network.MAINNET, Network.OPTIMISM, Network.GOERLI]

const rpcUrls: any = {
  [Network.MAINNET]: 'https://eth-mainnet.alchemyapi.io/v2/TPEGdU79CfRDkqQ4RoOCTRzUX4GUAO44',
  [Network.OPTIMISM]: 'https://opt-mainnet.g.alchemy.com/v2/d2-w3caSVd_wPT05UkXyA3kr3un3Wx_g',
  [Network.ARBITRUM]: 'https://arb-mainnet.g.alchemy.com/v2/d2-w3caSVd_wPT05UkXyA3kr3un3Wx_g',
  [Network.BASE]: 'https://base-mainnet.g.alchemy.com/v2/d2-w3caSVd_wPT05UkXyA3kr3un3Wx_g',
  [Network.GOERLI]: 'https://eth-goerli.alchemyapi.io/v2/TPEGdU79CfRDkqQ4RoOCTRzUX4GUAO44',
}

const gnosisSafeServiceUrl: Record<Network, string> = {
  [Network.MAINNET]: '',
  [Network.HARDHAT]: '',
  [Network.LOCAL]: '',
  [Network.OPTIMISM]: '',
  [Network.ARBITRUM]: '',
  [Network.BASE]: '',
  [Network.GOERLI]: 'https://safe-transaction-goerli.safe.global',
  [Network.TENDERLY]: '',
  [Network.TEST]: '',
}

// HELPERS --------------------------
abstract class DeployedSystemHelpers {
  public chainId = 0
  public network: Network = Network.LOCAL
  public forkedNetwork: Network | undefined = undefined
  public rpcUrl = ''
  public isRestrictedNetwork = false
  public hre: HardhatRuntimeEnvironment | undefined
  public ethers: any
  public provider: providers.JsonRpcProvider | undefined
  public signer: Signer | undefined
  public signerAddress: string | undefined
  public feeRecipient: string | undefined
  public serviceRegistryHelper: ServiceRegistry | undefined
  public hideLogging = false
  public serviceRegistryNames = {}

  async getForkedNetworkChainId(provider: providers.JsonRpcProvider) {
    try {
      return (await provider.getNetwork()).chainId
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

  log(...args: any[]) {
    !this.hideLogging && console.log(...args)
  }
  logOp(op: { name: string; actions: { hash: string; optional: boolean }[]; log?: boolean }) {
    if (op.log) {
      const tupleOutput = JSON.stringify([
        op.actions.map(op => op.hash),
        op.actions.map(op => op.optional),
        op.name,
      ])
      console.log('\x1b[33m[ OP LOG ]\x1b[0m')
      console.log(`\x1b[33m[ ${op.name} ]\x1b[0m`)
      console.log(tupleOutput)
    }
  }

  useGnosisSafeServiceClient() {
    return gnosisSafeServiceUrl[this.network] !== ''
  }

  async init(hideLogging = false) {
    if (!this.hre) throw new Error('HardhatRuntimeEnvironment is not defined!')
    this.hideLogging = hideLogging
    this.ethers = this.hre.ethers
    this.provider = this.hre.ethers.provider
    this.signer = this.provider.getSigner()

    this.signerAddress = await this.signer.getAddress()
    this.isRestrictedNetwork = restrictedNetworks.includes(this.network)
    this.chainId = await this.getForkedNetworkChainId(this.provider)
    this.forkedNetwork = this.getNetworkFromChainId(this.chainId)

    this.rpcUrl = this.getRpcUrl(this.forkedNetwork)
    this.log(
      'NETWORK / FORKED NETWORK / ChainID',
      `${this.network} / ${this.forkedNetwork} / ${this.chainId}`,
    )

    if (this.forkedNetwork) {
      console.log('Loading ServiceRegistryNames for', this.forkedNetwork)
      this.serviceRegistryNames = loadContractNames(this.forkedNetwork)
    } else {
      console.log('Loading ServiceRegistryNames for', this.network)
      this.serviceRegistryNames = loadContractNames(this.network)
    }

    return {
      provider: this.provider,
      signer: this.signer,
      address: this.signerAddress,
    }
  }

  public async findBalancesSlot(tokenAddress: string): Promise<number> {
    if (!this.provider) throw new Error('Provider is not defined!')

    const encode = (types: any[], values: any[]) =>
      this.ethers.utils.defaultAbiCoder.encode(types, values)
    const account = constants.AddressZero
    const probeA = encode(['uint'], [EthersBN.from('100')])
    const probeB = encode(['uint'], [EthersBN.from('200')])
    const token = await this.ethers.getContractAt('IERC20', tokenAddress)
    for (let i = 0; i < 100; i++) {
      let probedSlot = this.ethers.utils.keccak256(encode(['address', 'uint'], [account, i]))
      // remove padding for JSON RPC
      while (probedSlot.startsWith('0x0')) probedSlot = '0x' + probedSlot.slice(3)
      const prev = await this.provider.send('eth_getStorageAt', [
        tokenAddress,
        probedSlot,
        'latest',
      ])
      // make sure the probe will change the slot value
      const probe = prev === probeA ? probeB : probeA

      await this.provider.send('hardhat_setStorageAt', [tokenAddress, probedSlot, probe])

      const balance = await token.balanceOf(account)
      // reset to previous value
      await this.provider.send('hardhat_setStorageAt', [tokenAddress, probedSlot, prev])
      if (balance.eq(EthersBN.from(probe))) return i
    }
    throw 'Balances slot not found!'
  }

  /**
   * Set token balance to the provided value.
   * @param {string} account  - address of the wallet holding the tokens
   * @param {string}tokenAddress - address of the token contract
   * @param {BigNumber} balance - token balance to set
   * @return {Promise<boolean>} if the operation succedded
   */

  public async setTokenBalance(
    account: string,
    tokenAddress: string,
    balance: BigNumber,
  ): Promise<boolean> {
    const slot = await this.findBalancesSlot(tokenAddress)
    let index = this.ethers.utils.solidityKeccak256(['uint256', 'uint256'], [account, slot])
    if (index.startsWith('0x0')) index = '0x' + index.slice(3)

    const balanceBN = EthersBN.from(balance.toFixed())
    await this.ethers.provider.send('hardhat_setStorageAt', [
      tokenAddress,
      index,
      this.ethers.utils.hexZeroPad(balanceBN.toHexString(), 32),
    ])
    const token = await this.ethers.getContractAt('IERC20', tokenAddress)
    const balanceAfter = await token.balanceOf(account)
    return balance.toString() == balanceAfter.toString()
  }
}

// MAIN CLASS ===============================================
export class DeploymentSystem extends DeployedSystemHelpers {
  public config: SystemConfig | undefined
  public deployedSystem: SystemTemplate = {}
  public network: Network
  public provider: providers.JsonRpcProvider
  public signer: Signer
  private readonly _cache = new NodeCache()
  private readonly isLocal: boolean

  constructor(public readonly hre: HardhatRuntimeEnvironment) {
    super()
    this.hre = hre
    this.network = hre.network.name as Network
    this.provider = hre.ethers.provider
    this.signer = this.provider.getSigner()
    this.isLocal = this.network === Network.LOCAL
  }

  async loadConfig(configFileName?: string) {
    if (configFileName) {
      try {
        this.config = (await import(this.getConfigPath(`./${configFileName}`))).config
      } catch (e) {
        console.log('\x1b[33m[ WARN ] Config file not found! \x1b[0m', e)
      }
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

  async extendConfig(configFileName: string) {
    try {
      if (!this.config) {
        await this.loadConfig(configFileName)
      } else {
        const configToMerge = (await import(this.getConfigPath(`./${configFileName}`))).config
        this.config = _.merge(this.config, configToMerge)
      }
    } catch (e) {
      console.error('Could not extend config', e)
    }
  }

  addConfigOverrides(configOverrides: RecursivePartial<SystemConfig>) {
    if (!this.config) throw new Error('Config is not defined!')
    this.config = _.merge(this.config, configOverrides)
  }

  findPath = (obj, target, parentPath) => {
    for (const key in obj) {
      const path = `${parentPath}.${key}`
      if (typeof obj[key] === 'string' && obj[key] === target) {
        return path
      }
      if (typeof obj[key] === 'object') {
        const result = this.findPath(obj[key], target, path)
        if (result) {
          return result
        }
      }
    }
    return null
  }

  findStringPath = target => {
    const rootPath = 'SERVICE_REGISTRY_NAMES'
    return this.findPath(this.serviceRegistryNames, target, rootPath)
  }

  replaceServiceRegistryName(inputString, transformFunction) {
    return inputString.replace(/(serviceRegistryName:\s')([^']*)(')/g, function (match, p1, p2) {
      const newValue = transformFunction(p2)
      return 'serviceRegistryName: ' + newValue
    })
  }

  getNetworkEnumString(param: string): string | undefined {
    const keys = Object.keys(Network).filter(key => typeof Network[key] === 'string')

    for (const key of keys) {
      if (Network[key] === param) {
        return `Network.${key}`
      }
    }

    return undefined
  }

  async saveConfig() {
    if (!this.forkedNetwork) throw new Error('Forked network is not defined!')

    const { writeFile } = await import('fs')
    let configString = inspect(this.config, { depth: null })
    configString = this.replaceServiceRegistryName(configString, this.findStringPath)

    const networkEnumString =
      this.network === Network.TENDERLY
        ? this.getNetworkEnumString(Network.MAINNET)
        : this.getNetworkEnumString(this.network)

    writeFile(
      `./../deploy-configurations/configs/${this.network}.conf.ts`,
      `import { ADDRESS_ZERO, loadContractNames } from '@deploy-configurations/constants'\nimport { SystemConfig } from '@deploy-configurations/types/deployment-config'\nimport { Network } from '@deploy-configurations/types/network'\n\nconst SERVICE_REGISTRY_NAMES = loadContractNames(${networkEnumString})\n\nexport const config: SystemConfig = ${configString}`,
      (error: any) => {
        if (error) {
          console.log('ERROR: ', error)
        }
      },
    )
  }

  getConfigPath(localPath: string) {
    const baseDirectory = '../../../deploy-configurations/configs'
    const configPath = path.join(baseDirectory, localPath)
    this.log('USING CONFIG', localPath)
    return configPath
  }

  async postInstantiation(configItem: ConfigEntry, contract: Contract) {
    this.log('POST INITIALIZATION', configItem.name, contract.address)
  }

  async postRegistryEntry(configItem: ConfigEntry, address: string) {
    if (!configItem.serviceRegistryName) throw new Error('No service registry name provided')
    this.log(
      'REGISTRY ENTRY',
      configItem.serviceRegistryName,
      this.getRegistryEntryHash(configItem.serviceRegistryName),
      address,
    )
  }

  async verifyContract(address: string, constructorArguments: any[]) {
    try {
      await this.hre.run('verify:verify', {
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

    this.log('POST DEPLOYMENT', configItem.name, configItem.address)

    // SERVICE REGISTRY addition
    if (configItem.serviceRegistryName) {
      if (this.useGnosisSafeServiceClient()) {
        /**
         * Currently throws the following error:
         * Error: Unprocessable Entity
         * When attempting to generate a Safe transaction
         * TODO: investigate and debug error
         */
        const signer = this.provider.getSigner(0)
        const ethAdapter = new EthersAdapter({ ethers, signerOrProvider: signer })

        const safeSdk: Safe = await Safe.create({
          ethAdapter: ethAdapter,
          safeAddress: this.config.common.GnosisSafe.address,
        })

        const safeService = new SafeServiceClient({
          txServiceUrl: gnosisSafeServiceUrl[this.network],
          ethAdapter,
        })

        const safeInfo = await safeService.getSafeInfo(this.config.common.GnosisSafe.address)

        const encodedData = await this.serviceRegistryHelper.addEntryCalldata(
          configItem.serviceRegistryName,
          contract.address,
        )

        if (this.deployedSystem.ServiceRegistry === undefined)
          throw new Error('No ServiceRegistry deployed')
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
          safeAddress: ethers.utils.getAddress(this.config.common.GnosisSafe.address),
          safeTransactionData: safeTransaction.data,
          safeTxHash: safeTransactionHash,
          senderAddress: ethers.utils.getAddress(address),
          senderSignature: ownerSignature.data,
        })
        // Mainnet is excluded because Service Registry is managed by multi-sig wallet
      } else if (this.network !== Network.MAINNET) {
        await this.serviceRegistryHelper.addEntry(configItem.serviceRegistryName, contract.address)
      }
    }

    // ETHERSCAN VERIFICATION (only for mainnet and L1 testnets)
    if (this.network === Network.MAINNET || this.network === Network.GOERLI) {
      await this.verifyContract(contract.address, constructorArguments)
    }
  }

  getRegistryEntryHash(name: string) {
    if (name !== '') {
      return utils.keccak256(Buffer.from(name))
      // await this.serviceRegistryHelper!.getEntryHash(name as ContractNames)
    }

    return ''
  }

  async addRegistryEntries(addressesConfig: ConfigEntry[]) {
    if (!this.serviceRegistryHelper) throw new Error('No service registry helper set')
    for (const configItem of addressesConfig) {
      if (configItem.serviceRegistryName) {
        const address =
          this.deployedSystem?.[configItem.name as SystemContracts]?.contract.address ||
          configItem.address
        await this.addRegistryEntry(configItem, address)
      }
    }
  }

  async addRegistryEntry(configItem: ConfigEntry, address: string) {
    if (!this.serviceRegistryHelper) throw new Error('ServiceRegistryHelper not initialized')
    if (configItem.serviceRegistryName) {
      await this.serviceRegistryHelper.addEntry(configItem.serviceRegistryName, address)
      await this.postRegistryEntry(configItem, address)
    }
  }

  async removeRegistryEntry(configItem: ConfigEntry) {
    if (!this.serviceRegistryHelper) throw new Error('ServiceRegistryHelper not initialized')
    if (configItem.serviceRegistryName) {
      this.serviceRegistryHelper.removeEntry(configItem.serviceRegistryName)
    }
  }

  async replaceSwapContracts() {
    if (!this.provider) throw new Error('No provider set')
    if (!this.signerAddress) throw new Error('No signerAddress set')
    if (!this.deployedSystem.ServiceRegistry) throw new Error('No ServiceRegistry instance')

    if (this.deployedSystem.uSwap) {
      const serviceRegistry = this.deployedSystem.ServiceRegistry
      const swapHash = this.getRegistryEntryHash('Swap')
      const encode = (types: any[], values: any[]) =>
        this.ethers.utils.defaultAbiCoder.encode(types, values)
      const slot = this.ethers.utils.keccak256(encode(['bytes32', 'uint'], [swapHash, 1]))
      const paddedAddress = ethers.utils.hexZeroPad(this.deployedSystem.uSwap.contract.address, 32)

      await this.provider.send('hardhat_setStorageAt', [
        serviceRegistry.contract.address,
        slot,
        paddedAddress,
      ])
    }
  }

  async instantiateContracts(addressesConfig: SystemConfigEntry[]) {
    if (!this.signer) throw new Error('Signer not initialized')
    for (const configItem of addressesConfig) {
      this.log('INSTANTIATING ', configItem.name, configItem.address)
      const contractInstance = await this.ethers.getContractAt(configItem.name, configItem.address)

      this.deployedSystem[configItem.name] = {
        contract: contractInstance,
        config: configItem,
        hash: this.getRegistryEntryHash(configItem.serviceRegistryName || ''),
      }
      const isServiceRegistry = configItem.name === 'ServiceRegistry'
      !configItem.serviceRegistryName &&
        !isServiceRegistry &&
        this.log(
          'No Service Registry name for: ',
          configItem.name,
          configItem.serviceRegistryName || '',
        )

      if (configItem.name === 'ServiceRegistry') {
        this.serviceRegistryHelper = new ServiceRegistry(configItem.address, this.signer)

        if (this.isLocal) {
          if (!this.provider) throw new Error('No provider set')
          if (!this.signerAddress) throw new Error('No signerAddress set')

          const paddedOwnerAddress = ethers.utils.hexZeroPad(this.signerAddress, 32)

          await this.provider.send('hardhat_setStorageAt', [
            contractInstance.address,
            '0x3',
            paddedOwnerAddress,
          ])
        }
      }

      if (configItem.name === 'AccountGuard') {
        if (!this.provider) throw new Error('No provider set')
        if (!this.signerAddress) throw new Error('No signerAddress set')

        if (this.isLocal) {
          const paddedOwnerAddress = ethers.utils.hexZeroPad(this.signerAddress, 32)

          await this.provider.send('hardhat_setStorageAt', [
            contractInstance.address,
            '0x0',
            paddedOwnerAddress,
          ])
        }
      }
      if (configItem.name === 'OperationsRegistry') {
        if (!this.provider) throw new Error('No provider set')
        if (!this.signerAddress) throw new Error('No signerAddress set')

        if (this.isLocal) {
          const paddedOwnerAddress = ethers.utils.hexZeroPad(this.signerAddress, 32)

          await this.provider.send('hardhat_setStorageAt', [
            contractInstance.address,
            '0x1',
            paddedOwnerAddress,
          ])
        }
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

  async deployContracts(addressesConfig: SystemConfigEntry[]) {
    if (!this.signer) throw new Error('Signer not initialized')
    if (this.isRestrictedNetwork) {
      await this.promptBeforeDeployment()
    }
    for (const configItem of addressesConfig) {
      this.log('DEPLOYING ', configItem.name, configItem.address)
      let constructorParams: Array<string | number> = []

      if (configItem.constructorArgs && configItem.constructorArgs?.length !== 0) {
        constructorParams = configItem.constructorArgs.map((param: string | number) => {
          if (typeof param === 'string' && param.indexOf('address:') >= 0) {
            const contractName = (param as string).replace('address:', '') as SystemContracts

            if (!this.deployedSystem[contractName]?.contract.address) {
              throw new Error(`Contract ${contractName} not deployed`)
            }

            return (this.deployedSystem[contractName] as ContractProps).contract.address
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
        this.log(
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
  public async deployContractByName<C extends Contract>(
    contractName: string,
    params: any[],
  ): Promise<C> {
    const factory = await this.ethers.getContractFactory(contractName, this.signer)
    return this.deployContract(factory, params)
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
        (item: SystemConfigEntry) => item.address !== '' && !item.deploy,
      ),
    )
    await this.deployContracts(
      Object.values(this.config.mpa.core).filter((item: SystemConfigEntry) => item.deploy),
    )
  }

  async deployActions() {
    if (!this.config) throw new Error('No config set')
    await this.instantiateContracts(
      Object.values(this.config.mpa.actions).filter(
        (item: SystemConfigEntry) => item.address !== '' && !item.deploy,
      ),
    )
    await this.deployContracts(
      Object.values(this.config.mpa.actions).filter((item: SystemConfigEntry) => item.deploy),
    )
  }

  async deployAll() {
    await this.deployCore()
    await this.deployActions()
    await this.deployTest()
  }

  async deployTest() {
    if (!this.config) throw new Error('No config set')
    if (!this.config.test) return
    await this.deployContracts(
      Object.values(this.config.test).filter((item: SystemConfigEntry) => item.deploy),
    )
  }

  async addCommonEntries() {
    if (!this.config) throw new Error('No config set')
    await this.addRegistryEntries(
      Object.values(this.config.common).filter(
        (item: ConfigEntry) => item.address !== '' && item.serviceRegistryName,
      ),
    )
  }

  async addAaveEntries() {
    if (!this.config) throw new Error('No config set')
    await this.addRegistryEntries(
      Object.values(this.config.aave.v2 || {}).filter(
        (item: ConfigEntry) => item.address !== '' && item.serviceRegistryName,
      ),
    )
    await this.addRegistryEntries(
      Object.values(this.config.aave.v3 || {}).filter(
        (item: ConfigEntry) => item.address !== '' && item.serviceRegistryName,
      ),
    )
  }

  async addMakerEntries() {
    if (!this.config) throw new Error('No config set')
    await this.addRegistryEntries(
      Object.values(this.config.maker.common).filter(
        (item: ConfigEntry) => item.address !== '' && item.serviceRegistryName,
      ),
    )
  }

  async addAjnaEntries() {
    if (!this.config) throw new Error('No config set')
    await this.addRegistryEntries(
      Object.values(this.config.ajna).filter(
        (item: ConfigEntry) => item.address !== '' && item.serviceRegistryName,
      ),
    )
  }

  async addMorphoBlueEntries() {
    if (!this.config) throw new Error('No config set')
    const morpho = Object.values(this.config.morphoblue).filter(
      (item: ConfigEntry) => item.address !== '' && item.serviceRegistryName,
    )
    console.log('MORPHO BLUE ENTRIES', morpho)
    console.log('CONFIG', this.config.morphoblue)
    await this.addRegistryEntries(
      Object.values(this.config.morphoblue).filter(
        (item: ConfigEntry) => item.address !== '' && item.serviceRegistryName,
      ),
    )
  }

  /**
   * Adds operation definitions to the OperationRegistry
   * Operations can be logged out to the console if you set the log flag
   * in the operation definition file @oasisdex/deploy-config/operation-definitions to true
   * Use the logOp helper function to log out the operation
   *
   * Read more at the README at /packages/deploy-configurations/README.md
   */

  async addOperationEntries() {
    if (!this.signer) throw new Error('No signer set')
    if (!this.deployedSystem.OperationsRegistry) throw new Error('No OperationsRegistry deployed')
    const operationsRegistry = new OperationsRegistry(
      this.deployedSystem.OperationsRegistry.contract.address,
      this.signer,
    )

    let network = this.network
    if (this.forkedNetwork) {
      network = this.forkedNetwork
    }

    // AAVE V2
    await operationsRegistry.addOp(
      getAaveOpenV2OperationDefinition(network).name,
      getAaveOpenV2OperationDefinition(network).actions,
    )
    await operationsRegistry.addOp(
      getAaveCloseV2OperationDefinition(network).name,
      getAaveCloseV2OperationDefinition(network).actions,
    )
    await operationsRegistry.addOp(
      getAaveAdjustDownV2OperationDefinition(network).name,
      getAaveAdjustDownV2OperationDefinition(network).actions,
    )
    await operationsRegistry.addOp(
      getAaveAdjustUpV2OperationDefinition(network).name,
      getAaveAdjustUpV2OperationDefinition(network).actions,
    )
    await operationsRegistry.addOp(
      getAavePaybackWithdrawV2OperationDefinition(network).name,
      getAavePaybackWithdrawV2OperationDefinition(network).actions,
    )
    await operationsRegistry.addOp(
      getAaveDepositV2OperationDefinition(network).name,
      getAaveDepositV2OperationDefinition(network).actions,
    )
    await operationsRegistry.addOp(
      getAaveBorrowV2OperationDefinition(network).name,
      getAaveBorrowV2OperationDefinition(network).actions,
    )
    await operationsRegistry.addOp(
      getAaveDepositBorrowV2OperationDefinition(network).name,
      getAaveDepositBorrowV2OperationDefinition(network).actions,
    )

    // AAVE V3
    await operationsRegistry.addOp(
      getAaveOpenV3OperationDefinition(network).name,
      getAaveOpenV3OperationDefinition(network).actions,
    )
    await operationsRegistry.addOp(
      getAaveCloseV3OperationDefinition(network).name,
      getAaveCloseV3OperationDefinition(network).actions,
    )
    await operationsRegistry.addOp(
      getAaveAdjustDownV3OperationDefinition(network).name,
      getAaveAdjustDownV3OperationDefinition(network).actions,
    )
    await operationsRegistry.addOp(
      getAaveAdjustUpV3OperationDefinition(network).name,
      getAaveAdjustUpV3OperationDefinition(network).actions,
    )
    await operationsRegistry.addOp(
      getAavePaybackWithdrawV3OperationDefinition(network).name,
      getAavePaybackWithdrawV3OperationDefinition(network).actions,
    )
    await operationsRegistry.addOp(
      getAaveDepositBorrowV3OperationDefinition(network).name,
      getAaveDepositBorrowV3OperationDefinition(network).actions,
    )
    await operationsRegistry.addOp(
      getAaveOpenDepositBorrowV3OperationDefinition(network).name,
      getAaveOpenDepositBorrowV3OperationDefinition(network).actions,
    )
    await operationsRegistry.addOp(
      getAaveDepositV3OperationDefinition(network).name,
      getAaveDepositV3OperationDefinition(network).actions,
    )
    await operationsRegistry.addOp(
      getAaveBorrowV3OperationDefinition(network).name,
      getAaveBorrowV3OperationDefinition(network).actions,
    )

    await operationsRegistry.addOp(
      getAaveMigrateEOAV3OperationDefinition(network).name,
      getAaveMigrateEOAV3OperationDefinition(network).actions,
    )

    // AJNA
    await operationsRegistry.addOp(
      getAjnaOpenOperationDefinition(network).name,
      getAjnaOpenOperationDefinition(network).actions,
    )
    await operationsRegistry.addOp(
      getAjnaCloseToQuoteOperationDefinition(network).name,
      getAjnaCloseToQuoteOperationDefinition(network).actions,
    )
    await operationsRegistry.addOp(
      getAjnaCloseToCollateralOperationDefinition(network).name,
      getAjnaCloseToCollateralOperationDefinition(network).actions,
    )
    await operationsRegistry.addOp(
      getAjnaAdjustUpOperationDefinition(network).name,
      getAjnaAdjustUpOperationDefinition(network).actions,
    )
    await operationsRegistry.addOp(
      getAjnaAdjustDownOperationDefinition(network).name,
      getAjnaAdjustDownOperationDefinition(network).actions,
    )

    // Spark
    const sparkBorrowOperationDefinition = getSparkBorrowOperationDefinition(network)
    await operationsRegistry.addOp(
      sparkBorrowOperationDefinition.name,
      sparkBorrowOperationDefinition.actions,
    )
    this.logOp(sparkBorrowOperationDefinition)

    const sparkDepositOperationDefinition = getSparkDepositOperationDefinition(network)
    await operationsRegistry.addOp(
      sparkDepositOperationDefinition.name,
      sparkDepositOperationDefinition.actions,
    )
    this.logOp(sparkDepositOperationDefinition)

    const sparkDepositBorrowOperationDefinition = getSparkDepositBorrowOperationDefinition(network)
    await operationsRegistry.addOp(
      sparkDepositBorrowOperationDefinition.name,
      sparkDepositBorrowOperationDefinition.actions,
    )
    this.logOp(sparkDepositBorrowOperationDefinition)

    const sparkOpenDepositBorrowOperationDefinition =
      getSparkOpenDepositBorrowOperationDefinition(network)
    await operationsRegistry.addOp(
      sparkOpenDepositBorrowOperationDefinition.name,
      sparkOpenDepositBorrowOperationDefinition.actions,
    )
    this.logOp(sparkOpenDepositBorrowOperationDefinition)

    const sparkPaybackWithdrawOperationDefinition =
      getSparkPaybackWithdrawOperationDefinition(network)
    await operationsRegistry.addOp(
      sparkPaybackWithdrawOperationDefinition.name,
      sparkPaybackWithdrawOperationDefinition.actions,
    )
    this.logOp(sparkPaybackWithdrawOperationDefinition)

    const sparkOpenOperationDefinition = getSparkOpenOperationDefinition(network)
    await operationsRegistry.addOp(
      sparkOpenOperationDefinition.name,
      sparkOpenOperationDefinition.actions,
    )
    this.logOp(sparkOpenOperationDefinition)

    const sparkCloseOperationDefinition = getSparkCloseOperationDefinition(network)
    await operationsRegistry.addOp(
      sparkCloseOperationDefinition.name,
      sparkCloseOperationDefinition.actions,
    )
    this.logOp(sparkCloseOperationDefinition)

    const sparkAdjustUpOperationDefinition = getSparkAdjustUpOperationDefinition(network)
    await operationsRegistry.addOp(
      sparkAdjustUpOperationDefinition.name,
      sparkAdjustUpOperationDefinition.actions,
    )
    this.logOp(sparkAdjustUpOperationDefinition)

    const sparkAdjustDownOperationDefinition = getSparkAdjustDownOperationDefinition(network)
    await operationsRegistry.addOp(
      sparkAdjustDownOperationDefinition.name,
      sparkAdjustDownOperationDefinition.actions,
    )
    this.logOp(sparkAdjustDownOperationDefinition)

    // MorphoBlue
    const morphoblueBorrowOperationDefinition = getMorphoBlueBorrowOperationDefinition(network)
    await operationsRegistry.addOp(
      morphoblueBorrowOperationDefinition.name,
      morphoblueBorrowOperationDefinition.actions,
    )
    this.logOp(morphoblueBorrowOperationDefinition)

    const morphoblueDepositOperationDefinition = getMorphoBlueDepositOperationDefinition(network)
    await operationsRegistry.addOp(
      morphoblueDepositOperationDefinition.name,
      morphoblueDepositOperationDefinition.actions,
    )
    this.logOp(morphoblueDepositOperationDefinition)

    const morphoblueDepositBorrowOperationDefinition =
      getMorphoBlueDepositBorrowOperationDefinition(network)
    await operationsRegistry.addOp(
      morphoblueDepositBorrowOperationDefinition.name,
      morphoblueDepositBorrowOperationDefinition.actions,
    )
    this.logOp(morphoblueDepositBorrowOperationDefinition)

    const morphoblueOpenDepositBorrowOperationDefinition =
      getMorphoBlueOpenDepositBorrowOperationDefinition(network)
    await operationsRegistry.addOp(
      morphoblueOpenDepositBorrowOperationDefinition.name,
      morphoblueOpenDepositBorrowOperationDefinition.actions,
    )
    this.logOp(morphoblueOpenDepositBorrowOperationDefinition)

    const morphobluePaybackWithdrawOperationDefinition =
      getMorphoBluePaybackWithdrawOperationDefinition(network)
    await operationsRegistry.addOp(
      morphobluePaybackWithdrawOperationDefinition.name,
      morphobluePaybackWithdrawOperationDefinition.actions,
    )
    this.logOp(morphobluePaybackWithdrawOperationDefinition)

    const morphoblueOpenOperationDefinition = getMorphoBlueOpenOperationDefinition(network)
    await operationsRegistry.addOp(
      morphoblueOpenOperationDefinition.name,
      morphoblueOpenOperationDefinition.actions,
    )
    this.logOp(morphoblueOpenOperationDefinition)

    const morphoblueCloseOperationDefinition = getMorphoBlueCloseOperationDefinition(network)
    await operationsRegistry.addOp(
      morphoblueCloseOperationDefinition.name,
      morphoblueCloseOperationDefinition.actions,
    )
    this.logOp(morphoblueCloseOperationDefinition)

    const morphoblueAdjustUpOperationDefinition = getMorphoBlueAdjustUpOperationDefinition(network)
    await operationsRegistry.addOp(
      morphoblueAdjustUpOperationDefinition.name,
      morphoblueAdjustUpOperationDefinition.actions,
    )
    this.logOp(morphoblueAdjustUpOperationDefinition)

    const morphoblueAdjustDownOperationDefinition =
      getMorphoBlueAdjustDownOperationDefinition(network)
    await operationsRegistry.addOp(
      morphoblueAdjustDownOperationDefinition.name,
      morphoblueAdjustDownOperationDefinition.actions,
    )
    this.logOp(morphoblueAdjustDownOperationDefinition)

    const sparkMigrateEOAOperationDefinition = getSparkMigrateEOAOperationDefinition(network)
    await operationsRegistry.addOp(
      sparkMigrateEOAOperationDefinition.name,
      sparkMigrateEOAOperationDefinition.actions,
    )
    this.logOp(sparkMigrateEOAOperationDefinition)

  }

  async addAllEntries() {
    await this.addCommonEntries()
    await this.addAaveEntries()
    await this.addMakerEntries()
    await this.addAjnaEntries()
    await this.addMorphoBlueEntries()
    await this.addOperationEntries()
  }

  // TODO unify resetNode and resetNodeToLatestBlock into one function
  async resetNode(blockNumber: number) {
    if (this.network !== Network.HARDHAT) {
      console.log('Not resetting node, not on hardhat network')
      return
    }
    if (!this.provider) throw new Error('No provider set')
    this.log(`\x1b[90mResetting fork to block number: ${blockNumber} using ${this.rpcUrl} \x1b[0m`)
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
    if (this.network !== Network.HARDHAT) {
      console.log('Not resetting node, not on hardhat network')
      return
    }
    if (!this.provider) throw new Error('No provider set')
    await this.provider.send('hardhat_reset', [
      {
        forking: {
          jsonRpcUrl: this.rpcUrl,
        },
      },
    ])
  }

  getSystem(): System {
    if (!this.serviceRegistryHelper) throw new Error('No service registry helper set')
    if (!this.config) throw new Error('No config set')
    return {
      system: this.deployedSystem as DeployedSystem,
      registry: this.serviceRegistryHelper,
      config: this.config,
    }
  }
}
