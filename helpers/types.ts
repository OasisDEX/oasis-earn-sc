import { Signer, providers } from "ethers";

export type ValueOf<T> = T[keyof T];

export type Debug = {
  debug?: boolean;
};

export type FormatUnit = {
  decimals?: number;
};

export interface RuntimeConfig {
  provider: providers.JsonRpcProvider;
  signer: Signer;
  address: string;
}

export type WithRuntimeConfig = {
  config: RuntimeConfig;
};

export type BalanceOptions = Debug & FormatUnit & WithRuntimeConfig;

export interface OneInchBaseResponse {
  toTokenAmount: string;
  fromTokenAmount: string;
}

export interface OneInchSwapResponse extends OneInchBaseResponse {
  tx: {
    from: string;
    to: string;
    data: string;
    value: string;
    gasPrice: string;
  };
}
