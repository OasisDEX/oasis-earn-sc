import { expect } from "chai";
import BigNumber from "bignumber.js";
import { ethers } from "hardhat";
import { JsonRpcProvider } from "@ethersproject/providers";
import { Contract, Signer } from "ethers";
import MAINNET_ADDRESSES from "../addresses/mainnet.json";
import {
  deploySystem,
  getOraclePrice,
  getLastCDP,
  DeployedSystemInfo,
} from "./common/utils/mcd-deployment.utils";
import {
  amountToWei,
  ensureWeiFormat,
  calculateParamsIncreaseMPPoC,
  prepareMultiplyParametersPoC,
} from "./common/utils/params-calculation.utils";

import ERC20ABI from "../abi/IERC20.json";
import CDPManagerABI from "../abi/external/dss-cdp-manager.json";
import { getVaultInfo } from "./common/utils/mcd.utils";
import { expectToBeEqual } from "./common/utils/test.utils";
import { Action } from "./actions/action";
import { gasEstimateHelper } from "./common/utils/gas-estimation.utils";
import {
  ExchangeData,
  SwapData,
  swapDataTypeToEncode,
} from "./common/common.types";
import { zero } from "./common/constants";

const LENDER_FEE = new BigNumber(0);
const FMM_LENDER = "0x1EB4CF3A948E7D72A198fe073cCb8C7a948cD853"; // Maker Flash Mint Module

describe("Dummy test", async () => {
  it(`Dummy case`, async () => {});
});

async function testScenarios<S, R extends (scenario: S) => void>(
  scenarios: S[],
  runner: R
) {
  for (const scenario of scenarios) {
    runner(scenario);
  }
}

let DAI: Contract;
let WETH: Contract;

function buildOperationCalldata({
  actionsBefore,
  actions,
  flashLoanAmount,
}: {
  actionsBefore: Action[];
  actions?: Action[];
  flashLoanAmount?: string;
}) {
  return {
    name: "openDepositIncreaseMPOperation",
    flashLoanToken: DAI?.address,
    flashLoanAmount: flashLoanAmount || 0,
    paramsMapping: [...actionsBefore, ...(actions || [])].map(
      (action: Action) => action.getMapping()
    ),
    actionIdsBefore: actionsBefore.map((action: Action) => action.getId()),
    callDataBefore: actionsBefore.map((action: Action) =>
      action.encodeParams()
    ),
    actionIds: (actions || []).map((action: Action) => action.getId()),
    callData: (actions || []).map((action: Action) => action.encodeParams()),
  };
}

