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
} from "../../../../../../../common";

export interface PRBMathUD60x18MockInterface extends Interface {
  getFunction(
    nameOrSignature:
      | "doAvg"
      | "doCeil"
      | "doDiv"
      | "doExp"
      | "doExp2"
      | "doFloor"
      | "doFrac"
      | "doFromUint"
      | "doGm"
      | "doInv"
      | "doLn"
      | "doLog10"
      | "doLog2"
      | "doMul"
      | "doPow"
      | "doPowu"
      | "doSqrt"
      | "doToUint"
      | "getE"
      | "getPi"
      | "getScale"
  ): FunctionFragment;

  encodeFunctionData(
    functionFragment: "doAvg",
    values: [BigNumberish, BigNumberish]
  ): string;
  encodeFunctionData(
    functionFragment: "doCeil",
    values: [BigNumberish]
  ): string;
  encodeFunctionData(
    functionFragment: "doDiv",
    values: [BigNumberish, BigNumberish]
  ): string;
  encodeFunctionData(functionFragment: "doExp", values: [BigNumberish]): string;
  encodeFunctionData(
    functionFragment: "doExp2",
    values: [BigNumberish]
  ): string;
  encodeFunctionData(
    functionFragment: "doFloor",
    values: [BigNumberish]
  ): string;
  encodeFunctionData(
    functionFragment: "doFrac",
    values: [BigNumberish]
  ): string;
  encodeFunctionData(
    functionFragment: "doFromUint",
    values: [BigNumberish]
  ): string;
  encodeFunctionData(
    functionFragment: "doGm",
    values: [BigNumberish, BigNumberish]
  ): string;
  encodeFunctionData(functionFragment: "doInv", values: [BigNumberish]): string;
  encodeFunctionData(functionFragment: "doLn", values: [BigNumberish]): string;
  encodeFunctionData(
    functionFragment: "doLog10",
    values: [BigNumberish]
  ): string;
  encodeFunctionData(
    functionFragment: "doLog2",
    values: [BigNumberish]
  ): string;
  encodeFunctionData(
    functionFragment: "doMul",
    values: [BigNumberish, BigNumberish]
  ): string;
  encodeFunctionData(
    functionFragment: "doPow",
    values: [BigNumberish, BigNumberish]
  ): string;
  encodeFunctionData(
    functionFragment: "doPowu",
    values: [BigNumberish, BigNumberish]
  ): string;
  encodeFunctionData(
    functionFragment: "doSqrt",
    values: [BigNumberish]
  ): string;
  encodeFunctionData(
    functionFragment: "doToUint",
    values: [BigNumberish]
  ): string;
  encodeFunctionData(functionFragment: "getE", values?: undefined): string;
  encodeFunctionData(functionFragment: "getPi", values?: undefined): string;
  encodeFunctionData(functionFragment: "getScale", values?: undefined): string;

  decodeFunctionResult(functionFragment: "doAvg", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "doCeil", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "doDiv", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "doExp", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "doExp2", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "doFloor", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "doFrac", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "doFromUint", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "doGm", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "doInv", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "doLn", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "doLog10", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "doLog2", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "doMul", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "doPow", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "doPowu", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "doSqrt", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "doToUint", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "getE", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "getPi", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "getScale", data: BytesLike): Result;
}

export interface PRBMathUD60x18Mock extends BaseContract {
  connect(runner?: ContractRunner | null): PRBMathUD60x18Mock;
  waitForDeployment(): Promise<this>;

  interface: PRBMathUD60x18MockInterface;

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

  doAvg: TypedContractMethod<
    [x: BigNumberish, y: BigNumberish],
    [bigint],
    "view"
  >;

  doCeil: TypedContractMethod<[x: BigNumberish], [bigint], "view">;

  doDiv: TypedContractMethod<
    [x: BigNumberish, y: BigNumberish],
    [bigint],
    "view"
  >;

  doExp: TypedContractMethod<[x: BigNumberish], [bigint], "view">;

  doExp2: TypedContractMethod<[x: BigNumberish], [bigint], "view">;

  doFloor: TypedContractMethod<[x: BigNumberish], [bigint], "view">;

  doFrac: TypedContractMethod<[x: BigNumberish], [bigint], "view">;

  doFromUint: TypedContractMethod<[x: BigNumberish], [bigint], "view">;

