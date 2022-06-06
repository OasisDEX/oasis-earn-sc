import BigNumber from "bignumber.js";
import _ from "lodash";
import { curry } from "ramda";
import { ethers } from "hardhat";
import {
  BigNumber as EthersBN,
  Contract,
  ContractReceipt,
  Signer,
  utils,
} from "ethers";
import DSProxyRegistryABI from "../../../abi/external/ds-proxy-registry.json";
import DSProxyABI from "../../../abi/external/ds-proxy.json";
import WETHABI from "../../../abi/external/IWETH.json";
import ERC20ABI from "../../../abi/IERC20.json";
import GetCDPsABI from "../../../abi/external/get-cdps.json";
import UniswapRouterV3ABI from "../../../abi/external/IUniswapRouter.json";
import MAINNET_ADDRESSES from "../../../addresses/mainnet.json";

import { JsonRpcProvider } from "@ethersproject/providers";
import { balanceOf, WETH_ADDRESS } from "../../utils";

import {
  amountToWei,
  amountFromWei,
  ensureWeiFormat,
} from "./params-calculation.utils";
import { getMarketPrice } from "../http-apis";
import { CDPInfo } from "../common.types";
import { ADDRESSES, zero } from "../constants";
import { logDebug } from "./test.utils";

export const FEE = 20;
export const FEE_BASE = 10000;

export interface MCDInitParams {
  blockNumber?: string;
  provider?: JsonRpcProvider;
  signer?: Signer;
}

export interface ERC20TokenData {
  name: string;
  address: string;
  precision: number;
  pip?: string;
}

export async function init(
  params: MCDInitParams = {}
): Promise<[JsonRpcProvider, Signer]> {
  const provider = params.provider || new ethers.providers.JsonRpcProvider();
  const signer = params.signer || provider.getSigner(0);

  const forking = {
    jsonRpcUrl: process.env.ALCHEMY_NODE,
  };

  if (params.blockNumber) {
    // TODO:
    (forking as any).blockNumber = params.blockNumber
      ? parseInt(params.blockNumber, 10)
      : undefined;
  }

  await provider.send("hardhat_reset", [
    {
      forking,
    },
  ]);

  return [provider, signer];
}

/**
 * tokenIn: string - asset address
 * tokenOut: string - asset address
 * amountIn: BigNumber - already formatted to wei
 * amountOutMinimum: BigNumber - already fromatted to wei. The least amount to receive.
 * recipient: string - wallet's addrees that's going to receive the funds
 */
export async function swapTokens(
  tokenIn: string,
  tokenOut: string,
  amountIn: string,
  amountOutMinimum: string,
  recipient: string,
  provider: JsonRpcProvider,
  signer: Signer
) {
  const value = tokenIn === MAINNET_ADDRESSES.ETH ? amountIn : 0;

  const UNISWAP_ROUTER_V3 = "0xe592427a0aece92de3edee1f18e0157c05861564";
  const uniswapV3 = new ethers.Contract(
    UNISWAP_ROUTER_V3,
    UniswapRouterV3ABI,
    provider
  ).connect(signer);

  const swapParams = {
    tokenIn,
    tokenOut,
    fee: 3000,
    recipient,
    deadline: new Date().getTime(),
    amountIn,
    amountOutMinimum,
    sqrtPriceLimitX96: 0,
  };

  await uniswapV3.exactInputSingle(swapParams, { value });
}

export async function dsproxyExecuteAction(
  proxyActions: Contract,
  dsProxy: Contract,
  fromAddress: string,
  method: string,
  params: any[],
  value: BigNumber.Value = 0,
  debug = false
): Promise<[boolean, ContractReceipt]> {
  try {
    const calldata = proxyActions.interface.encodeFunctionData(method, params);

    debug && console.log(`\x1b[33m ${method} started \x1b[0m`, new Date());
    const tx = await dsProxy["execute(address,bytes)"](
      proxyActions.address,
      calldata,
      {
        from: fromAddress,
        value: ensureWeiFormat(value),
        gasLimit: 8500000,
        gasPrice: 1000000000,
      }
    );

    const result = await tx.wait();
    debug &&
      console.log(
        `\x1b[33m  ${method} completed  gasCost = ${result.gasUsed.toString()} \x1b[0m`,
        new Date()
      );

    return [true, result];
  } catch (ex) {
    debug && console.log(`\x1b[33m  ${method} failed  \x1b[0m`, ex, params);
    return [false, ex as any]; // TODO:
  }
}

