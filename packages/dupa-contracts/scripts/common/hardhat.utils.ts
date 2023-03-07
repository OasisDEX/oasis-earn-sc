import '@nomiclabs/hardhat-ethers'

import axios from 'axios'
import BigNumber from 'bignumber.js'
import {
  BaseContract,
  BigNumber as EthersBN,
  CallOverrides,
  constants,
  Contract,
  ethers,
  Signer,
  utils,
} from 'ethers'
import { HardhatRuntimeEnvironment } from 'hardhat/types/runtime'
import NodeCache from 'node-cache'
import { hasPath } from 'ramda'

import DS_PROXY_REGISTRY_ABI from '../../abi/ds-proxy-registry.json'
import { coalesceNetwork, ETH_ADDRESS, getAddressesFor } from './addresses'
import { DeployedSystem } from './deploy-system'
import { EtherscanGasPrice, Network } from './types'
import { CONTRACT_NAMES } from "@oasisdex/dupa-library/src";

export class HardhatUtils {
  private readonly _cache = new NodeCache()
  public readonly addresses

  constructor(public readonly hre: HardhatRuntimeEnvironment, public readonly forked?: Network) {
    this.addresses = getAddressesFor(this.forked || this.hre.network.name)
  }

  public get targetNetwork() {
    return coalesceNetwork(this.forked || (this.hre.network.name as Network))
  }

  public logNetworkInfo() {
    console.log(`Network: ${this.hre.network.name}. Using addresses from ${this.targetNetwork}\n`)
  }

  public async getDefaultSystem(): Promise<DeployedSystem> {
    return {
      serviceRegistry: await this.getContractAt(
        'ServiceRegistry',
        this.addresses.AUTOMATION_SERVICE_REGISTRY,
      ),
      operationExecutor: await this.getContractAt(
        CONTRACT_NAMES.common.OPERATION_EXECUTOR,
        this.addresses.OPERATION_EXECUTOR,
      ),
      operationsRegistry: await this.getContractAt(
        CONTRACT_NAMES.common.OPERATIONS_REGISTRY,
        this.addresses.OPERATIONS_REGISTRY,
      ),
      operationStorage: await this.getContractAt(
        CONTRACT_NAMES.common.OPERATION_STORAGE,
        this.addresses.OPERATION_STORAGE,
      ),
      swap: await this.getContractAt(CONTRACT_NAMES.common.SWAP, this.addresses.SWAP),
      cdpAllow: await this.getContractAt(
        CONTRACT_NAMES.maker.CDP_ALLOW,
        this.addresses.CDP_ALLOW_ACTION,
      ),
      makerOpenVault: await this.getContractAt(
        CONTRACT_NAMES.maker.OPEN_VAULT,
        this.addresses.MAKER_OPEN_VAULT_ACTION,
      ),
      makerDeposit: await this.getContractAt(
        CONTRACT_NAMES.maker.DEPOSIT,
        this.addresses.MAKER_DEPOSIT_ACTION,
      ),
      makerGenerate: await this.getContractAt(
        CONTRACT_NAMES.maker.GENERATE,
        this.addresses.MAKER_GENERATE_ACTION,
      ),
      makerPayback: await this.getContractAt(
        CONTRACT_NAMES.maker.PAYBACK,
        this.addresses.MAKER_PAYBACK_ACTION,
      ),
      makerWithdraw: await this.getContractAt(
        CONTRACT_NAMES.maker.WITHDRAW,
        this.addresses.MAKER_WITHDRAW_ACTION,
      ),
      aaveBorrow: await this.getContractAt(
        CONTRACT_NAMES.aave.v2.BORROW,
        this.addresses.AAVE_BORROW_ACTION,
      ),
      aaveDeposit: await this.getContractAt(
        CONTRACT_NAMES.aave.v2.DEPOSIT,
        this.addresses.AAVE_DEPOSIT_ACTION,
      ),
      aaveWithdraw: await this.getContractAt(
        CONTRACT_NAMES.aave.v2.WITHDRAW,
        this.addresses.AAVE_WITHDRAW_ACTION,
      ),
      aavePayback: await this.getContractAt(
        CONTRACT_NAMES.aave.v2.PAYBACK,
        this.addresses.AAVE_PAYBACK_ACTION,
      ),
      pullToken: await this.getContractAt(
        CONTRACT_NAMES.common.PULL_TOKEN,
        this.addresses.PULL_TOKEN_ACTION,
      ),
      sendToken: await this.getContractAt(
        CONTRACT_NAMES.common.SEND_TOKEN,
        this.addresses.SEND_TOKEN_ACTION,
      ),
      setApproval: await this.getContractAt(
        CONTRACT_NAMES.common.SET_APPROVAL,
        this.addresses.SET_APPROVAL_ACTION,
      ),
      swapAction: await this.getContractAt(
        CONTRACT_NAMES.common.SWAP_ACTION,
        this.addresses.SWAP_ACTION,
      ),
      takeFlashloan: await this.getContractAt(
        CONTRACT_NAMES.common.TAKE_A_FLASHLOAN,
        this.addresses.TAKE_FLASHLOAN_ACTION,
      ),
      unwrapEth: await this.getContractAt(
        CONTRACT_NAMES.common.UNWRAP_ETH,
        this.addresses.UNWRAP_ETH_ACTION,
      ),
      wrapEth: await this.getContractAt(
        CONTRACT_NAMES.common.WRAP_ETH,
        this.addresses.WRAP_ETH_ACTION,
      ),
      returnFunds: await this.getContractAt(
        CONTRACT_NAMES.common.RETURN_FUNDS,
        this.addresses.RETURN_FUNDS_ACTION,
      ),
      positionCreated: await this.getContractAt(
        CONTRACT_NAMES.common.POSITION_CREATED,
        this.addresses.POSITION_CREATED_ACTION,
      ),
    }
  }

