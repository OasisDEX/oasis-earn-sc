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

export type Account = {
  __typename?: 'Account';
  address: Scalars['Bytes']['output'];
  borrowPositions?: Maybe<Array<BorrowPosition>>;
  collateralToken?: Maybe<Scalars['Bytes']['output']>;
  createEvents?: Maybe<Array<CreatePositionEvent>>;
  debtToken?: Maybe<Scalars['Bytes']['output']>;
  earnPositions?: Maybe<Array<EarnPosition>>;
  id: Scalars['Bytes']['output'];
  isDPM: Scalars['Boolean']['output'];
  nfts?: Maybe<Array<Nft>>;
  positionType?: Maybe<Scalars['String']['output']>;
  protocol?: Maybe<Scalars['String']['output']>;
  user: User;
  vaultId: Scalars['BigInt']['output'];
};


export type AccountBorrowPositionsArgs = {
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<BorrowPosition_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  where?: InputMaybe<BorrowPosition_Filter>;
};


export type AccountCreateEventsArgs = {
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<CreatePositionEvent_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  where?: InputMaybe<CreatePositionEvent_Filter>;
};


export type AccountEarnPositionsArgs = {
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<EarnPosition_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  where?: InputMaybe<EarnPosition_Filter>;
};


export type AccountNftsArgs = {
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Nft_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  where?: InputMaybe<Nft_Filter>;
};

export type Account_Filter = {
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
  and?: InputMaybe<Array<InputMaybe<Account_Filter>>>;
  borrowPositions_?: InputMaybe<BorrowPosition_Filter>;
  collateralToken?: InputMaybe<Scalars['Bytes']['input']>;
  collateralToken_contains?: InputMaybe<Scalars['Bytes']['input']>;
  collateralToken_gt?: InputMaybe<Scalars['Bytes']['input']>;
  collateralToken_gte?: InputMaybe<Scalars['Bytes']['input']>;
  collateralToken_in?: InputMaybe<Array<Scalars['Bytes']['input']>>;
  collateralToken_lt?: InputMaybe<Scalars['Bytes']['input']>;
  collateralToken_lte?: InputMaybe<Scalars['Bytes']['input']>;
  collateralToken_not?: InputMaybe<Scalars['Bytes']['input']>;
  collateralToken_not_contains?: InputMaybe<Scalars['Bytes']['input']>;
  collateralToken_not_in?: InputMaybe<Array<Scalars['Bytes']['input']>>;
  createEvents_?: InputMaybe<CreatePositionEvent_Filter>;
  debtToken?: InputMaybe<Scalars['Bytes']['input']>;
  debtToken_contains?: InputMaybe<Scalars['Bytes']['input']>;
  debtToken_gt?: InputMaybe<Scalars['Bytes']['input']>;
  debtToken_gte?: InputMaybe<Scalars['Bytes']['input']>;
  debtToken_in?: InputMaybe<Array<Scalars['Bytes']['input']>>;
  debtToken_lt?: InputMaybe<Scalars['Bytes']['input']>;
  debtToken_lte?: InputMaybe<Scalars['Bytes']['input']>;
  debtToken_not?: InputMaybe<Scalars['Bytes']['input']>;
  debtToken_not_contains?: InputMaybe<Scalars['Bytes']['input']>;
  debtToken_not_in?: InputMaybe<Array<Scalars['Bytes']['input']>>;
  earnPositions_?: InputMaybe<EarnPosition_Filter>;
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
  isDPM?: InputMaybe<Scalars['Boolean']['input']>;
  isDPM_in?: InputMaybe<Array<Scalars['Boolean']['input']>>;
  isDPM_not?: InputMaybe<Scalars['Boolean']['input']>;
  isDPM_not_in?: InputMaybe<Array<Scalars['Boolean']['input']>>;
  nfts_?: InputMaybe<Nft_Filter>;
  or?: InputMaybe<Array<InputMaybe<Account_Filter>>>;
  positionType?: InputMaybe<Scalars['String']['input']>;
  positionType_contains?: InputMaybe<Scalars['String']['input']>;
  positionType_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  positionType_ends_with?: InputMaybe<Scalars['String']['input']>;
  positionType_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  positionType_gt?: InputMaybe<Scalars['String']['input']>;
  positionType_gte?: InputMaybe<Scalars['String']['input']>;
  positionType_in?: InputMaybe<Array<Scalars['String']['input']>>;
  positionType_lt?: InputMaybe<Scalars['String']['input']>;
  positionType_lte?: InputMaybe<Scalars['String']['input']>;
  positionType_not?: InputMaybe<Scalars['String']['input']>;
  positionType_not_contains?: InputMaybe<Scalars['String']['input']>;
  positionType_not_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  positionType_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  positionType_not_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  positionType_not_in?: InputMaybe<Array<Scalars['String']['input']>>;
  positionType_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  positionType_not_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  positionType_starts_with?: InputMaybe<Scalars['String']['input']>;
  positionType_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
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
  user?: InputMaybe<Scalars['String']['input']>;
  user_?: InputMaybe<User_Filter>;
  user_contains?: InputMaybe<Scalars['String']['input']>;
  user_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  user_ends_with?: InputMaybe<Scalars['String']['input']>;
  user_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  user_gt?: InputMaybe<Scalars['String']['input']>;
  user_gte?: InputMaybe<Scalars['String']['input']>;
  user_in?: InputMaybe<Array<Scalars['String']['input']>>;
  user_lt?: InputMaybe<Scalars['String']['input']>;
  user_lte?: InputMaybe<Scalars['String']['input']>;
  user_not?: InputMaybe<Scalars['String']['input']>;
  user_not_contains?: InputMaybe<Scalars['String']['input']>;
  user_not_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  user_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  user_not_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  user_not_in?: InputMaybe<Array<Scalars['String']['input']>>;
  user_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  user_not_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  user_starts_with?: InputMaybe<Scalars['String']['input']>;
  user_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  vaultId?: InputMaybe<Scalars['BigInt']['input']>;
  vaultId_gt?: InputMaybe<Scalars['BigInt']['input']>;
  vaultId_gte?: InputMaybe<Scalars['BigInt']['input']>;
  vaultId_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  vaultId_lt?: InputMaybe<Scalars['BigInt']['input']>;
  vaultId_lte?: InputMaybe<Scalars['BigInt']['input']>;
  vaultId_not?: InputMaybe<Scalars['BigInt']['input']>;
  vaultId_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
};