export async function getOrCreateProxy(
  provider: JsonRpcProvider,
  signer: Signer
) {
  const address = await signer.getAddress();
  const dsProxyRegistry = new ethers.Contract(
    MAINNET_ADDRESSES.PROXY_REGISTRY,
    DSProxyRegistryABI,
    provider
  ).connect(signer);
  let proxyAddress = await dsProxyRegistry.proxies(address);
  if (proxyAddress === ethers.constants.AddressZero) {
    await (await dsProxyRegistry["build()"]()).wait();
    proxyAddress = await dsProxyRegistry.proxies(address);
  }
  return proxyAddress;
}

async function exchangeToToken(
  provider: JsonRpcProvider,
  signer: Signer,
  token: ERC20TokenData
) {
  const UNISWAP_ROUTER_V3 = "0xe592427a0aece92de3edee1f18e0157c05861564";
  const uniswapV3 = new ethers.Contract(
    UNISWAP_ROUTER_V3,
    UniswapRouterV3ABI,
    provider
  ).connect(signer);

  const address = await signer.getAddress();

  const swapParams = {
    tokenIn: MAINNET_ADDRESSES.ETH,
    tokenOut: token.address,
    fee: 3000,
    recipient: address,
    deadline: 1751366148,
    amountIn: amountToWei(200).toFixed(0),
    amountOutMinimum: amountToWei(zero, token.precision).toFixed(0),
    sqrtPriceLimitX96: 0,
  };

  const uniswapTx = await uniswapV3.exactInputSingle(swapParams, {
    value: amountToWei(200).toFixed(0),
  });

  await uniswapTx.wait();
}

async function transferToExchange(
  provider: JsonRpcProvider,
  signer: Signer,
  exchangeAddress: string,
  token: ERC20TokenData,
  amount: BigNumber.Value
) {
  const contract = new ethers.Contract(
    token.address,
    ERC20ABI,
    provider
  ).connect(signer);

  const tokenTransferToExchangeTx = await contract.transfer(
    exchangeAddress,
    amount
  );

  await tokenTransferToExchangeTx.wait();
}

const addFundsDummyExchange = async function (
  provider: JsonRpcProvider,
  signer: Signer,
  weth: string, // TODO: remove
  erc20Tokens: ERC20TokenData[], // TODO:
  exchange: Contract,
  debug: boolean
) {
  const WETH = new ethers.Contract(weth, WETHABI, provider).connect(signer);
  const address = await signer.getAddress();

  const exchangeToTokenCurried = curry(exchangeToToken)(provider, signer);
  const transferToExchangeCurried = curry(transferToExchange)(
    provider,
    signer,
    exchange.address
  );

  const wethDeposit = await WETH.deposit({
    value: amountToWei(1000).toFixed(0),
  });
  await wethDeposit.wait();

  const wethTransferToExchangeTx = await WETH.transfer(
    exchange.address,
    amountToWei(500).toFixed(0)
  );
  await wethTransferToExchangeTx.wait();

  // Exchange ETH for the `token`
  await Promise.all(erc20Tokens.map((token) => exchangeToTokenCurried(token)));

  // Transfer half of the accounts balance of each token to the dummy exchange.
  await Promise.all(
    erc20Tokens.map(async (token) => {
      const balance = await balanceOf(token.address, address);
      return transferToExchangeCurried(token, balance.div(2).toFixed(0));
    })
  );

  if (debug) {
    // Diplays balances of the exchange and account for each token
    await Promise.all(
      erc20Tokens.map(async function (token) {
        const [exchangeTokenBalance, addressTokenBalance] = await Promise.all([
          balanceOf(token.address, exchange.address),
          balanceOf(token.address, address),
        ]);
        console.log(
          `Exchange ${token.name} balance: ${amountFromWei(
            exchangeTokenBalance,
            token.precision
          ).toString()}`
        );
        console.log(
          `${address} ${token.name} balance: ${amountFromWei(
            addressTokenBalance,
            token.precision
          ).toString()}`
        );
      })
    );
  }
};

