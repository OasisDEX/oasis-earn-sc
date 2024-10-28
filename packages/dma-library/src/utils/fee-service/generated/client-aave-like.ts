// This file was automatically generated and should not be edited.
// @ts-nocheck
/* eslint-disable */
import type { DocumentNode } from "graphql/language/ast";
import { GraphQLClient, RequestOptions } from 'graphql-request';
import gql from 'graphql-tag';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
type GraphQLClientRequestHeaders = RequestOptions['requestHeaders'];
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  BigDecimal: { input: any; output: any; }
  BigInt: { input: any; output: any; }
  Bytes: { input: any; output: any; }
  Int8: { input: any; output: any; }
  Timestamp: { input: any; output: any; }
};

export type AaveLikeBorrow = {
  __typename?: 'AaveLikeBorrow';
  amount: Scalars['BigInt']['output'];
  blockNumber: Scalars['BigInt']['output'];
  borrowRate: Scalars['BigInt']['output'];
  borrowRateMode: Scalars['BigInt']['output'];
  debtDelta?: Maybe<Scalars['BigDecimal']['output']>;
  id: Scalars['ID']['output'];
  onBehalfOf: Scalars['Bytes']['output'];
  protocol: Scalars['String']['output'];
  referral: Scalars['BigInt']['output'];
  reserve: Scalars['Bytes']['output'];
  stableDebtAfter?: Maybe<Scalars['BigDecimal']['output']>;
  timestamp: Scalars['BigInt']['output'];
  token?: Maybe<Token>;
  tokenPriceUSD?: Maybe<Scalars['BigDecimal']['output']>;
  txHash: Scalars['Bytes']['output'];
  user: Scalars['Bytes']['output'];
  variableDebtAfter?: Maybe<Scalars['BigDecimal']['output']>;
  version?: Maybe<Scalars['String']['output']>;
};

export type AaveLikeBorrow_Filter = {
  /** Filter for the block changed event. */
  _change_block?: InputMaybe<BlockChangedFilter>;
  amount?: InputMaybe<Scalars['BigInt']['input']>;
  amount_gt?: InputMaybe<Scalars['BigInt']['input']>;
  amount_gte?: InputMaybe<Scalars['BigInt']['input']>;
  amount_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  amount_lt?: InputMaybe<Scalars['BigInt']['input']>;
  amount_lte?: InputMaybe<Scalars['BigInt']['input']>;
  amount_not?: InputMaybe<Scalars['BigInt']['input']>;
  amount_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  and?: InputMaybe<Array<InputMaybe<AaveLikeBorrow_Filter>>>;
  blockNumber?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_gt?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_gte?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  blockNumber_lt?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_lte?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_not?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  borrowRate?: InputMaybe<Scalars['BigInt']['input']>;
  borrowRateMode?: InputMaybe<Scalars['BigInt']['input']>;
  borrowRateMode_gt?: InputMaybe<Scalars['BigInt']['input']>;
  borrowRateMode_gte?: InputMaybe<Scalars['BigInt']['input']>;
  borrowRateMode_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  borrowRateMode_lt?: InputMaybe<Scalars['BigInt']['input']>;
  borrowRateMode_lte?: InputMaybe<Scalars['BigInt']['input']>;
  borrowRateMode_not?: InputMaybe<Scalars['BigInt']['input']>;
  borrowRateMode_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  borrowRate_gt?: InputMaybe<Scalars['BigInt']['input']>;
  borrowRate_gte?: InputMaybe<Scalars['BigInt']['input']>;
  borrowRate_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  borrowRate_lt?: InputMaybe<Scalars['BigInt']['input']>;
  borrowRate_lte?: InputMaybe<Scalars['BigInt']['input']>;
  borrowRate_not?: InputMaybe<Scalars['BigInt']['input']>;
  borrowRate_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  debtDelta?: InputMaybe<Scalars['BigDecimal']['input']>;
  debtDelta_gt?: InputMaybe<Scalars['BigDecimal']['input']>;
  debtDelta_gte?: InputMaybe<Scalars['BigDecimal']['input']>;
  debtDelta_in?: InputMaybe<Array<Scalars['BigDecimal']['input']>>;
  debtDelta_lt?: InputMaybe<Scalars['BigDecimal']['input']>;
  debtDelta_lte?: InputMaybe<Scalars['BigDecimal']['input']>;
  debtDelta_not?: InputMaybe<Scalars['BigDecimal']['input']>;
  debtDelta_not_in?: InputMaybe<Array<Scalars['BigDecimal']['input']>>;
  id?: InputMaybe<Scalars['ID']['input']>;
  id_gt?: InputMaybe<Scalars['ID']['input']>;
  id_gte?: InputMaybe<Scalars['ID']['input']>;
  id_in?: InputMaybe<Array<Scalars['ID']['input']>>;
  id_lt?: InputMaybe<Scalars['ID']['input']>;
  id_lte?: InputMaybe<Scalars['ID']['input']>;
  id_not?: InputMaybe<Scalars['ID']['input']>;
  id_not_in?: InputMaybe<Array<Scalars['ID']['input']>>;
  onBehalfOf?: InputMaybe<Scalars['Bytes']['input']>;
  onBehalfOf_contains?: InputMaybe<Scalars['Bytes']['input']>;
  onBehalfOf_gt?: InputMaybe<Scalars['Bytes']['input']>;
  onBehalfOf_gte?: InputMaybe<Scalars['Bytes']['input']>;
  onBehalfOf_in?: InputMaybe<Array<Scalars['Bytes']['input']>>;
  onBehalfOf_lt?: InputMaybe<Scalars['Bytes']['input']>;
  onBehalfOf_lte?: InputMaybe<Scalars['Bytes']['input']>;
  onBehalfOf_not?: InputMaybe<Scalars['Bytes']['input']>;
  onBehalfOf_not_contains?: InputMaybe<Scalars['Bytes']['input']>;
  onBehalfOf_not_in?: InputMaybe<Array<Scalars['Bytes']['input']>>;
  or?: InputMaybe<Array<InputMaybe<AaveLikeBorrow_Filter>>>;
  protocol?: InputMaybe<Scalars['String']['input']>;
  protocol_contains?: InputMaybe<Scalars['String']['input']>;
  protocol_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  protocol_ends_with?: InputMaybe<Scalars['String']['input']>;
  protocol_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  protocol_gt?: InputMaybe<Scalars['String']['input']>;
  protocol_gte?: InputMaybe<Scalars['String']['input']>;
  protocol_in?: InputMaybe<Array<Scalars['String']['input']>>;
  protocol_lt?: InputMaybe<Scalars['String']['input']>;
  protocol_lte?: InputMaybe<Scalars['String']['input']>;
  protocol_not?: InputMaybe<Scalars['String']['input']>;
  protocol_not_contains?: InputMaybe<Scalars['String']['input']>;
  protocol_not_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  protocol_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  protocol_not_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  protocol_not_in?: InputMaybe<Array<Scalars['String']['input']>>;
  protocol_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  protocol_not_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  protocol_starts_with?: InputMaybe<Scalars['String']['input']>;
  protocol_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  referral?: InputMaybe<Scalars['BigInt']['input']>;
  referral_gt?: InputMaybe<Scalars['BigInt']['input']>;
  referral_gte?: InputMaybe<Scalars['BigInt']['input']>;
  referral_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  referral_lt?: InputMaybe<Scalars['BigInt']['input']>;
  referral_lte?: InputMaybe<Scalars['BigInt']['input']>;
  referral_not?: InputMaybe<Scalars['BigInt']['input']>;
  referral_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  reserve?: InputMaybe<Scalars['Bytes']['input']>;
  reserve_contains?: InputMaybe<Scalars['Bytes']['input']>;
  reserve_gt?: InputMaybe<Scalars['Bytes']['input']>;
  reserve_gte?: InputMaybe<Scalars['Bytes']['input']>;
  reserve_in?: InputMaybe<Array<Scalars['Bytes']['input']>>;
  reserve_lt?: InputMaybe<Scalars['Bytes']['input']>;
  reserve_lte?: InputMaybe<Scalars['Bytes']['input']>;
  reserve_not?: InputMaybe<Scalars['Bytes']['input']>;
  reserve_not_contains?: InputMaybe<Scalars['Bytes']['input']>;
  reserve_not_in?: InputMaybe<Array<Scalars['Bytes']['input']>>;
  stableDebtAfter?: InputMaybe<Scalars['BigDecimal']['input']>;
  stableDebtAfter_gt?: InputMaybe<Scalars['BigDecimal']['input']>;
  stableDebtAfter_gte?: InputMaybe<Scalars['BigDecimal']['input']>;
  stableDebtAfter_in?: InputMaybe<Array<Scalars['BigDecimal']['input']>>;
  stableDebtAfter_lt?: InputMaybe<Scalars['BigDecimal']['input']>;
  stableDebtAfter_lte?: InputMaybe<Scalars['BigDecimal']['input']>;
  stableDebtAfter_not?: InputMaybe<Scalars['BigDecimal']['input']>;
  stableDebtAfter_not_in?: InputMaybe<Array<Scalars['BigDecimal']['input']>>;
  timestamp?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_gt?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_gte?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  timestamp_lt?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_lte?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_not?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  token?: InputMaybe<Scalars['String']['input']>;
  tokenPriceUSD?: InputMaybe<Scalars['BigDecimal']['input']>;
  tokenPriceUSD_gt?: InputMaybe<Scalars['BigDecimal']['input']>;
  tokenPriceUSD_gte?: InputMaybe<Scalars['BigDecimal']['input']>;
  tokenPriceUSD_in?: InputMaybe<Array<Scalars['BigDecimal']['input']>>;
  tokenPriceUSD_lt?: InputMaybe<Scalars['BigDecimal']['input']>;
  tokenPriceUSD_lte?: InputMaybe<Scalars['BigDecimal']['input']>;
  tokenPriceUSD_not?: InputMaybe<Scalars['BigDecimal']['input']>;
  tokenPriceUSD_not_in?: InputMaybe<Array<Scalars['BigDecimal']['input']>>;
  token_?: InputMaybe<Token_Filter>;
  token_contains?: InputMaybe<Scalars['String']['input']>;
  token_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  token_ends_with?: InputMaybe<Scalars['String']['input']>;
  token_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  token_gt?: InputMaybe<Scalars['String']['input']>;
  token_gte?: InputMaybe<Scalars['String']['input']>;
  token_in?: InputMaybe<Array<Scalars['String']['input']>>;
  token_lt?: InputMaybe<Scalars['String']['input']>;
  token_lte?: InputMaybe<Scalars['String']['input']>;
  token_not?: InputMaybe<Scalars['String']['input']>;
  token_not_contains?: InputMaybe<Scalars['String']['input']>;
  token_not_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  token_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  token_not_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  token_not_in?: InputMaybe<Array<Scalars['String']['input']>>;
  token_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  token_not_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  token_starts_with?: InputMaybe<Scalars['String']['input']>;
  token_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  txHash?: InputMaybe<Scalars['Bytes']['input']>;
  txHash_contains?: InputMaybe<Scalars['Bytes']['input']>;
  txHash_gt?: InputMaybe<Scalars['Bytes']['input']>;
  txHash_gte?: InputMaybe<Scalars['Bytes']['input']>;
  txHash_in?: InputMaybe<Array<Scalars['Bytes']['input']>>;
  txHash_lt?: InputMaybe<Scalars['Bytes']['input']>;
  txHash_lte?: InputMaybe<Scalars['Bytes']['input']>;
  txHash_not?: InputMaybe<Scalars['Bytes']['input']>;
  txHash_not_contains?: InputMaybe<Scalars['Bytes']['input']>;
  txHash_not_in?: InputMaybe<Array<Scalars['Bytes']['input']>>;
  user?: InputMaybe<Scalars['Bytes']['input']>;
  user_contains?: InputMaybe<Scalars['Bytes']['input']>;
  user_gt?: InputMaybe<Scalars['Bytes']['input']>;
  user_gte?: InputMaybe<Scalars['Bytes']['input']>;
  user_in?: InputMaybe<Array<Scalars['Bytes']['input']>>;
  user_lt?: InputMaybe<Scalars['Bytes']['input']>;
  user_lte?: InputMaybe<Scalars['Bytes']['input']>;
  user_not?: InputMaybe<Scalars['Bytes']['input']>;
  user_not_contains?: InputMaybe<Scalars['Bytes']['input']>;
  user_not_in?: InputMaybe<Array<Scalars['Bytes']['input']>>;
  variableDebtAfter?: InputMaybe<Scalars['BigDecimal']['input']>;
  variableDebtAfter_gt?: InputMaybe<Scalars['BigDecimal']['input']>;
  variableDebtAfter_gte?: InputMaybe<Scalars['BigDecimal']['input']>;
  variableDebtAfter_in?: InputMaybe<Array<Scalars['BigDecimal']['input']>>;
  variableDebtAfter_lt?: InputMaybe<Scalars['BigDecimal']['input']>;
  variableDebtAfter_lte?: InputMaybe<Scalars['BigDecimal']['input']>;
  variableDebtAfter_not?: InputMaybe<Scalars['BigDecimal']['input']>;
  variableDebtAfter_not_in?: InputMaybe<Array<Scalars['BigDecimal']['input']>>;
  version?: InputMaybe<Scalars['String']['input']>;
  version_contains?: InputMaybe<Scalars['String']['input']>;
  version_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  version_ends_with?: InputMaybe<Scalars['String']['input']>;
  version_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  version_gt?: InputMaybe<Scalars['String']['input']>;
  version_gte?: InputMaybe<Scalars['String']['input']>;
  version_in?: InputMaybe<Array<Scalars['String']['input']>>;
  version_lt?: InputMaybe<Scalars['String']['input']>;
  version_lte?: InputMaybe<Scalars['String']['input']>;
  version_not?: InputMaybe<Scalars['String']['input']>;
  version_not_contains?: InputMaybe<Scalars['String']['input']>;
  version_not_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  version_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  version_not_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  version_not_in?: InputMaybe<Array<Scalars['String']['input']>>;
  version_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  version_not_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  version_starts_with?: InputMaybe<Scalars['String']['input']>;
  version_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
};

export enum AaveLikeBorrow_OrderBy {
  Amount = 'amount',
  BlockNumber = 'blockNumber',
  BorrowRate = 'borrowRate',
  BorrowRateMode = 'borrowRateMode',
  DebtDelta = 'debtDelta',
  Id = 'id',
  OnBehalfOf = 'onBehalfOf',
  Protocol = 'protocol',
  Referral = 'referral',
  Reserve = 'reserve',
  StableDebtAfter = 'stableDebtAfter',
  Timestamp = 'timestamp',
  Token = 'token',
  TokenPriceUsd = 'tokenPriceUSD',
  TokenAddress = 'token__address',
  TokenDecimals = 'token__decimals',
  TokenId = 'token__id',
  TokenPrecision = 'token__precision',
  TokenSymbol = 'token__symbol',
  TxHash = 'txHash',
  User = 'user',
  VariableDebtAfter = 'variableDebtAfter',
  Version = 'version'
}

export type AaveLikeDeposit = {
  __typename?: 'AaveLikeDeposit';
  amount: Scalars['BigInt']['output'];
  blockNumber: Scalars['BigInt']['output'];
  collateralAfter?: Maybe<Scalars['BigDecimal']['output']>;
  collateralDelta?: Maybe<Scalars['BigDecimal']['output']>;
  id: Scalars['ID']['output'];
  onBehalfOf: Scalars['Bytes']['output'];
  protocol: Scalars['String']['output'];
  referral: Scalars['BigInt']['output'];
  reserve: Scalars['Bytes']['output'];
  timestamp: Scalars['BigInt']['output'];
  token?: Maybe<Token>;
  tokenPriceUSD?: Maybe<Scalars['BigDecimal']['output']>;
  txHash: Scalars['Bytes']['output'];
  user: Scalars['Bytes']['output'];
  version?: Maybe<Scalars['String']['output']>;
};

export type AaveLikeDeposit_Filter = {
  /** Filter for the block changed event. */
  _change_block?: InputMaybe<BlockChangedFilter>;
  amount?: InputMaybe<Scalars['BigInt']['input']>;
  amount_gt?: InputMaybe<Scalars['BigInt']['input']>;
  amount_gte?: InputMaybe<Scalars['BigInt']['input']>;
  amount_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  amount_lt?: InputMaybe<Scalars['BigInt']['input']>;
  amount_lte?: InputMaybe<Scalars['BigInt']['input']>;
  amount_not?: InputMaybe<Scalars['BigInt']['input']>;
  amount_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  and?: InputMaybe<Array<InputMaybe<AaveLikeDeposit_Filter>>>;
  blockNumber?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_gt?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_gte?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  blockNumber_lt?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_lte?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_not?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  collateralAfter?: InputMaybe<Scalars['BigDecimal']['input']>;
  collateralAfter_gt?: InputMaybe<Scalars['BigDecimal']['input']>;
  collateralAfter_gte?: InputMaybe<Scalars['BigDecimal']['input']>;
  collateralAfter_in?: InputMaybe<Array<Scalars['BigDecimal']['input']>>;
  collateralAfter_lt?: InputMaybe<Scalars['BigDecimal']['input']>;
  collateralAfter_lte?: InputMaybe<Scalars['BigDecimal']['input']>;
  collateralAfter_not?: InputMaybe<Scalars['BigDecimal']['input']>;
  collateralAfter_not_in?: InputMaybe<Array<Scalars['BigDecimal']['input']>>;
  collateralDelta?: InputMaybe<Scalars['BigDecimal']['input']>;
  collateralDelta_gt?: InputMaybe<Scalars['BigDecimal']['input']>;
  collateralDelta_gte?: InputMaybe<Scalars['BigDecimal']['input']>;
  collateralDelta_in?: InputMaybe<Array<Scalars['BigDecimal']['input']>>;
  collateralDelta_lt?: InputMaybe<Scalars['BigDecimal']['input']>;
  collateralDelta_lte?: InputMaybe<Scalars['BigDecimal']['input']>;
  collateralDelta_not?: InputMaybe<Scalars['BigDecimal']['input']>;
  collateralDelta_not_in?: InputMaybe<Array<Scalars['BigDecimal']['input']>>;
  id?: InputMaybe<Scalars['ID']['input']>;
  id_gt?: InputMaybe<Scalars['ID']['input']>;
  id_gte?: InputMaybe<Scalars['ID']['input']>;
  id_in?: InputMaybe<Array<Scalars['ID']['input']>>;
  id_lt?: InputMaybe<Scalars['ID']['input']>;
  id_lte?: InputMaybe<Scalars['ID']['input']>;
  id_not?: InputMaybe<Scalars['ID']['input']>;
  id_not_in?: InputMaybe<Array<Scalars['ID']['input']>>;
  onBehalfOf?: InputMaybe<Scalars['Bytes']['input']>;
  onBehalfOf_contains?: InputMaybe<Scalars['Bytes']['input']>;
  onBehalfOf_gt?: InputMaybe<Scalars['Bytes']['input']>;
  onBehalfOf_gte?: InputMaybe<Scalars['Bytes']['input']>;
  onBehalfOf_in?: InputMaybe<Array<Scalars['Bytes']['input']>>;
  onBehalfOf_lt?: InputMaybe<Scalars['Bytes']['input']>;
  onBehalfOf_lte?: InputMaybe<Scalars['Bytes']['input']>;
  onBehalfOf_not?: InputMaybe<Scalars['Bytes']['input']>;
  onBehalfOf_not_contains?: InputMaybe<Scalars['Bytes']['input']>;
  onBehalfOf_not_in?: InputMaybe<Array<Scalars['Bytes']['input']>>;
  or?: InputMaybe<Array<InputMaybe<AaveLikeDeposit_Filter>>>;
  protocol?: InputMaybe<Scalars['String']['input']>;
  protocol_contains?: InputMaybe<Scalars['String']['input']>;
  protocol_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  protocol_ends_with?: InputMaybe<Scalars['String']['input']>;
  protocol_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  protocol_gt?: InputMaybe<Scalars['String']['input']>;
  protocol_gte?: InputMaybe<Scalars['String']['input']>;
  protocol_in?: InputMaybe<Array<Scalars['String']['input']>>;
  protocol_lt?: InputMaybe<Scalars['String']['input']>;
  protocol_lte?: InputMaybe<Scalars['String']['input']>;
  protocol_not?: InputMaybe<Scalars['String']['input']>;
  protocol_not_contains?: InputMaybe<Scalars['String']['input']>;
  protocol_not_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  protocol_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  protocol_not_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  protocol_not_in?: InputMaybe<Array<Scalars['String']['input']>>;
  protocol_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  protocol_not_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  protocol_starts_with?: InputMaybe<Scalars['String']['input']>;
  protocol_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  referral?: InputMaybe<Scalars['BigInt']['input']>;
  referral_gt?: InputMaybe<Scalars['BigInt']['input']>;
  referral_gte?: InputMaybe<Scalars['BigInt']['input']>;
  referral_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  referral_lt?: InputMaybe<Scalars['BigInt']['input']>;
  referral_lte?: InputMaybe<Scalars['BigInt']['input']>;
  referral_not?: InputMaybe<Scalars['BigInt']['input']>;
  referral_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  reserve?: InputMaybe<Scalars['Bytes']['input']>;
  reserve_contains?: InputMaybe<Scalars['Bytes']['input']>;
  reserve_gt?: InputMaybe<Scalars['Bytes']['input']>;
  reserve_gte?: InputMaybe<Scalars['Bytes']['input']>;
  reserve_in?: InputMaybe<Array<Scalars['Bytes']['input']>>;
  reserve_lt?: InputMaybe<Scalars['Bytes']['input']>;
  reserve_lte?: InputMaybe<Scalars['Bytes']['input']>;
  reserve_not?: InputMaybe<Scalars['Bytes']['input']>;
  reserve_not_contains?: InputMaybe<Scalars['Bytes']['input']>;
  reserve_not_in?: InputMaybe<Array<Scalars['Bytes']['input']>>;
  timestamp?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_gt?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_gte?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  timestamp_lt?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_lte?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_not?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  token?: InputMaybe<Scalars['String']['input']>;
  tokenPriceUSD?: InputMaybe<Scalars['BigDecimal']['input']>;
  tokenPriceUSD_gt?: InputMaybe<Scalars['BigDecimal']['input']>;
  tokenPriceUSD_gte?: InputMaybe<Scalars['BigDecimal']['input']>;
  tokenPriceUSD_in?: InputMaybe<Array<Scalars['BigDecimal']['input']>>;
  tokenPriceUSD_lt?: InputMaybe<Scalars['BigDecimal']['input']>;
  tokenPriceUSD_lte?: InputMaybe<Scalars['BigDecimal']['input']>;
  tokenPriceUSD_not?: InputMaybe<Scalars['BigDecimal']['input']>;
  tokenPriceUSD_not_in?: InputMaybe<Array<Scalars['BigDecimal']['input']>>;
  token_?: InputMaybe<Token_Filter>;
  token_contains?: InputMaybe<Scalars['String']['input']>;
  token_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  token_ends_with?: InputMaybe<Scalars['String']['input']>;
  token_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  token_gt?: InputMaybe<Scalars['String']['input']>;
  token_gte?: InputMaybe<Scalars['String']['input']>;
  token_in?: InputMaybe<Array<Scalars['String']['input']>>;
  token_lt?: InputMaybe<Scalars['String']['input']>;
  token_lte?: InputMaybe<Scalars['String']['input']>;
  token_not?: InputMaybe<Scalars['String']['input']>;
  token_not_contains?: InputMaybe<Scalars['String']['input']>;
  token_not_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  token_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  token_not_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  token_not_in?: InputMaybe<Array<Scalars['String']['input']>>;
  token_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  token_not_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  token_starts_with?: InputMaybe<Scalars['String']['input']>;
  token_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  txHash?: InputMaybe<Scalars['Bytes']['input']>;
  txHash_contains?: InputMaybe<Scalars['Bytes']['input']>;
  txHash_gt?: InputMaybe<Scalars['Bytes']['input']>;
  txHash_gte?: InputMaybe<Scalars['Bytes']['input']>;
  txHash_in?: InputMaybe<Array<Scalars['Bytes']['input']>>;
  txHash_lt?: InputMaybe<Scalars['Bytes']['input']>;
  txHash_lte?: InputMaybe<Scalars['Bytes']['input']>;
  txHash_not?: InputMaybe<Scalars['Bytes']['input']>;
  txHash_not_contains?: InputMaybe<Scalars['Bytes']['input']>;
  txHash_not_in?: InputMaybe<Array<Scalars['Bytes']['input']>>;
  user?: InputMaybe<Scalars['Bytes']['input']>;
  user_contains?: InputMaybe<Scalars['Bytes']['input']>;
  user_gt?: InputMaybe<Scalars['Bytes']['input']>;
  user_gte?: InputMaybe<Scalars['Bytes']['input']>;
  user_in?: InputMaybe<Array<Scalars['Bytes']['input']>>;
  user_lt?: InputMaybe<Scalars['Bytes']['input']>;
  user_lte?: InputMaybe<Scalars['Bytes']['input']>;
  user_not?: InputMaybe<Scalars['Bytes']['input']>;
  user_not_contains?: InputMaybe<Scalars['Bytes']['input']>;
  user_not_in?: InputMaybe<Array<Scalars['Bytes']['input']>>;
  version?: InputMaybe<Scalars['String']['input']>;
  version_contains?: InputMaybe<Scalars['String']['input']>;
  version_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  version_ends_with?: InputMaybe<Scalars['String']['input']>;
  version_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  version_gt?: InputMaybe<Scalars['String']['input']>;
  version_gte?: InputMaybe<Scalars['String']['input']>;
  version_in?: InputMaybe<Array<Scalars['String']['input']>>;
  version_lt?: InputMaybe<Scalars['String']['input']>;
  version_lte?: InputMaybe<Scalars['String']['input']>;
  version_not?: InputMaybe<Scalars['String']['input']>;
  version_not_contains?: InputMaybe<Scalars['String']['input']>;
  version_not_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  version_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  version_not_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  version_not_in?: InputMaybe<Array<Scalars['String']['input']>>;
  version_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  version_not_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  version_starts_with?: InputMaybe<Scalars['String']['input']>;
  version_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
};

export enum AaveLikeDeposit_OrderBy {
  Amount = 'amount',
  BlockNumber = 'blockNumber',
  CollateralAfter = 'collateralAfter',
  CollateralDelta = 'collateralDelta',
  Id = 'id',
  OnBehalfOf = 'onBehalfOf',
  Protocol = 'protocol',
  Referral = 'referral',
  Reserve = 'reserve',
  Timestamp = 'timestamp',
  Token = 'token',
  TokenPriceUsd = 'tokenPriceUSD',
  TokenAddress = 'token__address',
  TokenDecimals = 'token__decimals',
  TokenId = 'token__id',
  TokenPrecision = 'token__precision',
  TokenSymbol = 'token__symbol',
  TxHash = 'txHash',
  User = 'user',
  Version = 'version'
}

