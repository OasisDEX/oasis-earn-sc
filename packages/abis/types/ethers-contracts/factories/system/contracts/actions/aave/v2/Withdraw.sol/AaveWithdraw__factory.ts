/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import { Contract, Interface, type ContractRunner } from "ethers";
import type {
  AaveWithdraw,
  AaveWithdrawInterface,
} from "../../../../../../../system/contracts/actions/aave/v2/Withdraw.sol/AaveWithdraw";

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
    inputs: [
      {
        internalType: "bytes",
        name: "data",
        type: "bytes",
      },
      {
        internalType: "uint8[]",
        name: "",
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
            name: "asset",
            type: "address",
          },
          {
            internalType: "uint256",
            name: "amount",
            type: "uint256",
          },
          {
            internalType: "address",
            name: "to",
            type: "address",
          },
        ],
        internalType: "struct WithdrawData",
        name: "params",
        type: "tuple",
      },
    ],
    stateMutability: "pure",
    type: "function",
  },
] as const;

export class AaveWithdraw__factory {
  static readonly abi = _abi;
  static createInterface(): AaveWithdrawInterface {
    return new Interface(_abi) as AaveWithdrawInterface;
  }
  static connect(
    address: string,
    runner?: ContractRunner | null
  ): AaveWithdraw {
    return new Contract(address, _abi, runner) as unknown as AaveWithdraw;
  }
}