export enum Account_OrderBy {
  Address = 'address',
  BorrowPositions = 'borrowPositions',
  CollateralToken = 'collateralToken',
  CreateEvents = 'createEvents',
  DebtToken = 'debtToken',
  EarnPositions = 'earnPositions',
  Id = 'id',
  IsDpm = 'isDPM',
  Nfts = 'nfts',
  PositionType = 'positionType',
  Protocol = 'protocol',
  User = 'user',
  UserAddress = 'user__address',
  UserId = 'user__id',
  UserVaultCount = 'user__vaultCount',
  VaultId = 'vaultId'
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
  id: Scalars['Bytes']['output'];
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

export type Auction = {
  __typename?: 'Auction';
  account?: Maybe<Account>;
  bondSize: Scalars['BigInt']['output'];
  collateral: Scalars['BigInt']['output'];
  debtToCover: Scalars['BigInt']['output'];
  endOfGracePeriod: Scalars['BigInt']['output'];
  hpbOnKick?: Maybe<Scalars['BigInt']['output']>;
  id: Scalars['ID']['output'];
  inLiquidation: Scalars['Boolean']['output'];
  isCollateralized: Scalars['Boolean']['output'];
  kickTime: Scalars['BigInt']['output'];
  kicker?: Maybe<Scalars['String']['output']>;
  neutralPrice: Scalars['BigInt']['output'];
  pool: Pool;
  position: BorrowPosition;
  price: Scalars['BigInt']['output'];
  referencePrice: Scalars['BigInt']['output'];
  user?: Maybe<User>;
};

export type Auction_Filter = {
  /** Filter for the block changed event. */
  _change_block?: InputMaybe<BlockChangedFilter>;
  account?: InputMaybe<Scalars['String']['input']>;
  account_?: InputMaybe<Account_Filter>;
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
  and?: InputMaybe<Array<InputMaybe<Auction_Filter>>>;
  bondSize?: InputMaybe<Scalars['BigInt']['input']>;
  bondSize_gt?: InputMaybe<Scalars['BigInt']['input']>;
  bondSize_gte?: InputMaybe<Scalars['BigInt']['input']>;
  bondSize_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  bondSize_lt?: InputMaybe<Scalars['BigInt']['input']>;
  bondSize_lte?: InputMaybe<Scalars['BigInt']['input']>;
  bondSize_not?: InputMaybe<Scalars['BigInt']['input']>;
  bondSize_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  collateral?: InputMaybe<Scalars['BigInt']['input']>;
  collateral_gt?: InputMaybe<Scalars['BigInt']['input']>;
  collateral_gte?: InputMaybe<Scalars['BigInt']['input']>;
  collateral_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  collateral_lt?: InputMaybe<Scalars['BigInt']['input']>;
  collateral_lte?: InputMaybe<Scalars['BigInt']['input']>;
  collateral_not?: InputMaybe<Scalars['BigInt']['input']>;
  collateral_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  debtToCover?: InputMaybe<Scalars['BigInt']['input']>;
  debtToCover_gt?: InputMaybe<Scalars['BigInt']['input']>;
  debtToCover_gte?: InputMaybe<Scalars['BigInt']['input']>;
  debtToCover_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  debtToCover_lt?: InputMaybe<Scalars['BigInt']['input']>;
  debtToCover_lte?: InputMaybe<Scalars['BigInt']['input']>;
  debtToCover_not?: InputMaybe<Scalars['BigInt']['input']>;
  debtToCover_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  endOfGracePeriod?: InputMaybe<Scalars['BigInt']['input']>;
  endOfGracePeriod_gt?: InputMaybe<Scalars['BigInt']['input']>;
  endOfGracePeriod_gte?: InputMaybe<Scalars['BigInt']['input']>;
  endOfGracePeriod_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  endOfGracePeriod_lt?: InputMaybe<Scalars['BigInt']['input']>;
  endOfGracePeriod_lte?: InputMaybe<Scalars['BigInt']['input']>;
  endOfGracePeriod_not?: InputMaybe<Scalars['BigInt']['input']>;
  endOfGracePeriod_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  hpbOnKick?: InputMaybe<Scalars['BigInt']['input']>;
  hpbOnKick_gt?: InputMaybe<Scalars['BigInt']['input']>;
  hpbOnKick_gte?: InputMaybe<Scalars['BigInt']['input']>;
  hpbOnKick_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  hpbOnKick_lt?: InputMaybe<Scalars['BigInt']['input']>;
  hpbOnKick_lte?: InputMaybe<Scalars['BigInt']['input']>;
  hpbOnKick_not?: InputMaybe<Scalars['BigInt']['input']>;
  hpbOnKick_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  id?: InputMaybe<Scalars['ID']['input']>;
  id_gt?: InputMaybe<Scalars['ID']['input']>;
  id_gte?: InputMaybe<Scalars['ID']['input']>;
  id_in?: InputMaybe<Array<Scalars['ID']['input']>>;
  id_lt?: InputMaybe<Scalars['ID']['input']>;
  id_lte?: InputMaybe<Scalars['ID']['input']>;
  id_not?: InputMaybe<Scalars['ID']['input']>;
  id_not_in?: InputMaybe<Array<Scalars['ID']['input']>>;
  inLiquidation?: InputMaybe<Scalars['Boolean']['input']>;
  inLiquidation_in?: InputMaybe<Array<Scalars['Boolean']['input']>>;
  inLiquidation_not?: InputMaybe<Scalars['Boolean']['input']>;
  inLiquidation_not_in?: InputMaybe<Array<Scalars['Boolean']['input']>>;
  isCollateralized?: InputMaybe<Scalars['Boolean']['input']>;
  isCollateralized_in?: InputMaybe<Array<Scalars['Boolean']['input']>>;
  isCollateralized_not?: InputMaybe<Scalars['Boolean']['input']>;
  isCollateralized_not_in?: InputMaybe<Array<Scalars['Boolean']['input']>>;
  kickTime?: InputMaybe<Scalars['BigInt']['input']>;
  kickTime_gt?: InputMaybe<Scalars['BigInt']['input']>;
  kickTime_gte?: InputMaybe<Scalars['BigInt']['input']>;
  kickTime_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  kickTime_lt?: InputMaybe<Scalars['BigInt']['input']>;
  kickTime_lte?: InputMaybe<Scalars['BigInt']['input']>;
  kickTime_not?: InputMaybe<Scalars['BigInt']['input']>;
  kickTime_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  kicker?: InputMaybe<Scalars['String']['input']>;
  kicker_contains?: InputMaybe<Scalars['String']['input']>;
  kicker_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  kicker_ends_with?: InputMaybe<Scalars['String']['input']>;
  kicker_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  kicker_gt?: InputMaybe<Scalars['String']['input']>;
  kicker_gte?: InputMaybe<Scalars['String']['input']>;
  kicker_in?: InputMaybe<Array<Scalars['String']['input']>>;
  kicker_lt?: InputMaybe<Scalars['String']['input']>;
  kicker_lte?: InputMaybe<Scalars['String']['input']>;
  kicker_not?: InputMaybe<Scalars['String']['input']>;
  kicker_not_contains?: InputMaybe<Scalars['String']['input']>;
  kicker_not_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  kicker_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  kicker_not_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  kicker_not_in?: InputMaybe<Array<Scalars['String']['input']>>;
  kicker_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  kicker_not_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  kicker_starts_with?: InputMaybe<Scalars['String']['input']>;
  kicker_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  neutralPrice?: InputMaybe<Scalars['BigInt']['input']>;
  neutralPrice_gt?: InputMaybe<Scalars['BigInt']['input']>;
  neutralPrice_gte?: InputMaybe<Scalars['BigInt']['input']>;
  neutralPrice_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  neutralPrice_lt?: InputMaybe<Scalars['BigInt']['input']>;
  neutralPrice_lte?: InputMaybe<Scalars['BigInt']['input']>;
  neutralPrice_not?: InputMaybe<Scalars['BigInt']['input']>;
  neutralPrice_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  or?: InputMaybe<Array<InputMaybe<Auction_Filter>>>;
  pool?: InputMaybe<Scalars['String']['input']>;
  pool_?: InputMaybe<Pool_Filter>;
  pool_contains?: InputMaybe<Scalars['String']['input']>;
  pool_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  pool_ends_with?: InputMaybe<Scalars['String']['input']>;
  pool_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  pool_gt?: InputMaybe<Scalars['String']['input']>;
  pool_gte?: InputMaybe<Scalars['String']['input']>;
  pool_in?: InputMaybe<Array<Scalars['String']['input']>>;
  pool_lt?: InputMaybe<Scalars['String']['input']>;
  pool_lte?: InputMaybe<Scalars['String']['input']>;
  pool_not?: InputMaybe<Scalars['String']['input']>;
  pool_not_contains?: InputMaybe<Scalars['String']['input']>;
  pool_not_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  pool_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  pool_not_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  pool_not_in?: InputMaybe<Array<Scalars['String']['input']>>;
  pool_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  pool_not_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  pool_starts_with?: InputMaybe<Scalars['String']['input']>;
  pool_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  position?: InputMaybe<Scalars['String']['input']>;
  position_?: InputMaybe<BorrowPosition_Filter>;
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
  price?: InputMaybe<Scalars['BigInt']['input']>;
  price_gt?: InputMaybe<Scalars['BigInt']['input']>;
  price_gte?: InputMaybe<Scalars['BigInt']['input']>;
  price_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  price_lt?: InputMaybe<Scalars['BigInt']['input']>;
  price_lte?: InputMaybe<Scalars['BigInt']['input']>;
  price_not?: InputMaybe<Scalars['BigInt']['input']>;
  price_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  referencePrice?: InputMaybe<Scalars['BigInt']['input']>;
  referencePrice_gt?: InputMaybe<Scalars['BigInt']['input']>;
  referencePrice_gte?: InputMaybe<Scalars['BigInt']['input']>;
  referencePrice_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  referencePrice_lt?: InputMaybe<Scalars['BigInt']['input']>;
  referencePrice_lte?: InputMaybe<Scalars['BigInt']['input']>;
  referencePrice_not?: InputMaybe<Scalars['BigInt']['input']>;
  referencePrice_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  user?: InputMaybe<Scalars['String']['input']>;
  user_?: InputMaybe<User_Filter>;
  user_contains?: InputMaybe<Scalars['String']['input']>;
  user_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  user_ends_with?: InputMaybe<Scalars['String']['input']>;
  user_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  user_gt?: InputMaybe<Scalars['String']['input']>;
  user_gte?: InputMaybe<Scalars['String']['input']>;
  user_in?: InputMaybe<Array<Scalars['String']['input']>>;
  user_lt?: InputMaybe<Scalars['String']['input']>;
  user_lte?: InputMaybe<Scalars['String']['input']>;
  user_not?: InputMaybe<Scalars['String']['input']>;
  user_not_contains?: InputMaybe<Scalars['String']['input']>;
  user_not_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  user_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  user_not_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  user_not_in?: InputMaybe<Array<Scalars['String']['input']>>;
  user_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  user_not_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  user_starts_with?: InputMaybe<Scalars['String']['input']>;
  user_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
};

export enum Auction_OrderBy {
  Account = 'account',
  AccountAddress = 'account__address',
  AccountCollateralToken = 'account__collateralToken',
  AccountDebtToken = 'account__debtToken',
  AccountId = 'account__id',
  AccountIsDpm = 'account__isDPM',
  AccountPositionType = 'account__positionType',
  AccountProtocol = 'account__protocol',
  AccountVaultId = 'account__vaultId',
  BondSize = 'bondSize',
  Collateral = 'collateral',
  DebtToCover = 'debtToCover',
  EndOfGracePeriod = 'endOfGracePeriod',
  HpbOnKick = 'hpbOnKick',
  Id = 'id',
  InLiquidation = 'inLiquidation',
  IsCollateralized = 'isCollateralized',
  KickTime = 'kickTime',
  Kicker = 'kicker',
  NeutralPrice = 'neutralPrice',
  Pool = 'pool',
  PoolAccuredDebt = 'pool__accuredDebt',
  PoolAddress = 'pool__address',
  PoolApr7dAverage = 'pool__apr7dAverage',
  PoolApr30dAverage = 'pool__apr30dAverage',
  PoolAuctionPrice = 'pool__auctionPrice',
  PoolBorrowApr = 'pool__borrowApr',
  PoolBorrowDailyTokenBlocks = 'pool__borrowDailyTokenBlocks',
  PoolClaimableReserves = 'pool__claimableReserves',
  PoolClaimableReservesRemaining = 'pool__claimableReservesRemaining',
  PoolCollateralAddress = 'pool__collateralAddress',
  PoolCollateralScale = 'pool__collateralScale',
  PoolCurrentBurnEpoch = 'pool__currentBurnEpoch',
  PoolDailyPercentageRate30dAverage = 'pool__dailyPercentageRate30dAverage',
  PoolDebt = 'pool__debt',
  PoolDebtInAuctions = 'pool__debtInAuctions',
  PoolDepositSize = 'pool__depositSize',
  PoolEarnDailyTokenBlocks = 'pool__earnDailyTokenBlocks',
  PoolHpb = 'pool__hpb',
  PoolHpbIndex = 'pool__hpbIndex',
  PoolHtp = 'pool__htp',
  PoolHtpIndex = 'pool__htpIndex',
  PoolId = 'pool__id',
  PoolInterestRate = 'pool__interestRate',
  PoolLastInterestRateUpdate = 'pool__lastInterestRateUpdate',
  PoolLendApr = 'pool__lendApr',
  PoolLendApr7dAverage = 'pool__lendApr7dAverage',
  PoolLendApr30dAverage = 'pool__lendApr30dAverage',
  PoolLendDailyPercentageRate30dAverage = 'pool__lendDailyPercentageRate30dAverage',
  PoolLendMonthlyPercentageRate30dAverage = 'pool__lendMonthlyPercentageRate30dAverage',
  PoolLoansCount = 'pool__loansCount',
  PoolLup = 'pool__lup',
  PoolLupIndex = 'pool__lupIndex',
  PoolMonthlyPercentageRate30dAverage = 'pool__monthlyPercentageRate30dAverage',
  PoolName = 'pool__name',
  PoolPoolActualUtilization = 'pool__poolActualUtilization',
  PoolPoolCollateralization = 'pool__poolCollateralization',
  PoolPoolMinDebtAmount = 'pool__poolMinDebtAmount',
  PoolPoolTargetUtilization = 'pool__poolTargetUtilization',
  PoolQuoteTokenAddress = 'pool__quoteTokenAddress',
  PoolQuoteTokenScale = 'pool__quoteTokenScale',
  PoolReserves = 'pool__reserves',
  PoolSummerDepositAmountEarningInterest = 'pool__summerDepositAmountEarningInterest',
  PoolT0debt = 'pool__t0debt',
  PoolTimeRemaining = 'pool__timeRemaining',
  PoolTotalAuctionsInPool = 'pool__totalAuctionsInPool',
  Position = 'position',
  PositionBorrowCumulativeCollateralDeposit = 'position__borrowCumulativeCollateralDeposit',
  PositionBorrowCumulativeCollateralWithdraw = 'position__borrowCumulativeCollateralWithdraw',
  PositionBorrowCumulativeDebtDeposit = 'position__borrowCumulativeDebtDeposit',
  PositionBorrowCumulativeDebtWithdraw = 'position__borrowCumulativeDebtWithdraw',
  PositionBorrowCumulativeDepositInCollateralToken = 'position__borrowCumulativeDepositInCollateralToken',
  PositionBorrowCumulativeDepositInQuoteToken = 'position__borrowCumulativeDepositInQuoteToken',
  PositionBorrowCumulativeDepositUsd = 'position__borrowCumulativeDepositUSD',
  PositionBorrowCumulativeFeesInCollateralToken = 'position__borrowCumulativeFeesInCollateralToken',
  PositionBorrowCumulativeFeesInQuoteToken = 'position__borrowCumulativeFeesInQuoteToken',
  PositionBorrowCumulativeFeesUsd = 'position__borrowCumulativeFeesUSD',
  PositionBorrowCumulativeWithdrawInCollateralToken = 'position__borrowCumulativeWithdrawInCollateralToken',
  PositionBorrowCumulativeWithdrawInQuoteToken = 'position__borrowCumulativeWithdrawInQuoteToken',
  PositionBorrowCumulativeWithdrawUsd = 'position__borrowCumulativeWithdrawUSD',
  PositionBorrowDailyTokenBlocks = 'position__borrowDailyTokenBlocks',
  PositionBorrowLastUpdateBlock = 'position__borrowLastUpdateBlock',
  PositionCollateral = 'position__collateral',
  PositionDebt = 'position__debt',
  PositionId = 'position__id',
  PositionLiquidationPrice = 'position__liquidationPrice',
  PositionT0Debt = 'position__t0Debt',
  PositionT0Np = 'position__t0Np_',
  Price = 'price',
  ReferencePrice = 'referencePrice',
  User = 'user',
  UserAddress = 'user__address',
  UserId = 'user__id',
  UserVaultCount = 'user__vaultCount'
}

export type BlockChangedFilter = {
  number_gte: Scalars['Int']['input'];
};

export type Block_Height = {
  hash?: InputMaybe<Scalars['Bytes']['input']>;
  number?: InputMaybe<Scalars['Int']['input']>;
  number_gte?: InputMaybe<Scalars['Int']['input']>;
};

export type BorrowDailyReward = {
  __typename?: 'BorrowDailyReward';
  account?: Maybe<Account>;
  day: Day;
  id: Scalars['ID']['output'];
  pool: Pool;
  reward: Scalars['BigDecimal']['output'];
  user?: Maybe<User>;
  week: Week;
};

export type BorrowDailyReward_Filter = {
  /** Filter for the block changed event. */
  _change_block?: InputMaybe<BlockChangedFilter>;
  account?: InputMaybe<Scalars['String']['input']>;
  account_?: InputMaybe<Account_Filter>;
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
  and?: InputMaybe<Array<InputMaybe<BorrowDailyReward_Filter>>>;
  day?: InputMaybe<Scalars['String']['input']>;
  day_?: InputMaybe<Day_Filter>;
  day_contains?: InputMaybe<Scalars['String']['input']>;
  day_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  day_ends_with?: InputMaybe<Scalars['String']['input']>;
  day_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  day_gt?: InputMaybe<Scalars['String']['input']>;
  day_gte?: InputMaybe<Scalars['String']['input']>;
  day_in?: InputMaybe<Array<Scalars['String']['input']>>;
  day_lt?: InputMaybe<Scalars['String']['input']>;
  day_lte?: InputMaybe<Scalars['String']['input']>;
  day_not?: InputMaybe<Scalars['String']['input']>;
  day_not_contains?: InputMaybe<Scalars['String']['input']>;
  day_not_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  day_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  day_not_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  day_not_in?: InputMaybe<Array<Scalars['String']['input']>>;
  day_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  day_not_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  day_starts_with?: InputMaybe<Scalars['String']['input']>;
  day_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  id?: InputMaybe<Scalars['ID']['input']>;
  id_gt?: InputMaybe<Scalars['ID']['input']>;
  id_gte?: InputMaybe<Scalars['ID']['input']>;
  id_in?: InputMaybe<Array<Scalars['ID']['input']>>;
  id_lt?: InputMaybe<Scalars['ID']['input']>;
  id_lte?: InputMaybe<Scalars['ID']['input']>;
  id_not?: InputMaybe<Scalars['ID']['input']>;
  id_not_in?: InputMaybe<Array<Scalars['ID']['input']>>;
  or?: InputMaybe<Array<InputMaybe<BorrowDailyReward_Filter>>>;
  pool?: InputMaybe<Scalars['String']['input']>;
  pool_?: InputMaybe<Pool_Filter>;
  pool_contains?: InputMaybe<Scalars['String']['input']>;
  pool_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  pool_ends_with?: InputMaybe<Scalars['String']['input']>;
  pool_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  pool_gt?: InputMaybe<Scalars['String']['input']>;
  pool_gte?: InputMaybe<Scalars['String']['input']>;
  pool_in?: InputMaybe<Array<Scalars['String']['input']>>;
  pool_lt?: InputMaybe<Scalars['String']['input']>;
  pool_lte?: InputMaybe<Scalars['String']['input']>;
  pool_not?: InputMaybe<Scalars['String']['input']>;
  pool_not_contains?: InputMaybe<Scalars['String']['input']>;
  pool_not_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  pool_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  pool_not_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  pool_not_in?: InputMaybe<Array<Scalars['String']['input']>>;
  pool_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  pool_not_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  pool_starts_with?: InputMaybe<Scalars['String']['input']>;
  pool_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  reward?: InputMaybe<Scalars['BigDecimal']['input']>;
  reward_gt?: InputMaybe<Scalars['BigDecimal']['input']>;
  reward_gte?: InputMaybe<Scalars['BigDecimal']['input']>;
  reward_in?: InputMaybe<Array<Scalars['BigDecimal']['input']>>;
  reward_lt?: InputMaybe<Scalars['BigDecimal']['input']>;
  reward_lte?: InputMaybe<Scalars['BigDecimal']['input']>;
  reward_not?: InputMaybe<Scalars['BigDecimal']['input']>;
  reward_not_in?: InputMaybe<Array<Scalars['BigDecimal']['input']>>;
  user?: InputMaybe<Scalars['String']['input']>;
  user_?: InputMaybe<User_Filter>;
  user_contains?: InputMaybe<Scalars['String']['input']>;
  user_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  user_ends_with?: InputMaybe<Scalars['String']['input']>;
  user_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  user_gt?: InputMaybe<Scalars['String']['input']>;
  user_gte?: InputMaybe<Scalars['String']['input']>;
  user_in?: InputMaybe<Array<Scalars['String']['input']>>;
  user_lt?: InputMaybe<Scalars['String']['input']>;
  user_lte?: InputMaybe<Scalars['String']['input']>;
  user_not?: InputMaybe<Scalars['String']['input']>;
  user_not_contains?: InputMaybe<Scalars['String']['input']>;
  user_not_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  user_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  user_not_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  user_not_in?: InputMaybe<Array<Scalars['String']['input']>>;
  user_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  user_not_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  user_starts_with?: InputMaybe<Scalars['String']['input']>;
  user_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  week?: InputMaybe<Scalars['String']['input']>;
  week_?: InputMaybe<Week_Filter>;
  week_contains?: InputMaybe<Scalars['String']['input']>;
  week_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  week_ends_with?: InputMaybe<Scalars['String']['input']>;
  week_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  week_gt?: InputMaybe<Scalars['String']['input']>;
  week_gte?: InputMaybe<Scalars['String']['input']>;
  week_in?: InputMaybe<Array<Scalars['String']['input']>>;
  week_lt?: InputMaybe<Scalars['String']['input']>;
  week_lte?: InputMaybe<Scalars['String']['input']>;
  week_not?: InputMaybe<Scalars['String']['input']>;
  week_not_contains?: InputMaybe<Scalars['String']['input']>;
  week_not_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  week_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  week_not_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  week_not_in?: InputMaybe<Array<Scalars['String']['input']>>;
  week_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  week_not_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  week_starts_with?: InputMaybe<Scalars['String']['input']>;
  week_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
};

export enum BorrowDailyReward_OrderBy {
  Account = 'account',
  AccountAddress = 'account__address',
  AccountCollateralToken = 'account__collateralToken',
  AccountDebtToken = 'account__debtToken',
  AccountId = 'account__id',
  AccountIsDpm = 'account__isDPM',
  AccountPositionType = 'account__positionType',
  AccountProtocol = 'account__protocol',
  AccountVaultId = 'account__vaultId',
  Day = 'day',
  DayDay = 'day__day',
  DayDayDate = 'day__dayDate',
  DayDayStartTimestamp = 'day__dayStartTimestamp',
  DayId = 'day__id',
  Id = 'id',
  Pool = 'pool',
  PoolAccuredDebt = 'pool__accuredDebt',
  PoolAddress = 'pool__address',
  PoolApr7dAverage = 'pool__apr7dAverage',
  PoolApr30dAverage = 'pool__apr30dAverage',
  PoolAuctionPrice = 'pool__auctionPrice',
  PoolBorrowApr = 'pool__borrowApr',
  PoolBorrowDailyTokenBlocks = 'pool__borrowDailyTokenBlocks',
  PoolClaimableReserves = 'pool__claimableReserves',
  PoolClaimableReservesRemaining = 'pool__claimableReservesRemaining',
  PoolCollateralAddress = 'pool__collateralAddress',
  PoolCollateralScale = 'pool__collateralScale',
  PoolCurrentBurnEpoch = 'pool__currentBurnEpoch',
  PoolDailyPercentageRate30dAverage = 'pool__dailyPercentageRate30dAverage',
  PoolDebt = 'pool__debt',
  PoolDebtInAuctions = 'pool__debtInAuctions',
  PoolDepositSize = 'pool__depositSize',
  PoolEarnDailyTokenBlocks = 'pool__earnDailyTokenBlocks',
  PoolHpb = 'pool__hpb',
  PoolHpbIndex = 'pool__hpbIndex',
  PoolHtp = 'pool__htp',
  PoolHtpIndex = 'pool__htpIndex',
  PoolId = 'pool__id',
  PoolInterestRate = 'pool__interestRate',
  PoolLastInterestRateUpdate = 'pool__lastInterestRateUpdate',
  PoolLendApr = 'pool__lendApr',
  PoolLendApr7dAverage = 'pool__lendApr7dAverage',
  PoolLendApr30dAverage = 'pool__lendApr30dAverage',
  PoolLendDailyPercentageRate30dAverage = 'pool__lendDailyPercentageRate30dAverage',
  PoolLendMonthlyPercentageRate30dAverage = 'pool__lendMonthlyPercentageRate30dAverage',
  PoolLoansCount = 'pool__loansCount',
  PoolLup = 'pool__lup',
  PoolLupIndex = 'pool__lupIndex',
  PoolMonthlyPercentageRate30dAverage = 'pool__monthlyPercentageRate30dAverage',
  PoolName = 'pool__name',
  PoolPoolActualUtilization = 'pool__poolActualUtilization',
  PoolPoolCollateralization = 'pool__poolCollateralization',
  PoolPoolMinDebtAmount = 'pool__poolMinDebtAmount',
  PoolPoolTargetUtilization = 'pool__poolTargetUtilization',
  PoolQuoteTokenAddress = 'pool__quoteTokenAddress',
  PoolQuoteTokenScale = 'pool__quoteTokenScale',
  PoolReserves = 'pool__reserves',
  PoolSummerDepositAmountEarningInterest = 'pool__summerDepositAmountEarningInterest',
  PoolT0debt = 'pool__t0debt',
  PoolTimeRemaining = 'pool__timeRemaining',
  PoolTotalAuctionsInPool = 'pool__totalAuctionsInPool',
  Reward = 'reward',
  User = 'user',
  UserAddress = 'user__address',
  UserId = 'user__id',
  UserVaultCount = 'user__vaultCount',
  Week = 'week',
  WeekId = 'week__id',
  WeekWeek = 'week__week',
  WeekWeekEndTimestamp = 'week__weekEndTimestamp',
  WeekWeekStartTimestamp = 'week__weekStartTimestamp'
}

export type BorrowPosition = {
  __typename?: 'BorrowPosition';
  account?: Maybe<Account>;
  borrowCumulativeCollateralDeposit: Scalars['BigDecimal']['output'];
  borrowCumulativeCollateralWithdraw: Scalars['BigDecimal']['output'];
  borrowCumulativeDebtDeposit: Scalars['BigDecimal']['output'];
  borrowCumulativeDebtWithdraw: Scalars['BigDecimal']['output'];
  borrowCumulativeDepositInCollateralToken: Scalars['BigDecimal']['output'];
  borrowCumulativeDepositInQuoteToken: Scalars['BigDecimal']['output'];
  borrowCumulativeDepositUSD: Scalars['BigDecimal']['output'];
  borrowCumulativeFeesInCollateralToken: Scalars['BigDecimal']['output'];
  borrowCumulativeFeesInQuoteToken: Scalars['BigDecimal']['output'];
  borrowCumulativeFeesUSD: Scalars['BigDecimal']['output'];
  borrowCumulativeWithdrawInCollateralToken: Scalars['BigDecimal']['output'];
  borrowCumulativeWithdrawInQuoteToken: Scalars['BigDecimal']['output'];
  borrowCumulativeWithdrawUSD: Scalars['BigDecimal']['output'];
  borrowDailyTokenBlocks: Scalars['BigInt']['output'];
  borrowLastUpdateBlock: Scalars['BigInt']['output'];
  collateral: Scalars['BigInt']['output'];
  debt: Scalars['BigInt']['output'];
  id: Scalars['ID']['output'];
  liquidationPrice: Scalars['BigDecimal']['output'];
  liquidations: Array<Auction>;
  oasisEvents?: Maybe<Array<OasisEvent>>;
  pool: Pool;
  protocolEvents?: Maybe<Array<BorrowerEvent>>;
  t0Debt: Scalars['BigInt']['output'];
  t0Np_: Scalars['BigInt']['output'];
  user?: Maybe<User>;
};


export type BorrowPositionLiquidationsArgs = {
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Auction_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  where?: InputMaybe<Auction_Filter>;
};


export type BorrowPositionOasisEventsArgs = {
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<OasisEvent_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  where?: InputMaybe<OasisEvent_Filter>;
};


export type BorrowPositionProtocolEventsArgs = {
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<BorrowerEvent_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  where?: InputMaybe<BorrowerEvent_Filter>;
};

export type BorrowPosition_Filter = {
  /** Filter for the block changed event. */
  _change_block?: InputMaybe<BlockChangedFilter>;
  account?: InputMaybe<Scalars['String']['input']>;
  account_?: InputMaybe<Account_Filter>;
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
  and?: InputMaybe<Array<InputMaybe<BorrowPosition_Filter>>>;
  borrowCumulativeCollateralDeposit?: InputMaybe<Scalars['BigDecimal']['input']>;
  borrowCumulativeCollateralDeposit_gt?: InputMaybe<Scalars['BigDecimal']['input']>;
  borrowCumulativeCollateralDeposit_gte?: InputMaybe<Scalars['BigDecimal']['input']>;
  borrowCumulativeCollateralDeposit_in?: InputMaybe<Array<Scalars['BigDecimal']['input']>>;
  borrowCumulativeCollateralDeposit_lt?: InputMaybe<Scalars['BigDecimal']['input']>;
  borrowCumulativeCollateralDeposit_lte?: InputMaybe<Scalars['BigDecimal']['input']>;
  borrowCumulativeCollateralDeposit_not?: InputMaybe<Scalars['BigDecimal']['input']>;
  borrowCumulativeCollateralDeposit_not_in?: InputMaybe<Array<Scalars['BigDecimal']['input']>>;
  borrowCumulativeCollateralWithdraw?: InputMaybe<Scalars['BigDecimal']['input']>;
  borrowCumulativeCollateralWithdraw_gt?: InputMaybe<Scalars['BigDecimal']['input']>;
  borrowCumulativeCollateralWithdraw_gte?: InputMaybe<Scalars['BigDecimal']['input']>;
  borrowCumulativeCollateralWithdraw_in?: InputMaybe<Array<Scalars['BigDecimal']['input']>>;
  borrowCumulativeCollateralWithdraw_lt?: InputMaybe<Scalars['BigDecimal']['input']>;
  borrowCumulativeCollateralWithdraw_lte?: InputMaybe<Scalars['BigDecimal']['input']>;
  borrowCumulativeCollateralWithdraw_not?: InputMaybe<Scalars['BigDecimal']['input']>;
  borrowCumulativeCollateralWithdraw_not_in?: InputMaybe<Array<Scalars['BigDecimal']['input']>>;
  borrowCumulativeDebtDeposit?: InputMaybe<Scalars['BigDecimal']['input']>;
  borrowCumulativeDebtDeposit_gt?: InputMaybe<Scalars['BigDecimal']['input']>;
  borrowCumulativeDebtDeposit_gte?: InputMaybe<Scalars['BigDecimal']['input']>;
  borrowCumulativeDebtDeposit_in?: InputMaybe<Array<Scalars['BigDecimal']['input']>>;
  borrowCumulativeDebtDeposit_lt?: InputMaybe<Scalars['BigDecimal']['input']>;
  borrowCumulativeDebtDeposit_lte?: InputMaybe<Scalars['BigDecimal']['input']>;
  borrowCumulativeDebtDeposit_not?: InputMaybe<Scalars['BigDecimal']['input']>;
  borrowCumulativeDebtDeposit_not_in?: InputMaybe<Array<Scalars['BigDecimal']['input']>>;
  borrowCumulativeDebtWithdraw?: InputMaybe<Scalars['BigDecimal']['input']>;
  borrowCumulativeDebtWithdraw_gt?: InputMaybe<Scalars['BigDecimal']['input']>;
  borrowCumulativeDebtWithdraw_gte?: InputMaybe<Scalars['BigDecimal']['input']>;
  borrowCumulativeDebtWithdraw_in?: InputMaybe<Array<Scalars['BigDecimal']['input']>>;
  borrowCumulativeDebtWithdraw_lt?: InputMaybe<Scalars['BigDecimal']['input']>;
  borrowCumulativeDebtWithdraw_lte?: InputMaybe<Scalars['BigDecimal']['input']>;
  borrowCumulativeDebtWithdraw_not?: InputMaybe<Scalars['BigDecimal']['input']>;
  borrowCumulativeDebtWithdraw_not_in?: InputMaybe<Array<Scalars['BigDecimal']['input']>>;
  borrowCumulativeDepositInCollateralToken?: InputMaybe<Scalars['BigDecimal']['input']>;
  borrowCumulativeDepositInCollateralToken_gt?: InputMaybe<Scalars['BigDecimal']['input']>;
  borrowCumulativeDepositInCollateralToken_gte?: InputMaybe<Scalars['BigDecimal']['input']>;
  borrowCumulativeDepositInCollateralToken_in?: InputMaybe<Array<Scalars['BigDecimal']['input']>>;
  borrowCumulativeDepositInCollateralToken_lt?: InputMaybe<Scalars['BigDecimal']['input']>;
  borrowCumulativeDepositInCollateralToken_lte?: InputMaybe<Scalars['BigDecimal']['input']>;
  borrowCumulativeDepositInCollateralToken_not?: InputMaybe<Scalars['BigDecimal']['input']>;
  borrowCumulativeDepositInCollateralToken_not_in?: InputMaybe<Array<Scalars['BigDecimal']['input']>>;
  borrowCumulativeDepositInQuoteToken?: InputMaybe<Scalars['BigDecimal']['input']>;
  borrowCumulativeDepositInQuoteToken_gt?: InputMaybe<Scalars['BigDecimal']['input']>;
  borrowCumulativeDepositInQuoteToken_gte?: InputMaybe<Scalars['BigDecimal']['input']>;
  borrowCumulativeDepositInQuoteToken_in?: InputMaybe<Array<Scalars['BigDecimal']['input']>>;
  borrowCumulativeDepositInQuoteToken_lt?: InputMaybe<Scalars['BigDecimal']['input']>;
  borrowCumulativeDepositInQuoteToken_lte?: InputMaybe<Scalars['BigDecimal']['input']>;
  borrowCumulativeDepositInQuoteToken_not?: InputMaybe<Scalars['BigDecimal']['input']>;
  borrowCumulativeDepositInQuoteToken_not_in?: InputMaybe<Array<Scalars['BigDecimal']['input']>>;
  borrowCumulativeDepositUSD?: InputMaybe<Scalars['BigDecimal']['input']>;
  borrowCumulativeDepositUSD_gt?: InputMaybe<Scalars['BigDecimal']['input']>;
  borrowCumulativeDepositUSD_gte?: InputMaybe<Scalars['BigDecimal']['input']>;
  borrowCumulativeDepositUSD_in?: InputMaybe<Array<Scalars['BigDecimal']['input']>>;
  borrowCumulativeDepositUSD_lt?: InputMaybe<Scalars['BigDecimal']['input']>;
  borrowCumulativeDepositUSD_lte?: InputMaybe<Scalars['BigDecimal']['input']>;
  borrowCumulativeDepositUSD_not?: InputMaybe<Scalars['BigDecimal']['input']>;
  borrowCumulativeDepositUSD_not_in?: InputMaybe<Array<Scalars['BigDecimal']['input']>>;
  borrowCumulativeFeesInCollateralToken?: InputMaybe<Scalars['BigDecimal']['input']>;
  borrowCumulativeFeesInCollateralToken_gt?: InputMaybe<Scalars['BigDecimal']['input']>;
  borrowCumulativeFeesInCollateralToken_gte?: InputMaybe<Scalars['BigDecimal']['input']>;
  borrowCumulativeFeesInCollateralToken_in?: InputMaybe<Array<Scalars['BigDecimal']['input']>>;
  borrowCumulativeFeesInCollateralToken_lt?: InputMaybe<Scalars['BigDecimal']['input']>;
  borrowCumulativeFeesInCollateralToken_lte?: InputMaybe<Scalars['BigDecimal']['input']>;
  borrowCumulativeFeesInCollateralToken_not?: InputMaybe<Scalars['BigDecimal']['input']>;
  borrowCumulativeFeesInCollateralToken_not_in?: InputMaybe<Array<Scalars['BigDecimal']['input']>>;
  borrowCumulativeFeesInQuoteToken?: InputMaybe<Scalars['BigDecimal']['input']>;
  borrowCumulativeFeesInQuoteToken_gt?: InputMaybe<Scalars['BigDecimal']['input']>;
  borrowCumulativeFeesInQuoteToken_gte?: InputMaybe<Scalars['BigDecimal']['input']>;
  borrowCumulativeFeesInQuoteToken_in?: InputMaybe<Array<Scalars['BigDecimal']['input']>>;
  borrowCumulativeFeesInQuoteToken_lt?: InputMaybe<Scalars['BigDecimal']['input']>;
  borrowCumulativeFeesInQuoteToken_lte?: InputMaybe<Scalars['BigDecimal']['input']>;
  borrowCumulativeFeesInQuoteToken_not?: InputMaybe<Scalars['BigDecimal']['input']>;
  borrowCumulativeFeesInQuoteToken_not_in?: InputMaybe<Array<Scalars['BigDecimal']['input']>>;
  borrowCumulativeFeesUSD?: InputMaybe<Scalars['BigDecimal']['input']>;
  borrowCumulativeFeesUSD_gt?: InputMaybe<Scalars['BigDecimal']['input']>;
  borrowCumulativeFeesUSD_gte?: InputMaybe<Scalars['BigDecimal']['input']>;
  borrowCumulativeFeesUSD_in?: InputMaybe<Array<Scalars['BigDecimal']['input']>>;
  borrowCumulativeFeesUSD_lt?: InputMaybe<Scalars['BigDecimal']['input']>;
  borrowCumulativeFeesUSD_lte?: InputMaybe<Scalars['BigDecimal']['input']>;
  borrowCumulativeFeesUSD_not?: InputMaybe<Scalars['BigDecimal']['input']>;
  borrowCumulativeFeesUSD_not_in?: InputMaybe<Array<Scalars['BigDecimal']['input']>>;
  borrowCumulativeWithdrawInCollateralToken?: InputMaybe<Scalars['BigDecimal']['input']>;
  borrowCumulativeWithdrawInCollateralToken_gt?: InputMaybe<Scalars['BigDecimal']['input']>;
  borrowCumulativeWithdrawInCollateralToken_gte?: InputMaybe<Scalars['BigDecimal']['input']>;
  borrowCumulativeWithdrawInCollateralToken_in?: InputMaybe<Array<Scalars['BigDecimal']['input']>>;
  borrowCumulativeWithdrawInCollateralToken_lt?: InputMaybe<Scalars['BigDecimal']['input']>;
  borrowCumulativeWithdrawInCollateralToken_lte?: InputMaybe<Scalars['BigDecimal']['input']>;
  borrowCumulativeWithdrawInCollateralToken_not?: InputMaybe<Scalars['BigDecimal']['input']>;
  borrowCumulativeWithdrawInCollateralToken_not_in?: InputMaybe<Array<Scalars['BigDecimal']['input']>>;
  borrowCumulativeWithdrawInQuoteToken?: InputMaybe<Scalars['BigDecimal']['input']>;
  borrowCumulativeWithdrawInQuoteToken_gt?: InputMaybe<Scalars['BigDecimal']['input']>;
  borrowCumulativeWithdrawInQuoteToken_gte?: InputMaybe<Scalars['BigDecimal']['input']>;
  borrowCumulativeWithdrawInQuoteToken_in?: InputMaybe<Array<Scalars['BigDecimal']['input']>>;
  borrowCumulativeWithdrawInQuoteToken_lt?: InputMaybe<Scalars['BigDecimal']['input']>;
  borrowCumulativeWithdrawInQuoteToken_lte?: InputMaybe<Scalars['BigDecimal']['input']>;
  borrowCumulativeWithdrawInQuoteToken_not?: InputMaybe<Scalars['BigDecimal']['input']>;
  borrowCumulativeWithdrawInQuoteToken_not_in?: InputMaybe<Array<Scalars['BigDecimal']['input']>>;
  borrowCumulativeWithdrawUSD?: InputMaybe<Scalars['BigDecimal']['input']>;
  borrowCumulativeWithdrawUSD_gt?: InputMaybe<Scalars['BigDecimal']['input']>;
  borrowCumulativeWithdrawUSD_gte?: InputMaybe<Scalars['BigDecimal']['input']>;
  borrowCumulativeWithdrawUSD_in?: InputMaybe<Array<Scalars['BigDecimal']['input']>>;
  borrowCumulativeWithdrawUSD_lt?: InputMaybe<Scalars['BigDecimal']['input']>;
  borrowCumulativeWithdrawUSD_lte?: InputMaybe<Scalars['BigDecimal']['input']>;
  borrowCumulativeWithdrawUSD_not?: InputMaybe<Scalars['BigDecimal']['input']>;
  borrowCumulativeWithdrawUSD_not_in?: InputMaybe<Array<Scalars['BigDecimal']['input']>>;
  borrowDailyTokenBlocks?: InputMaybe<Scalars['BigInt']['input']>;
  borrowDailyTokenBlocks_gt?: InputMaybe<Scalars['BigInt']['input']>;
  borrowDailyTokenBlocks_gte?: InputMaybe<Scalars['BigInt']['input']>;
  borrowDailyTokenBlocks_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  borrowDailyTokenBlocks_lt?: InputMaybe<Scalars['BigInt']['input']>;
  borrowDailyTokenBlocks_lte?: InputMaybe<Scalars['BigInt']['input']>;
  borrowDailyTokenBlocks_not?: InputMaybe<Scalars['BigInt']['input']>;
  borrowDailyTokenBlocks_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  borrowLastUpdateBlock?: InputMaybe<Scalars['BigInt']['input']>;
  borrowLastUpdateBlock_gt?: InputMaybe<Scalars['BigInt']['input']>;
  borrowLastUpdateBlock_gte?: InputMaybe<Scalars['BigInt']['input']>;
  borrowLastUpdateBlock_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  borrowLastUpdateBlock_lt?: InputMaybe<Scalars['BigInt']['input']>;
  borrowLastUpdateBlock_lte?: InputMaybe<Scalars['BigInt']['input']>;
  borrowLastUpdateBlock_not?: InputMaybe<Scalars['BigInt']['input']>;
  borrowLastUpdateBlock_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  collateral?: InputMaybe<Scalars['BigInt']['input']>;
  collateral_gt?: InputMaybe<Scalars['BigInt']['input']>;
  collateral_gte?: InputMaybe<Scalars['BigInt']['input']>;
  collateral_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  collateral_lt?: InputMaybe<Scalars['BigInt']['input']>;
  collateral_lte?: InputMaybe<Scalars['BigInt']['input']>;
  collateral_not?: InputMaybe<Scalars['BigInt']['input']>;
  collateral_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  debt?: InputMaybe<Scalars['BigInt']['input']>;
  debt_gt?: InputMaybe<Scalars['BigInt']['input']>;
  debt_gte?: InputMaybe<Scalars['BigInt']['input']>;
  debt_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  debt_lt?: InputMaybe<Scalars['BigInt']['input']>;
  debt_lte?: InputMaybe<Scalars['BigInt']['input']>;
  debt_not?: InputMaybe<Scalars['BigInt']['input']>;
  debt_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  id?: InputMaybe<Scalars['ID']['input']>;
  id_gt?: InputMaybe<Scalars['ID']['input']>;
  id_gte?: InputMaybe<Scalars['ID']['input']>;
  id_in?: InputMaybe<Array<Scalars['ID']['input']>>;
  id_lt?: InputMaybe<Scalars['ID']['input']>;
  id_lte?: InputMaybe<Scalars['ID']['input']>;
  id_not?: InputMaybe<Scalars['ID']['input']>;
  id_not_in?: InputMaybe<Array<Scalars['ID']['input']>>;
  liquidationPrice?: InputMaybe<Scalars['BigDecimal']['input']>;
  liquidationPrice_gt?: InputMaybe<Scalars['BigDecimal']['input']>;
  liquidationPrice_gte?: InputMaybe<Scalars['BigDecimal']['input']>;
  liquidationPrice_in?: InputMaybe<Array<Scalars['BigDecimal']['input']>>;
  liquidationPrice_lt?: InputMaybe<Scalars['BigDecimal']['input']>;
  liquidationPrice_lte?: InputMaybe<Scalars['BigDecimal']['input']>;
  liquidationPrice_not?: InputMaybe<Scalars['BigDecimal']['input']>;
  liquidationPrice_not_in?: InputMaybe<Array<Scalars['BigDecimal']['input']>>;
  liquidations?: InputMaybe<Array<Scalars['String']['input']>>;
  liquidations_?: InputMaybe<Auction_Filter>;
  liquidations_contains?: InputMaybe<Array<Scalars['String']['input']>>;
  liquidations_contains_nocase?: InputMaybe<Array<Scalars['String']['input']>>;
  liquidations_not?: InputMaybe<Array<Scalars['String']['input']>>;
  liquidations_not_contains?: InputMaybe<Array<Scalars['String']['input']>>;
  liquidations_not_contains_nocase?: InputMaybe<Array<Scalars['String']['input']>>;
  oasisEvents_?: InputMaybe<OasisEvent_Filter>;
  or?: InputMaybe<Array<InputMaybe<BorrowPosition_Filter>>>;
  pool?: InputMaybe<Scalars['String']['input']>;
  pool_?: InputMaybe<Pool_Filter>;
  pool_contains?: InputMaybe<Scalars['String']['input']>;
  pool_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  pool_ends_with?: InputMaybe<Scalars['String']['input']>;
  pool_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  pool_gt?: InputMaybe<Scalars['String']['input']>;
  pool_gte?: InputMaybe<Scalars['String']['input']>;
  pool_in?: InputMaybe<Array<Scalars['String']['input']>>;
  pool_lt?: InputMaybe<Scalars['String']['input']>;
  pool_lte?: InputMaybe<Scalars['String']['input']>;
  pool_not?: InputMaybe<Scalars['String']['input']>;
  pool_not_contains?: InputMaybe<Scalars['String']['input']>;
  pool_not_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  pool_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  pool_not_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  pool_not_in?: InputMaybe<Array<Scalars['String']['input']>>;
  pool_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  pool_not_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  pool_starts_with?: InputMaybe<Scalars['String']['input']>;
  pool_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  protocolEvents_?: InputMaybe<BorrowerEvent_Filter>;
  t0Debt?: InputMaybe<Scalars['BigInt']['input']>;
  t0Debt_gt?: InputMaybe<Scalars['BigInt']['input']>;
  t0Debt_gte?: InputMaybe<Scalars['BigInt']['input']>;
  t0Debt_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  t0Debt_lt?: InputMaybe<Scalars['BigInt']['input']>;
  t0Debt_lte?: InputMaybe<Scalars['BigInt']['input']>;
  t0Debt_not?: InputMaybe<Scalars['BigInt']['input']>;
  t0Debt_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  t0Np_?: InputMaybe<Scalars['BigInt']['input']>;
  t0Np__gt?: InputMaybe<Scalars['BigInt']['input']>;
  t0Np__gte?: InputMaybe<Scalars['BigInt']['input']>;
  t0Np__in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  t0Np__lt?: InputMaybe<Scalars['BigInt']['input']>;
  t0Np__lte?: InputMaybe<Scalars['BigInt']['input']>;
  t0Np__not?: InputMaybe<Scalars['BigInt']['input']>;
  t0Np__not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  user?: InputMaybe<Scalars['String']['input']>;
  user_?: InputMaybe<User_Filter>;
  user_contains?: InputMaybe<Scalars['String']['input']>;
  user_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  user_ends_with?: InputMaybe<Scalars['String']['input']>;
  user_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  user_gt?: InputMaybe<Scalars['String']['input']>;
  user_gte?: InputMaybe<Scalars['String']['input']>;
  user_in?: InputMaybe<Array<Scalars['String']['input']>>;
  user_lt?: InputMaybe<Scalars['String']['input']>;
  user_lte?: InputMaybe<Scalars['String']['input']>;
  user_not?: InputMaybe<Scalars['String']['input']>;
  user_not_contains?: InputMaybe<Scalars['String']['input']>;
  user_not_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  user_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  user_not_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  user_not_in?: InputMaybe<Array<Scalars['String']['input']>>;
  user_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  user_not_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  user_starts_with?: InputMaybe<Scalars['String']['input']>;
  user_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
};

export enum BorrowPosition_OrderBy {
  Account = 'account',
  AccountAddress = 'account__address',
  AccountCollateralToken = 'account__collateralToken',
  AccountDebtToken = 'account__debtToken',
  AccountId = 'account__id',
  AccountIsDpm = 'account__isDPM',
  AccountPositionType = 'account__positionType',
  AccountProtocol = 'account__protocol',
  AccountVaultId = 'account__vaultId',
  BorrowCumulativeCollateralDeposit = 'borrowCumulativeCollateralDeposit',
  BorrowCumulativeCollateralWithdraw = 'borrowCumulativeCollateralWithdraw',
  BorrowCumulativeDebtDeposit = 'borrowCumulativeDebtDeposit',
  BorrowCumulativeDebtWithdraw = 'borrowCumulativeDebtWithdraw',
  BorrowCumulativeDepositInCollateralToken = 'borrowCumulativeDepositInCollateralToken',
  BorrowCumulativeDepositInQuoteToken = 'borrowCumulativeDepositInQuoteToken',
  BorrowCumulativeDepositUsd = 'borrowCumulativeDepositUSD',
  BorrowCumulativeFeesInCollateralToken = 'borrowCumulativeFeesInCollateralToken',
  BorrowCumulativeFeesInQuoteToken = 'borrowCumulativeFeesInQuoteToken',
  BorrowCumulativeFeesUsd = 'borrowCumulativeFeesUSD',
  BorrowCumulativeWithdrawInCollateralToken = 'borrowCumulativeWithdrawInCollateralToken',
  BorrowCumulativeWithdrawInQuoteToken = 'borrowCumulativeWithdrawInQuoteToken',
  BorrowCumulativeWithdrawUsd = 'borrowCumulativeWithdrawUSD',
  BorrowDailyTokenBlocks = 'borrowDailyTokenBlocks',
  BorrowLastUpdateBlock = 'borrowLastUpdateBlock',
  Collateral = 'collateral',
  Debt = 'debt',
  Id = 'id',
  LiquidationPrice = 'liquidationPrice',
  Liquidations = 'liquidations',
  OasisEvents = 'oasisEvents',
  Pool = 'pool',
  PoolAccuredDebt = 'pool__accuredDebt',
  PoolAddress = 'pool__address',
  PoolApr7dAverage = 'pool__apr7dAverage',
  PoolApr30dAverage = 'pool__apr30dAverage',
  PoolAuctionPrice = 'pool__auctionPrice',
  PoolBorrowApr = 'pool__borrowApr',
  PoolBorrowDailyTokenBlocks = 'pool__borrowDailyTokenBlocks',
  PoolClaimableReserves = 'pool__claimableReserves',
  PoolClaimableReservesRemaining = 'pool__claimableReservesRemaining',
  PoolCollateralAddress = 'pool__collateralAddress',
  PoolCollateralScale = 'pool__collateralScale',
  PoolCurrentBurnEpoch = 'pool__currentBurnEpoch',
  PoolDailyPercentageRate30dAverage = 'pool__dailyPercentageRate30dAverage',
  PoolDebt = 'pool__debt',
  PoolDebtInAuctions = 'pool__debtInAuctions',
  PoolDepositSize = 'pool__depositSize',
  PoolEarnDailyTokenBlocks = 'pool__earnDailyTokenBlocks',
  PoolHpb = 'pool__hpb',
  PoolHpbIndex = 'pool__hpbIndex',
  PoolHtp = 'pool__htp',
  PoolHtpIndex = 'pool__htpIndex',
  PoolId = 'pool__id',
  PoolInterestRate = 'pool__interestRate',
  PoolLastInterestRateUpdate = 'pool__lastInterestRateUpdate',
  PoolLendApr = 'pool__lendApr',
  PoolLendApr7dAverage = 'pool__lendApr7dAverage',
  PoolLendApr30dAverage = 'pool__lendApr30dAverage',
  PoolLendDailyPercentageRate30dAverage = 'pool__lendDailyPercentageRate30dAverage',
  PoolLendMonthlyPercentageRate30dAverage = 'pool__lendMonthlyPercentageRate30dAverage',
  PoolLoansCount = 'pool__loansCount',
  PoolLup = 'pool__lup',
  PoolLupIndex = 'pool__lupIndex',
  PoolMonthlyPercentageRate30dAverage = 'pool__monthlyPercentageRate30dAverage',
  PoolName = 'pool__name',
  PoolPoolActualUtilization = 'pool__poolActualUtilization',
  PoolPoolCollateralization = 'pool__poolCollateralization',
  PoolPoolMinDebtAmount = 'pool__poolMinDebtAmount',
  PoolPoolTargetUtilization = 'pool__poolTargetUtilization',
  PoolQuoteTokenAddress = 'pool__quoteTokenAddress',
  PoolQuoteTokenScale = 'pool__quoteTokenScale',
  PoolReserves = 'pool__reserves',
  PoolSummerDepositAmountEarningInterest = 'pool__summerDepositAmountEarningInterest',
  PoolT0debt = 'pool__t0debt',
  PoolTimeRemaining = 'pool__timeRemaining',
  PoolTotalAuctionsInPool = 'pool__totalAuctionsInPool',
  ProtocolEvents = 'protocolEvents',
  T0Debt = 't0Debt',
  T0Np = 't0Np_',
  User = 'user',
  UserAddress = 'user__address',
  UserId = 'user__id',
  UserVaultCount = 'user__vaultCount'
}

export type BorrowerEvent = {
  __typename?: 'BorrowerEvent';
  account?: Maybe<Account>;
  amountBorrowed?: Maybe<Scalars['BigInt']['output']>;
  auction?: Maybe<Auction>;
  blockNumber: Scalars['BigInt']['output'];
  bondChange?: Maybe<Scalars['BigInt']['output']>;
  collateralAfter: Scalars['BigDecimal']['output'];
  collateralBefore: Scalars['BigDecimal']['output'];
  collateralDelta: Scalars['BigDecimal']['output'];
  collateralForLiquidation?: Maybe<Scalars['BigInt']['output']>;
  collateralPledged?: Maybe<Scalars['BigInt']['output']>;
  collateralPulled?: Maybe<Scalars['BigInt']['output']>;
  collateralPurachased?: Maybe<Scalars['BigInt']['output']>;
  collateralToken: Token;
  collateralTokenPriceUSD: Scalars['BigDecimal']['output'];
  debtAfter: Scalars['BigDecimal']['output'];
  debtBefore: Scalars['BigDecimal']['output'];
  debtDelta: Scalars['BigDecimal']['output'];
  debtToCover?: Maybe<Scalars['BigInt']['output']>;
  debtToken: Token;
  debtTokenPriceUSD: Scalars['BigDecimal']['output'];
  id: Scalars['ID']['output'];
  isReward?: Maybe<Scalars['Boolean']['output']>;
  kind: Scalars['String']['output'];
  originationFee?: Maybe<Scalars['BigDecimal']['output']>;
  pool: Pool;
  position: BorrowPosition;
  quoteRepaid?: Maybe<Scalars['BigInt']['output']>;
  quoteUsedToPurchase?: Maybe<Scalars['BigInt']['output']>;
  remainingCollateral?: Maybe<Scalars['BigInt']['output']>;
  settledDebt?: Maybe<Scalars['BigInt']['output']>;
  takeIndex?: Maybe<Scalars['BigInt']['output']>;
  timestamp: Scalars['BigInt']['output'];
  txHash: Scalars['Bytes']['output'];
};

export type BorrowerEvent_Filter = {
  /** Filter for the block changed event. */
  _change_block?: InputMaybe<BlockChangedFilter>;
  account?: InputMaybe<Scalars['String']['input']>;
  account_?: InputMaybe<Account_Filter>;
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
  amountBorrowed?: InputMaybe<Scalars['BigInt']['input']>;
  amountBorrowed_gt?: InputMaybe<Scalars['BigInt']['input']>;
  amountBorrowed_gte?: InputMaybe<Scalars['BigInt']['input']>;
  amountBorrowed_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  amountBorrowed_lt?: InputMaybe<Scalars['BigInt']['input']>;
  amountBorrowed_lte?: InputMaybe<Scalars['BigInt']['input']>;
  amountBorrowed_not?: InputMaybe<Scalars['BigInt']['input']>;
  amountBorrowed_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  and?: InputMaybe<Array<InputMaybe<BorrowerEvent_Filter>>>;
  auction?: InputMaybe<Scalars['String']['input']>;
  auction_?: InputMaybe<Auction_Filter>;
  auction_contains?: InputMaybe<Scalars['String']['input']>;
  auction_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  auction_ends_with?: InputMaybe<Scalars['String']['input']>;
  auction_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  auction_gt?: InputMaybe<Scalars['String']['input']>;
  auction_gte?: InputMaybe<Scalars['String']['input']>;
  auction_in?: InputMaybe<Array<Scalars['String']['input']>>;
  auction_lt?: InputMaybe<Scalars['String']['input']>;
  auction_lte?: InputMaybe<Scalars['String']['input']>;
  auction_not?: InputMaybe<Scalars['String']['input']>;
  auction_not_contains?: InputMaybe<Scalars['String']['input']>;
  auction_not_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  auction_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  auction_not_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  auction_not_in?: InputMaybe<Array<Scalars['String']['input']>>;
  auction_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  auction_not_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  auction_starts_with?: InputMaybe<Scalars['String']['input']>;
  auction_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  blockNumber?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_gt?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_gte?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  blockNumber_lt?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_lte?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_not?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  bondChange?: InputMaybe<Scalars['BigInt']['input']>;
  bondChange_gt?: InputMaybe<Scalars['BigInt']['input']>;
  bondChange_gte?: InputMaybe<Scalars['BigInt']['input']>;
  bondChange_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  bondChange_lt?: InputMaybe<Scalars['BigInt']['input']>;
  bondChange_lte?: InputMaybe<Scalars['BigInt']['input']>;
  bondChange_not?: InputMaybe<Scalars['BigInt']['input']>;
  bondChange_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
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
  collateralForLiquidation?: InputMaybe<Scalars['BigInt']['input']>;
  collateralForLiquidation_gt?: InputMaybe<Scalars['BigInt']['input']>;
  collateralForLiquidation_gte?: InputMaybe<Scalars['BigInt']['input']>;
  collateralForLiquidation_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  collateralForLiquidation_lt?: InputMaybe<Scalars['BigInt']['input']>;
  collateralForLiquidation_lte?: InputMaybe<Scalars['BigInt']['input']>;
  collateralForLiquidation_not?: InputMaybe<Scalars['BigInt']['input']>;
  collateralForLiquidation_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  collateralPledged?: InputMaybe<Scalars['BigInt']['input']>;
  collateralPledged_gt?: InputMaybe<Scalars['BigInt']['input']>;
  collateralPledged_gte?: InputMaybe<Scalars['BigInt']['input']>;
  collateralPledged_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  collateralPledged_lt?: InputMaybe<Scalars['BigInt']['input']>;
  collateralPledged_lte?: InputMaybe<Scalars['BigInt']['input']>;
  collateralPledged_not?: InputMaybe<Scalars['BigInt']['input']>;
  collateralPledged_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  collateralPulled?: InputMaybe<Scalars['BigInt']['input']>;
  collateralPulled_gt?: InputMaybe<Scalars['BigInt']['input']>;
  collateralPulled_gte?: InputMaybe<Scalars['BigInt']['input']>;
  collateralPulled_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  collateralPulled_lt?: InputMaybe<Scalars['BigInt']['input']>;
  collateralPulled_lte?: InputMaybe<Scalars['BigInt']['input']>;
  collateralPulled_not?: InputMaybe<Scalars['BigInt']['input']>;
  collateralPulled_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  collateralPurachased?: InputMaybe<Scalars['BigInt']['input']>;
  collateralPurachased_gt?: InputMaybe<Scalars['BigInt']['input']>;
  collateralPurachased_gte?: InputMaybe<Scalars['BigInt']['input']>;
  collateralPurachased_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  collateralPurachased_lt?: InputMaybe<Scalars['BigInt']['input']>;
  collateralPurachased_lte?: InputMaybe<Scalars['BigInt']['input']>;
  collateralPurachased_not?: InputMaybe<Scalars['BigInt']['input']>;
  collateralPurachased_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
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
  isReward?: InputMaybe<Scalars['Boolean']['input']>;
  isReward_in?: InputMaybe<Array<Scalars['Boolean']['input']>>;
  isReward_not?: InputMaybe<Scalars['Boolean']['input']>;
  isReward_not_in?: InputMaybe<Array<Scalars['Boolean']['input']>>;
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
  or?: InputMaybe<Array<InputMaybe<BorrowerEvent_Filter>>>;
  originationFee?: InputMaybe<Scalars['BigDecimal']['input']>;
  originationFee_gt?: InputMaybe<Scalars['BigDecimal']['input']>;
  originationFee_gte?: InputMaybe<Scalars['BigDecimal']['input']>;
  originationFee_in?: InputMaybe<Array<Scalars['BigDecimal']['input']>>;
  originationFee_lt?: InputMaybe<Scalars['BigDecimal']['input']>;
  originationFee_lte?: InputMaybe<Scalars['BigDecimal']['input']>;
  originationFee_not?: InputMaybe<Scalars['BigDecimal']['input']>;
  originationFee_not_in?: InputMaybe<Array<Scalars['BigDecimal']['input']>>;
  pool?: InputMaybe<Scalars['String']['input']>;
  pool_?: InputMaybe<Pool_Filter>;
  pool_contains?: InputMaybe<Scalars['String']['input']>;
  pool_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  pool_ends_with?: InputMaybe<Scalars['String']['input']>;
  pool_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  pool_gt?: InputMaybe<Scalars['String']['input']>;
  pool_gte?: InputMaybe<Scalars['String']['input']>;
  pool_in?: InputMaybe<Array<Scalars['String']['input']>>;
  pool_lt?: InputMaybe<Scalars['String']['input']>;
  pool_lte?: InputMaybe<Scalars['String']['input']>;
  pool_not?: InputMaybe<Scalars['String']['input']>;
  pool_not_contains?: InputMaybe<Scalars['String']['input']>;
  pool_not_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  pool_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  pool_not_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  pool_not_in?: InputMaybe<Array<Scalars['String']['input']>>;
  pool_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  pool_not_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  pool_starts_with?: InputMaybe<Scalars['String']['input']>;
  pool_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  position?: InputMaybe<Scalars['String']['input']>;
  position_?: InputMaybe<BorrowPosition_Filter>;
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
  quoteRepaid?: InputMaybe<Scalars['BigInt']['input']>;
  quoteRepaid_gt?: InputMaybe<Scalars['BigInt']['input']>;
  quoteRepaid_gte?: InputMaybe<Scalars['BigInt']['input']>;
  quoteRepaid_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  quoteRepaid_lt?: InputMaybe<Scalars['BigInt']['input']>;
  quoteRepaid_lte?: InputMaybe<Scalars['BigInt']['input']>;
  quoteRepaid_not?: InputMaybe<Scalars['BigInt']['input']>;
  quoteRepaid_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  quoteUsedToPurchase?: InputMaybe<Scalars['BigInt']['input']>;
  quoteUsedToPurchase_gt?: InputMaybe<Scalars['BigInt']['input']>;
  quoteUsedToPurchase_gte?: InputMaybe<Scalars['BigInt']['input']>;
  quoteUsedToPurchase_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  quoteUsedToPurchase_lt?: InputMaybe<Scalars['BigInt']['input']>;
  quoteUsedToPurchase_lte?: InputMaybe<Scalars['BigInt']['input']>;
  quoteUsedToPurchase_not?: InputMaybe<Scalars['BigInt']['input']>;
  quoteUsedToPurchase_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  remainingCollateral?: InputMaybe<Scalars['BigInt']['input']>;
  remainingCollateral_gt?: InputMaybe<Scalars['BigInt']['input']>;
  remainingCollateral_gte?: InputMaybe<Scalars['BigInt']['input']>;
  remainingCollateral_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  remainingCollateral_lt?: InputMaybe<Scalars['BigInt']['input']>;
  remainingCollateral_lte?: InputMaybe<Scalars['BigInt']['input']>;
  remainingCollateral_not?: InputMaybe<Scalars['BigInt']['input']>;
  remainingCollateral_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  settledDebt?: InputMaybe<Scalars['BigInt']['input']>;
  settledDebt_gt?: InputMaybe<Scalars['BigInt']['input']>;
  settledDebt_gte?: InputMaybe<Scalars['BigInt']['input']>;
  settledDebt_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  settledDebt_lt?: InputMaybe<Scalars['BigInt']['input']>;
  settledDebt_lte?: InputMaybe<Scalars['BigInt']['input']>;
  settledDebt_not?: InputMaybe<Scalars['BigInt']['input']>;
  settledDebt_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  takeIndex?: InputMaybe<Scalars['BigInt']['input']>;
  takeIndex_gt?: InputMaybe<Scalars['BigInt']['input']>;
  takeIndex_gte?: InputMaybe<Scalars['BigInt']['input']>;
  takeIndex_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  takeIndex_lt?: InputMaybe<Scalars['BigInt']['input']>;
  takeIndex_lte?: InputMaybe<Scalars['BigInt']['input']>;
  takeIndex_not?: InputMaybe<Scalars['BigInt']['input']>;
  takeIndex_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
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
};

export enum BorrowerEvent_OrderBy {
  Account = 'account',
  AccountAddress = 'account__address',
  AccountCollateralToken = 'account__collateralToken',
  AccountDebtToken = 'account__debtToken',
  AccountId = 'account__id',
  AccountIsDpm = 'account__isDPM',
  AccountPositionType = 'account__positionType',
  AccountProtocol = 'account__protocol',
  AccountVaultId = 'account__vaultId',
  AmountBorrowed = 'amountBorrowed',
  Auction = 'auction',
  AuctionBondSize = 'auction__bondSize',
  AuctionCollateral = 'auction__collateral',
  AuctionDebtToCover = 'auction__debtToCover',
  AuctionEndOfGracePeriod = 'auction__endOfGracePeriod',
  AuctionHpbOnKick = 'auction__hpbOnKick',
  AuctionId = 'auction__id',
  AuctionInLiquidation = 'auction__inLiquidation',
  AuctionIsCollateralized = 'auction__isCollateralized',
  AuctionKickTime = 'auction__kickTime',
  AuctionKicker = 'auction__kicker',
  AuctionNeutralPrice = 'auction__neutralPrice',
  AuctionPrice = 'auction__price',
  AuctionReferencePrice = 'auction__referencePrice',
  BlockNumber = 'blockNumber',
  BondChange = 'bondChange',
  CollateralAfter = 'collateralAfter',
  CollateralBefore = 'collateralBefore',
  CollateralDelta = 'collateralDelta',
  CollateralForLiquidation = 'collateralForLiquidation',
  CollateralPledged = 'collateralPledged',
  CollateralPulled = 'collateralPulled',
  CollateralPurachased = 'collateralPurachased',
  CollateralToken = 'collateralToken',
  CollateralTokenPriceUsd = 'collateralTokenPriceUSD',
  CollateralTokenAddress = 'collateralToken__address',
  CollateralTokenDecimals = 'collateralToken__decimals',
  CollateralTokenId = 'collateralToken__id',
  CollateralTokenPrecision = 'collateralToken__precision',
  CollateralTokenSymbol = 'collateralToken__symbol',
  DebtAfter = 'debtAfter',
  DebtBefore = 'debtBefore',
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
  IsReward = 'isReward',
  Kind = 'kind',
  OriginationFee = 'originationFee',
  Pool = 'pool',
  PoolAccuredDebt = 'pool__accuredDebt',
  PoolAddress = 'pool__address',
  PoolApr7dAverage = 'pool__apr7dAverage',
  PoolApr30dAverage = 'pool__apr30dAverage',
  PoolAuctionPrice = 'pool__auctionPrice',
  PoolBorrowApr = 'pool__borrowApr',
  PoolBorrowDailyTokenBlocks = 'pool__borrowDailyTokenBlocks',
  PoolClaimableReserves = 'pool__claimableReserves',
  PoolClaimableReservesRemaining = 'pool__claimableReservesRemaining',
  PoolCollateralAddress = 'pool__collateralAddress',
  PoolCollateralScale = 'pool__collateralScale',
  PoolCurrentBurnEpoch = 'pool__currentBurnEpoch',
  PoolDailyPercentageRate30dAverage = 'pool__dailyPercentageRate30dAverage',
  PoolDebt = 'pool__debt',
  PoolDebtInAuctions = 'pool__debtInAuctions',
  PoolDepositSize = 'pool__depositSize',
  PoolEarnDailyTokenBlocks = 'pool__earnDailyTokenBlocks',
  PoolHpb = 'pool__hpb',
  PoolHpbIndex = 'pool__hpbIndex',
  PoolHtp = 'pool__htp',
  PoolHtpIndex = 'pool__htpIndex',
  PoolId = 'pool__id',
  PoolInterestRate = 'pool__interestRate',
  PoolLastInterestRateUpdate = 'pool__lastInterestRateUpdate',
  PoolLendApr = 'pool__lendApr',
  PoolLendApr7dAverage = 'pool__lendApr7dAverage',
  PoolLendApr30dAverage = 'pool__lendApr30dAverage',
  PoolLendDailyPercentageRate30dAverage = 'pool__lendDailyPercentageRate30dAverage',
  PoolLendMonthlyPercentageRate30dAverage = 'pool__lendMonthlyPercentageRate30dAverage',
  PoolLoansCount = 'pool__loansCount',
  PoolLup = 'pool__lup',
  PoolLupIndex = 'pool__lupIndex',
  PoolMonthlyPercentageRate30dAverage = 'pool__monthlyPercentageRate30dAverage',
  PoolName = 'pool__name',
  PoolPoolActualUtilization = 'pool__poolActualUtilization',
  PoolPoolCollateralization = 'pool__poolCollateralization',
  PoolPoolMinDebtAmount = 'pool__poolMinDebtAmount',
  PoolPoolTargetUtilization = 'pool__poolTargetUtilization',
  PoolQuoteTokenAddress = 'pool__quoteTokenAddress',
  PoolQuoteTokenScale = 'pool__quoteTokenScale',
  PoolReserves = 'pool__reserves',
  PoolSummerDepositAmountEarningInterest = 'pool__summerDepositAmountEarningInterest',
  PoolT0debt = 'pool__t0debt',
  PoolTimeRemaining = 'pool__timeRemaining',
  PoolTotalAuctionsInPool = 'pool__totalAuctionsInPool',
  Position = 'position',
  PositionBorrowCumulativeCollateralDeposit = 'position__borrowCumulativeCollateralDeposit',
  PositionBorrowCumulativeCollateralWithdraw = 'position__borrowCumulativeCollateralWithdraw',
  PositionBorrowCumulativeDebtDeposit = 'position__borrowCumulativeDebtDeposit',
  PositionBorrowCumulativeDebtWithdraw = 'position__borrowCumulativeDebtWithdraw',
  PositionBorrowCumulativeDepositInCollateralToken = 'position__borrowCumulativeDepositInCollateralToken',
  PositionBorrowCumulativeDepositInQuoteToken = 'position__borrowCumulativeDepositInQuoteToken',
  PositionBorrowCumulativeDepositUsd = 'position__borrowCumulativeDepositUSD',
  PositionBorrowCumulativeFeesInCollateralToken = 'position__borrowCumulativeFeesInCollateralToken',
  PositionBorrowCumulativeFeesInQuoteToken = 'position__borrowCumulativeFeesInQuoteToken',
  PositionBorrowCumulativeFeesUsd = 'position__borrowCumulativeFeesUSD',
  PositionBorrowCumulativeWithdrawInCollateralToken = 'position__borrowCumulativeWithdrawInCollateralToken',
  PositionBorrowCumulativeWithdrawInQuoteToken = 'position__borrowCumulativeWithdrawInQuoteToken',
  PositionBorrowCumulativeWithdrawUsd = 'position__borrowCumulativeWithdrawUSD',
  PositionBorrowDailyTokenBlocks = 'position__borrowDailyTokenBlocks',
  PositionBorrowLastUpdateBlock = 'position__borrowLastUpdateBlock',
  PositionCollateral = 'position__collateral',
  PositionDebt = 'position__debt',
  PositionId = 'position__id',
  PositionLiquidationPrice = 'position__liquidationPrice',
  PositionT0Debt = 'position__t0Debt',
  PositionT0Np = 'position__t0Np_',
  QuoteRepaid = 'quoteRepaid',
  QuoteUsedToPurchase = 'quoteUsedToPurchase',
  RemainingCollateral = 'remainingCollateral',
  SettledDebt = 'settledDebt',
  TakeIndex = 'takeIndex',
  Timestamp = 'timestamp',
  TxHash = 'txHash'
}

export type Bucket = {
  __typename?: 'Bucket';
  bucketLPs: Scalars['BigInt']['output'];
  collateral: Scalars['BigInt']['output'];
  exchangeRate?: Maybe<Scalars['BigInt']['output']>;
  id: Scalars['ID']['output'];
  index?: Maybe<Scalars['BigInt']['output']>;
  pool: Pool;
  price?: Maybe<Scalars['BigInt']['output']>;
  quoteTokens: Scalars['BigInt']['output'];
  scale: Scalars['BigInt']['output'];
};

export type Bucket_Filter = {
  /** Filter for the block changed event. */
  _change_block?: InputMaybe<BlockChangedFilter>;
  and?: InputMaybe<Array<InputMaybe<Bucket_Filter>>>;
  bucketLPs?: InputMaybe<Scalars['BigInt']['input']>;
  bucketLPs_gt?: InputMaybe<Scalars['BigInt']['input']>;
  bucketLPs_gte?: InputMaybe<Scalars['BigInt']['input']>;
  bucketLPs_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  bucketLPs_lt?: InputMaybe<Scalars['BigInt']['input']>;
  bucketLPs_lte?: InputMaybe<Scalars['BigInt']['input']>;
  bucketLPs_not?: InputMaybe<Scalars['BigInt']['input']>;
  bucketLPs_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  collateral?: InputMaybe<Scalars['BigInt']['input']>;
  collateral_gt?: InputMaybe<Scalars['BigInt']['input']>;
  collateral_gte?: InputMaybe<Scalars['BigInt']['input']>;
  collateral_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  collateral_lt?: InputMaybe<Scalars['BigInt']['input']>;
  collateral_lte?: InputMaybe<Scalars['BigInt']['input']>;
  collateral_not?: InputMaybe<Scalars['BigInt']['input']>;
  collateral_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  exchangeRate?: InputMaybe<Scalars['BigInt']['input']>;
  exchangeRate_gt?: InputMaybe<Scalars['BigInt']['input']>;
  exchangeRate_gte?: InputMaybe<Scalars['BigInt']['input']>;
  exchangeRate_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  exchangeRate_lt?: InputMaybe<Scalars['BigInt']['input']>;
  exchangeRate_lte?: InputMaybe<Scalars['BigInt']['input']>;
  exchangeRate_not?: InputMaybe<Scalars['BigInt']['input']>;
  exchangeRate_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  id?: InputMaybe<Scalars['ID']['input']>;
  id_gt?: InputMaybe<Scalars['ID']['input']>;
  id_gte?: InputMaybe<Scalars['ID']['input']>;
  id_in?: InputMaybe<Array<Scalars['ID']['input']>>;
  id_lt?: InputMaybe<Scalars['ID']['input']>;
  id_lte?: InputMaybe<Scalars['ID']['input']>;
  id_not?: InputMaybe<Scalars['ID']['input']>;
  id_not_in?: InputMaybe<Array<Scalars['ID']['input']>>;
  index?: InputMaybe<Scalars['BigInt']['input']>;
  index_gt?: InputMaybe<Scalars['BigInt']['input']>;
  index_gte?: InputMaybe<Scalars['BigInt']['input']>;
  index_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  index_lt?: InputMaybe<Scalars['BigInt']['input']>;
  index_lte?: InputMaybe<Scalars['BigInt']['input']>;
  index_not?: InputMaybe<Scalars['BigInt']['input']>;
  index_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  or?: InputMaybe<Array<InputMaybe<Bucket_Filter>>>;
  pool?: InputMaybe<Scalars['String']['input']>;
  pool_?: InputMaybe<Pool_Filter>;
  pool_contains?: InputMaybe<Scalars['String']['input']>;
  pool_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  pool_ends_with?: InputMaybe<Scalars['String']['input']>;
  pool_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  pool_gt?: InputMaybe<Scalars['String']['input']>;
  pool_gte?: InputMaybe<Scalars['String']['input']>;
  pool_in?: InputMaybe<Array<Scalars['String']['input']>>;
  pool_lt?: InputMaybe<Scalars['String']['input']>;
  pool_lte?: InputMaybe<Scalars['String']['input']>;
  pool_not?: InputMaybe<Scalars['String']['input']>;
  pool_not_contains?: InputMaybe<Scalars['String']['input']>;
  pool_not_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  pool_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  pool_not_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  pool_not_in?: InputMaybe<Array<Scalars['String']['input']>>;
  pool_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  pool_not_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  pool_starts_with?: InputMaybe<Scalars['String']['input']>;
  pool_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  price?: InputMaybe<Scalars['BigInt']['input']>;
  price_gt?: InputMaybe<Scalars['BigInt']['input']>;
  price_gte?: InputMaybe<Scalars['BigInt']['input']>;
  price_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  price_lt?: InputMaybe<Scalars['BigInt']['input']>;
  price_lte?: InputMaybe<Scalars['BigInt']['input']>;
  price_not?: InputMaybe<Scalars['BigInt']['input']>;
  price_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  quoteTokens?: InputMaybe<Scalars['BigInt']['input']>;
  quoteTokens_gt?: InputMaybe<Scalars['BigInt']['input']>;
  quoteTokens_gte?: InputMaybe<Scalars['BigInt']['input']>;
  quoteTokens_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  quoteTokens_lt?: InputMaybe<Scalars['BigInt']['input']>;
  quoteTokens_lte?: InputMaybe<Scalars['BigInt']['input']>;
  quoteTokens_not?: InputMaybe<Scalars['BigInt']['input']>;
  quoteTokens_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  scale?: InputMaybe<Scalars['BigInt']['input']>;
  scale_gt?: InputMaybe<Scalars['BigInt']['input']>;
  scale_gte?: InputMaybe<Scalars['BigInt']['input']>;
  scale_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  scale_lt?: InputMaybe<Scalars['BigInt']['input']>;
  scale_lte?: InputMaybe<Scalars['BigInt']['input']>;
  scale_not?: InputMaybe<Scalars['BigInt']['input']>;
  scale_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
};

export enum Bucket_OrderBy {
  BucketLPs = 'bucketLPs',
  Collateral = 'collateral',
  ExchangeRate = 'exchangeRate',
  Id = 'id',
  Index = 'index',
  Pool = 'pool',
  PoolAccuredDebt = 'pool__accuredDebt',
  PoolAddress = 'pool__address',
  PoolApr7dAverage = 'pool__apr7dAverage',
  PoolApr30dAverage = 'pool__apr30dAverage',
  PoolAuctionPrice = 'pool__auctionPrice',
  PoolBorrowApr = 'pool__borrowApr',
  PoolBorrowDailyTokenBlocks = 'pool__borrowDailyTokenBlocks',
  PoolClaimableReserves = 'pool__claimableReserves',
  PoolClaimableReservesRemaining = 'pool__claimableReservesRemaining',
  PoolCollateralAddress = 'pool__collateralAddress',
  PoolCollateralScale = 'pool__collateralScale',
  PoolCurrentBurnEpoch = 'pool__currentBurnEpoch',
  PoolDailyPercentageRate30dAverage = 'pool__dailyPercentageRate30dAverage',
  PoolDebt = 'pool__debt',
  PoolDebtInAuctions = 'pool__debtInAuctions',
  PoolDepositSize = 'pool__depositSize',
  PoolEarnDailyTokenBlocks = 'pool__earnDailyTokenBlocks',
  PoolHpb = 'pool__hpb',
  PoolHpbIndex = 'pool__hpbIndex',
  PoolHtp = 'pool__htp',
  PoolHtpIndex = 'pool__htpIndex',
  PoolId = 'pool__id',
  PoolInterestRate = 'pool__interestRate',
  PoolLastInterestRateUpdate = 'pool__lastInterestRateUpdate',
  PoolLendApr = 'pool__lendApr',
  PoolLendApr7dAverage = 'pool__lendApr7dAverage',
  PoolLendApr30dAverage = 'pool__lendApr30dAverage',
  PoolLendDailyPercentageRate30dAverage = 'pool__lendDailyPercentageRate30dAverage',
  PoolLendMonthlyPercentageRate30dAverage = 'pool__lendMonthlyPercentageRate30dAverage',
  PoolLoansCount = 'pool__loansCount',
  PoolLup = 'pool__lup',
  PoolLupIndex = 'pool__lupIndex',
  PoolMonthlyPercentageRate30dAverage = 'pool__monthlyPercentageRate30dAverage',
  PoolName = 'pool__name',
  PoolPoolActualUtilization = 'pool__poolActualUtilization',
  PoolPoolCollateralization = 'pool__poolCollateralization',
  PoolPoolMinDebtAmount = 'pool__poolMinDebtAmount',
  PoolPoolTargetUtilization = 'pool__poolTargetUtilization',
  PoolQuoteTokenAddress = 'pool__quoteTokenAddress',
  PoolQuoteTokenScale = 'pool__quoteTokenScale',
  PoolReserves = 'pool__reserves',
  PoolSummerDepositAmountEarningInterest = 'pool__summerDepositAmountEarningInterest',
  PoolT0debt = 'pool__t0debt',
  PoolTimeRemaining = 'pool__timeRemaining',
  PoolTotalAuctionsInPool = 'pool__totalAuctionsInPool',
  Price = 'price',
  QuoteTokens = 'quoteTokens',
  Scale = 'scale'
}

export type Claimed = {
  __typename?: 'Claimed';
  amount?: Maybe<Scalars['BigInt']['output']>;
  id: Scalars['Bytes']['output'];
  type: Scalars['String']['output'];
  user: User;
  week: Week;
};

export type Claimed_Filter = {
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
  and?: InputMaybe<Array<InputMaybe<Claimed_Filter>>>;
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
  or?: InputMaybe<Array<InputMaybe<Claimed_Filter>>>;
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
  user?: InputMaybe<Scalars['String']['input']>;
  user_?: InputMaybe<User_Filter>;
  user_contains?: InputMaybe<Scalars['String']['input']>;
  user_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  user_ends_with?: InputMaybe<Scalars['String']['input']>;
  user_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  user_gt?: InputMaybe<Scalars['String']['input']>;
  user_gte?: InputMaybe<Scalars['String']['input']>;
  user_in?: InputMaybe<Array<Scalars['String']['input']>>;
  user_lt?: InputMaybe<Scalars['String']['input']>;
  user_lte?: InputMaybe<Scalars['String']['input']>;
  user_not?: InputMaybe<Scalars['String']['input']>;
  user_not_contains?: InputMaybe<Scalars['String']['input']>;
  user_not_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  user_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  user_not_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  user_not_in?: InputMaybe<Array<Scalars['String']['input']>>;
  user_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  user_not_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  user_starts_with?: InputMaybe<Scalars['String']['input']>;
  user_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  week?: InputMaybe<Scalars['String']['input']>;
  week_?: InputMaybe<Week_Filter>;
  week_contains?: InputMaybe<Scalars['String']['input']>;
  week_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  week_ends_with?: InputMaybe<Scalars['String']['input']>;
  week_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  week_gt?: InputMaybe<Scalars['String']['input']>;
  week_gte?: InputMaybe<Scalars['String']['input']>;
  week_in?: InputMaybe<Array<Scalars['String']['input']>>;
  week_lt?: InputMaybe<Scalars['String']['input']>;
  week_lte?: InputMaybe<Scalars['String']['input']>;
  week_not?: InputMaybe<Scalars['String']['input']>;
  week_not_contains?: InputMaybe<Scalars['String']['input']>;
  week_not_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  week_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  week_not_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  week_not_in?: InputMaybe<Array<Scalars['String']['input']>>;
  week_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  week_not_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  week_starts_with?: InputMaybe<Scalars['String']['input']>;
  week_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
};

export enum Claimed_OrderBy {
  Amount = 'amount',
  Id = 'id',
  Type = 'type',
  User = 'user',
  UserAddress = 'user__address',
  UserId = 'user__id',
  UserVaultCount = 'user__vaultCount',
  Week = 'week',
  WeekId = 'week__id',
  WeekWeek = 'week__week',
  WeekWeekEndTimestamp = 'week__weekEndTimestamp',
  WeekWeekStartTimestamp = 'week__weekStartTimestamp'
}

export type CreatePositionEvent = {
  __typename?: 'CreatePositionEvent';
  account?: Maybe<Account>;
  blockNumber: Scalars['BigInt']['output'];
  collateralToken: Token;
  debtToken: Token;
  id: Scalars['Bytes']['output'];
  positionType: Scalars['String']['output'];
  protocol: Scalars['String']['output'];
  timestamp: Scalars['BigInt']['output'];
  txHash: Scalars['Bytes']['output'];
};

export type CreatePositionEvent_Filter = {
  /** Filter for the block changed event. */
  _change_block?: InputMaybe<BlockChangedFilter>;
  account?: InputMaybe<Scalars['String']['input']>;
  account_?: InputMaybe<Account_Filter>;
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
  and?: InputMaybe<Array<InputMaybe<CreatePositionEvent_Filter>>>;
  blockNumber?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_gt?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_gte?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  blockNumber_lt?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_lte?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_not?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  collateralToken?: InputMaybe<Scalars['String']['input']>;
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
  debtToken?: InputMaybe<Scalars['String']['input']>;
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
  or?: InputMaybe<Array<InputMaybe<CreatePositionEvent_Filter>>>;
  positionType?: InputMaybe<Scalars['String']['input']>;
  positionType_contains?: InputMaybe<Scalars['String']['input']>;
  positionType_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  positionType_ends_with?: InputMaybe<Scalars['String']['input']>;
  positionType_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  positionType_gt?: InputMaybe<Scalars['String']['input']>;
  positionType_gte?: InputMaybe<Scalars['String']['input']>;
  positionType_in?: InputMaybe<Array<Scalars['String']['input']>>;
  positionType_lt?: InputMaybe<Scalars['String']['input']>;
  positionType_lte?: InputMaybe<Scalars['String']['input']>;
  positionType_not?: InputMaybe<Scalars['String']['input']>;
  positionType_not_contains?: InputMaybe<Scalars['String']['input']>;
  positionType_not_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  positionType_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  positionType_not_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  positionType_not_in?: InputMaybe<Array<Scalars['String']['input']>>;
  positionType_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  positionType_not_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  positionType_starts_with?: InputMaybe<Scalars['String']['input']>;
  positionType_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
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
};

export enum CreatePositionEvent_OrderBy {
  Account = 'account',
  AccountAddress = 'account__address',
  AccountCollateralToken = 'account__collateralToken',
  AccountDebtToken = 'account__debtToken',
  AccountId = 'account__id',
  AccountIsDpm = 'account__isDPM',
  AccountPositionType = 'account__positionType',
  AccountProtocol = 'account__protocol',
  AccountVaultId = 'account__vaultId',
  BlockNumber = 'blockNumber',
  CollateralToken = 'collateralToken',
  CollateralTokenAddress = 'collateralToken__address',
  CollateralTokenDecimals = 'collateralToken__decimals',
  CollateralTokenId = 'collateralToken__id',
  CollateralTokenPrecision = 'collateralToken__precision',
  CollateralTokenSymbol = 'collateralToken__symbol',
  DebtToken = 'debtToken',
  DebtTokenAddress = 'debtToken__address',
  DebtTokenDecimals = 'debtToken__decimals',
  DebtTokenId = 'debtToken__id',
  DebtTokenPrecision = 'debtToken__precision',
  DebtTokenSymbol = 'debtToken__symbol',
  Id = 'id',
  PositionType = 'positionType',
  Protocol = 'protocol',
  Timestamp = 'timestamp',
  TxHash = 'txHash'
}

export type Day = {
  __typename?: 'Day';
  borrowDailyRewards?: Maybe<Array<BorrowDailyReward>>;
  day: Scalars['BigInt']['output'];
  dayDate?: Maybe<Scalars['String']['output']>;
  dayStartTimestamp: Scalars['BigInt']['output'];
  earnDailyRewards?: Maybe<Array<EarnDailyReward>>;
  id: Scalars['ID']['output'];
  week: Week;
};


export type DayBorrowDailyRewardsArgs = {
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<BorrowDailyReward_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  where?: InputMaybe<BorrowDailyReward_Filter>;
};


export type DayEarnDailyRewardsArgs = {
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<EarnDailyReward_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  where?: InputMaybe<EarnDailyReward_Filter>;
};

export type Day_Filter = {
  /** Filter for the block changed event. */
  _change_block?: InputMaybe<BlockChangedFilter>;
  and?: InputMaybe<Array<InputMaybe<Day_Filter>>>;
  borrowDailyRewards_?: InputMaybe<BorrowDailyReward_Filter>;
  day?: InputMaybe<Scalars['BigInt']['input']>;
  dayDate?: InputMaybe<Scalars['String']['input']>;
  dayDate_contains?: InputMaybe<Scalars['String']['input']>;
  dayDate_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  dayDate_ends_with?: InputMaybe<Scalars['String']['input']>;
  dayDate_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  dayDate_gt?: InputMaybe<Scalars['String']['input']>;
  dayDate_gte?: InputMaybe<Scalars['String']['input']>;
  dayDate_in?: InputMaybe<Array<Scalars['String']['input']>>;
  dayDate_lt?: InputMaybe<Scalars['String']['input']>;
  dayDate_lte?: InputMaybe<Scalars['String']['input']>;
  dayDate_not?: InputMaybe<Scalars['String']['input']>;
  dayDate_not_contains?: InputMaybe<Scalars['String']['input']>;
  dayDate_not_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  dayDate_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  dayDate_not_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  dayDate_not_in?: InputMaybe<Array<Scalars['String']['input']>>;
  dayDate_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  dayDate_not_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  dayDate_starts_with?: InputMaybe<Scalars['String']['input']>;
  dayDate_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  dayStartTimestamp?: InputMaybe<Scalars['BigInt']['input']>;
  dayStartTimestamp_gt?: InputMaybe<Scalars['BigInt']['input']>;
  dayStartTimestamp_gte?: InputMaybe<Scalars['BigInt']['input']>;
  dayStartTimestamp_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  dayStartTimestamp_lt?: InputMaybe<Scalars['BigInt']['input']>;
  dayStartTimestamp_lte?: InputMaybe<Scalars['BigInt']['input']>;
  dayStartTimestamp_not?: InputMaybe<Scalars['BigInt']['input']>;
  dayStartTimestamp_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  day_gt?: InputMaybe<Scalars['BigInt']['input']>;
  day_gte?: InputMaybe<Scalars['BigInt']['input']>;
  day_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  day_lt?: InputMaybe<Scalars['BigInt']['input']>;
  day_lte?: InputMaybe<Scalars['BigInt']['input']>;
  day_not?: InputMaybe<Scalars['BigInt']['input']>;
  day_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  earnDailyRewards_?: InputMaybe<EarnDailyReward_Filter>;
  id?: InputMaybe<Scalars['ID']['input']>;
  id_gt?: InputMaybe<Scalars['ID']['input']>;
  id_gte?: InputMaybe<Scalars['ID']['input']>;
  id_in?: InputMaybe<Array<Scalars['ID']['input']>>;
  id_lt?: InputMaybe<Scalars['ID']['input']>;
  id_lte?: InputMaybe<Scalars['ID']['input']>;
  id_not?: InputMaybe<Scalars['ID']['input']>;
  id_not_in?: InputMaybe<Array<Scalars['ID']['input']>>;
  or?: InputMaybe<Array<InputMaybe<Day_Filter>>>;
  week?: InputMaybe<Scalars['String']['input']>;
  week_?: InputMaybe<Week_Filter>;
  week_contains?: InputMaybe<Scalars['String']['input']>;
  week_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  week_ends_with?: InputMaybe<Scalars['String']['input']>;
  week_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  week_gt?: InputMaybe<Scalars['String']['input']>;
  week_gte?: InputMaybe<Scalars['String']['input']>;
  week_in?: InputMaybe<Array<Scalars['String']['input']>>;
  week_lt?: InputMaybe<Scalars['String']['input']>;
  week_lte?: InputMaybe<Scalars['String']['input']>;
  week_not?: InputMaybe<Scalars['String']['input']>;
  week_not_contains?: InputMaybe<Scalars['String']['input']>;
  week_not_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  week_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  week_not_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  week_not_in?: InputMaybe<Array<Scalars['String']['input']>>;
  week_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  week_not_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  week_starts_with?: InputMaybe<Scalars['String']['input']>;
  week_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
};

export enum Day_OrderBy {
  BorrowDailyRewards = 'borrowDailyRewards',
  Day = 'day',
  DayDate = 'dayDate',
  DayStartTimestamp = 'dayStartTimestamp',
  EarnDailyRewards = 'earnDailyRewards',
  Id = 'id',
  Week = 'week',
  WeekId = 'week__id',
  WeekWeek = 'week__week',
  WeekWeekEndTimestamp = 'week__weekEndTimestamp',
  WeekWeekStartTimestamp = 'week__weekStartTimestamp'
}

export type EarnDailyReward = {
  __typename?: 'EarnDailyReward';
  account?: Maybe<Account>;
  day: Day;
  id: Scalars['ID']['output'];
  pool: Pool;
  reward: Scalars['BigDecimal']['output'];
  user?: Maybe<User>;
  week: Week;
};

export type EarnDailyReward_Filter = {
  /** Filter for the block changed event. */
  _change_block?: InputMaybe<BlockChangedFilter>;
  account?: InputMaybe<Scalars['String']['input']>;
  account_?: InputMaybe<Account_Filter>;
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
  and?: InputMaybe<Array<InputMaybe<EarnDailyReward_Filter>>>;
  day?: InputMaybe<Scalars['String']['input']>;
  day_?: InputMaybe<Day_Filter>;
  day_contains?: InputMaybe<Scalars['String']['input']>;
  day_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  day_ends_with?: InputMaybe<Scalars['String']['input']>;
  day_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  day_gt?: InputMaybe<Scalars['String']['input']>;
  day_gte?: InputMaybe<Scalars['String']['input']>;
  day_in?: InputMaybe<Array<Scalars['String']['input']>>;
  day_lt?: InputMaybe<Scalars['String']['input']>;
  day_lte?: InputMaybe<Scalars['String']['input']>;
  day_not?: InputMaybe<Scalars['String']['input']>;
  day_not_contains?: InputMaybe<Scalars['String']['input']>;
  day_not_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  day_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  day_not_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  day_not_in?: InputMaybe<Array<Scalars['String']['input']>>;
  day_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  day_not_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  day_starts_with?: InputMaybe<Scalars['String']['input']>;
  day_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  id?: InputMaybe<Scalars['ID']['input']>;
  id_gt?: InputMaybe<Scalars['ID']['input']>;
  id_gte?: InputMaybe<Scalars['ID']['input']>;
  id_in?: InputMaybe<Array<Scalars['ID']['input']>>;
  id_lt?: InputMaybe<Scalars['ID']['input']>;
  id_lte?: InputMaybe<Scalars['ID']['input']>;
  id_not?: InputMaybe<Scalars['ID']['input']>;
  id_not_in?: InputMaybe<Array<Scalars['ID']['input']>>;
  or?: InputMaybe<Array<InputMaybe<EarnDailyReward_Filter>>>;
  pool?: InputMaybe<Scalars['String']['input']>;
  pool_?: InputMaybe<Pool_Filter>;
  pool_contains?: InputMaybe<Scalars['String']['input']>;
  pool_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  pool_ends_with?: InputMaybe<Scalars['String']['input']>;
  pool_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  pool_gt?: InputMaybe<Scalars['String']['input']>;
  pool_gte?: InputMaybe<Scalars['String']['input']>;
  pool_in?: InputMaybe<Array<Scalars['String']['input']>>;
  pool_lt?: InputMaybe<Scalars['String']['input']>;
  pool_lte?: InputMaybe<Scalars['String']['input']>;
  pool_not?: InputMaybe<Scalars['String']['input']>;
  pool_not_contains?: InputMaybe<Scalars['String']['input']>;
  pool_not_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  pool_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  pool_not_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  pool_not_in?: InputMaybe<Array<Scalars['String']['input']>>;
  pool_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  pool_not_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  pool_starts_with?: InputMaybe<Scalars['String']['input']>;
  pool_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  reward?: InputMaybe<Scalars['BigDecimal']['input']>;
  reward_gt?: InputMaybe<Scalars['BigDecimal']['input']>;
  reward_gte?: InputMaybe<Scalars['BigDecimal']['input']>;
  reward_in?: InputMaybe<Array<Scalars['BigDecimal']['input']>>;
  reward_lt?: InputMaybe<Scalars['BigDecimal']['input']>;
  reward_lte?: InputMaybe<Scalars['BigDecimal']['input']>;
  reward_not?: InputMaybe<Scalars['BigDecimal']['input']>;
  reward_not_in?: InputMaybe<Array<Scalars['BigDecimal']['input']>>;
  user?: InputMaybe<Scalars['String']['input']>;
  user_?: InputMaybe<User_Filter>;
  user_contains?: InputMaybe<Scalars['String']['input']>;
  user_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  user_ends_with?: InputMaybe<Scalars['String']['input']>;
  user_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  user_gt?: InputMaybe<Scalars['String']['input']>;
  user_gte?: InputMaybe<Scalars['String']['input']>;
  user_in?: InputMaybe<Array<Scalars['String']['input']>>;
  user_lt?: InputMaybe<Scalars['String']['input']>;
  user_lte?: InputMaybe<Scalars['String']['input']>;
  user_not?: InputMaybe<Scalars['String']['input']>;
  user_not_contains?: InputMaybe<Scalars['String']['input']>;
  user_not_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  user_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  user_not_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  user_not_in?: InputMaybe<Array<Scalars['String']['input']>>;
  user_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  user_not_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  user_starts_with?: InputMaybe<Scalars['String']['input']>;
  user_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  week?: InputMaybe<Scalars['String']['input']>;
  week_?: InputMaybe<Week_Filter>;
  week_contains?: InputMaybe<Scalars['String']['input']>;
  week_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  week_ends_with?: InputMaybe<Scalars['String']['input']>;
  week_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  week_gt?: InputMaybe<Scalars['String']['input']>;
  week_gte?: InputMaybe<Scalars['String']['input']>;
  week_in?: InputMaybe<Array<Scalars['String']['input']>>;
  week_lt?: InputMaybe<Scalars['String']['input']>;
  week_lte?: InputMaybe<Scalars['String']['input']>;
  week_not?: InputMaybe<Scalars['String']['input']>;
  week_not_contains?: InputMaybe<Scalars['String']['input']>;
  week_not_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  week_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  week_not_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  week_not_in?: InputMaybe<Array<Scalars['String']['input']>>;
  week_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  week_not_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  week_starts_with?: InputMaybe<Scalars['String']['input']>;
  week_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
};

export enum EarnDailyReward_OrderBy {
  Account = 'account',
  AccountAddress = 'account__address',
  AccountCollateralToken = 'account__collateralToken',
  AccountDebtToken = 'account__debtToken',
  AccountId = 'account__id',
  AccountIsDpm = 'account__isDPM',
  AccountPositionType = 'account__positionType',
  AccountProtocol = 'account__protocol',
  AccountVaultId = 'account__vaultId',
  Day = 'day',
  DayDay = 'day__day',
  DayDayDate = 'day__dayDate',
  DayDayStartTimestamp = 'day__dayStartTimestamp',
  DayId = 'day__id',
  Id = 'id',
  Pool = 'pool',
  PoolAccuredDebt = 'pool__accuredDebt',
  PoolAddress = 'pool__address',
  PoolApr7dAverage = 'pool__apr7dAverage',
  PoolApr30dAverage = 'pool__apr30dAverage',
  PoolAuctionPrice = 'pool__auctionPrice',
  PoolBorrowApr = 'pool__borrowApr',
  PoolBorrowDailyTokenBlocks = 'pool__borrowDailyTokenBlocks',
  PoolClaimableReserves = 'pool__claimableReserves',
  PoolClaimableReservesRemaining = 'pool__claimableReservesRemaining',
  PoolCollateralAddress = 'pool__collateralAddress',
  PoolCollateralScale = 'pool__collateralScale',
  PoolCurrentBurnEpoch = 'pool__currentBurnEpoch',
  PoolDailyPercentageRate30dAverage = 'pool__dailyPercentageRate30dAverage',
  PoolDebt = 'pool__debt',
  PoolDebtInAuctions = 'pool__debtInAuctions',
  PoolDepositSize = 'pool__depositSize',
  PoolEarnDailyTokenBlocks = 'pool__earnDailyTokenBlocks',
  PoolHpb = 'pool__hpb',
  PoolHpbIndex = 'pool__hpbIndex',
  PoolHtp = 'pool__htp',
  PoolHtpIndex = 'pool__htpIndex',
  PoolId = 'pool__id',
  PoolInterestRate = 'pool__interestRate',
  PoolLastInterestRateUpdate = 'pool__lastInterestRateUpdate',
  PoolLendApr = 'pool__lendApr',
  PoolLendApr7dAverage = 'pool__lendApr7dAverage',
  PoolLendApr30dAverage = 'pool__lendApr30dAverage',
  PoolLendDailyPercentageRate30dAverage = 'pool__lendDailyPercentageRate30dAverage',
  PoolLendMonthlyPercentageRate30dAverage = 'pool__lendMonthlyPercentageRate30dAverage',
  PoolLoansCount = 'pool__loansCount',
  PoolLup = 'pool__lup',
  PoolLupIndex = 'pool__lupIndex',
  PoolMonthlyPercentageRate30dAverage = 'pool__monthlyPercentageRate30dAverage',
  PoolName = 'pool__name',
  PoolPoolActualUtilization = 'pool__poolActualUtilization',
  PoolPoolCollateralization = 'pool__poolCollateralization',
  PoolPoolMinDebtAmount = 'pool__poolMinDebtAmount',
  PoolPoolTargetUtilization = 'pool__poolTargetUtilization',
  PoolQuoteTokenAddress = 'pool__quoteTokenAddress',
  PoolQuoteTokenScale = 'pool__quoteTokenScale',
  PoolReserves = 'pool__reserves',
  PoolSummerDepositAmountEarningInterest = 'pool__summerDepositAmountEarningInterest',
  PoolT0debt = 'pool__t0debt',
  PoolTimeRemaining = 'pool__timeRemaining',
  PoolTotalAuctionsInPool = 'pool__totalAuctionsInPool',
  Reward = 'reward',
  User = 'user',
  UserAddress = 'user__address',
  UserId = 'user__id',
  UserVaultCount = 'user__vaultCount',
  Week = 'week',
  WeekId = 'week__id',
  WeekWeek = 'week__week',
  WeekWeekEndTimestamp = 'week__weekEndTimestamp',
  WeekWeekStartTimestamp = 'week__weekStartTimestamp'
}

export type EarnPosition = {
  __typename?: 'EarnPosition';
  account?: Maybe<Account>;
  bucketPositions?: Maybe<Array<EarnPositionBucket>>;
  earnCumulativeDepositInCollateralToken: Scalars['BigDecimal']['output'];
  earnCumulativeDepositInQuoteToken: Scalars['BigDecimal']['output'];
  earnCumulativeDepositUSD: Scalars['BigDecimal']['output'];
  earnCumulativeFeesInCollateralToken: Scalars['BigDecimal']['output'];
  earnCumulativeFeesInQuoteToken: Scalars['BigDecimal']['output'];
  earnCumulativeFeesUSD: Scalars['BigDecimal']['output'];
  earnCumulativeQuoteTokenDeposit: Scalars['BigDecimal']['output'];
  earnCumulativeQuoteTokenWithdraw: Scalars['BigDecimal']['output'];
  earnCumulativeWithdrawInCollateralToken: Scalars['BigDecimal']['output'];
  earnCumulativeWithdrawInQuoteToken: Scalars['BigDecimal']['output'];
  earnCumulativeWithdrawUSD: Scalars['BigDecimal']['output'];
  earnDailyTokenBlocks: Scalars['BigInt']['output'];
  earnIsEarning: Scalars['Boolean']['output'];
  earnLastUpdateBlock: Scalars['BigInt']['output'];
  earnPosition?: Maybe<EarnPositionBucket>;
  id: Scalars['ID']['output'];
  nft?: Maybe<Nft>;
  oasisEvents?: Maybe<Array<OasisEvent>>;
  pool: Pool;
  protocolEvents?: Maybe<Array<LenderEvent>>;
  user: User;
};


export type EarnPositionBucketPositionsArgs = {
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<EarnPositionBucket_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  where?: InputMaybe<EarnPositionBucket_Filter>;
};


export type EarnPositionOasisEventsArgs = {
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<OasisEvent_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  where?: InputMaybe<OasisEvent_Filter>;
};


export type EarnPositionProtocolEventsArgs = {
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<LenderEvent_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  where?: InputMaybe<LenderEvent_Filter>;
};

export type EarnPositionBucket = {
  __typename?: 'EarnPositionBucket';
  account?: Maybe<Account>;
  depositTime: Scalars['BigInt']['output'];
  id: Scalars['ID']['output'];
  index: Scalars['BigInt']['output'];
  lps: Scalars['BigInt']['output'];
  nft?: Maybe<Nft>;
  pool: Pool;
  position: EarnPosition;
  protocolEvents?: Maybe<Array<LenderEvent>>;
  user: User;
};


export type EarnPositionBucketProtocolEventsArgs = {
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<LenderEvent_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  where?: InputMaybe<LenderEvent_Filter>;
};

export type EarnPositionBucket_Filter = {
  /** Filter for the block changed event. */
  _change_block?: InputMaybe<BlockChangedFilter>;
  account?: InputMaybe<Scalars['String']['input']>;
  account_?: InputMaybe<Account_Filter>;
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
  and?: InputMaybe<Array<InputMaybe<EarnPositionBucket_Filter>>>;
  depositTime?: InputMaybe<Scalars['BigInt']['input']>;
  depositTime_gt?: InputMaybe<Scalars['BigInt']['input']>;
  depositTime_gte?: InputMaybe<Scalars['BigInt']['input']>;
  depositTime_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  depositTime_lt?: InputMaybe<Scalars['BigInt']['input']>;
  depositTime_lte?: InputMaybe<Scalars['BigInt']['input']>;
  depositTime_not?: InputMaybe<Scalars['BigInt']['input']>;
  depositTime_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  id?: InputMaybe<Scalars['ID']['input']>;
  id_gt?: InputMaybe<Scalars['ID']['input']>;
  id_gte?: InputMaybe<Scalars['ID']['input']>;
  id_in?: InputMaybe<Array<Scalars['ID']['input']>>;
  id_lt?: InputMaybe<Scalars['ID']['input']>;
  id_lte?: InputMaybe<Scalars['ID']['input']>;
  id_not?: InputMaybe<Scalars['ID']['input']>;
  id_not_in?: InputMaybe<Array<Scalars['ID']['input']>>;
  index?: InputMaybe<Scalars['BigInt']['input']>;
  index_gt?: InputMaybe<Scalars['BigInt']['input']>;
  index_gte?: InputMaybe<Scalars['BigInt']['input']>;
  index_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  index_lt?: InputMaybe<Scalars['BigInt']['input']>;
  index_lte?: InputMaybe<Scalars['BigInt']['input']>;
  index_not?: InputMaybe<Scalars['BigInt']['input']>;
  index_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  lps?: InputMaybe<Scalars['BigInt']['input']>;
  lps_gt?: InputMaybe<Scalars['BigInt']['input']>;
  lps_gte?: InputMaybe<Scalars['BigInt']['input']>;
  lps_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  lps_lt?: InputMaybe<Scalars['BigInt']['input']>;
  lps_lte?: InputMaybe<Scalars['BigInt']['input']>;
  lps_not?: InputMaybe<Scalars['BigInt']['input']>;
  lps_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  nft?: InputMaybe<Scalars['String']['input']>;
  nft_?: InputMaybe<Nft_Filter>;
  nft_contains?: InputMaybe<Scalars['String']['input']>;
  nft_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  nft_ends_with?: InputMaybe<Scalars['String']['input']>;
  nft_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  nft_gt?: InputMaybe<Scalars['String']['input']>;
  nft_gte?: InputMaybe<Scalars['String']['input']>;
  nft_in?: InputMaybe<Array<Scalars['String']['input']>>;
  nft_lt?: InputMaybe<Scalars['String']['input']>;
  nft_lte?: InputMaybe<Scalars['String']['input']>;
  nft_not?: InputMaybe<Scalars['String']['input']>;
  nft_not_contains?: InputMaybe<Scalars['String']['input']>;
  nft_not_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  nft_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  nft_not_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  nft_not_in?: InputMaybe<Array<Scalars['String']['input']>>;
  nft_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  nft_not_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  nft_starts_with?: InputMaybe<Scalars['String']['input']>;
  nft_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  or?: InputMaybe<Array<InputMaybe<EarnPositionBucket_Filter>>>;
  pool?: InputMaybe<Scalars['String']['input']>;
  pool_?: InputMaybe<Pool_Filter>;
  pool_contains?: InputMaybe<Scalars['String']['input']>;
  pool_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  pool_ends_with?: InputMaybe<Scalars['String']['input']>;
  pool_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  pool_gt?: InputMaybe<Scalars['String']['input']>;
  pool_gte?: InputMaybe<Scalars['String']['input']>;
  pool_in?: InputMaybe<Array<Scalars['String']['input']>>;
  pool_lt?: InputMaybe<Scalars['String']['input']>;
  pool_lte?: InputMaybe<Scalars['String']['input']>;
  pool_not?: InputMaybe<Scalars['String']['input']>;
  pool_not_contains?: InputMaybe<Scalars['String']['input']>;
  pool_not_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  pool_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  pool_not_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  pool_not_in?: InputMaybe<Array<Scalars['String']['input']>>;
  pool_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  pool_not_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  pool_starts_with?: InputMaybe<Scalars['String']['input']>;
  pool_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  position?: InputMaybe<Scalars['String']['input']>;
  position_?: InputMaybe<EarnPosition_Filter>;
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
  protocolEvents_?: InputMaybe<LenderEvent_Filter>;
  user?: InputMaybe<Scalars['String']['input']>;
  user_?: InputMaybe<User_Filter>;
  user_contains?: InputMaybe<Scalars['String']['input']>;
  user_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  user_ends_with?: InputMaybe<Scalars['String']['input']>;
  user_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  user_gt?: InputMaybe<Scalars['String']['input']>;
  user_gte?: InputMaybe<Scalars['String']['input']>;
  user_in?: InputMaybe<Array<Scalars['String']['input']>>;
  user_lt?: InputMaybe<Scalars['String']['input']>;
  user_lte?: InputMaybe<Scalars['String']['input']>;
  user_not?: InputMaybe<Scalars['String']['input']>;
  user_not_contains?: InputMaybe<Scalars['String']['input']>;
  user_not_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  user_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  user_not_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  user_not_in?: InputMaybe<Array<Scalars['String']['input']>>;
  user_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  user_not_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  user_starts_with?: InputMaybe<Scalars['String']['input']>;
  user_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
};

export enum EarnPositionBucket_OrderBy {
  Account = 'account',
  AccountAddress = 'account__address',
  AccountCollateralToken = 'account__collateralToken',
  AccountDebtToken = 'account__debtToken',
  AccountId = 'account__id',
  AccountIsDpm = 'account__isDPM',
  AccountPositionType = 'account__positionType',
  AccountProtocol = 'account__protocol',
  AccountVaultId = 'account__vaultId',
  DepositTime = 'depositTime',
  Id = 'id',
  Index = 'index',
  Lps = 'lps',
  Nft = 'nft',
  NftCurrentReward = 'nft__currentReward',
  NftId = 'nft__id',
  NftStaked = 'nft__staked',
  NftTokenId = 'nft__tokenId',
  Pool = 'pool',
  PoolAccuredDebt = 'pool__accuredDebt',
  PoolAddress = 'pool__address',
  PoolApr7dAverage = 'pool__apr7dAverage',
  PoolApr30dAverage = 'pool__apr30dAverage',
  PoolAuctionPrice = 'pool__auctionPrice',
  PoolBorrowApr = 'pool__borrowApr',
  PoolBorrowDailyTokenBlocks = 'pool__borrowDailyTokenBlocks',
  PoolClaimableReserves = 'pool__claimableReserves',
  PoolClaimableReservesRemaining = 'pool__claimableReservesRemaining',
  PoolCollateralAddress = 'pool__collateralAddress',
  PoolCollateralScale = 'pool__collateralScale',
  PoolCurrentBurnEpoch = 'pool__currentBurnEpoch',
  PoolDailyPercentageRate30dAverage = 'pool__dailyPercentageRate30dAverage',
  PoolDebt = 'pool__debt',
  PoolDebtInAuctions = 'pool__debtInAuctions',
  PoolDepositSize = 'pool__depositSize',
  PoolEarnDailyTokenBlocks = 'pool__earnDailyTokenBlocks',
  PoolHpb = 'pool__hpb',
  PoolHpbIndex = 'pool__hpbIndex',
  PoolHtp = 'pool__htp',
  PoolHtpIndex = 'pool__htpIndex',
  PoolId = 'pool__id',
  PoolInterestRate = 'pool__interestRate',
  PoolLastInterestRateUpdate = 'pool__lastInterestRateUpdate',
  PoolLendApr = 'pool__lendApr',
  PoolLendApr7dAverage = 'pool__lendApr7dAverage',
  PoolLendApr30dAverage = 'pool__lendApr30dAverage',
  PoolLendDailyPercentageRate30dAverage = 'pool__lendDailyPercentageRate30dAverage',
  PoolLendMonthlyPercentageRate30dAverage = 'pool__lendMonthlyPercentageRate30dAverage',
  PoolLoansCount = 'pool__loansCount',
  PoolLup = 'pool__lup',
  PoolLupIndex = 'pool__lupIndex',
  PoolMonthlyPercentageRate30dAverage = 'pool__monthlyPercentageRate30dAverage',
  PoolName = 'pool__name',
  PoolPoolActualUtilization = 'pool__poolActualUtilization',
  PoolPoolCollateralization = 'pool__poolCollateralization',
  PoolPoolMinDebtAmount = 'pool__poolMinDebtAmount',
  PoolPoolTargetUtilization = 'pool__poolTargetUtilization',
  PoolQuoteTokenAddress = 'pool__quoteTokenAddress',
  PoolQuoteTokenScale = 'pool__quoteTokenScale',
  PoolReserves = 'pool__reserves',
  PoolSummerDepositAmountEarningInterest = 'pool__summerDepositAmountEarningInterest',
  PoolT0debt = 'pool__t0debt',
  PoolTimeRemaining = 'pool__timeRemaining',
  PoolTotalAuctionsInPool = 'pool__totalAuctionsInPool',
  Position = 'position',
  PositionEarnCumulativeDepositInCollateralToken = 'position__earnCumulativeDepositInCollateralToken',
  PositionEarnCumulativeDepositInQuoteToken = 'position__earnCumulativeDepositInQuoteToken',
  PositionEarnCumulativeDepositUsd = 'position__earnCumulativeDepositUSD',
  PositionEarnCumulativeFeesInCollateralToken = 'position__earnCumulativeFeesInCollateralToken',
  PositionEarnCumulativeFeesInQuoteToken = 'position__earnCumulativeFeesInQuoteToken',
  PositionEarnCumulativeFeesUsd = 'position__earnCumulativeFeesUSD',
  PositionEarnCumulativeQuoteTokenDeposit = 'position__earnCumulativeQuoteTokenDeposit',
  PositionEarnCumulativeQuoteTokenWithdraw = 'position__earnCumulativeQuoteTokenWithdraw',
  PositionEarnCumulativeWithdrawInCollateralToken = 'position__earnCumulativeWithdrawInCollateralToken',
  PositionEarnCumulativeWithdrawInQuoteToken = 'position__earnCumulativeWithdrawInQuoteToken',
  PositionEarnCumulativeWithdrawUsd = 'position__earnCumulativeWithdrawUSD',
  PositionEarnDailyTokenBlocks = 'position__earnDailyTokenBlocks',
  PositionEarnIsEarning = 'position__earnIsEarning',
  PositionEarnLastUpdateBlock = 'position__earnLastUpdateBlock',
  PositionId = 'position__id',
  ProtocolEvents = 'protocolEvents',
  User = 'user',
  UserAddress = 'user__address',
  UserId = 'user__id',
  UserVaultCount = 'user__vaultCount'
}

export type EarnPosition_Filter = {
  /** Filter for the block changed event. */
  _change_block?: InputMaybe<BlockChangedFilter>;
  account?: InputMaybe<Scalars['String']['input']>;
  account_?: InputMaybe<Account_Filter>;
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
  and?: InputMaybe<Array<InputMaybe<EarnPosition_Filter>>>;
  bucketPositions_?: InputMaybe<EarnPositionBucket_Filter>;
  earnCumulativeDepositInCollateralToken?: InputMaybe<Scalars['BigDecimal']['input']>;
  earnCumulativeDepositInCollateralToken_gt?: InputMaybe<Scalars['BigDecimal']['input']>;
  earnCumulativeDepositInCollateralToken_gte?: InputMaybe<Scalars['BigDecimal']['input']>;
  earnCumulativeDepositInCollateralToken_in?: InputMaybe<Array<Scalars['BigDecimal']['input']>>;
  earnCumulativeDepositInCollateralToken_lt?: InputMaybe<Scalars['BigDecimal']['input']>;
  earnCumulativeDepositInCollateralToken_lte?: InputMaybe<Scalars['BigDecimal']['input']>;
  earnCumulativeDepositInCollateralToken_not?: InputMaybe<Scalars['BigDecimal']['input']>;
  earnCumulativeDepositInCollateralToken_not_in?: InputMaybe<Array<Scalars['BigDecimal']['input']>>;
  earnCumulativeDepositInQuoteToken?: InputMaybe<Scalars['BigDecimal']['input']>;
  earnCumulativeDepositInQuoteToken_gt?: InputMaybe<Scalars['BigDecimal']['input']>;
  earnCumulativeDepositInQuoteToken_gte?: InputMaybe<Scalars['BigDecimal']['input']>;
  earnCumulativeDepositInQuoteToken_in?: InputMaybe<Array<Scalars['BigDecimal']['input']>>;
  earnCumulativeDepositInQuoteToken_lt?: InputMaybe<Scalars['BigDecimal']['input']>;
  earnCumulativeDepositInQuoteToken_lte?: InputMaybe<Scalars['BigDecimal']['input']>;
  earnCumulativeDepositInQuoteToken_not?: InputMaybe<Scalars['BigDecimal']['input']>;
  earnCumulativeDepositInQuoteToken_not_in?: InputMaybe<Array<Scalars['BigDecimal']['input']>>;
  earnCumulativeDepositUSD?: InputMaybe<Scalars['BigDecimal']['input']>;
  earnCumulativeDepositUSD_gt?: InputMaybe<Scalars['BigDecimal']['input']>;
  earnCumulativeDepositUSD_gte?: InputMaybe<Scalars['BigDecimal']['input']>;
  earnCumulativeDepositUSD_in?: InputMaybe<Array<Scalars['BigDecimal']['input']>>;
  earnCumulativeDepositUSD_lt?: InputMaybe<Scalars['BigDecimal']['input']>;
  earnCumulativeDepositUSD_lte?: InputMaybe<Scalars['BigDecimal']['input']>;
  earnCumulativeDepositUSD_not?: InputMaybe<Scalars['BigDecimal']['input']>;
  earnCumulativeDepositUSD_not_in?: InputMaybe<Array<Scalars['BigDecimal']['input']>>;
  earnCumulativeFeesInCollateralToken?: InputMaybe<Scalars['BigDecimal']['input']>;
  earnCumulativeFeesInCollateralToken_gt?: InputMaybe<Scalars['BigDecimal']['input']>;
  earnCumulativeFeesInCollateralToken_gte?: InputMaybe<Scalars['BigDecimal']['input']>;
  earnCumulativeFeesInCollateralToken_in?: InputMaybe<Array<Scalars['BigDecimal']['input']>>;
  earnCumulativeFeesInCollateralToken_lt?: InputMaybe<Scalars['BigDecimal']['input']>;
  earnCumulativeFeesInCollateralToken_lte?: InputMaybe<Scalars['BigDecimal']['input']>;
  earnCumulativeFeesInCollateralToken_not?: InputMaybe<Scalars['BigDecimal']['input']>;
  earnCumulativeFeesInCollateralToken_not_in?: InputMaybe<Array<Scalars['BigDecimal']['input']>>;
  earnCumulativeFeesInQuoteToken?: InputMaybe<Scalars['BigDecimal']['input']>;
  earnCumulativeFeesInQuoteToken_gt?: InputMaybe<Scalars['BigDecimal']['input']>;
  earnCumulativeFeesInQuoteToken_gte?: InputMaybe<Scalars['BigDecimal']['input']>;
  earnCumulativeFeesInQuoteToken_in?: InputMaybe<Array<Scalars['BigDecimal']['input']>>;
  earnCumulativeFeesInQuoteToken_lt?: InputMaybe<Scalars['BigDecimal']['input']>;
  earnCumulativeFeesInQuoteToken_lte?: InputMaybe<Scalars['BigDecimal']['input']>;
  earnCumulativeFeesInQuoteToken_not?: InputMaybe<Scalars['BigDecimal']['input']>;
  earnCumulativeFeesInQuoteToken_not_in?: InputMaybe<Array<Scalars['BigDecimal']['input']>>;
  earnCumulativeFeesUSD?: InputMaybe<Scalars['BigDecimal']['input']>;
  earnCumulativeFeesUSD_gt?: InputMaybe<Scalars['BigDecimal']['input']>;
  earnCumulativeFeesUSD_gte?: InputMaybe<Scalars['BigDecimal']['input']>;
  earnCumulativeFeesUSD_in?: InputMaybe<Array<Scalars['BigDecimal']['input']>>;
  earnCumulativeFeesUSD_lt?: InputMaybe<Scalars['BigDecimal']['input']>;
  earnCumulativeFeesUSD_lte?: InputMaybe<Scalars['BigDecimal']['input']>;
  earnCumulativeFeesUSD_not?: InputMaybe<Scalars['BigDecimal']['input']>;
  earnCumulativeFeesUSD_not_in?: InputMaybe<Array<Scalars['BigDecimal']['input']>>;
  earnCumulativeQuoteTokenDeposit?: InputMaybe<Scalars['BigDecimal']['input']>;
  earnCumulativeQuoteTokenDeposit_gt?: InputMaybe<Scalars['BigDecimal']['input']>;
  earnCumulativeQuoteTokenDeposit_gte?: InputMaybe<Scalars['BigDecimal']['input']>;
  earnCumulativeQuoteTokenDeposit_in?: InputMaybe<Array<Scalars['BigDecimal']['input']>>;
  earnCumulativeQuoteTokenDeposit_lt?: InputMaybe<Scalars['BigDecimal']['input']>;
  earnCumulativeQuoteTokenDeposit_lte?: InputMaybe<Scalars['BigDecimal']['input']>;
  earnCumulativeQuoteTokenDeposit_not?: InputMaybe<Scalars['BigDecimal']['input']>;
  earnCumulativeQuoteTokenDeposit_not_in?: InputMaybe<Array<Scalars['BigDecimal']['input']>>;
  earnCumulativeQuoteTokenWithdraw?: InputMaybe<Scalars['BigDecimal']['input']>;
  earnCumulativeQuoteTokenWithdraw_gt?: InputMaybe<Scalars['BigDecimal']['input']>;
  earnCumulativeQuoteTokenWithdraw_gte?: InputMaybe<Scalars['BigDecimal']['input']>;
  earnCumulativeQuoteTokenWithdraw_in?: InputMaybe<Array<Scalars['BigDecimal']['input']>>;
  earnCumulativeQuoteTokenWithdraw_lt?: InputMaybe<Scalars['BigDecimal']['input']>;
  earnCumulativeQuoteTokenWithdraw_lte?: InputMaybe<Scalars['BigDecimal']['input']>;
  earnCumulativeQuoteTokenWithdraw_not?: InputMaybe<Scalars['BigDecimal']['input']>;
  earnCumulativeQuoteTokenWithdraw_not_in?: InputMaybe<Array<Scalars['BigDecimal']['input']>>;
  earnCumulativeWithdrawInCollateralToken?: InputMaybe<Scalars['BigDecimal']['input']>;
  earnCumulativeWithdrawInCollateralToken_gt?: InputMaybe<Scalars['BigDecimal']['input']>;
  earnCumulativeWithdrawInCollateralToken_gte?: InputMaybe<Scalars['BigDecimal']['input']>;
  earnCumulativeWithdrawInCollateralToken_in?: InputMaybe<Array<Scalars['BigDecimal']['input']>>;
  earnCumulativeWithdrawInCollateralToken_lt?: InputMaybe<Scalars['BigDecimal']['input']>;
  earnCumulativeWithdrawInCollateralToken_lte?: InputMaybe<Scalars['BigDecimal']['input']>;
  earnCumulativeWithdrawInCollateralToken_not?: InputMaybe<Scalars['BigDecimal']['input']>;
  earnCumulativeWithdrawInCollateralToken_not_in?: InputMaybe<Array<Scalars['BigDecimal']['input']>>;
  earnCumulativeWithdrawInQuoteToken?: InputMaybe<Scalars['BigDecimal']['input']>;
  earnCumulativeWithdrawInQuoteToken_gt?: InputMaybe<Scalars['BigDecimal']['input']>;
  earnCumulativeWithdrawInQuoteToken_gte?: InputMaybe<Scalars['BigDecimal']['input']>;
  earnCumulativeWithdrawInQuoteToken_in?: InputMaybe<Array<Scalars['BigDecimal']['input']>>;
  earnCumulativeWithdrawInQuoteToken_lt?: InputMaybe<Scalars['BigDecimal']['input']>;
  earnCumulativeWithdrawInQuoteToken_lte?: InputMaybe<Scalars['BigDecimal']['input']>;
  earnCumulativeWithdrawInQuoteToken_not?: InputMaybe<Scalars['BigDecimal']['input']>;
  earnCumulativeWithdrawInQuoteToken_not_in?: InputMaybe<Array<Scalars['BigDecimal']['input']>>;
  earnCumulativeWithdrawUSD?: InputMaybe<Scalars['BigDecimal']['input']>;
  earnCumulativeWithdrawUSD_gt?: InputMaybe<Scalars['BigDecimal']['input']>;
  earnCumulativeWithdrawUSD_gte?: InputMaybe<Scalars['BigDecimal']['input']>;
  earnCumulativeWithdrawUSD_in?: InputMaybe<Array<Scalars['BigDecimal']['input']>>;
  earnCumulativeWithdrawUSD_lt?: InputMaybe<Scalars['BigDecimal']['input']>;
  earnCumulativeWithdrawUSD_lte?: InputMaybe<Scalars['BigDecimal']['input']>;
  earnCumulativeWithdrawUSD_not?: InputMaybe<Scalars['BigDecimal']['input']>;
  earnCumulativeWithdrawUSD_not_in?: InputMaybe<Array<Scalars['BigDecimal']['input']>>;
  earnDailyTokenBlocks?: InputMaybe<Scalars['BigInt']['input']>;
  earnDailyTokenBlocks_gt?: InputMaybe<Scalars['BigInt']['input']>;
  earnDailyTokenBlocks_gte?: InputMaybe<Scalars['BigInt']['input']>;
  earnDailyTokenBlocks_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  earnDailyTokenBlocks_lt?: InputMaybe<Scalars['BigInt']['input']>;
  earnDailyTokenBlocks_lte?: InputMaybe<Scalars['BigInt']['input']>;
  earnDailyTokenBlocks_not?: InputMaybe<Scalars['BigInt']['input']>;
  earnDailyTokenBlocks_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  earnIsEarning?: InputMaybe<Scalars['Boolean']['input']>;
  earnIsEarning_in?: InputMaybe<Array<Scalars['Boolean']['input']>>;
  earnIsEarning_not?: InputMaybe<Scalars['Boolean']['input']>;
  earnIsEarning_not_in?: InputMaybe<Array<Scalars['Boolean']['input']>>;
  earnLastUpdateBlock?: InputMaybe<Scalars['BigInt']['input']>;
  earnLastUpdateBlock_gt?: InputMaybe<Scalars['BigInt']['input']>;
  earnLastUpdateBlock_gte?: InputMaybe<Scalars['BigInt']['input']>;
  earnLastUpdateBlock_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  earnLastUpdateBlock_lt?: InputMaybe<Scalars['BigInt']['input']>;
  earnLastUpdateBlock_lte?: InputMaybe<Scalars['BigInt']['input']>;
  earnLastUpdateBlock_not?: InputMaybe<Scalars['BigInt']['input']>;
  earnLastUpdateBlock_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  earnPosition?: InputMaybe<Scalars['String']['input']>;
  earnPosition_?: InputMaybe<EarnPositionBucket_Filter>;
  earnPosition_contains?: InputMaybe<Scalars['String']['input']>;
  earnPosition_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  earnPosition_ends_with?: InputMaybe<Scalars['String']['input']>;
  earnPosition_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  earnPosition_gt?: InputMaybe<Scalars['String']['input']>;
  earnPosition_gte?: InputMaybe<Scalars['String']['input']>;
  earnPosition_in?: InputMaybe<Array<Scalars['String']['input']>>;
  earnPosition_lt?: InputMaybe<Scalars['String']['input']>;
  earnPosition_lte?: InputMaybe<Scalars['String']['input']>;
  earnPosition_not?: InputMaybe<Scalars['String']['input']>;
  earnPosition_not_contains?: InputMaybe<Scalars['String']['input']>;
  earnPosition_not_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  earnPosition_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  earnPosition_not_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  earnPosition_not_in?: InputMaybe<Array<Scalars['String']['input']>>;
  earnPosition_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  earnPosition_not_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  earnPosition_starts_with?: InputMaybe<Scalars['String']['input']>;
  earnPosition_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  id?: InputMaybe<Scalars['ID']['input']>;
  id_gt?: InputMaybe<Scalars['ID']['input']>;
  id_gte?: InputMaybe<Scalars['ID']['input']>;
  id_in?: InputMaybe<Array<Scalars['ID']['input']>>;
  id_lt?: InputMaybe<Scalars['ID']['input']>;
  id_lte?: InputMaybe<Scalars['ID']['input']>;
  id_not?: InputMaybe<Scalars['ID']['input']>;
  id_not_in?: InputMaybe<Array<Scalars['ID']['input']>>;
  nft?: InputMaybe<Scalars['String']['input']>;
  nft_?: InputMaybe<Nft_Filter>;
  nft_contains?: InputMaybe<Scalars['String']['input']>;
  nft_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  nft_ends_with?: InputMaybe<Scalars['String']['input']>;
  nft_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  nft_gt?: InputMaybe<Scalars['String']['input']>;
  nft_gte?: InputMaybe<Scalars['String']['input']>;
  nft_in?: InputMaybe<Array<Scalars['String']['input']>>;
  nft_lt?: InputMaybe<Scalars['String']['input']>;
  nft_lte?: InputMaybe<Scalars['String']['input']>;
  nft_not?: InputMaybe<Scalars['String']['input']>;
  nft_not_contains?: InputMaybe<Scalars['String']['input']>;
  nft_not_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  nft_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  nft_not_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  nft_not_in?: InputMaybe<Array<Scalars['String']['input']>>;
  nft_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  nft_not_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  nft_starts_with?: InputMaybe<Scalars['String']['input']>;
  nft_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  oasisEvents_?: InputMaybe<OasisEvent_Filter>;
  or?: InputMaybe<Array<InputMaybe<EarnPosition_Filter>>>;
  pool?: InputMaybe<Scalars['String']['input']>;
  pool_?: InputMaybe<Pool_Filter>;
  pool_contains?: InputMaybe<Scalars['String']['input']>;
  pool_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  pool_ends_with?: InputMaybe<Scalars['String']['input']>;
  pool_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  pool_gt?: InputMaybe<Scalars['String']['input']>;
  pool_gte?: InputMaybe<Scalars['String']['input']>;
  pool_in?: InputMaybe<Array<Scalars['String']['input']>>;
  pool_lt?: InputMaybe<Scalars['String']['input']>;
  pool_lte?: InputMaybe<Scalars['String']['input']>;
  pool_not?: InputMaybe<Scalars['String']['input']>;
  pool_not_contains?: InputMaybe<Scalars['String']['input']>;
  pool_not_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  pool_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  pool_not_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  pool_not_in?: InputMaybe<Array<Scalars['String']['input']>>;
  pool_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  pool_not_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  pool_starts_with?: InputMaybe<Scalars['String']['input']>;
  pool_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  protocolEvents_?: InputMaybe<LenderEvent_Filter>;
  user?: InputMaybe<Scalars['String']['input']>;
  user_?: InputMaybe<User_Filter>;
  user_contains?: InputMaybe<Scalars['String']['input']>;
  user_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  user_ends_with?: InputMaybe<Scalars['String']['input']>;
  user_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  user_gt?: InputMaybe<Scalars['String']['input']>;
  user_gte?: InputMaybe<Scalars['String']['input']>;
  user_in?: InputMaybe<Array<Scalars['String']['input']>>;
  user_lt?: InputMaybe<Scalars['String']['input']>;
  user_lte?: InputMaybe<Scalars['String']['input']>;
  user_not?: InputMaybe<Scalars['String']['input']>;
  user_not_contains?: InputMaybe<Scalars['String']['input']>;
  user_not_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  user_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  user_not_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  user_not_in?: InputMaybe<Array<Scalars['String']['input']>>;
  user_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  user_not_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  user_starts_with?: InputMaybe<Scalars['String']['input']>;
  user_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
};

export enum EarnPosition_OrderBy {
  Account = 'account',
  AccountAddress = 'account__address',
  AccountCollateralToken = 'account__collateralToken',
  AccountDebtToken = 'account__debtToken',
  AccountId = 'account__id',
  AccountIsDpm = 'account__isDPM',
  AccountPositionType = 'account__positionType',
  AccountProtocol = 'account__protocol',
  AccountVaultId = 'account__vaultId',
  BucketPositions = 'bucketPositions',
  EarnCumulativeDepositInCollateralToken = 'earnCumulativeDepositInCollateralToken',
  EarnCumulativeDepositInQuoteToken = 'earnCumulativeDepositInQuoteToken',
  EarnCumulativeDepositUsd = 'earnCumulativeDepositUSD',
  EarnCumulativeFeesInCollateralToken = 'earnCumulativeFeesInCollateralToken',
  EarnCumulativeFeesInQuoteToken = 'earnCumulativeFeesInQuoteToken',
  EarnCumulativeFeesUsd = 'earnCumulativeFeesUSD',
  EarnCumulativeQuoteTokenDeposit = 'earnCumulativeQuoteTokenDeposit',
  EarnCumulativeQuoteTokenWithdraw = 'earnCumulativeQuoteTokenWithdraw',
  EarnCumulativeWithdrawInCollateralToken = 'earnCumulativeWithdrawInCollateralToken',
  EarnCumulativeWithdrawInQuoteToken = 'earnCumulativeWithdrawInQuoteToken',
  EarnCumulativeWithdrawUsd = 'earnCumulativeWithdrawUSD',
  EarnDailyTokenBlocks = 'earnDailyTokenBlocks',
  EarnIsEarning = 'earnIsEarning',
  EarnLastUpdateBlock = 'earnLastUpdateBlock',
  EarnPosition = 'earnPosition',
  EarnPositionDepositTime = 'earnPosition__depositTime',
  EarnPositionId = 'earnPosition__id',
  EarnPositionIndex = 'earnPosition__index',
  EarnPositionLps = 'earnPosition__lps',
  Id = 'id',
  Nft = 'nft',
  NftCurrentReward = 'nft__currentReward',
  NftId = 'nft__id',
  NftStaked = 'nft__staked',
  NftTokenId = 'nft__tokenId',
  OasisEvents = 'oasisEvents',
  Pool = 'pool',
  PoolAccuredDebt = 'pool__accuredDebt',
  PoolAddress = 'pool__address',
  PoolApr7dAverage = 'pool__apr7dAverage',
  PoolApr30dAverage = 'pool__apr30dAverage',
  PoolAuctionPrice = 'pool__auctionPrice',
  PoolBorrowApr = 'pool__borrowApr',
  PoolBorrowDailyTokenBlocks = 'pool__borrowDailyTokenBlocks',
  PoolClaimableReserves = 'pool__claimableReserves',
  PoolClaimableReservesRemaining = 'pool__claimableReservesRemaining',
  PoolCollateralAddress = 'pool__collateralAddress',
  PoolCollateralScale = 'pool__collateralScale',
  PoolCurrentBurnEpoch = 'pool__currentBurnEpoch',
  PoolDailyPercentageRate30dAverage = 'pool__dailyPercentageRate30dAverage',
  PoolDebt = 'pool__debt',
  PoolDebtInAuctions = 'pool__debtInAuctions',
  PoolDepositSize = 'pool__depositSize',
  PoolEarnDailyTokenBlocks = 'pool__earnDailyTokenBlocks',
  PoolHpb = 'pool__hpb',
  PoolHpbIndex = 'pool__hpbIndex',
  PoolHtp = 'pool__htp',
  PoolHtpIndex = 'pool__htpIndex',
  PoolId = 'pool__id',
  PoolInterestRate = 'pool__interestRate',
  PoolLastInterestRateUpdate = 'pool__lastInterestRateUpdate',
  PoolLendApr = 'pool__lendApr',
  PoolLendApr7dAverage = 'pool__lendApr7dAverage',
  PoolLendApr30dAverage = 'pool__lendApr30dAverage',
  PoolLendDailyPercentageRate30dAverage = 'pool__lendDailyPercentageRate30dAverage',
  PoolLendMonthlyPercentageRate30dAverage = 'pool__lendMonthlyPercentageRate30dAverage',
  PoolLoansCount = 'pool__loansCount',
  PoolLup = 'pool__lup',
  PoolLupIndex = 'pool__lupIndex',
  PoolMonthlyPercentageRate30dAverage = 'pool__monthlyPercentageRate30dAverage',
  PoolName = 'pool__name',
  PoolPoolActualUtilization = 'pool__poolActualUtilization',
  PoolPoolCollateralization = 'pool__poolCollateralization',
  PoolPoolMinDebtAmount = 'pool__poolMinDebtAmount',
  PoolPoolTargetUtilization = 'pool__poolTargetUtilization',
  PoolQuoteTokenAddress = 'pool__quoteTokenAddress',
  PoolQuoteTokenScale = 'pool__quoteTokenScale',
  PoolReserves = 'pool__reserves',
  PoolSummerDepositAmountEarningInterest = 'pool__summerDepositAmountEarningInterest',
  PoolT0debt = 'pool__t0debt',
  PoolTimeRemaining = 'pool__timeRemaining',
  PoolTotalAuctionsInPool = 'pool__totalAuctionsInPool',
  ProtocolEvents = 'protocolEvents',
  User = 'user',
  UserAddress = 'user__address',
  UserId = 'user__id',
  UserVaultCount = 'user__vaultCount'
}

export type FeePaid = {
  __typename?: 'FeePaid';
  amount: Scalars['BigInt']['output'];
  beneficiary: Scalars['Bytes']['output'];
  /**
   * id is a tx_hash-actionLogIndex
   * it uses action log index to easily combine all swap events into one
   *
   */
  id: Scalars['Bytes']['output'];
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
  pool: Pool;
  rate: Scalars['BigDecimal']['output'];
  timestamp: Scalars['BigInt']['output'];
  type: Scalars['String']['output'];
};

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
  pool?: InputMaybe<Scalars['String']['input']>;
  pool_?: InputMaybe<Pool_Filter>;
  pool_contains?: InputMaybe<Scalars['String']['input']>;
  pool_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  pool_ends_with?: InputMaybe<Scalars['String']['input']>;
  pool_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  pool_gt?: InputMaybe<Scalars['String']['input']>;
  pool_gte?: InputMaybe<Scalars['String']['input']>;
  pool_in?: InputMaybe<Array<Scalars['String']['input']>>;
  pool_lt?: InputMaybe<Scalars['String']['input']>;
  pool_lte?: InputMaybe<Scalars['String']['input']>;
  pool_not?: InputMaybe<Scalars['String']['input']>;
  pool_not_contains?: InputMaybe<Scalars['String']['input']>;
  pool_not_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  pool_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  pool_not_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  pool_not_in?: InputMaybe<Array<Scalars['String']['input']>>;
  pool_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  pool_not_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  pool_starts_with?: InputMaybe<Scalars['String']['input']>;
  pool_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
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
  Pool = 'pool',
  PoolAccuredDebt = 'pool__accuredDebt',
  PoolAddress = 'pool__address',
  PoolApr7dAverage = 'pool__apr7dAverage',
  PoolApr30dAverage = 'pool__apr30dAverage',
  PoolAuctionPrice = 'pool__auctionPrice',
  PoolBorrowApr = 'pool__borrowApr',
  PoolBorrowDailyTokenBlocks = 'pool__borrowDailyTokenBlocks',
  PoolClaimableReserves = 'pool__claimableReserves',
  PoolClaimableReservesRemaining = 'pool__claimableReservesRemaining',
  PoolCollateralAddress = 'pool__collateralAddress',
  PoolCollateralScale = 'pool__collateralScale',
  PoolCurrentBurnEpoch = 'pool__currentBurnEpoch',
  PoolDailyPercentageRate30dAverage = 'pool__dailyPercentageRate30dAverage',
  PoolDebt = 'pool__debt',
  PoolDebtInAuctions = 'pool__debtInAuctions',
  PoolDepositSize = 'pool__depositSize',
  PoolEarnDailyTokenBlocks = 'pool__earnDailyTokenBlocks',
  PoolHpb = 'pool__hpb',
  PoolHpbIndex = 'pool__hpbIndex',
  PoolHtp = 'pool__htp',
  PoolHtpIndex = 'pool__htpIndex',
  PoolId = 'pool__id',
  PoolInterestRate = 'pool__interestRate',
  PoolLastInterestRateUpdate = 'pool__lastInterestRateUpdate',
  PoolLendApr = 'pool__lendApr',
  PoolLendApr7dAverage = 'pool__lendApr7dAverage',
  PoolLendApr30dAverage = 'pool__lendApr30dAverage',
  PoolLendDailyPercentageRate30dAverage = 'pool__lendDailyPercentageRate30dAverage',
  PoolLendMonthlyPercentageRate30dAverage = 'pool__lendMonthlyPercentageRate30dAverage',
  PoolLoansCount = 'pool__loansCount',
  PoolLup = 'pool__lup',
  PoolLupIndex = 'pool__lupIndex',
  PoolMonthlyPercentageRate30dAverage = 'pool__monthlyPercentageRate30dAverage',
  PoolName = 'pool__name',
  PoolPoolActualUtilization = 'pool__poolActualUtilization',
  PoolPoolCollateralization = 'pool__poolCollateralization',
  PoolPoolMinDebtAmount = 'pool__poolMinDebtAmount',
  PoolPoolTargetUtilization = 'pool__poolTargetUtilization',
  PoolQuoteTokenAddress = 'pool__quoteTokenAddress',
  PoolQuoteTokenScale = 'pool__quoteTokenScale',
  PoolReserves = 'pool__reserves',
  PoolSummerDepositAmountEarningInterest = 'pool__summerDepositAmountEarningInterest',
  PoolT0debt = 'pool__t0debt',
  PoolTimeRemaining = 'pool__timeRemaining',
  PoolTotalAuctionsInPool = 'pool__totalAuctionsInPool',
  Rate = 'rate',
  Timestamp = 'timestamp',
  Type = 'type'
}

