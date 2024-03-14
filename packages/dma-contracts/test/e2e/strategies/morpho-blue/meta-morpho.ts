import {
  AaveProtocolDataProvider,
  AccountImplementation,
  AccountImplementation__factory,
  ERC20,
  ERC20__factory,
  WETH,
  WETH__factory,
} from '@abis/types/ethers-contracts'
import { ADDRESSES } from '@deploy-configurations/addresses'
import { DeployedSystem } from '@deploy-configurations/types/deployed-system'
import { Network } from '@deploy-configurations/types/network'
import { getNetwork } from '@deploy-configurations/utils/network'
import { ONE } from '@dma-common/constants'
import { addressesByNetwork, createDPMAccount, oneInchCallMock } from '@dma-common/test-utils'
import { RuntimeConfig } from '@dma-common/types/common'
import { amountToWei, getEvents } from '@dma-common/utils/common'
import { restoreSnapshot, Snapshot, TestDeploymentSystem, TestHelpers } from '@dma-contracts/utils'
import { strategies, views } from '@dma-library'
import { AaveLikeStrategyAddresses } from '@dma-library/operations/aave-like'
import { impersonateAccount, setBalance } from '@nomicfoundation/hardhat-network-helpers'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { IERC4626__factory } from '@typechain'
import BigNumber from 'bignumber.js'
import { expect } from 'chai'
import { ethers } from 'ethers'
import hre from 'hardhat'
const VAULT_ADDRESS = '0xBEEF01735c132Ada46AA9aA4c54623cAA92A64CB'
const USER = '0x63C6139e8275391adA0e2a59d1599066243747c2'

import { getOneInchCall } from './one-inch-utils/one-inch-swap'

const getLazyVaultSubgraphResponse = (vaultAddress: string, proxy: string) => {
  return Promise.resolve({
    shares: '0',
    id: vaultAddress,
    vault: {
      fee: '0',
      curator: '0',
      totalAssets: '0',
      totalShares: '0',
      interestRates: [],
    },
    earnCumulativeFeesUSD: '0',
    earnCumulativeDepositUSD: '0',
    earnCumulativeWithdrawUSD: '0',
    earnCumulativeFeesInQuoteToken: '0',
    earnCumulativeDepositInQuoteToken: '0',
    earnCumulativeWithdrawInQuoteToken: '0',

    positions: [],
  })
}
const getVaultApyParameters = (vaultAddress: string) => {
  return Promise.resolve({
    vault: {
      apy: '0',
      curator: 'xx',
      fee: 'xx',
    },
  })
}

