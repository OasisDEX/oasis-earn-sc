import hre, { ethers } from 'hardhat'
import erc20abi from "@abis/external/tokens/IERC20.json";
import wethAbi from "@abis/external/tokens/IWETH.json";
import aaveProtocolDataProviderAbi from "@abis/external/protocols/aave/v3/aaveProtocolDataProvider.json";

import poolAbi from '@abis/external/protocols/aave/v3/pool.json'
import { BigNumber as BN } from "ethers";
import BigNumber from 'bignumber.js';
import { DeploymentSystem } from './deployment/deploy';
import { RuntimeConfig } from '@dma-common/types/common';
import { createDPMAccount, ensureWeiFormat } from '@dma-common/test-utils';
import { executeThroughDPMProxy } from '@dma-common/utils/execute';

import { actions } from '@dma-library/actions'
import { Network } from '@dma-library';
import { OperationsRegistry } from '@deploy-configurations/utils/wrappers/operations-registry';
import { getActionHash } from '@deploy-configurations/utils/action-hash';
import { loadContractNames } from '../../deploy-configurations/constants/load-contract-names';
import { FlashloanProvider } from '@dma-library/types';
import { MAX_UINT } from '@dma-common/constants';
import { amountToWei } from '@dma-common/utils/common';
import { getLastVault, getVaultInfo } from '@dma-common/utils/maker';
import { dpm } from '@typechain/abis/external/libs';

