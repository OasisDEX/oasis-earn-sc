/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import { Contract, Interface, type ContractRunner } from "ethers";
import type {
  AaveDeposit,
  AaveDepositInterface,
} from "../../../../../../../system/contracts/actions/aave/v2/Deposit.sol/AaveDeposit";

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
            name: "asset",
            type: "address",
          },
          {
            internalType: "uint256",
            name: "amount",
            type: "uint256",
          },
          {
            internalType: "bool",
            name: "sumAmounts",
            type: "bool",
          },
          {
            internalType: "bool",
            name: "setAsCollateral",
            type: "bool",
          },
        ],
        internalType: "struct DepositData",
        name: "params",
        type: "tuple",
      },
    ],
    stateMutability: "pure",
    type: "function",
  },
] as const;

export class AaveDeposit__factory {
  static readonly abi = _abi;
  static createInterface(): AaveDepositInterface {
    return new Interface(_abi) as AaveDepositInterface;
  }
  static connect(address: string, runner?: ContractRunner | null): AaveDeposit {
    return new Contract(address, _abi, runner) as unknown as AaveDeposit;
  }
}