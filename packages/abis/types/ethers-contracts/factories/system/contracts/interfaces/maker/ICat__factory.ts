/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import { Contract, Interface, type ContractRunner } from "ethers";
import type {
  ICat,
  ICatInterface,
} from "../../../../../system/contracts/interfaces/maker/ICat";

const _abi = [
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "",
        type: "bytes32",
      },
    ],
    name: "ilks",
    outputs: [
      {
        internalType: "address",
        name: "flip",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "chop",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "lump",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
] as const;

export class ICat__factory {
  static readonly abi = _abi;
  static createInterface(): ICatInterface {
    return new Interface(_abi) as ICatInterface;
  }
  static connect(address: string, runner?: ContractRunner | null): ICat {
    return new Contract(address, _abi, runner) as unknown as ICat;
  }
}