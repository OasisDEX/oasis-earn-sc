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

export interface IERC20PoolBorrowerActionsInterface extends Interface {
  getFunction(nameOrSignature: "drawDebt" | "repayDebt"): FunctionFragment;

  encodeFunctionData(
    functionFragment: "drawDebt",
    values: [AddressLike, BigNumberish, BigNumberish, BigNumberish]
  ): string;
  encodeFunctionData(
    functionFragment: "repayDebt",
    values: [AddressLike, BigNumberish, BigNumberish, AddressLike, BigNumberish]
  ): string;

  decodeFunctionResult(functionFragment: "drawDebt", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "repayDebt", data: BytesLike): Result;
}

export interface IERC20PoolBorrowerActions extends BaseContract {
  connect(runner?: ContractRunner | null): IERC20PoolBorrowerActions;
  waitForDeployment(): Promise<this>;

  interface: IERC20PoolBorrowerActionsInterface;

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

  drawDebt: TypedContractMethod<
    [
      borrowerAddress_: AddressLike,
      amountToBorrow_: BigNumberish,
      limitIndex_: BigNumberish,
      collateralToPledge_: BigNumberish
    ],
    [void],
    "nonpayable"
  >;

  repayDebt: TypedContractMethod<
    [
      borrowerAddress_: AddressLike,
      maxQuoteTokenAmountToRepay_: BigNumberish,
      collateralAmountToPull_: BigNumberish,
      recipient_: AddressLike,
      limitIndex_: BigNumberish
    ],
    [void],
    "nonpayable"
  >;

  getFunction<T extends ContractMethod = ContractMethod>(
    key: string | FunctionFragment
  ): T;

  getFunction(
    nameOrSignature: "drawDebt"
  ): TypedContractMethod<
    [
      borrowerAddress_: AddressLike,
      amountToBorrow_: BigNumberish,
      limitIndex_: BigNumberish,
      collateralToPledge_: BigNumberish
    ],
    [void],
    "nonpayable"
  >;
  getFunction(
    nameOrSignature: "repayDebt"
  ): TypedContractMethod<
    [
      borrowerAddress_: AddressLike,
      maxQuoteTokenAmountToRepay_: BigNumberish,
      collateralAmountToPull_: BigNumberish,
      recipient_: AddressLike,
      limitIndex_: BigNumberish
    ],
    [void],
    "nonpayable"
  >;

  filters: {};
}