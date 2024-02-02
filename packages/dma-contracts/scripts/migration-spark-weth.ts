import hre, { ethers } from 'hardhat'
import { HardhatUtils } from "@ajna-contracts/scripts";
import erc20abi from "@abis/external/tokens/IERC20.json";
import aaveProtocolDataProviderAbi from "@abis/external/protocols/aave/v3/aaveProtocolDataProvider.json";
import wethAbi from "@abis/external/tokens/IWETH.json";

import poolAbi from '@abis/external/protocols/aave/v3/pool.json'
import { BigNumber as BN } from "ethers";
import BigNumber from 'bignumber.js';
import { DeploymentSystem } from './deployment/deploy';
import { RuntimeConfig } from '@dma-common/types/common';
import { createDPMAccount } from '@dma-common/test-utils';
import { dpm } from '@typechain/abis/external/libs';
import { executeThroughDPMProxy } from '@dma-common/utils/execute';

import { actions } from '@dma-library/actions'
import { Network } from '@dma-library';
import { OperationsRegistry } from '@deploy-configurations/utils/wrappers/operations-registry';
import { getActionHash } from '@deploy-configurations/utils/action-hash';
import { loadContractNames } from '../../deploy-configurations/constants/load-contract-names';
import { FlashloanProvider, PositionType } from '@dma-library/types';
import { MAX_UINT, TEN } from '@dma-common/constants';
import { migrateEOA } from '@dma-library/operations/spark/migrate/migrateEOA';
import { spark } from '@dma-library/strategies/spark';
import { pool } from '@typechain/dma-contracts/artifacts/contracts/ajna/interfaces';

