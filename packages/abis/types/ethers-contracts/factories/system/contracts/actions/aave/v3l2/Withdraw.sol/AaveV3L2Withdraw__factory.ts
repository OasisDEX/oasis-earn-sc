/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import { Contract, Interface, type ContractRunner } from "ethers";
import type {
  AaveV3L2Withdraw,
  AaveV3L2WithdrawInterface,
} from "../../../../../../../system/contracts/actions/aave/v3l2/Withdraw.sol/AaveV3L2Withdraw";

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

export class AaveV3L2Withdraw__factory {
  static readonly abi = _abi;
  static createInterface(): AaveV3L2WithdrawInterface {
    return new Interface(_abi) as AaveV3L2WithdrawInterface;
  }
  static connect(
    address: string,
    runner?: ContractRunner | null
  ): AaveV3L2Withdraw {
    return new Contract(address, _abi, runner) as unknown as AaveV3L2Withdraw;
  }
}