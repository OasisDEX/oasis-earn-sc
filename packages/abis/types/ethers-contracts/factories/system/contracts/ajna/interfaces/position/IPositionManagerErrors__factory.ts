/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import { Contract, Interface, type ContractRunner } from "ethers";
import type {
  IPositionManagerErrors,
  IPositionManagerErrorsInterface,
} from "../../../../../../system/contracts/ajna/interfaces/position/IPositionManagerErrors";

const _abi = [
  {
    inputs: [],
    name: "AllowanceTooLow",
    type: "error",
  },
  {
    inputs: [],
    name: "BucketBankrupt",
    type: "error",
  },
  {
    inputs: [],
    name: "DeployWithZeroAddress",
    type: "error",
  },
  {
    inputs: [],
    name: "LiquidityNotRemoved",
    type: "error",
  },
  {
    inputs: [],
    name: "NoAuth",
    type: "error",
  },
  {
    inputs: [],
    name: "NoToken",
    type: "error",
  },
  {
    inputs: [],
    name: "NotAjnaPool",
    type: "error",
  },
  {
    inputs: [],
    name: "RemovePositionFailed",
    type: "error",
  },
  {
    inputs: [],
    name: "WrongPool",
    type: "error",
  },
] as const;

export class IPositionManagerErrors__factory {
  static readonly abi = _abi;
  static createInterface(): IPositionManagerErrorsInterface {
    return new Interface(_abi) as IPositionManagerErrorsInterface;
  }
  static connect(
    address: string,
    runner?: ContractRunner | null
  ): IPositionManagerErrors {
    return new Contract(
      address,
      _abi,
      runner
    ) as unknown as IPositionManagerErrors;
  }
}