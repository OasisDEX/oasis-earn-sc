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
} from "../../../../common";

export interface IDaiJoinInterface extends Interface {
  getFunction(
    nameOrSignature: "dai" | "exit" | "join" | "vat"
  ): FunctionFragment;

  encodeFunctionData(functionFragment: "dai", values?: undefined): string;
  encodeFunctionData(
    functionFragment: "exit",
    values: [AddressLike, BigNumberish]
  ): string;
  encodeFunctionData(
    functionFragment: "join",
    values: [AddressLike, BigNumberish]
  ): string;
  encodeFunctionData(functionFragment: "vat", values?: undefined): string;

  decodeFunctionResult(functionFragment: "dai", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "exit", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "join", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "vat", data: BytesLike): Result;
}

export interface IDaiJoin extends BaseContract {
  connect(runner?: ContractRunner | null): IDaiJoin;
  waitForDeployment(): Promise<this>;

  interface: IDaiJoinInterface;

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

  dai: TypedContractMethod<[], [string], "nonpayable">;

  exit: TypedContractMethod<
    [arg0: AddressLike, arg1: BigNumberish],
    [void],
    "nonpayable"
  >;

  join: TypedContractMethod<
    [arg0: AddressLike, arg1: BigNumberish],
    [void],
    "payable"
  >;

  vat: TypedContractMethod<[], [string], "nonpayable">;

  getFunction<T extends ContractMethod = ContractMethod>(
    key: string | FunctionFragment
  ): T;

  getFunction(
    nameOrSignature: "dai"
  ): TypedContractMethod<[], [string], "nonpayable">;
  getFunction(
    nameOrSignature: "exit"
  ): TypedContractMethod<
    [arg0: AddressLike, arg1: BigNumberish],
    [void],
    "nonpayable"
  >;
  getFunction(
    nameOrSignature: "join"
  ): TypedContractMethod<
    [arg0: AddressLike, arg1: BigNumberish],
    [void],
    "payable"
  >;
  getFunction(
    nameOrSignature: "vat"
  ): TypedContractMethod<[], [string], "nonpayable">;

  filters: {};
}