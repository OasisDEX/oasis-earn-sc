import { TransactionReceipt } from '@ethersproject/providers'
import {
  ADDRESSES,
  CONTRACT_NAMES,
  OPERATION_NAMES,
  strategies,
  TEN,
  TEN_THOUSAND,
} from '@oasisdex/oasis-actions'
import { AAVETokens, TokenDef, TOKEN_DEFINITIONS } from '@oasisdex/oasis-actions/src/operations/aave/tokens'
import { mainnetAAVEAddresses } from '@oasisdex/oasis-actions/src/strategies/aave/getAAVETokenAddresses'
import { BigNumber } from 'bignumber.js'
import { assert } from 'chai'
import { Contract } from 'ethers'
import { ethers } from 'hardhat'

import AAVEDataProviderABI from '../../abi/aaveDataProvider.json'
import { AAVEReserveData } from '../../helpers/aave'
import { executeThroughProxy } from '../../helpers/deploy'
import init from '../../helpers/init'
import { getOneInchCall } from '../../helpers/swap/OneInchCall'
import { RuntimeConfig } from '../../helpers/types/common'
import { amountFromWei, amountToWei, approve, balanceOf } from '../../helpers/utils'
import { zero } from '../../scripts/common'
import { mainnetAddresses } from '../addresses'
import { DeployedSystemInfo, deploySystem } from '../deploySystem'
import { expectToBeEqual } from '../utils'

