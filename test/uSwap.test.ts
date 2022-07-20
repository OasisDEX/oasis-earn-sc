import BigNumber from 'bignumber.js'
import { expect } from 'chai'
import { Contract } from 'ethers'
import { ethers } from 'hardhat'

import WETH_ABI from '../abi/IWETH.json'
import { ADDRESSES } from '../helpers/addresses'
import { CONTRACT_NAMES, ONE } from '../helpers/constants'
import { createDeploy } from '../helpers/deploy'
import init from '../helpers/init'
import { swapOneInchTokens } from '../helpers/swap/1inch'
import { calculateFee } from '../helpers/swap/calculateFee'
import { FEE } from '../helpers/swap/DummyExchange'
import { RuntimeConfig } from '../helpers/types/common'
import { amountToWei, asPercentageValue } from '../helpers/utils'
import { ServiceRegistry } from '../helpers/wrappers/serviceRegistry'

describe.only('uSwapp', () => {
  let uSwap: Contract
  let config: RuntimeConfig
  let registry: ServiceRegistry
  let WETH: Contract
  Contract

  before(async () => {
    config = await init()
    const deploy = await createDeploy({ config })

    const [serviceRegistry] = await deploy('ServiceRegistry', [0])
    registry = new ServiceRegistry(serviceRegistry.address, config.signer)

    await registry.addEntry(CONTRACT_NAMES.common.UNISWAP_ROUTER, ADDRESSES.main.uniswapRouterV3)
    const [_uSwap] = await deploy('uSwap', [
      config.address,
      ADDRESSES.main.feeRecipient,
      FEE,
      serviceRegistry.address,
    ])
    uSwap = _uSwap

    WETH = new ethers.Contract(ADDRESSES.main.WETH, WETH_ABI, config.provider).connect(
      config.signer,
    )
  })

  it('Performs swap WETH to DAi', async () => {
    const depositAmountWithFeeWei = amountToWei(new BigNumber(10))
    const fee = calculateFee(depositAmountWithFeeWei, FEE)
    const amountInWei = depositAmountWithFeeWei.minus(fee)
    const slippage = asPercentageValue(10, 100)

    const response = await swapOneInchTokens(
      ADDRESSES.main.WETH,
      ADDRESSES.main.DAI,
      amountInWei.toFixed(0),
      uSwap.address,
      slippage.value.toFixed(),
    )

    const receiveAtLeast = new BigNumber(response.toTokenAmount).times(
      ONE.minus(slippage.asDecimal),
    )

    console.log(`
    data = ${response.tx.data}
    receiveAtLeast: ${receiveAtLeast.toFixed()}
    amountInWei:    ${amountInWei.toFixed()}
    toTokenAmount:  ${response.toTokenAmount}
    
    
    `)

    await WETH.deposit({ value: depositAmountWithFeeWei.toFixed(0) })
    await WETH.approve(uSwap.address, depositAmountWithFeeWei.toFixed(0))
    await uSwap.swapTokens(
      ADDRESSES.main.WETH,
      ADDRESSES.main.DAI,
      depositAmountWithFeeWei.toFixed(0),
      0,//receiveAtLeast.toFixed(0)
      20,
      response.tx.data,
      true,
    )

    // const daiBalance = await WETH.balanceOf(ADDRESSES.main.DAI)

    // expect(daiBalance).to.be.gte(receiveAtLeast)
  })
})
