/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
import type {
  BaseContract,
  BigNumberish,
  BytesLike,
  FunctionFragment,
  Result,
  Interface,
  AddressLike,
  ContractRunner,
  ContractMethod,
  Listener,
} from "ethers";
import type {
  TypedContractEvent,
  TypedDeferredTopicFilter,
  TypedEventLog,
  TypedListener,
  TypedContractMethod,
} from "../../../../../../common";

export type DepositDataStruct = {
  asset: AddressLike;
  amount: BigNumberish;
  sumAmounts: boolean;
  setAsCollateral: boolean;
};

export type DepositDataStructOutput = [
  asset: string,
  amount: bigint,
  sumAmounts: boolean,
  setAsCollateral: boolean
] & {
  asset: string;
  amount: bigint;
  sumAmounts: boolean;
  setAsCollateral: boolean;
};

export interface AaveV3L2DepositInterface extends Interface {
  getFunction(nameOrSignature: "execute" | "parseInputs"): FunctionFragment;

  encodeFunctionData(
    functionFragment: "execute",
    values: [BytesLike, BigNumberish[]]
  ): string;
  encodeFunctionData(
    functionFragment: "parseInputs",
    values: [BytesLike]
  ): string;

  decodeFunctionResult(functionFragment: "execute", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "parseInputs",
    data: BytesLike
  ): Result;
}

export interface AaveV3L2Deposit extends BaseContract {
  connect(runner?: ContractRunner | null): AaveV3L2Deposit;
  waitForDeployment(): Promise<this>;

  interface: AaveV3L2DepositInterface;

  queryFilter<TCEvent extends TypedContractEvent>(
    event: TCEvent,
    fromBlockOrBlockhash?: string | number | undefined,
    toBlock?: string | number | undefined
  ): Promise<Array<TypedEventLog<TCEvent>>>;
  queryFilter<TCEvent extends TypedContractEvent>(
    filter: TypedDeferredTopicFilter<TCEvent>,
    fromBlockOrBlockhash?: string | number | undefined,
    toBlock?: string | number | undefined
  ): Promise<Array<TypedEventLog<TCEvent>>>;

  on<TCEvent extends TypedContractEvent>(
    event: TCEvent,
    listener: TypedListener<TCEvent>
  ): Promise<this>;
  on<TCEvent extends TypedContractEvent>(
    filter: TypedDeferredTopicFilter<TCEvent>,
    listener: TypedListener<TCEvent>
  ): Promise<this>;

  once<TCEvent extends TypedContractEvent>(
    event: TCEvent,
    listener: TypedListener<TCEvent>
  ): Promise<this>;
  once<TCEvent extends TypedContractEvent>(
    filter: TypedDeferredTopicFilter<TCEvent>,
    listener: TypedListener<TCEvent>
  ): Promise<this>;

  listeners<TCEvent extends TypedContractEvent>(
    event: TCEvent
  ): Promise<Array<TypedListener<TCEvent>>>;
  listeners(eventName?: string): Promise<Array<Listener>>;
  removeAllListeners<TCEvent extends TypedContractEvent>(
    event?: TCEvent
  ): Promise<this>;

  execute: TypedContractMethod<
    [data: BytesLike, paramsMap: BigNumberish[]],
    [void],
    "payable"
  >;

  parseInputs: TypedContractMethod<
    [_callData: BytesLike],
    [DepositDataStructOutput],
    "view"
  >;

  getFunction<T extends ContractMethod = ContractMethod>(
    key: string | FunctionFragment
  ): T;

  getFunction(
    nameOrSignature: "execute"
  ): TypedContractMethod<
    [data: BytesLike, paramsMap: BigNumberish[]],
    [void],
    "payable"
  >;
  getFunction(
    nameOrSignature: "parseInputs"
  ): TypedContractMethod<
    [_callData: BytesLike],
    [DepositDataStructOutput],
    "view"
  >;

  filters: {};
}