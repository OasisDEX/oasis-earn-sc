import { expect } from 'chai'
import BigNumber from 'bignumber.js'
import { ethers } from 'hardhat'
import { JsonRpcProvider } from '@ethersproject/providers'
import { Contract, Signer, utils } from 'ethers'
import {ADDRESSES} from '../helpers/addresses/index'

import ERC20ABI from '../abi/IERC20.json'

import { Action } from './actions/action'

import { getVaultInfo } from '../helpers/maker/vault-info'
import { ActionFactory, balanceOf, amountToWei } from '../helpers/utils'

import { DeployedSystemInfo, deployTestSystem, getLastCDP } from './helpers/deploy-test-system'
import { ensureWeiFormat } from './helpers/param-calculations'
import { executeThroughProxy } from '../helpers/deploy'
import { getOrCreateProxy } from '../helpers/proxy'
import { CONTRACT_LABELS } from '../helpers/constants'
import { swapUniswapTokens } from '../helpers/swap/uniswap'
import { SwapData } from '../helpers/types'

const LENDER_FEE = new BigNumber(0)

const createAction = ActionFactory.create;


// async function checkMPAPostState(tokenAddress: string, mpaAddress: string) {
//   return {
//     daiBalance: await balanceOf(ADDRESSES.main.DAI, mpaAddress),
//     collateralBalance: await balanceOf(tokenAddress, mpaAddress),
//   }
// }