describe("Proxy Actions | PoC | w/ Dummy Exchange", async () => {
  let provider: JsonRpcProvider;
  let signer: Signer;
  let address: string;
  let system: DeployedSystemInfo;

  before(async () => {
    provider = ethers.provider;
    // provider = new ethers.providers.JsonRpcProvider()
    signer = provider.getSigner(0);
    DAI = new ethers.Contract(
      MAINNET_ADDRESSES.MCD_DAI,
      ERC20ABI,
      provider
    ).connect(signer);
    address = await signer.getAddress();

    provider.send("hardhat_reset", [
      {
        forking: {
          jsonRpcUrl: process.env.ALCHEMY_NODE,
          blockNumber: 13274574,
        },
      },
    ]);

    system = await deploySystem(provider, signer, true);
  });

  function buildOperationCalldata(actionsBefore: Action[]) {
    return {
      name: "openDepositDrawPaybackOperation",
      flashLoanToken: DAI.address,
      flashLoanAmount: 0,
      paramsMapping: actionsBefore.map((action: Action) => action.getMapping()),
      actionIdsBefore: actionsBefore.map((action: Action) => action.getId()),
      callDataBefore: actionsBefore.map((action: Action) =>
        action.encodeParams()
      ),
      actionIds: [],
      callData: [],
    };
  }

  describe(`open|Deposit|Draw|Payback => Operation | Action by Action`, async () => {
    const marketPrice = new BigNumber(2380);
    const initialColl = new BigNumber(100); // STARTING COLLATERAL AMOUNT
    const initialDebt = new BigNumber(20000); // STARTING VAULT DEBT
    let vaultId: number;

    const gasEstimates = gasEstimateHelper();

    before(async () => {
      await system.exchangeInstance.setPrice(
        MAINNET_ADDRESSES.ETH,
        amountToWei(marketPrice).toFixed(0)
      );
    });

    const testNames = {
      openVault: `should open vault with initial collateral`,
      generatedDebt: `should generate expected debt`,
      paybackDebt: `should partially payback debt`,
      paybackAllDebt: `should payback remaining debt`,
      withdrawColl: `should withdraw collateral`,
    };

    it(testNames.openVault, async () => {
      const useFlashloan = false;

      const openVaultAction = new Action(
        "OPEN_VAULT",
        system.actionOpenVault.address,
        ["address", "address"],
        [MAINNET_ADDRESSES.MCD_JOIN_ETH_A, MAINNET_ADDRESSES.CDP_MANAGER],
        [0, 0]
      );

      const depositAction = new Action(
        "DEPOSIT",
        system.actionDeposit.address,
        ["uint256", "address", "address", "uint256"],
        [
          0,
          MAINNET_ADDRESSES.MCD_JOIN_ETH_A,
          MAINNET_ADDRESSES.CDP_MANAGER,
          ensureWeiFormat(initialColl),
        ],
        [1, 0, 0, 0]
      );

      const dsproxyCalldata =
        system.operationRunner.interface.encodeFunctionData(
          "executeOperation",
          [
            useFlashloan,
            buildOperationCalldata([openVaultAction, depositAction]),
          ]
        );

      const tx = await system.dsProxyInstance["execute(address,bytes)"](
        system.operationRunner.address,
        dsproxyCalldata,
        {
          from: address,
          value: ensureWeiFormat(initialColl),
          gasLimit: 8500000,
        }
      );

      const txReceipt = await tx.wait();
      gasEstimates.save(testNames.openVault, txReceipt);
      const vault = await getLastCDP(provider, signer, system.userProxyAddress);

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      vaultId = vault.id;
      const info = await getVaultInfo(
        system.mcdViewInstance,
        vault.id,
        vault.ilk
      );

      expect(info.coll.toString()).to.equal(initialColl.toFixed(0));
      expect(info.debt.toString()).to.equal(new BigNumber(0).toFixed(0));

      const cdpManagerContract = new ethers.Contract(
        MAINNET_ADDRESSES.CDP_MANAGER,
        CDPManagerABI,
        provider
      ).connect(signer);
      const vaultOwner = await cdpManagerContract.owns(vault.id);
      expectToBeEqual(vaultOwner, system.userProxyAddress);
    });

    it(testNames.generatedDebt, async () => {
      const useFlashloan = false;

      const generateAction = new Action(
        "GENERATE",
        system.actionGenerate.address,
        ["uint256", "address", "address", "uint256"],
        [
          vaultId,
          MAINNET_ADDRESSES.CDP_MANAGER,
          address,
          ensureWeiFormat(initialDebt),
        ],
        [0, 0, 0, 0]
      );

      const dsproxyCalldata =
        system.operationRunner.interface.encodeFunctionData(
          "executeOperation",
          [useFlashloan, buildOperationCalldata([generateAction])]
        );

      const tx = await system.dsProxyInstance["execute(address,bytes)"](
        system.operationRunner.address,
        dsproxyCalldata,
        {
          from: address,
          value: ensureWeiFormat(0),
          gasLimit: 8500000,
        }
      );
      const txReceipt = await tx.wait();
      gasEstimates.save(testNames.generatedDebt, txReceipt);

      const vault = await getLastCDP(provider, signer, system.userProxyAddress);
      vaultId = vault.id;
      const info = await getVaultInfo(
        system.mcdViewInstance,
        vault.id,
        vault.ilk
      );

      expect(info.coll.toFixed(0)).to.equal(initialColl.toFixed(0));
      expect(info.debt.toFixed(0)).to.equal(initialDebt.toFixed(0));
    });

    it(testNames.paybackDebt, async () => {
      const useFlashloan = false;

      const paybackDai = new BigNumber(5000);
      const paybackAll = false;
      const paybackAction = new Action(
        "PAYBACK",
        system.actionPayback.address,
        ["uint256", "address", "address", "address", "uint256", "bool"],
        [
          vaultId,
          address,
          MAINNET_ADDRESSES.MCD_JOIN_DAI,
          MAINNET_ADDRESSES.CDP_MANAGER,
          ensureWeiFormat(paybackDai),
          paybackAll,
        ],
        [0, 0, 0, 0]
      );
      const ALLOWANCE = new BigNumber(10000000000000000000000000);
      await DAI.approve(
        system.dsProxyInstance.address,
        ensureWeiFormat(ALLOWANCE)
      );

      const dsproxyCalldata =
        system.operationRunner.interface.encodeFunctionData(
          "executeOperation",
          [useFlashloan, buildOperationCalldata([paybackAction])]
        );

      const tx = await system.dsProxyInstance["execute(address,bytes)"](
        system.operationRunner.address,
        dsproxyCalldata,
        {
          from: address,
          value: ensureWeiFormat(0),
        }
      );
      const txReceipt = await tx.wait();
      gasEstimates.save(testNames.paybackDebt, txReceipt);

      const vault = await getLastCDP(provider, signer, system.userProxyAddress);
      vaultId = vault.id;
      const info = await getVaultInfo(
        system.mcdViewInstance,
        vault.id,
        vault.ilk
      );

      const expectedDebt = initialDebt.minus(paybackDai);
      expect(info.coll.toFixed(0)).to.equal(initialColl.toFixed(0));
      expect(info.debt.toFixed(0)).to.equal(expectedDebt.toFixed(0));
    });

    it(testNames.paybackAllDebt, async () => {
      const useFlashloan = false;
      const vault = await getLastCDP(provider, signer, system.userProxyAddress);

      const prePaybackInfo = await getVaultInfo(
        system.mcdViewInstance,
        vault.id,
        vault.ilk
      );
      const paybackDai = new BigNumber(0); // Can be anything because paybackAll flag is true
      const paybackAll = true;
      const paybackAction = new Action(
        "PAYBACK",
        system.actionPayback.address,
        ["uint256", "address", "address", "address", "uint256", "bool"],
        [
          vaultId,
          address,
          MAINNET_ADDRESSES.MCD_JOIN_DAI,
          MAINNET_ADDRESSES.CDP_MANAGER,
          ensureWeiFormat(paybackDai),
          paybackAll,
        ],
        [0, 0, 0, 0]
      );
      const ALLOWANCE = new BigNumber(prePaybackInfo.debt);
      await DAI.approve(
        system.dsProxyInstance.address,
        ensureWeiFormat(ALLOWANCE)
      );

      const dsproxyCalldata =
        system.operationRunner.interface.encodeFunctionData(
          "executeOperation",
          [useFlashloan, buildOperationCalldata([paybackAction])]
        );

      const tx = await system.dsProxyInstance["execute(address,bytes)"](
        system.operationRunner.address,
        dsproxyCalldata,
        {
          from: address,
          value: ensureWeiFormat(0),
          gasLimit: 8500000,
        }
      );
      const txReceipt = await tx.wait();
      gasEstimates.save(testNames.paybackAllDebt, txReceipt);

      const info = await getVaultInfo(
        system.mcdViewInstance,
        vault.id,
        vault.ilk
      );

      const expectedDebt = new BigNumber(0);
      expect(info.coll.toFixed(0)).to.equal(initialColl.toFixed(0));
      expect(info.debt.toFixed(0)).to.equal(expectedDebt.toFixed(0));
    });

    it(testNames.withdrawColl, async () => {
      const useFlashloan = false;

      const withdrawAction = new Action(
        "WITHDRAW",
        system.actionWithdraw.address,
        ["uint256", "address", "address", "address", "uint256"],
        [
          vaultId,
          address,
          MAINNET_ADDRESSES.MCD_JOIN_ETH_A,
          MAINNET_ADDRESSES.CDP_MANAGER,
          ensureWeiFormat(initialColl),
        ],
        [0, 0, 0, 0]
      );

      const dsproxyCalldata =
        system.operationRunner.interface.encodeFunctionData(
          "executeOperation",
          [useFlashloan, buildOperationCalldata([withdrawAction])]
        );

      const tx = await system.dsProxyInstance["execute(address,bytes)"](
        system.operationRunner.address,
        dsproxyCalldata,
        {
          from: address,
          value: ensureWeiFormat(0),
          gasLimit: 8500000,
        }
      );

      const txReceipt = await tx.wait();
      gasEstimates.save(testNames.withdrawColl, txReceipt);

      const vault = await getLastCDP(provider, signer, system.userProxyAddress);
      const info = await getVaultInfo(
        system.mcdViewInstance,
        vault.id,
        vault.ilk
      );

      const expectedDebt = new BigNumber(0);
      const expectedColl = new BigNumber(0);
      expect(info.coll.toFixed(0)).to.equal(expectedColl.toFixed(0));
      expect(info.debt.toFixed(0)).to.equal(expectedDebt.toFixed(0));
    });

    after(() => {
      gasEstimates.print();
    });
  });

  describe(`open|Deposit|Draw|Payback => Operation | Full Operation`, async () => {
    const marketPrice = new BigNumber(2380);
    const initialColl = new BigNumber(100);
    const initialDebt = new BigNumber(20000);

    const gasEstimates = gasEstimateHelper();

    before(async () => {
      await system.exchangeInstance.setPrice(
        MAINNET_ADDRESSES.ETH,
        amountToWei(marketPrice).toFixed(0)
      );
    });

    const testName = `should open vault, deposit ETH, generate DAI, repay debt in full and withdraw collateral`;
    it(testName, async () => {
      const useFlashloan = false;

      const openVaultAction = new Action(
        "OPEN_VAULT",
        system.actionOpenVault.address,
        ["address", "address"],
        [MAINNET_ADDRESSES.MCD_JOIN_ETH_A, MAINNET_ADDRESSES.CDP_MANAGER],
        [0, 0]
      );

      const depositAction = new Action(
        "DEPOSIT",
        system.actionDeposit.address,
        ["uint256", "address", "address", "uint256"],
        [
          0,
          MAINNET_ADDRESSES.MCD_JOIN_ETH_A,
          MAINNET_ADDRESSES.CDP_MANAGER,
          ensureWeiFormat(initialColl),
        ],
        [1, 0, 0, 0]
      );

      const generateAction = new Action(
        "GENERATE",
        system.actionGenerate.address,
        ["uint256", "address", "address", "uint256"],
        [
          0,
          MAINNET_ADDRESSES.CDP_MANAGER,
          address,
          ensureWeiFormat(initialDebt),
        ],
        [1, 0, 0, 0]
      );

      const paybackDai = new BigNumber(0); // Can be anything because paybackAll flag is true
      const paybackAll = true;
      const paybackAction = new Action(
        "PAYBACK",
        system.actionPayback.address,
        ["uint256", "address", "address", "address", "uint256", "bool"],
        [
          0,
          address,
          MAINNET_ADDRESSES.MCD_JOIN_DAI,
          MAINNET_ADDRESSES.CDP_MANAGER,
          ensureWeiFormat(paybackDai),
          paybackAll,
        ],
        [1, 0, 0, 0]
      );
      const ALLOWANCE = new BigNumber(
        "0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF"
      );
      await DAI.approve(
        system.dsProxyInstance.address,
        ensureWeiFormat(ALLOWANCE)
      );

      const withdrawAction = new Action(
        "WITHDRAW",
        system.actionWithdraw.address,
        ["uint256", "address", "address", "address", "uint256"],
        [
          0,
          address,
          MAINNET_ADDRESSES.MCD_JOIN_ETH_A,
          MAINNET_ADDRESSES.CDP_MANAGER,
          ensureWeiFormat(initialColl),
        ],
        [1, 0, 0, 0]
      );

      const dsproxyCalldata =
        system.operationRunner.interface.encodeFunctionData(
          "executeOperation",
          [
            useFlashloan,
            buildOperationCalldata([
              openVaultAction,
              depositAction,
              generateAction,
              paybackAction,
              withdrawAction,
            ]),
          ]
        );

      const tx = await system.dsProxyInstance["execute(address,bytes)"](
        system.operationRunner.address,
        dsproxyCalldata,
        {
          from: address,
          value: ensureWeiFormat(initialColl),
          gasLimit: 8500000,
        }
      );
      const txReceipt = await tx.wait();
      gasEstimates.save(testName, txReceipt);

      const vault = await getLastCDP(provider, signer, system.userProxyAddress);
      const info = await getVaultInfo(
        system.mcdViewInstance,
        vault.id,
        vault.ilk
      );

      const expectedColl = new BigNumber(0);
      const expectedDebt = new BigNumber(0);
      expect(info.coll.toString()).to.equal(expectedColl.toFixed(0));
      expect(info.debt.toString()).to.equal(expectedDebt.toFixed(0));

      const cdpManagerContract = new ethers.Contract(
        MAINNET_ADDRESSES.CDP_MANAGER,
        CDPManagerABI,
        provider
      ).connect(signer);
      const vaultOwner = await cdpManagerContract.owns(vault.id);
      expectToBeEqual(vaultOwner, system.userProxyAddress);
    });

    after(() => {
      gasEstimates.print();
    });
  });
});