async function main() {
  const signer = hre.ethers.provider.getSigner(0)
  const network = Network.MAINNET
  const provider = hre.ethers.provider
  const address = await signer.getAddress()
  console.log(`Deployer address: ${address}`)
  console.log(`Network: ${network}`)

  const hideLogging = false

  const ds = new DeploymentSystem(hre)

  const config: RuntimeConfig = await ds.init(hideLogging)

  console.log("RPC", ds.rpcUrl);
  console.log('Resetting node to latest block')
  await ds.resetNodeToLatestBlock()

  const systemConfigPath = `/test/mainnet.conf.ts`
  console.log('Loading config from', systemConfigPath)
  await ds.loadConfig(systemConfigPath)
  await ds.extendConfig('/test/local-extend.conf.ts')

  await ds.deployAll()
  await ds.addAllEntries()
  await ds.replaceDummySwapContracts()

  const dsSystem = ds.getSystem()
  const { system, registry, config: systemConfig } = dsSystem

  await system.AccountGuard.contract.setWhitelist(system.OperationExecutor.contract.address, true)

  const operationsRegistry = new OperationsRegistry(
    system.OperationsRegistry.contract.address,
    signer,
  )

  const WETHaddress = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'
  const DAIaddress = '0x6B175474E89094C44Da98b954EedeAC495271d0F'
  const USDCaddress = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'
  const aDAIaddress = '0x018008bfb33d285247A21d44E50697654f754e63'
  const vdUsdc = "0x72E95b8931767C79bA4EeE721354d6E99a61D004"
  const aavePoolDataProvider = '0x7B4EB56E7CD4b454BA8ff71E4518426369a138a3'
  const poolAddress = '0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2'

  const aaveProtocolDataProviderContract = new ethers.Contract(aavePoolDataProvider, aaveProtocolDataProviderAbi, provider).connect(signer);
  const daiContract = new hre.ethers.Contract(DAIaddress, erc20abi, provider).connect(signer);
  const usdcContract = new hre.ethers.Contract(USDCaddress, erc20abi, provider).connect(signer);
  const WETH = new hre.ethers.Contract(WETHaddress, wethAbi, provider).connect(signer);
  const aDaiContract = new hre.ethers.Contract(aDAIaddress, erc20abi, provider).connect(signer);

  const slot = 2;
  const daiBalance = BN.from("1000000000000000000").mul(100000)
  // const usdcBorrowAmount = BN.from("1000000").mul(100)

  let index = hre.ethers.utils.solidityKeccak256(["uint256", "uint256"], [address, slot]);
  if (index.startsWith("0x0")) index = "0x" + index.slice(3);

  await hre.ethers.provider.send("hardhat_setStorageAt", [
    DAIaddress,
    index,
    hre.ethers.utils.hexZeroPad(daiBalance.toHexString(), 32),
  ]);

  const bal = await daiContract.balanceOf(address)

  console.log('USER DAI BALANCE', bal.toString());

  const [dpmProxy] = await createDPMAccount(system.AccountFactory.contract)
  const [dpmProxy2] = await createDPMAccount(system.AccountFactory.contract)

  console.log('DPM', dpmProxy);

  const SERVICE_REGISTRY_NAMES = loadContractNames(network)

  const initialColl = new BigNumber(100)
  const initialDebt = new BigNumber(40000)

  await WETH.deposit({ value: amountToWei(initialColl).toFixed(0) })

  const wethBal = await WETH.balanceOf(address)

  await WETH.approve(dpmProxy, amountToWei(initialColl).toFixed(0))

  const daiBalanceBefore = await daiContract.balanceOf(address)

  console.log('daiBalanceBefore', daiBalanceBefore.toString());

  const ethAJoinAddress = '0x2F0b23f53734252Bda2277357e97e1517d6B042A'
  const ethBJoinAddress = '0x08638ef1a205be6762a8b935f5da9b700cf7322c'

  const openVaultAction = actions.maker.open(
    network,
    {
      joinAddress: ethAJoinAddress,
    },
    [0],
  )

  const pullCollateralIntoProxyAction = actions.common.pullToken(
    network,
    {
      from: address,
      asset: WETH.address,
      amount: amountToWei(new BigNumber(initialColl)),
    },
  )

  const depositAction = actions.maker.deposit(

    network,
    {
      joinAddress: ethAJoinAddress,
      vaultId: 0,
      amount: amountToWei(new BigNumber(initialColl)),
    },
    [0, 1, 0],
  )

  const generateAction = actions.maker.generate(
    network,
    {
      to: address,
      vaultId: 0,
      amount: amountToWei(initialDebt),
    },
    [0, 1, 0],
  )


  const giveAction = actions.maker.give(
    network,
    {
      to: dpmProxy2!,
      vaultId: 0,
    },
    [0, 1],
  )



  const calls = [
    pullCollateralIntoProxyAction,
    openVaultAction,
    depositAction,
    generateAction,
    giveAction
  ]

  // adding custom operation to the registry, so there is no need to add others, just use custom one
  await operationsRegistry.addOp('CustomOperation', [])

  const exec = await executeThroughDPMProxy(
    dpmProxy!,
    {
      address: system.OperationExecutor.contract.address,
      calldata: system.OperationExecutor.contract.interface.encodeFunctionData('executeOp', [
        calls,
        'CustomOperation',
      ]),
    },
    signer,
    '0',
    hre,
  )

  const daiBalanceAfter = await daiContract.balanceOf(address)
  console.log('daiBalanceAfter', daiBalanceAfter.toString());


  let vault = await getLastVault(provider, signer, dpmProxy2!)
  let info = await getVaultInfo(system.McdView.contract, vault.id, vault.ilk)

  console.log('VAULT INFO', info);


  // ------------------------------- REFINANCE MAKER ETH-A - Aave ETH-DAI  -------------------------------

  const paybackDai = new BigNumber(0) // Can be anything because paybackAll flag is true
  const paybackAll = true

  const daiJoinAddress = '0x9759A6Ac90977b93B58547b4A71c78317f391A28'

  const paybackAction = actions.maker.payback(
    network,
    {
      vaultId: vault.id,
      userAddress: dpmProxy2!,
      daiJoin: daiJoinAddress,
      amount: amountToWei(paybackDai),
      paybackAll,
    },
    [0, 0, 0, 0, 0],
  )

  const withdrawAction = actions.maker.withdraw(
    network,
    {
      vaultId: vault.id,
      userAddress: dpmProxy2!,
      joinAddr: ethAJoinAddress,
      amount: amountToWei(initialColl),
    },
    [0, 0, 0, 0],
  )

  const aaveV3LendingPool = '0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2'

  const setAaveApproval = actions.common.setApproval(
    network,
    {
      asset: WETH.address,
      delegate: aaveV3LendingPool,
      // Check the explanation about the deposit action.
      // This approval is about the amount that's going to be deposit in the following action
      amount: amountToWei(initialColl),
      sumAmounts: false,
    },
    [0, 0, 0, 0],
  )

  const aaveDepositAction = actions.aave.v3.aaveV3Deposit(
    network,
    {
      asset: WETH.address,
      amount: amountToWei(initialColl),
      sumAmounts: false,
      setAsCollateral: true,
    },
    [0, 0, 0, 0],
  )


  const aaveV3BorrowAction = actions.aave.v3.aaveV3Borrow(network, {
    amount: amountToWei(initialDebt),
    asset: DAIaddress,
    to: system.OperationExecutor.contract.address,
  })

  const sendTokenAction = actions.common.sendToken(network, {
    amount: amountToWei(initialDebt),
    asset: DAIaddress,
    to: system.OperationExecutor.contract.address,
  })

  const callsRefinance = [
    paybackAction,
    withdrawAction,
    setAaveApproval,
    aaveDepositAction,
    aaveV3BorrowAction,
    sendTokenAction,
    //positionCreated // add this action to emit an event
  ]

  const takeFlashloan = actions.common.takeAFlashLoan(
    network,
    {
      flashloanAmount: amountToWei(initialDebt),
      asset: DAIaddress,
      isProxyFlashloan: true,
      isDPMProxy: true,
      provider: FlashloanProvider.DssFlash,
      calls: callsRefinance,
    }
  )

  await executeThroughDPMProxy(
    dpmProxy2!,
    {
      address: system.OperationExecutor.contract.address,
      calldata: system.OperationExecutor.contract.interface.encodeFunctionData('executeOp', [
        [takeFlashloan],
        'CustomOperation',
      ]),
    },
    signer,
    '0',
    hre,
  )


  // const userStEthReserveDataProxy = await aaveProtocolDataProviderContract.getUserReserveData(
  //   WETH.address,
  //   dpmProxy2!,
  // )
  // console.log('userStEthReserveDataProxy:', userStEthReserveDataProxy)



  const aaveCollInfo2 = await aaveProtocolDataProviderContract.getUserReserveData(WETH.address, dpmProxy2!)
  const aaveDebtInfo2 = await aaveProtocolDataProviderContract.getUserReserveData(DAIaddress, dpmProxy2!)


  console.log('AAVE COLL INFO', aaveCollInfo2 );
  console.log('AAVE DEBT INFO', aaveDebtInfo2 );
  
  // const vault = await getLastVault(provider, signer, system.common.userProxyAddress)
  // const info = await getVaultInfo(system.maker.mcdView, vault.id, vault.ilk)

  // const daiBalanceAfter2 = await daiContract.balanceOf(address)
  // console.log('daiBalanceAfter2', daiBalanceAfter2.toString());


  vault = await getLastVault(provider, signer, dpmProxy2!)
  info = await getVaultInfo(system.McdView.contract, vault.id, vault.ilk)

  console.log('VAULT INFO POST PAYBACK', info);

  process.exit(0)


}

main().catch(error => {
  console.error(error)
  process.exitCode = 1
})
