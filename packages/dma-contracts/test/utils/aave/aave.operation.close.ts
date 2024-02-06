import { getNetwork } from '@deploy-configurations/utils/network'
import { mockExchangeGetData } from '@dma-common/test-utils'
import { executeThroughDPMProxy } from '@dma-common/utils/execute'
import { Snapshot } from '@dma-contracts/utils'
import { aaveOperations } from '@dma-library/operations/aave'
import { AaveLikeStrategyAddresses } from '@dma-library/operations/aave-like'
import { FlashloanProvider, PositionType } from '@dma-library/types'
import { encodeOperation } from '@dma-library/utils/operation'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { ERC20, WETH } from '@typechain'
import { BigNumber as BigNumberJS } from 'bignumber.js'
import { BigNumber, ethers } from 'ethers'
import AAVEProtocolDataProviderABI from '@abis/external/protocols/aave/v3/aaveProtocolDataProvider.json'

import { CloseArgs } from '@dma-library/operations/aave/multiply/v3/close'

export async function closeAAVEv3(
  snapshot: Snapshot,
  WETH: WETH,
  debtToken: ERC20,
  aaveLikeAddresses: AaveLikeStrategyAddresses,
  depositEthAmount: BigNumber,
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
  const closeArgs: CloseArgs = {
    collateral: {
      address: WETH.address,
      isEth: false,
    },
    debt: {
      address: debtToken.address,
      isEth: false,
    },
    position: {
      type: 'Multiply',
      collateral: {
        amount: new BigNumberJS(depositEthAmount.toString()),
      }
    },
    swap: {
      fee: 0,
      data: mockExchangeGetData(mockExchange, WETH.address, DAI, new BigNumberJS(1).times(10 ** 18).toString(), false),
      collectFeeFrom: 'sourceToken',
      receiveAtLeast: new BigNumberJS(0),
      amount: new BigNumberJS(flashloanAmount.toString()),
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

  const adjustRiskUpOperation = await aaveOperations.multiply.v3.close(closeArgs)

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


  console.log('ETH AFTER - SIGNER', ethBalanceAfter.toString());
  console.log('DAI AFTER - SGINER', daiBalanceAfter.toString() );

  const aavePoolDataProvider = '0x7B4EB56E7CD4b454BA8ff71E4518426369a138a3'

  const USDCaddress = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'
  const WETHAddress = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'

  const aaveProtocolDataProviderContract = new ethers.Contract(aavePoolDataProvider, AAVEProtocolDataProviderABI, signer.provider).connect(signer);

  const aaveCollInfo2 = await aaveProtocolDataProviderContract.getUserReserveData(WETHAddress, helpers.userDPMProxy.address)
  const aaveDebtInfo2 = await aaveProtocolDataProviderContract.getUserReserveData(USDCaddress, helpers.userDPMProxy.address)

  console.log('aaveCollInfo post op', aaveCollInfo2);
  console.log('aaveDebtInfo post op', aaveDebtInfo2);
  
  
  return {
    success,
  }
}