export type AaveLikeLiquidation = {
  __typename?: 'AaveLikeLiquidation';
  blockNumber: Scalars['BigInt']['output'];
  collateralAfter?: Maybe<Scalars['BigDecimal']['output']>;
  collateralAsset: Scalars['Bytes']['output'];
  collateralDelta: Scalars['BigDecimal']['output'];
  collateralToken: Token;
  collateralTokenPriceUSD?: Maybe<Scalars['BigDecimal']['output']>;
  debtAsset: Scalars['Bytes']['output'];
  debtDelta: Scalars['BigDecimal']['output'];
  debtToCover: Scalars['BigInt']['output'];
  debtToken: Token;
  debtTokenPriceUSD?: Maybe<Scalars['BigDecimal']['output']>;
  id: Scalars['ID']['output'];
  liquidatedCollateralAmount: Scalars['BigInt']['output'];
  liquidator: Scalars['Bytes']['output'];
  protocol: Scalars['String']['output'];
  receiveAToken: Scalars['Boolean']['output'];
  stableDebtAfter?: Maybe<Scalars['BigDecimal']['output']>;
  timestamp: Scalars['BigInt']['output'];
  txHash: Scalars['Bytes']['output'];
  user: Scalars['Bytes']['output'];
  variableDebtAfter?: Maybe<Scalars['BigDecimal']['output']>;
  version?: Maybe<Scalars['String']['output']>;
};

export type AaveLikeLiquidation_Filter = {
  /** Filter for the block changed event. */
  _change_block?: InputMaybe<BlockChangedFilter>;
  and?: InputMaybe<Array<InputMaybe<AaveLikeLiquidation_Filter>>>;
  blockNumber?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_gt?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_gte?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  blockNumber_lt?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_lte?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_not?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  collateralAfter?: InputMaybe<Scalars['BigDecimal']['input']>;
  collateralAfter_gt?: InputMaybe<Scalars['BigDecimal']['input']>;
  collateralAfter_gte?: InputMaybe<Scalars['BigDecimal']['input']>;
  collateralAfter_in?: InputMaybe<Array<Scalars['BigDecimal']['input']>>;
  collateralAfter_lt?: InputMaybe<Scalars['BigDecimal']['input']>;
  collateralAfter_lte?: InputMaybe<Scalars['BigDecimal']['input']>;
  collateralAfter_not?: InputMaybe<Scalars['BigDecimal']['input']>;
  collateralAfter_not_in?: InputMaybe<Array<Scalars['BigDecimal']['input']>>;
  collateralAsset?: InputMaybe<Scalars['Bytes']['input']>;
  collateralAsset_contains?: InputMaybe<Scalars['Bytes']['input']>;
  collateralAsset_gt?: InputMaybe<Scalars['Bytes']['input']>;
  collateralAsset_gte?: InputMaybe<Scalars['Bytes']['input']>;
  collateralAsset_in?: InputMaybe<Array<Scalars['Bytes']['input']>>;
  collateralAsset_lt?: InputMaybe<Scalars['Bytes']['input']>;
  collateralAsset_lte?: InputMaybe<Scalars['Bytes']['input']>;
  collateralAsset_not?: InputMaybe<Scalars['Bytes']['input']>;
  collateralAsset_not_contains?: InputMaybe<Scalars['Bytes']['input']>;
  collateralAsset_not_in?: InputMaybe<Array<Scalars['Bytes']['input']>>;
  collateralDelta?: InputMaybe<Scalars['BigDecimal']['input']>;
  collateralDelta_gt?: InputMaybe<Scalars['BigDecimal']['input']>;
  collateralDelta_gte?: InputMaybe<Scalars['BigDecimal']['input']>;
  collateralDelta_in?: InputMaybe<Array<Scalars['BigDecimal']['input']>>;
  collateralDelta_lt?: InputMaybe<Scalars['BigDecimal']['input']>;
  collateralDelta_lte?: InputMaybe<Scalars['BigDecimal']['input']>;
  collateralDelta_not?: InputMaybe<Scalars['BigDecimal']['input']>;
  collateralDelta_not_in?: InputMaybe<Array<Scalars['BigDecimal']['input']>>;
  collateralToken?: InputMaybe<Scalars['String']['input']>;
  collateralTokenPriceUSD?: InputMaybe<Scalars['BigDecimal']['input']>;
  collateralTokenPriceUSD_gt?: InputMaybe<Scalars['BigDecimal']['input']>;
  collateralTokenPriceUSD_gte?: InputMaybe<Scalars['BigDecimal']['input']>;
  collateralTokenPriceUSD_in?: InputMaybe<Array<Scalars['BigDecimal']['input']>>;
  collateralTokenPriceUSD_lt?: InputMaybe<Scalars['BigDecimal']['input']>;
  collateralTokenPriceUSD_lte?: InputMaybe<Scalars['BigDecimal']['input']>;
  collateralTokenPriceUSD_not?: InputMaybe<Scalars['BigDecimal']['input']>;
  collateralTokenPriceUSD_not_in?: InputMaybe<Array<Scalars['BigDecimal']['input']>>;
  collateralToken_?: InputMaybe<Token_Filter>;
  collateralToken_contains?: InputMaybe<Scalars['String']['input']>;
  collateralToken_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  collateralToken_ends_with?: InputMaybe<Scalars['String']['input']>;
  collateralToken_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  collateralToken_gt?: InputMaybe<Scalars['String']['input']>;
  collateralToken_gte?: InputMaybe<Scalars['String']['input']>;
  collateralToken_in?: InputMaybe<Array<Scalars['String']['input']>>;
  collateralToken_lt?: InputMaybe<Scalars['String']['input']>;
  collateralToken_lte?: InputMaybe<Scalars['String']['input']>;
  collateralToken_not?: InputMaybe<Scalars['String']['input']>;
  collateralToken_not_contains?: InputMaybe<Scalars['String']['input']>;
  collateralToken_not_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  collateralToken_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  collateralToken_not_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  collateralToken_not_in?: InputMaybe<Array<Scalars['String']['input']>>;
  collateralToken_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  collateralToken_not_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  collateralToken_starts_with?: InputMaybe<Scalars['String']['input']>;
  collateralToken_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  debtAsset?: InputMaybe<Scalars['Bytes']['input']>;
  debtAsset_contains?: InputMaybe<Scalars['Bytes']['input']>;
  debtAsset_gt?: InputMaybe<Scalars['Bytes']['input']>;
  debtAsset_gte?: InputMaybe<Scalars['Bytes']['input']>;
  debtAsset_in?: InputMaybe<Array<Scalars['Bytes']['input']>>;
  debtAsset_lt?: InputMaybe<Scalars['Bytes']['input']>;
  debtAsset_lte?: InputMaybe<Scalars['Bytes']['input']>;
  debtAsset_not?: InputMaybe<Scalars['Bytes']['input']>;
  debtAsset_not_contains?: InputMaybe<Scalars['Bytes']['input']>;
  debtAsset_not_in?: InputMaybe<Array<Scalars['Bytes']['input']>>;
  debtDelta?: InputMaybe<Scalars['BigDecimal']['input']>;
  debtDelta_gt?: InputMaybe<Scalars['BigDecimal']['input']>;
  debtDelta_gte?: InputMaybe<Scalars['BigDecimal']['input']>;
  debtDelta_in?: InputMaybe<Array<Scalars['BigDecimal']['input']>>;
  debtDelta_lt?: InputMaybe<Scalars['BigDecimal']['input']>;
  debtDelta_lte?: InputMaybe<Scalars['BigDecimal']['input']>;
  debtDelta_not?: InputMaybe<Scalars['BigDecimal']['input']>;
  debtDelta_not_in?: InputMaybe<Array<Scalars['BigDecimal']['input']>>;
  debtToCover?: InputMaybe<Scalars['BigInt']['input']>;
  debtToCover_gt?: InputMaybe<Scalars['BigInt']['input']>;
  debtToCover_gte?: InputMaybe<Scalars['BigInt']['input']>;
  debtToCover_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  debtToCover_lt?: InputMaybe<Scalars['BigInt']['input']>;
  debtToCover_lte?: InputMaybe<Scalars['BigInt']['input']>;
  debtToCover_not?: InputMaybe<Scalars['BigInt']['input']>;
  debtToCover_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  debtToken?: InputMaybe<Scalars['String']['input']>;
  debtTokenPriceUSD?: InputMaybe<Scalars['BigDecimal']['input']>;
  debtTokenPriceUSD_gt?: InputMaybe<Scalars['BigDecimal']['input']>;
  debtTokenPriceUSD_gte?: InputMaybe<Scalars['BigDecimal']['input']>;
  debtTokenPriceUSD_in?: InputMaybe<Array<Scalars['BigDecimal']['input']>>;
  debtTokenPriceUSD_lt?: InputMaybe<Scalars['BigDecimal']['input']>;
  debtTokenPriceUSD_lte?: InputMaybe<Scalars['BigDecimal']['input']>;
  debtTokenPriceUSD_not?: InputMaybe<Scalars['BigDecimal']['input']>;
  debtTokenPriceUSD_not_in?: InputMaybe<Array<Scalars['BigDecimal']['input']>>;
  debtToken_?: InputMaybe<Token_Filter>;
  debtToken_contains?: InputMaybe<Scalars['String']['input']>;
  debtToken_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  debtToken_ends_with?: InputMaybe<Scalars['String']['input']>;
  debtToken_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  debtToken_gt?: InputMaybe<Scalars['String']['input']>;
  debtToken_gte?: InputMaybe<Scalars['String']['input']>;
  debtToken_in?: InputMaybe<Array<Scalars['String']['input']>>;
  debtToken_lt?: InputMaybe<Scalars['String']['input']>;
  debtToken_lte?: InputMaybe<Scalars['String']['input']>;
  debtToken_not?: InputMaybe<Scalars['String']['input']>;
  debtToken_not_contains?: InputMaybe<Scalars['String']['input']>;
  debtToken_not_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  debtToken_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  debtToken_not_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  debtToken_not_in?: InputMaybe<Array<Scalars['String']['input']>>;
  debtToken_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  debtToken_not_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  debtToken_starts_with?: InputMaybe<Scalars['String']['input']>;
  debtToken_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  id?: InputMaybe<Scalars['ID']['input']>;
  id_gt?: InputMaybe<Scalars['ID']['input']>;
  id_gte?: InputMaybe<Scalars['ID']['input']>;
  id_in?: InputMaybe<Array<Scalars['ID']['input']>>;
  id_lt?: InputMaybe<Scalars['ID']['input']>;
  id_lte?: InputMaybe<Scalars['ID']['input']>;
  id_not?: InputMaybe<Scalars['ID']['input']>;
  id_not_in?: InputMaybe<Array<Scalars['ID']['input']>>;
  liquidatedCollateralAmount?: InputMaybe<Scalars['BigInt']['input']>;
  liquidatedCollateralAmount_gt?: InputMaybe<Scalars['BigInt']['input']>;
  liquidatedCollateralAmount_gte?: InputMaybe<Scalars['BigInt']['input']>;
  liquidatedCollateralAmount_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  liquidatedCollateralAmount_lt?: InputMaybe<Scalars['BigInt']['input']>;
  liquidatedCollateralAmount_lte?: InputMaybe<Scalars['BigInt']['input']>;
  liquidatedCollateralAmount_not?: InputMaybe<Scalars['BigInt']['input']>;
  liquidatedCollateralAmount_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  liquidator?: InputMaybe<Scalars['Bytes']['input']>;
  liquidator_contains?: InputMaybe<Scalars['Bytes']['input']>;
  liquidator_gt?: InputMaybe<Scalars['Bytes']['input']>;
  liquidator_gte?: InputMaybe<Scalars['Bytes']['input']>;
  liquidator_in?: InputMaybe<Array<Scalars['Bytes']['input']>>;
  liquidator_lt?: InputMaybe<Scalars['Bytes']['input']>;
  liquidator_lte?: InputMaybe<Scalars['Bytes']['input']>;
  liquidator_not?: InputMaybe<Scalars['Bytes']['input']>;
  liquidator_not_contains?: InputMaybe<Scalars['Bytes']['input']>;
  liquidator_not_in?: InputMaybe<Array<Scalars['Bytes']['input']>>;
  or?: InputMaybe<Array<InputMaybe<AaveLikeLiquidation_Filter>>>;
  protocol?: InputMaybe<Scalars['String']['input']>;
  protocol_contains?: InputMaybe<Scalars['String']['input']>;
  protocol_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  protocol_ends_with?: InputMaybe<Scalars['String']['input']>;
  protocol_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  protocol_gt?: InputMaybe<Scalars['String']['input']>;
  protocol_gte?: InputMaybe<Scalars['String']['input']>;
  protocol_in?: InputMaybe<Array<Scalars['String']['input']>>;
  protocol_lt?: InputMaybe<Scalars['String']['input']>;
  protocol_lte?: InputMaybe<Scalars['String']['input']>;
  protocol_not?: InputMaybe<Scalars['String']['input']>;
  protocol_not_contains?: InputMaybe<Scalars['String']['input']>;
  protocol_not_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  protocol_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  protocol_not_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  protocol_not_in?: InputMaybe<Array<Scalars['String']['input']>>;
  protocol_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  protocol_not_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  protocol_starts_with?: InputMaybe<Scalars['String']['input']>;
  protocol_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  receiveAToken?: InputMaybe<Scalars['Boolean']['input']>;
  receiveAToken_in?: InputMaybe<Array<Scalars['Boolean']['input']>>;
  receiveAToken_not?: InputMaybe<Scalars['Boolean']['input']>;
  receiveAToken_not_in?: InputMaybe<Array<Scalars['Boolean']['input']>>;
  stableDebtAfter?: InputMaybe<Scalars['BigDecimal']['input']>;
  stableDebtAfter_gt?: InputMaybe<Scalars['BigDecimal']['input']>;
  stableDebtAfter_gte?: InputMaybe<Scalars['BigDecimal']['input']>;
  stableDebtAfter_in?: InputMaybe<Array<Scalars['BigDecimal']['input']>>;
  stableDebtAfter_lt?: InputMaybe<Scalars['BigDecimal']['input']>;
  stableDebtAfter_lte?: InputMaybe<Scalars['BigDecimal']['input']>;
  stableDebtAfter_not?: InputMaybe<Scalars['BigDecimal']['input']>;
  stableDebtAfter_not_in?: InputMaybe<Array<Scalars['BigDecimal']['input']>>;
  timestamp?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_gt?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_gte?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  timestamp_lt?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_lte?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_not?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  txHash?: InputMaybe<Scalars['Bytes']['input']>;
  txHash_contains?: InputMaybe<Scalars['Bytes']['input']>;
  txHash_gt?: InputMaybe<Scalars['Bytes']['input']>;
  txHash_gte?: InputMaybe<Scalars['Bytes']['input']>;
  txHash_in?: InputMaybe<Array<Scalars['Bytes']['input']>>;
  txHash_lt?: InputMaybe<Scalars['Bytes']['input']>;
  txHash_lte?: InputMaybe<Scalars['Bytes']['input']>;
  txHash_not?: InputMaybe<Scalars['Bytes']['input']>;
  txHash_not_contains?: InputMaybe<Scalars['Bytes']['input']>;
  txHash_not_in?: InputMaybe<Array<Scalars['Bytes']['input']>>;
  user?: InputMaybe<Scalars['Bytes']['input']>;
  user_contains?: InputMaybe<Scalars['Bytes']['input']>;
  user_gt?: InputMaybe<Scalars['Bytes']['input']>;
  user_gte?: InputMaybe<Scalars['Bytes']['input']>;
  user_in?: InputMaybe<Array<Scalars['Bytes']['input']>>;
  user_lt?: InputMaybe<Scalars['Bytes']['input']>;
  user_lte?: InputMaybe<Scalars['Bytes']['input']>;
  user_not?: InputMaybe<Scalars['Bytes']['input']>;
  user_not_contains?: InputMaybe<Scalars['Bytes']['input']>;
  user_not_in?: InputMaybe<Array<Scalars['Bytes']['input']>>;
  variableDebtAfter?: InputMaybe<Scalars['BigDecimal']['input']>;
  variableDebtAfter_gt?: InputMaybe<Scalars['BigDecimal']['input']>;
  variableDebtAfter_gte?: InputMaybe<Scalars['BigDecimal']['input']>;
  variableDebtAfter_in?: InputMaybe<Array<Scalars['BigDecimal']['input']>>;
  variableDebtAfter_lt?: InputMaybe<Scalars['BigDecimal']['input']>;
  variableDebtAfter_lte?: InputMaybe<Scalars['BigDecimal']['input']>;
  variableDebtAfter_not?: InputMaybe<Scalars['BigDecimal']['input']>;
  variableDebtAfter_not_in?: InputMaybe<Array<Scalars['BigDecimal']['input']>>;
  version?: InputMaybe<Scalars['String']['input']>;
  version_contains?: InputMaybe<Scalars['String']['input']>;
  version_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  version_ends_with?: InputMaybe<Scalars['String']['input']>;
  version_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  version_gt?: InputMaybe<Scalars['String']['input']>;
  version_gte?: InputMaybe<Scalars['String']['input']>;
  version_in?: InputMaybe<Array<Scalars['String']['input']>>;
  version_lt?: InputMaybe<Scalars['String']['input']>;
  version_lte?: InputMaybe<Scalars['String']['input']>;
  version_not?: InputMaybe<Scalars['String']['input']>;
  version_not_contains?: InputMaybe<Scalars['String']['input']>;
  version_not_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  version_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  version_not_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  version_not_in?: InputMaybe<Array<Scalars['String']['input']>>;
  version_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  version_not_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  version_starts_with?: InputMaybe<Scalars['String']['input']>;
  version_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
};

export enum AaveLikeLiquidation_OrderBy {
  BlockNumber = 'blockNumber',
  CollateralAfter = 'collateralAfter',
  CollateralAsset = 'collateralAsset',
  CollateralDelta = 'collateralDelta',
  CollateralToken = 'collateralToken',
  CollateralTokenPriceUsd = 'collateralTokenPriceUSD',
  CollateralTokenAddress = 'collateralToken__address',
  CollateralTokenDecimals = 'collateralToken__decimals',
  CollateralTokenId = 'collateralToken__id',
  CollateralTokenPrecision = 'collateralToken__precision',
  CollateralTokenSymbol = 'collateralToken__symbol',
  DebtAsset = 'debtAsset',
  DebtDelta = 'debtDelta',
  DebtToCover = 'debtToCover',
  DebtToken = 'debtToken',
  DebtTokenPriceUsd = 'debtTokenPriceUSD',
  DebtTokenAddress = 'debtToken__address',
  DebtTokenDecimals = 'debtToken__decimals',
  DebtTokenId = 'debtToken__id',
  DebtTokenPrecision = 'debtToken__precision',
  DebtTokenSymbol = 'debtToken__symbol',
  Id = 'id',
  LiquidatedCollateralAmount = 'liquidatedCollateralAmount',
  Liquidator = 'liquidator',
  Protocol = 'protocol',
  ReceiveAToken = 'receiveAToken',
  StableDebtAfter = 'stableDebtAfter',
  Timestamp = 'timestamp',
  TxHash = 'txHash',
  User = 'user',
  VariableDebtAfter = 'variableDebtAfter',
  Version = 'version'
}

export type AaveLikeRepay = {
  __typename?: 'AaveLikeRepay';
  amount: Scalars['BigInt']['output'];
  blockNumber: Scalars['BigInt']['output'];
  debtDelta?: Maybe<Scalars['BigDecimal']['output']>;
  id: Scalars['ID']['output'];
  protocol: Scalars['String']['output'];
  repayer: Scalars['Bytes']['output'];
  reserve: Scalars['Bytes']['output'];
  stableDebtAfter?: Maybe<Scalars['BigDecimal']['output']>;
  timestamp: Scalars['BigInt']['output'];
  token?: Maybe<Token>;
  tokenPriceUSD?: Maybe<Scalars['BigDecimal']['output']>;
  txHash: Scalars['Bytes']['output'];
  user: Scalars['Bytes']['output'];
  variableDebtAfter?: Maybe<Scalars['BigDecimal']['output']>;
  version?: Maybe<Scalars['String']['output']>;
};

export type AaveLikeRepay_Filter = {
  /** Filter for the block changed event. */
  _change_block?: InputMaybe<BlockChangedFilter>;
  amount?: InputMaybe<Scalars['BigInt']['input']>;
  amount_gt?: InputMaybe<Scalars['BigInt']['input']>;
  amount_gte?: InputMaybe<Scalars['BigInt']['input']>;
  amount_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  amount_lt?: InputMaybe<Scalars['BigInt']['input']>;
  amount_lte?: InputMaybe<Scalars['BigInt']['input']>;
  amount_not?: InputMaybe<Scalars['BigInt']['input']>;
  amount_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  and?: InputMaybe<Array<InputMaybe<AaveLikeRepay_Filter>>>;
  blockNumber?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_gt?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_gte?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  blockNumber_lt?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_lte?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_not?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  debtDelta?: InputMaybe<Scalars['BigDecimal']['input']>;
  debtDelta_gt?: InputMaybe<Scalars['BigDecimal']['input']>;
  debtDelta_gte?: InputMaybe<Scalars['BigDecimal']['input']>;
  debtDelta_in?: InputMaybe<Array<Scalars['BigDecimal']['input']>>;
  debtDelta_lt?: InputMaybe<Scalars['BigDecimal']['input']>;
  debtDelta_lte?: InputMaybe<Scalars['BigDecimal']['input']>;
  debtDelta_not?: InputMaybe<Scalars['BigDecimal']['input']>;
  debtDelta_not_in?: InputMaybe<Array<Scalars['BigDecimal']['input']>>;
  id?: InputMaybe<Scalars['ID']['input']>;
  id_gt?: InputMaybe<Scalars['ID']['input']>;
  id_gte?: InputMaybe<Scalars['ID']['input']>;
  id_in?: InputMaybe<Array<Scalars['ID']['input']>>;
  id_lt?: InputMaybe<Scalars['ID']['input']>;
  id_lte?: InputMaybe<Scalars['ID']['input']>;
  id_not?: InputMaybe<Scalars['ID']['input']>;
  id_not_in?: InputMaybe<Array<Scalars['ID']['input']>>;
  or?: InputMaybe<Array<InputMaybe<AaveLikeRepay_Filter>>>;
  protocol?: InputMaybe<Scalars['String']['input']>;
  protocol_contains?: InputMaybe<Scalars['String']['input']>;
  protocol_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  protocol_ends_with?: InputMaybe<Scalars['String']['input']>;
  protocol_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  protocol_gt?: InputMaybe<Scalars['String']['input']>;
  protocol_gte?: InputMaybe<Scalars['String']['input']>;
  protocol_in?: InputMaybe<Array<Scalars['String']['input']>>;
  protocol_lt?: InputMaybe<Scalars['String']['input']>;
  protocol_lte?: InputMaybe<Scalars['String']['input']>;
  protocol_not?: InputMaybe<Scalars['String']['input']>;
  protocol_not_contains?: InputMaybe<Scalars['String']['input']>;
  protocol_not_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  protocol_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  protocol_not_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  protocol_not_in?: InputMaybe<Array<Scalars['String']['input']>>;
  protocol_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  protocol_not_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  protocol_starts_with?: InputMaybe<Scalars['String']['input']>;
  protocol_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  repayer?: InputMaybe<Scalars['Bytes']['input']>;
  repayer_contains?: InputMaybe<Scalars['Bytes']['input']>;
  repayer_gt?: InputMaybe<Scalars['Bytes']['input']>;
  repayer_gte?: InputMaybe<Scalars['Bytes']['input']>;
  repayer_in?: InputMaybe<Array<Scalars['Bytes']['input']>>;
  repayer_lt?: InputMaybe<Scalars['Bytes']['input']>;
  repayer_lte?: InputMaybe<Scalars['Bytes']['input']>;
  repayer_not?: InputMaybe<Scalars['Bytes']['input']>;
  repayer_not_contains?: InputMaybe<Scalars['Bytes']['input']>;
  repayer_not_in?: InputMaybe<Array<Scalars['Bytes']['input']>>;
  reserve?: InputMaybe<Scalars['Bytes']['input']>;
  reserve_contains?: InputMaybe<Scalars['Bytes']['input']>;
  reserve_gt?: InputMaybe<Scalars['Bytes']['input']>;
  reserve_gte?: InputMaybe<Scalars['Bytes']['input']>;
  reserve_in?: InputMaybe<Array<Scalars['Bytes']['input']>>;
  reserve_lt?: InputMaybe<Scalars['Bytes']['input']>;
  reserve_lte?: InputMaybe<Scalars['Bytes']['input']>;
  reserve_not?: InputMaybe<Scalars['Bytes']['input']>;
  reserve_not_contains?: InputMaybe<Scalars['Bytes']['input']>;
  reserve_not_in?: InputMaybe<Array<Scalars['Bytes']['input']>>;
  stableDebtAfter?: InputMaybe<Scalars['BigDecimal']['input']>;
  stableDebtAfter_gt?: InputMaybe<Scalars['BigDecimal']['input']>;
  stableDebtAfter_gte?: InputMaybe<Scalars['BigDecimal']['input']>;
  stableDebtAfter_in?: InputMaybe<Array<Scalars['BigDecimal']['input']>>;
  stableDebtAfter_lt?: InputMaybe<Scalars['BigDecimal']['input']>;
  stableDebtAfter_lte?: InputMaybe<Scalars['BigDecimal']['input']>;
  stableDebtAfter_not?: InputMaybe<Scalars['BigDecimal']['input']>;
  stableDebtAfter_not_in?: InputMaybe<Array<Scalars['BigDecimal']['input']>>;
  timestamp?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_gt?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_gte?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  timestamp_lt?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_lte?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_not?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  token?: InputMaybe<Scalars['String']['input']>;
  tokenPriceUSD?: InputMaybe<Scalars['BigDecimal']['input']>;
  tokenPriceUSD_gt?: InputMaybe<Scalars['BigDecimal']['input']>;
  tokenPriceUSD_gte?: InputMaybe<Scalars['BigDecimal']['input']>;
  tokenPriceUSD_in?: InputMaybe<Array<Scalars['BigDecimal']['input']>>;
  tokenPriceUSD_lt?: InputMaybe<Scalars['BigDecimal']['input']>;
  tokenPriceUSD_lte?: InputMaybe<Scalars['BigDecimal']['input']>;
  tokenPriceUSD_not?: InputMaybe<Scalars['BigDecimal']['input']>;
  tokenPriceUSD_not_in?: InputMaybe<Array<Scalars['BigDecimal']['input']>>;
  token_?: InputMaybe<Token_Filter>;
  token_contains?: InputMaybe<Scalars['String']['input']>;
  token_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  token_ends_with?: InputMaybe<Scalars['String']['input']>;
  token_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  token_gt?: InputMaybe<Scalars['String']['input']>;
  token_gte?: InputMaybe<Scalars['String']['input']>;
  token_in?: InputMaybe<Array<Scalars['String']['input']>>;
  token_lt?: InputMaybe<Scalars['String']['input']>;
  token_lte?: InputMaybe<Scalars['String']['input']>;
  token_not?: InputMaybe<Scalars['String']['input']>;
  token_not_contains?: InputMaybe<Scalars['String']['input']>;
  token_not_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  token_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  token_not_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  token_not_in?: InputMaybe<Array<Scalars['String']['input']>>;
  token_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  token_not_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  token_starts_with?: InputMaybe<Scalars['String']['input']>;
  token_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  txHash?: InputMaybe<Scalars['Bytes']['input']>;
  txHash_contains?: InputMaybe<Scalars['Bytes']['input']>;
  txHash_gt?: InputMaybe<Scalars['Bytes']['input']>;
  txHash_gte?: InputMaybe<Scalars['Bytes']['input']>;
  txHash_in?: InputMaybe<Array<Scalars['Bytes']['input']>>;
  txHash_lt?: InputMaybe<Scalars['Bytes']['input']>;
  txHash_lte?: InputMaybe<Scalars['Bytes']['input']>;
  txHash_not?: InputMaybe<Scalars['Bytes']['input']>;
  txHash_not_contains?: InputMaybe<Scalars['Bytes']['input']>;
  txHash_not_in?: InputMaybe<Array<Scalars['Bytes']['input']>>;
  user?: InputMaybe<Scalars['Bytes']['input']>;
  user_contains?: InputMaybe<Scalars['Bytes']['input']>;
  user_gt?: InputMaybe<Scalars['Bytes']['input']>;
  user_gte?: InputMaybe<Scalars['Bytes']['input']>;
  user_in?: InputMaybe<Array<Scalars['Bytes']['input']>>;
  user_lt?: InputMaybe<Scalars['Bytes']['input']>;
  user_lte?: InputMaybe<Scalars['Bytes']['input']>;
  user_not?: InputMaybe<Scalars['Bytes']['input']>;
  user_not_contains?: InputMaybe<Scalars['Bytes']['input']>;
  user_not_in?: InputMaybe<Array<Scalars['Bytes']['input']>>;
  variableDebtAfter?: InputMaybe<Scalars['BigDecimal']['input']>;
  variableDebtAfter_gt?: InputMaybe<Scalars['BigDecimal']['input']>;
  variableDebtAfter_gte?: InputMaybe<Scalars['BigDecimal']['input']>;
  variableDebtAfter_in?: InputMaybe<Array<Scalars['BigDecimal']['input']>>;
  variableDebtAfter_lt?: InputMaybe<Scalars['BigDecimal']['input']>;
  variableDebtAfter_lte?: InputMaybe<Scalars['BigDecimal']['input']>;
  variableDebtAfter_not?: InputMaybe<Scalars['BigDecimal']['input']>;
  variableDebtAfter_not_in?: InputMaybe<Array<Scalars['BigDecimal']['input']>>;
  version?: InputMaybe<Scalars['String']['input']>;
  version_contains?: InputMaybe<Scalars['String']['input']>;
  version_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  version_ends_with?: InputMaybe<Scalars['String']['input']>;
  version_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  version_gt?: InputMaybe<Scalars['String']['input']>;
  version_gte?: InputMaybe<Scalars['String']['input']>;
  version_in?: InputMaybe<Array<Scalars['String']['input']>>;
  version_lt?: InputMaybe<Scalars['String']['input']>;
  version_lte?: InputMaybe<Scalars['String']['input']>;
  version_not?: InputMaybe<Scalars['String']['input']>;
  version_not_contains?: InputMaybe<Scalars['String']['input']>;
  version_not_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  version_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  version_not_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  version_not_in?: InputMaybe<Array<Scalars['String']['input']>>;
  version_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  version_not_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  version_starts_with?: InputMaybe<Scalars['String']['input']>;
  version_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
};