describe("Multiply Proxy Actions | PoC | w/ Dummy Exchange", async () => {
  const oazoFee = 2; // divided by base (10000), 1 = 0.01%;
  const oazoFeePct = new BigNumber(oazoFee).div(10000);
  const flashLoanFee = LENDER_FEE;
  const slippage = new BigNumber(0.0001); // percentage

  let provider: JsonRpcProvider;
  let signer: Signer;
  let address: string;
  let system: DeployedSystemInfo;
  let exchangeDataMock: { to: string; data: number };

  type DesiredCdpState = {
    requiredDebt: BigNumber;
    toBorrowCollateralAmount: BigNumber;
    daiTopUp: BigNumber;
    fromTokenAmount: BigNumber;
    toTokenAmount: BigNumber;
    collTopUp: BigNumber;
  };

  before(async () => {
    // provider = new ethers.providers.JsonRpcProvider()
    provider = ethers.provider;
    signer = provider.getSigner(0);
    DAI = new ethers.Contract(
      MAINNET_ADDRESSES.MCD_DAI,
      ERC20ABI,
      provider
    ).connect(signer);
    WETH = new ethers.Contract(
      MAINNET_ADDRESSES.ETH,
      ERC20ABI,
      provider
    ).connect(signer);
    address = await signer.getAddress();

    provider.send("hardhat_reset", [
      {
        forking: {
          jsonRpcUrl: process.env.ALCHEMY_NODE,
          blockNumber: 13274574,
        },
      },
    ]);

    system = await deploySystem(provider, signer, true);

    exchangeDataMock = {
      to: system.exchangeInstance.address,
      data: 0,
    };
  });

  describe(`Increase Multiple Operations`, async () => {
    let oraclePrice: BigNumber;
    const marketPrice = new BigNumber(2900);
    const defaultInitialColl = new BigNumber(100);
    const defaultInitialDebt = new BigNumber(0);
    const defaultDaiTopUp = new BigNumber(0);
    const defaultCollTopUp = new BigNumber(0);

    const gasEstimates = gasEstimateHelper();

    type OpenDepositIncreaseMultipleScenario = {
      testName: string;
      initialColl: BigNumber;
      initialDebt: BigNumber;
      daiTopUp: BigNumber;
      collTopUp: BigNumber;
      requiredCollRatio: BigNumber;
      useFlashloan: boolean;
      vaultUnsafe: boolean;
      debug?: boolean;
    };

    before(async () => {
      oraclePrice = await getOraclePrice(provider);
      DAI = new ethers.Contract(
        MAINNET_ADDRESSES.MCD_DAI,
        ERC20ABI,
        provider
      ).connect(signer);

      await system.exchangeInstance.setPrice(
        MAINNET_ADDRESSES.ETH,
        amountToWei(marketPrice).toFixed(0)
      );
    });

    const scenarios: Array<OpenDepositIncreaseMultipleScenario> = [
      {
        testName: `should open vault, deposit ETH and increase multiple`,
        initialColl: defaultInitialColl,
        initialDebt: defaultInitialDebt,
        daiTopUp: defaultDaiTopUp,
        collTopUp: defaultCollTopUp,
        useFlashloan: false,
        requiredCollRatio: new BigNumber(5),
        vaultUnsafe: false,
      },
      {
        testName: `should open vault, deposit ETH and increase multiple & [+Flashloan]`,
        initialColl: defaultInitialColl,
        initialDebt: defaultInitialDebt,
        daiTopUp: defaultDaiTopUp,
        collTopUp: defaultCollTopUp,
        useFlashloan: true,
        requiredCollRatio: new BigNumber(2.5),
        vaultUnsafe: false,
      },
      {
        testName: `should open vault, deposit ETH and increase multiple & [+DAI topup]`,
        initialColl: defaultInitialColl,
        initialDebt: defaultInitialDebt,
        daiTopUp: new BigNumber(20000),
        collTopUp: defaultCollTopUp,
        useFlashloan: false,
        requiredCollRatio: new BigNumber(5),
        vaultUnsafe: false,
        debug: false,
      },
      {
        testName: `should open vault, deposit ETH and increase multiple & [+Flashloan, +DAI topup]`,
        initialColl: defaultInitialColl,
        initialDebt: defaultInitialDebt,
        daiTopUp: new BigNumber(20000),
        collTopUp: defaultCollTopUp,
        useFlashloan: true,
        requiredCollRatio: new BigNumber(2),
        vaultUnsafe: false,
      },
      {
        testName: `should open vault, deposit ETH and increase multiple & [+Flashloan, +DAI topup]`,
        initialColl: defaultInitialColl,
        initialDebt: defaultInitialDebt,
        daiTopUp: new BigNumber(20000),
        collTopUp: defaultCollTopUp,
        useFlashloan: true,
        requiredCollRatio: new BigNumber(1),
        vaultUnsafe: true,
      },
      {
        testName: `should open vault, deposit ETH and increase multiple & [+Coll topup]`,
        initialColl: defaultInitialColl,
        initialDebt: defaultInitialDebt,
        daiTopUp: defaultDaiTopUp,
        collTopUp: new BigNumber(10),
        useFlashloan: false,
        requiredCollRatio: new BigNumber(5),
        vaultUnsafe: false,
        debug: false,
      },
      {
        testName: `should open vault, deposit ETH and increase multiple & [+Flashloan, +Coll topup]`,
        initialColl: defaultInitialColl,
        initialDebt: defaultInitialDebt,
        daiTopUp: defaultDaiTopUp,
        collTopUp: new BigNumber(10),
        useFlashloan: true,
        requiredCollRatio: new BigNumber(2.5),
        vaultUnsafe: false,
      },
      {
        testName: `should open vault, deposit ETH and increase multiple & [+Flashloan, +Coll topup, +DAI topup]`,
        initialColl: defaultInitialColl,
        initialDebt: defaultInitialDebt,
        daiTopUp: new BigNumber(20000),
        collTopUp: new BigNumber(10),
        useFlashloan: true,
        requiredCollRatio: new BigNumber(2),
        vaultUnsafe: false,
      },
    ];

    const scenarioRunner = ({
      testName,
      initialColl,
      initialDebt,
      daiTopUp,
      collTopUp,
      useFlashloan,
      requiredCollRatio,
      vaultUnsafe,
      debug = false,
    }: OpenDepositIncreaseMultipleScenario) => {
      function includeCollateralTopupActions({
        actions,
        topUpData,
      }: {
        actions: any[];
        topUpData: { token: string; amount: BigNumber; from: string };
      }) {
        const transferCollTopupToProxyAction = new Action(
          "TRANSFER_TO_PROXY",
          system.actionTransferToProxy.address,
          ["address", "uint256", "address"],
          [topUpData.token, ensureWeiFormat(topUpData.amount), topUpData.from],
          []
        );

        const topupCollateralDepositAction = new Action(
          "DEPOSIT",
          system.actionDeposit.address,
          ["uint256", "address", "address", "uint256"],
          [
            0,
            MAINNET_ADDRESSES.MCD_JOIN_ETH_A,
            MAINNET_ADDRESSES.CDP_MANAGER,
            ensureWeiFormat(collTopUp),
          ],
          [1, 0, 0, 0]
        );
        actions.push(transferCollTopupToProxyAction);
        actions.push(topupCollateralDepositAction);
      }
      function includeDaiTopupActions({
        actions,
        topUpData,
      }: {
        actions: any[];
        topUpData: { token: string; amount: BigNumber; from: string };
      }) {
        const transferDaiTopupToProxyAction = new Action(
          "TRANSFER_TO_PROXY",
          system.actionTransferToProxy.address,
          ["address", "uint256", "address"],
          [topUpData.token, ensureWeiFormat(topUpData.amount), topUpData.from],
          []
        );

        actions.push(transferDaiTopupToProxyAction);
      }
      async function includeIncreaseMultipleActions({
        actions,
        cdpState,
        exchangeData,
      }: {
        actions: any[];
        cdpState: DesiredCdpState;
        exchangeData: ExchangeData;
      }) {
        // Generate DAI -> Swap for collateral -> Deposit collateral
        const generateDaiForSwap = new Action(
          "GENERATE",
          system.actionGenerate.address,
          ["uint256", "address", "address", "uint256"],
          [
            0,
            MAINNET_ADDRESSES.CDP_MANAGER,
            address,
            ensureWeiFormat(cdpState.requiredDebt),
          ],
          [1, 0, 0, 0]
        );

        const transferGeneratedDaiToProxyAction = new Action(
          "TRANSFER_TO_PROXY",
          system.actionTransferToProxy.address,
          ["address", "uint256", "address"],
          [
            exchangeData.fromTokenAddress,
            ensureWeiFormat(cdpState.requiredDebt),
            address,
          ],
          []
        );

        const swapAmount = new BigNumber(exchangeData.fromTokenAmount)
          .plus(ensureWeiFormat(cdpState.daiTopUp))
          .toFixed(0);

        const swapData: SwapData = {
          fromAsset: exchangeData.fromTokenAddress,
          toAsset: exchangeData.toTokenAddress,
          // Add daiTopup amount to swap
          amount: swapAmount,
          receiveAtLeast: exchangeData.minToTokenAmount,
          withData: exchangeData._exchangeCalldata,
        };

        await DAI.approve(
          system.userProxyAddress,
          amountToWei(swapAmount).toFixed(0)
        );
        const swapAction = new Action(
          "SWAP",
          system.actionSwap.address,
          [swapDataTypeToEncode],
          [swapData],
          [0]
        );

        const collateralToDeposit = cdpState.toBorrowCollateralAmount.plus(
          cdpState.collTopUp
        );
        const depositBorrowedCollateral = new Action(
          "DEPOSIT",
          system.actionDeposit.address,
          ["uint256", "address", "address", "uint256"],
          [
            0,
            MAINNET_ADDRESSES.MCD_JOIN_ETH_A,
            MAINNET_ADDRESSES.CDP_MANAGER,
            ensureWeiFormat(collateralToDeposit),
          ],
          [1, 0, 0, 0]
        );

        // Add actions
        actions.push(generateDaiForSwap);
        actions.push(transferGeneratedDaiToProxyAction);
        actions.push(swapAction);
        actions.push(depositBorrowedCollateral);
      }
      async function includeIncreaseMultipleWithFlashloanActions({
        actions,
        cdpState,
        exchangeData,
      }: {
        actions: any[];
        cdpState: DesiredCdpState;
        exchangeData: ExchangeData;
      }) {
        // Get flashloan -> Swap for collateral -> Deposit collateral -> Generate DAI -> Repay flashloan
        const swapAmount = new BigNumber(exchangeData.fromTokenAmount)
          .plus(ensureWeiFormat(cdpState.daiTopUp))
          .toFixed(0);

        const swapData: SwapData = {
          fromAsset: exchangeData.fromTokenAddress,
          toAsset: exchangeData.toTokenAddress,
          // Add daiTopup amount to swap
          amount: swapAmount,
          receiveAtLeast: exchangeData.minToTokenAmount,
          withData: exchangeData._exchangeCalldata,
        };

        await DAI.approve(
          system.userProxyAddress,
          amountToWei(swapAmount).toFixed(0)
        );
        const swapAction = new Action(
          "SWAP",
          system.actionSwap.address,
          [swapDataTypeToEncode],
          [swapData],
          [0, 0]
        );

        const depositBorrowedCollateral = new Action(
          "DEPOSIT",
          system.actionDeposit.address,
          ["uint256", "address", "address", "uint256"],
          [
            0,
            MAINNET_ADDRESSES.MCD_JOIN_ETH_A,
            MAINNET_ADDRESSES.CDP_MANAGER,
            ensureWeiFormat(cdpState.toBorrowCollateralAmount),
          ],
          [1, 0, 0, 0]
        );

        const generateDaiToRepayFL = new Action(
          "GENERATE",
          system.actionGenerate.address,
          ["uint256", "address", "address", "uint256"],
          [
            0,
            MAINNET_ADDRESSES.CDP_MANAGER,
            address,
            ensureWeiFormat(cdpState.requiredDebt),
          ],
          [1, 0, 0, 0]
        );

        const transferGeneratedDaiToProxyAction = new Action(
          "TRANSFER_TO_PROXY",
          system.actionTransferToProxy.address,
          ["address", "uint256", "address"],
          [
            exchangeData.fromTokenAddress,
            ensureWeiFormat(cdpState.requiredDebt),
            address,
          ],
          [0]
        );

        // Add actions
        actions.push(swapAction);
        actions.push(depositBorrowedCollateral);
        actions.push(generateDaiToRepayFL);
        actions.push(transferGeneratedDaiToProxyAction);
      }
      function includeFlushProxyAction({
        actions,
        flushData,
      }: {
        actions: any[];
        flushData: { token: string; to: string; flAmount: string };
      }) {
        const flushProxyAction = new Action(
          "FLUSH_PROXY",
          system.actionFlushProxy.address,
          ["address", "address", "uint256"],
          [flushData.token, flushData.to, flushData.flAmount],
          []
        );

        actions.push(flushProxyAction);
      }

      it(testName, async () => {
        await DAI.approve(
          system.userProxyAddress,
          amountToWei(daiTopUp).toFixed(0)
        );
        await WETH.approve(
          system.userProxyAddress,
          amountToWei(collTopUp).toFixed(0)
        );

        const { requiredDebt, additionalCollateral, preIncreaseMPTopUp } =
          calculateParamsIncreaseMPPoC({
            oraclePrice,
            marketPrice,
            oazoFee: oazoFeePct,
            flashLoanFee,
            currentColl: initialColl,
            currentDebt: initialDebt,
            daiTopUp,
            collTopUp,
            requiredCollRatio,
            slippage,
            debug,
          });

        const desiredCdpState = {
          requiredDebt,
          toBorrowCollateralAmount: additionalCollateral,
          daiTopUp,
          fromTokenAmount: requiredDebt.plus(daiTopUp),
          toTokenAmount: additionalCollateral,
          collTopUp,
        };

        const { exchangeData } = prepareMultiplyParametersPoC({
          oneInchPayload: exchangeDataMock,
          desiredCdpState,
          exchangeInstanceAddress: system.exchangeInstance.address,
          fundsReceiver: address,
          skipFL: !useFlashloan,
        });

        const openVaultAction = new Action(
          "OPEN_VAULT",
          system.actionOpenVault.address,
          ["address", "address"],
          [MAINNET_ADDRESSES.MCD_JOIN_ETH_A, MAINNET_ADDRESSES.CDP_MANAGER],
          [0, 0]
        );

        const initialDepositAction = new Action(
          "DEPOSIT",
          system.actionDeposit.address,
          ["uint256", "address", "address", "uint256"],
          [
            0,
            MAINNET_ADDRESSES.MCD_JOIN_ETH_A,
            MAINNET_ADDRESSES.CDP_MANAGER,
            ensureWeiFormat(defaultInitialColl),
          ],
          [1, 0, 0, 0]
        );

        const actionsBefore: Action[] = [openVaultAction, initialDepositAction];
        const actions: Action[] = [];
        const useCollateralTopup = desiredCdpState.collTopUp.gt(zero);
        const useDaiTopup = desiredCdpState.daiTopUp.gt(zero);

        // Deposit collateral prior to increasing multiple
        useCollateralTopup &&
          includeCollateralTopupActions({
            actions: actionsBefore,
            topUpData: {
              token: exchangeData?.toTokenAddress,
              amount: desiredCdpState.collTopUp,
              from: address,
            },
          });

        // Add dai to proxy for use in primary swap
        useDaiTopup &&
          includeDaiTopupActions({
            actions: actionsBefore,
            topUpData: {
              token: DAI?.address,
              amount: desiredCdpState.daiTopUp,
              from: address,
            },
          });

        // Gather dai from vault then swap for collateral
        !useFlashloan &&
          (await includeIncreaseMultipleActions({
            actions: actionsBefore,
            cdpState: desiredCdpState,
            exchangeData,
          }));

        // Leverage flashloan to buy collateral, deposit borrowed collateral, draw dai and repay loan
        useFlashloan &&
          (await includeIncreaseMultipleWithFlashloanActions({
            actions,
            cdpState: desiredCdpState,
            exchangeData,
          }));

        // Transfer back unused balance from proxy
        useDaiTopup &&
          includeFlushProxyAction({
            actions: useFlashloan ? actions : actionsBefore,
            flushData: {
              token: DAI?.address,
              to: address,
              flAmount: useFlashloan
                ? exchangeData.fromTokenAmount
                : zero.toString(),
            },
          });

        const dsproxyCalldata =
          system.operationRunner.interface.encodeFunctionData(
            "executeOperation",
            [
              useFlashloan,
              buildOperationCalldata({
                actionsBefore,
                actions,
                ...(useFlashloan
                  ? {
                      flashLoanAmount: amountToWei(
                        desiredCdpState.requiredDebt
                      ).toFixed(0),
                    }
                  : {}),
              }),
            ]
          );

        try {
          const tx = await system.dsProxyInstance["execute(address,bytes)"](
            system.operationRunner.address,
            dsproxyCalldata,
            {
              from: address,
              value: ensureWeiFormat(defaultInitialColl),
              gasLimit: 8500000,
            }
          );
          const txReceipt = await tx.wait();
          gasEstimates.save(testName, txReceipt);
        } catch {
          expect(vaultUnsafe).to.be.true;
          return;
        }

        const vault = await getLastCDP(
          provider,
          signer,
          system.userProxyAddress
        );
        const info = await getVaultInfo(
          system.mcdViewInstance,
          vault.id,
          vault.ilk
        );
        const currentCollRatio = info.coll.times(oraclePrice).div(info.debt);
        expectToBeEqual(currentCollRatio, requiredCollRatio, 3);

        const expectedColl = additionalCollateral
          .plus(initialColl)
          .plus(preIncreaseMPTopUp);
        const expectedDebt = desiredCdpState.requiredDebt;

        expect(info.coll.toFixed(0)).to.equal(expectedColl.toFixed(0));
        expect(info.debt.toFixed(0)).to.equal(expectedDebt.toFixed(0));

        const cdpManagerContract = new ethers.Contract(
          MAINNET_ADDRESSES.CDP_MANAGER,
          CDPManagerABI,
          provider
        ).connect(signer);
        const vaultOwner = await cdpManagerContract.owns(vault.id);
        expectToBeEqual(vaultOwner, system.userProxyAddress);
      });
    };

    testScenarios(scenarios, scenarioRunner);

    after(() => {
      gasEstimates.print();
    });
  });
});