  // hre.ethers.getContractAt will throw an error if the provided adddres is equal to 0x
  // We would like to handle this situation but returned an object that contains the 0x as an address
  // This is explicitly related to out functionality.
  // The idea is that we have a configuration <key=value> with dupa-contracts.
  // For each contract name there is either the real blockchain address or 0x.
  // 0x is provided when there is no deployed version of the given contract.
  // A login in the deployment process will deploy a new version of the contract if it see that the address is 0x
  // otherwise it will use an instance of that smart contract.
  public async getContractAt(name: string, address: string): Promise<any> {
    try {
      return await this.hre.ethers.getContractAt(name, address)
    } catch {
      return {
        address: constants.AddressZero,
      } as BaseContract
    }
  }

  public async deployContract<F extends ethers.ContractFactory, C extends Contract>(
    _factory: F | Promise<F>,
    params: Parameters<F['deploy']>,
  ): Promise<C> {
    const factory = await _factory
    const deployment = await factory.deploy(...params, await this.getGasSettings())
    return (await deployment.deployed()) as C
  }

  public mpaServiceRegistry() {
    return {
      jug: this.addresses.MCD_JUG,
      manager: this.addresses.CDP_MANAGER,
      multiplyProxyActions: this.addresses.MULTIPLY_PROXY_ACTIONS,
      lender: this.addresses.MCD_FLASH,
      feeRecepient: '0x79d7176aE8F93A04bC73b9BC710d4b44f9e362Ce',
      exchange: '0xb5eB8cB6cED6b6f8E13bcD502fb489Db4a726C7B',
    }
  }

  public async getOrCreateProxy(address: string, signer: Signer) {
    const proxyRegistry = await this.hre.ethers.getContractAt(
      DS_PROXY_REGISTRY_ABI,
      this.addresses.PROXY_REGISTRY,
    )

    await proxyRegistry.connect(signer)

    let proxyAddr = await proxyRegistry.proxies(address)
    if (proxyAddr === constants.AddressZero) {
      await (await proxyRegistry['build()']()).wait()
      proxyAddr = await proxyRegistry.proxies(address)
    }

    return await this.hre.ethers.getContractAt('DSProxy', proxyAddr, signer)
  }

  public async cancelTx(nonce: number, gasPriceInGwei: number, signer: Signer) {
    console.log(`🛰 Replacing tx with nonce ${nonce}`)
    const tx = await signer.sendTransaction({
      value: 0,
      gasPrice: gasPriceInGwei * 1000_000_000,
      to: await signer.getAddress(),
    })
    console.log(`🛰 Tx sent ${tx.hash}`)
  }

  public async send(tokenAddr: string, to: string, amount: number) {
    const tokenContract = await this.hre.ethers.getContractAt('IERC20', tokenAddr)
    await tokenContract.transfer(to, amount)
  }

