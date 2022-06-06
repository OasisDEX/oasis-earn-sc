import BigNumber from "bignumber.js";
import { ethers } from "hardhat";

import IERC20_ABI from "../../abi/external/IERC20.json";
import CTOKEN_ABI from "../../abi/external/CErc20.json";
import { BalanceOptions, RuntimeConfig, ValueOf } from "../helpers/types";
import { ONE, CONTRACT_LABELS } from "../helpers/constants";
import { Signer, utils, providers } from "ethers";

export async function balanceOf(
  asset: string,
  address: string,
  options: BalanceOptions
) {
  let balance;
  const { provider, signer } = options.config;
  if (asset === "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE") {
    balance = await provider.getBalance(address);
  } else {
    const ERC20Asset = new ethers.Contract(asset, IERC20_ABI, signer);
    balance = await ERC20Asset.balanceOf(address);
  }

  const decimals = options.decimals ? options.decimals : 18;
  const formattedBalance = ethers.utils.formatUnits(
    balance.toString(),
    decimals
  );
  if (options.debug) {
    console.log(
      `DEBUG: Account ${address}'s balance for ${asset} is: ${formattedBalance.toString()}`
    );
  }

  return formattedBalance;
}

export async function balanceOfUnderlying(
  asset: string,
  address: string,
  options: BalanceOptions
) {
  const { signer } = options.config;
  const CERC20Asset = new ethers.Contract(asset, CTOKEN_ABI, signer);
  const balance = await CERC20Asset.callStatic.balanceOfUnderlying(address);
  const decimals = options.decimals ? options.decimals : 18;
  const formattedBalance = ethers.utils.formatUnits(
    balance.toString(),
    decimals
  );

  if (options.debug) {
    console.log(
      `DEBUG: Account ${address}'s balance for underlying ${asset} is: ${formattedBalance.toString()}`
    );
  }

  return formattedBalance;
}

export async function approve(
  asset: string,
  spender: string,
  amount: BigNumber,
  config: RuntimeConfig,
  debug?: boolean
) {
  const instance = new ethers.Contract(asset, IERC20_ABI, config.signer);
  await instance.approve(spender, amount.toString(), {
    gasLimit: 3000000,
  });

  if (debug) {
    console.log(
      `DEBUG: Approved ${amountFromWei(
        amount
      ).toString()} on ${asset} for ${spender}`
    );
  }
}

type PositionCalculationResult = {
  ownDepositAmount: BigNumber;
  lendAmount: BigNumber;
  borrowAmount: BigNumber;
  flashloanAmount: BigNumber;
};

// TODO - This needs to be changed based on the new calculations for AAVE
export function calculatePositionParams(
  ownDepositAmount: BigNumber,
  debug?: boolean
): PositionCalculationResult {
  // minCR = 77%  1/ 0.77 = ~1.2987 = 129.87%
  // ownDeposit = 100k
  // lendAmount = (ownDeposit / (minCR - 100%)) * minCR
  // borrowAmount = (ownDeposit / (minCR - 100%)) * 100%
  const minCR = ONE.div(new BigNumber(0.77));
  const lendAmount = ownDepositAmount
    .div(minCR.minus(ONE))
    .times(minCR)
    .decimalPlaces(18);
  const borrowAmount = ownDepositAmount
    .div(minCR.minus(ONE))
    .times(ONE)
    .decimalPlaces(18);
  const flashloanAmount = lendAmount.minus(ownDepositAmount).decimalPlaces(18);

  if (debug) {
    console.log(`DEBUG: User can deposit ${ownDepositAmount.toFixed(6)}`);
    console.log(`DEBUG: User can lend ${lendAmount.toFixed(6)}`);
    console.log(`DEBUG: User can borrow ${borrowAmount.toFixed(6)}`);
    console.log(
      `DEBUG: User will take ${flashloanAmount.toFixed(6)} of flash loan`
    );
  }

  return {
    ownDepositAmount: amountToWei(ownDepositAmount),
    lendAmount: amountToWei(lendAmount),
    borrowAmount: amountToWei(borrowAmount),
    flashloanAmount: amountToWei(flashloanAmount),
  };
}

export function amountToWei(amount: BigNumber.Value, precision = 18) {
  BigNumber.config({ EXPONENTIAL_AT: 30 });
  return new BigNumber(amount || 0).times(new BigNumber(10).pow(precision));
}

export function amountFromWei(amount: BigNumber.Value, precision = 18) {
  return new BigNumber(amount || 0).div(new BigNumber(10).pow(precision));
}

type ActionCall = {
  targetHash: string;
  callData: string;
  paramsMapping: any[];
};

export class ActionFactory {
  static create(targetHash: string, types: string[], args: any[], paramsMapping: number[]): ActionCall {
    const iface = new ethers.utils.Interface([
      " function execute(bytes calldata data, uint8[] paramsMapping) external payable returns (bytes calldata)",
    ]);
    
    const encodedArgs = ethers.utils.defaultAbiCoder.encode(types, args);
    const calldata = iface.encodeFunctionData("execute", [encodedArgs, paramsMapping]);
    return {
      paramsMapping,
      targetHash,
      callData: calldata,
    };
  }
}

export class ServiceRegistry {
  address: string;
  signer: Signer;

  constructor(address: string, signer: Signer) {
    this.address = address;
    this.signer = signer;
  }

  async addEntry(
    label: ValueOf<typeof CONTRACT_LABELS>,
    address: string,
    debug: boolean = false
  ): Promise<string> {
    const entryHash = utils.keccak256(utils.toUtf8Bytes(label));
    const registry = await ethers.getContractAt(
      "ServiceRegistry",
      this.address,
      this.signer
    );
    await registry.addNamedService(entryHash, address);

    if (debug) {
      console.log(
        `DEBUG: Service '${label}' has been added with hash: ${entryHash}`
      );
    }

    return entryHash;
  }

  async getEntryHash(label: ValueOf<typeof CONTRACT_LABELS>): Promise<string> {
    const registry = await ethers.getContractAt(
      "ServiceRegistry",
      this.address,
      this.signer
    );

    return registry.getServiceNameHash(label);
  }
}