export async function loadDummyExchangeFixtures(
  provider: JsonRpcProvider,
  signer: Signer,
  dummyExchangeInstance: Contract,
  debug: boolean
) {
  const tokens = [
    {
      name: "ETH",
      address: MAINNET_ADDRESSES.ETH,
      pip: MAINNET_ADDRESSES.PIP_ETH,
      precision: 18,
    },
    {
      name: "DAI",
      address: MAINNET_ADDRESSES.MCD_DAI,
      pip: undefined,
      precision: 18,
    },
    {
      name: "LINK",
      address: MAINNET_ADDRESSES.LINK,
      pip: MAINNET_ADDRESSES.PIP_LINK,
      precision: 18,
    },
    {
      name: "WBTC",
      address: MAINNET_ADDRESSES.WBTC,
      pip: MAINNET_ADDRESSES.PIP_WBTC,
      precision: 8,
    },
    {
      name: "USDC",
      address: MAINNET_ADDRESSES.USDC,
      pip: MAINNET_ADDRESSES.PIP_USDC,
      precision: 6,
    },
  ];

  // Exchanging ETH for other @tokens
  await addFundsDummyExchange(
    provider,
    signer,
    WETH_ADDRESS,
    tokens.filter((token) => token.address !== MAINNET_ADDRESSES.ETH),
    dummyExchangeInstance,
    debug
  );

  // Setting precision for each @token that is going to be used.
  await Promise.all(
    tokens.map((token) => {
      if (debug) {
        console.log(`${token.name} precision: ${token.precision}`);
      }

      if (dummyExchangeInstance.setPrecision) {
        return dummyExchangeInstance.setPrecision(
          token.address,
          token.precision
        );
      }

      return true;
    })
  );

  // Setting price for each @token that has PIP
  await Promise.all(
    tokens
      .filter((token) => !!token.pip)
      .map(async (token) => {
        const price = await getMarketPrice(
          token.address,
          MAINNET_ADDRESSES.MCD_DAI,
          token.precision
        );
        const priceInWei = amountToWei(price).toFixed(0);

        if (debug) {
          console.log(
            `${
              token.name
            } Price: ${price.toString()} and Price(wei): ${priceInWei}`
          );
        }

        if (dummyExchangeInstance.setPrice) {
          return dummyExchangeInstance.setPrice(token.address, priceInWei);
        }

        return true;
      })
  );

  if (debug) {
    tokens.forEach((token) => {
      console.log(`${token.name}: ${token.address}`);
    });
  }
}

export interface DeployedSystemInfo {
  userProxyAddress: string;
  mcdViewInstance: Contract;
  exchangeInstance: Contract;
  multiplyProxyActionsInstance: Contract;
  dsProxyInstance: Contract;
  daiTokenInstance: Contract;
  gems: {
    wethTokenInstance: Contract;
  };
  guni: Contract;
  actionOpenVault: Contract;
  actionTakeFlashLoan: Contract;
  actionDeposit: Contract;
  actionPayback: Contract;
  actionWithdraw: Contract;
  actionGenerate: Contract;
  actionCdpAllow: Contract;
  actionCdpDisallow: Contract;
  flashLoanProvider: Contract;
  operationRunner: Contract;
  operationExecutor: Contract;
  operationStorage: Contract;
  operationData: Contract;
  serviceRegistry: Contract;
}