describe.only('A Position', () => {
  let config: RuntimeConfig
  let deployedContracts: DeployedSystemInfo
  let aaveDataProvider: Contract
  let proxyAddress: string

  const slippage = new BigNumber(0.2) // 20%
  const fee = new BigNumber(0.2)
  const collectSwapFeeFrom = 'sourceToken'

  before(async () => {
    config = await init()
    deployedContracts = (await deploySystem(config, false, false)).system
    proxyAddress = deployedContracts.common.dsProxy.address
    aaveDataProvider = new Contract(
      ADDRESSES.main.aave.DataProvider,
      AAVEDataProviderABI,
      config.provider,
    )
  })

  describe('that already exists', () => {
    let snapshotId: string
    before(async () => {
      await openAPosition(config, deployedContracts)
    })

    beforeEach(async () => {
      snapshotId = await config.provider.send('evm_snapshot', [])
    })

    afterEach(async () => {
      await config.provider.send('evm_revert', [snapshotId])
    })

    it('and user deposits ETH ( swap required )', async () => {
      const entryToken = TOKEN_DEFINITIONS.ETH
      const depositToken = TOKEN_DEFINITIONS.stETH
      const entryAmount = amountToWei(TEN)

      const { currentATokenBalance: currentATokenBalanceBeforeDeposit }: AAVEReserveData =
        await aaveDataProvider.getUserReserveData(
          mainnetAAVEAddresses[depositToken.symbol],
          proxyAddress,
        )

      const [_, receipt] = await depositToAPosition(
        config,
        deployedContracts,
        {
          entryToken,
          depositToken,
          entryAmount,
        },
        {
          fee,
          slippage,
          collectSwapFeeFrom,
        },
      )

      const [depositedAmount] = await getDepositedAmounts(receipt)
      const { currentATokenBalance: currentATokenBalanceAfterDeposit }: AAVEReserveData =
        await aaveDataProvider.getUserReserveData(
          mainnetAAVEAddresses[depositToken.symbol],
          proxyAddress,
        )

      expectToBeEqual(
        amountFromWei(
          new BigNumber(currentATokenBalanceBeforeDeposit.toString()).plus(depositedAmount),
        ).toFixed(8),
        amountFromWei(new BigNumber(currentATokenBalanceAfterDeposit.toString())).toFixed(8),
      )
    })

    it('and user deposits ERC20 ( swap required )', async () => {
      const entryToken = TOKEN_DEFINITIONS.DAI
      const depositToken = TOKEN_DEFINITIONS.stETH
      const entryAmount = amountToWei(TEN_THOUSAND)

      const walletDAIBalance = await balanceOf(ADDRESSES.main.DAI, config.address, {
        config,
        isFormatted: true,
      })

      console.log('DAI BLAANMCE?', walletDAIBalance.toString())

      assert.isOk(
        walletDAIBalance.gt(TEN_THOUSAND),
        `Not enough DAI to execute test ( balance: ${walletDAIBalance.toString()}`,
      )

      const { currentATokenBalance: currentATokenBalanceBeforeDeposit }: AAVEReserveData =
        await aaveDataProvider.getUserReserveData(
          mainnetAAVEAddresses[depositToken.symbol],
          proxyAddress,
        )

      await approve(ADDRESSES.main.DAI, proxyAddress, entryAmount, config)

      const [_, receipt] = await depositToAPosition(
        config,
        deployedContracts,
        {
          entryToken,
          depositToken,
          entryAmount,
        },
        {
          fee,
          slippage,
          collectSwapFeeFrom,
        },
      )

      const [depositedAmount] = await getDepositedAmounts(receipt)
      const { currentATokenBalance: currentATokenBalanceAfterDeposit }: AAVEReserveData =
        await aaveDataProvider.getUserReserveData(
          mainnetAAVEAddresses[depositToken.symbol],
          proxyAddress,
        )

      expectToBeEqual(
        amountFromWei(
          new BigNumber(currentATokenBalanceBeforeDeposit.toString()).plus(depositedAmount),
        ).toFixed(8),
        amountFromWei(new BigNumber(currentATokenBalanceAfterDeposit.toString())).toFixed(8),
      )
    })
  })

  describe('that does not exist', () => {
    let snapshotId: string

    beforeEach(async () => {
      snapshotId = await config.provider.send('evm_snapshot', [])
    })

    afterEach(async () => {
      await config.provider.send('evm_revert', [snapshotId])
    })

    it('and user deposits ETH ( swap required )', async () => {
      const entryToken = TOKEN_DEFINITIONS.ETH
      const depositToken = TOKEN_DEFINITIONS.stETH
      const entryAmount = amountToWei(TEN)

      const { currentATokenBalance: currentATokenBalanceBeforeDeposit }: AAVEReserveData =
        await aaveDataProvider.getUserReserveData(
          mainnetAAVEAddresses[depositToken.symbol],
          proxyAddress,
        )

      const [_, receipt] = await depositToAPosition(
        config,
        deployedContracts,
        {
          entryToken,
          depositToken,
          entryAmount,
        },
        {
          fee,
          slippage,
          collectSwapFeeFrom,
        },
      )

      const [depositedAmount] = await getDepositedAmounts(receipt)
      const { currentATokenBalance: currentATokenBalanceAfterDeposit }: AAVEReserveData =
        await aaveDataProvider.getUserReserveData(
          mainnetAAVEAddresses[depositToken.symbol],
          proxyAddress,
        )

      expectToBeEqual(
        amountFromWei(
          new BigNumber(currentATokenBalanceBeforeDeposit.toString()).plus(depositedAmount),
        ).toFixed(8),
        amountFromWei(new BigNumber(currentATokenBalanceAfterDeposit.toString())).toFixed(8),
      )
    })

    it('and user deposits same asset as in the position ( swap NOT required )', async () => {
      const entryToken = TOKEN_DEFINITIONS.DAI
      const depositToken = entryToken
      const entryAmount = amountToWei(TEN_THOUSAND)

      const walletDAIBalance = await balanceOf(ADDRESSES.main.DAI, config.address, {
        config,
        isFormatted: true,
      })

      assert.isOk(
        walletDAIBalance.gt(TEN_THOUSAND),
        `Not enough DAI to execute test ( balance: ${walletDAIBalance.toString()}`,
      )

      const { currentATokenBalance: currentATokenBalanceBeforeDeposit }: AAVEReserveData =
        await aaveDataProvider.getUserReserveData(
          mainnetAAVEAddresses[depositToken.symbol],
          proxyAddress,
        )

      await approve(ADDRESSES.main.DAI, proxyAddress, entryAmount, config)

      const [_, receipt] = await depositToAPosition(
        config,
        deployedContracts,
        {
          entryToken,
          depositToken,
          entryAmount,
        },
        {
          fee,
          slippage,
          collectSwapFeeFrom,
        },
      )

      const [depositedAmount] = await getDepositedAmounts(receipt)
      const { currentATokenBalance: currentATokenBalanceAfterDeposit }: AAVEReserveData =
        await aaveDataProvider.getUserReserveData(
          mainnetAAVEAddresses[depositToken.symbol],
          proxyAddress,
        )

      expectToBeEqual(
        amountFromWei(
          new BigNumber(currentATokenBalanceBeforeDeposit.toString()).plus(depositedAmount),
        ).toFixed(8),
        amountFromWei(new BigNumber(currentATokenBalanceAfterDeposit.toString())).toFixed(8),
      )
    })
  })
})

