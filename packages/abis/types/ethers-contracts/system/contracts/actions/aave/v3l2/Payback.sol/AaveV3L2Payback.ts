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

export type PaybackDataStruct = {
  asset: AddressLike;
  amount: BigNumberish;
  paybackAll: boolean;
};

export type PaybackDataStructOutput = [
  asset: string,
  amount: bigint,
  paybackAll: boolean
] & { asset: string; amount: bigint; paybackAll: boolean };

export interface AaveV3L2PaybackInterface extends Interface {
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

export interface AaveV3L2Payback extends BaseContract {
  connect(runner?: ContractRunner | null): AaveV3L2Payback;
  waitForDeployment(): Promise<this>;

  interface: AaveV3L2PaybackInterface;

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
    [PaybackDataStructOutput],
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
    [PaybackDataStructOutput],
    "view"
  >;

  filters: {};
}