  public async sendEther(signer: Signer, to: string, amount: string) {
    const txObj = await signer.populateTransaction({
      to,
      value: utils.parseUnits(amount, 18),
      gasLimit: 300000,
    })
    await signer.sendTransaction(txObj)
  }

  public async impersonate(user: string): Promise<Signer> {
    await this.impersonateAccount(user)
    const newSigner = await this.hre.ethers.getSigner(user)
    return newSigner
  }

  public async timeTravel(timeIncrease: number) {
    await this.hre.network.provider.request({
      method: 'evm_increaseTime',
      params: [timeIncrease],
    })
  }

  public async balanceOf(tokenAddr: string, addr: string) {
    const tokenContract = await this.hre.ethers.getContractAt('IERC20', tokenAddr)

    return tokenAddr.toLowerCase() === ETH_ADDRESS.toLowerCase()
      ? await this.hre.ethers.provider.getBalance(addr)
      : await tokenContract.balanceOf(addr)
  }

  public async setNewExchangeWrapper(acc: Signer, newAddr: string) {
    const exchangeOwnerAddr = '0xBc841B0dE0b93205e912CFBBd1D0c160A1ec6F00' // TODO:
    await this.sendEther(acc, exchangeOwnerAddr, '1')
    await this.impersonateAccount(exchangeOwnerAddr)

    const signer = this.hre.ethers.provider.getSigner(exchangeOwnerAddr)

    const registryInstance = await this.hre.ethers.getContractFactory('SaverExchangeRegistry')
    const registry = registryInstance.attach('0x25dd3F51e0C3c3Ff164DDC02A8E4D65Bb9cBB12D')
    const registryByOwner = registry.connect(signer)

    await registryByOwner.addWrapper(newAddr, { gasLimit: 300000 })
    await this.stopImpersonatingAccount(exchangeOwnerAddr)
  }

  private async impersonateAccount(account: string) {
    await this.hre.network.provider.request({
      method: 'hardhat_impersonateAccount',
      params: [account],
    })
  }

  private async stopImpersonatingAccount(account: string) {
    await this.hre.network.provider.request({
      method: 'hardhat_stopImpersonatingAccount',
      params: [account],
    })
  }

  private abiEncodeArgs(deployed: any, contractArgs: any[]) {
    // not writing abi encoded args if this does not pass
    if (!contractArgs || !deployed || hasPath(['interface', 'deploy'], deployed)) {
      return ''
    }
    const encoded = utils.defaultAbiCoder.encode(deployed.interface.deploy.inputs, contractArgs)
    return encoded
  }

  public convertToWeth(tokenAddr: string) {
    return this.isEth(tokenAddr) ? this.addresses.WETH : tokenAddr
  }

  public async setBudInOSM(osmAddress: string, budAddress: string) {
    const BUD_MAPPING_STORAGE_SLOT = 5
    const toHash = utils.defaultAbiCoder.encode(
      ['address', 'uint'],
      [budAddress, BUD_MAPPING_STORAGE_SLOT],
    )
    const valueSlot = utils.keccak256(toHash).replace(/0x0/g, '0x')

    await this.hre.ethers.provider.send('hardhat_setStorageAt', [
      osmAddress,
      valueSlot,
      '0x0000000000000000000000000000000000000000000000000000000000000001',
    ])
    await this.hre.ethers.provider.send('evm_mine', [])
  }

  private isEth(tokenAddr: string) {
    return tokenAddr.toLowerCase() === ETH_ADDRESS.toLowerCase()
  }

  public async getIlkData(ilk: string, opts?: CallOverrides) {
    if (!opts) {
      opts = {}
    }

    const ilkRegistry = new this.hre.ethers.Contract(
      this.addresses.ILK_REGISTRY,
      [
        'function join(bytes32) view returns (address)',
        'function gem(bytes32) view returns (address)',
        'function dec(bytes32) view returns (uint256)',
      ],
      this.hre.ethers.provider,
    )

    const [gem, gemJoin, ilkDecimals] = await Promise.all([
      ilkRegistry.gem(ilk, opts),
      ilkRegistry.join(ilk, opts),
      ilkRegistry.dec(ilk, opts),
    ])

    return {
      gem,
      gemJoin,
      ilkDecimals: ilkDecimals.toNumber() as number,
    }
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
}
