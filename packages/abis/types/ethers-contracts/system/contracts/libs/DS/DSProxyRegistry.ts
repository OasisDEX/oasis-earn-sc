/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
import type {
  BaseContract,
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

export interface DSProxyRegistryInterface extends Interface {
  getFunction(
    nameOrSignature: "build()" | "build(address)" | "proxies"
  ): FunctionFragment;

  encodeFunctionData(functionFragment: "build()", values?: undefined): string;
  encodeFunctionData(
    functionFragment: "build(address)",
    values: [AddressLike]
  ): string;
  encodeFunctionData(
    functionFragment: "proxies",
    values: [AddressLike]
  ): string;

  decodeFunctionResult(functionFragment: "build()", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "build(address)",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "proxies", data: BytesLike): Result;
}

export interface DSProxyRegistry extends BaseContract {
  connect(runner?: ContractRunner | null): DSProxyRegistry;
  waitForDeployment(): Promise<this>;

  interface: DSProxyRegistryInterface;

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

  "build()": TypedContractMethod<[], [string], "nonpayable">;

  "build(address)": TypedContractMethod<
    [owner: AddressLike],
    [string],
    "nonpayable"
  >;

  proxies: TypedContractMethod<[arg0: AddressLike], [string], "view">;

  getFunction<T extends ContractMethod = ContractMethod>(
    key: string | FunctionFragment
  ): T;

  getFunction(
    nameOrSignature: "build()"
  ): TypedContractMethod<[], [string], "nonpayable">;
  getFunction(
    nameOrSignature: "build(address)"
  ): TypedContractMethod<[owner: AddressLike], [string], "nonpayable">;
  getFunction(
    nameOrSignature: "proxies"
  ): TypedContractMethod<[arg0: AddressLike], [string], "view">;

  filters: {};
}