describe('Guni open with dummy Exchange', async () => {
  const oazoFee = 2 // divided by base (10000), 1 = 0.01%;
  const oazoFeePct = new BigNumber(oazoFee).div(10000)
  const flashLoanFee = LENDER_FEE
  const slippage = new BigNumber(0.0001) // percentage

  let provider: JsonRpcProvider
  let signer: Signer
  let address: string
  let system: DeployedSystemInfo
  let exchangeDataMock: { to: string; data: number }
  let DAI: Contract

  before(async () => {
    provider = new ethers.providers.JsonRpcProvider()
    signer = provider.getSigner(0)
    DAI = new ethers.Contract(ADDRESSES.main.DAI, ERC20ABI, provider).connect(signer)
    address = await signer.getAddress()

    provider.send('hardhat_reset', [
      {
        forking: {
          jsonRpcUrl: process.env.MAINNET_URL,
          blockNumber: 13803788,
        },
      },
    ])

    system = await deployTestSystem(true, false)
  })
  describe(`Open Guni Vault with FL`, async () => {
   
    it(`Open Vault`, async () => {

      provider = new ethers.providers.JsonRpcProvider()
      signer = provider.getSigner(0)
      const USDC = new ethers.Contract(ADDRESSES.main.USDC, ERC20ABI, provider).connect(signer)
      const DAI = new ethers.Contract(ADDRESSES.main.DAI, ERC20ABI, provider).connect(signer)


      const receivedUSDC = amountToWei(200, 6)
      const receivedDAI = amountToWei(200)
  
      const config = {
        provider,
        signer,
        address
      }
      await swapUniswapTokens(
        ADDRESSES.main.WETH,
        ADDRESSES.main.USDC,
        amountToWei(100).toFixed(0),
        receivedUSDC.toFixed(0),
        address,
        config
      )
  
      await swapUniswapTokens(
        ADDRESSES.main.WETH,
        ADDRESSES.main.DAI,
        amountToWei(100).toFixed(0),
        receivedDAI.toFixed(0),  
        address,
        config
      )
  
      const balanceDAI = await DAI.balanceOf(address)
      const balanceUSDC = await USDC.balanceOf(address)

      console.log('BALANCE USDC', balanceUSDC.toString() );
      console.log('BALANCE DAI', balanceDAI.toString() );
  
      await USDC.transfer(system.dummyExchange.address, balanceUSDC.toString())
      await DAI.transfer(system.dummyExchange.address, balanceDAI.toString())

      const exchangeBalanceUSDC = await USDC.balanceOf(system.dummyExchange.address)
      const exchangeBalanceDAI = await DAI.balanceOf(system.dummyExchange.address)

      system.dummyExchange.setPrice(USDC.address, ensureWeiFormat(new BigNumber(1)));
      system.dummyExchange.setPrice(DAI.address, ensureWeiFormat(new BigNumber(1)));
      system.dummyExchange.setPrecision(USDC.address, 6);
      system.dummyExchange.setPrecision(DAI.address, 18);
      console.log('BALANCE EXCHANGE USDC', exchangeBalanceUSDC.toString() );
      console.log('BALANCE EXCHANGE DAI', exchangeBalanceDAI.toString() );

      // get moar DAI & USDC

      await swapUniswapTokens(
        ADDRESSES.main.WETH,
        ADDRESSES.main.DAI,
        amountToWei(100).toFixed(0),
        receivedUSDC.toFixed(0),  
        address,
        config
      )

      await swapUniswapTokens(
        ADDRESSES.main.WETH,
        ADDRESSES.main.USDC,
        amountToWei(100).toFixed(0),
        receivedUSDC.toFixed(0),  
        address,
        config
      )

      const proxyAddress = await getOrCreateProxy(signer);

      const initialColl = new BigNumber(200) 

      // ---------------------------------------------------------------------------

    const one = new BigNumber(1)
    const daiBalance = new BigNumber(10000)
    const expectedCR = new BigNumber(1.05)
    const leveragedAmount = daiBalance.div(expectedCR.minus(one))
    const flashLoanAmount = leveragedAmount.minus(daiBalance)

    const guniDaiUsdc = '0xAbDDAfB225e10B90D798bB8A886238Fb835e2053'
    const gUniResolver = '0x0317650Af6f184344D7368AC8bB0bEbA5EDB214a'

    const usdcAmount = await system.guniViewInstance.getOtherTokenAmount(
      guniDaiUsdc,
      gUniResolver,
      amountToWei(leveragedAmount).toFixed(0),
      6
    )

      const openVault = createAction(
        utils.keccak256(utils.toUtf8Bytes(CONTRACT_LABELS.maker.OPEN_VAULT)),
        ["tupple(address joinAddr, address mcdManager)"],
        [{
          joinAddr: ADDRESSES.main.joinGUNIV3DAIUSDC1_A,
          mcdManager: ADDRESSES.main.cdpManager,
        }],
        [0, 0]
      );

      const guniDeposit = createAction(
        utils.keccak256(utils.toUtf8Bytes(CONTRACT_LABELS.guni.GUNI_DEPOSIT)),
        ["tupple(address joinAddr, address mcdManager, uint256 vaultId)"],
        [{
          joinAddr: ADDRESSES.main.joinGUNIV3DAIUSDC1_A,
          mcdManager: ADDRESSES.main.cdpManager,
          vaultId: 0,
        }],
        [0, 0, 1, 0]
      );

      const guniAmount = new BigNumber(280);
      const deposit2 = createAction(
        utils.keccak256(utils.toUtf8Bytes(CONTRACT_LABELS.maker.DEPOSIT)),
        ["tupple(address joinAddr, address mcdManager, uint256 vaultId, uint256 amount)"],
        [{
          joinAddr: ADDRESSES.main.joinGUNIV3DAIUSDC1_A,
          mcdManager: ADDRESSES.main.cdpManager,
          vaultId: 0,
          amount: ensureWeiFormat(guniAmount),
        }],
        [0, 0, 1, 0]
      );


      const pullToken = createAction(
        utils.keccak256(utils.toUtf8Bytes(CONTRACT_LABELS.common.PULL_TOKEN)),
        ["tupple(address asset, address from, uint256 amount)"],
        [{
          asset: ADDRESSES.main.DAI,
          from: address,
          amount: ensureWeiFormat(daiBalance),
        }],
        [0, 0, 0]
      );

      const generate2 = createAction(
        utils.keccak256(utils.toUtf8Bytes(CONTRACT_LABELS.maker.GENERATE)),
        ["tupple(address to, address mcdManager, uint256 vaultId, uint256 amount)"],
        [{
          to: system.operationExecutor.address,
          mcdManager: ADDRESSES.main.cdpManager,
          vaultId: 0,
          amount: ensureWeiFormat(flashLoanAmount),
        }],
        [0, 0, 1, 0]
      );

      const ALLOWANCE = new BigNumber(10000000000000000000000000)
      await DAI.approve(system.dsProxyInstance.address, ensureWeiFormat(ALLOWANCE))

      const swapAction = createAction(
        utils.keccak256(utils.toUtf8Bytes(CONTRACT_LABELS.test.DUMMY_SWAP)),
        ["tuple(address fromAsset, address toAsset, uint256 amount, uint256 receiveAtLeast, bytes withData)"],
        [ {
          fromAsset: ADDRESSES.main.DAI,
          toAsset: ADDRESSES.main.USDC,
          amount: usdcAmount.toString(),
          receiveAtLeast: amountToWei(1, 6).toFixed(),
          withData: 0,
        }],
        []
      )
      
      const takeAFlashloan = createAction(
        utils.keccak256(utils.toUtf8Bytes(CONTRACT_LABELS.common.TAKE_A_FLASHLOAN)),
          ["tuple(uint256 amount, address borrower, (bytes32 targetHash, bytes callData)[] calls)"],
        [
          {
            amount: ensureWeiFormat(flashLoanAmount),
            borrower: system.operationExecutor.address,
            calls: [
              pullToken,
              swapAction,
              guniDeposit,
              deposit2,
              generate2,
            ]
          }
        ],
        [

        ]
      )

      const result = await executeThroughProxy(
        proxyAddress,
        {
          address: system.operationExecutor.address,
          calldata: system.operationExecutor.interface.encodeFunctionData("executeOp", [
            [
              openVault,
              takeAFlashloan,
            ]
          ]),
        },
        signer,
        ensureWeiFormat(initialColl),
      );

      if( !result[0] ) {
        // console.log('ERROR: ', result[1] );
        console.log('EXECUTION FAILED!' );
      }

      const vault = await getLastCDP(provider, signer, proxyAddress)
      const info = await getVaultInfo(system.mcdViewInstance, vault.id, vault.ilk)

      console.log('VAULT INFO', info.coll.toString());
      console.log('VAULT INFO', info.debt.toString());
      
      console.log('OPENED NEW VAULT: ', vault.id );
      
    })
  }) 
})