export enum AaveLikeRepay_OrderBy {
  Amount = 'amount',
  BlockNumber = 'blockNumber',
  DebtDelta = 'debtDelta',
  Id = 'id',
  Protocol = 'protocol',
  Repayer = 'repayer',
  Reserve = 'reserve',
  StableDebtAfter = 'stableDebtAfter',
  Timestamp = 'timestamp',
  Token = 'token',
  TokenPriceUsd = 'tokenPriceUSD',
  TokenAddress = 'token__address',
  TokenDecimals = 'token__decimals',
  TokenId = 'token__id',
  TokenPrecision = 'token__precision',
  TokenSymbol = 'token__symbol',
  TxHash = 'txHash',
  User = 'user',
  VariableDebtAfter = 'variableDebtAfter',
  Version = 'version'
}

export type AaveLikeWithdraw = {
  __typename?: 'AaveLikeWithdraw';
  amount: Scalars['BigInt']['output'];
  blockNumber: Scalars['BigInt']['output'];
  collateralAfter?: Maybe<Scalars['BigDecimal']['output']>;
  collateralDelta?: Maybe<Scalars['BigDecimal']['output']>;
  id: Scalars['ID']['output'];
  protocol: Scalars['String']['output'];
  reserve: Scalars['Bytes']['output'];
  timestamp: Scalars['BigInt']['output'];
  to: Scalars['Bytes']['output'];
  token?: Maybe<Token>;
  tokenPriceUSD?: Maybe<Scalars['BigDecimal']['output']>;
  txHash: Scalars['Bytes']['output'];
  user: Scalars['Bytes']['output'];
  version?: Maybe<Scalars['String']['output']>;
};

export type AaveLikeWithdraw_Filter = {
  /** Filter for the block changed event. */
  _change_block?: InputMaybe<BlockChangedFilter>;
  amount?: InputMaybe<Scalars['BigInt']['input']>;
  amount_gt?: InputMaybe<Scalars['BigInt']['input']>;
  amount_gte?: InputMaybe<Scalars['BigInt']['input']>;
  amount_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  amount_lt?: InputMaybe<Scalars['BigInt']['input']>;
  amount_lte?: InputMaybe<Scalars['BigInt']['input']>;
  amount_not?: InputMaybe<Scalars['BigInt']['input']>;
  amount_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  and?: InputMaybe<Array<InputMaybe<AaveLikeWithdraw_Filter>>>;
  blockNumber?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_gt?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_gte?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  blockNumber_lt?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_lte?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_not?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  collateralAfter?: InputMaybe<Scalars['BigDecimal']['input']>;
  collateralAfter_gt?: InputMaybe<Scalars['BigDecimal']['input']>;
  collateralAfter_gte?: InputMaybe<Scalars['BigDecimal']['input']>;
  collateralAfter_in?: InputMaybe<Array<Scalars['BigDecimal']['input']>>;
  collateralAfter_lt?: InputMaybe<Scalars['BigDecimal']['input']>;
  collateralAfter_lte?: InputMaybe<Scalars['BigDecimal']['input']>;
  collateralAfter_not?: InputMaybe<Scalars['BigDecimal']['input']>;
  collateralAfter_not_in?: InputMaybe<Array<Scalars['BigDecimal']['input']>>;
  collateralDelta?: InputMaybe<Scalars['BigDecimal']['input']>;
  collateralDelta_gt?: InputMaybe<Scalars['BigDecimal']['input']>;
  collateralDelta_gte?: InputMaybe<Scalars['BigDecimal']['input']>;
  collateralDelta_in?: InputMaybe<Array<Scalars['BigDecimal']['input']>>;
  collateralDelta_lt?: InputMaybe<Scalars['BigDecimal']['input']>;
  collateralDelta_lte?: InputMaybe<Scalars['BigDecimal']['input']>;
  collateralDelta_not?: InputMaybe<Scalars['BigDecimal']['input']>;
  collateralDelta_not_in?: InputMaybe<Array<Scalars['BigDecimal']['input']>>;
  id?: InputMaybe<Scalars['ID']['input']>;
  id_gt?: InputMaybe<Scalars['ID']['input']>;
  id_gte?: InputMaybe<Scalars['ID']['input']>;
  id_in?: InputMaybe<Array<Scalars['ID']['input']>>;
  id_lt?: InputMaybe<Scalars['ID']['input']>;
  id_lte?: InputMaybe<Scalars['ID']['input']>;
  id_not?: InputMaybe<Scalars['ID']['input']>;
  id_not_in?: InputMaybe<Array<Scalars['ID']['input']>>;
  or?: InputMaybe<Array<InputMaybe<AaveLikeWithdraw_Filter>>>;
  protocol?: InputMaybe<Scalars['String']['input']>;
  protocol_contains?: InputMaybe<Scalars['String']['input']>;
  protocol_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  protocol_ends_with?: InputMaybe<Scalars['String']['input']>;
  protocol_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  protocol_gt?: InputMaybe<Scalars['String']['input']>;
  protocol_gte?: InputMaybe<Scalars['String']['input']>;
  protocol_in?: InputMaybe<Array<Scalars['String']['input']>>;
  protocol_lt?: InputMaybe<Scalars['String']['input']>;
  protocol_lte?: InputMaybe<Scalars['String']['input']>;
  protocol_not?: InputMaybe<Scalars['String']['input']>;
  protocol_not_contains?: InputMaybe<Scalars['String']['input']>;
  protocol_not_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  protocol_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  protocol_not_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  protocol_not_in?: InputMaybe<Array<Scalars['String']['input']>>;
  protocol_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  protocol_not_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  protocol_starts_with?: InputMaybe<Scalars['String']['input']>;
  protocol_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  reserve?: InputMaybe<Scalars['Bytes']['input']>;
  reserve_contains?: InputMaybe<Scalars['Bytes']['input']>;
  reserve_gt?: InputMaybe<Scalars['Bytes']['input']>;
  reserve_gte?: InputMaybe<Scalars['Bytes']['input']>;
  reserve_in?: InputMaybe<Array<Scalars['Bytes']['input']>>;
  reserve_lt?: InputMaybe<Scalars['Bytes']['input']>;
  reserve_lte?: InputMaybe<Scalars['Bytes']['input']>;
  reserve_not?: InputMaybe<Scalars['Bytes']['input']>;
  reserve_not_contains?: InputMaybe<Scalars['Bytes']['input']>;
  reserve_not_in?: InputMaybe<Array<Scalars['Bytes']['input']>>;
  timestamp?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_gt?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_gte?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  timestamp_lt?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_lte?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_not?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  to?: InputMaybe<Scalars['Bytes']['input']>;
  to_contains?: InputMaybe<Scalars['Bytes']['input']>;
  to_gt?: InputMaybe<Scalars['Bytes']['input']>;
  to_gte?: InputMaybe<Scalars['Bytes']['input']>;
  to_in?: InputMaybe<Array<Scalars['Bytes']['input']>>;
  to_lt?: InputMaybe<Scalars['Bytes']['input']>;
  to_lte?: InputMaybe<Scalars['Bytes']['input']>;
  to_not?: InputMaybe<Scalars['Bytes']['input']>;
  to_not_contains?: InputMaybe<Scalars['Bytes']['input']>;
  to_not_in?: InputMaybe<Array<Scalars['Bytes']['input']>>;
  token?: InputMaybe<Scalars['String']['input']>;
  tokenPriceUSD?: InputMaybe<Scalars['BigDecimal']['input']>;
  tokenPriceUSD_gt?: InputMaybe<Scalars['BigDecimal']['input']>;
  tokenPriceUSD_gte?: InputMaybe<Scalars['BigDecimal']['input']>;
  tokenPriceUSD_in?: InputMaybe<Array<Scalars['BigDecimal']['input']>>;
  tokenPriceUSD_lt?: InputMaybe<Scalars['BigDecimal']['input']>;
  tokenPriceUSD_lte?: InputMaybe<Scalars['BigDecimal']['input']>;
  tokenPriceUSD_not?: InputMaybe<Scalars['BigDecimal']['input']>;
  tokenPriceUSD_not_in?: InputMaybe<Array<Scalars['BigDecimal']['input']>>;
  token_?: InputMaybe<Token_Filter>;
  token_contains?: InputMaybe<Scalars['String']['input']>;
  token_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  token_ends_with?: InputMaybe<Scalars['String']['input']>;
  token_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  token_gt?: InputMaybe<Scalars['String']['input']>;
  token_gte?: InputMaybe<Scalars['String']['input']>;
  token_in?: InputMaybe<Array<Scalars['String']['input']>>;
  token_lt?: InputMaybe<Scalars['String']['input']>;
  token_lte?: InputMaybe<Scalars['String']['input']>;
  token_not?: InputMaybe<Scalars['String']['input']>;
  token_not_contains?: InputMaybe<Scalars['String']['input']>;
  token_not_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  token_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  token_not_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  token_not_in?: InputMaybe<Array<Scalars['String']['input']>>;
  token_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  token_not_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  token_starts_with?: InputMaybe<Scalars['String']['input']>;
  token_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  txHash?: InputMaybe<Scalars['Bytes']['input']>;
  txHash_contains?: InputMaybe<Scalars['Bytes']['input']>;
  txHash_gt?: InputMaybe<Scalars['Bytes']['input']>;
  txHash_gte?: InputMaybe<Scalars['Bytes']['input']>;
  txHash_in?: InputMaybe<Array<Scalars['Bytes']['input']>>;
  txHash_lt?: InputMaybe<Scalars['Bytes']['input']>;
  txHash_lte?: InputMaybe<Scalars['Bytes']['input']>;
  txHash_not?: InputMaybe<Scalars['Bytes']['input']>;
  txHash_not_contains?: InputMaybe<Scalars['Bytes']['input']>;
  txHash_not_in?: InputMaybe<Array<Scalars['Bytes']['input']>>;
  user?: InputMaybe<Scalars['Bytes']['input']>;
  user_contains?: InputMaybe<Scalars['Bytes']['input']>;
  user_gt?: InputMaybe<Scalars['Bytes']['input']>;
  user_gte?: InputMaybe<Scalars['Bytes']['input']>;
  user_in?: InputMaybe<Array<Scalars['Bytes']['input']>>;
  user_lt?: InputMaybe<Scalars['Bytes']['input']>;
  user_lte?: InputMaybe<Scalars['Bytes']['input']>;
  user_not?: InputMaybe<Scalars['Bytes']['input']>;
  user_not_contains?: InputMaybe<Scalars['Bytes']['input']>;
  user_not_in?: InputMaybe<Array<Scalars['Bytes']['input']>>;
  version?: InputMaybe<Scalars['String']['input']>;
  version_contains?: InputMaybe<Scalars['String']['input']>;
  version_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  version_ends_with?: InputMaybe<Scalars['String']['input']>;
  version_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  version_gt?: InputMaybe<Scalars['String']['input']>;
  version_gte?: InputMaybe<Scalars['String']['input']>;
  version_in?: InputMaybe<Array<Scalars['String']['input']>>;
  version_lt?: InputMaybe<Scalars['String']['input']>;
  version_lte?: InputMaybe<Scalars['String']['input']>;
  version_not?: InputMaybe<Scalars['String']['input']>;
  version_not_contains?: InputMaybe<Scalars['String']['input']>;
  version_not_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  version_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  version_not_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  version_not_in?: InputMaybe<Array<Scalars['String']['input']>>;
  version_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  version_not_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  version_starts_with?: InputMaybe<Scalars['String']['input']>;
  version_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
};

export enum AaveLikeWithdraw_OrderBy {
  Amount = 'amount',
  BlockNumber = 'blockNumber',
  CollateralAfter = 'collateralAfter',
  CollateralDelta = 'collateralDelta',
  Id = 'id',
  Protocol = 'protocol',
  Reserve = 'reserve',
  Timestamp = 'timestamp',
  To = 'to',
  Token = 'token',
  TokenPriceUsd = 'tokenPriceUSD',
  TokenAddress = 'token__address',
  TokenDecimals = 'token__decimals',
  TokenId = 'token__id',
  TokenPrecision = 'token__precision',
  TokenSymbol = 'token__symbol',
  TxHash = 'txHash',
  User = 'user',
  Version = 'version'
}

export enum Aggregation_Interval {
  Day = 'day',
  Hour = 'hour'
}

export type AssetSwap = {
  __typename?: 'AssetSwap';
  amountIn: Scalars['BigInt']['output'];
  amountOut: Scalars['BigInt']['output'];
  assetIn: Scalars['Bytes']['output'];
  assetOut: Scalars['Bytes']['output'];
  /**
   * id is a tx_hash-actionLogIndex
   * it uses action log index to easily combine all swap events into one
   *
   */
  id: Scalars['ID']['output'];
  proxy?: Maybe<Scalars['Bytes']['output']>;
};

export type AssetSwap_Filter = {
  /** Filter for the block changed event. */
  _change_block?: InputMaybe<BlockChangedFilter>;
  amountIn?: InputMaybe<Scalars['BigInt']['input']>;
  amountIn_gt?: InputMaybe<Scalars['BigInt']['input']>;
  amountIn_gte?: InputMaybe<Scalars['BigInt']['input']>;
  amountIn_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  amountIn_lt?: InputMaybe<Scalars['BigInt']['input']>;
  amountIn_lte?: InputMaybe<Scalars['BigInt']['input']>;
  amountIn_not?: InputMaybe<Scalars['BigInt']['input']>;
  amountIn_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  amountOut?: InputMaybe<Scalars['BigInt']['input']>;
  amountOut_gt?: InputMaybe<Scalars['BigInt']['input']>;
  amountOut_gte?: InputMaybe<Scalars['BigInt']['input']>;
  amountOut_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  amountOut_lt?: InputMaybe<Scalars['BigInt']['input']>;
  amountOut_lte?: InputMaybe<Scalars['BigInt']['input']>;
  amountOut_not?: InputMaybe<Scalars['BigInt']['input']>;
  amountOut_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  and?: InputMaybe<Array<InputMaybe<AssetSwap_Filter>>>;
  assetIn?: InputMaybe<Scalars['Bytes']['input']>;
  assetIn_contains?: InputMaybe<Scalars['Bytes']['input']>;
  assetIn_gt?: InputMaybe<Scalars['Bytes']['input']>;
  assetIn_gte?: InputMaybe<Scalars['Bytes']['input']>;
  assetIn_in?: InputMaybe<Array<Scalars['Bytes']['input']>>;
  assetIn_lt?: InputMaybe<Scalars['Bytes']['input']>;
  assetIn_lte?: InputMaybe<Scalars['Bytes']['input']>;
  assetIn_not?: InputMaybe<Scalars['Bytes']['input']>;
  assetIn_not_contains?: InputMaybe<Scalars['Bytes']['input']>;
  assetIn_not_in?: InputMaybe<Array<Scalars['Bytes']['input']>>;
  assetOut?: InputMaybe<Scalars['Bytes']['input']>;
  assetOut_contains?: InputMaybe<Scalars['Bytes']['input']>;
  assetOut_gt?: InputMaybe<Scalars['Bytes']['input']>;
  assetOut_gte?: InputMaybe<Scalars['Bytes']['input']>;
  assetOut_in?: InputMaybe<Array<Scalars['Bytes']['input']>>;
  assetOut_lt?: InputMaybe<Scalars['Bytes']['input']>;
  assetOut_lte?: InputMaybe<Scalars['Bytes']['input']>;
  assetOut_not?: InputMaybe<Scalars['Bytes']['input']>;
  assetOut_not_contains?: InputMaybe<Scalars['Bytes']['input']>;
  assetOut_not_in?: InputMaybe<Array<Scalars['Bytes']['input']>>;
  id?: InputMaybe<Scalars['ID']['input']>;
  id_gt?: InputMaybe<Scalars['ID']['input']>;
  id_gte?: InputMaybe<Scalars['ID']['input']>;
  id_in?: InputMaybe<Array<Scalars['ID']['input']>>;
  id_lt?: InputMaybe<Scalars['ID']['input']>;
  id_lte?: InputMaybe<Scalars['ID']['input']>;
  id_not?: InputMaybe<Scalars['ID']['input']>;
  id_not_in?: InputMaybe<Array<Scalars['ID']['input']>>;
  or?: InputMaybe<Array<InputMaybe<AssetSwap_Filter>>>;
  proxy?: InputMaybe<Scalars['Bytes']['input']>;
  proxy_contains?: InputMaybe<Scalars['Bytes']['input']>;
  proxy_gt?: InputMaybe<Scalars['Bytes']['input']>;
  proxy_gte?: InputMaybe<Scalars['Bytes']['input']>;
  proxy_in?: InputMaybe<Array<Scalars['Bytes']['input']>>;
  proxy_lt?: InputMaybe<Scalars['Bytes']['input']>;
  proxy_lte?: InputMaybe<Scalars['Bytes']['input']>;
  proxy_not?: InputMaybe<Scalars['Bytes']['input']>;
  proxy_not_contains?: InputMaybe<Scalars['Bytes']['input']>;
  proxy_not_in?: InputMaybe<Array<Scalars['Bytes']['input']>>;
};

export enum AssetSwap_OrderBy {
  AmountIn = 'amountIn',
  AmountOut = 'amountOut',
  AssetIn = 'assetIn',
  AssetOut = 'assetOut',
  Id = 'id',
  Proxy = 'proxy'
}

export type BlockChangedFilter = {
  number_gte: Scalars['Int']['input'];
};

export type Block_Height = {
  hash?: InputMaybe<Scalars['Bytes']['input']>;
  number?: InputMaybe<Scalars['Int']['input']>;
  number_gte?: InputMaybe<Scalars['Int']['input']>;
};

export type FeePaid = {
  __typename?: 'FeePaid';
  amount: Scalars['BigInt']['output'];
  beneficiary: Scalars['Bytes']['output'];
  /**
   * id is a tx_hash-actionLogIndex
   * it uses action log index to easily combine all swap events into one
   *
   */
  id: Scalars['ID']['output'];
  token: Scalars['Bytes']['output'];
};

export type FeePaid_Filter = {
  /** Filter for the block changed event. */
  _change_block?: InputMaybe<BlockChangedFilter>;
  amount?: InputMaybe<Scalars['BigInt']['input']>;
  amount_gt?: InputMaybe<Scalars['BigInt']['input']>;
  amount_gte?: InputMaybe<Scalars['BigInt']['input']>;
  amount_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  amount_lt?: InputMaybe<Scalars['BigInt']['input']>;
  amount_lte?: InputMaybe<Scalars['BigInt']['input']>;
  amount_not?: InputMaybe<Scalars['BigInt']['input']>;
  amount_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  and?: InputMaybe<Array<InputMaybe<FeePaid_Filter>>>;
  beneficiary?: InputMaybe<Scalars['Bytes']['input']>;
  beneficiary_contains?: InputMaybe<Scalars['Bytes']['input']>;
  beneficiary_gt?: InputMaybe<Scalars['Bytes']['input']>;
  beneficiary_gte?: InputMaybe<Scalars['Bytes']['input']>;
  beneficiary_in?: InputMaybe<Array<Scalars['Bytes']['input']>>;
  beneficiary_lt?: InputMaybe<Scalars['Bytes']['input']>;
  beneficiary_lte?: InputMaybe<Scalars['Bytes']['input']>;
  beneficiary_not?: InputMaybe<Scalars['Bytes']['input']>;
  beneficiary_not_contains?: InputMaybe<Scalars['Bytes']['input']>;
  beneficiary_not_in?: InputMaybe<Array<Scalars['Bytes']['input']>>;
  id?: InputMaybe<Scalars['ID']['input']>;
  id_gt?: InputMaybe<Scalars['ID']['input']>;
  id_gte?: InputMaybe<Scalars['ID']['input']>;
  id_in?: InputMaybe<Array<Scalars['ID']['input']>>;
  id_lt?: InputMaybe<Scalars['ID']['input']>;
  id_lte?: InputMaybe<Scalars['ID']['input']>;
  id_not?: InputMaybe<Scalars['ID']['input']>;
  id_not_in?: InputMaybe<Array<Scalars['ID']['input']>>;
  or?: InputMaybe<Array<InputMaybe<FeePaid_Filter>>>;
  token?: InputMaybe<Scalars['Bytes']['input']>;
  token_contains?: InputMaybe<Scalars['Bytes']['input']>;
  token_gt?: InputMaybe<Scalars['Bytes']['input']>;
  token_gte?: InputMaybe<Scalars['Bytes']['input']>;
  token_in?: InputMaybe<Array<Scalars['Bytes']['input']>>;
  token_lt?: InputMaybe<Scalars['Bytes']['input']>;
  token_lte?: InputMaybe<Scalars['Bytes']['input']>;
  token_not?: InputMaybe<Scalars['Bytes']['input']>;
  token_not_contains?: InputMaybe<Scalars['Bytes']['input']>;
  token_not_in?: InputMaybe<Array<Scalars['Bytes']['input']>>;
};

export enum FeePaid_OrderBy {
  Amount = 'amount',
  Beneficiary = 'beneficiary',
  Id = 'id',
  Token = 'token'
}

export type InterestRate = {
  __typename?: 'InterestRate';
  blockNumber: Scalars['BigInt']['output'];
  id: Scalars['Bytes']['output'];
  protocol: Scalars['String']['output'];
  rate: Scalars['BigDecimal']['output'];
  timestamp: Scalars['BigInt']['output'];
  token: Token;
  type: Scalars['String']['output'];
};

export type InterestRateConfig = {
  __typename?: 'InterestRateConfig';
  id: Scalars['ID']['output'];
  lastUpdateTimestamp: Scalars['BigInt']['output'];
};

export type InterestRateConfig_Filter = {
  /** Filter for the block changed event. */
  _change_block?: InputMaybe<BlockChangedFilter>;
  and?: InputMaybe<Array<InputMaybe<InterestRateConfig_Filter>>>;
  id?: InputMaybe<Scalars['ID']['input']>;
  id_gt?: InputMaybe<Scalars['ID']['input']>;
  id_gte?: InputMaybe<Scalars['ID']['input']>;
  id_in?: InputMaybe<Array<Scalars['ID']['input']>>;
  id_lt?: InputMaybe<Scalars['ID']['input']>;
  id_lte?: InputMaybe<Scalars['ID']['input']>;
  id_not?: InputMaybe<Scalars['ID']['input']>;
  id_not_in?: InputMaybe<Array<Scalars['ID']['input']>>;
  lastUpdateTimestamp?: InputMaybe<Scalars['BigInt']['input']>;
  lastUpdateTimestamp_gt?: InputMaybe<Scalars['BigInt']['input']>;
  lastUpdateTimestamp_gte?: InputMaybe<Scalars['BigInt']['input']>;
  lastUpdateTimestamp_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  lastUpdateTimestamp_lt?: InputMaybe<Scalars['BigInt']['input']>;
  lastUpdateTimestamp_lte?: InputMaybe<Scalars['BigInt']['input']>;
  lastUpdateTimestamp_not?: InputMaybe<Scalars['BigInt']['input']>;
  lastUpdateTimestamp_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  or?: InputMaybe<Array<InputMaybe<InterestRateConfig_Filter>>>;
};

export enum InterestRateConfig_OrderBy {
  Id = 'id',
  LastUpdateTimestamp = 'lastUpdateTimestamp'
}

