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
  EventFragment,
  AddressLike,
  ContractRunner,
  ContractMethod,
  Listener,
} from "ethers";
import type {
  TypedContractEvent,
  TypedDeferredTopicFilter,
  TypedEventLog,
  TypedLogDescription,
  TypedListener,
  TypedContractMethod,
} from "../../../../../common";

export interface AjnaRewardClaimerInterface extends Interface {
  getFunction(
    nameOrSignature:
      | "ajnaProxyActions"
      | "ajnaToken"
      | "claimRewardsAndSendToOwner"
      | "guard"
      | "initializeAjnaProxyActions"
      | "owner"
      | "rewardsManager"
      | "self"
  ): FunctionFragment;

  getEvent(
    nameOrSignatureOrTopic: "AjnaRewardClaimed" | "ProxyActionsOperation"
  ): EventFragment;

  encodeFunctionData(
    functionFragment: "ajnaProxyActions",
    values?: undefined
  ): string;
  encodeFunctionData(functionFragment: "ajnaToken", values?: undefined): string;
  encodeFunctionData(
    functionFragment: "claimRewardsAndSendToOwner",
    values: [BigNumberish[]]
  ): string;
  encodeFunctionData(functionFragment: "guard", values?: undefined): string;
  encodeFunctionData(
    functionFragment: "initializeAjnaProxyActions",
    values: [AddressLike]
  ): string;
  encodeFunctionData(functionFragment: "owner", values?: undefined): string;
  encodeFunctionData(
    functionFragment: "rewardsManager",
    values?: undefined
  ): string;
  encodeFunctionData(functionFragment: "self", values?: undefined): string;

  decodeFunctionResult(
    functionFragment: "ajnaProxyActions",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "ajnaToken", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "claimRewardsAndSendToOwner",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "guard", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "initializeAjnaProxyActions",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "owner", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "rewardsManager",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "self", data: BytesLike): Result;
}

export namespace AjnaRewardClaimedEvent {
  export type InputTuple = [
    proxy: AddressLike,
    pool: AddressLike,
    tokenId: BigNumberish
  ];
  export type OutputTuple = [proxy: string, pool: string, tokenId: bigint];
  export interface OutputObject {
    proxy: string;
    pool: string;
    tokenId: bigint;
  }
  export type Event = TypedContractEvent<InputTuple, OutputTuple, OutputObject>;
  export type Filter = TypedDeferredTopicFilter<Event>;
  export type Log = TypedEventLog<Event>;
  export type LogDescription = TypedLogDescription<Event>;
}

export namespace ProxyActionsOperationEvent {
  export type InputTuple = [name: BytesLike];
  export type OutputTuple = [name: string];
  export interface OutputObject {
    name: string;
  }
  export type Event = TypedContractEvent<InputTuple, OutputTuple, OutputObject>;
  export type Filter = TypedDeferredTopicFilter<Event>;
  export type Log = TypedEventLog<Event>;
  export type LogDescription = TypedLogDescription<Event>;
}

export interface AjnaRewardClaimer extends BaseContract {
  connect(runner?: ContractRunner | null): AjnaRewardClaimer;
  waitForDeployment(): Promise<this>;

  interface: AjnaRewardClaimerInterface;

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

  ajnaProxyActions: TypedContractMethod<[], [string], "view">;

  ajnaToken: TypedContractMethod<[], [string], "view">;

  claimRewardsAndSendToOwner: TypedContractMethod<
    [tokenIds: BigNumberish[]],
    [string[]],
    "nonpayable"
  >;

  guard: TypedContractMethod<[], [string], "view">;

  initializeAjnaProxyActions: TypedContractMethod<
    [_ajnaProxyActions: AddressLike],
    [void],
    "nonpayable"
  >;

  owner: TypedContractMethod<[], [string], "view">;

  rewardsManager: TypedContractMethod<[], [string], "view">;

  self: TypedContractMethod<[], [string], "view">;

  getFunction<T extends ContractMethod = ContractMethod>(
    key: string | FunctionFragment
  ): T;

  getFunction(
    nameOrSignature: "ajnaProxyActions"
  ): TypedContractMethod<[], [string], "view">;
  getFunction(
    nameOrSignature: "ajnaToken"
  ): TypedContractMethod<[], [string], "view">;
  getFunction(
    nameOrSignature: "claimRewardsAndSendToOwner"
  ): TypedContractMethod<[tokenIds: BigNumberish[]], [string[]], "nonpayable">;
  getFunction(
    nameOrSignature: "guard"
  ): TypedContractMethod<[], [string], "view">;
  getFunction(
    nameOrSignature: "initializeAjnaProxyActions"
  ): TypedContractMethod<
    [_ajnaProxyActions: AddressLike],
    [void],
    "nonpayable"
  >;
  getFunction(
    nameOrSignature: "owner"
  ): TypedContractMethod<[], [string], "view">;
  getFunction(
    nameOrSignature: "rewardsManager"
  ): TypedContractMethod<[], [string], "view">;
  getFunction(
    nameOrSignature: "self"
  ): TypedContractMethod<[], [string], "view">;

  getEvent(
    key: "AjnaRewardClaimed"
  ): TypedContractEvent<
    AjnaRewardClaimedEvent.InputTuple,
    AjnaRewardClaimedEvent.OutputTuple,
    AjnaRewardClaimedEvent.OutputObject
  >;
  getEvent(
    key: "ProxyActionsOperation"
  ): TypedContractEvent<
    ProxyActionsOperationEvent.InputTuple,
    ProxyActionsOperationEvent.OutputTuple,
    ProxyActionsOperationEvent.OutputObject
  >;

  filters: {
    "AjnaRewardClaimed(address,address,uint256)": TypedContractEvent<
      AjnaRewardClaimedEvent.InputTuple,
      AjnaRewardClaimedEvent.OutputTuple,
      AjnaRewardClaimedEvent.OutputObject
    >;
    AjnaRewardClaimed: TypedContractEvent<
      AjnaRewardClaimedEvent.InputTuple,
      AjnaRewardClaimedEvent.OutputTuple,
      AjnaRewardClaimedEvent.OutputObject
    >;

    "ProxyActionsOperation(bytes32)": TypedContractEvent<
      ProxyActionsOperationEvent.InputTuple,
      ProxyActionsOperationEvent.OutputTuple,
      ProxyActionsOperationEvent.OutputObject
    >;
    ProxyActionsOperation: TypedContractEvent<
      ProxyActionsOperationEvent.InputTuple,
      ProxyActionsOperationEvent.OutputTuple,
      ProxyActionsOperationEvent.OutputObject
    >;
  };
}