async function depositToAPosition(
  { signer, address, provider }: RuntimeConfig,
  { common }: { common: any },
  {
    entryToken,
    entryAmount,
    depositToken,
  }: {
    entryToken: TokenDef<AAVETokens>
    depositToken: TokenDef<AAVETokens>
    entryAmount: BigNumber
  },
  {
    slippage,
    fee,
    collectSwapFeeFrom,
  }: {
    slippage: BigNumber
    fee: BigNumber // hardcoded to 0.2%. For now it will be 0.0%.
    collectSwapFeeFrom: 'sourceToken' | 'targetToken'
  },
) {
  const proxyAddress = common.dsProxy.address
  const addresses = {
    ...mainnetAddresses,
    operationExecutor: common.operationExecutor.address,
  }

  const { transaction } = await strategies.aave.depositBorrow(
    {
      entryToken: mainnetAddresses[entryToken.symbol],
      entryTokenAmount: entryAmount,
      slippage,
      collectFeeFrom: collectSwapFeeFrom,
    },
    {
      addresses,
      provider,
      getSwapData: getOneInchCall(common.swap.address),
      proxy: proxyAddress,
      user: address,
      currentPosition: await strategies.aave.view(
        {
          proxy: proxyAddress,
          collateralToken: depositToken,
          debtToken: depositToken,
        },
        {
          addresses,
          provider,
        },
      ),
    },
  )

  return await executeThroughProxy(
    common.dsProxy.address,
    {
      address: common.operationExecutor.address,
      calldata: common.operationExecutor.interface.encodeFunctionData('executeOp', [
        transaction.calls,
        transaction.operationName,
      ]),
    },
    signer,
    mainnetAAVEAddresses[entryToken.symbol] === mainnetAAVEAddresses.ETH
      ? entryAmount.toFixed(0)
      : zero.toString(),
  )
}

async function openAPosition(
  { provider, signer, address: user }: RuntimeConfig,
  { common }: DeployedSystemInfo,
) {
  const proxy = common.dsProxy.address
  const depositEthAmount = amountToWei(new BigNumber(TEN))
  const multiple = new BigNumber(2)
  const slippage = new BigNumber(0.02) // 2%
  const debtToken = TOKEN_DEFINITIONS.ETH
  const collateralToken = TOKEN_DEFINITIONS.stETH
  const addresses = {
    ...mainnetAddresses,
    operationExecutor: common.operationExecutor.address,
  }
  const currentPosition = await strategies.aave.view(
    {
      proxy,
      collateralToken,
      debtToken,
    },
    {
      addresses,
      provider,
    },
  )

  const transition = await strategies.aave.open(
    {
      depositedByUser: { debtToken: { amountInBaseUnit: depositEthAmount} },
      slippage,
      multiple,
      debtToken,
      collateralToken,
      positionType: 'Multiply',
    },
    {
      addresses,
      provider,
      user,
      proxy,
  
      getSwapData: getOneInchCall(common.swap.address),
    },
  )

  return await executeThroughProxy(
    common.dsProxy.address,
    {
      address: common.operationExecutor.address,
      calldata: common.operationExecutor.interface.encodeFunctionData('executeOp', [
        transition.transaction.calls,
        OPERATION_NAMES.common.CUSTOM_OPERATION,
      ]),
    },
    signer,
    depositEthAmount.toFixed(0),
  )
}

// TODO: Generalize for parsing Action events events.
async function getDepositedAmounts(receipt: TransactionReceipt) {
  const actionEventTopic = ethers.utils.keccak256(
    ethers.utils.toUtf8Bytes('Action(string,bytes32)'),
  )

  if (receipt.logs) {
    return receipt.logs
      .filter(log => {
        return log.topics[0] === actionEventTopic
      })
      .filter(log => {
        const [name] = ethers.utils.defaultAbiCoder.decode(['string', 'bytes32'], log.data)
        return name === CONTRACT_NAMES.aave.DEPOSIT
      })
      .map(log => {
        const [, depositedAmount] = ethers.utils.defaultAbiCoder.decode(
          ['string', 'bytes32'],
          log.data,
        )
        return new BigNumber(depositedAmount)
      })
  }

  return []
}