export type InterestRate_Filter = {
  /** Filter for the block changed event. */
  _change_block?: InputMaybe<BlockChangedFilter>;
  and?: InputMaybe<Array<InputMaybe<InterestRate_Filter>>>;
  blockNumber?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_gt?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_gte?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  blockNumber_lt?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_lte?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_not?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  id?: InputMaybe<Scalars['Bytes']['input']>;
  id_contains?: InputMaybe<Scalars['Bytes']['input']>;
  id_gt?: InputMaybe<Scalars['Bytes']['input']>;
  id_gte?: InputMaybe<Scalars['Bytes']['input']>;
  id_in?: InputMaybe<Array<Scalars['Bytes']['input']>>;
  id_lt?: InputMaybe<Scalars['Bytes']['input']>;
  id_lte?: InputMaybe<Scalars['Bytes']['input']>;
  id_not?: InputMaybe<Scalars['Bytes']['input']>;
  id_not_contains?: InputMaybe<Scalars['Bytes']['input']>;
  id_not_in?: InputMaybe<Array<Scalars['Bytes']['input']>>;
  or?: InputMaybe<Array<InputMaybe<InterestRate_Filter>>>;
  protocol?: InputMaybe<Scalars['String']['input']>;
  protocol_contains?: InputMaybe<Scalars['String']['input']>;
  protocol_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  protocol_ends_with?: InputMaybe<Scalars['String']['input']>;
  protocol_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  protocol_gt?: InputMaybe<Scalars['String']['input']>;
  protocol_gte?: InputMaybe<Scalars['String']['input']>;
  protocol_in?: InputMaybe<Array<Scalars['String']['input']>>;
  protocol_lt?: InputMaybe<Scalars['String']['input']>;
  protocol_lte?: InputMaybe<Scalars['String']['input']>;
  protocol_not?: InputMaybe<Scalars['String']['input']>;
  protocol_not_contains?: InputMaybe<Scalars['String']['input']>;
  protocol_not_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  protocol_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  protocol_not_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  protocol_not_in?: InputMaybe<Array<Scalars['String']['input']>>;
  protocol_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  protocol_not_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  protocol_starts_with?: InputMaybe<Scalars['String']['input']>;
  protocol_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  rate?: InputMaybe<Scalars['BigDecimal']['input']>;
  rate_gt?: InputMaybe<Scalars['BigDecimal']['input']>;
  rate_gte?: InputMaybe<Scalars['BigDecimal']['input']>;
  rate_in?: InputMaybe<Array<Scalars['BigDecimal']['input']>>;
  rate_lt?: InputMaybe<Scalars['BigDecimal']['input']>;
  rate_lte?: InputMaybe<Scalars['BigDecimal']['input']>;
  rate_not?: InputMaybe<Scalars['BigDecimal']['input']>;
  rate_not_in?: InputMaybe<Array<Scalars['BigDecimal']['input']>>;
  timestamp?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_gt?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_gte?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  timestamp_lt?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_lte?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_not?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  token?: InputMaybe<Scalars['String']['input']>;
  token_?: InputMaybe<Token_Filter>;
  token_contains?: InputMaybe<Scalars['String']['input']>;
  token_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  token_ends_with?: InputMaybe<Scalars['String']['input']>;
  token_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  token_gt?: InputMaybe<Scalars['String']['input']>;
  token_gte?: InputMaybe<Scalars['String']['input']>;
  token_in?: InputMaybe<Array<Scalars['String']['input']>>;
  token_lt?: InputMaybe<Scalars['String']['input']>;
  token_lte?: InputMaybe<Scalars['String']['input']>;
  token_not?: InputMaybe<Scalars['String']['input']>;
  token_not_contains?: InputMaybe<Scalars['String']['input']>;
  token_not_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  token_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  token_not_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  token_not_in?: InputMaybe<Array<Scalars['String']['input']>>;
  token_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  token_not_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  token_starts_with?: InputMaybe<Scalars['String']['input']>;
  token_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  type?: InputMaybe<Scalars['String']['input']>;
  type_contains?: InputMaybe<Scalars['String']['input']>;
  type_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  type_ends_with?: InputMaybe<Scalars['String']['input']>;
  type_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  type_gt?: InputMaybe<Scalars['String']['input']>;
  type_gte?: InputMaybe<Scalars['String']['input']>;
  type_in?: InputMaybe<Array<Scalars['String']['input']>>;
  type_lt?: InputMaybe<Scalars['String']['input']>;
  type_lte?: InputMaybe<Scalars['String']['input']>;
  type_not?: InputMaybe<Scalars['String']['input']>;
  type_not_contains?: InputMaybe<Scalars['String']['input']>;
  type_not_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  type_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  type_not_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  type_not_in?: InputMaybe<Array<Scalars['String']['input']>>;
  type_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  type_not_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  type_starts_with?: InputMaybe<Scalars['String']['input']>;
  type_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
};

export enum InterestRate_OrderBy {
  BlockNumber = 'blockNumber',
  Id = 'id',
  Protocol = 'protocol',
  Rate = 'rate',
  Timestamp = 'timestamp',
  Token = 'token',
  TokenAddress = 'token__address',
  TokenDecimals = 'token__decimals',
  TokenId = 'token__id',
  TokenPrecision = 'token__precision',
  TokenSymbol = 'token__symbol',
  Type = 'type'
}

/** Defines the order direction, either ascending or descending */
export enum OrderDirection {
  Asc = 'asc',
  Desc = 'desc'
}

export type Position = {
  __typename?: 'Position';
  account: Scalars['Bytes']['output'];
  collateral: Scalars['BigDecimal']['output'];
  collateralAddress: Scalars['Bytes']['output'];
  cumulativeDeposit?: Maybe<Scalars['BigDecimal']['output']>;
  cumulativeDepositInCollateralToken?: Maybe<Scalars['BigDecimal']['output']>;
  cumulativeDepositInQuoteToken?: Maybe<Scalars['BigDecimal']['output']>;
  cumulativeDepositUSD?: Maybe<Scalars['BigDecimal']['output']>;
  cumulativeFees?: Maybe<Scalars['BigDecimal']['output']>;
  cumulativeFeesInCollateralToken?: Maybe<Scalars['BigDecimal']['output']>;
  cumulativeFeesInQuoteToken?: Maybe<Scalars['BigDecimal']['output']>;
  cumulativeFeesUSD?: Maybe<Scalars['BigDecimal']['output']>;
  cumulativeWithdraw?: Maybe<Scalars['BigDecimal']['output']>;
  cumulativeWithdrawInCollateralToken?: Maybe<Scalars['BigDecimal']['output']>;
  cumulativeWithdrawInQuoteToken?: Maybe<Scalars['BigDecimal']['output']>;
  cumulativeWithdrawUSD?: Maybe<Scalars['BigDecimal']['output']>;
  debt: Scalars['BigDecimal']['output'];
  debtAddress: Scalars['Bytes']['output'];
  events: Array<PositionEvent>;
  fromEvent: Scalars['Boolean']['output'];
  id: Scalars['ID']['output'];
  lastEvent?: Maybe<PositionEvent>;
  protocol: Scalars['String']['output'];
  proxy: Proxy;
  type: Scalars['String']['output'];
};


export type PositionEventsArgs = {
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<PositionEvent_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  where?: InputMaybe<PositionEvent_Filter>;
};

export type PositionEvent = {
  __typename?: 'PositionEvent';
  account: Scalars['Bytes']['output'];
  blockNumber: Scalars['BigInt']['output'];
  collateralAddress: Scalars['Bytes']['output'];
  collateralAfter: Scalars['BigDecimal']['output'];
  collateralBefore: Scalars['BigDecimal']['output'];
  collateralDelta: Scalars['BigDecimal']['output'];
  collateralOraclePrice: Scalars['BigDecimal']['output'];
  collateralToken?: Maybe<Token>;
  collateralTokenPriceUSD: Scalars['BigDecimal']['output'];
  debtAddress: Scalars['Bytes']['output'];
  debtAfter: Scalars['BigDecimal']['output'];
  debtBefore: Scalars['BigDecimal']['output'];
  debtDelta: Scalars['BigDecimal']['output'];
  debtOraclePrice: Scalars['BigDecimal']['output'];
  debtToken?: Maybe<Token>;
  debtTokenPriceUSD: Scalars['BigDecimal']['output'];
  depositTransfers: Array<Transfer>;
  depositedUSD?: Maybe<Scalars['BigDecimal']['output']>;
  ethPrice: Scalars['BigDecimal']['output'];
  gasFeeUSD: Scalars['BigDecimal']['output'];
  gasPrice: Scalars['BigInt']['output'];
  gasUsed: Scalars['BigInt']['output'];
  healthFactorAfter: Scalars['BigDecimal']['output'];
  id: Scalars['ID']['output'];
  isAutomation?: Maybe<Scalars['Boolean']['output']>;
  kind: Scalars['String']['output'];
  liquidationPriceAfter?: Maybe<Scalars['BigDecimal']['output']>;
  liquidationPriceBefore?: Maybe<Scalars['BigDecimal']['output']>;
  liquidationThreshold: Scalars['BigDecimal']['output'];
  ltvAfter: Scalars['BigDecimal']['output'];
  ltvBefore?: Maybe<Scalars['BigDecimal']['output']>;
  marketPrice?: Maybe<Scalars['BigDecimal']['output']>;
  multipleAfter?: Maybe<Scalars['BigDecimal']['output']>;
  multipleBefore?: Maybe<Scalars['BigDecimal']['output']>;
  netValueAfter?: Maybe<Scalars['BigDecimal']['output']>;
  netValueBefore?: Maybe<Scalars['BigDecimal']['output']>;
  oasisFee: Scalars['BigDecimal']['output'];
  /**
   * Depricated fields prefixed with oasis
   *
   */
  oasisFeeToken?: Maybe<Scalars['Bytes']['output']>;
  oasisFeeUSD: Scalars['BigDecimal']['output'];
  position?: Maybe<Position>;
  proxy: Proxy;
  summerFee: Scalars['BigDecimal']['output'];
  summerFeeToken?: Maybe<Scalars['Bytes']['output']>;
  summerFeeUSD: Scalars['BigDecimal']['output'];
  swapFromAmount?: Maybe<Scalars['BigDecimal']['output']>;
  /**
   * First iteration assumes just one
   * swap in an operation
   *
   */
  swapFromToken?: Maybe<Scalars['Bytes']['output']>;
  swapToAmount?: Maybe<Scalars['BigDecimal']['output']>;
  swapToToken?: Maybe<Scalars['Bytes']['output']>;
  timestamp: Scalars['BigInt']['output'];
  totalFee: Scalars['BigDecimal']['output'];
  trigger?: Maybe<Trigger>;
  txHash: Scalars['Bytes']['output'];
  withdrawTransfers: Array<Transfer>;
  withdrawnUSD?: Maybe<Scalars['BigDecimal']['output']>;
};


export type PositionEventDepositTransfersArgs = {
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Transfer_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  where?: InputMaybe<Transfer_Filter>;
};


export type PositionEventWithdrawTransfersArgs = {
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Transfer_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  where?: InputMaybe<Transfer_Filter>;
};