async function main() {
  const signer = hre.ethers.provider.getSigner(0)
  const network = Network.MAINNET
  const provider = hre.ethers.provider
  const address = await signer.getAddress()
  console.log(`Deployer address: ${address}`)
  console.log(`Network: ${network}`)

  const hideLogging = false

  const ds = new DeploymentSystem(hre)

  await ds.init(hideLogging)

  console.log('Resetting node to latest block')
  await ds.resetNodeToLatestBlock()

  const systemConfigPath = `/test/mainnet.conf.ts`
  console.log('Loading config from', systemConfigPath)
  await ds.loadConfig(systemConfigPath)
  await ds.extendConfig('/test/local-extend.conf.ts')

  await ds.deployAll()
  await ds.addAllEntries()

  const dsSystem = ds.getSystem()
  const { system, registry, config: systemConfig } = dsSystem

  await system.AccountGuard.contract.setWhitelist(system.OperationExecutor.contract.address, true)

  const DAIaddress = '0x6B175474E89094C44Da98b954EedeAC495271d0F'
  const USDCaddress = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'
  const WETHAddress = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'

  const sparkOracleAddress = '0x8105f69D9C41644c6A0803fDA7D03Aa70996cFD9'
  const aWETHaddress = '0x59cD1C87501baa753d0B5B5Ab5D8416A45cD71DB' // in spark
  const vdUsdc = "0x7B70D04099CB9cfb1Db7B6820baDAfB4C5C70A67"  // in spark
  const sparkPoolDataProvider = '0xFc21d6d146E6086B8359705C8b28512a983db0cb'
  const poolAddress = '0xC13e21B648A5Ee794902342038FF3aDAB66BE987'

  const aaveProtocolDataProviderContract = new ethers.Contract(sparkPoolDataProvider, aaveProtocolDataProviderAbi, provider).connect(signer);
  const wethContract = new hre.ethers.Contract(WETHAddress, wethAbi, provider).connect(signer);

  const usdcContract = new hre.ethers.Contract(USDCaddress, erc20abi, provider).connect(signer);
  const aWETHContract = new hre.ethers.Contract(aWETHaddress, erc20abi, provider).connect(signer);

  const slot = 3; //for WETH slot 3, for dai slot 2
  const balance = BN.from("1000000000000000000").mul(1000)

  let index = hre.ethers.utils.solidityKeccak256(["uint256", "uint256"], [address, slot]);
  if (index.startsWith("0x0")) index = "0x" + index.slice(3);

  await hre.ethers.provider.send("hardhat_setStorageAt", [
    WETHAddress,
    index,
    hre.ethers.utils.hexZeroPad(balance.toHexString(), 32),
  ]);

  const poolContract = new ethers.Contract(poolAddress, poolAbi, provider).connect(signer);

  const supplyAmount = BN.from("1000000000000000000").mul(2)
  await wethContract.approve(poolAddress, supplyAmount)
  await poolContract.supply(WETHAddress, supplyAmount, address, 0)
  await poolContract.setUserUseReserveAsCollateral(WETHAddress, true)

  const wethBalance = await aWETHContract.balanceOf(address);

  const aBal2 = new BigNumber(wethBalance.toString())  

  const usdcBorrowAmount = BN.from("1000000").mul(100)

  await poolContract.borrow(USDCaddress, usdcBorrowAmount, 2, 0, address)

  const aaveCollInfo = await aaveProtocolDataProviderContract.getUserReserveData(WETHAddress, address)
  const aaveDebtInfo = await aaveProtocolDataProviderContract.getUserReserveData(USDCaddress, address)

  console.log('aaveCollInfo', aaveCollInfo);
  console.log('aaveDebtInfo', aaveDebtInfo);

  const [dpmProxy] = await createDPMAccount(system.AccountFactory.contract)

  await aWETHContract.approve(dpmProxy, aBal2.times(new BigNumber(1.01)).toFixed(0)) //aave aToken approval - slightly bigger, as aToken balance grows constantly
  
  const flAmount = new BigNumber("100000000000000000000") // 100 eth
    
  const op = await migrateEOA({
    debt: {
      address: USDCaddress,
      isEth: false,
    },
    flashloan: {
      token: {
        address: WETHAddress,
        amount: flAmount,
      },
      amount: flAmount, //deprecated
      provider: FlashloanProvider.Balancer
    },
    aToken: {
      address: aWETHaddress,
      amount: aBal2,
    },
    vdToken: {
      address: vdUsdc,
    },
    proxy: {
      address: dpmProxy!,
      owner: address,
      isDPMProxy: true,
    },    
    addresses: {
      tokens: {
        DAI: systemConfig.common.DAI.address,
        ETH: systemConfig.common.ETH.address,
        WETH: systemConfig.common.WETH.address,
        USDC: systemConfig.common.USDC.address,
      },
        chainlinkEthUsdPriceFeed: systemConfig.common.ChainlinkPriceOracle_ETHUSD.address,
        operationExecutor: system.OperationExecutor.contract.address,
        oracle: sparkOracleAddress,
        lendingPool: poolAddress,
        poolDataProvider: sparkPoolDataProvider
    },
    positionType: 'Migrate',
    network: Network.MAINNET,
  })  

  const exec = await executeThroughDPMProxy(
    dpmProxy!,
    {
      address: system.OperationExecutor.contract.address,
      calldata: system.OperationExecutor.contract.interface.encodeFunctionData('executeOp', [
        op.calls,
        op.operationName,
      ]),
    },
    signer,
    '0',
    5000000,
    hre,
  )

  const aaveCollInfo2 = await aaveProtocolDataProviderContract.getUserReserveData(WETHAddress, address)
  const aaveDebtInfo2 = await aaveProtocolDataProviderContract.getUserReserveData(USDCaddress, address)

  console.log('aaveCollInfo post op', aaveCollInfo2);
  console.log('aaveDebtInfo post op', aaveDebtInfo2);

  const aaveCollInfo3 = await aaveProtocolDataProviderContract.getUserReserveData(WETHAddress, dpmProxy)
  const aaveDebtInfo3 = await aaveProtocolDataProviderContract.getUserReserveData(USDCaddress, dpmProxy)

  console.log('aaveCollInfo post op DPM', aaveCollInfo3);
  console.log('aaveDebtInfo post op DPM', aaveDebtInfo3);

  const aBal3 = await aWETHContract.balanceOf(address)
  console.log('EOA atoken bal: ', aBal3.toString());

  const aBal4 = await aWETHContract.balanceOf(dpmProxy)
  console.log('DPM atoken bal: ', aBal4.toString());

  process.exit(1)
}

main().catch(error => {
  console.error(error)
})
