/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import { Contract, Interface, type ContractRunner } from "ethers";
import type {
  IPoolSettlerActions,
  IPoolSettlerActionsInterface,
} from "../../../../../../../system/contracts/ajna/interfaces/pool/commons/IPoolSettlerActions";

const _abi = [
  {
    inputs: [
      {
        internalType: "address",
        name: "borrowerAddress_",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "maxDepth_",
        type: "uint256",
      },
    ],
    name: "settle",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

export class IPoolSettlerActions__factory {
  static readonly abi = _abi;
  static createInterface(): IPoolSettlerActionsInterface {
    return new Interface(_abi) as IPoolSettlerActionsInterface;
  }
  static connect(
    address: string,
    runner?: ContractRunner | null
  ): IPoolSettlerActions {
    return new Contract(
      address,
      _abi,
      runner
    ) as unknown as IPoolSettlerActions;
  }
}