export type PositionEvent_Filter = {
  /** Filter for the block changed event. */
  _change_block?: InputMaybe<BlockChangedFilter>;
  account?: InputMaybe<Scalars['Bytes']['input']>;
  account_contains?: InputMaybe<Scalars['Bytes']['input']>;
  account_gt?: InputMaybe<Scalars['Bytes']['input']>;
  account_gte?: InputMaybe<Scalars['Bytes']['input']>;
  account_in?: InputMaybe<Array<Scalars['Bytes']['input']>>;
  account_lt?: InputMaybe<Scalars['Bytes']['input']>;
  account_lte?: InputMaybe<Scalars['Bytes']['input']>;
  account_not?: InputMaybe<Scalars['Bytes']['input']>;
  account_not_contains?: InputMaybe<Scalars['Bytes']['input']>;
  account_not_in?: InputMaybe<Array<Scalars['Bytes']['input']>>;
  and?: InputMaybe<Array<InputMaybe<PositionEvent_Filter>>>;
  blockNumber?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_gt?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_gte?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  blockNumber_lt?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_lte?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_not?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  collateralAddress?: InputMaybe<Scalars['Bytes']['input']>;
  collateralAddress_contains?: InputMaybe<Scalars['Bytes']['input']>;
  collateralAddress_gt?: InputMaybe<Scalars['Bytes']['input']>;
  collateralAddress_gte?: InputMaybe<Scalars['Bytes']['input']>;
  collateralAddress_in?: InputMaybe<Array<Scalars['Bytes']['input']>>;
  collateralAddress_lt?: InputMaybe<Scalars['Bytes']['input']>;
  collateralAddress_lte?: InputMaybe<Scalars['Bytes']['input']>;
  collateralAddress_not?: InputMaybe<Scalars['Bytes']['input']>;
  collateralAddress_not_contains?: InputMaybe<Scalars['Bytes']['input']>;
  collateralAddress_not_in?: InputMaybe<Array<Scalars['Bytes']['input']>>;
  collateralAfter?: InputMaybe<Scalars['BigDecimal']['input']>;
  collateralAfter_gt?: InputMaybe<Scalars['BigDecimal']['input']>;
  collateralAfter_gte?: InputMaybe<Scalars['BigDecimal']['input']>;
  collateralAfter_in?: InputMaybe<Array<Scalars['BigDecimal']['input']>>;
  collateralAfter_lt?: InputMaybe<Scalars['BigDecimal']['input']>;
  collateralAfter_lte?: InputMaybe<Scalars['BigDecimal']['input']>;
  collateralAfter_not?: InputMaybe<Scalars['BigDecimal']['input']>;
  collateralAfter_not_in?: InputMaybe<Array<Scalars['BigDecimal']['input']>>;
  collateralBefore?: InputMaybe<Scalars['BigDecimal']['input']>;
  collateralBefore_gt?: InputMaybe<Scalars['BigDecimal']['input']>;
  collateralBefore_gte?: InputMaybe<Scalars['BigDecimal']['input']>;
  collateralBefore_in?: InputMaybe<Array<Scalars['BigDecimal']['input']>>;
  collateralBefore_lt?: InputMaybe<Scalars['BigDecimal']['input']>;
  collateralBefore_lte?: InputMaybe<Scalars['BigDecimal']['input']>;
  collateralBefore_not?: InputMaybe<Scalars['BigDecimal']['input']>;
  collateralBefore_not_in?: InputMaybe<Array<Scalars['BigDecimal']['input']>>;
  collateralDelta?: InputMaybe<Scalars['BigDecimal']['input']>;
  collateralDelta_gt?: InputMaybe<Scalars['BigDecimal']['input']>;
  collateralDelta_gte?: InputMaybe<Scalars['BigDecimal']['input']>;
  collateralDelta_in?: InputMaybe<Array<Scalars['BigDecimal']['input']>>;
  collateralDelta_lt?: InputMaybe<Scalars['BigDecimal']['input']>;
  collateralDelta_lte?: InputMaybe<Scalars['BigDecimal']['input']>;
  collateralDelta_not?: InputMaybe<Scalars['BigDecimal']['input']>;
  collateralDelta_not_in?: InputMaybe<Array<Scalars['BigDecimal']['input']>>;
  collateralOraclePrice?: InputMaybe<Scalars['BigDecimal']['input']>;
  collateralOraclePrice_gt?: InputMaybe<Scalars['BigDecimal']['input']>;
  collateralOraclePrice_gte?: InputMaybe<Scalars['BigDecimal']['input']>;
  collateralOraclePrice_in?: InputMaybe<Array<Scalars['BigDecimal']['input']>>;
  collateralOraclePrice_lt?: InputMaybe<Scalars['BigDecimal']['input']>;
  collateralOraclePrice_lte?: InputMaybe<Scalars['BigDecimal']['input']>;
  collateralOraclePrice_not?: InputMaybe<Scalars['BigDecimal']['input']>;
  collateralOraclePrice_not_in?: InputMaybe<Array<Scalars['BigDecimal']['input']>>;
  collateralToken?: InputMaybe<Scalars['String']['input']>;
  collateralTokenPriceUSD?: InputMaybe<Scalars['BigDecimal']['input']>;
  collateralTokenPriceUSD_gt?: InputMaybe<Scalars['BigDecimal']['input']>;
  collateralTokenPriceUSD_gte?: InputMaybe<Scalars['BigDecimal']['input']>;
  collateralTokenPriceUSD_in?: InputMaybe<Array<Scalars['BigDecimal']['input']>>;
  collateralTokenPriceUSD_lt?: InputMaybe<Scalars['BigDecimal']['input']>;
  collateralTokenPriceUSD_lte?: InputMaybe<Scalars['BigDecimal']['input']>;
  collateralTokenPriceUSD_not?: InputMaybe<Scalars['BigDecimal']['input']>;
  collateralTokenPriceUSD_not_in?: InputMaybe<Array<Scalars['BigDecimal']['input']>>;
  collateralToken_?: InputMaybe<Token_Filter>;
  collateralToken_contains?: InputMaybe<Scalars['String']['input']>;
  collateralToken_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  collateralToken_ends_with?: InputMaybe<Scalars['String']['input']>;
  collateralToken_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  collateralToken_gt?: InputMaybe<Scalars['String']['input']>;
  collateralToken_gte?: InputMaybe<Scalars['String']['input']>;
  collateralToken_in?: InputMaybe<Array<Scalars['String']['input']>>;
  collateralToken_lt?: InputMaybe<Scalars['String']['input']>;
  collateralToken_lte?: InputMaybe<Scalars['String']['input']>;
  collateralToken_not?: InputMaybe<Scalars['String']['input']>;
  collateralToken_not_contains?: InputMaybe<Scalars['String']['input']>;
  collateralToken_not_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  collateralToken_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  collateralToken_not_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  collateralToken_not_in?: InputMaybe<Array<Scalars['String']['input']>>;
  collateralToken_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  collateralToken_not_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  collateralToken_starts_with?: InputMaybe<Scalars['String']['input']>;
  collateralToken_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  debtAddress?: InputMaybe<Scalars['Bytes']['input']>;
  debtAddress_contains?: InputMaybe<Scalars['Bytes']['input']>;
  debtAddress_gt?: InputMaybe<Scalars['Bytes']['input']>;
  debtAddress_gte?: InputMaybe<Scalars['Bytes']['input']>;
  debtAddress_in?: InputMaybe<Array<Scalars['Bytes']['input']>>;
  debtAddress_lt?: InputMaybe<Scalars['Bytes']['input']>;
  debtAddress_lte?: InputMaybe<Scalars['Bytes']['input']>;
  debtAddress_not?: InputMaybe<Scalars['Bytes']['input']>;
  debtAddress_not_contains?: InputMaybe<Scalars['Bytes']['input']>;
  debtAddress_not_in?: InputMaybe<Array<Scalars['Bytes']['input']>>;
  debtAfter?: InputMaybe<Scalars['BigDecimal']['input']>;
  debtAfter_gt?: InputMaybe<Scalars['BigDecimal']['input']>;
  debtAfter_gte?: InputMaybe<Scalars['BigDecimal']['input']>;
  debtAfter_in?: InputMaybe<Array<Scalars['BigDecimal']['input']>>;
  debtAfter_lt?: InputMaybe<Scalars['BigDecimal']['input']>;
  debtAfter_lte?: InputMaybe<Scalars['BigDecimal']['input']>;
  debtAfter_not?: InputMaybe<Scalars['BigDecimal']['input']>;
  debtAfter_not_in?: InputMaybe<Array<Scalars['BigDecimal']['input']>>;
  debtBefore?: InputMaybe<Scalars['BigDecimal']['input']>;
  debtBefore_gt?: InputMaybe<Scalars['BigDecimal']['input']>;
  debtBefore_gte?: InputMaybe<Scalars['BigDecimal']['input']>;
  debtBefore_in?: InputMaybe<Array<Scalars['BigDecimal']['input']>>;
  debtBefore_lt?: InputMaybe<Scalars['BigDecimal']['input']>;
  debtBefore_lte?: InputMaybe<Scalars['BigDecimal']['input']>;
  debtBefore_not?: InputMaybe<Scalars['BigDecimal']['input']>;
  debtBefore_not_in?: InputMaybe<Array<Scalars['BigDecimal']['input']>>;
  debtDelta?: InputMaybe<Scalars['BigDecimal']['input']>;
  debtDelta_gt?: InputMaybe<Scalars['BigDecimal']['input']>;
  debtDelta_gte?: InputMaybe<Scalars['BigDecimal']['input']>;
  debtDelta_in?: InputMaybe<Array<Scalars['BigDecimal']['input']>>;
  debtDelta_lt?: InputMaybe<Scalars['BigDecimal']['input']>;
  debtDelta_lte?: InputMaybe<Scalars['BigDecimal']['input']>;
  debtDelta_not?: InputMaybe<Scalars['BigDecimal']['input']>;
  debtDelta_not_in?: InputMaybe<Array<Scalars['BigDecimal']['input']>>;
  debtOraclePrice?: InputMaybe<Scalars['BigDecimal']['input']>;
  debtOraclePrice_gt?: InputMaybe<Scalars['BigDecimal']['input']>;
  debtOraclePrice_gte?: InputMaybe<Scalars['BigDecimal']['input']>;
  debtOraclePrice_in?: InputMaybe<Array<Scalars['BigDecimal']['input']>>;
  debtOraclePrice_lt?: InputMaybe<Scalars['BigDecimal']['input']>;
  debtOraclePrice_lte?: InputMaybe<Scalars['BigDecimal']['input']>;
  debtOraclePrice_not?: InputMaybe<Scalars['BigDecimal']['input']>;
  debtOraclePrice_not_in?: InputMaybe<Array<Scalars['BigDecimal']['input']>>;
  debtToken?: InputMaybe<Scalars['String']['input']>;
  debtTokenPriceUSD?: InputMaybe<Scalars['BigDecimal']['input']>;
  debtTokenPriceUSD_gt?: InputMaybe<Scalars['BigDecimal']['input']>;
  debtTokenPriceUSD_gte?: InputMaybe<Scalars['BigDecimal']['input']>;
  debtTokenPriceUSD_in?: InputMaybe<Array<Scalars['BigDecimal']['input']>>;
  debtTokenPriceUSD_lt?: InputMaybe<Scalars['BigDecimal']['input']>;
  debtTokenPriceUSD_lte?: InputMaybe<Scalars['BigDecimal']['input']>;
  debtTokenPriceUSD_not?: InputMaybe<Scalars['BigDecimal']['input']>;
  debtTokenPriceUSD_not_in?: InputMaybe<Array<Scalars['BigDecimal']['input']>>;
  debtToken_?: InputMaybe<Token_Filter>;
  debtToken_contains?: InputMaybe<Scalars['String']['input']>;
  debtToken_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  debtToken_ends_with?: InputMaybe<Scalars['String']['input']>;
  debtToken_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  debtToken_gt?: InputMaybe<Scalars['String']['input']>;
  debtToken_gte?: InputMaybe<Scalars['String']['input']>;
  debtToken_in?: InputMaybe<Array<Scalars['String']['input']>>;
  debtToken_lt?: InputMaybe<Scalars['String']['input']>;
  debtToken_lte?: InputMaybe<Scalars['String']['input']>;
  debtToken_not?: InputMaybe<Scalars['String']['input']>;
  debtToken_not_contains?: InputMaybe<Scalars['String']['input']>;
  debtToken_not_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  debtToken_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  debtToken_not_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  debtToken_not_in?: InputMaybe<Array<Scalars['String']['input']>>;
  debtToken_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  debtToken_not_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  debtToken_starts_with?: InputMaybe<Scalars['String']['input']>;
  debtToken_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  depositTransfers?: InputMaybe<Array<Scalars['String']['input']>>;
  depositTransfers_?: InputMaybe<Transfer_Filter>;
  depositTransfers_contains?: InputMaybe<Array<Scalars['String']['input']>>;
  depositTransfers_contains_nocase?: InputMaybe<Array<Scalars['String']['input']>>;
  depositTransfers_not?: InputMaybe<Array<Scalars['String']['input']>>;
  depositTransfers_not_contains?: InputMaybe<Array<Scalars['String']['input']>>;
  depositTransfers_not_contains_nocase?: InputMaybe<Array<Scalars['String']['input']>>;
  depositedUSD?: InputMaybe<Scalars['BigDecimal']['input']>;
  depositedUSD_gt?: InputMaybe<Scalars['BigDecimal']['input']>;
  depositedUSD_gte?: InputMaybe<Scalars['BigDecimal']['input']>;
  depositedUSD_in?: InputMaybe<Array<Scalars['BigDecimal']['input']>>;
  depositedUSD_lt?: InputMaybe<Scalars['BigDecimal']['input']>;
  depositedUSD_lte?: InputMaybe<Scalars['BigDecimal']['input']>;
  depositedUSD_not?: InputMaybe<Scalars['BigDecimal']['input']>;
  depositedUSD_not_in?: InputMaybe<Array<Scalars['BigDecimal']['input']>>;
  ethPrice?: InputMaybe<Scalars['BigDecimal']['input']>;
  ethPrice_gt?: InputMaybe<Scalars['BigDecimal']['input']>;
  ethPrice_gte?: InputMaybe<Scalars['BigDecimal']['input']>;
  ethPrice_in?: InputMaybe<Array<Scalars['BigDecimal']['input']>>;
  ethPrice_lt?: InputMaybe<Scalars['BigDecimal']['input']>;
  ethPrice_lte?: InputMaybe<Scalars['BigDecimal']['input']>;
  ethPrice_not?: InputMaybe<Scalars['BigDecimal']['input']>;
  ethPrice_not_in?: InputMaybe<Array<Scalars['BigDecimal']['input']>>;
  gasFeeUSD?: InputMaybe<Scalars['BigDecimal']['input']>;
  gasFeeUSD_gt?: InputMaybe<Scalars['BigDecimal']['input']>;
  gasFeeUSD_gte?: InputMaybe<Scalars['BigDecimal']['input']>;
  gasFeeUSD_in?: InputMaybe<Array<Scalars['BigDecimal']['input']>>;
  gasFeeUSD_lt?: InputMaybe<Scalars['BigDecimal']['input']>;
  gasFeeUSD_lte?: InputMaybe<Scalars['BigDecimal']['input']>;
  gasFeeUSD_not?: InputMaybe<Scalars['BigDecimal']['input']>;
  gasFeeUSD_not_in?: InputMaybe<Array<Scalars['BigDecimal']['input']>>;
  gasPrice?: InputMaybe<Scalars['BigInt']['input']>;
  gasPrice_gt?: InputMaybe<Scalars['BigInt']['input']>;
  gasPrice_gte?: InputMaybe<Scalars['BigInt']['input']>;
  gasPrice_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  gasPrice_lt?: InputMaybe<Scalars['BigInt']['input']>;
  gasPrice_lte?: InputMaybe<Scalars['BigInt']['input']>;
  gasPrice_not?: InputMaybe<Scalars['BigInt']['input']>;
  gasPrice_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  gasUsed?: InputMaybe<Scalars['BigInt']['input']>;
  gasUsed_gt?: InputMaybe<Scalars['BigInt']['input']>;
  gasUsed_gte?: InputMaybe<Scalars['BigInt']['input']>;
  gasUsed_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  gasUsed_lt?: InputMaybe<Scalars['BigInt']['input']>;
  gasUsed_lte?: InputMaybe<Scalars['BigInt']['input']>;
  gasUsed_not?: InputMaybe<Scalars['BigInt']['input']>;
  gasUsed_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  healthFactorAfter?: InputMaybe<Scalars['BigDecimal']['input']>;
  healthFactorAfter_gt?: InputMaybe<Scalars['BigDecimal']['input']>;
  healthFactorAfter_gte?: InputMaybe<Scalars['BigDecimal']['input']>;
  healthFactorAfter_in?: InputMaybe<Array<Scalars['BigDecimal']['input']>>;
  healthFactorAfter_lt?: InputMaybe<Scalars['BigDecimal']['input']>;
  healthFactorAfter_lte?: InputMaybe<Scalars['BigDecimal']['input']>;
  healthFactorAfter_not?: InputMaybe<Scalars['BigDecimal']['input']>;
  healthFactorAfter_not_in?: InputMaybe<Array<Scalars['BigDecimal']['input']>>;
  id?: InputMaybe<Scalars['ID']['input']>;
  id_gt?: InputMaybe<Scalars['ID']['input']>;
  id_gte?: InputMaybe<Scalars['ID']['input']>;
  id_in?: InputMaybe<Array<Scalars['ID']['input']>>;
  id_lt?: InputMaybe<Scalars['ID']['input']>;
  id_lte?: InputMaybe<Scalars['ID']['input']>;
  id_not?: InputMaybe<Scalars['ID']['input']>;
  id_not_in?: InputMaybe<Array<Scalars['ID']['input']>>;
  isAutomation?: InputMaybe<Scalars['Boolean']['input']>;
  isAutomation_in?: InputMaybe<Array<Scalars['Boolean']['input']>>;
  isAutomation_not?: InputMaybe<Scalars['Boolean']['input']>;
  isAutomation_not_in?: InputMaybe<Array<Scalars['Boolean']['input']>>;
  kind?: InputMaybe<Scalars['String']['input']>;
  kind_contains?: InputMaybe<Scalars['String']['input']>;
  kind_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  kind_ends_with?: InputMaybe<Scalars['String']['input']>;
  kind_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  kind_gt?: InputMaybe<Scalars['String']['input']>;
  kind_gte?: InputMaybe<Scalars['String']['input']>;
  kind_in?: InputMaybe<Array<Scalars['String']['input']>>;
  kind_lt?: InputMaybe<Scalars['String']['input']>;
  kind_lte?: InputMaybe<Scalars['String']['input']>;
  kind_not?: InputMaybe<Scalars['String']['input']>;
  kind_not_contains?: InputMaybe<Scalars['String']['input']>;
  kind_not_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  kind_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  kind_not_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  kind_not_in?: InputMaybe<Array<Scalars['String']['input']>>;
  kind_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  kind_not_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  kind_starts_with?: InputMaybe<Scalars['String']['input']>;
  kind_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  liquidationPriceAfter?: InputMaybe<Scalars['BigDecimal']['input']>;
  liquidationPriceAfter_gt?: InputMaybe<Scalars['BigDecimal']['input']>;
  liquidationPriceAfter_gte?: InputMaybe<Scalars['BigDecimal']['input']>;
  liquidationPriceAfter_in?: InputMaybe<Array<Scalars['BigDecimal']['input']>>;
  liquidationPriceAfter_lt?: InputMaybe<Scalars['BigDecimal']['input']>;
  liquidationPriceAfter_lte?: InputMaybe<Scalars['BigDecimal']['input']>;
  liquidationPriceAfter_not?: InputMaybe<Scalars['BigDecimal']['input']>;
  liquidationPriceAfter_not_in?: InputMaybe<Array<Scalars['BigDecimal']['input']>>;
  liquidationPriceBefore?: InputMaybe<Scalars['BigDecimal']['input']>;
  liquidationPriceBefore_gt?: InputMaybe<Scalars['BigDecimal']['input']>;
  liquidationPriceBefore_gte?: InputMaybe<Scalars['BigDecimal']['input']>;
  liquidationPriceBefore_in?: InputMaybe<Array<Scalars['BigDecimal']['input']>>;
  liquidationPriceBefore_lt?: InputMaybe<Scalars['BigDecimal']['input']>;
  liquidationPriceBefore_lte?: InputMaybe<Scalars['BigDecimal']['input']>;
  liquidationPriceBefore_not?: InputMaybe<Scalars['BigDecimal']['input']>;
  liquidationPriceBefore_not_in?: InputMaybe<Array<Scalars['BigDecimal']['input']>>;
  liquidationThreshold?: InputMaybe<Scalars['BigDecimal']['input']>;
  liquidationThreshold_gt?: InputMaybe<Scalars['BigDecimal']['input']>;
  liquidationThreshold_gte?: InputMaybe<Scalars['BigDecimal']['input']>;
  liquidationThreshold_in?: InputMaybe<Array<Scalars['BigDecimal']['input']>>;
  liquidationThreshold_lt?: InputMaybe<Scalars['BigDecimal']['input']>;
  liquidationThreshold_lte?: InputMaybe<Scalars['BigDecimal']['input']>;
  liquidationThreshold_not?: InputMaybe<Scalars['BigDecimal']['input']>;
  liquidationThreshold_not_in?: InputMaybe<Array<Scalars['BigDecimal']['input']>>;
  ltvAfter?: InputMaybe<Scalars['BigDecimal']['input']>;
  ltvAfter_gt?: InputMaybe<Scalars['BigDecimal']['input']>;
  ltvAfter_gte?: InputMaybe<Scalars['BigDecimal']['input']>;
  ltvAfter_in?: InputMaybe<Array<Scalars['BigDecimal']['input']>>;
  ltvAfter_lt?: InputMaybe<Scalars['BigDecimal']['input']>;
  ltvAfter_lte?: InputMaybe<Scalars['BigDecimal']['input']>;
  ltvAfter_not?: InputMaybe<Scalars['BigDecimal']['input']>;
  ltvAfter_not_in?: InputMaybe<Array<Scalars['BigDecimal']['input']>>;
  ltvBefore?: InputMaybe<Scalars['BigDecimal']['input']>;
  ltvBefore_gt?: InputMaybe<Scalars['BigDecimal']['input']>;
  ltvBefore_gte?: InputMaybe<Scalars['BigDecimal']['input']>;
  ltvBefore_in?: InputMaybe<Array<Scalars['BigDecimal']['input']>>;
  ltvBefore_lt?: InputMaybe<Scalars['BigDecimal']['input']>;
  ltvBefore_lte?: InputMaybe<Scalars['BigDecimal']['input']>;
  ltvBefore_not?: InputMaybe<Scalars['BigDecimal']['input']>;
  ltvBefore_not_in?: InputMaybe<Array<Scalars['BigDecimal']['input']>>;
  marketPrice?: InputMaybe<Scalars['BigDecimal']['input']>;
  marketPrice_gt?: InputMaybe<Scalars['BigDecimal']['input']>;
  marketPrice_gte?: InputMaybe<Scalars['BigDecimal']['input']>;
  marketPrice_in?: InputMaybe<Array<Scalars['BigDecimal']['input']>>;
  marketPrice_lt?: InputMaybe<Scalars['BigDecimal']['input']>;
  marketPrice_lte?: InputMaybe<Scalars['BigDecimal']['input']>;
  marketPrice_not?: InputMaybe<Scalars['BigDecimal']['input']>;
  marketPrice_not_in?: InputMaybe<Array<Scalars['BigDecimal']['input']>>;
  multipleAfter?: InputMaybe<Scalars['BigDecimal']['input']>;
  multipleAfter_gt?: InputMaybe<Scalars['BigDecimal']['input']>;
  multipleAfter_gte?: InputMaybe<Scalars['BigDecimal']['input']>;
  multipleAfter_in?: InputMaybe<Array<Scalars['BigDecimal']['input']>>;
  multipleAfter_lt?: InputMaybe<Scalars['BigDecimal']['input']>;
  multipleAfter_lte?: InputMaybe<Scalars['BigDecimal']['input']>;
  multipleAfter_not?: InputMaybe<Scalars['BigDecimal']['input']>;
  multipleAfter_not_in?: InputMaybe<Array<Scalars['BigDecimal']['input']>>;
  multipleBefore?: InputMaybe<Scalars['BigDecimal']['input']>;
  multipleBefore_gt?: InputMaybe<Scalars['BigDecimal']['input']>;
  multipleBefore_gte?: InputMaybe<Scalars['BigDecimal']['input']>;
  multipleBefore_in?: InputMaybe<Array<Scalars['BigDecimal']['input']>>;
  multipleBefore_lt?: InputMaybe<Scalars['BigDecimal']['input']>;
  multipleBefore_lte?: InputMaybe<Scalars['BigDecimal']['input']>;
  multipleBefore_not?: InputMaybe<Scalars['BigDecimal']['input']>;
  multipleBefore_not_in?: InputMaybe<Array<Scalars['BigDecimal']['input']>>;
  netValueAfter?: InputMaybe<Scalars['BigDecimal']['input']>;
  netValueAfter_gt?: InputMaybe<Scalars['BigDecimal']['input']>;
  netValueAfter_gte?: InputMaybe<Scalars['BigDecimal']['input']>;
  netValueAfter_in?: InputMaybe<Array<Scalars['BigDecimal']['input']>>;
  netValueAfter_lt?: InputMaybe<Scalars['BigDecimal']['input']>;
  netValueAfter_lte?: InputMaybe<Scalars['BigDecimal']['input']>;
  netValueAfter_not?: InputMaybe<Scalars['BigDecimal']['input']>;
  netValueAfter_not_in?: InputMaybe<Array<Scalars['BigDecimal']['input']>>;
  netValueBefore?: InputMaybe<Scalars['BigDecimal']['input']>;
  netValueBefore_gt?: InputMaybe<Scalars['BigDecimal']['input']>;
  netValueBefore_gte?: InputMaybe<Scalars['BigDecimal']['input']>;
  netValueBefore_in?: InputMaybe<Array<Scalars['BigDecimal']['input']>>;
  netValueBefore_lt?: InputMaybe<Scalars['BigDecimal']['input']>;
  netValueBefore_lte?: InputMaybe<Scalars['BigDecimal']['input']>;
  netValueBefore_not?: InputMaybe<Scalars['BigDecimal']['input']>;
  netValueBefore_not_in?: InputMaybe<Array<Scalars['BigDecimal']['input']>>;
  oasisFee?: InputMaybe<Scalars['BigDecimal']['input']>;
  oasisFeeToken?: InputMaybe<Scalars['Bytes']['input']>;
  oasisFeeToken_contains?: InputMaybe<Scalars['Bytes']['input']>;
  oasisFeeToken_gt?: InputMaybe<Scalars['Bytes']['input']>;
  oasisFeeToken_gte?: InputMaybe<Scalars['Bytes']['input']>;
  oasisFeeToken_in?: InputMaybe<Array<Scalars['Bytes']['input']>>;
  oasisFeeToken_lt?: InputMaybe<Scalars['Bytes']['input']>;
  oasisFeeToken_lte?: InputMaybe<Scalars['Bytes']['input']>;
  oasisFeeToken_not?: InputMaybe<Scalars['Bytes']['input']>;
  oasisFeeToken_not_contains?: InputMaybe<Scalars['Bytes']['input']>;
  oasisFeeToken_not_in?: InputMaybe<Array<Scalars['Bytes']['input']>>;
  oasisFeeUSD?: InputMaybe<Scalars['BigDecimal']['input']>;
  oasisFeeUSD_gt?: InputMaybe<Scalars['BigDecimal']['input']>;
  oasisFeeUSD_gte?: InputMaybe<Scalars['BigDecimal']['input']>;
  oasisFeeUSD_in?: InputMaybe<Array<Scalars['BigDecimal']['input']>>;
  oasisFeeUSD_lt?: InputMaybe<Scalars['BigDecimal']['input']>;
  oasisFeeUSD_lte?: InputMaybe<Scalars['BigDecimal']['input']>;
  oasisFeeUSD_not?: InputMaybe<Scalars['BigDecimal']['input']>;
  oasisFeeUSD_not_in?: InputMaybe<Array<Scalars['BigDecimal']['input']>>;
  oasisFee_gt?: InputMaybe<Scalars['BigDecimal']['input']>;
  oasisFee_gte?: InputMaybe<Scalars['BigDecimal']['input']>;
  oasisFee_in?: InputMaybe<Array<Scalars['BigDecimal']['input']>>;
  oasisFee_lt?: InputMaybe<Scalars['BigDecimal']['input']>;
  oasisFee_lte?: InputMaybe<Scalars['BigDecimal']['input']>;
  oasisFee_not?: InputMaybe<Scalars['BigDecimal']['input']>;
  oasisFee_not_in?: InputMaybe<Array<Scalars['BigDecimal']['input']>>;
  or?: InputMaybe<Array<InputMaybe<PositionEvent_Filter>>>;
  position?: InputMaybe<Scalars['String']['input']>;
  position_?: InputMaybe<Position_Filter>;
  position_contains?: InputMaybe<Scalars['String']['input']>;
  position_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  position_ends_with?: InputMaybe<Scalars['String']['input']>;
  position_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  position_gt?: InputMaybe<Scalars['String']['input']>;
  position_gte?: InputMaybe<Scalars['String']['input']>;
  position_in?: InputMaybe<Array<Scalars['String']['input']>>;
  position_lt?: InputMaybe<Scalars['String']['input']>;
  position_lte?: InputMaybe<Scalars['String']['input']>;
  position_not?: InputMaybe<Scalars['String']['input']>;
  position_not_contains?: InputMaybe<Scalars['String']['input']>;
  position_not_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  position_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  position_not_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  position_not_in?: InputMaybe<Array<Scalars['String']['input']>>;
  position_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  position_not_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  position_starts_with?: InputMaybe<Scalars['String']['input']>;
  position_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  proxy?: InputMaybe<Scalars['String']['input']>;
  proxy_?: InputMaybe<Proxy_Filter>;
  proxy_contains?: InputMaybe<Scalars['String']['input']>;
  proxy_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  proxy_ends_with?: InputMaybe<Scalars['String']['input']>;
  proxy_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  proxy_gt?: InputMaybe<Scalars['String']['input']>;
  proxy_gte?: InputMaybe<Scalars['String']['input']>;
  proxy_in?: InputMaybe<Array<Scalars['String']['input']>>;
  proxy_lt?: InputMaybe<Scalars['String']['input']>;
  proxy_lte?: InputMaybe<Scalars['String']['input']>;
  proxy_not?: InputMaybe<Scalars['String']['input']>;
  proxy_not_contains?: InputMaybe<Scalars['String']['input']>;
  proxy_not_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  proxy_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  proxy_not_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  proxy_not_in?: InputMaybe<Array<Scalars['String']['input']>>;
  proxy_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  proxy_not_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  proxy_starts_with?: InputMaybe<Scalars['String']['input']>;
  proxy_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  summerFee?: InputMaybe<Scalars['BigDecimal']['input']>;
  summerFeeToken?: InputMaybe<Scalars['Bytes']['input']>;
  summerFeeToken_contains?: InputMaybe<Scalars['Bytes']['input']>;
  summerFeeToken_gt?: InputMaybe<Scalars['Bytes']['input']>;
  summerFeeToken_gte?: InputMaybe<Scalars['Bytes']['input']>;
  summerFeeToken_in?: InputMaybe<Array<Scalars['Bytes']['input']>>;
  summerFeeToken_lt?: InputMaybe<Scalars['Bytes']['input']>;
  summerFeeToken_lte?: InputMaybe<Scalars['Bytes']['input']>;
  summerFeeToken_not?: InputMaybe<Scalars['Bytes']['input']>;
  summerFeeToken_not_contains?: InputMaybe<Scalars['Bytes']['input']>;
  summerFeeToken_not_in?: InputMaybe<Array<Scalars['Bytes']['input']>>;
  summerFeeUSD?: InputMaybe<Scalars['BigDecimal']['input']>;
  summerFeeUSD_gt?: InputMaybe<Scalars['BigDecimal']['input']>;
  summerFeeUSD_gte?: InputMaybe<Scalars['BigDecimal']['input']>;
  summerFeeUSD_in?: InputMaybe<Array<Scalars['BigDecimal']['input']>>;
  summerFeeUSD_lt?: InputMaybe<Scalars['BigDecimal']['input']>;
  summerFeeUSD_lte?: InputMaybe<Scalars['BigDecimal']['input']>;
  summerFeeUSD_not?: InputMaybe<Scalars['BigDecimal']['input']>;
  summerFeeUSD_not_in?: InputMaybe<Array<Scalars['BigDecimal']['input']>>;
  summerFee_gt?: InputMaybe<Scalars['BigDecimal']['input']>;
  summerFee_gte?: InputMaybe<Scalars['BigDecimal']['input']>;
  summerFee_in?: InputMaybe<Array<Scalars['BigDecimal']['input']>>;
  summerFee_lt?: InputMaybe<Scalars['BigDecimal']['input']>;
  summerFee_lte?: InputMaybe<Scalars['BigDecimal']['input']>;
  summerFee_not?: InputMaybe<Scalars['BigDecimal']['input']>;
  summerFee_not_in?: InputMaybe<Array<Scalars['BigDecimal']['input']>>;
  swapFromAmount?: InputMaybe<Scalars['BigDecimal']['input']>;
  swapFromAmount_gt?: InputMaybe<Scalars['BigDecimal']['input']>;
  swapFromAmount_gte?: InputMaybe<Scalars['BigDecimal']['input']>;
  swapFromAmount_in?: InputMaybe<Array<Scalars['BigDecimal']['input']>>;
  swapFromAmount_lt?: InputMaybe<Scalars['BigDecimal']['input']>;
  swapFromAmount_lte?: InputMaybe<Scalars['BigDecimal']['input']>;
  swapFromAmount_not?: InputMaybe<Scalars['BigDecimal']['input']>;
  swapFromAmount_not_in?: InputMaybe<Array<Scalars['BigDecimal']['input']>>;
  swapFromToken?: InputMaybe<Scalars['Bytes']['input']>;
  swapFromToken_contains?: InputMaybe<Scalars['Bytes']['input']>;
  swapFromToken_gt?: InputMaybe<Scalars['Bytes']['input']>;
  swapFromToken_gte?: InputMaybe<Scalars['Bytes']['input']>;
  swapFromToken_in?: InputMaybe<Array<Scalars['Bytes']['input']>>;
  swapFromToken_lt?: InputMaybe<Scalars['Bytes']['input']>;
  swapFromToken_lte?: InputMaybe<Scalars['Bytes']['input']>;
  swapFromToken_not?: InputMaybe<Scalars['Bytes']['input']>;
  swapFromToken_not_contains?: InputMaybe<Scalars['Bytes']['input']>;
  swapFromToken_not_in?: InputMaybe<Array<Scalars['Bytes']['input']>>;
  swapToAmount?: InputMaybe<Scalars['BigDecimal']['input']>;
  swapToAmount_gt?: InputMaybe<Scalars['BigDecimal']['input']>;
  swapToAmount_gte?: InputMaybe<Scalars['BigDecimal']['input']>;
  swapToAmount_in?: InputMaybe<Array<Scalars['BigDecimal']['input']>>;
  swapToAmount_lt?: InputMaybe<Scalars['BigDecimal']['input']>;
  swapToAmount_lte?: InputMaybe<Scalars['BigDecimal']['input']>;
  swapToAmount_not?: InputMaybe<Scalars['BigDecimal']['input']>;
  swapToAmount_not_in?: InputMaybe<Array<Scalars['BigDecimal']['input']>>;
  swapToToken?: InputMaybe<Scalars['Bytes']['input']>;
  swapToToken_contains?: InputMaybe<Scalars['Bytes']['input']>;
  swapToToken_gt?: InputMaybe<Scalars['Bytes']['input']>;
  swapToToken_gte?: InputMaybe<Scalars['Bytes']['input']>;
  swapToToken_in?: InputMaybe<Array<Scalars['Bytes']['input']>>;
  swapToToken_lt?: InputMaybe<Scalars['Bytes']['input']>;
  swapToToken_lte?: InputMaybe<Scalars['Bytes']['input']>;
  swapToToken_not?: InputMaybe<Scalars['Bytes']['input']>;
  swapToToken_not_contains?: InputMaybe<Scalars['Bytes']['input']>;
  swapToToken_not_in?: InputMaybe<Array<Scalars['Bytes']['input']>>;
  timestamp?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_gt?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_gte?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  timestamp_lt?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_lte?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_not?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  totalFee?: InputMaybe<Scalars['BigDecimal']['input']>;
  totalFee_gt?: InputMaybe<Scalars['BigDecimal']['input']>;
  totalFee_gte?: InputMaybe<Scalars['BigDecimal']['input']>;
  totalFee_in?: InputMaybe<Array<Scalars['BigDecimal']['input']>>;
  totalFee_lt?: InputMaybe<Scalars['BigDecimal']['input']>;
  totalFee_lte?: InputMaybe<Scalars['BigDecimal']['input']>;
  totalFee_not?: InputMaybe<Scalars['BigDecimal']['input']>;
  totalFee_not_in?: InputMaybe<Array<Scalars['BigDecimal']['input']>>;
  trigger?: InputMaybe<Scalars['String']['input']>;
  trigger_?: InputMaybe<Trigger_Filter>;
  trigger_contains?: InputMaybe<Scalars['String']['input']>;
  trigger_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  trigger_ends_with?: InputMaybe<Scalars['String']['input']>;
  trigger_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  trigger_gt?: InputMaybe<Scalars['String']['input']>;
  trigger_gte?: InputMaybe<Scalars['String']['input']>;
  trigger_in?: InputMaybe<Array<Scalars['String']['input']>>;
  trigger_lt?: InputMaybe<Scalars['String']['input']>;
  trigger_lte?: InputMaybe<Scalars['String']['input']>;
  trigger_not?: InputMaybe<Scalars['String']['input']>;
  trigger_not_contains?: InputMaybe<Scalars['String']['input']>;
  trigger_not_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  trigger_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  trigger_not_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  trigger_not_in?: InputMaybe<Array<Scalars['String']['input']>>;
  trigger_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  trigger_not_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  trigger_starts_with?: InputMaybe<Scalars['String']['input']>;
  trigger_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  txHash?: InputMaybe<Scalars['Bytes']['input']>;
  txHash_contains?: InputMaybe<Scalars['Bytes']['input']>;
  txHash_gt?: InputMaybe<Scalars['Bytes']['input']>;
  txHash_gte?: InputMaybe<Scalars['Bytes']['input']>;
  txHash_in?: InputMaybe<Array<Scalars['Bytes']['input']>>;
  txHash_lt?: InputMaybe<Scalars['Bytes']['input']>;
  txHash_lte?: InputMaybe<Scalars['Bytes']['input']>;
  txHash_not?: InputMaybe<Scalars['Bytes']['input']>;
  txHash_not_contains?: InputMaybe<Scalars['Bytes']['input']>;
  txHash_not_in?: InputMaybe<Array<Scalars['Bytes']['input']>>;
  withdrawTransfers?: InputMaybe<Array<Scalars['String']['input']>>;
  withdrawTransfers_?: InputMaybe<Transfer_Filter>;
  withdrawTransfers_contains?: InputMaybe<Array<Scalars['String']['input']>>;
  withdrawTransfers_contains_nocase?: InputMaybe<Array<Scalars['String']['input']>>;
  withdrawTransfers_not?: InputMaybe<Array<Scalars['String']['input']>>;
  withdrawTransfers_not_contains?: InputMaybe<Array<Scalars['String']['input']>>;
  withdrawTransfers_not_contains_nocase?: InputMaybe<Array<Scalars['String']['input']>>;
  withdrawnUSD?: InputMaybe<Scalars['BigDecimal']['input']>;
  withdrawnUSD_gt?: InputMaybe<Scalars['BigDecimal']['input']>;
  withdrawnUSD_gte?: InputMaybe<Scalars['BigDecimal']['input']>;
  withdrawnUSD_in?: InputMaybe<Array<Scalars['BigDecimal']['input']>>;
  withdrawnUSD_lt?: InputMaybe<Scalars['BigDecimal']['input']>;
  withdrawnUSD_lte?: InputMaybe<Scalars['BigDecimal']['input']>;
  withdrawnUSD_not?: InputMaybe<Scalars['BigDecimal']['input']>;
  withdrawnUSD_not_in?: InputMaybe<Array<Scalars['BigDecimal']['input']>>;
};

export enum PositionEvent_OrderBy {
  Account = 'account',
  BlockNumber = 'blockNumber',
  CollateralAddress = 'collateralAddress',
  CollateralAfter = 'collateralAfter',
  CollateralBefore = 'collateralBefore',
  CollateralDelta = 'collateralDelta',
  CollateralOraclePrice = 'collateralOraclePrice',
  CollateralToken = 'collateralToken',
  CollateralTokenPriceUsd = 'collateralTokenPriceUSD',
  CollateralTokenAddress = 'collateralToken__address',
  CollateralTokenDecimals = 'collateralToken__decimals',
  CollateralTokenId = 'collateralToken__id',
  CollateralTokenPrecision = 'collateralToken__precision',
  CollateralTokenSymbol = 'collateralToken__symbol',
  DebtAddress = 'debtAddress',
  DebtAfter = 'debtAfter',
  DebtBefore = 'debtBefore',
  DebtDelta = 'debtDelta',
  DebtOraclePrice = 'debtOraclePrice',
  DebtToken = 'debtToken',
  DebtTokenPriceUsd = 'debtTokenPriceUSD',
  DebtTokenAddress = 'debtToken__address',
  DebtTokenDecimals = 'debtToken__decimals',
  DebtTokenId = 'debtToken__id',
  DebtTokenPrecision = 'debtToken__precision',
  DebtTokenSymbol = 'debtToken__symbol',
  DepositTransfers = 'depositTransfers',
  DepositedUsd = 'depositedUSD',
  EthPrice = 'ethPrice',
  GasFeeUsd = 'gasFeeUSD',
  GasPrice = 'gasPrice',
  GasUsed = 'gasUsed',
  HealthFactorAfter = 'healthFactorAfter',
  Id = 'id',
  IsAutomation = 'isAutomation',
  Kind = 'kind',
  LiquidationPriceAfter = 'liquidationPriceAfter',
  LiquidationPriceBefore = 'liquidationPriceBefore',
  LiquidationThreshold = 'liquidationThreshold',
  LtvAfter = 'ltvAfter',
  LtvBefore = 'ltvBefore',
  MarketPrice = 'marketPrice',
  MultipleAfter = 'multipleAfter',
  MultipleBefore = 'multipleBefore',
  NetValueAfter = 'netValueAfter',
  NetValueBefore = 'netValueBefore',
  OasisFee = 'oasisFee',
  OasisFeeToken = 'oasisFeeToken',
  OasisFeeUsd = 'oasisFeeUSD',
  Position = 'position',
  PositionAccount = 'position__account',
  PositionCollateral = 'position__collateral',
  PositionCollateralAddress = 'position__collateralAddress',
  PositionCumulativeDeposit = 'position__cumulativeDeposit',
  PositionCumulativeDepositInCollateralToken = 'position__cumulativeDepositInCollateralToken',
  PositionCumulativeDepositInQuoteToken = 'position__cumulativeDepositInQuoteToken',
  PositionCumulativeDepositUsd = 'position__cumulativeDepositUSD',
  PositionCumulativeFees = 'position__cumulativeFees',
  PositionCumulativeFeesInCollateralToken = 'position__cumulativeFeesInCollateralToken',
  PositionCumulativeFeesInQuoteToken = 'position__cumulativeFeesInQuoteToken',
  PositionCumulativeFeesUsd = 'position__cumulativeFeesUSD',
  PositionCumulativeWithdraw = 'position__cumulativeWithdraw',
  PositionCumulativeWithdrawInCollateralToken = 'position__cumulativeWithdrawInCollateralToken',
  PositionCumulativeWithdrawInQuoteToken = 'position__cumulativeWithdrawInQuoteToken',
  PositionCumulativeWithdrawUsd = 'position__cumulativeWithdrawUSD',
  PositionDebt = 'position__debt',
  PositionDebtAddress = 'position__debtAddress',
  PositionFromEvent = 'position__fromEvent',
  PositionId = 'position__id',
  PositionProtocol = 'position__protocol',
  PositionType = 'position__type',
  Proxy = 'proxy',
  ProxyId = 'proxy__id',
  ProxyIsDpm = 'proxy__isDPM',
  ProxyOwner = 'proxy__owner',
  ProxyVaultId = 'proxy__vaultId',
  SummerFee = 'summerFee',
  SummerFeeToken = 'summerFeeToken',
  SummerFeeUsd = 'summerFeeUSD',
  SwapFromAmount = 'swapFromAmount',
  SwapFromToken = 'swapFromToken',
  SwapToAmount = 'swapToAmount',
  SwapToToken = 'swapToToken',
  Timestamp = 'timestamp',
  TotalFee = 'totalFee',
  Trigger = 'trigger',
  TriggerAddedBlock = 'trigger__addedBlock',
  TriggerAddedLogIndex = 'trigger__addedLogIndex',
  TriggerAddedTimestamp = 'trigger__addedTimestamp',
  TriggerAddedTransaction = 'trigger__addedTransaction',
  TriggerCommandAddress = 'trigger__commandAddress',
  TriggerExecutedBlock = 'trigger__executedBlock',
  TriggerExecutedLogIndex = 'trigger__executedLogIndex',
  TriggerExecutedTimestamp = 'trigger__executedTimestamp',
  TriggerExecutedTransaction = 'trigger__executedTransaction',
  TriggerId = 'trigger__id',
  TriggerKind = 'trigger__kind',
  TriggerRemovedBlock = 'trigger__removedBlock',
  TriggerRemovedLogIndex = 'trigger__removedLogIndex',
  TriggerRemovedTimestamp = 'trigger__removedTimestamp',
  TriggerRemovedTransaction = 'trigger__removedTransaction',
  TriggerTriggerData = 'trigger__triggerData',
  TriggerTriggerType = 'trigger__triggerType',
  TxHash = 'txHash',
  WithdrawTransfers = 'withdrawTransfers',
  WithdrawnUsd = 'withdrawnUSD'
}

