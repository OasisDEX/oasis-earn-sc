import { getNetwork } from '@deploy-configurations/utils/network'
import { ZERO } from '@dma-common/constants'
import { mockExchangeGetData, mockOneInchCallWithMockData } from '@dma-common/test-utils'
import { executeThroughDPMProxy } from '@dma-common/utils/execute'
import { Snapshot } from '@dma-contracts/utils'
import { RiskRatio, strategies, views } from '@dma-library'
import { AaveLikeStrategyAddresses } from '@dma-library/operations/aave-like'
import {
  AaveAdjustArgs,
  AaveV3AdjustDependencies,
} from '@dma-library/strategies/aave/multiply/adjust/types'
import { encodeOperation } from '@dma-library/utils/operation'
import {
  AaveGetCurrentPositionArgs,
  AaveV3GetCurrentPositionDependencies,
  AaveView,
} from '@dma-library/views/aave'
import { RISK_RATIO_CTOR_TYPE } from '@domain'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { ERC20, WETH } from '@typechain'
import { BigNumber as BigNumberJS } from 'bignumber.js'
import { ethers } from 'ethers'

export async function adjustRiskUpAAVEv3(
  snapshot: Snapshot,
  WETH: WETH,
  debtTokenContract: ERC20,
  aaveLikeAddresses: AaveLikeStrategyAddresses,
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

  const debtToken: Parameters<AaveView['v3']>[0]['debtToken'] = { symbol: 'DAI', precision: 18 }
  const collateralToken: Parameters<AaveView['v3']>[0]['collateralToken'] = {
    symbol: 'WETH',
    precision: 18,
  }
  const addresses = aaveLikeAddresses
  const viewPositionArgs: AaveGetCurrentPositionArgs = {
    proxy: userProxy.address,
    debtToken,
    collateralToken,
  }
  const viewPositionDependencies: Omit<AaveV3GetCurrentPositionDependencies, 'protocolVersion'> = {
    addresses,
    provider: signer.provider as ethers.providers.Provider,
  }
  const currentPosition = await views.aave.v3(viewPositionArgs, viewPositionDependencies)
  const adjustUpArgs: AaveAdjustArgs = {
    slippage: new BigNumberJS(0.05), // 5%
    multiple: new RiskRatio(new BigNumberJS(2.5), RISK_RATIO_CTOR_TYPE.MULITPLE),
    debtToken,
    collateralToken,
  }

  // TODO: Add block warning
  const mockMarketPrice = new BigNumberJS(2194.43)
  const { DAI } = aaveLikeAddresses.tokens
  // Note: Fixed based on mock market price (flashloan amount is
  const flashloanAmount = new BigNumberJS(534.171781849).times(10 ** 18)
  const mockExchangeData = mockExchangeGetData(
    mockExchange,
    DAI,
    WETH.address,
    flashloanAmount.toString(),
    false,
  )

  const strategyDependencies: Omit<AaveV3AdjustDependencies, 'protocol'> = {
    isDPMProxy: true,
    addresses,
    provider: signer.provider as ethers.providers.Provider,
    currentPosition,
    getSwapData: mockOneInchCallWithMockData(mockExchangeData)(mockMarketPrice, {
      from: debtToken.precision!,
      to: collateralToken.precision!,
    }),
    proxy: userProxy.address,
    user: await userProxy.owner(),
    network,
    positionType: 'Multiply',
  }

  const adjustRiskUpStrategy = await strategies.aave.multiply.v3.adjust(
    adjustUpArgs,
    strategyDependencies,
  )
  const adjustRiskUpOperation = adjustRiskUpStrategy.transaction
  const calldata = encodeOperation(adjustRiskUpOperation, {
    operationExecutor: operationExecutor.address,
    provider: config.provider,
  })

  const ethBalanceBefore = await config.provider.getBalance(signer.address)
  const daiBalanceBefore = await debtTokenContract.balanceOf(signer.address)

  const [success, contractReceipt] = await executeThroughDPMProxy(
    helpers.userDPMProxy.address,
    {
      address: operationExecutor.address,
      calldata: calldata,
    },
    signer,
    ZERO.toString(),
  )

  const txCostEth = contractReceipt.gasUsed.mul(contractReceipt.effectiveGasPrice)

  const ethBalanceAfter = await config.provider.getBalance(signer.address)
  const daiBalanceAfter = await debtTokenContract.balanceOf(signer.address)

  const ethDeposited = ethBalanceBefore.sub(ethBalanceAfter).sub(txCostEth)
  const totalDaiBorrowed = daiBalanceAfter.sub(daiBalanceBefore)

  return {
    success,
    ethDeposited,
    totalDaiBorrowed,
  }
}