export async function deploySystem(
  provider: JsonRpcProvider,
  signer: Signer,
  usingDummyExchange = false,
  debug = false
): Promise<DeployedSystemInfo> {
  const deployedContracts: Partial<DeployedSystemInfo> = {};

  const userProxyAddress = await getOrCreateProxy(provider, signer);

  deployedContracts.userProxyAddress = userProxyAddress; // TODO:
  deployedContracts.dsProxyInstance = new ethers.Contract(
    userProxyAddress,
    DSProxyABI,
    provider
  ).connect(signer);

  // GUNI DEPLOYMENT

  const GUni = await ethers.getContractFactory(
    "GuniMultiplyProxyActions",
    signer
  );
  const guni = await GUni.deploy();
  deployedContracts.guni = await guni.deployed();

  // const multiplyProxyActions = await deploy("MultiplyProxyActions");
  const mpActionFactory = await ethers.getContractFactory(
    "MultiplyProxyActions",
    signer
  );
  const multiplyProxyActions = await mpActionFactory.deploy();
  deployedContracts.multiplyProxyActionsInstance =
    await multiplyProxyActions.deployed();

  const mcdViewFactory = await ethers.getContractFactory("McdView", signer);
  const mcdView = await mcdViewFactory.deploy();
  deployedContracts.mcdViewInstance = await mcdView.deployed();

  const exchangeFactory = await ethers.getContractFactory("Exchange", signer);
  const exchange = await exchangeFactory.deploy(
    multiplyProxyActions.address,
    ADDRESSES.feeRecipient,
    FEE
  );
  const exchangeInstance = await exchange.deployed();

  const dummyExchangeFactory = await ethers.getContractFactory(
    "DummyExchange",
    signer
  );
  const dummyExchange = await dummyExchangeFactory.deploy();
  const dummyExchangeInstance = await dummyExchange.deployed();

  deployedContracts.exchangeInstance = !usingDummyExchange
    ? exchangeInstance
    : dummyExchangeInstance;

  await loadDummyExchangeFixtures(
    provider,
    signer,
    dummyExchangeInstance,
    debug
  );

  const address = await signer.getAddress();
  if (debug) {
    logDebug([
      `Signer address: ${address}`,
      `Exchange address: ${deployedContracts.exchangeInstance.address}`,
      `User Proxy Address: ${deployedContracts.userProxyAddress}`,
      `DSProxy address: ${deployedContracts.dsProxyInstance.address}`,
      `MultiplyProxyActions address: ${deployedContracts.multiplyProxyActionsInstance.address}`,
      `GuniMultiplyProxyActions address: ${guni.address}`,
      `MCDView address: ${deployedContracts.mcdViewInstance.address}`,
    ]);
  }

  // ACTIONS POC deployed contracts

  const FMM = "0x1EB4CF3A948E7D72A198fe073cCb8C7a948cD853"; // Maker Flash Mint Module

  const ServiceRegistry = await ethers.getContractFactory(
    "ServiceRegistry",
    signer
  );
  const serviceRegistry = await ServiceRegistry.deploy([0]);
  deployedContracts.serviceRegistry = await serviceRegistry.deployed();

  const FlashLoanProvider = await ethers.getContractFactory(
    "FlashLoanProvider",
    signer
  );
  const flashLoanProvider = await FlashLoanProvider.deploy(
    serviceRegistry.address,
    FMM
  );
  deployedContracts.flashLoanProvider = await flashLoanProvider.deployed();

  const OperationRunner = await ethers.getContractFactory(
    "OperationRunner",
    signer
  );
  const operationRunner = await OperationRunner.deploy(
    serviceRegistry.address,
    FMM
  );
  deployedContracts.operationRunner = await operationRunner.deployed();

  const OperationExecutor = await ethers.getContractFactory(
    "OperationExecutor",
    signer
  );
  const operationExecutor = await OperationExecutor.deploy(
    serviceRegistry.address
  );
  deployedContracts.operationExecutor = await operationExecutor.deployed();

  const OperationStorage = await ethers.getContractFactory(
    "OperationStorage",
    signer
  );
  const operationStorage = await OperationStorage.deploy();
  deployedContracts.operationStorage = await operationStorage.deployed();

  const OperationData = await ethers.getContractFactory(
    "OperationData",
    signer
  );
  const operationData = await OperationData.deploy();
  deployedContracts.operationData = await operationData.deployed();

  const ActionOpenVault = await ethers.getContractFactory("OpenVault", signer);
  const actionOpenVault = await ActionOpenVault.deploy(serviceRegistry.address);
  deployedContracts.actionOpenVault = await actionOpenVault.deployed();

  const ActionTakeFlashLoan = await ethers.getContractFactory(
    "TakeFlashloan",
    signer
  );
  const actionTakeFlashLoan = await ActionTakeFlashLoan.deploy(
    serviceRegistry.address
  );
  deployedContracts.actionTakeFlashLoan = await actionTakeFlashLoan.deployed();

  const ActionDeposit = await ethers.getContractFactory("Deposit", signer);
  const actionDeposit = await ActionDeposit.deploy(serviceRegistry.address);
  deployedContracts.actionDeposit = await actionDeposit.deployed();

  const ActionPayback = await ethers.getContractFactory("Payback", signer);
  const actionPayback = await ActionPayback.deploy(serviceRegistry.address);
  deployedContracts.actionPayback = await actionPayback.deployed();

  const ActionWithdraw = await ethers.getContractFactory("Withdraw", signer);
  const actionWithdraw = await ActionWithdraw.deploy();
  deployedContracts.actionWithdraw = await actionWithdraw.deployed();

  const ActionGenerate = await ethers.getContractFactory("Generate", signer);
  const actionGenerate = await ActionGenerate.deploy(serviceRegistry.address);
  deployedContracts.actionGenerate = await actionGenerate.deployed();

  const ActionCdpAllow = await ethers.getContractFactory("CdpAllow", signer);
  const actionCdpAllow = await ActionCdpAllow.deploy();
  deployedContracts.actionCdpAllow = await actionCdpAllow.deployed();

  const ActionCdpDisallow = await ethers.getContractFactory(
    "CdpDisallow",
    signer
  );
  const actionCdpDisallow = await ActionCdpDisallow.deploy();
  deployedContracts.actionCdpDisallow = await actionCdpDisallow.deployed();

  await serviceRegistry.addNamedService(
    utils.keccak256(utils.toUtf8Bytes("DAI")),
    MAINNET_ADDRESSES.MCD_DAI
  );

  await serviceRegistry.addNamedService(
    utils.keccak256(utils.toUtf8Bytes("FLASH_MINT_MODULE")),
    FMM
  );
  await serviceRegistry.addNamedService(
    utils.keccak256(utils.toUtf8Bytes("OPERATION_RUNNER")),
    operationRunner.address
  );
  await serviceRegistry.addNamedService(
    utils.keccak256(utils.toUtf8Bytes("OPERATION_EXECUTOR")),
    operationExecutor.address
  );
  await serviceRegistry.addNamedService(
    utils.keccak256(utils.toUtf8Bytes("OPERATION_STORAGE")),
    operationStorage.address
  );
  await serviceRegistry.addNamedService(
    utils.keccak256(utils.toUtf8Bytes("FLASHLOAN")),
    actionTakeFlashLoan.address
  );
  await serviceRegistry.addNamedService(
    utils.keccak256(utils.toUtf8Bytes("OPEN_VAULT")),
    actionOpenVault.address
  );
  await serviceRegistry.addNamedService(
    utils.keccak256(utils.toUtf8Bytes("GENERATE")),
    actionGenerate.address
  );
  await serviceRegistry.addNamedService(
    utils.keccak256(utils.toUtf8Bytes("DEPOSIT")),
    actionDeposit.address
  );
  await serviceRegistry.addNamedService(
    utils.keccak256(utils.toUtf8Bytes("PAYBACK")),
    actionPayback.address
  );
  await serviceRegistry.addNamedService(
    utils.keccak256(utils.toUtf8Bytes("WITHDRAW")),
    actionWithdraw.address
  );
  await serviceRegistry.addNamedService(
    utils.keccak256(utils.toUtf8Bytes("CDP_ALLOW")),
    actionCdpAllow.address
  );
  await serviceRegistry.addNamedService(
    utils.keccak256(utils.toUtf8Bytes("CDP_DISALLOW")),
    actionCdpDisallow.address
  );
  return deployedContracts as DeployedSystemInfo;
}