export type Position_Filter = {
  /** Filter for the block changed event. */
  _change_block?: InputMaybe<BlockChangedFilter>;
  account?: InputMaybe<Scalars['Bytes']['input']>;
  account_contains?: InputMaybe<Scalars['Bytes']['input']>;
  account_gt?: InputMaybe<Scalars['Bytes']['input']>;
  account_gte?: InputMaybe<Scalars['Bytes']['input']>;
  account_in?: InputMaybe<Array<Scalars['Bytes']['input']>>;
  account_lt?: InputMaybe<Scalars['Bytes']['input']>;
  account_lte?: InputMaybe<Scalars['Bytes']['input']>;
  account_not?: InputMaybe<Scalars['Bytes']['input']>;
  account_not_contains?: InputMaybe<Scalars['Bytes']['input']>;
  account_not_in?: InputMaybe<Array<Scalars['Bytes']['input']>>;
  and?: InputMaybe<Array<InputMaybe<Position_Filter>>>;
  collateral?: InputMaybe<Scalars['BigDecimal']['input']>;
  collateralAddress?: InputMaybe<Scalars['Bytes']['input']>;
  collateralAddress_contains?: InputMaybe<Scalars['Bytes']['input']>;
  collateralAddress_gt?: InputMaybe<Scalars['Bytes']['input']>;
  collateralAddress_gte?: InputMaybe<Scalars['Bytes']['input']>;
  collateralAddress_in?: InputMaybe<Array<Scalars['Bytes']['input']>>;
  collateralAddress_lt?: InputMaybe<Scalars['Bytes']['input']>;
  collateralAddress_lte?: InputMaybe<Scalars['Bytes']['input']>;
  collateralAddress_not?: InputMaybe<Scalars['Bytes']['input']>;
  collateralAddress_not_contains?: InputMaybe<Scalars['Bytes']['input']>;
  collateralAddress_not_in?: InputMaybe<Array<Scalars['Bytes']['input']>>;
  collateral_gt?: InputMaybe<Scalars['BigDecimal']['input']>;
  collateral_gte?: InputMaybe<Scalars['BigDecimal']['input']>;
  collateral_in?: InputMaybe<Array<Scalars['BigDecimal']['input']>>;
  collateral_lt?: InputMaybe<Scalars['BigDecimal']['input']>;
  collateral_lte?: InputMaybe<Scalars['BigDecimal']['input']>;
  collateral_not?: InputMaybe<Scalars['BigDecimal']['input']>;
  collateral_not_in?: InputMaybe<Array<Scalars['BigDecimal']['input']>>;
  cumulativeDeposit?: InputMaybe<Scalars['BigDecimal']['input']>;
  cumulativeDepositInCollateralToken?: InputMaybe<Scalars['BigDecimal']['input']>;
  cumulativeDepositInCollateralToken_gt?: InputMaybe<Scalars['BigDecimal']['input']>;
  cumulativeDepositInCollateralToken_gte?: InputMaybe<Scalars['BigDecimal']['input']>;
  cumulativeDepositInCollateralToken_in?: InputMaybe<Array<Scalars['BigDecimal']['input']>>;
  cumulativeDepositInCollateralToken_lt?: InputMaybe<Scalars['BigDecimal']['input']>;
  cumulativeDepositInCollateralToken_lte?: InputMaybe<Scalars['BigDecimal']['input']>;
  cumulativeDepositInCollateralToken_not?: InputMaybe<Scalars['BigDecimal']['input']>;
  cumulativeDepositInCollateralToken_not_in?: InputMaybe<Array<Scalars['BigDecimal']['input']>>;
  cumulativeDepositInQuoteToken?: InputMaybe<Scalars['BigDecimal']['input']>;
  cumulativeDepositInQuoteToken_gt?: InputMaybe<Scalars['BigDecimal']['input']>;
  cumulativeDepositInQuoteToken_gte?: InputMaybe<Scalars['BigDecimal']['input']>;
  cumulativeDepositInQuoteToken_in?: InputMaybe<Array<Scalars['BigDecimal']['input']>>;
  cumulativeDepositInQuoteToken_lt?: InputMaybe<Scalars['BigDecimal']['input']>;
  cumulativeDepositInQuoteToken_lte?: InputMaybe<Scalars['BigDecimal']['input']>;
  cumulativeDepositInQuoteToken_not?: InputMaybe<Scalars['BigDecimal']['input']>;
  cumulativeDepositInQuoteToken_not_in?: InputMaybe<Array<Scalars['BigDecimal']['input']>>;
  cumulativeDepositUSD?: InputMaybe<Scalars['BigDecimal']['input']>;
  cumulativeDepositUSD_gt?: InputMaybe<Scalars['BigDecimal']['input']>;
  cumulativeDepositUSD_gte?: InputMaybe<Scalars['BigDecimal']['input']>;
  cumulativeDepositUSD_in?: InputMaybe<Array<Scalars['BigDecimal']['input']>>;
  cumulativeDepositUSD_lt?: InputMaybe<Scalars['BigDecimal']['input']>;
  cumulativeDepositUSD_lte?: InputMaybe<Scalars['BigDecimal']['input']>;
  cumulativeDepositUSD_not?: InputMaybe<Scalars['BigDecimal']['input']>;
  cumulativeDepositUSD_not_in?: InputMaybe<Array<Scalars['BigDecimal']['input']>>;
  cumulativeDeposit_gt?: InputMaybe<Scalars['BigDecimal']['input']>;
  cumulativeDeposit_gte?: InputMaybe<Scalars['BigDecimal']['input']>;
  cumulativeDeposit_in?: InputMaybe<Array<Scalars['BigDecimal']['input']>>;
  cumulativeDeposit_lt?: InputMaybe<Scalars['BigDecimal']['input']>;
  cumulativeDeposit_lte?: InputMaybe<Scalars['BigDecimal']['input']>;
  cumulativeDeposit_not?: InputMaybe<Scalars['BigDecimal']['input']>;
  cumulativeDeposit_not_in?: InputMaybe<Array<Scalars['BigDecimal']['input']>>;
  cumulativeFees?: InputMaybe<Scalars['BigDecimal']['input']>;
  cumulativeFeesInCollateralToken?: InputMaybe<Scalars['BigDecimal']['input']>;
  cumulativeFeesInCollateralToken_gt?: InputMaybe<Scalars['BigDecimal']['input']>;
  cumulativeFeesInCollateralToken_gte?: InputMaybe<Scalars['BigDecimal']['input']>;
  cumulativeFeesInCollateralToken_in?: InputMaybe<Array<Scalars['BigDecimal']['input']>>;
  cumulativeFeesInCollateralToken_lt?: InputMaybe<Scalars['BigDecimal']['input']>;
  cumulativeFeesInCollateralToken_lte?: InputMaybe<Scalars['BigDecimal']['input']>;
  cumulativeFeesInCollateralToken_not?: InputMaybe<Scalars['BigDecimal']['input']>;
  cumulativeFeesInCollateralToken_not_in?: InputMaybe<Array<Scalars['BigDecimal']['input']>>;
  cumulativeFeesInQuoteToken?: InputMaybe<Scalars['BigDecimal']['input']>;
  cumulativeFeesInQuoteToken_gt?: InputMaybe<Scalars['BigDecimal']['input']>;
  cumulativeFeesInQuoteToken_gte?: InputMaybe<Scalars['BigDecimal']['input']>;
  cumulativeFeesInQuoteToken_in?: InputMaybe<Array<Scalars['BigDecimal']['input']>>;
  cumulativeFeesInQuoteToken_lt?: InputMaybe<Scalars['BigDecimal']['input']>;
  cumulativeFeesInQuoteToken_lte?: InputMaybe<Scalars['BigDecimal']['input']>;
  cumulativeFeesInQuoteToken_not?: InputMaybe<Scalars['BigDecimal']['input']>;
  cumulativeFeesInQuoteToken_not_in?: InputMaybe<Array<Scalars['BigDecimal']['input']>>;
  cumulativeFeesUSD?: InputMaybe<Scalars['BigDecimal']['input']>;
  cumulativeFeesUSD_gt?: InputMaybe<Scalars['BigDecimal']['input']>;
  cumulativeFeesUSD_gte?: InputMaybe<Scalars['BigDecimal']['input']>;
  cumulativeFeesUSD_in?: InputMaybe<Array<Scalars['BigDecimal']['input']>>;
  cumulativeFeesUSD_lt?: InputMaybe<Scalars['BigDecimal']['input']>;
  cumulativeFeesUSD_lte?: InputMaybe<Scalars['BigDecimal']['input']>;
  cumulativeFeesUSD_not?: InputMaybe<Scalars['BigDecimal']['input']>;
  cumulativeFeesUSD_not_in?: InputMaybe<Array<Scalars['BigDecimal']['input']>>;
  cumulativeFees_gt?: InputMaybe<Scalars['BigDecimal']['input']>;
  cumulativeFees_gte?: InputMaybe<Scalars['BigDecimal']['input']>;
  cumulativeFees_in?: InputMaybe<Array<Scalars['BigDecimal']['input']>>;
  cumulativeFees_lt?: InputMaybe<Scalars['BigDecimal']['input']>;
  cumulativeFees_lte?: InputMaybe<Scalars['BigDecimal']['input']>;
  cumulativeFees_not?: InputMaybe<Scalars['BigDecimal']['input']>;
  cumulativeFees_not_in?: InputMaybe<Array<Scalars['BigDecimal']['input']>>;
  cumulativeWithdraw?: InputMaybe<Scalars['BigDecimal']['input']>;
  cumulativeWithdrawInCollateralToken?: InputMaybe<Scalars['BigDecimal']['input']>;
  cumulativeWithdrawInCollateralToken_gt?: InputMaybe<Scalars['BigDecimal']['input']>;
  cumulativeWithdrawInCollateralToken_gte?: InputMaybe<Scalars['BigDecimal']['input']>;
  cumulativeWithdrawInCollateralToken_in?: InputMaybe<Array<Scalars['BigDecimal']['input']>>;
  cumulativeWithdrawInCollateralToken_lt?: InputMaybe<Scalars['BigDecimal']['input']>;
  cumulativeWithdrawInCollateralToken_lte?: InputMaybe<Scalars['BigDecimal']['input']>;
  cumulativeWithdrawInCollateralToken_not?: InputMaybe<Scalars['BigDecimal']['input']>;
  cumulativeWithdrawInCollateralToken_not_in?: InputMaybe<Array<Scalars['BigDecimal']['input']>>;
  cumulativeWithdrawInQuoteToken?: InputMaybe<Scalars['BigDecimal']['input']>;
  cumulativeWithdrawInQuoteToken_gt?: InputMaybe<Scalars['BigDecimal']['input']>;
  cumulativeWithdrawInQuoteToken_gte?: InputMaybe<Scalars['BigDecimal']['input']>;
  cumulativeWithdrawInQuoteToken_in?: InputMaybe<Array<Scalars['BigDecimal']['input']>>;
  cumulativeWithdrawInQuoteToken_lt?: InputMaybe<Scalars['BigDecimal']['input']>;
  cumulativeWithdrawInQuoteToken_lte?: InputMaybe<Scalars['BigDecimal']['input']>;
  cumulativeWithdrawInQuoteToken_not?: InputMaybe<Scalars['BigDecimal']['input']>;
  cumulativeWithdrawInQuoteToken_not_in?: InputMaybe<Array<Scalars['BigDecimal']['input']>>;
  cumulativeWithdrawUSD?: InputMaybe<Scalars['BigDecimal']['input']>;
  cumulativeWithdrawUSD_gt?: InputMaybe<Scalars['BigDecimal']['input']>;
  cumulativeWithdrawUSD_gte?: InputMaybe<Scalars['BigDecimal']['input']>;
  cumulativeWithdrawUSD_in?: InputMaybe<Array<Scalars['BigDecimal']['input']>>;
  cumulativeWithdrawUSD_lt?: InputMaybe<Scalars['BigDecimal']['input']>;
  cumulativeWithdrawUSD_lte?: InputMaybe<Scalars['BigDecimal']['input']>;
  cumulativeWithdrawUSD_not?: InputMaybe<Scalars['BigDecimal']['input']>;
  cumulativeWithdrawUSD_not_in?: InputMaybe<Array<Scalars['BigDecimal']['input']>>;
  cumulativeWithdraw_gt?: InputMaybe<Scalars['BigDecimal']['input']>;
  cumulativeWithdraw_gte?: InputMaybe<Scalars['BigDecimal']['input']>;
  cumulativeWithdraw_in?: InputMaybe<Array<Scalars['BigDecimal']['input']>>;
  cumulativeWithdraw_lt?: InputMaybe<Scalars['BigDecimal']['input']>;
  cumulativeWithdraw_lte?: InputMaybe<Scalars['BigDecimal']['input']>;
  cumulativeWithdraw_not?: InputMaybe<Scalars['BigDecimal']['input']>;
  cumulativeWithdraw_not_in?: InputMaybe<Array<Scalars['BigDecimal']['input']>>;
  debt?: InputMaybe<Scalars['BigDecimal']['input']>;
  debtAddress?: InputMaybe<Scalars['Bytes']['input']>;
  debtAddress_contains?: InputMaybe<Scalars['Bytes']['input']>;
  debtAddress_gt?: InputMaybe<Scalars['Bytes']['input']>;
  debtAddress_gte?: InputMaybe<Scalars['Bytes']['input']>;
  debtAddress_in?: InputMaybe<Array<Scalars['Bytes']['input']>>;
  debtAddress_lt?: InputMaybe<Scalars['Bytes']['input']>;
  debtAddress_lte?: InputMaybe<Scalars['Bytes']['input']>;
  debtAddress_not?: InputMaybe<Scalars['Bytes']['input']>;
  debtAddress_not_contains?: InputMaybe<Scalars['Bytes']['input']>;
  debtAddress_not_in?: InputMaybe<Array<Scalars['Bytes']['input']>>;
  debt_gt?: InputMaybe<Scalars['BigDecimal']['input']>;
  debt_gte?: InputMaybe<Scalars['BigDecimal']['input']>;
  debt_in?: InputMaybe<Array<Scalars['BigDecimal']['input']>>;
  debt_lt?: InputMaybe<Scalars['BigDecimal']['input']>;
  debt_lte?: InputMaybe<Scalars['BigDecimal']['input']>;
  debt_not?: InputMaybe<Scalars['BigDecimal']['input']>;
  debt_not_in?: InputMaybe<Array<Scalars['BigDecimal']['input']>>;
  events_?: InputMaybe<PositionEvent_Filter>;
  fromEvent?: InputMaybe<Scalars['Boolean']['input']>;
  fromEvent_in?: InputMaybe<Array<Scalars['Boolean']['input']>>;
  fromEvent_not?: InputMaybe<Scalars['Boolean']['input']>;
  fromEvent_not_in?: InputMaybe<Array<Scalars['Boolean']['input']>>;
  id?: InputMaybe<Scalars['ID']['input']>;
  id_gt?: InputMaybe<Scalars['ID']['input']>;
  id_gte?: InputMaybe<Scalars['ID']['input']>;
  id_in?: InputMaybe<Array<Scalars['ID']['input']>>;
  id_lt?: InputMaybe<Scalars['ID']['input']>;
  id_lte?: InputMaybe<Scalars['ID']['input']>;
  id_not?: InputMaybe<Scalars['ID']['input']>;
  id_not_in?: InputMaybe<Array<Scalars['ID']['input']>>;
  lastEvent?: InputMaybe<Scalars['String']['input']>;
  lastEvent_?: InputMaybe<PositionEvent_Filter>;
  lastEvent_contains?: InputMaybe<Scalars['String']['input']>;
  lastEvent_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  lastEvent_ends_with?: InputMaybe<Scalars['String']['input']>;
  lastEvent_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  lastEvent_gt?: InputMaybe<Scalars['String']['input']>;
  lastEvent_gte?: InputMaybe<Scalars['String']['input']>;
  lastEvent_in?: InputMaybe<Array<Scalars['String']['input']>>;
  lastEvent_lt?: InputMaybe<Scalars['String']['input']>;
  lastEvent_lte?: InputMaybe<Scalars['String']['input']>;
  lastEvent_not?: InputMaybe<Scalars['String']['input']>;
  lastEvent_not_contains?: InputMaybe<Scalars['String']['input']>;
  lastEvent_not_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  lastEvent_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  lastEvent_not_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  lastEvent_not_in?: InputMaybe<Array<Scalars['String']['input']>>;
  lastEvent_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  lastEvent_not_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  lastEvent_starts_with?: InputMaybe<Scalars['String']['input']>;
  lastEvent_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  or?: InputMaybe<Array<InputMaybe<Position_Filter>>>;
  protocol?: InputMaybe<Scalars['String']['input']>;
  protocol_contains?: InputMaybe<Scalars['String']['input']>;
  protocol_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  protocol_ends_with?: InputMaybe<Scalars['String']['input']>;
  protocol_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  protocol_gt?: InputMaybe<Scalars['String']['input']>;
  protocol_gte?: InputMaybe<Scalars['String']['input']>;
  protocol_in?: InputMaybe<Array<Scalars['String']['input']>>;
  protocol_lt?: InputMaybe<Scalars['String']['input']>;
  protocol_lte?: InputMaybe<Scalars['String']['input']>;
  protocol_not?: InputMaybe<Scalars['String']['input']>;
  protocol_not_contains?: InputMaybe<Scalars['String']['input']>;
  protocol_not_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  protocol_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  protocol_not_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  protocol_not_in?: InputMaybe<Array<Scalars['String']['input']>>;
  protocol_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  protocol_not_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  protocol_starts_with?: InputMaybe<Scalars['String']['input']>;
  protocol_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  proxy_?: InputMaybe<Proxy_Filter>;
  type?: InputMaybe<Scalars['String']['input']>;
  type_contains?: InputMaybe<Scalars['String']['input']>;
  type_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  type_ends_with?: InputMaybe<Scalars['String']['input']>;
  type_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  type_gt?: InputMaybe<Scalars['String']['input']>;
  type_gte?: InputMaybe<Scalars['String']['input']>;
  type_in?: InputMaybe<Array<Scalars['String']['input']>>;
  type_lt?: InputMaybe<Scalars['String']['input']>;
  type_lte?: InputMaybe<Scalars['String']['input']>;
  type_not?: InputMaybe<Scalars['String']['input']>;
  type_not_contains?: InputMaybe<Scalars['String']['input']>;
  type_not_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  type_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  type_not_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  type_not_in?: InputMaybe<Array<Scalars['String']['input']>>;
  type_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  type_not_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  type_starts_with?: InputMaybe<Scalars['String']['input']>;
  type_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
};

export enum Position_OrderBy {
  Account = 'account',
  Collateral = 'collateral',
  CollateralAddress = 'collateralAddress',
  CumulativeDeposit = 'cumulativeDeposit',
  CumulativeDepositInCollateralToken = 'cumulativeDepositInCollateralToken',
  CumulativeDepositInQuoteToken = 'cumulativeDepositInQuoteToken',
  CumulativeDepositUsd = 'cumulativeDepositUSD',
  CumulativeFees = 'cumulativeFees',
  CumulativeFeesInCollateralToken = 'cumulativeFeesInCollateralToken',
  CumulativeFeesInQuoteToken = 'cumulativeFeesInQuoteToken',
  CumulativeFeesUsd = 'cumulativeFeesUSD',
  CumulativeWithdraw = 'cumulativeWithdraw',
  CumulativeWithdrawInCollateralToken = 'cumulativeWithdrawInCollateralToken',
  CumulativeWithdrawInQuoteToken = 'cumulativeWithdrawInQuoteToken',
  CumulativeWithdrawUsd = 'cumulativeWithdrawUSD',
  Debt = 'debt',
  DebtAddress = 'debtAddress',
  Events = 'events',
  FromEvent = 'fromEvent',
  Id = 'id',
  LastEvent = 'lastEvent',
  LastEventAccount = 'lastEvent__account',
  LastEventBlockNumber = 'lastEvent__blockNumber',
  LastEventCollateralAddress = 'lastEvent__collateralAddress',
  LastEventCollateralAfter = 'lastEvent__collateralAfter',
  LastEventCollateralBefore = 'lastEvent__collateralBefore',
  LastEventCollateralDelta = 'lastEvent__collateralDelta',
  LastEventCollateralOraclePrice = 'lastEvent__collateralOraclePrice',
  LastEventCollateralTokenPriceUsd = 'lastEvent__collateralTokenPriceUSD',
  LastEventDebtAddress = 'lastEvent__debtAddress',
  LastEventDebtAfter = 'lastEvent__debtAfter',
  LastEventDebtBefore = 'lastEvent__debtBefore',
  LastEventDebtDelta = 'lastEvent__debtDelta',
  LastEventDebtOraclePrice = 'lastEvent__debtOraclePrice',
  LastEventDebtTokenPriceUsd = 'lastEvent__debtTokenPriceUSD',
  LastEventDepositedUsd = 'lastEvent__depositedUSD',
  LastEventEthPrice = 'lastEvent__ethPrice',
  LastEventGasFeeUsd = 'lastEvent__gasFeeUSD',
  LastEventGasPrice = 'lastEvent__gasPrice',
  LastEventGasUsed = 'lastEvent__gasUsed',
  LastEventHealthFactorAfter = 'lastEvent__healthFactorAfter',
  LastEventId = 'lastEvent__id',
  LastEventIsAutomation = 'lastEvent__isAutomation',
  LastEventKind = 'lastEvent__kind',
  LastEventLiquidationPriceAfter = 'lastEvent__liquidationPriceAfter',
  LastEventLiquidationPriceBefore = 'lastEvent__liquidationPriceBefore',
  LastEventLiquidationThreshold = 'lastEvent__liquidationThreshold',
  LastEventLtvAfter = 'lastEvent__ltvAfter',
  LastEventLtvBefore = 'lastEvent__ltvBefore',
  LastEventMarketPrice = 'lastEvent__marketPrice',
  LastEventMultipleAfter = 'lastEvent__multipleAfter',
  LastEventMultipleBefore = 'lastEvent__multipleBefore',
  LastEventNetValueAfter = 'lastEvent__netValueAfter',
  LastEventNetValueBefore = 'lastEvent__netValueBefore',
  LastEventOasisFee = 'lastEvent__oasisFee',
  LastEventOasisFeeToken = 'lastEvent__oasisFeeToken',
  LastEventOasisFeeUsd = 'lastEvent__oasisFeeUSD',
  LastEventSummerFee = 'lastEvent__summerFee',
  LastEventSummerFeeToken = 'lastEvent__summerFeeToken',
  LastEventSummerFeeUsd = 'lastEvent__summerFeeUSD',
  LastEventSwapFromAmount = 'lastEvent__swapFromAmount',
  LastEventSwapFromToken = 'lastEvent__swapFromToken',
  LastEventSwapToAmount = 'lastEvent__swapToAmount',
  LastEventSwapToToken = 'lastEvent__swapToToken',
  LastEventTimestamp = 'lastEvent__timestamp',
  LastEventTotalFee = 'lastEvent__totalFee',
  LastEventTxHash = 'lastEvent__txHash',
  LastEventWithdrawnUsd = 'lastEvent__withdrawnUSD',
  Protocol = 'protocol',
  Proxy = 'proxy',
  ProxyId = 'proxy__id',
  ProxyIsDpm = 'proxy__isDPM',
  ProxyOwner = 'proxy__owner',
  ProxyVaultId = 'proxy__vaultId',
  Type = 'type'
}

export type Proxy = {
  __typename?: 'Proxy';
  /**
   * Address of DPM or DS proxy
   *
   */
  id: Scalars['ID']['output'];
  isDPM: Scalars['Boolean']['output'];
  owner: Scalars['Bytes']['output'];
  position?: Maybe<Position>;
  positions?: Maybe<Array<Position>>;
  triggers: Array<Trigger>;
  vaultId?: Maybe<Scalars['BigInt']['output']>;
};


export type ProxyPositionsArgs = {
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Position_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  where?: InputMaybe<Position_Filter>;
};


export type ProxyTriggersArgs = {
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Trigger_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  where?: InputMaybe<Trigger_Filter>;
};

export type Proxy_Filter = {
  /** Filter for the block changed event. */
  _change_block?: InputMaybe<BlockChangedFilter>;
  and?: InputMaybe<Array<InputMaybe<Proxy_Filter>>>;
  id?: InputMaybe<Scalars['ID']['input']>;
  id_gt?: InputMaybe<Scalars['ID']['input']>;
  id_gte?: InputMaybe<Scalars['ID']['input']>;
  id_in?: InputMaybe<Array<Scalars['ID']['input']>>;
  id_lt?: InputMaybe<Scalars['ID']['input']>;
  id_lte?: InputMaybe<Scalars['ID']['input']>;
  id_not?: InputMaybe<Scalars['ID']['input']>;
  id_not_in?: InputMaybe<Array<Scalars['ID']['input']>>;
  isDPM?: InputMaybe<Scalars['Boolean']['input']>;
  isDPM_in?: InputMaybe<Array<Scalars['Boolean']['input']>>;
  isDPM_not?: InputMaybe<Scalars['Boolean']['input']>;
  isDPM_not_in?: InputMaybe<Array<Scalars['Boolean']['input']>>;
  or?: InputMaybe<Array<InputMaybe<Proxy_Filter>>>;
  owner?: InputMaybe<Scalars['Bytes']['input']>;
  owner_contains?: InputMaybe<Scalars['Bytes']['input']>;
  owner_gt?: InputMaybe<Scalars['Bytes']['input']>;
  owner_gte?: InputMaybe<Scalars['Bytes']['input']>;
  owner_in?: InputMaybe<Array<Scalars['Bytes']['input']>>;
  owner_lt?: InputMaybe<Scalars['Bytes']['input']>;
  owner_lte?: InputMaybe<Scalars['Bytes']['input']>;
  owner_not?: InputMaybe<Scalars['Bytes']['input']>;
  owner_not_contains?: InputMaybe<Scalars['Bytes']['input']>;
  owner_not_in?: InputMaybe<Array<Scalars['Bytes']['input']>>;
  position?: InputMaybe<Scalars['String']['input']>;
  position_?: InputMaybe<Position_Filter>;
  position_contains?: InputMaybe<Scalars['String']['input']>;
  position_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  position_ends_with?: InputMaybe<Scalars['String']['input']>;
  position_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  position_gt?: InputMaybe<Scalars['String']['input']>;
  position_gte?: InputMaybe<Scalars['String']['input']>;
  position_in?: InputMaybe<Array<Scalars['String']['input']>>;
  position_lt?: InputMaybe<Scalars['String']['input']>;
  position_lte?: InputMaybe<Scalars['String']['input']>;
  position_not?: InputMaybe<Scalars['String']['input']>;
  position_not_contains?: InputMaybe<Scalars['String']['input']>;
  position_not_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  position_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  position_not_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  position_not_in?: InputMaybe<Array<Scalars['String']['input']>>;
  position_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  position_not_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  position_starts_with?: InputMaybe<Scalars['String']['input']>;
  position_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  positions?: InputMaybe<Array<Scalars['String']['input']>>;
  positions_?: InputMaybe<Position_Filter>;
  positions_contains?: InputMaybe<Array<Scalars['String']['input']>>;
  positions_contains_nocase?: InputMaybe<Array<Scalars['String']['input']>>;
  positions_not?: InputMaybe<Array<Scalars['String']['input']>>;
  positions_not_contains?: InputMaybe<Array<Scalars['String']['input']>>;
  positions_not_contains_nocase?: InputMaybe<Array<Scalars['String']['input']>>;
  triggers_?: InputMaybe<Trigger_Filter>;
  vaultId?: InputMaybe<Scalars['BigInt']['input']>;
  vaultId_gt?: InputMaybe<Scalars['BigInt']['input']>;
  vaultId_gte?: InputMaybe<Scalars['BigInt']['input']>;
  vaultId_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  vaultId_lt?: InputMaybe<Scalars['BigInt']['input']>;
  vaultId_lte?: InputMaybe<Scalars['BigInt']['input']>;
  vaultId_not?: InputMaybe<Scalars['BigInt']['input']>;
  vaultId_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
};