  doGm: TypedContractMethod<
    [x: BigNumberish, y: BigNumberish],
    [bigint],
    "view"
  >;

  doInv: TypedContractMethod<[x: BigNumberish], [bigint], "view">;

  doLn: TypedContractMethod<[x: BigNumberish], [bigint], "view">;

  doLog10: TypedContractMethod<[x: BigNumberish], [bigint], "view">;

  doLog2: TypedContractMethod<[x: BigNumberish], [bigint], "view">;

  doMul: TypedContractMethod<
    [x: BigNumberish, y: BigNumberish],
    [bigint],
    "view"
  >;

  doPow: TypedContractMethod<
    [x: BigNumberish, y: BigNumberish],
    [bigint],
    "view"
  >;

  doPowu: TypedContractMethod<
    [x: BigNumberish, y: BigNumberish],
    [bigint],
    "view"
  >;

  doSqrt: TypedContractMethod<[x: BigNumberish], [bigint], "view">;

  doToUint: TypedContractMethod<[x: BigNumberish], [bigint], "view">;

  getE: TypedContractMethod<[], [bigint], "view">;

  getPi: TypedContractMethod<[], [bigint], "view">;

  getScale: TypedContractMethod<[], [bigint], "view">;

  getFunction<T extends ContractMethod = ContractMethod>(
    key: string | FunctionFragment
  ): T;

  getFunction(
    nameOrSignature: "doAvg"
  ): TypedContractMethod<[x: BigNumberish, y: BigNumberish], [bigint], "view">;
  getFunction(
    nameOrSignature: "doCeil"
  ): TypedContractMethod<[x: BigNumberish], [bigint], "view">;
  getFunction(
    nameOrSignature: "doDiv"
  ): TypedContractMethod<[x: BigNumberish, y: BigNumberish], [bigint], "view">;
  getFunction(
    nameOrSignature: "doExp"
  ): TypedContractMethod<[x: BigNumberish], [bigint], "view">;
  getFunction(
    nameOrSignature: "doExp2"
  ): TypedContractMethod<[x: BigNumberish], [bigint], "view">;
  getFunction(
    nameOrSignature: "doFloor"
  ): TypedContractMethod<[x: BigNumberish], [bigint], "view">;
  getFunction(
    nameOrSignature: "doFrac"
  ): TypedContractMethod<[x: BigNumberish], [bigint], "view">;
  getFunction(
    nameOrSignature: "doFromUint"
  ): TypedContractMethod<[x: BigNumberish], [bigint], "view">;
  getFunction(
    nameOrSignature: "doGm"
  ): TypedContractMethod<[x: BigNumberish, y: BigNumberish], [bigint], "view">;
  getFunction(
    nameOrSignature: "doInv"
  ): TypedContractMethod<[x: BigNumberish], [bigint], "view">;
  getFunction(
    nameOrSignature: "doLn"
  ): TypedContractMethod<[x: BigNumberish], [bigint], "view">;
  getFunction(
    nameOrSignature: "doLog10"
  ): TypedContractMethod<[x: BigNumberish], [bigint], "view">;
  getFunction(
    nameOrSignature: "doLog2"
  ): TypedContractMethod<[x: BigNumberish], [bigint], "view">;
  getFunction(
    nameOrSignature: "doMul"
  ): TypedContractMethod<[x: BigNumberish, y: BigNumberish], [bigint], "view">;
  getFunction(
    nameOrSignature: "doPow"
  ): TypedContractMethod<[x: BigNumberish, y: BigNumberish], [bigint], "view">;
  getFunction(
    nameOrSignature: "doPowu"
  ): TypedContractMethod<[x: BigNumberish, y: BigNumberish], [bigint], "view">;
  getFunction(
    nameOrSignature: "doSqrt"
  ): TypedContractMethod<[x: BigNumberish], [bigint], "view">;
  getFunction(
    nameOrSignature: "doToUint"
  ): TypedContractMethod<[x: BigNumberish], [bigint], "view">;
  getFunction(
    nameOrSignature: "getE"
  ): TypedContractMethod<[], [bigint], "view">;
  getFunction(
    nameOrSignature: "getPi"
  ): TypedContractMethod<[], [bigint], "view">;
  getFunction(
    nameOrSignature: "getScale"
  ): TypedContractMethod<[], [bigint], "view">;

  filters: {};
}