export async function getOraclePrice(
  provider: JsonRpcProvider,
  pipAddress = MAINNET_ADDRESSES.PIP_ETH
) {
  const storageHexToBigNumber = (uint256: string) => {
    const matches = uint256.match(/^0x(\w+)$/);
    if (!matches?.length) {
      throw new Error(`invalid uint256: ${uint256}`);
    }

    const match = matches[0];
    return match.length <= 32
      ? [new BigNumber(0), new BigNumber(uint256)]
      : [
          new BigNumber(`0x${match.substring(0, match.length - 32)}`),
          new BigNumber(
            `0x${match.substring(match.length - 32, match.length)}`
          ),
        ];
  };
  const slotCurrent = 3;
  const priceHex = await provider.getStorageAt(pipAddress, slotCurrent);
  const p = storageHexToBigNumber(priceHex);
  return p[1].shiftedBy(-18);
}

export async function getLastCDP(
  provider: JsonRpcProvider,
  signer: Signer,
  proxyAddress: string
): Promise<CDPInfo> {
  const getCdps = new ethers.Contract(
    MAINNET_ADDRESSES.GET_CDPS,
    GetCDPsABI,
    provider
  ).connect(signer);
  const { ids, urns, ilks } = await getCdps.getCdpsAsc(
    MAINNET_ADDRESSES.CDP_MANAGER,
    proxyAddress
  );
  const cdp = _.last(
    _.map(_.zip(ids, urns, ilks), (cdp) => ({
      id: (cdp[0] as EthersBN).toNumber(), // TODO:
      urn: cdp[1],
      ilk: cdp[2],
    }))
  );

  if (!cdp) {
    throw new Error("No CDP available");
  }

  return cdp as CDPInfo;
}

// TODO:
export function findMPAEvent(txResult: any) {
  const abi = [
    "event MultipleActionCalled(string methodName, uint indexed cdpId, uint swapMinAmount, uint swapOptimistAmount, uint collateralLeft, uint daiLeft)",
  ];
  const iface = new ethers.utils.Interface(abi);
  const events = txResult.events
    // TODO:
    .filter((x: any) => {
      return x.topics[0] === iface.getEventTopic("MultipleActionCalled");
    })
    // TODO:
    .map((x: any) => {
      const result = iface.decodeEventLog(
        "MultipleActionCalled",
        x.data,
        x.topics
      );
      const retVal = {
        methodName: result.methodName,
        cdpId: result.cdpId.toString(),
        swapMinAmount: result.swapMinAmount.toString(),
        swapOptimistAmount: result.swapOptimistAmount.toString(),
        collateralLeft: result.collateralLeft.toString(),
        daiLeft: result.daiLeft.toString(),
      };
      return retVal;
    });
  return events;
}
