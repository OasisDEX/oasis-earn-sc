/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import { Contract, Interface, type ContractRunner } from "ethers";
import type {
  AjnaRepayWithdraw,
  AjnaRepayWithdrawInterface,
} from "../../../../../../system/contracts/actions/ajna/RepayWithdraw.sol/AjnaRepayWithdraw";

const _abi = [
  {
    inputs: [
      {
        internalType: "address",
        name: "_registry",
        type: "address",
      },
    ],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    inputs: [],
    name: "erc20PoolFactory",
    outputs: [
      {
        internalType: "contract IERC20PoolFactory",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes",
        name: "data",
        type: "bytes",
      },
      {
        internalType: "uint8[]",
        name: "paramsMap",
        type: "uint8[]",
      },
    ],
    name: "execute",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes",
        name: "_callData",
        type: "bytes",
      },
    ],
    name: "parseInputs",
    outputs: [
      {
        components: [
          {
            internalType: "address",
            name: "quoteToken",
            type: "address",
          },
          {
            internalType: "address",
            name: "collateralToken",
            type: "address",
          },
          {
            internalType: "uint256",
            name: "withdrawAmount",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "repayAmount",
            type: "uint256",
          },
          {
            internalType: "bool",
            name: "paybackAll",
            type: "bool",
          },
          {
            internalType: "bool",
            name: "withdrawAll",
            type: "bool",
          },
          {
            internalType: "uint256",
            name: "price",
            type: "uint256",
          },
        ],
        internalType: "struct RepayWithdrawData",
        name: "params",
        type: "tuple",
      },
    ],
    stateMutability: "pure",
    type: "function",
  },
  {
    inputs: [],
    name: "poolUtilsInfo",
    outputs: [
      {
        internalType: "contract IAjnaPoolUtilsInfo",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
] as const;

export class AjnaRepayWithdraw__factory {
  static readonly abi = _abi;
  static createInterface(): AjnaRepayWithdrawInterface {
    return new Interface(_abi) as AjnaRepayWithdrawInterface;
  }
  static connect(
    address: string,
    runner?: ContractRunner | null
  ): AjnaRepayWithdraw {
    return new Contract(address, _abi, runner) as unknown as AjnaRepayWithdraw;
  }
}