export type LenderEvent = {
  __typename?: 'LenderEvent';
  account?: Maybe<Account>;
  amount?: Maybe<Scalars['BigInt']['output']>;
  blockNumber: Scalars['BigInt']['output'];
  collateralToken: Token;
  collateralTokenPriceUSD: Scalars['BigDecimal']['output'];
  earnPosition: EarnPosition;
  from?: Maybe<Scalars['BigInt']['output']>;
  id: Scalars['ID']['output'];
  index?: Maybe<Scalars['BigInt']['output']>;
  kind: Scalars['String']['output'];
  lender?: Maybe<Scalars['String']['output']>;
  lpAwarded?: Maybe<Scalars['BigInt']['output']>;
  lpAwardedTo?: Maybe<Scalars['BigInt']['output']>;
  lpRedeemed?: Maybe<Scalars['BigInt']['output']>;
  lpRedeemedFrom?: Maybe<Scalars['BigInt']['output']>;
  lup?: Maybe<Scalars['BigInt']['output']>;
  pool: Pool;
  position: EarnPositionBucket;
  quoteAfter: Scalars['BigDecimal']['output'];
  quoteBefore: Scalars['BigDecimal']['output'];
  quoteDelta: Scalars['BigDecimal']['output'];
  quoteToken: Token;
  quoteTokenPriceUSD: Scalars['BigDecimal']['output'];
  timestamp: Scalars['BigInt']['output'];
  to?: Maybe<Scalars['BigInt']['output']>;
  txHash: Scalars['Bytes']['output'];
};

