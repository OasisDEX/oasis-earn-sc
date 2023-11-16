import { getNetwork } from '@deploy-configurations/utils/network'
import { executeThroughDPMProxy } from '@dma-common/utils/execute'
import { Snapshot } from '@dma-contracts/utils'
import { applyPercentage } from '@dma-contracts/utils/percentage.utils'
import { BorrowArgs, DepositArgs } from '@dma-library/operations'
import { aaveOperations } from '@dma-library/operations/aave'
import { AaveLikeStrategyAddresses } from '@dma-library/operations/aave-like'
import { getContract } from '@dma-library/protocols/aave-like/utils'
import { encodeOperation } from '@dma-library/utils/operation'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { ERC20, WETH } from '@typechain'
import { BigNumber as BigNumberJS } from 'bignumber.js'
import { assert } from 'chai'
import { BigNumber, ethers } from 'ethers'

export async function createETHPositionAAVEv3(
  snapshot: Snapshot,
  WETH: WETH,
  debtToken: ERC20,
  aaveLikeAddresses: AaveLikeStrategyAddresses,
  depositEthAmount: BigNumber,
  maxLTV: BigNumber,
  signer?: SignerWithAddress,
) {
  const config = snapshot.config
  const network = await getNetwork(config.provider)
  const helpers = snapshot.testSystem.helpers
  const operationExecutor = snapshot.testSystem.deployment.system.OperationExecutor.contract
  const userProxy = snapshot.testSystem.helpers.userProxy
  const oracle = await getContract(
    snapshot.testSystem.deployment.config.aave.v3.Oracle.address,
    'Oracle',
    config.provider,
    'AAVE_V3',
  )

  if (!signer) {
    signer = await SignerWithAddress.create(
      snapshot.config.signer as ethers.providers.JsonRpcSigner,
    )
  }

  const priceBase = BigNumber.from(10).pow(8)

  const wethPrice = await oracle.getAssetPrice(WETH.address)
  if (!wethPrice) {
    assert.fail('WETH price not available')
  }

  const totalBorrowAmount = depositEthAmount.mul(wethPrice).div(priceBase)
  const requestedBorrowAmount = applyPercentage(totalBorrowAmount, maxLTV)

  const depositArgs: DepositArgs = {
    entryTokenAddress: aaveLikeAddresses.tokens.ETH,
    entryTokenIsEth: true,
    amountInBaseUnit: new BigNumberJS(depositEthAmount.toString()),
    depositToken: WETH.address,
    depositorAddress: signer.address,
    isSwapNeeded: false,
  }

  const borrowArgs: BorrowArgs = {
    borrowToken: debtToken.address,
    amount: new BigNumberJS(requestedBorrowAmount.toString()),
    account: userProxy.address,
    user: signer.address,
    isEthToken: false,
  }

  const openBorrowOperation = await aaveOperations.borrow.v3.openDepositBorrow(
    depositArgs,
    borrowArgs,
    {
      protocol: 'AAVE_V3',
      positionType: 'Borrow',
    },
    aaveLikeAddresses,
    network,
  )

  const calldata = encodeOperation(openBorrowOperation, {
    operationExecutor: operationExecutor.address,
    provider: config.provider,
  })

  const ethBalanceBefore = await config.provider.getBalance(signer.address)
  const daiBalanceBefore = await debtToken.balanceOf(signer.address)

  const [success, contractReceipt] = await executeThroughDPMProxy(
    helpers.userProxy.address,
    {
      address: operationExecutor.address,
      calldata: calldata,
    },
    signer,
    depositEthAmount.toString(),
  )

  const txCostEth = contractReceipt.gasUsed.mul(contractReceipt.effectiveGasPrice)

  const ethBalanceAfter = await config.provider.getBalance(signer.address)
  const daiBalanceAfter = await debtToken.balanceOf(signer.address)

  const ethDeposited = ethBalanceBefore.sub(ethBalanceAfter).sub(txCostEth)
  const totalDaiBorrowed = daiBalanceAfter.sub(daiBalanceBefore)

  return {
    success,
    ethDeposited,
    requestedBorrowAmount,
    totalDaiBorrowed,
  }
}
