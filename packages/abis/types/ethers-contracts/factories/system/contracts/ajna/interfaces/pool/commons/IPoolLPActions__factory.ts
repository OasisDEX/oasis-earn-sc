/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import { Contract, Interface, type ContractRunner } from "ethers";
import type {
  IPoolLPActions,
  IPoolLPActionsInterface,
} from "../../../../../../../system/contracts/ajna/interfaces/pool/commons/IPoolLPActions";

const _abi = [
  {
    inputs: [
      {
        internalType: "address[]",
        name: "transferors_",
        type: "address[]",
      },
    ],
    name: "approveLPTransferors",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "spender_",
        type: "address",
      },
      {
        internalType: "uint256[]",
        name: "indexes_",
        type: "uint256[]",
      },
      {
        internalType: "uint256[]",
        name: "amounts_",
        type: "uint256[]",
      },
    ],
    name: "decreaseLPAllowance",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "spender_",
        type: "address",
      },
      {
        internalType: "uint256[]",
        name: "indexes_",
        type: "uint256[]",
      },
      {
        internalType: "uint256[]",
        name: "amounts_",
        type: "uint256[]",
      },
    ],
    name: "increaseLPAllowance",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "spender_",
        type: "address",
      },
      {
        internalType: "uint256[]",
        name: "indexes_",
        type: "uint256[]",
      },
    ],
    name: "revokeLPAllowance",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address[]",
        name: "transferors_",
        type: "address[]",
      },
    ],
    name: "revokeLPTransferors",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "owner_",
        type: "address",
      },
      {
        internalType: "address",
        name: "newOwner_",
        type: "address",
      },
      {
        internalType: "uint256[]",
        name: "indexes_",
        type: "uint256[]",
      },
    ],
    name: "transferLP",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

export class IPoolLPActions__factory {
  static readonly abi = _abi;
  static createInterface(): IPoolLPActionsInterface {
    return new Interface(_abi) as IPoolLPActionsInterface;
  }
  static connect(
    address: string,
    runner?: ContractRunner | null
  ): IPoolLPActions {
    return new Contract(address, _abi, runner) as unknown as IPoolLPActions;
  }
}