export type LenderEvent_Filter = {
  /** Filter for the block changed event. */
  _change_block?: InputMaybe<BlockChangedFilter>;
  account?: InputMaybe<Scalars['String']['input']>;
  account_?: InputMaybe<Account_Filter>;
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
  amount?: InputMaybe<Scalars['BigInt']['input']>;
  amount_gt?: InputMaybe<Scalars['BigInt']['input']>;
  amount_gte?: InputMaybe<Scalars['BigInt']['input']>;
  amount_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  amount_lt?: InputMaybe<Scalars['BigInt']['input']>;
  amount_lte?: InputMaybe<Scalars['BigInt']['input']>;
  amount_not?: InputMaybe<Scalars['BigInt']['input']>;
  amount_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  and?: InputMaybe<Array<InputMaybe<LenderEvent_Filter>>>;
  blockNumber?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_gt?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_gte?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  blockNumber_lt?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_lte?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_not?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
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
  earnPosition?: InputMaybe<Scalars['String']['input']>;
  earnPosition_?: InputMaybe<EarnPosition_Filter>;
  earnPosition_contains?: InputMaybe<Scalars['String']['input']>;
  earnPosition_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  earnPosition_ends_with?: InputMaybe<Scalars['String']['input']>;
  earnPosition_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  earnPosition_gt?: InputMaybe<Scalars['String']['input']>;
  earnPosition_gte?: InputMaybe<Scalars['String']['input']>;
  earnPosition_in?: InputMaybe<Array<Scalars['String']['input']>>;
  earnPosition_lt?: InputMaybe<Scalars['String']['input']>;
  earnPosition_lte?: InputMaybe<Scalars['String']['input']>;
  earnPosition_not?: InputMaybe<Scalars['String']['input']>;
  earnPosition_not_contains?: InputMaybe<Scalars['String']['input']>;
  earnPosition_not_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  earnPosition_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  earnPosition_not_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  earnPosition_not_in?: InputMaybe<Array<Scalars['String']['input']>>;
  earnPosition_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  earnPosition_not_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  earnPosition_starts_with?: InputMaybe<Scalars['String']['input']>;
  earnPosition_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  from?: InputMaybe<Scalars['BigInt']['input']>;
  from_gt?: InputMaybe<Scalars['BigInt']['input']>;
  from_gte?: InputMaybe<Scalars['BigInt']['input']>;
  from_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  from_lt?: InputMaybe<Scalars['BigInt']['input']>;
  from_lte?: InputMaybe<Scalars['BigInt']['input']>;
  from_not?: InputMaybe<Scalars['BigInt']['input']>;
  from_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  id?: InputMaybe<Scalars['ID']['input']>;
  id_gt?: InputMaybe<Scalars['ID']['input']>;
  id_gte?: InputMaybe<Scalars['ID']['input']>;
  id_in?: InputMaybe<Array<Scalars['ID']['input']>>;
  id_lt?: InputMaybe<Scalars['ID']['input']>;
  id_lte?: InputMaybe<Scalars['ID']['input']>;
  id_not?: InputMaybe<Scalars['ID']['input']>;
  id_not_in?: InputMaybe<Array<Scalars['ID']['input']>>;
  index?: InputMaybe<Scalars['BigInt']['input']>;
  index_gt?: InputMaybe<Scalars['BigInt']['input']>;
  index_gte?: InputMaybe<Scalars['BigInt']['input']>;
  index_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  index_lt?: InputMaybe<Scalars['BigInt']['input']>;
  index_lte?: InputMaybe<Scalars['BigInt']['input']>;
  index_not?: InputMaybe<Scalars['BigInt']['input']>;
  index_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
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
  lender?: InputMaybe<Scalars['String']['input']>;
  lender_contains?: InputMaybe<Scalars['String']['input']>;
  lender_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  lender_ends_with?: InputMaybe<Scalars['String']['input']>;
  lender_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  lender_gt?: InputMaybe<Scalars['String']['input']>;
  lender_gte?: InputMaybe<Scalars['String']['input']>;
  lender_in?: InputMaybe<Array<Scalars['String']['input']>>;
  lender_lt?: InputMaybe<Scalars['String']['input']>;
  lender_lte?: InputMaybe<Scalars['String']['input']>;
  lender_not?: InputMaybe<Scalars['String']['input']>;
  lender_not_contains?: InputMaybe<Scalars['String']['input']>;
  lender_not_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  lender_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  lender_not_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  lender_not_in?: InputMaybe<Array<Scalars['String']['input']>>;
  lender_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  lender_not_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  lender_starts_with?: InputMaybe<Scalars['String']['input']>;
  lender_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  lpAwarded?: InputMaybe<Scalars['BigInt']['input']>;
  lpAwardedTo?: InputMaybe<Scalars['BigInt']['input']>;
  lpAwardedTo_gt?: InputMaybe<Scalars['BigInt']['input']>;
  lpAwardedTo_gte?: InputMaybe<Scalars['BigInt']['input']>;
  lpAwardedTo_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  lpAwardedTo_lt?: InputMaybe<Scalars['BigInt']['input']>;
  lpAwardedTo_lte?: InputMaybe<Scalars['BigInt']['input']>;
  lpAwardedTo_not?: InputMaybe<Scalars['BigInt']['input']>;
  lpAwardedTo_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  lpAwarded_gt?: InputMaybe<Scalars['BigInt']['input']>;
  lpAwarded_gte?: InputMaybe<Scalars['BigInt']['input']>;
  lpAwarded_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  lpAwarded_lt?: InputMaybe<Scalars['BigInt']['input']>;
  lpAwarded_lte?: InputMaybe<Scalars['BigInt']['input']>;
  lpAwarded_not?: InputMaybe<Scalars['BigInt']['input']>;
  lpAwarded_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  lpRedeemed?: InputMaybe<Scalars['BigInt']['input']>;
  lpRedeemedFrom?: InputMaybe<Scalars['BigInt']['input']>;
  lpRedeemedFrom_gt?: InputMaybe<Scalars['BigInt']['input']>;
  lpRedeemedFrom_gte?: InputMaybe<Scalars['BigInt']['input']>;
  lpRedeemedFrom_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  lpRedeemedFrom_lt?: InputMaybe<Scalars['BigInt']['input']>;
  lpRedeemedFrom_lte?: InputMaybe<Scalars['BigInt']['input']>;
  lpRedeemedFrom_not?: InputMaybe<Scalars['BigInt']['input']>;
  lpRedeemedFrom_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  lpRedeemed_gt?: InputMaybe<Scalars['BigInt']['input']>;
  lpRedeemed_gte?: InputMaybe<Scalars['BigInt']['input']>;
  lpRedeemed_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  lpRedeemed_lt?: InputMaybe<Scalars['BigInt']['input']>;
  lpRedeemed_lte?: InputMaybe<Scalars['BigInt']['input']>;
  lpRedeemed_not?: InputMaybe<Scalars['BigInt']['input']>;
  lpRedeemed_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  lup?: InputMaybe<Scalars['BigInt']['input']>;
  lup_gt?: InputMaybe<Scalars['BigInt']['input']>;
  lup_gte?: InputMaybe<Scalars['BigInt']['input']>;
  lup_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  lup_lt?: InputMaybe<Scalars['BigInt']['input']>;
  lup_lte?: InputMaybe<Scalars['BigInt']['input']>;
  lup_not?: InputMaybe<Scalars['BigInt']['input']>;
  lup_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  or?: InputMaybe<Array<InputMaybe<LenderEvent_Filter>>>;
  pool?: InputMaybe<Scalars['String']['input']>;
  pool_?: InputMaybe<Pool_Filter>;
  pool_contains?: InputMaybe<Scalars['String']['input']>;
  pool_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  pool_ends_with?: InputMaybe<Scalars['String']['input']>;
  pool_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  pool_gt?: InputMaybe<Scalars['String']['input']>;
  pool_gte?: InputMaybe<Scalars['String']['input']>;
  pool_in?: InputMaybe<Array<Scalars['String']['input']>>;
  pool_lt?: InputMaybe<Scalars['String']['input']>;
  pool_lte?: InputMaybe<Scalars['String']['input']>;
  pool_not?: InputMaybe<Scalars['String']['input']>;
  pool_not_contains?: InputMaybe<Scalars['String']['input']>;
  pool_not_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  pool_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  pool_not_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  pool_not_in?: InputMaybe<Array<Scalars['String']['input']>>;
  pool_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  pool_not_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  pool_starts_with?: InputMaybe<Scalars['String']['input']>;
  pool_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  position?: InputMaybe<Scalars['String']['input']>;
  position_?: InputMaybe<EarnPositionBucket_Filter>;
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
  quoteAfter?: InputMaybe<Scalars['BigDecimal']['input']>;
  quoteAfter_gt?: InputMaybe<Scalars['BigDecimal']['input']>;
  quoteAfter_gte?: InputMaybe<Scalars['BigDecimal']['input']>;
  quoteAfter_in?: InputMaybe<Array<Scalars['BigDecimal']['input']>>;
  quoteAfter_lt?: InputMaybe<Scalars['BigDecimal']['input']>;
  quoteAfter_lte?: InputMaybe<Scalars['BigDecimal']['input']>;
  quoteAfter_not?: InputMaybe<Scalars['BigDecimal']['input']>;
  quoteAfter_not_in?: InputMaybe<Array<Scalars['BigDecimal']['input']>>;
  quoteBefore?: InputMaybe<Scalars['BigDecimal']['input']>;
  quoteBefore_gt?: InputMaybe<Scalars['BigDecimal']['input']>;
  quoteBefore_gte?: InputMaybe<Scalars['BigDecimal']['input']>;
  quoteBefore_in?: InputMaybe<Array<Scalars['BigDecimal']['input']>>;
  quoteBefore_lt?: InputMaybe<Scalars['BigDecimal']['input']>;
  quoteBefore_lte?: InputMaybe<Scalars['BigDecimal']['input']>;
  quoteBefore_not?: InputMaybe<Scalars['BigDecimal']['input']>;
  quoteBefore_not_in?: InputMaybe<Array<Scalars['BigDecimal']['input']>>;
  quoteDelta?: InputMaybe<Scalars['BigDecimal']['input']>;
  quoteDelta_gt?: InputMaybe<Scalars['BigDecimal']['input']>;
  quoteDelta_gte?: InputMaybe<Scalars['BigDecimal']['input']>;
  quoteDelta_in?: InputMaybe<Array<Scalars['BigDecimal']['input']>>;
  quoteDelta_lt?: InputMaybe<Scalars['BigDecimal']['input']>;
  quoteDelta_lte?: InputMaybe<Scalars['BigDecimal']['input']>;
  quoteDelta_not?: InputMaybe<Scalars['BigDecimal']['input']>;
  quoteDelta_not_in?: InputMaybe<Array<Scalars['BigDecimal']['input']>>;
  quoteToken?: InputMaybe<Scalars['String']['input']>;
  quoteTokenPriceUSD?: InputMaybe<Scalars['BigDecimal']['input']>;
  quoteTokenPriceUSD_gt?: InputMaybe<Scalars['BigDecimal']['input']>;
  quoteTokenPriceUSD_gte?: InputMaybe<Scalars['BigDecimal']['input']>;
  quoteTokenPriceUSD_in?: InputMaybe<Array<Scalars['BigDecimal']['input']>>;
  quoteTokenPriceUSD_lt?: InputMaybe<Scalars['BigDecimal']['input']>;
  quoteTokenPriceUSD_lte?: InputMaybe<Scalars['BigDecimal']['input']>;
  quoteTokenPriceUSD_not?: InputMaybe<Scalars['BigDecimal']['input']>;
  quoteTokenPriceUSD_not_in?: InputMaybe<Array<Scalars['BigDecimal']['input']>>;
  quoteToken_?: InputMaybe<Token_Filter>;
  quoteToken_contains?: InputMaybe<Scalars['String']['input']>;
  quoteToken_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  quoteToken_ends_with?: InputMaybe<Scalars['String']['input']>;
  quoteToken_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  quoteToken_gt?: InputMaybe<Scalars['String']['input']>;
  quoteToken_gte?: InputMaybe<Scalars['String']['input']>;
  quoteToken_in?: InputMaybe<Array<Scalars['String']['input']>>;
  quoteToken_lt?: InputMaybe<Scalars['String']['input']>;
  quoteToken_lte?: InputMaybe<Scalars['String']['input']>;
  quoteToken_not?: InputMaybe<Scalars['String']['input']>;
  quoteToken_not_contains?: InputMaybe<Scalars['String']['input']>;
  quoteToken_not_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  quoteToken_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  quoteToken_not_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  quoteToken_not_in?: InputMaybe<Array<Scalars['String']['input']>>;
  quoteToken_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  quoteToken_not_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  quoteToken_starts_with?: InputMaybe<Scalars['String']['input']>;
  quoteToken_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  timestamp?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_gt?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_gte?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  timestamp_lt?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_lte?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_not?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  to?: InputMaybe<Scalars['BigInt']['input']>;
  to_gt?: InputMaybe<Scalars['BigInt']['input']>;
  to_gte?: InputMaybe<Scalars['BigInt']['input']>;
  to_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  to_lt?: InputMaybe<Scalars['BigInt']['input']>;
  to_lte?: InputMaybe<Scalars['BigInt']['input']>;
  to_not?: InputMaybe<Scalars['BigInt']['input']>;
  to_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
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
};

