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

export interface McdViewInterface extends Interface {
  getFunction(
    nameOrSignature:
      | "MANAGER_ADDRESS"
      | "SPOTTER_ADDRESS"
      | "VAT_ADDRESS"
      | "getPrice"
      | "getRatio"
      | "getVaultInfo"
      | "manager"
      | "spotter"
      | "vat"
  ): FunctionFragment;

  encodeFunctionData(
    functionFragment: "MANAGER_ADDRESS",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "SPOTTER_ADDRESS",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "VAT_ADDRESS",
    values?: undefined
  ): string;
  encodeFunctionData(functionFragment: "getPrice", values: [BytesLike]): string;
  encodeFunctionData(
    functionFragment: "getRatio",
    values: [BigNumberish]
  ): string;
  encodeFunctionData(
    functionFragment: "getVaultInfo",
    values: [BigNumberish, BytesLike]
  ): string;
  encodeFunctionData(functionFragment: "manager", values?: undefined): string;
  encodeFunctionData(functionFragment: "spotter", values?: undefined): string;
  encodeFunctionData(functionFragment: "vat", values?: undefined): string;

  decodeFunctionResult(
    functionFragment: "MANAGER_ADDRESS",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "SPOTTER_ADDRESS",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "VAT_ADDRESS",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "getPrice", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "getRatio", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "getVaultInfo",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "manager", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "spotter", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "vat", data: BytesLike): Result;
}

export interface McdView extends BaseContract {
  connect(runner?: ContractRunner | null): McdView;
  waitForDeployment(): Promise<this>;

  interface: McdViewInterface;

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

  MANAGER_ADDRESS: TypedContractMethod<[], [string], "view">;

  SPOTTER_ADDRESS: TypedContractMethod<[], [string], "view">;

  VAT_ADDRESS: TypedContractMethod<[], [string], "view">;

  getPrice: TypedContractMethod<[_ilk: BytesLike], [bigint], "view">;

  getRatio: TypedContractMethod<[_vaultId: BigNumberish], [bigint], "view">;

  getVaultInfo: TypedContractMethod<
    [_vaultId: BigNumberish, _ilk: BytesLike],
    [[bigint, bigint]],
    "view"
  >;

  manager: TypedContractMethod<[], [string], "view">;

  spotter: TypedContractMethod<[], [string], "view">;

  vat: TypedContractMethod<[], [string], "view">;

  getFunction<T extends ContractMethod = ContractMethod>(
    key: string | FunctionFragment
  ): T;

  getFunction(
    nameOrSignature: "MANAGER_ADDRESS"
  ): TypedContractMethod<[], [string], "view">;
  getFunction(
    nameOrSignature: "SPOTTER_ADDRESS"
  ): TypedContractMethod<[], [string], "view">;
  getFunction(
    nameOrSignature: "VAT_ADDRESS"
  ): TypedContractMethod<[], [string], "view">;
  getFunction(
    nameOrSignature: "getPrice"
  ): TypedContractMethod<[_ilk: BytesLike], [bigint], "view">;
  getFunction(
    nameOrSignature: "getRatio"
  ): TypedContractMethod<[_vaultId: BigNumberish], [bigint], "view">;
  getFunction(
    nameOrSignature: "getVaultInfo"
  ): TypedContractMethod<
    [_vaultId: BigNumberish, _ilk: BytesLike],
    [[bigint, bigint]],
    "view"
  >;
  getFunction(
    nameOrSignature: "manager"
  ): TypedContractMethod<[], [string], "view">;
  getFunction(
    nameOrSignature: "spotter"
  ): TypedContractMethod<[], [string], "view">;
  getFunction(
    nameOrSignature: "vat"
  ): TypedContractMethod<[], [string], "view">;

  filters: {};
}