export enum Proxy_OrderBy {
  Id = 'id',
  IsDpm = 'isDPM',
  Owner = 'owner',
  Position = 'position',
  PositionAccount = 'position__account',
  PositionCollateral = 'position__collateral',
  PositionCollateralAddress = 'position__collateralAddress',
  PositionCumulativeDeposit = 'position__cumulativeDeposit',
  PositionCumulativeDepositInCollateralToken = 'position__cumulativeDepositInCollateralToken',
  PositionCumulativeDepositInQuoteToken = 'position__cumulativeDepositInQuoteToken',
  PositionCumulativeDepositUsd = 'position__cumulativeDepositUSD',
  PositionCumulativeFees = 'position__cumulativeFees',
  PositionCumulativeFeesInCollateralToken = 'position__cumulativeFeesInCollateralToken',
  PositionCumulativeFeesInQuoteToken = 'position__cumulativeFeesInQuoteToken',
  PositionCumulativeFeesUsd = 'position__cumulativeFeesUSD',
  PositionCumulativeWithdraw = 'position__cumulativeWithdraw',
  PositionCumulativeWithdrawInCollateralToken = 'position__cumulativeWithdrawInCollateralToken',
  PositionCumulativeWithdrawInQuoteToken = 'position__cumulativeWithdrawInQuoteToken',
  PositionCumulativeWithdrawUsd = 'position__cumulativeWithdrawUSD',
  PositionDebt = 'position__debt',
  PositionDebtAddress = 'position__debtAddress',
  PositionFromEvent = 'position__fromEvent',
  PositionId = 'position__id',
  PositionProtocol = 'position__protocol',
  PositionType = 'position__type',
  Positions = 'positions',
  Triggers = 'triggers',
  VaultId = 'vaultId'
}

export type Query = {
  __typename?: 'Query';
  /** Access to subgraph metadata */
  _meta?: Maybe<_Meta_>;
  aaveLikeBorrow?: Maybe<AaveLikeBorrow>;
  aaveLikeBorrows: Array<AaveLikeBorrow>;
  aaveLikeDeposit?: Maybe<AaveLikeDeposit>;
  aaveLikeDeposits: Array<AaveLikeDeposit>;
  aaveLikeLiquidation?: Maybe<AaveLikeLiquidation>;
  aaveLikeLiquidations: Array<AaveLikeLiquidation>;
  aaveLikeRepay?: Maybe<AaveLikeRepay>;
  aaveLikeRepays: Array<AaveLikeRepay>;
  aaveLikeWithdraw?: Maybe<AaveLikeWithdraw>;
  aaveLikeWithdraws: Array<AaveLikeWithdraw>;
  assetSwap?: Maybe<AssetSwap>;
  assetSwaps: Array<AssetSwap>;
  feePaid?: Maybe<FeePaid>;
  feePaids: Array<FeePaid>;
  interestRate?: Maybe<InterestRate>;
  interestRateConfig?: Maybe<InterestRateConfig>;
  interestRateConfigs: Array<InterestRateConfig>;
  interestRates: Array<InterestRate>;
  position?: Maybe<Position>;
  positionEvent?: Maybe<PositionEvent>;
  positionEvents: Array<PositionEvent>;
  positions: Array<Position>;
  proxies: Array<Proxy>;
  proxy?: Maybe<Proxy>;
  registeredOperation?: Maybe<RegisteredOperation>;
  registeredOperations: Array<RegisteredOperation>;
  slippageSaved?: Maybe<SlippageSaved>;
  slippageSaveds: Array<SlippageSaved>;
  token?: Maybe<Token>;
  tokens: Array<Token>;
  transfer?: Maybe<Transfer>;
  transfers: Array<Transfer>;
  trigger?: Maybe<Trigger>;
  triggers: Array<Trigger>;
};


export type Query_MetaArgs = {
  block?: InputMaybe<Block_Height>;
};


export type QueryAaveLikeBorrowArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars['ID']['input'];
  subgraphError?: _SubgraphErrorPolicy_;
};


export type QueryAaveLikeBorrowsArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<AaveLikeBorrow_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<AaveLikeBorrow_Filter>;
};


export type QueryAaveLikeDepositArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars['ID']['input'];
  subgraphError?: _SubgraphErrorPolicy_;
};


export type QueryAaveLikeDepositsArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<AaveLikeDeposit_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<AaveLikeDeposit_Filter>;
};


export type QueryAaveLikeLiquidationArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars['ID']['input'];
  subgraphError?: _SubgraphErrorPolicy_;
};


export type QueryAaveLikeLiquidationsArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<AaveLikeLiquidation_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<AaveLikeLiquidation_Filter>;
};


export type QueryAaveLikeRepayArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars['ID']['input'];
  subgraphError?: _SubgraphErrorPolicy_;
};


export type QueryAaveLikeRepaysArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<AaveLikeRepay_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<AaveLikeRepay_Filter>;
};


export type QueryAaveLikeWithdrawArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars['ID']['input'];
  subgraphError?: _SubgraphErrorPolicy_;
};


export type QueryAaveLikeWithdrawsArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<AaveLikeWithdraw_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<AaveLikeWithdraw_Filter>;
};


export type QueryAssetSwapArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars['ID']['input'];
  subgraphError?: _SubgraphErrorPolicy_;
};


export type QueryAssetSwapsArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<AssetSwap_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<AssetSwap_Filter>;
};


export type QueryFeePaidArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars['ID']['input'];
  subgraphError?: _SubgraphErrorPolicy_;
};


export type QueryFeePaidsArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<FeePaid_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<FeePaid_Filter>;
};


export type QueryInterestRateArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars['ID']['input'];
  subgraphError?: _SubgraphErrorPolicy_;
};


export type QueryInterestRateConfigArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars['ID']['input'];
  subgraphError?: _SubgraphErrorPolicy_;
};


export type QueryInterestRateConfigsArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<InterestRateConfig_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<InterestRateConfig_Filter>;
};


export type QueryInterestRatesArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<InterestRate_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<InterestRate_Filter>;
};


export type QueryPositionArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars['ID']['input'];
  subgraphError?: _SubgraphErrorPolicy_;
};


export type QueryPositionEventArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars['ID']['input'];
  subgraphError?: _SubgraphErrorPolicy_;
};


export type QueryPositionEventsArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<PositionEvent_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<PositionEvent_Filter>;
};


export type QueryPositionsArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Position_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<Position_Filter>;
};


export type QueryProxiesArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Proxy_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<Proxy_Filter>;
};


export type QueryProxyArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars['ID']['input'];
  subgraphError?: _SubgraphErrorPolicy_;
};


export type QueryRegisteredOperationArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars['ID']['input'];
  subgraphError?: _SubgraphErrorPolicy_;
};


export type QueryRegisteredOperationsArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<RegisteredOperation_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<RegisteredOperation_Filter>;
};


export type QuerySlippageSavedArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars['ID']['input'];
  subgraphError?: _SubgraphErrorPolicy_;
};


export type QuerySlippageSavedsArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<SlippageSaved_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<SlippageSaved_Filter>;
};


export type QueryTokenArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars['ID']['input'];
  subgraphError?: _SubgraphErrorPolicy_;
};


export type QueryTokensArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Token_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<Token_Filter>;
};


export type QueryTransferArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars['ID']['input'];
  subgraphError?: _SubgraphErrorPolicy_;
};


export type QueryTransfersArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Transfer_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<Transfer_Filter>;
};


export type QueryTriggerArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars['ID']['input'];
  subgraphError?: _SubgraphErrorPolicy_;
};


export type QueryTriggersArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Trigger_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<Trigger_Filter>;
};

export type RegisteredOperation = {
  __typename?: 'RegisteredOperation';
  actions: Array<Scalars['Bytes']['output']>;
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  skipped: Array<Scalars['Boolean']['output']>;
};

export type RegisteredOperation_Filter = {
  /** Filter for the block changed event. */
  _change_block?: InputMaybe<BlockChangedFilter>;
  actions?: InputMaybe<Array<Scalars['Bytes']['input']>>;
  actions_contains?: InputMaybe<Array<Scalars['Bytes']['input']>>;
  actions_contains_nocase?: InputMaybe<Array<Scalars['Bytes']['input']>>;
  actions_not?: InputMaybe<Array<Scalars['Bytes']['input']>>;
  actions_not_contains?: InputMaybe<Array<Scalars['Bytes']['input']>>;
  actions_not_contains_nocase?: InputMaybe<Array<Scalars['Bytes']['input']>>;
  and?: InputMaybe<Array<InputMaybe<RegisteredOperation_Filter>>>;
  id?: InputMaybe<Scalars['ID']['input']>;
  id_gt?: InputMaybe<Scalars['ID']['input']>;
  id_gte?: InputMaybe<Scalars['ID']['input']>;
  id_in?: InputMaybe<Array<Scalars['ID']['input']>>;
  id_lt?: InputMaybe<Scalars['ID']['input']>;
  id_lte?: InputMaybe<Scalars['ID']['input']>;
  id_not?: InputMaybe<Scalars['ID']['input']>;
  id_not_in?: InputMaybe<Array<Scalars['ID']['input']>>;
  name?: InputMaybe<Scalars['String']['input']>;
  name_contains?: InputMaybe<Scalars['String']['input']>;
  name_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  name_ends_with?: InputMaybe<Scalars['String']['input']>;
  name_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  name_gt?: InputMaybe<Scalars['String']['input']>;
  name_gte?: InputMaybe<Scalars['String']['input']>;
  name_in?: InputMaybe<Array<Scalars['String']['input']>>;
  name_lt?: InputMaybe<Scalars['String']['input']>;
  name_lte?: InputMaybe<Scalars['String']['input']>;
  name_not?: InputMaybe<Scalars['String']['input']>;
  name_not_contains?: InputMaybe<Scalars['String']['input']>;
  name_not_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  name_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  name_not_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  name_not_in?: InputMaybe<Array<Scalars['String']['input']>>;
  name_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  name_not_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  name_starts_with?: InputMaybe<Scalars['String']['input']>;
  name_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  or?: InputMaybe<Array<InputMaybe<RegisteredOperation_Filter>>>;
  skipped?: InputMaybe<Array<Scalars['Boolean']['input']>>;
  skipped_contains?: InputMaybe<Array<Scalars['Boolean']['input']>>;
  skipped_contains_nocase?: InputMaybe<Array<Scalars['Boolean']['input']>>;
  skipped_not?: InputMaybe<Array<Scalars['Boolean']['input']>>;
  skipped_not_contains?: InputMaybe<Array<Scalars['Boolean']['input']>>;
  skipped_not_contains_nocase?: InputMaybe<Array<Scalars['Boolean']['input']>>;
};

export enum RegisteredOperation_OrderBy {
  Actions = 'actions',
  Id = 'id',
  Name = 'name',
  Skipped = 'skipped'
}

export type SlippageSaved = {
  __typename?: 'SlippageSaved';
  actualAmount: Scalars['BigInt']['output'];
  /**
   * id is a tx_hash-actionLogIndex
   * it uses action log index to easily combine all swap events into one
   *
   */
  id: Scalars['ID']['output'];
  minimumPossible: Scalars['BigInt']['output'];
};

export type SlippageSaved_Filter = {
  /** Filter for the block changed event. */
  _change_block?: InputMaybe<BlockChangedFilter>;
  actualAmount?: InputMaybe<Scalars['BigInt']['input']>;
  actualAmount_gt?: InputMaybe<Scalars['BigInt']['input']>;
  actualAmount_gte?: InputMaybe<Scalars['BigInt']['input']>;
  actualAmount_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  actualAmount_lt?: InputMaybe<Scalars['BigInt']['input']>;
  actualAmount_lte?: InputMaybe<Scalars['BigInt']['input']>;
  actualAmount_not?: InputMaybe<Scalars['BigInt']['input']>;
  actualAmount_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  and?: InputMaybe<Array<InputMaybe<SlippageSaved_Filter>>>;
  id?: InputMaybe<Scalars['ID']['input']>;
  id_gt?: InputMaybe<Scalars['ID']['input']>;
  id_gte?: InputMaybe<Scalars['ID']['input']>;
  id_in?: InputMaybe<Array<Scalars['ID']['input']>>;
  id_lt?: InputMaybe<Scalars['ID']['input']>;
  id_lte?: InputMaybe<Scalars['ID']['input']>;
  id_not?: InputMaybe<Scalars['ID']['input']>;
  id_not_in?: InputMaybe<Array<Scalars['ID']['input']>>;
  minimumPossible?: InputMaybe<Scalars['BigInt']['input']>;
  minimumPossible_gt?: InputMaybe<Scalars['BigInt']['input']>;
  minimumPossible_gte?: InputMaybe<Scalars['BigInt']['input']>;
  minimumPossible_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  minimumPossible_lt?: InputMaybe<Scalars['BigInt']['input']>;
  minimumPossible_lte?: InputMaybe<Scalars['BigInt']['input']>;
  minimumPossible_not?: InputMaybe<Scalars['BigInt']['input']>;
  minimumPossible_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  or?: InputMaybe<Array<InputMaybe<SlippageSaved_Filter>>>;
};

export enum SlippageSaved_OrderBy {
  ActualAmount = 'actualAmount',
  Id = 'id',
  MinimumPossible = 'minimumPossible'
}

export type Subscription = {
  __typename?: 'Subscription';
  /** Access to subgraph metadata */
  _meta?: Maybe<_Meta_>;
  aaveLikeBorrow?: Maybe<AaveLikeBorrow>;
  aaveLikeBorrows: Array<AaveLikeBorrow>;
  aaveLikeDeposit?: Maybe<AaveLikeDeposit>;
  aaveLikeDeposits: Array<AaveLikeDeposit>;
  aaveLikeLiquidation?: Maybe<AaveLikeLiquidation>;
  aaveLikeLiquidations: Array<AaveLikeLiquidation>;
  aaveLikeRepay?: Maybe<AaveLikeRepay>;
  aaveLikeRepays: Array<AaveLikeRepay>;
  aaveLikeWithdraw?: Maybe<AaveLikeWithdraw>;
  aaveLikeWithdraws: Array<AaveLikeWithdraw>;
  assetSwap?: Maybe<AssetSwap>;
  assetSwaps: Array<AssetSwap>;
  feePaid?: Maybe<FeePaid>;
  feePaids: Array<FeePaid>;
  interestRate?: Maybe<InterestRate>;
  interestRateConfig?: Maybe<InterestRateConfig>;
  interestRateConfigs: Array<InterestRateConfig>;
  interestRates: Array<InterestRate>;
  position?: Maybe<Position>;
  positionEvent?: Maybe<PositionEvent>;
  positionEvents: Array<PositionEvent>;
  positions: Array<Position>;
  proxies: Array<Proxy>;
  proxy?: Maybe<Proxy>;
  registeredOperation?: Maybe<RegisteredOperation>;
  registeredOperations: Array<RegisteredOperation>;
  slippageSaved?: Maybe<SlippageSaved>;
  slippageSaveds: Array<SlippageSaved>;
  token?: Maybe<Token>;
  tokens: Array<Token>;
  transfer?: Maybe<Transfer>;
  transfers: Array<Transfer>;
  trigger?: Maybe<Trigger>;
  triggers: Array<Trigger>;
};


export type Subscription_MetaArgs = {
  block?: InputMaybe<Block_Height>;
};


export type SubscriptionAaveLikeBorrowArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars['ID']['input'];
  subgraphError?: _SubgraphErrorPolicy_;
};


export type SubscriptionAaveLikeBorrowsArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<AaveLikeBorrow_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<AaveLikeBorrow_Filter>;
};


export type SubscriptionAaveLikeDepositArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars['ID']['input'];
  subgraphError?: _SubgraphErrorPolicy_;
};


export type SubscriptionAaveLikeDepositsArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<AaveLikeDeposit_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<AaveLikeDeposit_Filter>;
};


export type SubscriptionAaveLikeLiquidationArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars['ID']['input'];
  subgraphError?: _SubgraphErrorPolicy_;
};


export type SubscriptionAaveLikeLiquidationsArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<AaveLikeLiquidation_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<AaveLikeLiquidation_Filter>;
};


export type SubscriptionAaveLikeRepayArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars['ID']['input'];
  subgraphError?: _SubgraphErrorPolicy_;
};


export type SubscriptionAaveLikeRepaysArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<AaveLikeRepay_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<AaveLikeRepay_Filter>;
};


export type SubscriptionAaveLikeWithdrawArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars['ID']['input'];
  subgraphError?: _SubgraphErrorPolicy_;
};


export type SubscriptionAaveLikeWithdrawsArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<AaveLikeWithdraw_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<AaveLikeWithdraw_Filter>;
};


export type SubscriptionAssetSwapArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars['ID']['input'];
  subgraphError?: _SubgraphErrorPolicy_;
};


export type SubscriptionAssetSwapsArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<AssetSwap_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<AssetSwap_Filter>;
};


export type SubscriptionFeePaidArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars['ID']['input'];
  subgraphError?: _SubgraphErrorPolicy_;
};


export type SubscriptionFeePaidsArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<FeePaid_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<FeePaid_Filter>;
};


export type SubscriptionInterestRateArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars['ID']['input'];
  subgraphError?: _SubgraphErrorPolicy_;
};


export type SubscriptionInterestRateConfigArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars['ID']['input'];
  subgraphError?: _SubgraphErrorPolicy_;
};


export type SubscriptionInterestRateConfigsArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<InterestRateConfig_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<InterestRateConfig_Filter>;
};


export type SubscriptionInterestRatesArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<InterestRate_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<InterestRate_Filter>;
};


export type SubscriptionPositionArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars['ID']['input'];
  subgraphError?: _SubgraphErrorPolicy_;
};


export type SubscriptionPositionEventArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars['ID']['input'];
  subgraphError?: _SubgraphErrorPolicy_;
};


export type SubscriptionPositionEventsArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<PositionEvent_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<PositionEvent_Filter>;
};


export type SubscriptionPositionsArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Position_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<Position_Filter>;
};


export type SubscriptionProxiesArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Proxy_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<Proxy_Filter>;
};


export type SubscriptionProxyArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars['ID']['input'];
  subgraphError?: _SubgraphErrorPolicy_;
};


export type SubscriptionRegisteredOperationArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars['ID']['input'];
  subgraphError?: _SubgraphErrorPolicy_;
};


export type SubscriptionRegisteredOperationsArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<RegisteredOperation_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<RegisteredOperation_Filter>;
};


export type SubscriptionSlippageSavedArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars['ID']['input'];
  subgraphError?: _SubgraphErrorPolicy_;
};


export type SubscriptionSlippageSavedsArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<SlippageSaved_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<SlippageSaved_Filter>;
};


export type SubscriptionTokenArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars['ID']['input'];
  subgraphError?: _SubgraphErrorPolicy_;
};


export type SubscriptionTokensArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Token_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<Token_Filter>;
};


export type SubscriptionTransferArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars['ID']['input'];
  subgraphError?: _SubgraphErrorPolicy_;
};


export type SubscriptionTransfersArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Transfer_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<Transfer_Filter>;
};


export type SubscriptionTriggerArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars['ID']['input'];
  subgraphError?: _SubgraphErrorPolicy_;
};


export type SubscriptionTriggersArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Trigger_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<Trigger_Filter>;
};

export type Token = {
  __typename?: 'Token';
  address: Scalars['Bytes']['output'];
  decimals: Scalars['BigInt']['output'];
  id: Scalars['ID']['output'];
  precision: Scalars['String']['output'];
  symbol: Scalars['String']['output'];
};

export type Token_Filter = {
  /** Filter for the block changed event. */
  _change_block?: InputMaybe<BlockChangedFilter>;
  address?: InputMaybe<Scalars['Bytes']['input']>;
  address_contains?: InputMaybe<Scalars['Bytes']['input']>;
  address_gt?: InputMaybe<Scalars['Bytes']['input']>;
  address_gte?: InputMaybe<Scalars['Bytes']['input']>;
  address_in?: InputMaybe<Array<Scalars['Bytes']['input']>>;
  address_lt?: InputMaybe<Scalars['Bytes']['input']>;
  address_lte?: InputMaybe<Scalars['Bytes']['input']>;
  address_not?: InputMaybe<Scalars['Bytes']['input']>;
  address_not_contains?: InputMaybe<Scalars['Bytes']['input']>;
  address_not_in?: InputMaybe<Array<Scalars['Bytes']['input']>>;
  and?: InputMaybe<Array<InputMaybe<Token_Filter>>>;
  decimals?: InputMaybe<Scalars['BigInt']['input']>;
  decimals_gt?: InputMaybe<Scalars['BigInt']['input']>;
  decimals_gte?: InputMaybe<Scalars['BigInt']['input']>;
  decimals_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  decimals_lt?: InputMaybe<Scalars['BigInt']['input']>;
  decimals_lte?: InputMaybe<Scalars['BigInt']['input']>;
  decimals_not?: InputMaybe<Scalars['BigInt']['input']>;
  decimals_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  id?: InputMaybe<Scalars['ID']['input']>;
  id_gt?: InputMaybe<Scalars['ID']['input']>;
  id_gte?: InputMaybe<Scalars['ID']['input']>;
  id_in?: InputMaybe<Array<Scalars['ID']['input']>>;
  id_lt?: InputMaybe<Scalars['ID']['input']>;
  id_lte?: InputMaybe<Scalars['ID']['input']>;
  id_not?: InputMaybe<Scalars['ID']['input']>;
  id_not_in?: InputMaybe<Array<Scalars['ID']['input']>>;
  or?: InputMaybe<Array<InputMaybe<Token_Filter>>>;
  precision?: InputMaybe<Scalars['String']['input']>;
  precision_contains?: InputMaybe<Scalars['String']['input']>;
  precision_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  precision_ends_with?: InputMaybe<Scalars['String']['input']>;
  precision_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  precision_gt?: InputMaybe<Scalars['String']['input']>;
  precision_gte?: InputMaybe<Scalars['String']['input']>;
  precision_in?: InputMaybe<Array<Scalars['String']['input']>>;
  precision_lt?: InputMaybe<Scalars['String']['input']>;
  precision_lte?: InputMaybe<Scalars['String']['input']>;
  precision_not?: InputMaybe<Scalars['String']['input']>;
  precision_not_contains?: InputMaybe<Scalars['String']['input']>;
  precision_not_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  precision_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  precision_not_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  precision_not_in?: InputMaybe<Array<Scalars['String']['input']>>;
  precision_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  precision_not_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  precision_starts_with?: InputMaybe<Scalars['String']['input']>;
  precision_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  symbol?: InputMaybe<Scalars['String']['input']>;
  symbol_contains?: InputMaybe<Scalars['String']['input']>;
  symbol_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  symbol_ends_with?: InputMaybe<Scalars['String']['input']>;
  symbol_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  symbol_gt?: InputMaybe<Scalars['String']['input']>;
  symbol_gte?: InputMaybe<Scalars['String']['input']>;
  symbol_in?: InputMaybe<Array<Scalars['String']['input']>>;
  symbol_lt?: InputMaybe<Scalars['String']['input']>;
  symbol_lte?: InputMaybe<Scalars['String']['input']>;
  symbol_not?: InputMaybe<Scalars['String']['input']>;
  symbol_not_contains?: InputMaybe<Scalars['String']['input']>;
  symbol_not_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  symbol_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  symbol_not_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  symbol_not_in?: InputMaybe<Array<Scalars['String']['input']>>;
  symbol_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  symbol_not_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  symbol_starts_with?: InputMaybe<Scalars['String']['input']>;
  symbol_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
};

export enum Token_OrderBy {
  Address = 'address',
  Decimals = 'decimals',
  Id = 'id',
  Precision = 'precision',
  Symbol = 'symbol'
}

export type Transfer = {
  __typename?: 'Transfer';
  amount: Scalars['BigDecimal']['output'];
  amountUSD: Scalars['BigDecimal']['output'];
  event: PositionEvent;
  from: Scalars['Bytes']['output'];
  id: Scalars['ID']['output'];
  priceInUSD: Scalars['BigDecimal']['output'];
  to: Scalars['Bytes']['output'];
  token: Scalars['Bytes']['output'];
  txHash: Scalars['String']['output'];
};