export enum LenderEvent_OrderBy {
  Account = 'account',
  AccountAddress = 'account__address',
  AccountCollateralToken = 'account__collateralToken',
  AccountDebtToken = 'account__debtToken',
  AccountId = 'account__id',
  AccountIsDpm = 'account__isDPM',
  AccountPositionType = 'account__positionType',
  AccountProtocol = 'account__protocol',
  AccountVaultId = 'account__vaultId',
  Amount = 'amount',
  BlockNumber = 'blockNumber',
  CollateralToken = 'collateralToken',
  CollateralTokenPriceUsd = 'collateralTokenPriceUSD',
  CollateralTokenAddress = 'collateralToken__address',
  CollateralTokenDecimals = 'collateralToken__decimals',
  CollateralTokenId = 'collateralToken__id',
  CollateralTokenPrecision = 'collateralToken__precision',
  CollateralTokenSymbol = 'collateralToken__symbol',
  EarnPosition = 'earnPosition',
  EarnPositionEarnCumulativeDepositInCollateralToken = 'earnPosition__earnCumulativeDepositInCollateralToken',
  EarnPositionEarnCumulativeDepositInQuoteToken = 'earnPosition__earnCumulativeDepositInQuoteToken',
  EarnPositionEarnCumulativeDepositUsd = 'earnPosition__earnCumulativeDepositUSD',
  EarnPositionEarnCumulativeFeesInCollateralToken = 'earnPosition__earnCumulativeFeesInCollateralToken',
  EarnPositionEarnCumulativeFeesInQuoteToken = 'earnPosition__earnCumulativeFeesInQuoteToken',
  EarnPositionEarnCumulativeFeesUsd = 'earnPosition__earnCumulativeFeesUSD',
  EarnPositionEarnCumulativeQuoteTokenDeposit = 'earnPosition__earnCumulativeQuoteTokenDeposit',
  EarnPositionEarnCumulativeQuoteTokenWithdraw = 'earnPosition__earnCumulativeQuoteTokenWithdraw',
  EarnPositionEarnCumulativeWithdrawInCollateralToken = 'earnPosition__earnCumulativeWithdrawInCollateralToken',
  EarnPositionEarnCumulativeWithdrawInQuoteToken = 'earnPosition__earnCumulativeWithdrawInQuoteToken',
  EarnPositionEarnCumulativeWithdrawUsd = 'earnPosition__earnCumulativeWithdrawUSD',
  EarnPositionEarnDailyTokenBlocks = 'earnPosition__earnDailyTokenBlocks',
  EarnPositionEarnIsEarning = 'earnPosition__earnIsEarning',
  EarnPositionEarnLastUpdateBlock = 'earnPosition__earnLastUpdateBlock',
  EarnPositionId = 'earnPosition__id',
  From = 'from',
  Id = 'id',
  Index = 'index',
  Kind = 'kind',
  Lender = 'lender',
  LpAwarded = 'lpAwarded',
  LpAwardedTo = 'lpAwardedTo',
  LpRedeemed = 'lpRedeemed',
  LpRedeemedFrom = 'lpRedeemedFrom',
  Lup = 'lup',
  Pool = 'pool',
  PoolAccuredDebt = 'pool__accuredDebt',
  PoolAddress = 'pool__address',
  PoolApr7dAverage = 'pool__apr7dAverage',
  PoolApr30dAverage = 'pool__apr30dAverage',
  PoolAuctionPrice = 'pool__auctionPrice',
  PoolBorrowApr = 'pool__borrowApr',
  PoolBorrowDailyTokenBlocks = 'pool__borrowDailyTokenBlocks',
  PoolClaimableReserves = 'pool__claimableReserves',
  PoolClaimableReservesRemaining = 'pool__claimableReservesRemaining',
  PoolCollateralAddress = 'pool__collateralAddress',
  PoolCollateralScale = 'pool__collateralScale',
  PoolCurrentBurnEpoch = 'pool__currentBurnEpoch',
  PoolDailyPercentageRate30dAverage = 'pool__dailyPercentageRate30dAverage',
  PoolDebt = 'pool__debt',
  PoolDebtInAuctions = 'pool__debtInAuctions',
  PoolDepositSize = 'pool__depositSize',
  PoolEarnDailyTokenBlocks = 'pool__earnDailyTokenBlocks',
  PoolHpb = 'pool__hpb',
  PoolHpbIndex = 'pool__hpbIndex',
  PoolHtp = 'pool__htp',
  PoolHtpIndex = 'pool__htpIndex',
  PoolId = 'pool__id',
  PoolInterestRate = 'pool__interestRate',
  PoolLastInterestRateUpdate = 'pool__lastInterestRateUpdate',
  PoolLendApr = 'pool__lendApr',
  PoolLendApr7dAverage = 'pool__lendApr7dAverage',
  PoolLendApr30dAverage = 'pool__lendApr30dAverage',
  PoolLendDailyPercentageRate30dAverage = 'pool__lendDailyPercentageRate30dAverage',
  PoolLendMonthlyPercentageRate30dAverage = 'pool__lendMonthlyPercentageRate30dAverage',
  PoolLoansCount = 'pool__loansCount',
  PoolLup = 'pool__lup',
  PoolLupIndex = 'pool__lupIndex',
  PoolMonthlyPercentageRate30dAverage = 'pool__monthlyPercentageRate30dAverage',
  PoolName = 'pool__name',
  PoolPoolActualUtilization = 'pool__poolActualUtilization',
  PoolPoolCollateralization = 'pool__poolCollateralization',
  PoolPoolMinDebtAmount = 'pool__poolMinDebtAmount',
  PoolPoolTargetUtilization = 'pool__poolTargetUtilization',
  PoolQuoteTokenAddress = 'pool__quoteTokenAddress',
  PoolQuoteTokenScale = 'pool__quoteTokenScale',
  PoolReserves = 'pool__reserves',
  PoolSummerDepositAmountEarningInterest = 'pool__summerDepositAmountEarningInterest',
  PoolT0debt = 'pool__t0debt',
  PoolTimeRemaining = 'pool__timeRemaining',
  PoolTotalAuctionsInPool = 'pool__totalAuctionsInPool',
  Position = 'position',
  PositionDepositTime = 'position__depositTime',
  PositionId = 'position__id',
  PositionIndex = 'position__index',
  PositionLps = 'position__lps',
  QuoteAfter = 'quoteAfter',
  QuoteBefore = 'quoteBefore',
  QuoteDelta = 'quoteDelta',
  QuoteToken = 'quoteToken',
  QuoteTokenPriceUsd = 'quoteTokenPriceUSD',
  QuoteTokenAddress = 'quoteToken__address',
  QuoteTokenDecimals = 'quoteToken__decimals',
  QuoteTokenId = 'quoteToken__id',
  QuoteTokenPrecision = 'quoteToken__precision',
  QuoteTokenSymbol = 'quoteToken__symbol',
  Timestamp = 'timestamp',
  To = 'to',
  TxHash = 'txHash'
}

export type ListOfPool = {
  __typename?: 'ListOfPool';
  id: Scalars['ID']['output'];
  pools: Array<Pool>;
};


export type ListOfPoolPoolsArgs = {
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Pool_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  where?: InputMaybe<Pool_Filter>;
};

export type ListOfPool_Filter = {
  /** Filter for the block changed event. */
  _change_block?: InputMaybe<BlockChangedFilter>;
  and?: InputMaybe<Array<InputMaybe<ListOfPool_Filter>>>;
  id?: InputMaybe<Scalars['ID']['input']>;
  id_gt?: InputMaybe<Scalars['ID']['input']>;
  id_gte?: InputMaybe<Scalars['ID']['input']>;
  id_in?: InputMaybe<Array<Scalars['ID']['input']>>;
  id_lt?: InputMaybe<Scalars['ID']['input']>;
  id_lte?: InputMaybe<Scalars['ID']['input']>;
  id_not?: InputMaybe<Scalars['ID']['input']>;
  id_not_in?: InputMaybe<Array<Scalars['ID']['input']>>;
  or?: InputMaybe<Array<InputMaybe<ListOfPool_Filter>>>;
  pools?: InputMaybe<Array<Scalars['String']['input']>>;
  pools_?: InputMaybe<Pool_Filter>;
  pools_contains?: InputMaybe<Array<Scalars['String']['input']>>;
  pools_contains_nocase?: InputMaybe<Array<Scalars['String']['input']>>;
  pools_not?: InputMaybe<Array<Scalars['String']['input']>>;
  pools_not_contains?: InputMaybe<Array<Scalars['String']['input']>>;
  pools_not_contains_nocase?: InputMaybe<Array<Scalars['String']['input']>>;
};

export enum ListOfPool_OrderBy {
  Id = 'id',
  Pools = 'pools'
}

export type Nft = {
  __typename?: 'NFT';
  account?: Maybe<Account>;
  buckets?: Maybe<Array<EarnPositionBucket>>;
  currentReward: Scalars['BigInt']['output'];
  id: Scalars['ID']['output'];
  pool: Pool;
  staked: Scalars['Boolean']['output'];
  tokenId: Scalars['BigInt']['output'];
  user?: Maybe<User>;
};


export type NftBucketsArgs = {
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<EarnPositionBucket_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  where?: InputMaybe<EarnPositionBucket_Filter>;
};

export type Nft_Filter = {
  /** Filter for the block changed event. */
  _change_block?: InputMaybe<BlockChangedFilter>;
  account?: InputMaybe<Scalars['String']['input']>;
  account_?: InputMaybe<Account_Filter>;
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
  and?: InputMaybe<Array<InputMaybe<Nft_Filter>>>;
  buckets_?: InputMaybe<EarnPositionBucket_Filter>;
  currentReward?: InputMaybe<Scalars['BigInt']['input']>;
  currentReward_gt?: InputMaybe<Scalars['BigInt']['input']>;
  currentReward_gte?: InputMaybe<Scalars['BigInt']['input']>;
  currentReward_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  currentReward_lt?: InputMaybe<Scalars['BigInt']['input']>;
  currentReward_lte?: InputMaybe<Scalars['BigInt']['input']>;
  currentReward_not?: InputMaybe<Scalars['BigInt']['input']>;
  currentReward_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  id?: InputMaybe<Scalars['ID']['input']>;
  id_gt?: InputMaybe<Scalars['ID']['input']>;
  id_gte?: InputMaybe<Scalars['ID']['input']>;
  id_in?: InputMaybe<Array<Scalars['ID']['input']>>;
  id_lt?: InputMaybe<Scalars['ID']['input']>;
  id_lte?: InputMaybe<Scalars['ID']['input']>;
  id_not?: InputMaybe<Scalars['ID']['input']>;
  id_not_in?: InputMaybe<Array<Scalars['ID']['input']>>;
  or?: InputMaybe<Array<InputMaybe<Nft_Filter>>>;
  pool?: InputMaybe<Scalars['String']['input']>;
  pool_?: InputMaybe<Pool_Filter>;
  pool_contains?: InputMaybe<Scalars['String']['input']>;
  pool_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  pool_ends_with?: InputMaybe<Scalars['String']['input']>;
  pool_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  pool_gt?: InputMaybe<Scalars['String']['input']>;
  pool_gte?: InputMaybe<Scalars['String']['input']>;
  pool_in?: InputMaybe<Array<Scalars['String']['input']>>;
  pool_lt?: InputMaybe<Scalars['String']['input']>;
  pool_lte?: InputMaybe<Scalars['String']['input']>;
  pool_not?: InputMaybe<Scalars['String']['input']>;
  pool_not_contains?: InputMaybe<Scalars['String']['input']>;
  pool_not_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  pool_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  pool_not_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  pool_not_in?: InputMaybe<Array<Scalars['String']['input']>>;
  pool_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  pool_not_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  pool_starts_with?: InputMaybe<Scalars['String']['input']>;
  pool_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  staked?: InputMaybe<Scalars['Boolean']['input']>;
  staked_in?: InputMaybe<Array<Scalars['Boolean']['input']>>;
  staked_not?: InputMaybe<Scalars['Boolean']['input']>;
  staked_not_in?: InputMaybe<Array<Scalars['Boolean']['input']>>;
  tokenId?: InputMaybe<Scalars['BigInt']['input']>;
  tokenId_gt?: InputMaybe<Scalars['BigInt']['input']>;
  tokenId_gte?: InputMaybe<Scalars['BigInt']['input']>;
  tokenId_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  tokenId_lt?: InputMaybe<Scalars['BigInt']['input']>;
  tokenId_lte?: InputMaybe<Scalars['BigInt']['input']>;
  tokenId_not?: InputMaybe<Scalars['BigInt']['input']>;
  tokenId_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  user?: InputMaybe<Scalars['String']['input']>;
  user_?: InputMaybe<User_Filter>;
  user_contains?: InputMaybe<Scalars['String']['input']>;
  user_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  user_ends_with?: InputMaybe<Scalars['String']['input']>;
  user_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  user_gt?: InputMaybe<Scalars['String']['input']>;
  user_gte?: InputMaybe<Scalars['String']['input']>;
  user_in?: InputMaybe<Array<Scalars['String']['input']>>;
  user_lt?: InputMaybe<Scalars['String']['input']>;
  user_lte?: InputMaybe<Scalars['String']['input']>;
  user_not?: InputMaybe<Scalars['String']['input']>;
  user_not_contains?: InputMaybe<Scalars['String']['input']>;
  user_not_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  user_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  user_not_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  user_not_in?: InputMaybe<Array<Scalars['String']['input']>>;
  user_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  user_not_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  user_starts_with?: InputMaybe<Scalars['String']['input']>;
  user_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
};

