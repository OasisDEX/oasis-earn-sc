/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import { Contract, Interface, type ContractRunner } from "ethers";
import type {
  IAggregator,
  IAggregatorInterface,
} from "../../../../system/contracts/chainlink/IAggregator";

const _abi = [
  {
    inputs: [],
    name: "latestAnswer",
    outputs: [
      {
        internalType: "int256",
        name: "",
        type: "int256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
] as const;

export class IAggregator__factory {
  static readonly abi = _abi;
  static createInterface(): IAggregatorInterface {
    return new Interface(_abi) as IAggregatorInterface;
  }
  static connect(address: string, runner?: ContractRunner | null): IAggregator {
    return new Contract(address, _abi, runner) as unknown as IAggregator;
  }
}