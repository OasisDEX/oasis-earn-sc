import { getNetwork } from '@deploy-configurations/utils/network'
import { mockExchangeGetData } from '@dma-common/test-utils'
import { executeThroughDPMProxy } from '@dma-common/utils/execute'
import { Snapshot } from '@dma-contracts/utils'
import { aaveOperations } from '@dma-library/operations/aave'
import { AdjustRiskDownArgs } from '@dma-library/operations/aave/multiply/v3/adjust-risk-down'
import { AaveLikeStrategyAddresses } from '@dma-library/operations/aave-like'
import { FlashloanProvider } from '@dma-library/types'
import { encodeOperation } from '@dma-library/utils/operation'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { ERC20, WETH } from '@typechain'
import { BigNumber as BigNumberJS } from 'bignumber.js'
import { BigNumber, ethers } from 'ethers'

export async function adjustRiskDownAAVEv3(
  snapshot: Snapshot,
  WETH: WETH,
  debtToken: ERC20,
  aaveLikeAddresses: AaveLikeStrategyAddresses,
  reduceETHByAmount: BigNumber,
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

  const { DAI } = aaveLikeAddresses.tokens
  const flashloanAmount = new BigNumberJS(10000).times(10 ** 18)
  const adjustRiskDownArgs: AdjustRiskDownArgs = {
    collateral: {
      address: WETH.address,
      isEth: false,
      withdrawal: {
        amount: new BigNumberJS(reduceETHByAmount.toString()),
      },
    },
    debt: {
      address: debtToken.address,
      isEth: false,
    },
    deposit: undefined,
    swap: {
      fee: 0,
      data: mockExchangeGetData(
        mockExchange,
        WETH.address,
        DAI,
        reduceETHByAmount.toString(),
        false,
      ),
      collectFeeFrom: 'sourceToken',
      receiveAtLeast: new BigNumberJS(0),
      amount: new BigNumberJS(reduceETHByAmount.toString()),
    },
    flashloan: {
      provider: FlashloanProvider.Balancer,
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

  const adjustRiskDownOperation = await aaveOperations.multiply.v3.adjustRiskDown(
    adjustRiskDownArgs,
  )

  const calldata = encodeOperation(adjustRiskDownOperation, {
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
    '0',
  )

  const txCostEth = contractReceipt.gasUsed.mul(contractReceipt.effectiveGasPrice)

  const ethBalanceAfter = await config.provider.getBalance(signer.address)
  const daiBalanceAfter = await debtToken.balanceOf(signer.address)

  const ethDeposited = ethBalanceBefore.sub(ethBalanceAfter).sub(txCostEth)
  const totalDaiBorrowed = daiBalanceAfter.sub(daiBalanceBefore)

  return {
    success,
    ethDeposited,
    reduceETHByAmount,
    totalDaiBorrowed,
  }
}
