/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import { Contract, Interface, type ContractRunner } from "ethers";
import type {
  BorrowerActions,
  BorrowerActionsInterface,
} from "../../../../../../system/contracts/ajna/libraries/external/BorrowerActions";

const _abi = [
  {
    inputs: [],
    name: "AmountLTMinDebt",
    type: "error",
  },
  {
    inputs: [],
    name: "AuctionActive",
    type: "error",
  },
  {
    inputs: [],
    name: "BorrowerNotSender",
    type: "error",
  },
  {
    inputs: [],
    name: "BorrowerUnderCollateralized",
    type: "error",
  },
  {
    inputs: [],
    name: "BucketBankruptcyBlock",
    type: "error",
  },
  {
    inputs: [],
    name: "BucketIndexOutOfBounds",
    type: "error",
  },
  {
    inputs: [],
    name: "BucketPriceOutOfBounds",
    type: "error",
  },
  {
    inputs: [],
    name: "DustAmountNotExceeded",
    type: "error",
  },
  {
    inputs: [],
    name: "InsufficientCollateral",
    type: "error",
  },
  {
    inputs: [],
    name: "InsufficientLiquidity",
    type: "error",
  },
  {
    inputs: [],
    name: "InvalidAmount",
    type: "error",
  },
  {
    inputs: [],
    name: "LimitIndexExceeded",
    type: "error",
  },
  {
    inputs: [],
    name: "LimitIndexExceeded",
    type: "error",
  },
  {
    inputs: [],
    name: "NoDebt",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "int256",
        name: "x",
        type: "int256",
      },
    ],
    name: "PRBMathSD59x18__CeilOverflow",
    type: "error",
  },
  {
    inputs: [],
    name: "PRBMathSD59x18__DivInputTooSmall",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "rAbs",
        type: "uint256",
      },
    ],
    name: "PRBMathSD59x18__DivOverflow",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "int256",
        name: "x",
        type: "int256",
      },
    ],
    name: "PRBMathSD59x18__Exp2InputTooBig",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "int256",
        name: "x",
        type: "int256",
      },
    ],
    name: "PRBMathSD59x18__FromIntOverflow",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "int256",
        name: "x",
        type: "int256",
      },
    ],
    name: "PRBMathSD59x18__FromIntUnderflow",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "int256",
        name: "x",
        type: "int256",
      },
    ],
    name: "PRBMathSD59x18__LogInputTooSmall",
    type: "error",
  },
  {
    inputs: [],
    name: "PRBMathSD59x18__MulInputTooSmall",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "rAbs",
        type: "uint256",
      },
    ],
    name: "PRBMathSD59x18__MulOverflow",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "prod1",
        type: "uint256",
      },
    ],
    name: "PRBMath__MulDivFixedPointOverflow",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "prod1",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "denominator",
        type: "uint256",
      },
    ],
    name: "PRBMath__MulDivOverflow",
    type: "error",
  },
  {
    inputs: [],
    name: "ZeroThresholdPrice",
    type: "error",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "borrowerAddress",
        type: "address",
      },
    ],
    name: "LoanStamped",
    type: "event",
  },
] as const;

export class BorrowerActions__factory {
  static readonly abi = _abi;
  static createInterface(): BorrowerActionsInterface {
    return new Interface(_abi) as BorrowerActionsInterface;
  }
  static connect(
    address: string,
    runner?: ContractRunner | null
  ): BorrowerActions {
    return new Contract(address, _abi, runner) as unknown as BorrowerActions;
  }
}