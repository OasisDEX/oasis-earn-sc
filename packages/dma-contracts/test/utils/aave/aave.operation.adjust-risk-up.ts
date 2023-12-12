import { getNetwork } from '@deploy-configurations/utils/network'
import { mockExchangeGetData } from '@dma-common/test-utils'
import { executeThroughDPMProxy } from '@dma-common/utils/execute'
import { Snapshot } from '@dma-contracts/utils'
import { aaveOperations } from '@dma-library/operations/aave'
import { AdjustRiskUpArgs } from '@dma-library/operations/aave/multiply/v3/adjust-risk-up'
import { AaveLikeStrategyAddresses } from '@dma-library/operations/aave-like'
import { FlashloanProvider } from '@dma-library/types'
import { encodeOperation } from '@dma-library/utils/operation'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { ERC20, WETH } from '@typechain'
import { BigNumber as BigNumberJS } from 'bignumber.js'
import { BigNumber, ethers } from 'ethers'

import { getMaxDebtToBorrow } from './debt-calculation'

export async function adjustRiskUpAAVEv3(
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
  const mockExchange = snapshot.testSystem.deployment.system.MockExchange.contract
  const userProxy = snapshot.testSystem.helpers.userDPMProxy

  if (!signer) {
    signer = await SignerWithAddress.create(
      snapshot.config.signer as ethers.providers.JsonRpcSigner,
    )
  }

  const requestedBorrowAmount = await getMaxDebtToBorrow(
    snapshot,
    WETH,
    debtToken,
    depositEthAmount,
    maxLTV,
  )

  const { DAI } = aaveLikeAddresses.tokens
  const flashloanAmount = new BigNumberJS(1000).times(10 ** 18)

  const adjustUpArgs: AdjustRiskUpArgs = {
    collateral: {
      address: WETH.address,
      isEth: false,
    },
    debt: {
      address: debtToken.address,
      isEth: false,
      borrow: {
        amount: new BigNumberJS(requestedBorrowAmount.toString()),
      },
    },
    deposit: undefined,
    swap: {
      fee: 0,
      data: mockExchangeGetData(mockExchange, DAI, WETH.address, flashloanAmount.toString(), false),
      collectFeeFrom: 'sourceToken',
      receiveAtLeast: new BigNumberJS(0),
      amount: new BigNumberJS(flashloanAmount.toString()),
    },
    flashloan: {
      provider: FlashloanProvider.DssFlash,
      token: {
        address: debtToken.address,
        amount: flashloanAmount,
      },
      amount: flashloanAmount,
    },
    proxy: {
      address: userProxy.address,
      owner: signer.address,
      isDPMProxy: true,
    },
    addresses: aaveLikeAddresses,
    network,
  }

  const adjustRiskUpOperation = await aaveOperations.multiply.v3.adjustRiskUp(adjustUpArgs)

  const calldata = encodeOperation(adjustRiskUpOperation, {
    operationExecutor: operationExecutor.address,
    provider: config.provider,
  })

  const ethBalanceBefore = await config.provider.getBalance(signer.address)
  const daiBalanceBefore = await debtToken.balanceOf(signer.address)

  const [success, contractReceipt] = await executeThroughDPMProxy(
    helpers.userDPMProxy.address,
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
