import BigNumber from 'bignumber.js'

import * as actions from '../../actions'
import { WAD, ZERO } from '../../helpers/constants'

export interface RefinanceAddresses {
  operationExecutor: string
  DAI: string
}

export async function refinanceVault(
  args: {
    collateral: BigNumber
    debt: BigNumber
    vaultId: BigNumber
    joinAddress: string
    newVaultJoinAddress: string
    proxyAddress: string
    isEth: boolean
  },
  addresses: RefinanceAddresses,
) {
  const debtPlusOffset = args.debt.plus(WAD)

  const paybackAll = actions.maker.payback({
    vaultId: args.vaultId,
    userAddress: args.proxyAddress,
    amount: ZERO,
  })

  const withdraw = actions.maker.withdraw({
    amount: args.collateral,
    joinAddress: args.joinAddress,
    userAddress: args.proxyAddress,
    vaultId: args.vaultId,
  })

  const openNewVault = actions.maker.openVault({
    joinAddress: args.newVaultJoinAddress,
  })

  const wrapEth = actions.common.wrapEth(
    {
      amount: 0,
    },
    [2],
  )

  const deposit = actions.maker.deposit(
    {
      joinAddress: args.newVaultJoinAddress,
      amount: 0,
      vaultId: 0,
    },
    [0, 3, 2],
  )

  const generate = actions.maker.generate(
    {
      to: args.proxyAddress,
      vaultId: 0,
      amount: 0,
    },
    [0, 3, 1],
  )

  const sendDai = actions.common.sendToken({
    amount: debtPlusOffset,
    asset: addresses.DAI,
    to: addresses.operationExecutor,
  })

  const takeAFlashLoan = actions.common.takeAFlashLoan({
    flashloanAmount: debtPlusOffset,
    borrower: addresses.operationExecutor,
    dsProxyFlashloan: true,
    calls: [
      paybackAll,
      withdraw,
      openNewVault,
      ...(args.isEth ? [wrapEth] : []),
      deposit,
      generate,
      sendDai,
    ],
  })

  return [takeAFlashLoan]
}