export enum Nft_OrderBy {
  Account = 'account',
  AccountAddress = 'account__address',
  AccountCollateralToken = 'account__collateralToken',
  AccountDebtToken = 'account__debtToken',
  AccountId = 'account__id',
  AccountIsDpm = 'account__isDPM',
  AccountPositionType = 'account__positionType',
  AccountProtocol = 'account__protocol',
  AccountVaultId = 'account__vaultId',
  Buckets = 'buckets',
  CurrentReward = 'currentReward',
  Id = 'id',
  Pool = 'pool',
  PoolAccuredDebt = 'pool__accuredDebt',
  PoolAddress = 'pool__address',
  PoolApr7dAverage = 'pool__apr7dAverage',
  PoolApr30dAverage = 'pool__apr30dAverage',
  PoolAuctionPrice = 'pool__auctionPrice',
  PoolBorrowApr = 'pool__borrowApr',
  PoolBorrowDailyTokenBlocks = 'pool__borrowDailyTokenBlocks',
  PoolClaimableReserves = 'pool__claimableReserves',
  PoolClaimableReservesRemaining = 'pool__claimableReservesRemaining',
  PoolCollateralAddress = 'pool__collateralAddress',
  PoolCollateralScale = 'pool__collateralScale',
  PoolCurrentBurnEpoch = 'pool__currentBurnEpoch',
  PoolDailyPercentageRate30dAverage = 'pool__dailyPercentageRate30dAverage',
  PoolDebt = 'pool__debt',
  PoolDebtInAuctions = 'pool__debtInAuctions',
  PoolDepositSize = 'pool__depositSize',
  PoolEarnDailyTokenBlocks = 'pool__earnDailyTokenBlocks',
  PoolHpb = 'pool__hpb',
  PoolHpbIndex = 'pool__hpbIndex',
  PoolHtp = 'pool__htp',
  PoolHtpIndex = 'pool__htpIndex',
  PoolId = 'pool__id',
  PoolInterestRate = 'pool__interestRate',
  PoolLastInterestRateUpdate = 'pool__lastInterestRateUpdate',
  PoolLendApr = 'pool__lendApr',
  PoolLendApr7dAverage = 'pool__lendApr7dAverage',
  PoolLendApr30dAverage = 'pool__lendApr30dAverage',
  PoolLendDailyPercentageRate30dAverage = 'pool__lendDailyPercentageRate30dAverage',
  PoolLendMonthlyPercentageRate30dAverage = 'pool__lendMonthlyPercentageRate30dAverage',
  PoolLoansCount = 'pool__loansCount',
  PoolLup = 'pool__lup',
  PoolLupIndex = 'pool__lupIndex',
  PoolMonthlyPercentageRate30dAverage = 'pool__monthlyPercentageRate30dAverage',
  PoolName = 'pool__name',
  PoolPoolActualUtilization = 'pool__poolActualUtilization',
  PoolPoolCollateralization = 'pool__poolCollateralization',
  PoolPoolMinDebtAmount = 'pool__poolMinDebtAmount',
  PoolPoolTargetUtilization = 'pool__poolTargetUtilization',
  PoolQuoteTokenAddress = 'pool__quoteTokenAddress',
  PoolQuoteTokenScale = 'pool__quoteTokenScale',
  PoolReserves = 'pool__reserves',
  PoolSummerDepositAmountEarningInterest = 'pool__summerDepositAmountEarningInterest',
  PoolT0debt = 'pool__t0debt',
  PoolTimeRemaining = 'pool__timeRemaining',
  PoolTotalAuctionsInPool = 'pool__totalAuctionsInPool',
  Staked = 'staked',
  TokenId = 'tokenId',
  User = 'user',
  UserAddress = 'user__address',
  UserId = 'user__id',
  UserVaultCount = 'user__vaultCount'
}

export type OasisEvent = {
  __typename?: 'OasisEvent';
  account: Account;
  addOrRemoveIndex?: Maybe<Scalars['BigInt']['output']>;
  blockNumber: Scalars['BigInt']['output'];
  borrowPosition?: Maybe<BorrowPosition>;
  collateralAddress: Scalars['Bytes']['output'];
  collateralAfter: Scalars['BigDecimal']['output'];
  collateralBefore: Scalars['BigDecimal']['output'];
  collateralDelta: Scalars['BigDecimal']['output'];
  collateralLpsRemoved?: Maybe<Scalars['BigDecimal']['output']>;
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
  depositedInQuoteToken: Scalars['BigDecimal']['output'];
  depositedUSD?: Maybe<Scalars['BigDecimal']['output']>;
  earnPosition?: Maybe<EarnPosition>;
  ethPrice: Scalars['BigDecimal']['output'];
  gasFeeInCollateralToken: Scalars['BigDecimal']['output'];
  gasFeeInQuoteToken: Scalars['BigDecimal']['output'];
  gasFeeUSD: Scalars['BigDecimal']['output'];
  gasPrice: Scalars['BigInt']['output'];
  gasUsed: Scalars['BigInt']['output'];
  id: Scalars['Bytes']['output'];
  interestRate?: Maybe<Scalars['BigInt']['output']>;
  isOpen?: Maybe<Scalars['Boolean']['output']>;
  kind: Scalars['String']['output'];
  liquidationPriceAfter: Scalars['BigDecimal']['output'];
  liquidationPriceBefore: Scalars['BigDecimal']['output'];
  ltvAfter?: Maybe<Scalars['BigDecimal']['output']>;
  ltvBefore?: Maybe<Scalars['BigDecimal']['output']>;
  marketPrice?: Maybe<Scalars['BigDecimal']['output']>;
  moveQuoteFromIndex?: Maybe<Scalars['BigInt']['output']>;
  moveQuoteToIndex?: Maybe<Scalars['BigInt']['output']>;
  multipleAfter?: Maybe<Scalars['BigDecimal']['output']>;
  multipleBefore?: Maybe<Scalars['BigDecimal']['output']>;
  netValueAfter?: Maybe<Scalars['BigDecimal']['output']>;
  netValueBefore?: Maybe<Scalars['BigDecimal']['output']>;
  oasisFee: Scalars['BigDecimal']['output'];
  oasisFeeInCollateralToken: Scalars['BigDecimal']['output'];
  oasisFeeInQuoteToken: Scalars['BigDecimal']['output'];
  oasisFeeToken?: Maybe<Scalars['Bytes']['output']>;
  oasisFeeUSD: Scalars['BigDecimal']['output'];
  originationFee: Scalars['BigDecimal']['output'];
  originationFeeInCollateralToken: Scalars['BigDecimal']['output'];
  originationFeeInQuoteToken: Scalars['BigDecimal']['output'];
  originationFeeUSD: Scalars['BigDecimal']['output'];
  pool?: Maybe<Pool>;
  quoteTokensAfter?: Maybe<Scalars['BigDecimal']['output']>;
  quoteTokensBefore?: Maybe<Scalars['BigDecimal']['output']>;
  quoteTokensDelta?: Maybe<Scalars['BigDecimal']['output']>;
  quoteTokensMoved?: Maybe<Scalars['BigDecimal']['output']>;
  swapFromAmount?: Maybe<Scalars['BigDecimal']['output']>;
  swapFromToken?: Maybe<Scalars['Bytes']['output']>;
  swapToAmount?: Maybe<Scalars['BigDecimal']['output']>;
  swapToToken?: Maybe<Scalars['Bytes']['output']>;
  timestamp: Scalars['BigInt']['output'];
  totalFee: Scalars['BigDecimal']['output'];
  totalFeeInCollateralToken: Scalars['BigDecimal']['output'];
  totalFeeInQuoteToken: Scalars['BigDecimal']['output'];
  totalFeeUSD: Scalars['BigDecimal']['output'];
  txHash: Scalars['Bytes']['output'];
  withdrawTransfers: Array<Transfer>;
  withdrawnInQuoteToken: Scalars['BigDecimal']['output'];
  withdrawnUSD?: Maybe<Scalars['BigDecimal']['output']>;
};


export type OasisEventDepositTransfersArgs = {
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Transfer_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  where?: InputMaybe<Transfer_Filter>;
};


export type OasisEventWithdrawTransfersArgs = {
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Transfer_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  where?: InputMaybe<Transfer_Filter>;
};

export type OasisEvent_Filter = {
  /** Filter for the block changed event. */
  _change_block?: InputMaybe<BlockChangedFilter>;
  account?: InputMaybe<Scalars['String']['input']>;
  account_?: InputMaybe<Account_Filter>;
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
  addOrRemoveIndex?: InputMaybe<Scalars['BigInt']['input']>;
  addOrRemoveIndex_gt?: InputMaybe<Scalars['BigInt']['input']>;
  addOrRemoveIndex_gte?: InputMaybe<Scalars['BigInt']['input']>;
  addOrRemoveIndex_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  addOrRemoveIndex_lt?: InputMaybe<Scalars['BigInt']['input']>;
  addOrRemoveIndex_lte?: InputMaybe<Scalars['BigInt']['input']>;
  addOrRemoveIndex_not?: InputMaybe<Scalars['BigInt']['input']>;
  addOrRemoveIndex_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  and?: InputMaybe<Array<InputMaybe<OasisEvent_Filter>>>;
  blockNumber?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_gt?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_gte?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  blockNumber_lt?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_lte?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_not?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  borrowPosition?: InputMaybe<Scalars['String']['input']>;
  borrowPosition_?: InputMaybe<BorrowPosition_Filter>;
  borrowPosition_contains?: InputMaybe<Scalars['String']['input']>;
  borrowPosition_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  borrowPosition_ends_with?: InputMaybe<Scalars['String']['input']>;
  borrowPosition_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  borrowPosition_gt?: InputMaybe<Scalars['String']['input']>;
  borrowPosition_gte?: InputMaybe<Scalars['String']['input']>;
  borrowPosition_in?: InputMaybe<Array<Scalars['String']['input']>>;
  borrowPosition_lt?: InputMaybe<Scalars['String']['input']>;
  borrowPosition_lte?: InputMaybe<Scalars['String']['input']>;
  borrowPosition_not?: InputMaybe<Scalars['String']['input']>;
  borrowPosition_not_contains?: InputMaybe<Scalars['String']['input']>;
  borrowPosition_not_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  borrowPosition_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  borrowPosition_not_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  borrowPosition_not_in?: InputMaybe<Array<Scalars['String']['input']>>;
  borrowPosition_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  borrowPosition_not_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  borrowPosition_starts_with?: InputMaybe<Scalars['String']['input']>;
  borrowPosition_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
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
  collateralLpsRemoved?: InputMaybe<Scalars['BigDecimal']['input']>;
  collateralLpsRemoved_gt?: InputMaybe<Scalars['BigDecimal']['input']>;
  collateralLpsRemoved_gte?: InputMaybe<Scalars['BigDecimal']['input']>;
  collateralLpsRemoved_in?: InputMaybe<Array<Scalars['BigDecimal']['input']>>;
  collateralLpsRemoved_lt?: InputMaybe<Scalars['BigDecimal']['input']>;
  collateralLpsRemoved_lte?: InputMaybe<Scalars['BigDecimal']['input']>;
  collateralLpsRemoved_not?: InputMaybe<Scalars['BigDecimal']['input']>;
  collateralLpsRemoved_not_in?: InputMaybe<Array<Scalars['BigDecimal']['input']>>;
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
  depositedInQuoteToken?: InputMaybe<Scalars['BigDecimal']['input']>;
  depositedInQuoteToken_gt?: InputMaybe<Scalars['BigDecimal']['input']>;
  depositedInQuoteToken_gte?: InputMaybe<Scalars['BigDecimal']['input']>;
  depositedInQuoteToken_in?: InputMaybe<Array<Scalars['BigDecimal']['input']>>;
  depositedInQuoteToken_lt?: InputMaybe<Scalars['BigDecimal']['input']>;
  depositedInQuoteToken_lte?: InputMaybe<Scalars['BigDecimal']['input']>;
  depositedInQuoteToken_not?: InputMaybe<Scalars['BigDecimal']['input']>;
  depositedInQuoteToken_not_in?: InputMaybe<Array<Scalars['BigDecimal']['input']>>;
  depositedUSD?: InputMaybe<Scalars['BigDecimal']['input']>;
  depositedUSD_gt?: InputMaybe<Scalars['BigDecimal']['input']>;
  depositedUSD_gte?: InputMaybe<Scalars['BigDecimal']['input']>;
  depositedUSD_in?: InputMaybe<Array<Scalars['BigDecimal']['input']>>;
  depositedUSD_lt?: InputMaybe<Scalars['BigDecimal']['input']>;
  depositedUSD_lte?: InputMaybe<Scalars['BigDecimal']['input']>;
  depositedUSD_not?: InputMaybe<Scalars['BigDecimal']['input']>;
  depositedUSD_not_in?: InputMaybe<Array<Scalars['BigDecimal']['input']>>;
  earnPosition?: InputMaybe<Scalars['String']['input']>;
  earnPosition_?: InputMaybe<EarnPosition_Filter>;
  earnPosition_contains?: InputMaybe<Scalars['String']['input']>;
  earnPosition_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  earnPosition_ends_with?: InputMaybe<Scalars['String']['input']>;
  earnPosition_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  earnPosition_gt?: InputMaybe<Scalars['String']['input']>;
  earnPosition_gte?: InputMaybe<Scalars['String']['input']>;
  earnPosition_in?: InputMaybe<Array<Scalars['String']['input']>>;
  earnPosition_lt?: InputMaybe<Scalars['String']['input']>;
  earnPosition_lte?: InputMaybe<Scalars['String']['input']>;
  earnPosition_not?: InputMaybe<Scalars['String']['input']>;
  earnPosition_not_contains?: InputMaybe<Scalars['String']['input']>;
  earnPosition_not_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  earnPosition_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  earnPosition_not_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  earnPosition_not_in?: InputMaybe<Array<Scalars['String']['input']>>;
  earnPosition_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  earnPosition_not_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  earnPosition_starts_with?: InputMaybe<Scalars['String']['input']>;
  earnPosition_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  ethPrice?: InputMaybe<Scalars['BigDecimal']['input']>;
  ethPrice_gt?: InputMaybe<Scalars['BigDecimal']['input']>;
  ethPrice_gte?: InputMaybe<Scalars['BigDecimal']['input']>;
  ethPrice_in?: InputMaybe<Array<Scalars['BigDecimal']['input']>>;
  ethPrice_lt?: InputMaybe<Scalars['BigDecimal']['input']>;
  ethPrice_lte?: InputMaybe<Scalars['BigDecimal']['input']>;
  ethPrice_not?: InputMaybe<Scalars['BigDecimal']['input']>;
  ethPrice_not_in?: InputMaybe<Array<Scalars['BigDecimal']['input']>>;
  gasFeeInCollateralToken?: InputMaybe<Scalars['BigDecimal']['input']>;
  gasFeeInCollateralToken_gt?: InputMaybe<Scalars['BigDecimal']['input']>;
  gasFeeInCollateralToken_gte?: InputMaybe<Scalars['BigDecimal']['input']>;
  gasFeeInCollateralToken_in?: InputMaybe<Array<Scalars['BigDecimal']['input']>>;
  gasFeeInCollateralToken_lt?: InputMaybe<Scalars['BigDecimal']['input']>;
  gasFeeInCollateralToken_lte?: InputMaybe<Scalars['BigDecimal']['input']>;
  gasFeeInCollateralToken_not?: InputMaybe<Scalars['BigDecimal']['input']>;
  gasFeeInCollateralToken_not_in?: InputMaybe<Array<Scalars['BigDecimal']['input']>>;
  gasFeeInQuoteToken?: InputMaybe<Scalars['BigDecimal']['input']>;
  gasFeeInQuoteToken_gt?: InputMaybe<Scalars['BigDecimal']['input']>;
  gasFeeInQuoteToken_gte?: InputMaybe<Scalars['BigDecimal']['input']>;
  gasFeeInQuoteToken_in?: InputMaybe<Array<Scalars['BigDecimal']['input']>>;
  gasFeeInQuoteToken_lt?: InputMaybe<Scalars['BigDecimal']['input']>;
  gasFeeInQuoteToken_lte?: InputMaybe<Scalars['BigDecimal']['input']>;
  gasFeeInQuoteToken_not?: InputMaybe<Scalars['BigDecimal']['input']>;
  gasFeeInQuoteToken_not_in?: InputMaybe<Array<Scalars['BigDecimal']['input']>>;
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
  interestRate?: InputMaybe<Scalars['BigInt']['input']>;
  interestRate_gt?: InputMaybe<Scalars['BigInt']['input']>;
  interestRate_gte?: InputMaybe<Scalars['BigInt']['input']>;
  interestRate_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  interestRate_lt?: InputMaybe<Scalars['BigInt']['input']>;
  interestRate_lte?: InputMaybe<Scalars['BigInt']['input']>;
  interestRate_not?: InputMaybe<Scalars['BigInt']['input']>;
  interestRate_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  isOpen?: InputMaybe<Scalars['Boolean']['input']>;
  isOpen_in?: InputMaybe<Array<Scalars['Boolean']['input']>>;
  isOpen_not?: InputMaybe<Scalars['Boolean']['input']>;
  isOpen_not_in?: InputMaybe<Array<Scalars['Boolean']['input']>>;
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
  moveQuoteFromIndex?: InputMaybe<Scalars['BigInt']['input']>;
  moveQuoteFromIndex_gt?: InputMaybe<Scalars['BigInt']['input']>;
  moveQuoteFromIndex_gte?: InputMaybe<Scalars['BigInt']['input']>;
  moveQuoteFromIndex_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  moveQuoteFromIndex_lt?: InputMaybe<Scalars['BigInt']['input']>;
  moveQuoteFromIndex_lte?: InputMaybe<Scalars['BigInt']['input']>;
  moveQuoteFromIndex_not?: InputMaybe<Scalars['BigInt']['input']>;
  moveQuoteFromIndex_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  moveQuoteToIndex?: InputMaybe<Scalars['BigInt']['input']>;
  moveQuoteToIndex_gt?: InputMaybe<Scalars['BigInt']['input']>;
  moveQuoteToIndex_gte?: InputMaybe<Scalars['BigInt']['input']>;
  moveQuoteToIndex_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  moveQuoteToIndex_lt?: InputMaybe<Scalars['BigInt']['input']>;
  moveQuoteToIndex_lte?: InputMaybe<Scalars['BigInt']['input']>;
  moveQuoteToIndex_not?: InputMaybe<Scalars['BigInt']['input']>;
  moveQuoteToIndex_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
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
  oasisFeeInCollateralToken?: InputMaybe<Scalars['BigDecimal']['input']>;
  oasisFeeInCollateralToken_gt?: InputMaybe<Scalars['BigDecimal']['input']>;
  oasisFeeInCollateralToken_gte?: InputMaybe<Scalars['BigDecimal']['input']>;
  oasisFeeInCollateralToken_in?: InputMaybe<Array<Scalars['BigDecimal']['input']>>;
  oasisFeeInCollateralToken_lt?: InputMaybe<Scalars['BigDecimal']['input']>;
  oasisFeeInCollateralToken_lte?: InputMaybe<Scalars['BigDecimal']['input']>;
  oasisFeeInCollateralToken_not?: InputMaybe<Scalars['BigDecimal']['input']>;
  oasisFeeInCollateralToken_not_in?: InputMaybe<Array<Scalars['BigDecimal']['input']>>;
  oasisFeeInQuoteToken?: InputMaybe<Scalars['BigDecimal']['input']>;
  oasisFeeInQuoteToken_gt?: InputMaybe<Scalars['BigDecimal']['input']>;
  oasisFeeInQuoteToken_gte?: InputMaybe<Scalars['BigDecimal']['input']>;
  oasisFeeInQuoteToken_in?: InputMaybe<Array<Scalars['BigDecimal']['input']>>;
  oasisFeeInQuoteToken_lt?: InputMaybe<Scalars['BigDecimal']['input']>;
  oasisFeeInQuoteToken_lte?: InputMaybe<Scalars['BigDecimal']['input']>;
  oasisFeeInQuoteToken_not?: InputMaybe<Scalars['BigDecimal']['input']>;
  oasisFeeInQuoteToken_not_in?: InputMaybe<Array<Scalars['BigDecimal']['input']>>;
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
  or?: InputMaybe<Array<InputMaybe<OasisEvent_Filter>>>;
  originationFee?: InputMaybe<Scalars['BigDecimal']['input']>;
  originationFeeInCollateralToken?: InputMaybe<Scalars['BigDecimal']['input']>;
  originationFeeInCollateralToken_gt?: InputMaybe<Scalars['BigDecimal']['input']>;
  originationFeeInCollateralToken_gte?: InputMaybe<Scalars['BigDecimal']['input']>;
  originationFeeInCollateralToken_in?: InputMaybe<Array<Scalars['BigDecimal']['input']>>;
  originationFeeInCollateralToken_lt?: InputMaybe<Scalars['BigDecimal']['input']>;
  originationFeeInCollateralToken_lte?: InputMaybe<Scalars['BigDecimal']['input']>;
  originationFeeInCollateralToken_not?: InputMaybe<Scalars['BigDecimal']['input']>;
  originationFeeInCollateralToken_not_in?: InputMaybe<Array<Scalars['BigDecimal']['input']>>;
  originationFeeInQuoteToken?: InputMaybe<Scalars['BigDecimal']['input']>;
  originationFeeInQuoteToken_gt?: InputMaybe<Scalars['BigDecimal']['input']>;
  originationFeeInQuoteToken_gte?: InputMaybe<Scalars['BigDecimal']['input']>;
  originationFeeInQuoteToken_in?: InputMaybe<Array<Scalars['BigDecimal']['input']>>;
  originationFeeInQuoteToken_lt?: InputMaybe<Scalars['BigDecimal']['input']>;
  originationFeeInQuoteToken_lte?: InputMaybe<Scalars['BigDecimal']['input']>;
  originationFeeInQuoteToken_not?: InputMaybe<Scalars['BigDecimal']['input']>;
  originationFeeInQuoteToken_not_in?: InputMaybe<Array<Scalars['BigDecimal']['input']>>;
  originationFeeUSD?: InputMaybe<Scalars['BigDecimal']['input']>;
  originationFeeUSD_gt?: InputMaybe<Scalars['BigDecimal']['input']>;
  originationFeeUSD_gte?: InputMaybe<Scalars['BigDecimal']['input']>;
  originationFeeUSD_in?: InputMaybe<Array<Scalars['BigDecimal']['input']>>;
  originationFeeUSD_lt?: InputMaybe<Scalars['BigDecimal']['input']>;
  originationFeeUSD_lte?: InputMaybe<Scalars['BigDecimal']['input']>;
  originationFeeUSD_not?: InputMaybe<Scalars['BigDecimal']['input']>;
  originationFeeUSD_not_in?: InputMaybe<Array<Scalars['BigDecimal']['input']>>;
  originationFee_gt?: InputMaybe<Scalars['BigDecimal']['input']>;
  originationFee_gte?: InputMaybe<Scalars['BigDecimal']['input']>;
  originationFee_in?: InputMaybe<Array<Scalars['BigDecimal']['input']>>;
  originationFee_lt?: InputMaybe<Scalars['BigDecimal']['input']>;
  originationFee_lte?: InputMaybe<Scalars['BigDecimal']['input']>;
  originationFee_not?: InputMaybe<Scalars['BigDecimal']['input']>;
  originationFee_not_in?: InputMaybe<Array<Scalars['BigDecimal']['input']>>;
  pool?: InputMaybe<Scalars['String']['input']>;
  pool_?: InputMaybe<Pool_Filter>;
  pool_contains?: InputMaybe<Scalars['String']['input']>;
  pool_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  pool_ends_with?: InputMaybe<Scalars['String']['input']>;
  pool_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  pool_gt?: InputMaybe<Scalars['String']['input']>;
  pool_gte?: InputMaybe<Scalars['String']['input']>;
  pool_in?: InputMaybe<Array<Scalars['String']['input']>>;
  pool_lt?: InputMaybe<Scalars['String']['input']>;
  pool_lte?: InputMaybe<Scalars['String']['input']>;
  pool_not?: InputMaybe<Scalars['String']['input']>;
  pool_not_contains?: InputMaybe<Scalars['String']['input']>;
  pool_not_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  pool_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  pool_not_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  pool_not_in?: InputMaybe<Array<Scalars['String']['input']>>;
  pool_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  pool_not_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  pool_starts_with?: InputMaybe<Scalars['String']['input']>;
  pool_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  quoteTokensAfter?: InputMaybe<Scalars['BigDecimal']['input']>;
  quoteTokensAfter_gt?: InputMaybe<Scalars['BigDecimal']['input']>;
  quoteTokensAfter_gte?: InputMaybe<Scalars['BigDecimal']['input']>;
  quoteTokensAfter_in?: InputMaybe<Array<Scalars['BigDecimal']['input']>>;
  quoteTokensAfter_lt?: InputMaybe<Scalars['BigDecimal']['input']>;
  quoteTokensAfter_lte?: InputMaybe<Scalars['BigDecimal']['input']>;
  quoteTokensAfter_not?: InputMaybe<Scalars['BigDecimal']['input']>;
  quoteTokensAfter_not_in?: InputMaybe<Array<Scalars['BigDecimal']['input']>>;
  quoteTokensBefore?: InputMaybe<Scalars['BigDecimal']['input']>;
  quoteTokensBefore_gt?: InputMaybe<Scalars['BigDecimal']['input']>;
  quoteTokensBefore_gte?: InputMaybe<Scalars['BigDecimal']['input']>;
  quoteTokensBefore_in?: InputMaybe<Array<Scalars['BigDecimal']['input']>>;
  quoteTokensBefore_lt?: InputMaybe<Scalars['BigDecimal']['input']>;
  quoteTokensBefore_lte?: InputMaybe<Scalars['BigDecimal']['input']>;
  quoteTokensBefore_not?: InputMaybe<Scalars['BigDecimal']['input']>;
  quoteTokensBefore_not_in?: InputMaybe<Array<Scalars['BigDecimal']['input']>>;
  quoteTokensDelta?: InputMaybe<Scalars['BigDecimal']['input']>;
  quoteTokensDelta_gt?: InputMaybe<Scalars['BigDecimal']['input']>;
  quoteTokensDelta_gte?: InputMaybe<Scalars['BigDecimal']['input']>;
  quoteTokensDelta_in?: InputMaybe<Array<Scalars['BigDecimal']['input']>>;
  quoteTokensDelta_lt?: InputMaybe<Scalars['BigDecimal']['input']>;
  quoteTokensDelta_lte?: InputMaybe<Scalars['BigDecimal']['input']>;
  quoteTokensDelta_not?: InputMaybe<Scalars['BigDecimal']['input']>;
  quoteTokensDelta_not_in?: InputMaybe<Array<Scalars['BigDecimal']['input']>>;
  quoteTokensMoved?: InputMaybe<Scalars['BigDecimal']['input']>;
  quoteTokensMoved_gt?: InputMaybe<Scalars['BigDecimal']['input']>;
  quoteTokensMoved_gte?: InputMaybe<Scalars['BigDecimal']['input']>;
  quoteTokensMoved_in?: InputMaybe<Array<Scalars['BigDecimal']['input']>>;
  quoteTokensMoved_lt?: InputMaybe<Scalars['BigDecimal']['input']>;
  quoteTokensMoved_lte?: InputMaybe<Scalars['BigDecimal']['input']>;
  quoteTokensMoved_not?: InputMaybe<Scalars['BigDecimal']['input']>;
  quoteTokensMoved_not_in?: InputMaybe<Array<Scalars['BigDecimal']['input']>>;
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
  totalFeeInCollateralToken?: InputMaybe<Scalars['BigDecimal']['input']>;
  totalFeeInCollateralToken_gt?: InputMaybe<Scalars['BigDecimal']['input']>;
  totalFeeInCollateralToken_gte?: InputMaybe<Scalars['BigDecimal']['input']>;
  totalFeeInCollateralToken_in?: InputMaybe<Array<Scalars['BigDecimal']['input']>>;
  totalFeeInCollateralToken_lt?: InputMaybe<Scalars['BigDecimal']['input']>;
  totalFeeInCollateralToken_lte?: InputMaybe<Scalars['BigDecimal']['input']>;
  totalFeeInCollateralToken_not?: InputMaybe<Scalars['BigDecimal']['input']>;
  totalFeeInCollateralToken_not_in?: InputMaybe<Array<Scalars['BigDecimal']['input']>>;
  totalFeeInQuoteToken?: InputMaybe<Scalars['BigDecimal']['input']>;
  totalFeeInQuoteToken_gt?: InputMaybe<Scalars['BigDecimal']['input']>;
  totalFeeInQuoteToken_gte?: InputMaybe<Scalars['BigDecimal']['input']>;
  totalFeeInQuoteToken_in?: InputMaybe<Array<Scalars['BigDecimal']['input']>>;
  totalFeeInQuoteToken_lt?: InputMaybe<Scalars['BigDecimal']['input']>;
  totalFeeInQuoteToken_lte?: InputMaybe<Scalars['BigDecimal']['input']>;
  totalFeeInQuoteToken_not?: InputMaybe<Scalars['BigDecimal']['input']>;
  totalFeeInQuoteToken_not_in?: InputMaybe<Array<Scalars['BigDecimal']['input']>>;
  totalFeeUSD?: InputMaybe<Scalars['BigDecimal']['input']>;
  totalFeeUSD_gt?: InputMaybe<Scalars['BigDecimal']['input']>;
  totalFeeUSD_gte?: InputMaybe<Scalars['BigDecimal']['input']>;
  totalFeeUSD_in?: InputMaybe<Array<Scalars['BigDecimal']['input']>>;
  totalFeeUSD_lt?: InputMaybe<Scalars['BigDecimal']['input']>;
  totalFeeUSD_lte?: InputMaybe<Scalars['BigDecimal']['input']>;
  totalFeeUSD_not?: InputMaybe<Scalars['BigDecimal']['input']>;
  totalFeeUSD_not_in?: InputMaybe<Array<Scalars['BigDecimal']['input']>>;
  totalFee_gt?: InputMaybe<Scalars['BigDecimal']['input']>;
  totalFee_gte?: InputMaybe<Scalars['BigDecimal']['input']>;
  totalFee_in?: InputMaybe<Array<Scalars['BigDecimal']['input']>>;
  totalFee_lt?: InputMaybe<Scalars['BigDecimal']['input']>;
  totalFee_lte?: InputMaybe<Scalars['BigDecimal']['input']>;
  totalFee_not?: InputMaybe<Scalars['BigDecimal']['input']>;
  totalFee_not_in?: InputMaybe<Array<Scalars['BigDecimal']['input']>>;
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
  withdrawnInQuoteToken?: InputMaybe<Scalars['BigDecimal']['input']>;
  withdrawnInQuoteToken_gt?: InputMaybe<Scalars['BigDecimal']['input']>;
  withdrawnInQuoteToken_gte?: InputMaybe<Scalars['BigDecimal']['input']>;
  withdrawnInQuoteToken_in?: InputMaybe<Array<Scalars['BigDecimal']['input']>>;
  withdrawnInQuoteToken_lt?: InputMaybe<Scalars['BigDecimal']['input']>;
  withdrawnInQuoteToken_lte?: InputMaybe<Scalars['BigDecimal']['input']>;
  withdrawnInQuoteToken_not?: InputMaybe<Scalars['BigDecimal']['input']>;
  withdrawnInQuoteToken_not_in?: InputMaybe<Array<Scalars['BigDecimal']['input']>>;
  withdrawnUSD?: InputMaybe<Scalars['BigDecimal']['input']>;
  withdrawnUSD_gt?: InputMaybe<Scalars['BigDecimal']['input']>;
  withdrawnUSD_gte?: InputMaybe<Scalars['BigDecimal']['input']>;
  withdrawnUSD_in?: InputMaybe<Array<Scalars['BigDecimal']['input']>>;
  withdrawnUSD_lt?: InputMaybe<Scalars['BigDecimal']['input']>;
  withdrawnUSD_lte?: InputMaybe<Scalars['BigDecimal']['input']>;
  withdrawnUSD_not?: InputMaybe<Scalars['BigDecimal']['input']>;
  withdrawnUSD_not_in?: InputMaybe<Array<Scalars['BigDecimal']['input']>>;
};

