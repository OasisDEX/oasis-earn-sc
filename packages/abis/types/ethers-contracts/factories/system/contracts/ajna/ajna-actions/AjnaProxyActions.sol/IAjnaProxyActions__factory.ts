/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import { Contract, Interface, type ContractRunner } from "ethers";
import type {
  IAjnaProxyActions,
  IAjnaProxyActionsInterface,
} from "../../../../../../system/contracts/ajna/ajna-actions/AjnaProxyActions.sol/IAjnaProxyActions";

const _abi = [
  {
    inputs: [],
    name: "ARC",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "positionManager",
    outputs: [
      {
        internalType: "contract IPositionManager",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "rewardsManager",
    outputs: [
      {
        internalType: "contract IRewardsManager",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
] as const;

export class IAjnaProxyActions__factory {
  static readonly abi = _abi;
  static createInterface(): IAjnaProxyActionsInterface {
    return new Interface(_abi) as IAjnaProxyActionsInterface;
  }
  static connect(
    address: string,
    runner?: ContractRunner | null
  ): IAjnaProxyActions {
    return new Contract(address, _abi, runner) as unknown as IAjnaProxyActions;
  }
}