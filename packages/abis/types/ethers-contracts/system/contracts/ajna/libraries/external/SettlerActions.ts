/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
import type {
  BaseContract,
  BigNumberish,
  FunctionFragment,
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
} from "../../../../../common";

export interface SettlerActionsInterface extends Interface {
  getEvent(
    nameOrSignatureOrTopic:
      | "AuctionNFTSettle"
      | "AuctionSettle"
      | "BucketBankruptcy"
      | "Settle"
  ): EventFragment;
}

export namespace AuctionNFTSettleEvent {
  export type InputTuple = [
    borrower: AddressLike,
    collateral: BigNumberish,
    lp: BigNumberish,
    index: BigNumberish
  ];
  export type OutputTuple = [
    borrower: string,
    collateral: bigint,
    lp: bigint,
    index: bigint
  ];
  export interface OutputObject {
    borrower: string;
    collateral: bigint;
    lp: bigint;
    index: bigint;
  }
  export type Event = TypedContractEvent<InputTuple, OutputTuple, OutputObject>;
  export type Filter = TypedDeferredTopicFilter<Event>;
  export type Log = TypedEventLog<Event>;
  export type LogDescription = TypedLogDescription<Event>;
}

export namespace AuctionSettleEvent {
  export type InputTuple = [borrower: AddressLike, collateral: BigNumberish];
  export type OutputTuple = [borrower: string, collateral: bigint];
  export interface OutputObject {
    borrower: string;
    collateral: bigint;
  }
  export type Event = TypedContractEvent<InputTuple, OutputTuple, OutputObject>;
  export type Filter = TypedDeferredTopicFilter<Event>;
  export type Log = TypedEventLog<Event>;
  export type LogDescription = TypedLogDescription<Event>;
}

export namespace BucketBankruptcyEvent {
  export type InputTuple = [index: BigNumberish, lpForfeited: BigNumberish];
  export type OutputTuple = [index: bigint, lpForfeited: bigint];
  export interface OutputObject {
    index: bigint;
    lpForfeited: bigint;
  }
  export type Event = TypedContractEvent<InputTuple, OutputTuple, OutputObject>;
  export type Filter = TypedDeferredTopicFilter<Event>;
  export type Log = TypedEventLog<Event>;
  export type LogDescription = TypedLogDescription<Event>;
}

export namespace SettleEvent {
  export type InputTuple = [borrower: AddressLike, settledDebt: BigNumberish];
  export type OutputTuple = [borrower: string, settledDebt: bigint];
  export interface OutputObject {
    borrower: string;
    settledDebt: bigint;
  }
  export type Event = TypedContractEvent<InputTuple, OutputTuple, OutputObject>;
  export type Filter = TypedDeferredTopicFilter<Event>;
  export type Log = TypedEventLog<Event>;
  export type LogDescription = TypedLogDescription<Event>;
}

export interface SettlerActions extends BaseContract {
  connect(runner?: ContractRunner | null): SettlerActions;
  waitForDeployment(): Promise<this>;

  interface: SettlerActionsInterface;

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

  getFunction<T extends ContractMethod = ContractMethod>(
    key: string | FunctionFragment
  ): T;

  getEvent(
    key: "AuctionNFTSettle"
  ): TypedContractEvent<
    AuctionNFTSettleEvent.InputTuple,
    AuctionNFTSettleEvent.OutputTuple,
    AuctionNFTSettleEvent.OutputObject
  >;
  getEvent(
    key: "AuctionSettle"
  ): TypedContractEvent<
    AuctionSettleEvent.InputTuple,
    AuctionSettleEvent.OutputTuple,
    AuctionSettleEvent.OutputObject
  >;
  getEvent(
    key: "BucketBankruptcy"
  ): TypedContractEvent<
    BucketBankruptcyEvent.InputTuple,
    BucketBankruptcyEvent.OutputTuple,
    BucketBankruptcyEvent.OutputObject
  >;
  getEvent(
    key: "Settle"
  ): TypedContractEvent<
    SettleEvent.InputTuple,
    SettleEvent.OutputTuple,
    SettleEvent.OutputObject
  >;

  filters: {
    "AuctionNFTSettle(address,uint256,uint256,uint256)": TypedContractEvent<
      AuctionNFTSettleEvent.InputTuple,
      AuctionNFTSettleEvent.OutputTuple,
      AuctionNFTSettleEvent.OutputObject
    >;
    AuctionNFTSettle: TypedContractEvent<
      AuctionNFTSettleEvent.InputTuple,
      AuctionNFTSettleEvent.OutputTuple,
      AuctionNFTSettleEvent.OutputObject
    >;

    "AuctionSettle(address,uint256)": TypedContractEvent<
      AuctionSettleEvent.InputTuple,
      AuctionSettleEvent.OutputTuple,
      AuctionSettleEvent.OutputObject
    >;
    AuctionSettle: TypedContractEvent<
      AuctionSettleEvent.InputTuple,
      AuctionSettleEvent.OutputTuple,
      AuctionSettleEvent.OutputObject
    >;

    "BucketBankruptcy(uint256,uint256)": TypedContractEvent<
      BucketBankruptcyEvent.InputTuple,
      BucketBankruptcyEvent.OutputTuple,
      BucketBankruptcyEvent.OutputObject
    >;
    BucketBankruptcy: TypedContractEvent<
      BucketBankruptcyEvent.InputTuple,
      BucketBankruptcyEvent.OutputTuple,
      BucketBankruptcyEvent.OutputObject
    >;

    "Settle(address,uint256)": TypedContractEvent<
      SettleEvent.InputTuple,
      SettleEvent.OutputTuple,
      SettleEvent.OutputObject
    >;
    Settle: TypedContractEvent<
      SettleEvent.InputTuple,
      SettleEvent.OutputTuple,
      SettleEvent.OutputObject
    >;
  };
}