export enum OasisEvent_OrderBy {
  Account = 'account',
  AccountAddress = 'account__address',
  AccountCollateralToken = 'account__collateralToken',
  AccountDebtToken = 'account__debtToken',
  AccountId = 'account__id',
  AccountIsDpm = 'account__isDPM',
  AccountPositionType = 'account__positionType',
  AccountProtocol = 'account__protocol',
  AccountVaultId = 'account__vaultId',
  AddOrRemoveIndex = 'addOrRemoveIndex',
  BlockNumber = 'blockNumber',
  BorrowPosition = 'borrowPosition',
  BorrowPositionBorrowCumulativeCollateralDeposit = 'borrowPosition__borrowCumulativeCollateralDeposit',
  BorrowPositionBorrowCumulativeCollateralWithdraw = 'borrowPosition__borrowCumulativeCollateralWithdraw',
  BorrowPositionBorrowCumulativeDebtDeposit = 'borrowPosition__borrowCumulativeDebtDeposit',
  BorrowPositionBorrowCumulativeDebtWithdraw = 'borrowPosition__borrowCumulativeDebtWithdraw',
  BorrowPositionBorrowCumulativeDepositInCollateralToken = 'borrowPosition__borrowCumulativeDepositInCollateralToken',
  BorrowPositionBorrowCumulativeDepositInQuoteToken = 'borrowPosition__borrowCumulativeDepositInQuoteToken',
  BorrowPositionBorrowCumulativeDepositUsd = 'borrowPosition__borrowCumulativeDepositUSD',
  BorrowPositionBorrowCumulativeFeesInCollateralToken = 'borrowPosition__borrowCumulativeFeesInCollateralToken',
  BorrowPositionBorrowCumulativeFeesInQuoteToken = 'borrowPosition__borrowCumulativeFeesInQuoteToken',
  BorrowPositionBorrowCumulativeFeesUsd = 'borrowPosition__borrowCumulativeFeesUSD',
  BorrowPositionBorrowCumulativeWithdrawInCollateralToken = 'borrowPosition__borrowCumulativeWithdrawInCollateralToken',
  BorrowPositionBorrowCumulativeWithdrawInQuoteToken = 'borrowPosition__borrowCumulativeWithdrawInQuoteToken',
  BorrowPositionBorrowCumulativeWithdrawUsd = 'borrowPosition__borrowCumulativeWithdrawUSD',
  BorrowPositionBorrowDailyTokenBlocks = 'borrowPosition__borrowDailyTokenBlocks',
  BorrowPositionBorrowLastUpdateBlock = 'borrowPosition__borrowLastUpdateBlock',
  BorrowPositionCollateral = 'borrowPosition__collateral',
  BorrowPositionDebt = 'borrowPosition__debt',
  BorrowPositionId = 'borrowPosition__id',
  BorrowPositionLiquidationPrice = 'borrowPosition__liquidationPrice',
  BorrowPositionT0Debt = 'borrowPosition__t0Debt',
  BorrowPositionT0Np = 'borrowPosition__t0Np_',
  CollateralAddress = 'collateralAddress',
  CollateralAfter = 'collateralAfter',
  CollateralBefore = 'collateralBefore',
  CollateralDelta = 'collateralDelta',
  CollateralLpsRemoved = 'collateralLpsRemoved',
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
  DepositedInQuoteToken = 'depositedInQuoteToken',
  DepositedUsd = 'depositedUSD',
  EarnPosition = 'earnPosition',
  EarnPositionEarnCumulativeDepositInCollateralToken = 'earnPosition__earnCumulativeDepositInCollateralToken',
  EarnPositionEarnCumulativeDepositInQuoteToken = 'earnPosition__earnCumulativeDepositInQuoteToken',
  EarnPositionEarnCumulativeDepositUsd = 'earnPosition__earnCumulativeDepositUSD',
  EarnPositionEarnCumulativeFeesInCollateralToken = 'earnPosition__earnCumulativeFeesInCollateralToken',
  EarnPositionEarnCumulativeFeesInQuoteToken = 'earnPosition__earnCumulativeFeesInQuoteToken',
  EarnPositionEarnCumulativeFeesUsd = 'earnPosition__earnCumulativeFeesUSD',
  EarnPositionEarnCumulativeQuoteTokenDeposit = 'earnPosition__earnCumulativeQuoteTokenDeposit',
  EarnPositionEarnCumulativeQuoteTokenWithdraw = 'earnPosition__earnCumulativeQuoteTokenWithdraw',
  EarnPositionEarnCumulativeWithdrawInCollateralToken = 'earnPosition__earnCumulativeWithdrawInCollateralToken',
  EarnPositionEarnCumulativeWithdrawInQuoteToken = 'earnPosition__earnCumulativeWithdrawInQuoteToken',
  EarnPositionEarnCumulativeWithdrawUsd = 'earnPosition__earnCumulativeWithdrawUSD',
  EarnPositionEarnDailyTokenBlocks = 'earnPosition__earnDailyTokenBlocks',
  EarnPositionEarnIsEarning = 'earnPosition__earnIsEarning',
  EarnPositionEarnLastUpdateBlock = 'earnPosition__earnLastUpdateBlock',
  EarnPositionId = 'earnPosition__id',
  EthPrice = 'ethPrice',
  GasFeeInCollateralToken = 'gasFeeInCollateralToken',
  GasFeeInQuoteToken = 'gasFeeInQuoteToken',
  GasFeeUsd = 'gasFeeUSD',
  GasPrice = 'gasPrice',
  GasUsed = 'gasUsed',
  Id = 'id',
  InterestRate = 'interestRate',
  IsOpen = 'isOpen',
  Kind = 'kind',
  LiquidationPriceAfter = 'liquidationPriceAfter',
  LiquidationPriceBefore = 'liquidationPriceBefore',
  LtvAfter = 'ltvAfter',
  LtvBefore = 'ltvBefore',
  MarketPrice = 'marketPrice',
  MoveQuoteFromIndex = 'moveQuoteFromIndex',
  MoveQuoteToIndex = 'moveQuoteToIndex',
  MultipleAfter = 'multipleAfter',
  MultipleBefore = 'multipleBefore',
  NetValueAfter = 'netValueAfter',
  NetValueBefore = 'netValueBefore',
  OasisFee = 'oasisFee',
  OasisFeeInCollateralToken = 'oasisFeeInCollateralToken',
  OasisFeeInQuoteToken = 'oasisFeeInQuoteToken',
  OasisFeeToken = 'oasisFeeToken',
  OasisFeeUsd = 'oasisFeeUSD',
  OriginationFee = 'originationFee',
  OriginationFeeInCollateralToken = 'originationFeeInCollateralToken',
  OriginationFeeInQuoteToken = 'originationFeeInQuoteToken',
  OriginationFeeUsd = 'originationFeeUSD',
  Pool = 'pool',
  PoolAccuredDebt = 'pool__accuredDebt',
  PoolAddress = 'pool__address',
  PoolApr7dAverage = 'pool__apr7dAverage',
  PoolApr30dAverage = 'pool__apr30dAverage',
  PoolAuctionPrice = 'pool__auctionPrice',
  PoolBorrowApr = 'pool__borrowApr',
  PoolBorrowDailyTokenBlocks = 'pool__borrowDailyTokenBlocks',
  PoolClaimableReserves = 'pool__claimableReserves',
  PoolClaimableReservesRemaining = 'pool__claimableReservesRemaining',
  PoolCollateralAddress = 'pool__collateralAddress',
  PoolCollateralScale = 'pool__collateralScale',
  PoolCurrentBurnEpoch = 'pool__currentBurnEpoch',
  PoolDailyPercentageRate30dAverage = 'pool__dailyPercentageRate30dAverage',
  PoolDebt = 'pool__debt',
  PoolDebtInAuctions = 'pool__debtInAuctions',
  PoolDepositSize = 'pool__depositSize',
  PoolEarnDailyTokenBlocks = 'pool__earnDailyTokenBlocks',
  PoolHpb = 'pool__hpb',
  PoolHpbIndex = 'pool__hpbIndex',
  PoolHtp = 'pool__htp',
  PoolHtpIndex = 'pool__htpIndex',
  PoolId = 'pool__id',
  PoolInterestRate = 'pool__interestRate',
  PoolLastInterestRateUpdate = 'pool__lastInterestRateUpdate',
  PoolLendApr = 'pool__lendApr',
  PoolLendApr7dAverage = 'pool__lendApr7dAverage',
  PoolLendApr30dAverage = 'pool__lendApr30dAverage',
  PoolLendDailyPercentageRate30dAverage = 'pool__lendDailyPercentageRate30dAverage',
  PoolLendMonthlyPercentageRate30dAverage = 'pool__lendMonthlyPercentageRate30dAverage',
  PoolLoansCount = 'pool__loansCount',
  PoolLup = 'pool__lup',
  PoolLupIndex = 'pool__lupIndex',
  PoolMonthlyPercentageRate30dAverage = 'pool__monthlyPercentageRate30dAverage',
  PoolName = 'pool__name',
  PoolPoolActualUtilization = 'pool__poolActualUtilization',
  PoolPoolCollateralization = 'pool__poolCollateralization',
  PoolPoolMinDebtAmount = 'pool__poolMinDebtAmount',
  PoolPoolTargetUtilization = 'pool__poolTargetUtilization',
  PoolQuoteTokenAddress = 'pool__quoteTokenAddress',
  PoolQuoteTokenScale = 'pool__quoteTokenScale',
  PoolReserves = 'pool__reserves',
  PoolSummerDepositAmountEarningInterest = 'pool__summerDepositAmountEarningInterest',
  PoolT0debt = 'pool__t0debt',
  PoolTimeRemaining = 'pool__timeRemaining',
  PoolTotalAuctionsInPool = 'pool__totalAuctionsInPool',
  QuoteTokensAfter = 'quoteTokensAfter',
  QuoteTokensBefore = 'quoteTokensBefore',
  QuoteTokensDelta = 'quoteTokensDelta',
  QuoteTokensMoved = 'quoteTokensMoved',
  SwapFromAmount = 'swapFromAmount',
  SwapFromToken = 'swapFromToken',
  SwapToAmount = 'swapToAmount',
  SwapToToken = 'swapToToken',
  Timestamp = 'timestamp',
  TotalFee = 'totalFee',
  TotalFeeInCollateralToken = 'totalFeeInCollateralToken',
  TotalFeeInQuoteToken = 'totalFeeInQuoteToken',
  TotalFeeUsd = 'totalFeeUSD',
  TxHash = 'txHash',
  WithdrawTransfers = 'withdrawTransfers',
  WithdrawnInQuoteToken = 'withdrawnInQuoteToken',
  WithdrawnUsd = 'withdrawnUSD'
}

/** Defines the order direction, either ascending or descending */
export enum OrderDirection {
  Asc = 'asc',
  Desc = 'desc'
}

export type Permission = {
  __typename?: 'Permission';
  account: Account;
  id: Scalars['ID']['output'];
  user: User;
};

export type Permission_Filter = {
  /** Filter for the block changed event. */
  _change_block?: InputMaybe<BlockChangedFilter>;
  account?: InputMaybe<Scalars['String']['input']>;
  account_?: InputMaybe<Account_Filter>;
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
  and?: InputMaybe<Array<InputMaybe<Permission_Filter>>>;
  id?: InputMaybe<Scalars['ID']['input']>;
  id_gt?: InputMaybe<Scalars['ID']['input']>;
  id_gte?: InputMaybe<Scalars['ID']['input']>;
  id_in?: InputMaybe<Array<Scalars['ID']['input']>>;
  id_lt?: InputMaybe<Scalars['ID']['input']>;
  id_lte?: InputMaybe<Scalars['ID']['input']>;
  id_not?: InputMaybe<Scalars['ID']['input']>;
  id_not_in?: InputMaybe<Array<Scalars['ID']['input']>>;
  or?: InputMaybe<Array<InputMaybe<Permission_Filter>>>;
  user?: InputMaybe<Scalars['String']['input']>;
  user_?: InputMaybe<User_Filter>;
  user_contains?: InputMaybe<Scalars['String']['input']>;
  user_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  user_ends_with?: InputMaybe<Scalars['String']['input']>;
  user_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  user_gt?: InputMaybe<Scalars['String']['input']>;
  user_gte?: InputMaybe<Scalars['String']['input']>;
  user_in?: InputMaybe<Array<Scalars['String']['input']>>;
  user_lt?: InputMaybe<Scalars['String']['input']>;
  user_lte?: InputMaybe<Scalars['String']['input']>;
  user_not?: InputMaybe<Scalars['String']['input']>;
  user_not_contains?: InputMaybe<Scalars['String']['input']>;
  user_not_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  user_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  user_not_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  user_not_in?: InputMaybe<Array<Scalars['String']['input']>>;
  user_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  user_not_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  user_starts_with?: InputMaybe<Scalars['String']['input']>;
  user_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
};

export enum Permission_OrderBy {
  Account = 'account',
  AccountAddress = 'account__address',
  AccountCollateralToken = 'account__collateralToken',
  AccountDebtToken = 'account__debtToken',
  AccountId = 'account__id',
  AccountIsDpm = 'account__isDPM',
  AccountPositionType = 'account__positionType',
  AccountProtocol = 'account__protocol',
  AccountVaultId = 'account__vaultId',
  Id = 'id',
  User = 'user',
  UserAddress = 'user__address',
  UserId = 'user__id',
  UserVaultCount = 'user__vaultCount'
}

export type Pool = {
  __typename?: 'Pool';
  accuredDebt: Scalars['BigInt']['output'];
  address: Scalars['Bytes']['output'];
  apr7dAverage?: Maybe<Scalars['BigInt']['output']>;
  apr30dAverage: Scalars['BigInt']['output'];
  auctionPrice: Scalars['BigInt']['output'];
  borrowApr?: Maybe<Scalars['BigInt']['output']>;
  borrowDailyTokenBlocks: Scalars['BigInt']['output'];
  borrowPositions: Array<Scalars['String']['output']>;
  buckets?: Maybe<Array<Bucket>>;
  claimableReserves: Scalars['BigInt']['output'];
  claimableReservesRemaining: Scalars['BigInt']['output'];
  collateralAddress: Scalars['Bytes']['output'];
  collateralScale: Scalars['BigInt']['output'];
  collateralToken?: Maybe<Token>;
  currentBurnEpoch: Scalars['BigInt']['output'];
  dailyPercentageRate30dAverage: Scalars['BigInt']['output'];
  debt: Scalars['BigInt']['output'];
  debtInAuctions: Scalars['BigInt']['output'];
  depositSize: Scalars['BigInt']['output'];
  earnDailyTokenBlocks: Scalars['BigInt']['output'];
  earnPositions: Array<Scalars['String']['output']>;
  hpb: Scalars['BigInt']['output'];
  hpbIndex: Scalars['BigInt']['output'];
  htp: Scalars['BigInt']['output'];
  htpIndex: Scalars['BigInt']['output'];
  id: Scalars['ID']['output'];
  interestRate: Scalars['BigInt']['output'];
  interestRatesHistory30d: Array<Scalars['BigInt']['output']>;
  lastInterestRateUpdate: Scalars['BigInt']['output'];
  lendApr?: Maybe<Scalars['BigInt']['output']>;
  lendApr7dAverage?: Maybe<Scalars['BigInt']['output']>;
  lendApr30dAverage: Scalars['BigInt']['output'];
  lendAprHistory30d: Array<Scalars['BigInt']['output']>;
  lendDailyPercentageRate30dAverage: Scalars['BigInt']['output'];
  lendMonthlyPercentageRate30dAverage: Scalars['BigInt']['output'];
  loansCount: Scalars['BigInt']['output'];
  lup: Scalars['BigInt']['output'];
  lupIndex: Scalars['BigInt']['output'];
  monthlyPercentageRate30dAverage: Scalars['BigInt']['output'];
  name?: Maybe<Scalars['String']['output']>;
  poolActualUtilization: Scalars['BigInt']['output'];
  poolCollateralization: Scalars['BigInt']['output'];
  poolMinDebtAmount: Scalars['BigInt']['output'];
  poolTargetUtilization: Scalars['BigInt']['output'];
  quoteToken?: Maybe<Token>;
  quoteTokenAddress: Scalars['Bytes']['output'];
  quoteTokenScale: Scalars['BigInt']['output'];
  reserves: Scalars['BigInt']['output'];
  stakedNfts: Array<Nft>;
  summerDepositAmountEarningInterest?: Maybe<Scalars['BigInt']['output']>;
  t0debt: Scalars['BigInt']['output'];
  timeRemaining: Scalars['BigInt']['output'];
  totalAuctionsInPool: Scalars['BigInt']['output'];
};


export type PoolBucketsArgs = {
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Bucket_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  where?: InputMaybe<Bucket_Filter>;
};


export type PoolStakedNftsArgs = {
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Nft_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  where?: InputMaybe<Nft_Filter>;
};

export type Pool_Filter = {
  /** Filter for the block changed event. */
  _change_block?: InputMaybe<BlockChangedFilter>;
  accuredDebt?: InputMaybe<Scalars['BigInt']['input']>;
  accuredDebt_gt?: InputMaybe<Scalars['BigInt']['input']>;
  accuredDebt_gte?: InputMaybe<Scalars['BigInt']['input']>;
  accuredDebt_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  accuredDebt_lt?: InputMaybe<Scalars['BigInt']['input']>;
  accuredDebt_lte?: InputMaybe<Scalars['BigInt']['input']>;
  accuredDebt_not?: InputMaybe<Scalars['BigInt']['input']>;
  accuredDebt_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
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
  and?: InputMaybe<Array<InputMaybe<Pool_Filter>>>;
  apr7dAverage?: InputMaybe<Scalars['BigInt']['input']>;
  apr7dAverage_gt?: InputMaybe<Scalars['BigInt']['input']>;
  apr7dAverage_gte?: InputMaybe<Scalars['BigInt']['input']>;
  apr7dAverage_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  apr7dAverage_lt?: InputMaybe<Scalars['BigInt']['input']>;
  apr7dAverage_lte?: InputMaybe<Scalars['BigInt']['input']>;
  apr7dAverage_not?: InputMaybe<Scalars['BigInt']['input']>;
  apr7dAverage_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  apr30dAverage?: InputMaybe<Scalars['BigInt']['input']>;
  apr30dAverage_gt?: InputMaybe<Scalars['BigInt']['input']>;
  apr30dAverage_gte?: InputMaybe<Scalars['BigInt']['input']>;
  apr30dAverage_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  apr30dAverage_lt?: InputMaybe<Scalars['BigInt']['input']>;
  apr30dAverage_lte?: InputMaybe<Scalars['BigInt']['input']>;
  apr30dAverage_not?: InputMaybe<Scalars['BigInt']['input']>;
  apr30dAverage_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  auctionPrice?: InputMaybe<Scalars['BigInt']['input']>;
  auctionPrice_gt?: InputMaybe<Scalars['BigInt']['input']>;
  auctionPrice_gte?: InputMaybe<Scalars['BigInt']['input']>;
  auctionPrice_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  auctionPrice_lt?: InputMaybe<Scalars['BigInt']['input']>;
  auctionPrice_lte?: InputMaybe<Scalars['BigInt']['input']>;
  auctionPrice_not?: InputMaybe<Scalars['BigInt']['input']>;
  auctionPrice_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  borrowApr?: InputMaybe<Scalars['BigInt']['input']>;
  borrowApr_gt?: InputMaybe<Scalars['BigInt']['input']>;
  borrowApr_gte?: InputMaybe<Scalars['BigInt']['input']>;
  borrowApr_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  borrowApr_lt?: InputMaybe<Scalars['BigInt']['input']>;
  borrowApr_lte?: InputMaybe<Scalars['BigInt']['input']>;
  borrowApr_not?: InputMaybe<Scalars['BigInt']['input']>;
  borrowApr_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  borrowDailyTokenBlocks?: InputMaybe<Scalars['BigInt']['input']>;
  borrowDailyTokenBlocks_gt?: InputMaybe<Scalars['BigInt']['input']>;
  borrowDailyTokenBlocks_gte?: InputMaybe<Scalars['BigInt']['input']>;
  borrowDailyTokenBlocks_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  borrowDailyTokenBlocks_lt?: InputMaybe<Scalars['BigInt']['input']>;
  borrowDailyTokenBlocks_lte?: InputMaybe<Scalars['BigInt']['input']>;
  borrowDailyTokenBlocks_not?: InputMaybe<Scalars['BigInt']['input']>;
  borrowDailyTokenBlocks_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  borrowPositions?: InputMaybe<Array<Scalars['String']['input']>>;
  borrowPositions_contains?: InputMaybe<Array<Scalars['String']['input']>>;
  borrowPositions_contains_nocase?: InputMaybe<Array<Scalars['String']['input']>>;
  borrowPositions_not?: InputMaybe<Array<Scalars['String']['input']>>;
  borrowPositions_not_contains?: InputMaybe<Array<Scalars['String']['input']>>;
  borrowPositions_not_contains_nocase?: InputMaybe<Array<Scalars['String']['input']>>;
  buckets_?: InputMaybe<Bucket_Filter>;
  claimableReserves?: InputMaybe<Scalars['BigInt']['input']>;
  claimableReservesRemaining?: InputMaybe<Scalars['BigInt']['input']>;
  claimableReservesRemaining_gt?: InputMaybe<Scalars['BigInt']['input']>;
  claimableReservesRemaining_gte?: InputMaybe<Scalars['BigInt']['input']>;
  claimableReservesRemaining_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  claimableReservesRemaining_lt?: InputMaybe<Scalars['BigInt']['input']>;
  claimableReservesRemaining_lte?: InputMaybe<Scalars['BigInt']['input']>;
  claimableReservesRemaining_not?: InputMaybe<Scalars['BigInt']['input']>;
  claimableReservesRemaining_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  claimableReserves_gt?: InputMaybe<Scalars['BigInt']['input']>;
  claimableReserves_gte?: InputMaybe<Scalars['BigInt']['input']>;
  claimableReserves_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  claimableReserves_lt?: InputMaybe<Scalars['BigInt']['input']>;
  claimableReserves_lte?: InputMaybe<Scalars['BigInt']['input']>;
  claimableReserves_not?: InputMaybe<Scalars['BigInt']['input']>;
  claimableReserves_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
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
  collateralScale?: InputMaybe<Scalars['BigInt']['input']>;
  collateralScale_gt?: InputMaybe<Scalars['BigInt']['input']>;
  collateralScale_gte?: InputMaybe<Scalars['BigInt']['input']>;
  collateralScale_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  collateralScale_lt?: InputMaybe<Scalars['BigInt']['input']>;
  collateralScale_lte?: InputMaybe<Scalars['BigInt']['input']>;
  collateralScale_not?: InputMaybe<Scalars['BigInt']['input']>;
  collateralScale_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  collateralToken?: InputMaybe<Scalars['String']['input']>;
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
  currentBurnEpoch?: InputMaybe<Scalars['BigInt']['input']>;
  currentBurnEpoch_gt?: InputMaybe<Scalars['BigInt']['input']>;
  currentBurnEpoch_gte?: InputMaybe<Scalars['BigInt']['input']>;
  currentBurnEpoch_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  currentBurnEpoch_lt?: InputMaybe<Scalars['BigInt']['input']>;
  currentBurnEpoch_lte?: InputMaybe<Scalars['BigInt']['input']>;
  currentBurnEpoch_not?: InputMaybe<Scalars['BigInt']['input']>;
  currentBurnEpoch_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  dailyPercentageRate30dAverage?: InputMaybe<Scalars['BigInt']['input']>;
  dailyPercentageRate30dAverage_gt?: InputMaybe<Scalars['BigInt']['input']>;
  dailyPercentageRate30dAverage_gte?: InputMaybe<Scalars['BigInt']['input']>;
  dailyPercentageRate30dAverage_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  dailyPercentageRate30dAverage_lt?: InputMaybe<Scalars['BigInt']['input']>;
  dailyPercentageRate30dAverage_lte?: InputMaybe<Scalars['BigInt']['input']>;
  dailyPercentageRate30dAverage_not?: InputMaybe<Scalars['BigInt']['input']>;
  dailyPercentageRate30dAverage_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  debt?: InputMaybe<Scalars['BigInt']['input']>;
  debtInAuctions?: InputMaybe<Scalars['BigInt']['input']>;
  debtInAuctions_gt?: InputMaybe<Scalars['BigInt']['input']>;
  debtInAuctions_gte?: InputMaybe<Scalars['BigInt']['input']>;
  debtInAuctions_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  debtInAuctions_lt?: InputMaybe<Scalars['BigInt']['input']>;
  debtInAuctions_lte?: InputMaybe<Scalars['BigInt']['input']>;
  debtInAuctions_not?: InputMaybe<Scalars['BigInt']['input']>;
  debtInAuctions_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  debt_gt?: InputMaybe<Scalars['BigInt']['input']>;
  debt_gte?: InputMaybe<Scalars['BigInt']['input']>;
  debt_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  debt_lt?: InputMaybe<Scalars['BigInt']['input']>;
  debt_lte?: InputMaybe<Scalars['BigInt']['input']>;
  debt_not?: InputMaybe<Scalars['BigInt']['input']>;
  debt_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  depositSize?: InputMaybe<Scalars['BigInt']['input']>;
  depositSize_gt?: InputMaybe<Scalars['BigInt']['input']>;
  depositSize_gte?: InputMaybe<Scalars['BigInt']['input']>;
  depositSize_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  depositSize_lt?: InputMaybe<Scalars['BigInt']['input']>;
  depositSize_lte?: InputMaybe<Scalars['BigInt']['input']>;
  depositSize_not?: InputMaybe<Scalars['BigInt']['input']>;
  depositSize_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  earnDailyTokenBlocks?: InputMaybe<Scalars['BigInt']['input']>;
  earnDailyTokenBlocks_gt?: InputMaybe<Scalars['BigInt']['input']>;
  earnDailyTokenBlocks_gte?: InputMaybe<Scalars['BigInt']['input']>;
  earnDailyTokenBlocks_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  earnDailyTokenBlocks_lt?: InputMaybe<Scalars['BigInt']['input']>;
  earnDailyTokenBlocks_lte?: InputMaybe<Scalars['BigInt']['input']>;
  earnDailyTokenBlocks_not?: InputMaybe<Scalars['BigInt']['input']>;
  earnDailyTokenBlocks_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  earnPositions?: InputMaybe<Array<Scalars['String']['input']>>;
  earnPositions_contains?: InputMaybe<Array<Scalars['String']['input']>>;
  earnPositions_contains_nocase?: InputMaybe<Array<Scalars['String']['input']>>;
  earnPositions_not?: InputMaybe<Array<Scalars['String']['input']>>;
  earnPositions_not_contains?: InputMaybe<Array<Scalars['String']['input']>>;
  earnPositions_not_contains_nocase?: InputMaybe<Array<Scalars['String']['input']>>;
  hpb?: InputMaybe<Scalars['BigInt']['input']>;
  hpbIndex?: InputMaybe<Scalars['BigInt']['input']>;
  hpbIndex_gt?: InputMaybe<Scalars['BigInt']['input']>;
  hpbIndex_gte?: InputMaybe<Scalars['BigInt']['input']>;
  hpbIndex_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  hpbIndex_lt?: InputMaybe<Scalars['BigInt']['input']>;
  hpbIndex_lte?: InputMaybe<Scalars['BigInt']['input']>;
  hpbIndex_not?: InputMaybe<Scalars['BigInt']['input']>;
  hpbIndex_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  hpb_gt?: InputMaybe<Scalars['BigInt']['input']>;
  hpb_gte?: InputMaybe<Scalars['BigInt']['input']>;
  hpb_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  hpb_lt?: InputMaybe<Scalars['BigInt']['input']>;
  hpb_lte?: InputMaybe<Scalars['BigInt']['input']>;
  hpb_not?: InputMaybe<Scalars['BigInt']['input']>;
  hpb_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  htp?: InputMaybe<Scalars['BigInt']['input']>;
  htpIndex?: InputMaybe<Scalars['BigInt']['input']>;
  htpIndex_gt?: InputMaybe<Scalars['BigInt']['input']>;
  htpIndex_gte?: InputMaybe<Scalars['BigInt']['input']>;
  htpIndex_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  htpIndex_lt?: InputMaybe<Scalars['BigInt']['input']>;
  htpIndex_lte?: InputMaybe<Scalars['BigInt']['input']>;
  htpIndex_not?: InputMaybe<Scalars['BigInt']['input']>;
  htpIndex_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  htp_gt?: InputMaybe<Scalars['BigInt']['input']>;
  htp_gte?: InputMaybe<Scalars['BigInt']['input']>;
  htp_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  htp_lt?: InputMaybe<Scalars['BigInt']['input']>;
  htp_lte?: InputMaybe<Scalars['BigInt']['input']>;
  htp_not?: InputMaybe<Scalars['BigInt']['input']>;
  htp_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  id?: InputMaybe<Scalars['ID']['input']>;
  id_gt?: InputMaybe<Scalars['ID']['input']>;
  id_gte?: InputMaybe<Scalars['ID']['input']>;
  id_in?: InputMaybe<Array<Scalars['ID']['input']>>;
  id_lt?: InputMaybe<Scalars['ID']['input']>;
  id_lte?: InputMaybe<Scalars['ID']['input']>;
  id_not?: InputMaybe<Scalars['ID']['input']>;
  id_not_in?: InputMaybe<Array<Scalars['ID']['input']>>;
  interestRate?: InputMaybe<Scalars['BigInt']['input']>;
  interestRate_gt?: InputMaybe<Scalars['BigInt']['input']>;
  interestRate_gte?: InputMaybe<Scalars['BigInt']['input']>;
  interestRate_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  interestRate_lt?: InputMaybe<Scalars['BigInt']['input']>;
  interestRate_lte?: InputMaybe<Scalars['BigInt']['input']>;
  interestRate_not?: InputMaybe<Scalars['BigInt']['input']>;
  interestRate_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  interestRatesHistory30d?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  interestRatesHistory30d_contains?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  interestRatesHistory30d_contains_nocase?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  interestRatesHistory30d_not?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  interestRatesHistory30d_not_contains?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  interestRatesHistory30d_not_contains_nocase?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  lastInterestRateUpdate?: InputMaybe<Scalars['BigInt']['input']>;
  lastInterestRateUpdate_gt?: InputMaybe<Scalars['BigInt']['input']>;
  lastInterestRateUpdate_gte?: InputMaybe<Scalars['BigInt']['input']>;
  lastInterestRateUpdate_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  lastInterestRateUpdate_lt?: InputMaybe<Scalars['BigInt']['input']>;
  lastInterestRateUpdate_lte?: InputMaybe<Scalars['BigInt']['input']>;
  lastInterestRateUpdate_not?: InputMaybe<Scalars['BigInt']['input']>;
  lastInterestRateUpdate_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  lendApr?: InputMaybe<Scalars['BigInt']['input']>;
  lendApr7dAverage?: InputMaybe<Scalars['BigInt']['input']>;
  lendApr7dAverage_gt?: InputMaybe<Scalars['BigInt']['input']>;
  lendApr7dAverage_gte?: InputMaybe<Scalars['BigInt']['input']>;
  lendApr7dAverage_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  lendApr7dAverage_lt?: InputMaybe<Scalars['BigInt']['input']>;
  lendApr7dAverage_lte?: InputMaybe<Scalars['BigInt']['input']>;
  lendApr7dAverage_not?: InputMaybe<Scalars['BigInt']['input']>;
  lendApr7dAverage_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  lendApr30dAverage?: InputMaybe<Scalars['BigInt']['input']>;
  lendApr30dAverage_gt?: InputMaybe<Scalars['BigInt']['input']>;
  lendApr30dAverage_gte?: InputMaybe<Scalars['BigInt']['input']>;
  lendApr30dAverage_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  lendApr30dAverage_lt?: InputMaybe<Scalars['BigInt']['input']>;
  lendApr30dAverage_lte?: InputMaybe<Scalars['BigInt']['input']>;
  lendApr30dAverage_not?: InputMaybe<Scalars['BigInt']['input']>;
  lendApr30dAverage_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  lendAprHistory30d?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  lendAprHistory30d_contains?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  lendAprHistory30d_contains_nocase?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  lendAprHistory30d_not?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  lendAprHistory30d_not_contains?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  lendAprHistory30d_not_contains_nocase?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  lendApr_gt?: InputMaybe<Scalars['BigInt']['input']>;
  lendApr_gte?: InputMaybe<Scalars['BigInt']['input']>;
  lendApr_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  lendApr_lt?: InputMaybe<Scalars['BigInt']['input']>;
  lendApr_lte?: InputMaybe<Scalars['BigInt']['input']>;
  lendApr_not?: InputMaybe<Scalars['BigInt']['input']>;
  lendApr_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  lendDailyPercentageRate30dAverage?: InputMaybe<Scalars['BigInt']['input']>;
  lendDailyPercentageRate30dAverage_gt?: InputMaybe<Scalars['BigInt']['input']>;
  lendDailyPercentageRate30dAverage_gte?: InputMaybe<Scalars['BigInt']['input']>;
  lendDailyPercentageRate30dAverage_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  lendDailyPercentageRate30dAverage_lt?: InputMaybe<Scalars['BigInt']['input']>;
  lendDailyPercentageRate30dAverage_lte?: InputMaybe<Scalars['BigInt']['input']>;
  lendDailyPercentageRate30dAverage_not?: InputMaybe<Scalars['BigInt']['input']>;
  lendDailyPercentageRate30dAverage_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  lendMonthlyPercentageRate30dAverage?: InputMaybe<Scalars['BigInt']['input']>;
  lendMonthlyPercentageRate30dAverage_gt?: InputMaybe<Scalars['BigInt']['input']>;
  lendMonthlyPercentageRate30dAverage_gte?: InputMaybe<Scalars['BigInt']['input']>;
  lendMonthlyPercentageRate30dAverage_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  lendMonthlyPercentageRate30dAverage_lt?: InputMaybe<Scalars['BigInt']['input']>;
  lendMonthlyPercentageRate30dAverage_lte?: InputMaybe<Scalars['BigInt']['input']>;
  lendMonthlyPercentageRate30dAverage_not?: InputMaybe<Scalars['BigInt']['input']>;
  lendMonthlyPercentageRate30dAverage_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  loansCount?: InputMaybe<Scalars['BigInt']['input']>;
  loansCount_gt?: InputMaybe<Scalars['BigInt']['input']>;
  loansCount_gte?: InputMaybe<Scalars['BigInt']['input']>;
  loansCount_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  loansCount_lt?: InputMaybe<Scalars['BigInt']['input']>;
  loansCount_lte?: InputMaybe<Scalars['BigInt']['input']>;
  loansCount_not?: InputMaybe<Scalars['BigInt']['input']>;
  loansCount_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  lup?: InputMaybe<Scalars['BigInt']['input']>;
  lupIndex?: InputMaybe<Scalars['BigInt']['input']>;
  lupIndex_gt?: InputMaybe<Scalars['BigInt']['input']>;
  lupIndex_gte?: InputMaybe<Scalars['BigInt']['input']>;
  lupIndex_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  lupIndex_lt?: InputMaybe<Scalars['BigInt']['input']>;
  lupIndex_lte?: InputMaybe<Scalars['BigInt']['input']>;
  lupIndex_not?: InputMaybe<Scalars['BigInt']['input']>;
  lupIndex_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  lup_gt?: InputMaybe<Scalars['BigInt']['input']>;
  lup_gte?: InputMaybe<Scalars['BigInt']['input']>;
  lup_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  lup_lt?: InputMaybe<Scalars['BigInt']['input']>;
  lup_lte?: InputMaybe<Scalars['BigInt']['input']>;
  lup_not?: InputMaybe<Scalars['BigInt']['input']>;
  lup_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  monthlyPercentageRate30dAverage?: InputMaybe<Scalars['BigInt']['input']>;
  monthlyPercentageRate30dAverage_gt?: InputMaybe<Scalars['BigInt']['input']>;
  monthlyPercentageRate30dAverage_gte?: InputMaybe<Scalars['BigInt']['input']>;
  monthlyPercentageRate30dAverage_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  monthlyPercentageRate30dAverage_lt?: InputMaybe<Scalars['BigInt']['input']>;
  monthlyPercentageRate30dAverage_lte?: InputMaybe<Scalars['BigInt']['input']>;
  monthlyPercentageRate30dAverage_not?: InputMaybe<Scalars['BigInt']['input']>;
  monthlyPercentageRate30dAverage_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
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
  or?: InputMaybe<Array<InputMaybe<Pool_Filter>>>;
  poolActualUtilization?: InputMaybe<Scalars['BigInt']['input']>;
  poolActualUtilization_gt?: InputMaybe<Scalars['BigInt']['input']>;
  poolActualUtilization_gte?: InputMaybe<Scalars['BigInt']['input']>;
  poolActualUtilization_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  poolActualUtilization_lt?: InputMaybe<Scalars['BigInt']['input']>;
  poolActualUtilization_lte?: InputMaybe<Scalars['BigInt']['input']>;
  poolActualUtilization_not?: InputMaybe<Scalars['BigInt']['input']>;
  poolActualUtilization_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  poolCollateralization?: InputMaybe<Scalars['BigInt']['input']>;
  poolCollateralization_gt?: InputMaybe<Scalars['BigInt']['input']>;
  poolCollateralization_gte?: InputMaybe<Scalars['BigInt']['input']>;
  poolCollateralization_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  poolCollateralization_lt?: InputMaybe<Scalars['BigInt']['input']>;
  poolCollateralization_lte?: InputMaybe<Scalars['BigInt']['input']>;
  poolCollateralization_not?: InputMaybe<Scalars['BigInt']['input']>;
  poolCollateralization_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  poolMinDebtAmount?: InputMaybe<Scalars['BigInt']['input']>;
  poolMinDebtAmount_gt?: InputMaybe<Scalars['BigInt']['input']>;
  poolMinDebtAmount_gte?: InputMaybe<Scalars['BigInt']['input']>;
  poolMinDebtAmount_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  poolMinDebtAmount_lt?: InputMaybe<Scalars['BigInt']['input']>;
  poolMinDebtAmount_lte?: InputMaybe<Scalars['BigInt']['input']>;
  poolMinDebtAmount_not?: InputMaybe<Scalars['BigInt']['input']>;
  poolMinDebtAmount_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  poolTargetUtilization?: InputMaybe<Scalars['BigInt']['input']>;
  poolTargetUtilization_gt?: InputMaybe<Scalars['BigInt']['input']>;
  poolTargetUtilization_gte?: InputMaybe<Scalars['BigInt']['input']>;
  poolTargetUtilization_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  poolTargetUtilization_lt?: InputMaybe<Scalars['BigInt']['input']>;
  poolTargetUtilization_lte?: InputMaybe<Scalars['BigInt']['input']>;
  poolTargetUtilization_not?: InputMaybe<Scalars['BigInt']['input']>;
  poolTargetUtilization_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  quoteToken?: InputMaybe<Scalars['String']['input']>;
  quoteTokenAddress?: InputMaybe<Scalars['Bytes']['input']>;
  quoteTokenAddress_contains?: InputMaybe<Scalars['Bytes']['input']>;
  quoteTokenAddress_gt?: InputMaybe<Scalars['Bytes']['input']>;
  quoteTokenAddress_gte?: InputMaybe<Scalars['Bytes']['input']>;
  quoteTokenAddress_in?: InputMaybe<Array<Scalars['Bytes']['input']>>;
  quoteTokenAddress_lt?: InputMaybe<Scalars['Bytes']['input']>;
  quoteTokenAddress_lte?: InputMaybe<Scalars['Bytes']['input']>;
  quoteTokenAddress_not?: InputMaybe<Scalars['Bytes']['input']>;
  quoteTokenAddress_not_contains?: InputMaybe<Scalars['Bytes']['input']>;
  quoteTokenAddress_not_in?: InputMaybe<Array<Scalars['Bytes']['input']>>;
  quoteTokenScale?: InputMaybe<Scalars['BigInt']['input']>;
  quoteTokenScale_gt?: InputMaybe<Scalars['BigInt']['input']>;
  quoteTokenScale_gte?: InputMaybe<Scalars['BigInt']['input']>;
  quoteTokenScale_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  quoteTokenScale_lt?: InputMaybe<Scalars['BigInt']['input']>;
  quoteTokenScale_lte?: InputMaybe<Scalars['BigInt']['input']>;
  quoteTokenScale_not?: InputMaybe<Scalars['BigInt']['input']>;
  quoteTokenScale_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  quoteToken_?: InputMaybe<Token_Filter>;
  quoteToken_contains?: InputMaybe<Scalars['String']['input']>;
  quoteToken_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  quoteToken_ends_with?: InputMaybe<Scalars['String']['input']>;
  quoteToken_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  quoteToken_gt?: InputMaybe<Scalars['String']['input']>;
  quoteToken_gte?: InputMaybe<Scalars['String']['input']>;
  quoteToken_in?: InputMaybe<Array<Scalars['String']['input']>>;
  quoteToken_lt?: InputMaybe<Scalars['String']['input']>;
  quoteToken_lte?: InputMaybe<Scalars['String']['input']>;
  quoteToken_not?: InputMaybe<Scalars['String']['input']>;
  quoteToken_not_contains?: InputMaybe<Scalars['String']['input']>;
  quoteToken_not_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  quoteToken_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  quoteToken_not_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  quoteToken_not_in?: InputMaybe<Array<Scalars['String']['input']>>;
  quoteToken_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  quoteToken_not_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  quoteToken_starts_with?: InputMaybe<Scalars['String']['input']>;
  quoteToken_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  reserves?: InputMaybe<Scalars['BigInt']['input']>;
  reserves_gt?: InputMaybe<Scalars['BigInt']['input']>;
  reserves_gte?: InputMaybe<Scalars['BigInt']['input']>;
  reserves_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  reserves_lt?: InputMaybe<Scalars['BigInt']['input']>;
  reserves_lte?: InputMaybe<Scalars['BigInt']['input']>;
  reserves_not?: InputMaybe<Scalars['BigInt']['input']>;
  reserves_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  stakedNfts?: InputMaybe<Array<Scalars['String']['input']>>;
  stakedNfts_?: InputMaybe<Nft_Filter>;
  stakedNfts_contains?: InputMaybe<Array<Scalars['String']['input']>>;
  stakedNfts_contains_nocase?: InputMaybe<Array<Scalars['String']['input']>>;
  stakedNfts_not?: InputMaybe<Array<Scalars['String']['input']>>;
  stakedNfts_not_contains?: InputMaybe<Array<Scalars['String']['input']>>;
  stakedNfts_not_contains_nocase?: InputMaybe<Array<Scalars['String']['input']>>;
  summerDepositAmountEarningInterest?: InputMaybe<Scalars['BigInt']['input']>;
  summerDepositAmountEarningInterest_gt?: InputMaybe<Scalars['BigInt']['input']>;
  summerDepositAmountEarningInterest_gte?: InputMaybe<Scalars['BigInt']['input']>;
  summerDepositAmountEarningInterest_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  summerDepositAmountEarningInterest_lt?: InputMaybe<Scalars['BigInt']['input']>;
  summerDepositAmountEarningInterest_lte?: InputMaybe<Scalars['BigInt']['input']>;
  summerDepositAmountEarningInterest_not?: InputMaybe<Scalars['BigInt']['input']>;
  summerDepositAmountEarningInterest_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  t0debt?: InputMaybe<Scalars['BigInt']['input']>;
  t0debt_gt?: InputMaybe<Scalars['BigInt']['input']>;
  t0debt_gte?: InputMaybe<Scalars['BigInt']['input']>;
  t0debt_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  t0debt_lt?: InputMaybe<Scalars['BigInt']['input']>;
  t0debt_lte?: InputMaybe<Scalars['BigInt']['input']>;
  t0debt_not?: InputMaybe<Scalars['BigInt']['input']>;
  t0debt_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  timeRemaining?: InputMaybe<Scalars['BigInt']['input']>;
  timeRemaining_gt?: InputMaybe<Scalars['BigInt']['input']>;
  timeRemaining_gte?: InputMaybe<Scalars['BigInt']['input']>;
  timeRemaining_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  timeRemaining_lt?: InputMaybe<Scalars['BigInt']['input']>;
  timeRemaining_lte?: InputMaybe<Scalars['BigInt']['input']>;
  timeRemaining_not?: InputMaybe<Scalars['BigInt']['input']>;
  timeRemaining_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  totalAuctionsInPool?: InputMaybe<Scalars['BigInt']['input']>;
  totalAuctionsInPool_gt?: InputMaybe<Scalars['BigInt']['input']>;
  totalAuctionsInPool_gte?: InputMaybe<Scalars['BigInt']['input']>;
  totalAuctionsInPool_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  totalAuctionsInPool_lt?: InputMaybe<Scalars['BigInt']['input']>;
  totalAuctionsInPool_lte?: InputMaybe<Scalars['BigInt']['input']>;
  totalAuctionsInPool_not?: InputMaybe<Scalars['BigInt']['input']>;
  totalAuctionsInPool_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
};

