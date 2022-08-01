import { JsonRpcProvider } from '@ethersproject/providers'
import BigNumber from 'bignumber.js'
import { expect } from 'chai'
import { Contract, Signer } from 'ethers'
import { ethers } from 'hardhat'

import ERC20ABI from '../../abi/IERC20.json'
import chainlinkPriceFeedABI from '../../abi/chainlinkPriceFeedABI.json'
import { AaveDepositAction } from '../../helpers/actions/aave/AaveDepositAction'
import { ADDRESSES } from '../../helpers/addresses'
import { CONTRACT_NAMES, OPERATION_NAMES } from '../../helpers/constants'
import { executeThroughProxy } from '../../helpers/deploy'
import init, { resetNode } from '../../helpers/init'
import { calldataTypes } from '../../helpers/types/actions'
import { RuntimeConfig } from '../../helpers/types/common'
import { ActionFactory, amountToWei, approve, balanceOf, ensureWeiFormat } from '../../helpers/utils'
import { ServiceRegistry } from '../../helpers/wrappers/serviceRegistry'
import { DeployedSystemInfo, deploySystem } from '../deploySystem'
import { expectToBeEqual } from '../utils'
import { actions } from '../../helpers/actions'
import { Operation } from '../../helpers/Operation'

const createAction = ActionFactory.create

let DAI: Contract
let WETH: Contract
let stETH: Contract

