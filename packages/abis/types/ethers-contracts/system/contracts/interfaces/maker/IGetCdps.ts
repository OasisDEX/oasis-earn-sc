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

export interface IGetCdpsInterface extends Interface {
  getFunction(nameOrSignature: "getCdpsAsc" | "getCdpsDesc"): FunctionFragment;

  encodeFunctionData(
    functionFragment: "getCdpsAsc",
    values: [AddressLike, AddressLike]
  ): string;
  encodeFunctionData(
    functionFragment: "getCdpsDesc",
    values: [AddressLike, AddressLike]
  ): string;

  decodeFunctionResult(functionFragment: "getCdpsAsc", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "getCdpsDesc",
    data: BytesLike
  ): Result;
}

export interface IGetCdps extends BaseContract {
  connect(runner?: ContractRunner | null): IGetCdps;
  waitForDeployment(): Promise<this>;

  interface: IGetCdpsInterface;

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

  getCdpsAsc: TypedContractMethod<
    [manager: AddressLike, guy: AddressLike],
    [
      [bigint[], string[], string[]] & {
        ids: bigint[];
        urns: string[];
        ilks: string[];
      }
    ],
    "view"
  >;

  getCdpsDesc: TypedContractMethod<
    [manager: AddressLike, guy: AddressLike],
    [
      [bigint[], string[], string[]] & {
        ids: bigint[];
        urns: string[];
        ilks: string[];
      }
    ],
    "view"
  >;

  getFunction<T extends ContractMethod = ContractMethod>(
    key: string | FunctionFragment
  ): T;

  getFunction(
    nameOrSignature: "getCdpsAsc"
  ): TypedContractMethod<
    [manager: AddressLike, guy: AddressLike],
    [
      [bigint[], string[], string[]] & {
        ids: bigint[];
        urns: string[];
        ilks: string[];
      }
    ],
    "view"
  >;
  getFunction(
    nameOrSignature: "getCdpsDesc"
  ): TypedContractMethod<
    [manager: AddressLike, guy: AddressLike],
    [
      [bigint[], string[], string[]] & {
        ids: bigint[];
        urns: string[];
        ilks: string[];
      }
    ],
    "view"
  >;

  filters: {};
}