export enum Pool_OrderBy {
  AccuredDebt = 'accuredDebt',
  Address = 'address',
  Apr7dAverage = 'apr7dAverage',
  Apr30dAverage = 'apr30dAverage',
  AuctionPrice = 'auctionPrice',
  BorrowApr = 'borrowApr',
  BorrowDailyTokenBlocks = 'borrowDailyTokenBlocks',
  BorrowPositions = 'borrowPositions',
  Buckets = 'buckets',
  ClaimableReserves = 'claimableReserves',
  ClaimableReservesRemaining = 'claimableReservesRemaining',
  CollateralAddress = 'collateralAddress',
  CollateralScale = 'collateralScale',
  CollateralToken = 'collateralToken',
  CollateralTokenAddress = 'collateralToken__address',
  CollateralTokenDecimals = 'collateralToken__decimals',
  CollateralTokenId = 'collateralToken__id',
  CollateralTokenPrecision = 'collateralToken__precision',
  CollateralTokenSymbol = 'collateralToken__symbol',
  CurrentBurnEpoch = 'currentBurnEpoch',
  DailyPercentageRate30dAverage = 'dailyPercentageRate30dAverage',
  Debt = 'debt',
  DebtInAuctions = 'debtInAuctions',
  DepositSize = 'depositSize',
  EarnDailyTokenBlocks = 'earnDailyTokenBlocks',
  EarnPositions = 'earnPositions',
  Hpb = 'hpb',
  HpbIndex = 'hpbIndex',
  Htp = 'htp',
  HtpIndex = 'htpIndex',
  Id = 'id',
  InterestRate = 'interestRate',
  InterestRatesHistory30d = 'interestRatesHistory30d',
  LastInterestRateUpdate = 'lastInterestRateUpdate',
  LendApr = 'lendApr',
  LendApr7dAverage = 'lendApr7dAverage',
  LendApr30dAverage = 'lendApr30dAverage',
  LendAprHistory30d = 'lendAprHistory30d',
  LendDailyPercentageRate30dAverage = 'lendDailyPercentageRate30dAverage',
  LendMonthlyPercentageRate30dAverage = 'lendMonthlyPercentageRate30dAverage',
  LoansCount = 'loansCount',
  Lup = 'lup',
  LupIndex = 'lupIndex',
  MonthlyPercentageRate30dAverage = 'monthlyPercentageRate30dAverage',
  Name = 'name',
  PoolActualUtilization = 'poolActualUtilization',
  PoolCollateralization = 'poolCollateralization',
  PoolMinDebtAmount = 'poolMinDebtAmount',
  PoolTargetUtilization = 'poolTargetUtilization',
  QuoteToken = 'quoteToken',
  QuoteTokenAddress = 'quoteTokenAddress',
  QuoteTokenScale = 'quoteTokenScale',
  QuoteTokenAddress = 'quoteToken__address',
  QuoteTokenDecimals = 'quoteToken__decimals',
  QuoteTokenId = 'quoteToken__id',
  QuoteTokenPrecision = 'quoteToken__precision',
  QuoteTokenSymbol = 'quoteToken__symbol',
  Reserves = 'reserves',
  StakedNfts = 'stakedNfts',
  SummerDepositAmountEarningInterest = 'summerDepositAmountEarningInterest',
  T0debt = 't0debt',
  TimeRemaining = 'timeRemaining',
  TotalAuctionsInPool = 'totalAuctionsInPool'
}

export type Query = {
  __typename?: 'Query';
  /** Access to subgraph metadata */
  _meta?: Maybe<_Meta_>;
  account?: Maybe<Account>;
  accounts: Array<Account>;
  assetSwap?: Maybe<AssetSwap>;
  assetSwaps: Array<AssetSwap>;
  auction?: Maybe<Auction>;
  auctions: Array<Auction>;
  borrowDailyReward?: Maybe<BorrowDailyReward>;
  borrowDailyRewards: Array<BorrowDailyReward>;
  borrowPosition?: Maybe<BorrowPosition>;
  borrowPositions: Array<BorrowPosition>;
  borrowerEvent?: Maybe<BorrowerEvent>;
  borrowerEvents: Array<BorrowerEvent>;
  bucket?: Maybe<Bucket>;
  buckets: Array<Bucket>;
  claimed?: Maybe<Claimed>;
  claimeds: Array<Claimed>;
  createPositionEvent?: Maybe<CreatePositionEvent>;
  createPositionEvents: Array<CreatePositionEvent>;
  day?: Maybe<Day>;
  days: Array<Day>;
  earnDailyReward?: Maybe<EarnDailyReward>;
  earnDailyRewards: Array<EarnDailyReward>;
  earnPosition?: Maybe<EarnPosition>;
  earnPositionBucket?: Maybe<EarnPositionBucket>;
  earnPositionBuckets: Array<EarnPositionBucket>;
  earnPositions: Array<EarnPosition>;
  feePaid?: Maybe<FeePaid>;
  feePaids: Array<FeePaid>;
  interestRate?: Maybe<InterestRate>;
  interestRates: Array<InterestRate>;
  lenderEvent?: Maybe<LenderEvent>;
  lenderEvents: Array<LenderEvent>;
  listOfPool?: Maybe<ListOfPool>;
  listOfPools: Array<ListOfPool>;
  nft?: Maybe<Nft>;
  nfts: Array<Nft>;
  oasisEvent?: Maybe<OasisEvent>;
  oasisEvents: Array<OasisEvent>;
  permission?: Maybe<Permission>;
  permissions: Array<Permission>;
  pool?: Maybe<Pool>;
  pools: Array<Pool>;
  slippageSaved?: Maybe<SlippageSaved>;
  slippageSaveds: Array<SlippageSaved>;
  state?: Maybe<State>;
  states: Array<State>;
  token?: Maybe<Token>;
  tokens: Array<Token>;
  transfer?: Maybe<Transfer>;
  transfers: Array<Transfer>;
  user?: Maybe<User>;
  users: Array<User>;
  week?: Maybe<Week>;
  weeks: Array<Week>;
};


export type Query_MetaArgs = {
  block?: InputMaybe<Block_Height>;
};


export type QueryAccountArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars['ID']['input'];
  subgraphError?: _SubgraphErrorPolicy_;
};


export type QueryAccountsArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Account_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<Account_Filter>;
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


export type QueryAuctionArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars['ID']['input'];
  subgraphError?: _SubgraphErrorPolicy_;
};


export type QueryAuctionsArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Auction_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<Auction_Filter>;
};


export type QueryBorrowDailyRewardArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars['ID']['input'];
  subgraphError?: _SubgraphErrorPolicy_;
};


export type QueryBorrowDailyRewardsArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<BorrowDailyReward_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<BorrowDailyReward_Filter>;
};


export type QueryBorrowPositionArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars['ID']['input'];
  subgraphError?: _SubgraphErrorPolicy_;
};


export type QueryBorrowPositionsArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<BorrowPosition_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<BorrowPosition_Filter>;
};


export type QueryBorrowerEventArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars['ID']['input'];
  subgraphError?: _SubgraphErrorPolicy_;
};


export type QueryBorrowerEventsArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<BorrowerEvent_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<BorrowerEvent_Filter>;
};


export type QueryBucketArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars['ID']['input'];
  subgraphError?: _SubgraphErrorPolicy_;
};


export type QueryBucketsArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Bucket_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<Bucket_Filter>;
};


export type QueryClaimedArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars['ID']['input'];
  subgraphError?: _SubgraphErrorPolicy_;
};


export type QueryClaimedsArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Claimed_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<Claimed_Filter>;
};


export type QueryCreatePositionEventArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars['ID']['input'];
  subgraphError?: _SubgraphErrorPolicy_;
};


export type QueryCreatePositionEventsArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<CreatePositionEvent_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<CreatePositionEvent_Filter>;
};


export type QueryDayArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars['ID']['input'];
  subgraphError?: _SubgraphErrorPolicy_;
};


export type QueryDaysArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Day_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<Day_Filter>;
};


export type QueryEarnDailyRewardArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars['ID']['input'];
  subgraphError?: _SubgraphErrorPolicy_;
};


export type QueryEarnDailyRewardsArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<EarnDailyReward_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<EarnDailyReward_Filter>;
};


export type QueryEarnPositionArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars['ID']['input'];
  subgraphError?: _SubgraphErrorPolicy_;
};


export type QueryEarnPositionBucketArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars['ID']['input'];
  subgraphError?: _SubgraphErrorPolicy_;
};


export type QueryEarnPositionBucketsArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<EarnPositionBucket_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<EarnPositionBucket_Filter>;
};


export type QueryEarnPositionsArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<EarnPosition_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<EarnPosition_Filter>;
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


export type QueryInterestRatesArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<InterestRate_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<InterestRate_Filter>;
};


export type QueryLenderEventArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars['ID']['input'];
  subgraphError?: _SubgraphErrorPolicy_;
};


export type QueryLenderEventsArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<LenderEvent_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<LenderEvent_Filter>;
};


export type QueryListOfPoolArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars['ID']['input'];
  subgraphError?: _SubgraphErrorPolicy_;
};


export type QueryListOfPoolsArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<ListOfPool_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<ListOfPool_Filter>;
};


export type QueryNftArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars['ID']['input'];
  subgraphError?: _SubgraphErrorPolicy_;
};


export type QueryNftsArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Nft_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<Nft_Filter>;
};


export type QueryOasisEventArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars['ID']['input'];
  subgraphError?: _SubgraphErrorPolicy_;
};


export type QueryOasisEventsArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<OasisEvent_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<OasisEvent_Filter>;
};


export type QueryPermissionArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars['ID']['input'];
  subgraphError?: _SubgraphErrorPolicy_;
};


export type QueryPermissionsArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Permission_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<Permission_Filter>;
};


export type QueryPoolArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars['ID']['input'];
  subgraphError?: _SubgraphErrorPolicy_;
};


export type QueryPoolsArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Pool_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<Pool_Filter>;
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


export type QueryStateArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars['ID']['input'];
  subgraphError?: _SubgraphErrorPolicy_;
};


export type QueryStatesArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<State_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<State_Filter>;
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


export type QueryUserArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars['ID']['input'];
  subgraphError?: _SubgraphErrorPolicy_;
};


export type QueryUsersArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<User_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<User_Filter>;
};


export type QueryWeekArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars['ID']['input'];
  subgraphError?: _SubgraphErrorPolicy_;
};


export type QueryWeeksArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Week_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<Week_Filter>;
};

export type SlippageSaved = {
  __typename?: 'SlippageSaved';
  actualAmount: Scalars['BigInt']['output'];
  /**
   * id is a tx_hash-actionLogIndex
   * it uses action log index to easily combine all swap events into one
   *
   */
  id: Scalars['Bytes']['output'];
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

export type State = {
  __typename?: 'State';
  id: Scalars['Bytes']['output'];
  lastDay?: Maybe<Scalars['BigInt']['output']>;
  lastWeek?: Maybe<Scalars['BigInt']['output']>;
};

export type State_Filter = {
  /** Filter for the block changed event. */
  _change_block?: InputMaybe<BlockChangedFilter>;
  and?: InputMaybe<Array<InputMaybe<State_Filter>>>;
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
  lastDay?: InputMaybe<Scalars['BigInt']['input']>;
  lastDay_gt?: InputMaybe<Scalars['BigInt']['input']>;
  lastDay_gte?: InputMaybe<Scalars['BigInt']['input']>;
  lastDay_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  lastDay_lt?: InputMaybe<Scalars['BigInt']['input']>;
  lastDay_lte?: InputMaybe<Scalars['BigInt']['input']>;
  lastDay_not?: InputMaybe<Scalars['BigInt']['input']>;
  lastDay_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  lastWeek?: InputMaybe<Scalars['BigInt']['input']>;
  lastWeek_gt?: InputMaybe<Scalars['BigInt']['input']>;
  lastWeek_gte?: InputMaybe<Scalars['BigInt']['input']>;
  lastWeek_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  lastWeek_lt?: InputMaybe<Scalars['BigInt']['input']>;
  lastWeek_lte?: InputMaybe<Scalars['BigInt']['input']>;
  lastWeek_not?: InputMaybe<Scalars['BigInt']['input']>;
  lastWeek_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  or?: InputMaybe<Array<InputMaybe<State_Filter>>>;
};

export enum State_OrderBy {
  Id = 'id',
  LastDay = 'lastDay',
  LastWeek = 'lastWeek'
}

export type Subscription = {
  __typename?: 'Subscription';
  /** Access to subgraph metadata */
  _meta?: Maybe<_Meta_>;
  account?: Maybe<Account>;
  accounts: Array<Account>;
  assetSwap?: Maybe<AssetSwap>;
  assetSwaps: Array<AssetSwap>;
  auction?: Maybe<Auction>;
  auctions: Array<Auction>;
  borrowDailyReward?: Maybe<BorrowDailyReward>;
  borrowDailyRewards: Array<BorrowDailyReward>;
  borrowPosition?: Maybe<BorrowPosition>;
  borrowPositions: Array<BorrowPosition>;
  borrowerEvent?: Maybe<BorrowerEvent>;
  borrowerEvents: Array<BorrowerEvent>;
  bucket?: Maybe<Bucket>;
  buckets: Array<Bucket>;
  claimed?: Maybe<Claimed>;
  claimeds: Array<Claimed>;
  createPositionEvent?: Maybe<CreatePositionEvent>;
  createPositionEvents: Array<CreatePositionEvent>;
  day?: Maybe<Day>;
  days: Array<Day>;
  earnDailyReward?: Maybe<EarnDailyReward>;
  earnDailyRewards: Array<EarnDailyReward>;
  earnPosition?: Maybe<EarnPosition>;
  earnPositionBucket?: Maybe<EarnPositionBucket>;
  earnPositionBuckets: Array<EarnPositionBucket>;
  earnPositions: Array<EarnPosition>;
  feePaid?: Maybe<FeePaid>;
  feePaids: Array<FeePaid>;
  interestRate?: Maybe<InterestRate>;
  interestRates: Array<InterestRate>;
  lenderEvent?: Maybe<LenderEvent>;
  lenderEvents: Array<LenderEvent>;
  listOfPool?: Maybe<ListOfPool>;
  listOfPools: Array<ListOfPool>;
  nft?: Maybe<Nft>;
  nfts: Array<Nft>;
  oasisEvent?: Maybe<OasisEvent>;
  oasisEvents: Array<OasisEvent>;
  permission?: Maybe<Permission>;
  permissions: Array<Permission>;
  pool?: Maybe<Pool>;
  pools: Array<Pool>;
  slippageSaved?: Maybe<SlippageSaved>;
  slippageSaveds: Array<SlippageSaved>;
  state?: Maybe<State>;
  states: Array<State>;
  token?: Maybe<Token>;
  tokens: Array<Token>;
  transfer?: Maybe<Transfer>;
  transfers: Array<Transfer>;
  user?: Maybe<User>;
  users: Array<User>;
  week?: Maybe<Week>;
  weeks: Array<Week>;
};


export type Subscription_MetaArgs = {
  block?: InputMaybe<Block_Height>;
};


export type SubscriptionAccountArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars['ID']['input'];
  subgraphError?: _SubgraphErrorPolicy_;
};


export type SubscriptionAccountsArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Account_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<Account_Filter>;
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


export type SubscriptionAuctionArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars['ID']['input'];
  subgraphError?: _SubgraphErrorPolicy_;
};


export type SubscriptionAuctionsArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Auction_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<Auction_Filter>;
};


export type SubscriptionBorrowDailyRewardArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars['ID']['input'];
  subgraphError?: _SubgraphErrorPolicy_;
};


export type SubscriptionBorrowDailyRewardsArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<BorrowDailyReward_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<BorrowDailyReward_Filter>;
};


export type SubscriptionBorrowPositionArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars['ID']['input'];
  subgraphError?: _SubgraphErrorPolicy_;
};


export type SubscriptionBorrowPositionsArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<BorrowPosition_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<BorrowPosition_Filter>;
};


export type SubscriptionBorrowerEventArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars['ID']['input'];
  subgraphError?: _SubgraphErrorPolicy_;
};


export type SubscriptionBorrowerEventsArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<BorrowerEvent_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<BorrowerEvent_Filter>;
};


export type SubscriptionBucketArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars['ID']['input'];
  subgraphError?: _SubgraphErrorPolicy_;
};


export type SubscriptionBucketsArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Bucket_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<Bucket_Filter>;
};


export type SubscriptionClaimedArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars['ID']['input'];
  subgraphError?: _SubgraphErrorPolicy_;
};


export type SubscriptionClaimedsArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Claimed_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<Claimed_Filter>;
};


export type SubscriptionCreatePositionEventArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars['ID']['input'];
  subgraphError?: _SubgraphErrorPolicy_;
};


export type SubscriptionCreatePositionEventsArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<CreatePositionEvent_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<CreatePositionEvent_Filter>;
};


export type SubscriptionDayArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars['ID']['input'];
  subgraphError?: _SubgraphErrorPolicy_;
};


export type SubscriptionDaysArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Day_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<Day_Filter>;
};


export type SubscriptionEarnDailyRewardArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars['ID']['input'];
  subgraphError?: _SubgraphErrorPolicy_;
};


export type SubscriptionEarnDailyRewardsArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<EarnDailyReward_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<EarnDailyReward_Filter>;
};


export type SubscriptionEarnPositionArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars['ID']['input'];
  subgraphError?: _SubgraphErrorPolicy_;
};


export type SubscriptionEarnPositionBucketArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars['ID']['input'];
  subgraphError?: _SubgraphErrorPolicy_;
};


export type SubscriptionEarnPositionBucketsArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<EarnPositionBucket_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<EarnPositionBucket_Filter>;
};


export type SubscriptionEarnPositionsArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<EarnPosition_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<EarnPosition_Filter>;
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


export type SubscriptionInterestRatesArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<InterestRate_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<InterestRate_Filter>;
};


export type SubscriptionLenderEventArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars['ID']['input'];
  subgraphError?: _SubgraphErrorPolicy_;
};


export type SubscriptionLenderEventsArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<LenderEvent_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<LenderEvent_Filter>;
};


export type SubscriptionListOfPoolArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars['ID']['input'];
  subgraphError?: _SubgraphErrorPolicy_;
};


export type SubscriptionListOfPoolsArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<ListOfPool_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<ListOfPool_Filter>;
};


export type SubscriptionNftArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars['ID']['input'];
  subgraphError?: _SubgraphErrorPolicy_;
};


export type SubscriptionNftsArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Nft_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<Nft_Filter>;
};


export type SubscriptionOasisEventArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars['ID']['input'];
  subgraphError?: _SubgraphErrorPolicy_;
};


export type SubscriptionOasisEventsArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<OasisEvent_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<OasisEvent_Filter>;
};


export type SubscriptionPermissionArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars['ID']['input'];
  subgraphError?: _SubgraphErrorPolicy_;
};


export type SubscriptionPermissionsArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Permission_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<Permission_Filter>;
};


export type SubscriptionPoolArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars['ID']['input'];
  subgraphError?: _SubgraphErrorPolicy_;
};


export type SubscriptionPoolsArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Pool_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<Pool_Filter>;
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


export type SubscriptionStateArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars['ID']['input'];
  subgraphError?: _SubgraphErrorPolicy_;
};


export type SubscriptionStatesArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<State_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<State_Filter>;
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


export type SubscriptionUserArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars['ID']['input'];
  subgraphError?: _SubgraphErrorPolicy_;
};


export type SubscriptionUsersArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<User_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<User_Filter>;
};


export type SubscriptionWeekArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars['ID']['input'];
  subgraphError?: _SubgraphErrorPolicy_;
};


export type SubscriptionWeeksArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Week_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<Week_Filter>;
};

export type Token = {
  __typename?: 'Token';
  address: Scalars['Bytes']['output'];
  decimals: Scalars['BigInt']['output'];
  id: Scalars['Bytes']['output'];
  precision: Scalars['BigInt']['output'];
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
  or?: InputMaybe<Array<InputMaybe<Token_Filter>>>;
  precision?: InputMaybe<Scalars['BigInt']['input']>;
  precision_gt?: InputMaybe<Scalars['BigInt']['input']>;
  precision_gte?: InputMaybe<Scalars['BigInt']['input']>;
  precision_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  precision_lt?: InputMaybe<Scalars['BigInt']['input']>;
  precision_lte?: InputMaybe<Scalars['BigInt']['input']>;
  precision_not?: InputMaybe<Scalars['BigInt']['input']>;
  precision_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
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
  event: OasisEvent;
  from: Scalars['Bytes']['output'];
  id: Scalars['Bytes']['output'];
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
  event_?: InputMaybe<OasisEvent_Filter>;
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
  EventAddOrRemoveIndex = 'event__addOrRemoveIndex',
  EventBlockNumber = 'event__blockNumber',
  EventCollateralAddress = 'event__collateralAddress',
  EventCollateralAfter = 'event__collateralAfter',
  EventCollateralBefore = 'event__collateralBefore',
  EventCollateralDelta = 'event__collateralDelta',
  EventCollateralLpsRemoved = 'event__collateralLpsRemoved',
  EventCollateralOraclePrice = 'event__collateralOraclePrice',
  EventCollateralTokenPriceUsd = 'event__collateralTokenPriceUSD',
  EventDebtAddress = 'event__debtAddress',
  EventDebtAfter = 'event__debtAfter',
  EventDebtBefore = 'event__debtBefore',
  EventDebtDelta = 'event__debtDelta',
  EventDebtOraclePrice = 'event__debtOraclePrice',
  EventDebtTokenPriceUsd = 'event__debtTokenPriceUSD',
  EventDepositedInQuoteToken = 'event__depositedInQuoteToken',
  EventDepositedUsd = 'event__depositedUSD',
  EventEthPrice = 'event__ethPrice',
  EventGasFeeInCollateralToken = 'event__gasFeeInCollateralToken',
  EventGasFeeInQuoteToken = 'event__gasFeeInQuoteToken',
  EventGasFeeUsd = 'event__gasFeeUSD',
  EventGasPrice = 'event__gasPrice',
  EventGasUsed = 'event__gasUsed',
  EventId = 'event__id',
  EventInterestRate = 'event__interestRate',
  EventIsOpen = 'event__isOpen',
  EventKind = 'event__kind',
  EventLiquidationPriceAfter = 'event__liquidationPriceAfter',
  EventLiquidationPriceBefore = 'event__liquidationPriceBefore',
  EventLtvAfter = 'event__ltvAfter',
  EventLtvBefore = 'event__ltvBefore',
  EventMarketPrice = 'event__marketPrice',
  EventMoveQuoteFromIndex = 'event__moveQuoteFromIndex',
  EventMoveQuoteToIndex = 'event__moveQuoteToIndex',
  EventMultipleAfter = 'event__multipleAfter',
  EventMultipleBefore = 'event__multipleBefore',
  EventNetValueAfter = 'event__netValueAfter',
  EventNetValueBefore = 'event__netValueBefore',
  EventOasisFee = 'event__oasisFee',
  EventOasisFeeInCollateralToken = 'event__oasisFeeInCollateralToken',
  EventOasisFeeInQuoteToken = 'event__oasisFeeInQuoteToken',
  EventOasisFeeToken = 'event__oasisFeeToken',
  EventOasisFeeUsd = 'event__oasisFeeUSD',
  EventOriginationFee = 'event__originationFee',
  EventOriginationFeeInCollateralToken = 'event__originationFeeInCollateralToken',
  EventOriginationFeeInQuoteToken = 'event__originationFeeInQuoteToken',
  EventOriginationFeeUsd = 'event__originationFeeUSD',
  EventQuoteTokensAfter = 'event__quoteTokensAfter',
  EventQuoteTokensBefore = 'event__quoteTokensBefore',
  EventQuoteTokensDelta = 'event__quoteTokensDelta',
  EventQuoteTokensMoved = 'event__quoteTokensMoved',
  EventSwapFromAmount = 'event__swapFromAmount',
  EventSwapFromToken = 'event__swapFromToken',
  EventSwapToAmount = 'event__swapToAmount',
  EventSwapToToken = 'event__swapToToken',
  EventTimestamp = 'event__timestamp',
  EventTotalFee = 'event__totalFee',
  EventTotalFeeInCollateralToken = 'event__totalFeeInCollateralToken',
  EventTotalFeeInQuoteToken = 'event__totalFeeInQuoteToken',
  EventTotalFeeUsd = 'event__totalFeeUSD',
  EventTxHash = 'event__txHash',
  EventWithdrawnInQuoteToken = 'event__withdrawnInQuoteToken',
  EventWithdrawnUsd = 'event__withdrawnUSD',
  From = 'from',
  Id = 'id',
  PriceInUsd = 'priceInUSD',
  To = 'to',
  Token = 'token',
  TxHash = 'txHash'
}

export type User = {
  __typename?: 'User';
  address: Scalars['Bytes']['output'];
  borrowPositions?: Maybe<Array<BorrowPosition>>;
  earnPositions?: Maybe<Array<EarnPositionBucket>>;
  id: Scalars['Bytes']['output'];
  nfts?: Maybe<Array<Nft>>;
  oasisAjnaRewardClaims?: Maybe<Array<Claimed>>;
  permittedProxys?: Maybe<Array<Permission>>;
  proxys?: Maybe<Array<Account>>;
  vaultCount: Scalars['BigInt']['output'];
};


export type UserBorrowPositionsArgs = {
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<BorrowPosition_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  where?: InputMaybe<BorrowPosition_Filter>;
};


export type UserEarnPositionsArgs = {
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<EarnPositionBucket_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  where?: InputMaybe<EarnPositionBucket_Filter>;
};


export type UserNftsArgs = {
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Nft_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  where?: InputMaybe<Nft_Filter>;
};


export type UserOasisAjnaRewardClaimsArgs = {
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Claimed_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  where?: InputMaybe<Claimed_Filter>;
};


export type UserPermittedProxysArgs = {
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Permission_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  where?: InputMaybe<Permission_Filter>;
};


export type UserProxysArgs = {
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Account_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  where?: InputMaybe<Account_Filter>;
};

export type User_Filter = {
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
  and?: InputMaybe<Array<InputMaybe<User_Filter>>>;
  borrowPositions_?: InputMaybe<BorrowPosition_Filter>;
  earnPositions_?: InputMaybe<EarnPositionBucket_Filter>;
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
  nfts_?: InputMaybe<Nft_Filter>;
  oasisAjnaRewardClaims_?: InputMaybe<Claimed_Filter>;
  or?: InputMaybe<Array<InputMaybe<User_Filter>>>;
  permittedProxys_?: InputMaybe<Permission_Filter>;
  proxys_?: InputMaybe<Account_Filter>;
  vaultCount?: InputMaybe<Scalars['BigInt']['input']>;
  vaultCount_gt?: InputMaybe<Scalars['BigInt']['input']>;
  vaultCount_gte?: InputMaybe<Scalars['BigInt']['input']>;
  vaultCount_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  vaultCount_lt?: InputMaybe<Scalars['BigInt']['input']>;
  vaultCount_lte?: InputMaybe<Scalars['BigInt']['input']>;
  vaultCount_not?: InputMaybe<Scalars['BigInt']['input']>;
  vaultCount_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
};

export enum User_OrderBy {
  Address = 'address',
  BorrowPositions = 'borrowPositions',
  EarnPositions = 'earnPositions',
  Id = 'id',
  Nfts = 'nfts',
  OasisAjnaRewardClaims = 'oasisAjnaRewardClaims',
  PermittedProxys = 'permittedProxys',
  Proxys = 'proxys',
  VaultCount = 'vaultCount'
}

export type Week = {
  __typename?: 'Week';
  borrowWeeklyRewards?: Maybe<Array<BorrowDailyReward>>;
  days: Array<Day>;
  earnWeeklyRewards?: Maybe<Array<EarnDailyReward>>;
  id: Scalars['ID']['output'];
  week: Scalars['BigInt']['output'];
  weekEndTimestamp?: Maybe<Scalars['BigInt']['output']>;
  weekStartTimestamp: Scalars['BigInt']['output'];
};


export type WeekBorrowWeeklyRewardsArgs = {
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<BorrowDailyReward_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  where?: InputMaybe<BorrowDailyReward_Filter>;
};


export type WeekDaysArgs = {
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Day_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  where?: InputMaybe<Day_Filter>;
};


export type WeekEarnWeeklyRewardsArgs = {
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<EarnDailyReward_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  where?: InputMaybe<EarnDailyReward_Filter>;
};

export type Week_Filter = {
  /** Filter for the block changed event. */
  _change_block?: InputMaybe<BlockChangedFilter>;
  and?: InputMaybe<Array<InputMaybe<Week_Filter>>>;
  borrowWeeklyRewards_?: InputMaybe<BorrowDailyReward_Filter>;
  days_?: InputMaybe<Day_Filter>;
  earnWeeklyRewards_?: InputMaybe<EarnDailyReward_Filter>;
  id?: InputMaybe<Scalars['ID']['input']>;
  id_gt?: InputMaybe<Scalars['ID']['input']>;
  id_gte?: InputMaybe<Scalars['ID']['input']>;
  id_in?: InputMaybe<Array<Scalars['ID']['input']>>;
  id_lt?: InputMaybe<Scalars['ID']['input']>;
  id_lte?: InputMaybe<Scalars['ID']['input']>;
  id_not?: InputMaybe<Scalars['ID']['input']>;
  id_not_in?: InputMaybe<Array<Scalars['ID']['input']>>;
  or?: InputMaybe<Array<InputMaybe<Week_Filter>>>;
  week?: InputMaybe<Scalars['BigInt']['input']>;
  weekEndTimestamp?: InputMaybe<Scalars['BigInt']['input']>;
  weekEndTimestamp_gt?: InputMaybe<Scalars['BigInt']['input']>;
  weekEndTimestamp_gte?: InputMaybe<Scalars['BigInt']['input']>;
  weekEndTimestamp_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  weekEndTimestamp_lt?: InputMaybe<Scalars['BigInt']['input']>;
  weekEndTimestamp_lte?: InputMaybe<Scalars['BigInt']['input']>;
  weekEndTimestamp_not?: InputMaybe<Scalars['BigInt']['input']>;
  weekEndTimestamp_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  weekStartTimestamp?: InputMaybe<Scalars['BigInt']['input']>;
  weekStartTimestamp_gt?: InputMaybe<Scalars['BigInt']['input']>;
  weekStartTimestamp_gte?: InputMaybe<Scalars['BigInt']['input']>;
  weekStartTimestamp_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  weekStartTimestamp_lt?: InputMaybe<Scalars['BigInt']['input']>;
  weekStartTimestamp_lte?: InputMaybe<Scalars['BigInt']['input']>;
  weekStartTimestamp_not?: InputMaybe<Scalars['BigInt']['input']>;
  weekStartTimestamp_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  week_gt?: InputMaybe<Scalars['BigInt']['input']>;
  week_gte?: InputMaybe<Scalars['BigInt']['input']>;
  week_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  week_lt?: InputMaybe<Scalars['BigInt']['input']>;
  week_lte?: InputMaybe<Scalars['BigInt']['input']>;
  week_not?: InputMaybe<Scalars['BigInt']['input']>;
  week_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
};

export enum Week_OrderBy {
  BorrowWeeklyRewards = 'borrowWeeklyRewards',
  Days = 'days',
  EarnWeeklyRewards = 'earnWeeklyRewards',
  Id = 'id',
  Week = 'week',
  WeekEndTimestamp = 'weekEndTimestamp',
  WeekStartTimestamp = 'weekStartTimestamp'
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


export type GetPositionQuery = { __typename?: 'Query', earnPosition?: { __typename?: 'EarnPosition', oasisEvents?: Array<{ __typename?: 'OasisEvent', kind: string, blockNumber: bigint, timestamp: bigint, swapToToken?: string | null, swapToAmount?: string | null, swapFromToken?: string | null, swapFromAmount?: string | null, collateralBefore: string, collateralAfter: string, collateralDelta: string, debtBefore: string, debtAfter: string, debtDelta: string, collateralToken?: { __typename?: 'Token', address: string, symbol: string, decimals: bigint } | null, debtToken?: { __typename?: 'Token', address: string, symbol: string, decimals: bigint } | null }> | null } | null };


export const GetPositionDocument = gql`
    query GetPosition($id: ID!) {
  earnPosition(id: $id) {
    oasisEvents(first: 10000, orderBy: blockNumber, orderDirection: desc) {
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