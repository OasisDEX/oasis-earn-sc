/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import { Contract, Interface, type ContractRunner } from "ethers";
import type {
  IPoolState,
  IPoolStateInterface,
} from "../../../../../../../system/contracts/ajna/interfaces/pool/commons/IPoolState";

const _abi = [
  {
    inputs: [
      {
        internalType: "address",
        name: "lender_",
        type: "address",
      },
      {
        internalType: "address",
        name: "transferor_",
        type: "address",
      },
    ],
    name: "approvedTransferors",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "borrower_",
        type: "address",
      },
    ],
    name: "auctionInfo",
    outputs: [
      {
        internalType: "address",
        name: "kicker_",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "bondFactor_",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "bondSize_",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "kickTime_",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "kickMomp_",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "neutralPrice_",
        type: "uint256",
      },
      {
        internalType: "address",
        name: "head_",
        type: "address",
      },
      {
        internalType: "address",
        name: "next_",
        type: "address",
      },
      {
        internalType: "address",
        name: "prev_",
        type: "address",
      },
      {
        internalType: "bool",
        name: "alreadyTaken_",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "borrower_",
        type: "address",
      },
    ],
    name: "borrowerInfo",
    outputs: [
      {
        internalType: "uint256",
        name: "t0Debt_",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "collateral_",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "t0Np_",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "index_",
        type: "uint256",
      },
    ],
    name: "bucketInfo",
    outputs: [
      {
        internalType: "uint256",
        name: "lpAccumulator_",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "availableCollateral_",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "bankruptcyTime_",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "bucketDeposit_",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "bucketScale_",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "burnEventEpoch_",
        type: "uint256",
      },
    ],
    name: "burnInfo",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "currentBurnEpoch",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "debtInfo",
    outputs: [
      {
        internalType: "uint256",
        name: "debt_",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "accruedDebt_",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "debtInAuction_",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "t0Debt2ToCollateral_",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "emasInfo",
    outputs: [
      {
        internalType: "uint256",
        name: "debtColEma_",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "lupt0DebtEma_",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "debtEma_",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "depositEma_",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "inflatorInfo",
    outputs: [
      {
        internalType: "uint256",
        name: "inflator_",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "lastUpdate_",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "interestRateInfo",
    outputs: [
      {
        internalType: "uint256",
        name: "interestRate_",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "interestRateUpdate_",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "kicker_",
        type: "address",
      },
    ],
    name: "kickerInfo",
    outputs: [
      {
        internalType: "uint256",
        name: "claimable_",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "locked_",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "index_",
        type: "uint256",
      },
      {
        internalType: "address",
        name: "lender_",
        type: "address",
      },
    ],
    name: "lenderInfo",
    outputs: [
      {
        internalType: "uint256",
        name: "lpBalance_",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "depositTime_",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "loanId_",
        type: "uint256",
      },
    ],
    name: "loanInfo",
    outputs: [
      {
        internalType: "address",
        name: "borrower_",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "thresholdPrice_",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "loansInfo",
    outputs: [
      {
        internalType: "address",
        name: "maxBorrower_",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "maxThresholdPrice_",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "noOfLoans_",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "index_",
        type: "uint256",
      },
      {
        internalType: "address",
        name: "spender_",
        type: "address",
      },
      {
        internalType: "address",
        name: "owner_",
        type: "address",
      },
    ],
    name: "lpAllowance",
    outputs: [
      {
        internalType: "uint256",
        name: "allowance_",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "pledgedCollateral",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "reservesInfo",
    outputs: [
      {
        internalType: "uint256",
        name: "liquidationBondEscrowed_",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "reserveAuctionUnclaimed_",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "reserveAuctionKicked_",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "totalInterestEarned_",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "totalAuctionsInPool",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "totalT0Debt",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "totalT0DebtInAuction",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
] as const;

export class IPoolState__factory {
  static readonly abi = _abi;
  static createInterface(): IPoolStateInterface {
    return new Interface(_abi) as IPoolStateInterface;
  }
  static connect(address: string, runner?: ContractRunner | null): IPoolState {
    return new Contract(address, _abi, runner) as unknown as IPoolState;
  }
}