describe.only('Deposit | ERC4626 | E2E', async () => {
  /* eslint-disable @typescript-eslint/no-unused-vars */
  let snapshot: Snapshot
  let provider: ethers.providers.JsonRpcProvider
  let signer: SignerWithAddress
  let owner: ethers.Signer
  let address: string
  let WETH: WETH
  let USDC: ERC20

  let aavePoolDataProvider: AaveProtocolDataProvider
  let dpmAccount: AccountImplementation
  let config: RuntimeConfig
  let system: DeployedSystem
  let testSystem: TestDeploymentSystem
  let helpers: TestHelpers
  let network: Network
  let addresses: ReturnType<typeof addressesByNetwork>
  let aaveLikeAddresses: AaveLikeStrategyAddresses

  beforeEach(async () => {
    console.log('Restoring snapshot')
    ;({ snapshot } = await restoreSnapshot(
      {
        hre,
        blockNumber: 19383283,
        useFallbackSwap: false,
        debug: true,
        skipSnapshot: false,
      },
      [],
    ))

    console.log('snapshot restored')
    signer = await SignerWithAddress.create(
      snapshot.config.signer as ethers.providers.JsonRpcSigner,
    )
    await impersonateAccount('0x63C6139e8275391adA0e2a59d1599066243747c2')
    owner = hre.ethers.provider.getSigner('0x63C6139e8275391adA0e2a59d1599066243747c2')
    provider = signer.provider as ethers.providers.JsonRpcProvider

    address = await owner.getAddress()

    console.log('Address: ', address)

    system = snapshot.testSystem.deployment.system
    testSystem = snapshot.testSystem
    config = snapshot.config
    helpers = snapshot.testSystem.helpers

    network = await getNetwork(config.provider)

    WETH = WETH__factory.connect(ADDRESSES[network].common.WETH, config.signer)
    USDC = ERC20__factory.connect(ADDRESSES[network].common.USDC, config.signer)

    addresses = addressesByNetwork(Network.MAINNET)

    aaveLikeAddresses = {
      tokens: {
        WETH: WETH.address,
        DAI: ADDRESSES[network].common.DAI,
        USDC: USDC.address,
        ETH: ADDRESSES[network].common.ETH,
      },
      operationExecutor: system.OperationExecutor.contract.address,
      chainlinkEthUsdPriceFeed: addresses.chainlinkEthUsdPriceFeed,
      oracle: addresses.aaveOracle,
      lendingPool: addresses.pool,
      poolDataProvider: addresses.poolDataProvider,
    }

    await system.AccountGuard.contract.setWhitelist(system.OperationExecutor.contract.address, true)

    const [dpmProxy] = await createDPMAccount(
      system.AccountFactory.contract,
      await owner.getAddress(),
    )

    if (!dpmProxy) {
      throw new Error('Failed to create DPM proxy')
    }

    dpmAccount = AccountImplementation__factory.connect(dpmProxy, owner)

    await system.OperationsRegistry.contract.addOperation({
      actions: [
        '0x79f0e71ed647d96e08c6053ffaa360fb71487ea6066544a94fa7dc52df7df26e',
        '0x9f9d224c26adad40cade24655f1c5e3cf307c390fc6874e710cb56bdd504bc26',
        '0xb8020e49c93f2144cdce5b93dc159b086f98dcfba95a09eec862664fbfa6a8a4',
        '0x166438e3cb190ad4e896f7b4bd36c98f5b7dc3f5eb885f019521b3b819bc0de8',
        '0x166438e3cb190ad4e896f7b4bd36c98f5b7dc3f5eb885f019521b3b819bc0de8',
      ],
      optional: [false, true, true, false, true],
      name: 'ERC4626Withdraw',
    })
    await system.OperationsRegistry.contract.addOperation({
      actions: [
        '0x98203051894747605630ba7bcee424c0ec4e2f7d74e8e9d5a195b7eeba3cbd10',
        '0xae6d6b87bd69704c742ef3ff051d31d411798b8403cab6cb2d94a7ba91661f7d',
        '0x9f9d224c26adad40cade24655f1c5e3cf307c390fc6874e710cb56bdd504bc26',
        '0x36303c18db5a95d0dd17b9bac9bc1dbd0130264cd8a04fb5e9b427a3a03ad49e',
        '0xe2675cf8dabe9838c0788d7f687169e95d73004dfe8f1653e42314fe5688721e',
        '0x29732f3b4202acea9e682f5fafacfe4172f3140412e66931b5d00a4dda200962',
      ],
      optional: [true, true, true, false, false, true],
      name: 'ERC4626Deposit',
    })
  })

  it('should deposit 1000 USDC to Steakhosue USDC Metamorpho Vault, emit `CreatePosition` event on first deposit, and withdraw all funds', async () => {
    const usdcBalanceBeforeDeposit = await USDC.balanceOf(address)

    const depositAmount = new BigNumber('1000')

    console.log('Deposit amount                     : ', depositAmount.toString())
    // approve USDC to DPM
    await USDC.connect(owner).approve(dpmAccount.address, amountToWei(depositAmount, 6).toString())

    const result = await strategies.common.erc4626.deposit(
      {
        vault: VAULT_ADDRESS,
        depositTokenAddress: USDC.address,
        depositTokenPrecision: 6,
        depositTokenSymbol: 'USDC',
        pullTokenAddress: USDC.address,
        pullTokenPrecision: 6,
        pullTokenSymbol: 'USDC',
        amount: depositAmount,
        proxyAddress: dpmAccount.address,
        slippage: new BigNumber(0.25),
        user: address,
        quoteTokenPrice: new BigNumber(1),
      },
      {
        provider: provider,
        addresses: aaveLikeAddresses,
        network: network,
        operationExecutor: aaveLikeAddresses.operationExecutor,
        getSwapData: oneInchCallMock(ONE.div(new BigNumber(3500)), {
          from: 6,
          to: 6,
        }),
        getLazyVaultSubgraphResponse,
        getVaultApyParameters,
      },
    )

    const tx = await dpmAccount.execute(system.OperationExecutor.contract.address, result.tx.data, {
      gasLimit: 5000000,
    })
    const receipt = await tx.wait()
    const events = getEvents(
      receipt,
      testSystem.deployment.system.PositionCreated.contract.interface.getEvent('CreatePosition'),
    )
    expect(events.length).to.eq(1)
    expect(events[0].args?.protocol).to.eq(`erc4626-${VAULT_ADDRESS.toLowerCase()}`)

    const usdcBalanceAfterDeposit = await USDC.balanceOf(address)

    const { shares: sharesAfterDeposit, balance: balanceAfterDeposit } =
      await getProxyShareAndDeposit(owner, dpmAccount)

    // expect(balanceAfterDeposit.toString()).to.equal(depositAmount.minus(1).toString())
    const closeCalldata = await strategies.common.erc4626.withdraw(
      {
        vault: VAULT_ADDRESS,
        withdrawTokenAddress: USDC.address,
        withdrawTokenPrecision: 6,
        withdrawTokenSymbol: 'USDC',
        returnTokenAddress: USDC.address,
        returnTokenPrecision: 6,
        returnTokenSymbol: 'USDC',
        amount: depositAmount.times(2),
        proxyAddress: dpmAccount.address,
        slippage: new BigNumber(0.25),
        user: address,
        quoteTokenPrice: new BigNumber(1),
      },
      {
        provider: provider,
        addresses: aaveLikeAddresses,
        network: network,
        operationExecutor: aaveLikeAddresses.operationExecutor,
        getSwapData: oneInchCallMock(ONE.div(new BigNumber(3500)), {
          from: 6,
          to: 6,
        }),
        getLazyVaultSubgraphResponse,
        getVaultApyParameters,
      },
    )

    const tx2 = await dpmAccount.execute(
      system.OperationExecutor.contract.address,
      closeCalldata.tx.data,
      {
        gasLimit: 5000000,
      },
    )
    await tx2.wait()
    const usdcBalanceAfterWithdrawal = await USDC.balanceOf(address)
    const { shares: sharesAfterWithdraw, balance: balanceAfterWithdraw } =
      await getProxyShareAndDeposit(owner, dpmAccount)
    console.log('Position shares after deposit      : ', sharesAfterDeposit.toString())
    console.log(
      'Position balance after deposit     : ',
      ethers.utils.formatUnits(balanceAfterDeposit, 6).toString(),
    )

    console.log('Position shares after withdraw     : ', sharesAfterWithdraw.toString())
    console.log(
      'Position  balance after withdraw   : ',
      ethers.utils.formatUnits(balanceAfterWithdraw, 6).toString(),
    )

    console.log(
      'User USDC balance before deposit   : ',
      ethers.utils.formatUnits(usdcBalanceBeforeDeposit, 6).toString(),
    )
    console.log(
      'User USDC balance after deposit    : ',
      ethers.utils.formatUnits(usdcBalanceAfterDeposit, 6).toString(),
    )
    console.log(
      'User USDC balance after withdrawal : ',
      ethers.utils.formatUnits(usdcBalanceAfterWithdrawal, 6).toString(),
    )
    console.log(
      'User USDC balance diff             : ',
      ethers.utils
        .formatUnits(usdcBalanceBeforeDeposit.sub(usdcBalanceAfterWithdrawal), 6)
        .toString(),
    )
  })
  it('should deposit 1000 USDC to Steakhosue USDC Metamorpho Vault and emit `CreatePosition` event on first deposit, and withdraw 50% of funds', async () => {
    const usdcBalanceBeforeDeposit = await USDC.balanceOf(address)

    const depositAmount = new BigNumber('1000')

    console.log('Deposit amount                     : ', depositAmount.toString())
    // approve USDC to DPM
    await USDC.connect(owner).approve(dpmAccount.address, amountToWei(depositAmount, 6).toString())

    const result = await strategies.common.erc4626.deposit(
      {
        vault: VAULT_ADDRESS,
        depositTokenAddress: USDC.address,
        depositTokenPrecision: 6,
        depositTokenSymbol: 'USDC',
        pullTokenAddress: USDC.address,
        pullTokenPrecision: 6,
        pullTokenSymbol: 'USDC',
        amount: depositAmount,
        proxyAddress: dpmAccount.address,
        slippage: new BigNumber(0.25),
        user: address,
        quoteTokenPrice: new BigNumber(1),
      },
      {
        provider: provider,
        addresses: aaveLikeAddresses,
        network: network,
        operationExecutor: aaveLikeAddresses.operationExecutor,
        getSwapData: oneInchCallMock(ONE.div(new BigNumber(3500)), {
          from: 6,
          to: 6,
        }),
        getLazyVaultSubgraphResponse,
        getVaultApyParameters,
      },
    )

    const tx = await dpmAccount.execute(system.OperationExecutor.contract.address, result.tx.data, {
      gasLimit: 5000000,
    })
    const receipt = await tx.wait()
    const events = getEvents(
      receipt,
      testSystem.deployment.system.PositionCreated.contract.interface.getEvent('CreatePosition'),
    )

    expect(events.length).to.eq(1)
    expect(events[0].args?.protocol).to.eq(`erc4626-${VAULT_ADDRESS.toLowerCase()}`)

    const usdcBalanceAfterDeposit = await USDC.balanceOf(address)

    const { shares: sharesAfterDeposit, balance: balanceAfterDeposit } =
      await getProxyShareAndDeposit(owner, dpmAccount)

    // expect(balanceAfterDeposit.toString()).to.equal(depositAmount.minus(1).toString())
    const closeCalldata = await strategies.common.erc4626.withdraw(
      {
        vault: VAULT_ADDRESS,
        withdrawTokenAddress: USDC.address,
        withdrawTokenPrecision: 6,
        withdrawTokenSymbol: 'USDC',
        returnTokenAddress: USDC.address,
        returnTokenPrecision: 6,
        returnTokenSymbol: 'USDC',
        amount: depositAmount.times(0.5),
        proxyAddress: dpmAccount.address,
        slippage: new BigNumber(0.25),
        user: address,
        quoteTokenPrice: new BigNumber(1),
      },
      {
        provider: provider,
        addresses: aaveLikeAddresses,
        network: network,
        operationExecutor: aaveLikeAddresses.operationExecutor,
        getSwapData: oneInchCallMock(ONE.div(new BigNumber(3500)), {
          from: 6,
          to: 6,
        }),
        getLazyVaultSubgraphResponse,
        getVaultApyParameters,
      },
    )

    const tx2 = await dpmAccount.execute(
      system.OperationExecutor.contract.address,
      closeCalldata.tx.data,
      {
        gasLimit: 5000000,
      },
    )
    await tx2.wait()
    const usdcBalanceAfterWithdrawal = await USDC.balanceOf(address)
    const { shares: sharesAfterWithdraw, balance: balanceAfterWithdraw } =
      await getProxyShareAndDeposit(owner, dpmAccount)
    console.log('Position shares after deposit      : ', sharesAfterDeposit.toString())
    console.log(
      'Position balance after deposit     : ',
      ethers.utils.formatUnits(balanceAfterDeposit, 6).toString(),
    )

    console.log('Position shares after withdraw     : ', sharesAfterWithdraw.toString())
    console.log(
      'Position  balance after withdraw   : ',
      ethers.utils.formatUnits(balanceAfterWithdraw, 6).toString(),
    )

    console.log(
      'User USDC balance before deposit   : ',
      ethers.utils.formatUnits(usdcBalanceBeforeDeposit, 6).toString(),
    )
    console.log(
      'User USDC balance after deposit    : ',
      ethers.utils.formatUnits(usdcBalanceAfterDeposit, 6).toString(),
    )
    console.log(
      'User USDC balance after withdrawal : ',
      ethers.utils.formatUnits(usdcBalanceAfterWithdrawal, 6).toString(),
    )
    console.log(
      'User USDC balance diff             : ',
      ethers.utils
        .formatUnits(usdcBalanceBeforeDeposit.sub(usdcBalanceAfterWithdrawal), 6)
        .toString(),
    )
  })
  it('should deposit 1000 USDC to Steakhosue USDC Metamorpho Vault and emit `CreatePosition` event on first deposit, deposit another 1000USDC with no `CreatePosition` event', async () => {
    const usdcBalanceBeforeDeposit = await USDC.balanceOf(address)

    const depositAmount = new BigNumber('1000')

    console.log('Deposit amount                     : ', depositAmount.toString())
    // approve USDC to DPM
    await USDC.connect(owner).approve(
      dpmAccount.address,
      amountToWei(depositAmount.times(2), 6).toString(),
    )

    const result = await strategies.common.erc4626.deposit(
      {
        vault: VAULT_ADDRESS,
        depositTokenAddress: USDC.address,
        depositTokenPrecision: 6,
        depositTokenSymbol: 'USDC',
        pullTokenAddress: USDC.address,
        pullTokenPrecision: 6,
        pullTokenSymbol: 'USDC',
        amount: depositAmount,
        proxyAddress: dpmAccount.address,
        slippage: new BigNumber(0.25),
        user: address,
        quoteTokenPrice: new BigNumber(1),
      },
      {
        provider: provider,
        addresses: aaveLikeAddresses,
        network: network,
        operationExecutor: aaveLikeAddresses.operationExecutor,
        getSwapData: oneInchCallMock(ONE.div(new BigNumber(3500)), {
          from: 6,
          to: 6,
        }),
        getLazyVaultSubgraphResponse,
        getVaultApyParameters,
      },
    )

    const tx = await dpmAccount.execute(system.OperationExecutor.contract.address, result.tx.data, {
      gasLimit: 5000000,
    })
    const receipt = await tx.wait()
    const events = getEvents(
      receipt,
      testSystem.deployment.system.PositionCreated.contract.interface.getEvent('CreatePosition'),
    )
    expect(events.length).to.eq(1)
    expect(events[0].args?.protocol).to.eq(`erc4626-${VAULT_ADDRESS.toLowerCase()}`)

    const usdcBalanceAfterDeposit = await USDC.balanceOf(address)

    const { shares: sharesAfterDeposit, balance: balanceAfterDeposit } =
      await getProxyShareAndDeposit(owner, dpmAccount)

    // expect(balanceAfterDeposit.toString()).to.equal(depositAmount.minus(1).toString())
    const secondDeposit = await strategies.common.erc4626.deposit(
      {
        vault: VAULT_ADDRESS,
        depositTokenAddress: USDC.address,
        depositTokenPrecision: 6,
        depositTokenSymbol: 'USDC',
        pullTokenAddress: USDC.address,
        pullTokenPrecision: 6,
        pullTokenSymbol: 'USDC',
        amount: depositAmount,
        proxyAddress: dpmAccount.address,
        slippage: new BigNumber(0.25),
        user: address,
        quoteTokenPrice: new BigNumber(1),
      },
      {
        provider: provider,
        addresses: aaveLikeAddresses,
        network: network,
        operationExecutor: aaveLikeAddresses.operationExecutor,
        getSwapData: oneInchCallMock(ONE.div(new BigNumber(3500)), {
          from: 6,
          to: 6,
        }),
        getLazyVaultSubgraphResponse,
        getVaultApyParameters,
      },
    )

    const secondDepositTx = await dpmAccount.execute(
      system.OperationExecutor.contract.address,
      secondDeposit.tx.data,
      {
        gasLimit: 5000000,
      },
    )
    const secondDepositReceipt = await secondDepositTx.wait()
    const secondDepositEvents = getEvents(
      secondDepositReceipt,
      testSystem.deployment.system.PositionCreated.contract.interface.getEvent('CreatePosition'),
    )
    expect(secondDepositEvents.length).to.eq(0)
    const usdcBalanceSecondDeposit = await USDC.balanceOf(address)
    const { shares: sharesAfterSecondDeposit, balance: balanceAfterSecondDeposit } =
      await getProxyShareAndDeposit(owner, dpmAccount)
    console.log('Position shares after deposit      : ', sharesAfterDeposit.toString())
    console.log(
      'Position balance after deposit     : ',
      ethers.utils.formatUnits(balanceAfterDeposit, 6).toString(),
    )

    console.log('Position shares after 2nd deposit  : ', sharesAfterSecondDeposit.toString())
    console.log(
      'Position  balance after 2nd deposit: ',
      ethers.utils.formatUnits(balanceAfterSecondDeposit, 6).toString(),
    )

    console.log(
      'User USDC balance before deposit   : ',
      ethers.utils.formatUnits(usdcBalanceBeforeDeposit, 6).toString(),
    )
    console.log(
      'User USDC balance after deposit    : ',
      ethers.utils.formatUnits(usdcBalanceAfterDeposit, 6).toString(),
    )
    console.log(
      'User USDC balance after 2nd deposit: ',
      ethers.utils.formatUnits(usdcBalanceSecondDeposit, 6).toString(),
    )
    console.log(
      'User USDC balance diff             : ',
      ethers.utils
        .formatUnits(usdcBalanceBeforeDeposit.sub(usdcBalanceSecondDeposit), 6)
        .toString(),
    )
  })
  it('should deposit 1 WETH to Steakhosue USDC Metamorpho Vault, emit `CreatePosition` event on first deposit, and withdraw all funds', async () => {
    await setBalance(address, ethers.BigNumber.from('100000000000000000000'))
    const usdcBalanceBeforeDeposit = await USDC.balanceOf(address)
    const wethBalanceBeforeDeposit = await hre.ethers.provider.getBalance(address)

    const depositAmount = new BigNumber('1')

    console.log('Deposit amount                     : ', depositAmount.toString())
    // approve USDC to DPM
    await USDC.connect(owner).approve(dpmAccount.address, amountToWei(depositAmount, 6).toString())

    const result = await strategies.common.erc4626.deposit(
      {
        vault: VAULT_ADDRESS,
        depositTokenAddress: USDC.address,
        depositTokenPrecision: 6,
        depositTokenSymbol: 'USDC',
        pullTokenAddress: WETH.address,
        pullTokenPrecision: 18,
        pullTokenSymbol: 'WETH',
        amount: depositAmount,
        proxyAddress: dpmAccount.address,
        slippage: new BigNumber(0.25),
        user: address,
        quoteTokenPrice: new BigNumber(1),
      },
      {
        provider: provider,
        addresses: aaveLikeAddresses,
        network: network,
        operationExecutor: aaveLikeAddresses.operationExecutor,
        getSwapData: getOneInchCall(ADDRESSES['mainnet'].mpa.core.Swap, 1),
        getLazyVaultSubgraphResponse,
        getVaultApyParameters,
      },
    )

    const tx = await dpmAccount.execute(system.OperationExecutor.contract.address, result.tx.data, {
      gasLimit: 5000000,
      value: result.tx.value,
    })
    const receipt = await tx.wait()
    const events = getEvents(
      receipt,
      testSystem.deployment.system.PositionCreated.contract.interface.getEvent('CreatePosition'),
    )
    expect(events.length).to.eq(1)
    expect(events[0].args?.protocol).to.eq(`erc4626-${VAULT_ADDRESS.toLowerCase()}`)

    const usdcBalanceAfterDeposit = await USDC.balanceOf(address)
    const wethBalanceAfterDeposit = await hre.ethers.provider.getBalance(address)
    const { shares: sharesAfterDeposit, balance: balanceAfterDeposit } =
      await getProxyShareAndDeposit(owner, dpmAccount)

    const currentPosition = await views.common.getErc4626Position(
      {
        vaultAddress: VAULT_ADDRESS,
        proxyAddress: dpmAccount.address,
        user: address,
        quotePrice: new BigNumber(1),
        underlyingAsset: {
          address: USDC.address,
          precision: 6,
          symbol: 'USDC',
        },
      },
      {
        provider: hre.ethers.provider,
        getLazyVaultSubgraphResponse,
        getVaultApyParameters,
      },
    )
    // expect(balanceAfterDeposit.toString()).to.equal(depositAmount.minus(1).toString())
    const closeCalldata = await strategies.common.erc4626.withdraw(
      {
        vault: VAULT_ADDRESS,
        withdrawTokenAddress: USDC.address,
        withdrawTokenPrecision: 6,
        withdrawTokenSymbol: 'USDC',
        returnTokenAddress: USDC.address,
        returnTokenPrecision: 6,
        returnTokenSymbol: 'USDC',
        amount: currentPosition.quoteTokenAmount.times(2),
        proxyAddress: dpmAccount.address,
        slippage: new BigNumber(0.25),
        user: address,
        quoteTokenPrice: new BigNumber(1),
      },
      {
        provider: provider,
        addresses: aaveLikeAddresses,
        network: network,
        operationExecutor: aaveLikeAddresses.operationExecutor,
        getSwapData: getOneInchCall(ADDRESSES['mainnet'].mpa.core.Swap, 1),
        getLazyVaultSubgraphResponse,
        getVaultApyParameters,
      },
    )

    const tx2 = await dpmAccount.execute(
      system.OperationExecutor.contract.address,
      closeCalldata.tx.data,
      {
        gasLimit: 5000000,
      },
    )
    await tx2.wait()
    const usdcBalanceAfterWithdrawal = await USDC.balanceOf(address)
    const wethBalanceAfterWithdrawal = await hre.ethers.provider.getBalance(address)
    const { shares: sharesAfterWithdraw, balance: balanceAfterWithdraw } =
      await getProxyShareAndDeposit(owner, dpmAccount)
    console.log('Position shares after deposit      : ', sharesAfterDeposit.toString())
    console.log(
      'Position balance after deposit     : ',
      ethers.utils.formatUnits(balanceAfterDeposit, 6).toString(),
    )

    console.log('Position shares after withdraw     : ', sharesAfterWithdraw.toString())
    console.log(
      'Position  balance after withdraw   : ',
      ethers.utils.formatUnits(balanceAfterWithdraw, 6).toString(),
    )

    console.log(
      'User USDC balance before deposit   : ',
      ethers.utils.formatUnits(usdcBalanceBeforeDeposit, 6).toString(),
    )
    console.log(
      'User ETH balance before deposit    : ',
      ethers.utils.formatUnits(wethBalanceBeforeDeposit, 18).toString(),
    )
    console.log(
      'User USDC balance after deposit    : ',
      ethers.utils.formatUnits(usdcBalanceAfterDeposit, 6).toString(),
    )
    console.log(
      'User WETH balance after deposit    : ',
      ethers.utils.formatUnits(wethBalanceAfterDeposit, 18).toString(),
    )
    console.log(
      'User USDC balance after withdrawal : ',
      ethers.utils.formatUnits(usdcBalanceAfterWithdrawal, 6).toString(),
    )
    console.log(
      'User WETH balance after withdrawal : ',
      ethers.utils.formatUnits(wethBalanceAfterWithdrawal, 18).toString(),
    )
    console.log(
      'User USDC balance diff             : ',
      ethers.utils
        .formatUnits(usdcBalanceBeforeDeposit.sub(usdcBalanceAfterWithdrawal), 6)
        .toString(),
    )
    console.log(
      'User WETH balance diff             : ',
      ethers.utils
        .formatUnits(wethBalanceBeforeDeposit.sub(wethBalanceAfterWithdrawal), 18)
        .toString(),
    )
  })
  it('should deposit 1 WETH to Steakhosue USDC Metamorpho Vault, emit `CreatePosition` event on first deposit, and withdraw all funds as ETH', async () => {
    await setBalance(address, ethers.BigNumber.from('100000000000000000000'))

    const wethBalanceBeforeDeposit = await hre.ethers.provider.getBalance(address)

    const depositAmount = new BigNumber('1')

    console.log('Deposit amount                     : ', depositAmount.toString())
    // approve USDC to DPM
    await USDC.connect(owner).approve(dpmAccount.address, amountToWei(depositAmount, 6).toString())

    const result = await strategies.common.erc4626.deposit(
      {
        vault: VAULT_ADDRESS,
        depositTokenAddress: USDC.address,
        depositTokenPrecision: 6,
        depositTokenSymbol: 'USDC',
        pullTokenAddress: WETH.address,
        pullTokenPrecision: 18,
        pullTokenSymbol: 'WETH',
        amount: depositAmount,
        proxyAddress: dpmAccount.address,
        slippage: new BigNumber(0.25),
        user: address,
        quoteTokenPrice: new BigNumber(1),
      },
      {
        provider: provider,
        addresses: aaveLikeAddresses,
        network: network,
        operationExecutor: aaveLikeAddresses.operationExecutor,
        getSwapData: getOneInchCall(ADDRESSES['mainnet'].mpa.core.Swap, 1),
        getLazyVaultSubgraphResponse,
        getVaultApyParameters,
      },
    )

    const tx = await dpmAccount.execute(system.OperationExecutor.contract.address, result.tx.data, {
      gasLimit: 5000000,
      value: result.tx.value,
    })
    const receipt = await tx.wait()
    const events = getEvents(
      receipt,
      testSystem.deployment.system.PositionCreated.contract.interface.getEvent('CreatePosition'),
    )
    expect(events.length).to.eq(1)
    expect(events[0].args?.protocol).to.eq(`erc4626-${VAULT_ADDRESS.toLowerCase()}`)

    const wethBalanceAfterDeposit = await hre.ethers.provider.getBalance(address)

    const { shares: sharesAfterDeposit, balance: balanceAfterDeposit } =
      await getProxyShareAndDeposit(owner, dpmAccount)

    const currentPosition = await views.common.getErc4626Position(
      {
        vaultAddress: VAULT_ADDRESS,
        proxyAddress: dpmAccount.address,
        user: address,
        quotePrice: new BigNumber(1),
        underlyingAsset: {
          address: USDC.address,
          precision: 6,
          symbol: 'USDC',
        },
      },
      {
        provider: hre.ethers.provider,
        getLazyVaultSubgraphResponse,
        getVaultApyParameters,
      },
    )
    // expect(balanceAfterDeposit.toString()).to.equal(depositAmount.minus(1).toString())
    const closeCalldata = await strategies.common.erc4626.withdraw(
      {
        vault: VAULT_ADDRESS,
        withdrawTokenAddress: USDC.address,
        withdrawTokenPrecision: 6,
        withdrawTokenSymbol: 'USDC',
        returnTokenAddress: WETH.address,
        returnTokenPrecision: 18,
        returnTokenSymbol: 'WETH',
        amount: currentPosition.quoteTokenAmount.times(2),
        proxyAddress: dpmAccount.address,
        slippage: new BigNumber(0.25),
        user: address,
        quoteTokenPrice: new BigNumber(1),
      },
      {
        provider: provider,
        addresses: aaveLikeAddresses,
        network: network,
        operationExecutor: aaveLikeAddresses.operationExecutor,
        getSwapData: getOneInchCall(ADDRESSES['mainnet'].mpa.core.Swap, 1),
        getLazyVaultSubgraphResponse,
        getVaultApyParameters,
      },
    )

    const tx2 = await dpmAccount.execute(
      system.OperationExecutor.contract.address,
      closeCalldata.tx.data,
      {
        gasLimit: 5000000,
      },
    )
    await tx2.wait()
    const wethBalanceAfterWithdrawal = await hre.ethers.provider.getBalance(address)
    const { shares: sharesAfterWithdraw, balance: balanceAfterWithdraw } =
      await getProxyShareAndDeposit(owner, dpmAccount)
    console.log('Position shares after deposit      : ', sharesAfterDeposit.toString())
    console.log(
      'Position balance after deposit               : ',
      ethers.utils.formatUnits(balanceAfterDeposit, 6).toString(),
    )

    console.log('Position shares after withdraw     : ', sharesAfterWithdraw.toString())
    console.log(
      'Position  balance after withdraw             : ',
      ethers.utils.formatUnits(balanceAfterWithdraw, 6).toString(),
    )

    console.log(
      'User WETH balance before deposit             : ',
      ethers.utils.formatUnits(wethBalanceBeforeDeposit, 18).toString(),
    )

    console.log(
      'User WETH balance after deposit              : ',
      ethers.utils.formatUnits(wethBalanceAfterDeposit, 18).toString(),
    )
    console.log(
      'User WETH deposited (based on balance)       : ',
      ethers.utils
        .formatUnits(wethBalanceBeforeDeposit.sub(wethBalanceAfterDeposit), 18)
        .toString(),
    )
    console.log(
      'User WETH balance after withdrawal           : ',
      ethers.utils.formatUnits(wethBalanceAfterWithdrawal, 18).toString(),
    )
    console.log(
      'User WETH withdrawn (based on balance)       : ',
      ethers.utils
        .formatUnits(wethBalanceAfterDeposit.sub(wethBalanceAfterWithdrawal), 18)
        .toString(),
    )
    console.log(
      'User WETH balance diff (gas cost)            : ',
      ethers.utils
        .formatUnits(wethBalanceBeforeDeposit.sub(wethBalanceAfterWithdrawal), 18)
        .toString(),
    )
  })
  it('should deposit 1 WETH to Steakhosue USDC Metamorpho Vault, emit `CreatePosition` event on first deposit, and withdraw 50% funds as ETH', async () => {
    await setBalance(address, ethers.BigNumber.from('100000000000000000000'))

    const wethBalanceBeforeDeposit = await hre.ethers.provider.getBalance(address)

    const depositAmount = new BigNumber('1')

    console.log('Deposit amount                     : ', depositAmount.toString())
    // approve USDC to DPM
    await USDC.connect(owner).approve(dpmAccount.address, amountToWei(depositAmount, 6).toString())

    const result = await strategies.common.erc4626.deposit(
      {
        vault: VAULT_ADDRESS,
        depositTokenAddress: USDC.address,
        depositTokenPrecision: 6,
        depositTokenSymbol: 'USDC',
        pullTokenAddress: WETH.address,
        pullTokenPrecision: 18,
        pullTokenSymbol: 'WETH',
        amount: depositAmount,
        proxyAddress: dpmAccount.address,
        slippage: new BigNumber(0.25),
        user: address,
        quoteTokenPrice: new BigNumber(1),
      },
      {
        provider: provider,
        addresses: aaveLikeAddresses,
        network: network,
        operationExecutor: aaveLikeAddresses.operationExecutor,
        getSwapData: getOneInchCall(ADDRESSES['mainnet'].mpa.core.Swap, 1),
        getLazyVaultSubgraphResponse,
        getVaultApyParameters,
      },
    )

    const tx = await dpmAccount.execute(system.OperationExecutor.contract.address, result.tx.data, {
      gasLimit: 5000000,
      value: result.tx.value,
    })
    const receipt = await tx.wait()
    const events = getEvents(
      receipt,
      testSystem.deployment.system.PositionCreated.contract.interface.getEvent('CreatePosition'),
    )
    expect(events.length).to.eq(1)
    expect(events[0].args?.protocol).to.eq(`erc4626-${VAULT_ADDRESS.toLowerCase()}`)

    const feePaid = getEvents(
      receipt,
      testSystem.deployment.system.Swap.contract.interface.getEvent('FeePaid'),
    )
    console.log('feePaid', feePaid)

    const wethBalanceAfterDeposit = await hre.ethers.provider.getBalance(address)

    const { shares: sharesAfterDeposit, balance: balanceAfterDeposit } =
      await getProxyShareAndDeposit(owner, dpmAccount)

    const currentPosition = await views.common.getErc4626Position(
      {
        vaultAddress: VAULT_ADDRESS,
        proxyAddress: dpmAccount.address,
        user: address,
        quotePrice: new BigNumber(1),
        underlyingAsset: {
          address: USDC.address,
          precision: 6,
          symbol: 'USDC',
        },
      },
      {
        provider: hre.ethers.provider,
        getLazyVaultSubgraphResponse,
        getVaultApyParameters,
      },
    )
    // expect(balanceAfterDeposit.toString()).to.equal(depositAmount.minus(1).toString())
    const closeCalldata = await strategies.common.erc4626.withdraw(
      {
        vault: VAULT_ADDRESS,
        withdrawTokenAddress: USDC.address,
        withdrawTokenPrecision: 6,
        withdrawTokenSymbol: 'USDC',
        returnTokenAddress: WETH.address,
        returnTokenPrecision: 18,
        returnTokenSymbol: 'WETH',
        amount: currentPosition.quoteTokenAmount.times(0.5),
        proxyAddress: dpmAccount.address,
        slippage: new BigNumber(0.25),
        user: address,
        quoteTokenPrice: new BigNumber(1),
      },
      {
        provider: provider,
        addresses: aaveLikeAddresses,
        network: network,
        operationExecutor: aaveLikeAddresses.operationExecutor,
        getSwapData: getOneInchCall(ADDRESSES['mainnet'].mpa.core.Swap, 1),
        getLazyVaultSubgraphResponse,
        getVaultApyParameters,
      },
    )

    const tx2 = await dpmAccount.execute(
      system.OperationExecutor.contract.address,
      closeCalldata.tx.data,
      {
        gasLimit: 5000000,
      },
    )
    await tx2.wait()
    const wethBalanceAfterWithdrawal = await hre.ethers.provider.getBalance(address)
    const { shares: sharesAfterWithdraw, balance: balanceAfterWithdraw } =
      await getProxyShareAndDeposit(owner, dpmAccount)
    console.log('Position shares after deposit      : ', sharesAfterDeposit.toString())
    console.log(
      'Position balance after deposit     : ',
      ethers.utils.formatUnits(balanceAfterDeposit, 6).toString(),
    )

    console.log('Position shares after withdraw     : ', sharesAfterWithdraw.toString())
    console.log(
      'Position  balance after withdraw   : ',
      ethers.utils.formatUnits(balanceAfterWithdraw, 6).toString(),
    )

    console.log(
      'User WETH balance before deposit   : ',
      ethers.utils.formatUnits(wethBalanceBeforeDeposit, 18).toString(),
    )
    console.log(
      'User WETH balance after deposit    : ',
      ethers.utils.formatUnits(wethBalanceAfterDeposit, 18).toString(),
    )
    console.log(
      'User WETH balance after withdrawal : ',
      ethers.utils.formatUnits(wethBalanceAfterWithdrawal, 18).toString(),
    )
    console.log(
      'User WETH balance diff             : ',
      ethers.utils
        .formatUnits(wethBalanceBeforeDeposit.sub(wethBalanceAfterWithdrawal), 18)
        .toString(),
    )
  })
  it.skip('should deposit 100 Coumpound cUSD to Steakhosue USDC Metamorpho Vault, emit `CreatePosition` event on first deposit, and withdraw 50% funds as ETH', async () => {
    await setBalance(address, ethers.BigNumber.from('100000000000000000000'))

    const wethBalanceBeforeDeposit = await hre.ethers.provider.getBalance(address)

    const depositAmount = new BigNumber('100')

    console.log('Deposit amount                     : ', depositAmount.toString())
    // approve USDC to DPM
    const cUSD = await hre.ethers.getContractAt(
      '@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20',
      '0xBcca60bB61934080951369a648Fb03DF4F96263C',
      owner,
    )

    await cUSD.connect(owner).approve(dpmAccount.address, amountToWei(depositAmount, 18).toString())

    const result = await strategies.common.erc4626.deposit(
      {
        vault: VAULT_ADDRESS,
        depositTokenAddress: USDC.address,
        depositTokenPrecision: 6,
        depositTokenSymbol: 'USDC',
        pullTokenAddress: '0xBcca60bB61934080951369a648Fb03DF4F96263C',
        pullTokenPrecision: 18,
        pullTokenSymbol: 'cUSD',
        amount: depositAmount,
        proxyAddress: dpmAccount.address,
        slippage: new BigNumber(0.25),
        user: address,
        quoteTokenPrice: new BigNumber(1),
      },
      {
        provider: provider,
        addresses: aaveLikeAddresses,
        network: network,
        operationExecutor: aaveLikeAddresses.operationExecutor,
        getSwapData: getOneInchCall(ADDRESSES['mainnet'].mpa.core.Swap, 1),
        getLazyVaultSubgraphResponse,
        getVaultApyParameters,
      },
    )

    const tx = await dpmAccount.execute(system.OperationExecutor.contract.address, result.tx.data, {
      gasLimit: 5000000,
      value: result.tx.value,
    })
    const receipt = await tx.wait()
    const events = getEvents(
      receipt,
      testSystem.deployment.system.PositionCreated.contract.interface.getEvent('CreatePosition'),
    )
    expect(events.length).to.eq(1)
    expect(events[0].args?.protocol).to.eq(`erc4626-${VAULT_ADDRESS.toLowerCase()}`)

    const wethBalanceAfterDeposit = await hre.ethers.provider.getBalance(address)

    const { shares: sharesAfterDeposit, balance: balanceAfterDeposit } =
      await getProxyShareAndDeposit(owner, dpmAccount)

    const currentPosition = await views.common.getErc4626Position(
      {
        vaultAddress: VAULT_ADDRESS,
        proxyAddress: dpmAccount.address,
        user: address,
        quotePrice: new BigNumber(1),
        underlyingAsset: {
          address: USDC.address,
          precision: 6,
          symbol: 'USDC',
        },
      },
      {
        provider: hre.ethers.provider,
        getLazyVaultSubgraphResponse,
        getVaultApyParameters,
      },
    )
    // expect(balanceAfterDeposit.toString()).to.equal(depositAmount.minus(1).toString())
    const closeCalldata = await strategies.common.erc4626.withdraw(
      {
        vault: VAULT_ADDRESS,
        withdrawTokenAddress: USDC.address,
        withdrawTokenPrecision: 6,
        withdrawTokenSymbol: 'USDC',
        returnTokenAddress: WETH.address,
        returnTokenPrecision: 18,
        returnTokenSymbol: 'WETH',
        amount: currentPosition.quoteTokenAmount.times(0.5),
        proxyAddress: dpmAccount.address,
        slippage: new BigNumber(0.25),
        user: address,
        quoteTokenPrice: new BigNumber(1),
      },
      {
        provider: provider,
        addresses: aaveLikeAddresses,
        network: network,
        operationExecutor: aaveLikeAddresses.operationExecutor,
        getSwapData: getOneInchCall(ADDRESSES['mainnet'].mpa.core.Swap, 1),
        getLazyVaultSubgraphResponse,
        getVaultApyParameters,
      },
    )

    const tx2 = await dpmAccount.execute(
      system.OperationExecutor.contract.address,
      closeCalldata.tx.data,
      {
        gasLimit: 5000000,
      },
    )
    await tx2.wait()
    const wethBalanceAfterWithdrawal = await hre.ethers.provider.getBalance(address)
    const { shares: sharesAfterWithdraw, balance: balanceAfterWithdraw } =
      await getProxyShareAndDeposit(owner, dpmAccount)
    console.log('Position shares after deposit      : ', sharesAfterDeposit.toString())
    console.log(
      'Position balance after deposit     : ',
      ethers.utils.formatUnits(balanceAfterDeposit, 6).toString(),
    )

    console.log('Position shares after withdraw     : ', sharesAfterWithdraw.toString())
    console.log(
      'Position  balance after withdraw   : ',
      ethers.utils.formatUnits(balanceAfterWithdraw, 6).toString(),
    )

    console.log(
      'User WETH balance before deposit   : ',
      ethers.utils.formatUnits(wethBalanceBeforeDeposit, 18).toString(),
    )
    console.log(
      'User WETH balance after deposit    : ',
      ethers.utils.formatUnits(wethBalanceAfterDeposit, 18).toString(),
    )
    console.log(
      'User WETH balance after withdrawal : ',
      ethers.utils.formatUnits(wethBalanceAfterWithdrawal, 18).toString(),
    )
    console.log(
      'User WETH balance diff             : ',
      ethers.utils
        .formatUnits(wethBalanceBeforeDeposit.sub(wethBalanceAfterWithdrawal), 18)
        .toString(),
    )
  })
})
async function getProxyShareAndDeposit(owner: ethers.Signer, dpmAccount: AccountImplementation) {
  const vault = IERC4626__factory.connect(VAULT_ADDRESS, owner)
  const shares = await vault.balanceOf(dpmAccount.address)
  const balance = await vault.convertToAssets(shares)

  return { shares, balance }
}