describe(`Operations | AAVE | ${OPERATION_NAMES.aave.OPEN_POSITION}`, async () => {
  let provider: JsonRpcProvider
  let signer: Signer
  let address: string
  let system: DeployedSystemInfo
  let registry: ServiceRegistry
  let config: RuntimeConfig
  let options: any

  before(async () => {
    config = await init()
    provider = config.provider
    signer = config.signer
    address = config.address

    options = {
      debug: true,
      config,
    }

    const blockNumber = 15249000
    resetNode(provider, blockNumber)

    const { system: _system, registry: _registry } = await deploySystem(config)
    system = _system
    registry = _registry
  })

  const flashloanAmount = amountToWei(new BigNumber(1000000))
  const depositAmount = amountToWei(new BigNumber(200000))
  const borrowAmount = amountToWei(new BigNumber(5))

  const testName = `should open stEth position`

  it(testName, async () => {

  const priceFeed = new ethers.Contract(ADDRESSES.main.chainlinkEthUsdPriceFeed, chainlinkPriceFeedABI, provider);
  let roundData = await priceFeed.latestRoundData();
  let decimals = await priceFeed.decimals();
  const ethPrice = new BigNumber((roundData.answer.toString() / Math.pow(10, decimals)));
  console.log('PRICE', ethPrice.toFixed(2));


    const WEthPrice = await system.aave.aavePriceOracle.getAssetPrice(ADDRESSES.main.WETH)
    const stEthPriceinEth = await system.aave.aavePriceOracle.getAssetPrice(ADDRESSES.main.stETH)
    

    const stEthPrice = ethPrice.times(new BigNumber(stEthPriceinEth.toString()).div(Math.pow(10, 18)))
    console.log('ethPrice', ethPrice.toString() );
    console.log('stEthPrice', stEthPrice.toString() );

    
    // Transfer stETH to exchange for Swap

    const toImpersonate = "0xdc24316b9ae028f1497c275eb9192a3ea0f67022"; 
    await provider.send('hardhat_impersonateAccount', [toImpersonate])
    const account = ethers.provider.getSigner(toImpersonate)
    const accountAddress =  await account.getAddress()
    stETH = new ethers.Contract(ADDRESSES.main.stETH, ERC20ABI, provider).connect(account)
    const bal = await stETH.balanceOf(accountAddress);
    await stETH.transfer(system.common.exchange.address, bal);
    await provider.send('hardhat_stopImpersonatingAccount', [toImpersonate]);

    await approve(ADDRESSES.main.DAI, system.common.dsProxy.address, depositAmount, config, true)


    // const depoAmount = amountToWei(new BigNumber(4.9))

    // console.log('depo amount', depoAmount.toString() );
    // // APPROVE LENDING POOL
    // const setStEthApprovalOnLendingPool = createAction(
    //   await registry.getEntryHash(CONTRACT_NAMES.common.SET_APPROVAL),
    //   [calldataTypes.common.Approval],
    //   [
    //     {
    //       amount: depoAmount.toFixed(0),
    //       asset: ADDRESSES.main.stETH,
    //       delegator: ADDRESSES.main.aave.MainnetLendingPool,
    //     },
    //   ],
    // )
    // // DEPOSIT stETH IN AAVE


    // const depositStEthInAAVE = createAction(
    //   await registry.getEntryHash(CONTRACT_NAMES.aave.DEPOSIT),
    //   [calldataTypes.aave.Deposit],
    //   [
    //     {
    //       amount: depoAmount.toFixed(0),
    //       asset: ADDRESSES.main.stETH,
    //     },
    //   ],
    // )

    const ethDepoAmount = amountToWei(new BigNumber(10))

    const aaveOpenSthEthOp = new Operation(
      system.common.operationExecutor,
      OPERATION_NAMES.common.CUSTOM_OPERATION,
      [
        new actions.common.WrapEthAction({
          amount: ethers.constants.MaxUint256
        }),
        // new actions.common.PullTokenAction({
        //   amount: depositAmount.toFixed(0),
        //   asset: ADDRESSES.main.DAI,
        //   from: address,
        // }),
        new actions.common.TakeFlashloanAction({
          amount: flashloanAmount.toFixed(0),
          borrower: system.common.operationExecutor.address,
          dsProxyFlashloan: true,
          calls: [
            new actions.common.SetApprovalAction({
              amount: flashloanAmount.toFixed(0),
              asset: ADDRESSES.main.DAI,
              delegator: ADDRESSES.main.aave.MainnetLendingPool,  
            }, [0, 0, 0]),
            new actions.aave.AaveDepositAction({
              asset: ADDRESSES.main.DAI,
              amount: flashloanAmount.toFixed(0),
            }, [0, 0]),
            new actions.aave.AaveBorrowAction({
              amount: borrowAmount.toFixed(0),
              asset: ADDRESSES.main.ETH,
            }),
            new actions.test.DummySwapAction({
              fromAsset: ADDRESSES.main.WETH,
              toAsset: ADDRESSES.main.stETH,
              amount: borrowAmount.plus(ethDepoAmount).toFixed(0),
              receiveAtLeast: amountToWei(1).toFixed(),
              withData: 0,
            }),
            new actions.common.SetApprovalAction({
              amount: 0,
              asset: ADDRESSES.main.stETH,
              delegator: ADDRESSES.main.aave.MainnetLendingPool,  
            }, [4, 0, 0]),
            new actions.aave.AaveDepositAction({
              asset: ADDRESSES.main.stETH,
              amount: 0
            }, [0, 4]),
            new actions.aave.AaveWithdrawAction({
              asset: ADDRESSES.main.DAI,
              amount: flashloanAmount.toFixed(0),
            }),
            new actions.common.SendTokenAction({
              asset: ADDRESSES.main.DAI,
              to: system.common.operationExecutor.address,
              amount: flashloanAmount.toFixed(0),
            }),
          ],
        })
      ]
    )

    const opCalldata = aaveOpenSthEthOp.encodeForProxyCall();

    await executeThroughProxy(
      system.common.dsProxy.address,
      {
        address: system.common.operationExecutor.address,
        calldata: opCalldata,
      },
      signer,
      ensureWeiFormat(ethDepoAmount)
    )

    console.log('VAR DEBT ', await (await balanceOf(ADDRESSES.main.variableDebtWETH, system.common.dsProxy.address, options)).toString());
    
    expectToBeEqual(await balanceOf(ADDRESSES.main.ETH, system.common.dsProxy.address, options), 0)
    // expectToBeEqual(await balanceOf(ADDRESSES.main.aDAI, system.common.dsProxy.address, options), depositAmount.toFixed())
    expectToBeEqual(await balanceOf(ADDRESSES.main.variableDebtWETH, system.common.dsProxy.address, options), borrowAmount.toFixed())
  })
})