export type Transfer_Filter = {
  /** Filter for the block changed event. */
  _change_block?: InputMaybe<BlockChangedFilter>;
  amount?: InputMaybe<Scalars['BigDecimal']['input']>;
  amountUSD?: InputMaybe<Scalars['BigDecimal']['input']>;
  amountUSD_gt?: InputMaybe<Scalars['BigDecimal']['input']>;
  amountUSD_gte?: InputMaybe<Scalars['BigDecimal']['input']>;
  amountUSD_in?: InputMaybe<Array<Scalars['BigDecimal']['input']>>;
  amountUSD_lt?: InputMaybe<Scalars['BigDecimal']['input']>;
  amountUSD_lte?: InputMaybe<Scalars['BigDecimal']['input']>;
  amountUSD_not?: InputMaybe<Scalars['BigDecimal']['input']>;
  amountUSD_not_in?: InputMaybe<Array<Scalars['BigDecimal']['input']>>;
  amount_gt?: InputMaybe<Scalars['BigDecimal']['input']>;
  amount_gte?: InputMaybe<Scalars['BigDecimal']['input']>;
  amount_in?: InputMaybe<Array<Scalars['BigDecimal']['input']>>;
  amount_lt?: InputMaybe<Scalars['BigDecimal']['input']>;
  amount_lte?: InputMaybe<Scalars['BigDecimal']['input']>;
  amount_not?: InputMaybe<Scalars['BigDecimal']['input']>;
  amount_not_in?: InputMaybe<Array<Scalars['BigDecimal']['input']>>;
  and?: InputMaybe<Array<InputMaybe<Transfer_Filter>>>;
  event?: InputMaybe<Scalars['String']['input']>;
  event_?: InputMaybe<PositionEvent_Filter>;
  event_contains?: InputMaybe<Scalars['String']['input']>;
  event_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  event_ends_with?: InputMaybe<Scalars['String']['input']>;
  event_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  event_gt?: InputMaybe<Scalars['String']['input']>;
  event_gte?: InputMaybe<Scalars['String']['input']>;
  event_in?: InputMaybe<Array<Scalars['String']['input']>>;
  event_lt?: InputMaybe<Scalars['String']['input']>;
  event_lte?: InputMaybe<Scalars['String']['input']>;
  event_not?: InputMaybe<Scalars['String']['input']>;
  event_not_contains?: InputMaybe<Scalars['String']['input']>;
  event_not_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  event_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  event_not_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  event_not_in?: InputMaybe<Array<Scalars['String']['input']>>;
  event_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  event_not_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  event_starts_with?: InputMaybe<Scalars['String']['input']>;
  event_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  from?: InputMaybe<Scalars['Bytes']['input']>;
  from_contains?: InputMaybe<Scalars['Bytes']['input']>;
  from_gt?: InputMaybe<Scalars['Bytes']['input']>;
  from_gte?: InputMaybe<Scalars['Bytes']['input']>;
  from_in?: InputMaybe<Array<Scalars['Bytes']['input']>>;
  from_lt?: InputMaybe<Scalars['Bytes']['input']>;
  from_lte?: InputMaybe<Scalars['Bytes']['input']>;
  from_not?: InputMaybe<Scalars['Bytes']['input']>;
  from_not_contains?: InputMaybe<Scalars['Bytes']['input']>;
  from_not_in?: InputMaybe<Array<Scalars['Bytes']['input']>>;
  id?: InputMaybe<Scalars['ID']['input']>;
  id_gt?: InputMaybe<Scalars['ID']['input']>;
  id_gte?: InputMaybe<Scalars['ID']['input']>;
  id_in?: InputMaybe<Array<Scalars['ID']['input']>>;
  id_lt?: InputMaybe<Scalars['ID']['input']>;
  id_lte?: InputMaybe<Scalars['ID']['input']>;
  id_not?: InputMaybe<Scalars['ID']['input']>;
  id_not_in?: InputMaybe<Array<Scalars['ID']['input']>>;
  or?: InputMaybe<Array<InputMaybe<Transfer_Filter>>>;
  priceInUSD?: InputMaybe<Scalars['BigDecimal']['input']>;
  priceInUSD_gt?: InputMaybe<Scalars['BigDecimal']['input']>;
  priceInUSD_gte?: InputMaybe<Scalars['BigDecimal']['input']>;
  priceInUSD_in?: InputMaybe<Array<Scalars['BigDecimal']['input']>>;
  priceInUSD_lt?: InputMaybe<Scalars['BigDecimal']['input']>;
  priceInUSD_lte?: InputMaybe<Scalars['BigDecimal']['input']>;
  priceInUSD_not?: InputMaybe<Scalars['BigDecimal']['input']>;
  priceInUSD_not_in?: InputMaybe<Array<Scalars['BigDecimal']['input']>>;
  to?: InputMaybe<Scalars['Bytes']['input']>;
  to_contains?: InputMaybe<Scalars['Bytes']['input']>;
  to_gt?: InputMaybe<Scalars['Bytes']['input']>;
  to_gte?: InputMaybe<Scalars['Bytes']['input']>;
  to_in?: InputMaybe<Array<Scalars['Bytes']['input']>>;
  to_lt?: InputMaybe<Scalars['Bytes']['input']>;
  to_lte?: InputMaybe<Scalars['Bytes']['input']>;
  to_not?: InputMaybe<Scalars['Bytes']['input']>;
  to_not_contains?: InputMaybe<Scalars['Bytes']['input']>;
  to_not_in?: InputMaybe<Array<Scalars['Bytes']['input']>>;
  token?: InputMaybe<Scalars['Bytes']['input']>;
  token_contains?: InputMaybe<Scalars['Bytes']['input']>;
  token_gt?: InputMaybe<Scalars['Bytes']['input']>;
  token_gte?: InputMaybe<Scalars['Bytes']['input']>;
  token_in?: InputMaybe<Array<Scalars['Bytes']['input']>>;
  token_lt?: InputMaybe<Scalars['Bytes']['input']>;
  token_lte?: InputMaybe<Scalars['Bytes']['input']>;
  token_not?: InputMaybe<Scalars['Bytes']['input']>;
  token_not_contains?: InputMaybe<Scalars['Bytes']['input']>;
  token_not_in?: InputMaybe<Array<Scalars['Bytes']['input']>>;
  txHash?: InputMaybe<Scalars['String']['input']>;
  txHash_contains?: InputMaybe<Scalars['String']['input']>;
  txHash_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  txHash_ends_with?: InputMaybe<Scalars['String']['input']>;
  txHash_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  txHash_gt?: InputMaybe<Scalars['String']['input']>;
  txHash_gte?: InputMaybe<Scalars['String']['input']>;
  txHash_in?: InputMaybe<Array<Scalars['String']['input']>>;
  txHash_lt?: InputMaybe<Scalars['String']['input']>;
  txHash_lte?: InputMaybe<Scalars['String']['input']>;
  txHash_not?: InputMaybe<Scalars['String']['input']>;
  txHash_not_contains?: InputMaybe<Scalars['String']['input']>;
  txHash_not_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  txHash_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  txHash_not_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  txHash_not_in?: InputMaybe<Array<Scalars['String']['input']>>;
  txHash_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  txHash_not_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  txHash_starts_with?: InputMaybe<Scalars['String']['input']>;
  txHash_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
};

export enum Transfer_OrderBy {
  Amount = 'amount',
  AmountUsd = 'amountUSD',
  Event = 'event',
  EventAccount = 'event__account',
  EventBlockNumber = 'event__blockNumber',
  EventCollateralAddress = 'event__collateralAddress',
  EventCollateralAfter = 'event__collateralAfter',
  EventCollateralBefore = 'event__collateralBefore',
  EventCollateralDelta = 'event__collateralDelta',
  EventCollateralOraclePrice = 'event__collateralOraclePrice',
  EventCollateralTokenPriceUsd = 'event__collateralTokenPriceUSD',
  EventDebtAddress = 'event__debtAddress',
  EventDebtAfter = 'event__debtAfter',
  EventDebtBefore = 'event__debtBefore',
  EventDebtDelta = 'event__debtDelta',
  EventDebtOraclePrice = 'event__debtOraclePrice',
  EventDebtTokenPriceUsd = 'event__debtTokenPriceUSD',
  EventDepositedUsd = 'event__depositedUSD',
  EventEthPrice = 'event__ethPrice',
  EventGasFeeUsd = 'event__gasFeeUSD',
  EventGasPrice = 'event__gasPrice',
  EventGasUsed = 'event__gasUsed',
  EventHealthFactorAfter = 'event__healthFactorAfter',
  EventId = 'event__id',
  EventIsAutomation = 'event__isAutomation',
  EventKind = 'event__kind',
  EventLiquidationPriceAfter = 'event__liquidationPriceAfter',
  EventLiquidationPriceBefore = 'event__liquidationPriceBefore',
  EventLiquidationThreshold = 'event__liquidationThreshold',
  EventLtvAfter = 'event__ltvAfter',
  EventLtvBefore = 'event__ltvBefore',
  EventMarketPrice = 'event__marketPrice',
  EventMultipleAfter = 'event__multipleAfter',
  EventMultipleBefore = 'event__multipleBefore',
  EventNetValueAfter = 'event__netValueAfter',
  EventNetValueBefore = 'event__netValueBefore',
  EventOasisFee = 'event__oasisFee',
  EventOasisFeeToken = 'event__oasisFeeToken',
  EventOasisFeeUsd = 'event__oasisFeeUSD',
  EventSummerFee = 'event__summerFee',
  EventSummerFeeToken = 'event__summerFeeToken',
  EventSummerFeeUsd = 'event__summerFeeUSD',
  EventSwapFromAmount = 'event__swapFromAmount',
  EventSwapFromToken = 'event__swapFromToken',
  EventSwapToAmount = 'event__swapToAmount',
  EventSwapToToken = 'event__swapToToken',
  EventTimestamp = 'event__timestamp',
  EventTotalFee = 'event__totalFee',
  EventTxHash = 'event__txHash',
  EventWithdrawnUsd = 'event__withdrawnUSD',
  From = 'from',
  Id = 'id',
  PriceInUsd = 'priceInUSD',
  To = 'to',
  Token = 'token',
  TxHash = 'txHash'
}

export type Trigger = {
  __typename?: 'Trigger';
  account: Proxy;
  addedBlock: Scalars['BigInt']['output'];
  addedLogIndex: Scalars['BigInt']['output'];
  addedTimestamp: Scalars['BigInt']['output'];
  addedTransaction: Scalars['Bytes']['output'];
  commandAddress: Scalars['Bytes']['output'];
  decodedData?: Maybe<Array<Scalars['String']['output']>>;
  decodedDataNames?: Maybe<Array<Scalars['String']['output']>>;
  executedBlock?: Maybe<Scalars['BigInt']['output']>;
  executedLogIndex?: Maybe<Scalars['BigInt']['output']>;
  executedTimestamp?: Maybe<Scalars['BigInt']['output']>;
  executedTransaction?: Maybe<Scalars['Bytes']['output']>;
  id: Scalars['ID']['output'];
  kind: Scalars['String']['output'];
  removedBlock?: Maybe<Scalars['BigInt']['output']>;
  removedLogIndex?: Maybe<Scalars['BigInt']['output']>;
  removedTimestamp?: Maybe<Scalars['BigInt']['output']>;
  removedTransaction?: Maybe<Scalars['Bytes']['output']>;
  triggerData: Scalars['Bytes']['output'];
  triggerType: Scalars['BigInt']['output'];
};

export type Trigger_Filter = {
  /** Filter for the block changed event. */
  _change_block?: InputMaybe<BlockChangedFilter>;
  account?: InputMaybe<Scalars['String']['input']>;
  account_?: InputMaybe<Proxy_Filter>;
  account_contains?: InputMaybe<Scalars['String']['input']>;
  account_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  account_ends_with?: InputMaybe<Scalars['String']['input']>;
  account_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  account_gt?: InputMaybe<Scalars['String']['input']>;
  account_gte?: InputMaybe<Scalars['String']['input']>;
  account_in?: InputMaybe<Array<Scalars['String']['input']>>;
  account_lt?: InputMaybe<Scalars['String']['input']>;
  account_lte?: InputMaybe<Scalars['String']['input']>;
  account_not?: InputMaybe<Scalars['String']['input']>;
  account_not_contains?: InputMaybe<Scalars['String']['input']>;
  account_not_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  account_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  account_not_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  account_not_in?: InputMaybe<Array<Scalars['String']['input']>>;
  account_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  account_not_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  account_starts_with?: InputMaybe<Scalars['String']['input']>;
  account_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  addedBlock?: InputMaybe<Scalars['BigInt']['input']>;
  addedBlock_gt?: InputMaybe<Scalars['BigInt']['input']>;
  addedBlock_gte?: InputMaybe<Scalars['BigInt']['input']>;
  addedBlock_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  addedBlock_lt?: InputMaybe<Scalars['BigInt']['input']>;
  addedBlock_lte?: InputMaybe<Scalars['BigInt']['input']>;
  addedBlock_not?: InputMaybe<Scalars['BigInt']['input']>;
  addedBlock_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  addedLogIndex?: InputMaybe<Scalars['BigInt']['input']>;
  addedLogIndex_gt?: InputMaybe<Scalars['BigInt']['input']>;
  addedLogIndex_gte?: InputMaybe<Scalars['BigInt']['input']>;
  addedLogIndex_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  addedLogIndex_lt?: InputMaybe<Scalars['BigInt']['input']>;
  addedLogIndex_lte?: InputMaybe<Scalars['BigInt']['input']>;
  addedLogIndex_not?: InputMaybe<Scalars['BigInt']['input']>;
  addedLogIndex_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  addedTimestamp?: InputMaybe<Scalars['BigInt']['input']>;
  addedTimestamp_gt?: InputMaybe<Scalars['BigInt']['input']>;
  addedTimestamp_gte?: InputMaybe<Scalars['BigInt']['input']>;
  addedTimestamp_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  addedTimestamp_lt?: InputMaybe<Scalars['BigInt']['input']>;
  addedTimestamp_lte?: InputMaybe<Scalars['BigInt']['input']>;
  addedTimestamp_not?: InputMaybe<Scalars['BigInt']['input']>;
  addedTimestamp_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  addedTransaction?: InputMaybe<Scalars['Bytes']['input']>;
  addedTransaction_contains?: InputMaybe<Scalars['Bytes']['input']>;
  addedTransaction_gt?: InputMaybe<Scalars['Bytes']['input']>;
  addedTransaction_gte?: InputMaybe<Scalars['Bytes']['input']>;
  addedTransaction_in?: InputMaybe<Array<Scalars['Bytes']['input']>>;
  addedTransaction_lt?: InputMaybe<Scalars['Bytes']['input']>;
  addedTransaction_lte?: InputMaybe<Scalars['Bytes']['input']>;
  addedTransaction_not?: InputMaybe<Scalars['Bytes']['input']>;
  addedTransaction_not_contains?: InputMaybe<Scalars['Bytes']['input']>;
  addedTransaction_not_in?: InputMaybe<Array<Scalars['Bytes']['input']>>;
  and?: InputMaybe<Array<InputMaybe<Trigger_Filter>>>;
  commandAddress?: InputMaybe<Scalars['Bytes']['input']>;
  commandAddress_contains?: InputMaybe<Scalars['Bytes']['input']>;
  commandAddress_gt?: InputMaybe<Scalars['Bytes']['input']>;
  commandAddress_gte?: InputMaybe<Scalars['Bytes']['input']>;
  commandAddress_in?: InputMaybe<Array<Scalars['Bytes']['input']>>;
  commandAddress_lt?: InputMaybe<Scalars['Bytes']['input']>;
  commandAddress_lte?: InputMaybe<Scalars['Bytes']['input']>;
  commandAddress_not?: InputMaybe<Scalars['Bytes']['input']>;
  commandAddress_not_contains?: InputMaybe<Scalars['Bytes']['input']>;
  commandAddress_not_in?: InputMaybe<Array<Scalars['Bytes']['input']>>;
  decodedData?: InputMaybe<Array<Scalars['String']['input']>>;
  decodedDataNames?: InputMaybe<Array<Scalars['String']['input']>>;
  decodedDataNames_contains?: InputMaybe<Array<Scalars['String']['input']>>;
  decodedDataNames_contains_nocase?: InputMaybe<Array<Scalars['String']['input']>>;
  decodedDataNames_not?: InputMaybe<Array<Scalars['String']['input']>>;
  decodedDataNames_not_contains?: InputMaybe<Array<Scalars['String']['input']>>;
  decodedDataNames_not_contains_nocase?: InputMaybe<Array<Scalars['String']['input']>>;
  decodedData_contains?: InputMaybe<Array<Scalars['String']['input']>>;
  decodedData_contains_nocase?: InputMaybe<Array<Scalars['String']['input']>>;
  decodedData_not?: InputMaybe<Array<Scalars['String']['input']>>;
  decodedData_not_contains?: InputMaybe<Array<Scalars['String']['input']>>;
  decodedData_not_contains_nocase?: InputMaybe<Array<Scalars['String']['input']>>;
  executedBlock?: InputMaybe<Scalars['BigInt']['input']>;
  executedBlock_gt?: InputMaybe<Scalars['BigInt']['input']>;
  executedBlock_gte?: InputMaybe<Scalars['BigInt']['input']>;
  executedBlock_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  executedBlock_lt?: InputMaybe<Scalars['BigInt']['input']>;
  executedBlock_lte?: InputMaybe<Scalars['BigInt']['input']>;
  executedBlock_not?: InputMaybe<Scalars['BigInt']['input']>;
  executedBlock_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  executedLogIndex?: InputMaybe<Scalars['BigInt']['input']>;
  executedLogIndex_gt?: InputMaybe<Scalars['BigInt']['input']>;
  executedLogIndex_gte?: InputMaybe<Scalars['BigInt']['input']>;
  executedLogIndex_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  executedLogIndex_lt?: InputMaybe<Scalars['BigInt']['input']>;
  executedLogIndex_lte?: InputMaybe<Scalars['BigInt']['input']>;
  executedLogIndex_not?: InputMaybe<Scalars['BigInt']['input']>;
  executedLogIndex_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  executedTimestamp?: InputMaybe<Scalars['BigInt']['input']>;
  executedTimestamp_gt?: InputMaybe<Scalars['BigInt']['input']>;
  executedTimestamp_gte?: InputMaybe<Scalars['BigInt']['input']>;
  executedTimestamp_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  executedTimestamp_lt?: InputMaybe<Scalars['BigInt']['input']>;
  executedTimestamp_lte?: InputMaybe<Scalars['BigInt']['input']>;
  executedTimestamp_not?: InputMaybe<Scalars['BigInt']['input']>;
  executedTimestamp_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  executedTransaction?: InputMaybe<Scalars['Bytes']['input']>;
  executedTransaction_contains?: InputMaybe<Scalars['Bytes']['input']>;
  executedTransaction_gt?: InputMaybe<Scalars['Bytes']['input']>;
  executedTransaction_gte?: InputMaybe<Scalars['Bytes']['input']>;
  executedTransaction_in?: InputMaybe<Array<Scalars['Bytes']['input']>>;
  executedTransaction_lt?: InputMaybe<Scalars['Bytes']['input']>;
  executedTransaction_lte?: InputMaybe<Scalars['Bytes']['input']>;
  executedTransaction_not?: InputMaybe<Scalars['Bytes']['input']>;
  executedTransaction_not_contains?: InputMaybe<Scalars['Bytes']['input']>;
  executedTransaction_not_in?: InputMaybe<Array<Scalars['Bytes']['input']>>;
  id?: InputMaybe<Scalars['ID']['input']>;
  id_gt?: InputMaybe<Scalars['ID']['input']>;
  id_gte?: InputMaybe<Scalars['ID']['input']>;
  id_in?: InputMaybe<Array<Scalars['ID']['input']>>;
  id_lt?: InputMaybe<Scalars['ID']['input']>;
  id_lte?: InputMaybe<Scalars['ID']['input']>;
  id_not?: InputMaybe<Scalars['ID']['input']>;
  id_not_in?: InputMaybe<Array<Scalars['ID']['input']>>;
  kind?: InputMaybe<Scalars['String']['input']>;
  kind_contains?: InputMaybe<Scalars['String']['input']>;
  kind_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  kind_ends_with?: InputMaybe<Scalars['String']['input']>;
  kind_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  kind_gt?: InputMaybe<Scalars['String']['input']>;
  kind_gte?: InputMaybe<Scalars['String']['input']>;
  kind_in?: InputMaybe<Array<Scalars['String']['input']>>;
  kind_lt?: InputMaybe<Scalars['String']['input']>;
  kind_lte?: InputMaybe<Scalars['String']['input']>;
  kind_not?: InputMaybe<Scalars['String']['input']>;
  kind_not_contains?: InputMaybe<Scalars['String']['input']>;
  kind_not_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  kind_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  kind_not_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  kind_not_in?: InputMaybe<Array<Scalars['String']['input']>>;
  kind_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  kind_not_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  kind_starts_with?: InputMaybe<Scalars['String']['input']>;
  kind_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  or?: InputMaybe<Array<InputMaybe<Trigger_Filter>>>;
  removedBlock?: InputMaybe<Scalars['BigInt']['input']>;
  removedBlock_gt?: InputMaybe<Scalars['BigInt']['input']>;
  removedBlock_gte?: InputMaybe<Scalars['BigInt']['input']>;
  removedBlock_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  removedBlock_lt?: InputMaybe<Scalars['BigInt']['input']>;
  removedBlock_lte?: InputMaybe<Scalars['BigInt']['input']>;
  removedBlock_not?: InputMaybe<Scalars['BigInt']['input']>;
  removedBlock_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  removedLogIndex?: InputMaybe<Scalars['BigInt']['input']>;
  removedLogIndex_gt?: InputMaybe<Scalars['BigInt']['input']>;
  removedLogIndex_gte?: InputMaybe<Scalars['BigInt']['input']>;
  removedLogIndex_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  removedLogIndex_lt?: InputMaybe<Scalars['BigInt']['input']>;
  removedLogIndex_lte?: InputMaybe<Scalars['BigInt']['input']>;
  removedLogIndex_not?: InputMaybe<Scalars['BigInt']['input']>;
  removedLogIndex_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  removedTimestamp?: InputMaybe<Scalars['BigInt']['input']>;
  removedTimestamp_gt?: InputMaybe<Scalars['BigInt']['input']>;
  removedTimestamp_gte?: InputMaybe<Scalars['BigInt']['input']>;
  removedTimestamp_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  removedTimestamp_lt?: InputMaybe<Scalars['BigInt']['input']>;
  removedTimestamp_lte?: InputMaybe<Scalars['BigInt']['input']>;
  removedTimestamp_not?: InputMaybe<Scalars['BigInt']['input']>;
  removedTimestamp_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  removedTransaction?: InputMaybe<Scalars['Bytes']['input']>;
  removedTransaction_contains?: InputMaybe<Scalars['Bytes']['input']>;
  removedTransaction_gt?: InputMaybe<Scalars['Bytes']['input']>;
  removedTransaction_gte?: InputMaybe<Scalars['Bytes']['input']>;
  removedTransaction_in?: InputMaybe<Array<Scalars['Bytes']['input']>>;
  removedTransaction_lt?: InputMaybe<Scalars['Bytes']['input']>;
  removedTransaction_lte?: InputMaybe<Scalars['Bytes']['input']>;
  removedTransaction_not?: InputMaybe<Scalars['Bytes']['input']>;
  removedTransaction_not_contains?: InputMaybe<Scalars['Bytes']['input']>;
  removedTransaction_not_in?: InputMaybe<Array<Scalars['Bytes']['input']>>;
  triggerData?: InputMaybe<Scalars['Bytes']['input']>;
  triggerData_contains?: InputMaybe<Scalars['Bytes']['input']>;
  triggerData_gt?: InputMaybe<Scalars['Bytes']['input']>;
  triggerData_gte?: InputMaybe<Scalars['Bytes']['input']>;
  triggerData_in?: InputMaybe<Array<Scalars['Bytes']['input']>>;
  triggerData_lt?: InputMaybe<Scalars['Bytes']['input']>;
  triggerData_lte?: InputMaybe<Scalars['Bytes']['input']>;
  triggerData_not?: InputMaybe<Scalars['Bytes']['input']>;
  triggerData_not_contains?: InputMaybe<Scalars['Bytes']['input']>;
  triggerData_not_in?: InputMaybe<Array<Scalars['Bytes']['input']>>;
  triggerType?: InputMaybe<Scalars['BigInt']['input']>;
  triggerType_gt?: InputMaybe<Scalars['BigInt']['input']>;
  triggerType_gte?: InputMaybe<Scalars['BigInt']['input']>;
  triggerType_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  triggerType_lt?: InputMaybe<Scalars['BigInt']['input']>;
  triggerType_lte?: InputMaybe<Scalars['BigInt']['input']>;
  triggerType_not?: InputMaybe<Scalars['BigInt']['input']>;
  triggerType_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
};

export enum Trigger_OrderBy {
  Account = 'account',
  AccountId = 'account__id',
  AccountIsDpm = 'account__isDPM',
  AccountOwner = 'account__owner',
  AccountVaultId = 'account__vaultId',
  AddedBlock = 'addedBlock',
  AddedLogIndex = 'addedLogIndex',
  AddedTimestamp = 'addedTimestamp',
  AddedTransaction = 'addedTransaction',
  CommandAddress = 'commandAddress',
  DecodedData = 'decodedData',
  DecodedDataNames = 'decodedDataNames',
  ExecutedBlock = 'executedBlock',
  ExecutedLogIndex = 'executedLogIndex',
  ExecutedTimestamp = 'executedTimestamp',
  ExecutedTransaction = 'executedTransaction',
  Id = 'id',
  Kind = 'kind',
  RemovedBlock = 'removedBlock',
  RemovedLogIndex = 'removedLogIndex',
  RemovedTimestamp = 'removedTimestamp',
  RemovedTransaction = 'removedTransaction',
  TriggerData = 'triggerData',
  TriggerType = 'triggerType'
}

export type _Block_ = {
  __typename?: '_Block_';
  /** The hash of the block */
  hash?: Maybe<Scalars['Bytes']['output']>;
  /** The block number */
  number: Scalars['Int']['output'];
  /** The hash of the parent block */
  parentHash?: Maybe<Scalars['Bytes']['output']>;
  /** Integer representation of the timestamp stored in blocks for the chain */
  timestamp?: Maybe<Scalars['Int']['output']>;
};

/** The type for the top-level _meta field */
export type _Meta_ = {
  __typename?: '_Meta_';
  /**
   * Information about a specific subgraph block. The hash of the block
   * will be null if the _meta field has a block constraint that asks for
   * a block number. It will be filled if the _meta field has no block constraint
   * and therefore asks for the latest  block
   *
   */
  block: _Block_;
  /** The deployment ID */
  deployment: Scalars['String']['output'];
  /** If `true`, the subgraph encountered indexing errors at some past block */
  hasIndexingErrors: Scalars['Boolean']['output'];
};

export enum _SubgraphErrorPolicy_ {
  /** Data will be returned even if the subgraph has indexing errors */
  Allow = 'allow',
  /** If the subgraph has indexing errors, data will be omitted. The default. */
  Deny = 'deny'
}

export type GetPositionQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type GetPositionQuery = { __typename?: 'Query', position?: { __typename?: 'Position', events: Array<{ __typename?: 'PositionEvent', kind: string, blockNumber: bigint, timestamp: bigint, swapToToken?: string | null, swapToAmount?: string | null, swapFromToken?: string | null, swapFromAmount?: string | null, collateralBefore: string, collateralAfter: string, collateralDelta: string, debtBefore: string, debtAfter: string, debtDelta: string, collateralToken?: { __typename?: 'Token', address: string, symbol: string, decimals: bigint } | null, debtToken?: { __typename?: 'Token', address: string, symbol: string, decimals: bigint } | null }> } | null };


export const GetPositionDocument = gql`
    query GetPosition($id: ID!) {
  position(id: $id) {
    events(first: 10000, orderBy: blockNumber, orderDirection: desc) {
      kind
      blockNumber
      timestamp
      collateralToken {
        address
        symbol
        decimals
      }
      debtToken {
        address
        symbol
        decimals
      }
      swapToToken
      swapToAmount
      swapFromToken
      swapFromAmount
      collateralBefore
      collateralAfter
      collateralDelta
      debtBefore
      debtAfter
      debtDelta
    }
  }
}
    `;

export type SdkFunctionWrapper = <T>(action: (requestHeaders?:Record<string, string>) => Promise<T>, operationName: string, operationType?: string, variables?: any) => Promise<T>;


const defaultWrapper: SdkFunctionWrapper = (action, _operationName, _operationType, _variables) => action();

export function getSdk(client: GraphQLClient, withWrapper: SdkFunctionWrapper = defaultWrapper) {
  return {
    GetPosition(variables: GetPositionQueryVariables, requestHeaders?: GraphQLClientRequestHeaders): Promise<GetPositionQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetPositionQuery>(GetPositionDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'GetPosition', 'query', variables);
    }
  };
}
export type Sdk = ReturnType<typeof getSdk>;