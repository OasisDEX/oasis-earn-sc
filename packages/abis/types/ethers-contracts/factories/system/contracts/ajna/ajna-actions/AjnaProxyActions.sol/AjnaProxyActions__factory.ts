/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import { Contract, Interface, type ContractRunner } from "ethers";
import type {
  AjnaProxyActions,
  AjnaProxyActionsInterface,
} from "../../../../../../system/contracts/ajna/ajna-actions/AjnaProxyActions.sol/AjnaProxyActions";

const _abi = [
  {
    inputs: [
      {
        internalType: "contract IAjnaPoolUtilsInfo",
        name: "_poolInfoUtils",
        type: "address",
      },
      {
        internalType: "contract IERC20",
        name: "_ajnaToken",
        type: "address",
      },
      {
        internalType: "address",
        name: "_WETH",
        type: "address",
      },
      {
        internalType: "address",
        name: "_GUARD",
        type: "address",
      },
    ],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "proxyAddress",
        type: "address",
      },
      {
        indexed: false,
        internalType: "string",
        name: "protocol",
        type: "string",
      },
      {
        indexed: false,
        internalType: "string",
        name: "positionType",
        type: "string",
      },
      {
        indexed: false,
        internalType: "address",
        name: "collateralToken",
        type: "address",
      },
      {
        indexed: false,
        internalType: "address",
        name: "debtToken",
        type: "address",
      },
    ],
    name: "CreatePosition",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "bytes32",
        name: "name",
        type: "bytes32",
      },
    ],
    name: "ProxyActionsOperation",
    type: "event",
  },
  {
    inputs: [],
    name: "ARC",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "GUARD",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "WETH",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "ajnaToken",
    outputs: [
      {
        internalType: "contract IERC20",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "ajnaVersion",
    outputs: [
      {
        internalType: "string",
        name: "",
        type: "string",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "contract IERC20Pool",
        name: "pool",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
    ],
    name: "claimRewardsAndSendToOwner",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "price",
        type: "uint256",
      },
    ],
    name: "convertPriceToIndex",
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
    name: "deployer",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "contract IERC20Pool",
        name: "pool",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "debtAmount",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "collateralAmount",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "price",
        type: "uint256",
      },
      {
        internalType: "bool",
        name: "stamploanEnabled",
        type: "bool",
      },
    ],
    name: "depositAndDraw",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "contract IERC20Pool",
        name: "pool",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "collateralAmount",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "price",
        type: "uint256",
      },
      {
        internalType: "bool",
        name: "stamploanEnabled",
        type: "bool",
      },
    ],
    name: "depositCollateral",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "contract IERC20Pool",
        name: "pool",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "debtAmount",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "collateralAmount",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "price",
        type: "uint256",
      },
    ],
    name: "depositCollateralAndDrawDebt",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "contract IERC20Pool",
        name: "pool",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "debtAmount",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "price",
        type: "uint256",
      },
    ],
    name: "drawDebt",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "contract IERC20Pool",
        name: "pool",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "price",
        type: "uint256",
      },
    ],
    name: "getQuoteAmount",
    outputs: [
      {
        internalType: "uint256",
        name: "quoteAmount",
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
        name: "_positionManager",
        type: "address",
      },
      {
        internalType: "address",
        name: "_rewardsManager",
        type: "address",
      },
      {
        internalType: "address",
        name: "_ARC",
        type: "address",
      },
    ],
    name: "initialize",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "contract IERC20Pool",
        name: "pool",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "oldPrice",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "newPrice",
        type: "uint256",
      },
      {
        internalType: "bool",
        name: "revertIfBelowLup",
        type: "bool",
      },
    ],
    name: "moveQuote",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "contract IERC20Pool",
        name: "pool",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "oldPrice",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "newPrice",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
      {
        internalType: "bool",
        name: "revertIfBelowLup",
        type: "bool",
      },
    ],
    name: "moveQuoteNft",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "contract IERC20Pool",
        name: "pool",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "depositAmount",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "price",
        type: "uint256",
      },
      {
        internalType: "bool",
        name: "revertIfBelowLup",
        type: "bool",
      },
    ],
    name: "openEarnPosition",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "contract IERC20Pool",
        name: "pool",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "depositAmount",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "price",
        type: "uint256",
      },
      {
        internalType: "bool",
        name: "revertIfBelowLup",
        type: "bool",
      },
    ],
    name: "openEarnPositionNft",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "contract IERC20Pool",
        name: "pool",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "debtAmount",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "collateralAmount",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "price",
        type: "uint256",
      },
    ],
    name: "openPosition",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "contract IERC20Pool",
        name: "pool",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "price",
        type: "uint256",
      },
    ],
    name: "optInStaking",
    outputs: [
      {
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "contract IERC20Pool",
        name: "pool",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "price",
        type: "uint256",
      },
    ],
    name: "optOutStaking",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "poolInfoUtils",
    outputs: [
      {
        internalType: "contract IAjnaPoolUtilsInfo",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "positionManager",
    outputs: [
      {
        internalType: "contract IPositionManager",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "contract IERC20Pool",
        name: "pool",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "price",
        type: "uint256",
      },
    ],
    name: "removeCollateral",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "contract IERC20Pool",
        name: "pool",
        type: "address",
      },
    ],
    name: "repayAndClose",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "contract IERC20Pool",
        name: "pool",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
      {
        internalType: "bool",
        name: "stamploanEnabled",
        type: "bool",
      },
    ],
    name: "repayDebt",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "contract IERC20Pool",
        name: "pool",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "debtAmount",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "collateralAmount",
        type: "uint256",
      },
    ],
    name: "repayDebtAndWithdrawCollateral",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "contract IERC20Pool",
        name: "pool",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "debtAmount",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "collateralAmount",
        type: "uint256",
      },
      {
        internalType: "bool",
        name: "stamploanEnabled",
        type: "bool",
      },
    ],
    name: "repayWithdraw",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [],
    name: "rewardsManager",
    outputs: [
      {
        internalType: "contract IRewardsManager",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "self",
    outputs: [
      {
        internalType: "contract IAjnaProxyActions",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "contract IERC20Pool",
        name: "pool",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "amountToAdd",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "oldPrice",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "newPrice",
        type: "uint256",
      },
      {
        internalType: "bool",
        name: "revertIfBelowLup",
        type: "bool",
      },
    ],
    name: "supplyAndMoveQuote",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "contract IERC20Pool",
        name: "pool",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "amountToAdd",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "oldPrice",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "newPrice",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
      {
        internalType: "bool",
        name: "revertIfBelowLup",
        type: "bool",
      },
    ],
    name: "supplyAndMoveQuoteNft",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "contract IERC20Pool",
        name: "pool",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "price",
        type: "uint256",
      },
      {
        internalType: "bool",
        name: "revertIfBelowLup",
        type: "bool",
      },
    ],
    name: "supplyQuote",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "contract IERC20Pool",
        name: "pool",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "price",
        type: "uint256",
      },
      {
        internalType: "bool",
        name: "revertIfBelowLup",
        type: "bool",
      },
    ],
    name: "supplyQuoteMintNftAndStake",
    outputs: [
      {
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
    ],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "contract IERC20Pool",
        name: "pool",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "amountToAdd",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "price",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
      {
        internalType: "bool",
        name: "revertIfBelowLup",
        type: "bool",
      },
    ],
    name: "supplyQuoteNft",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "contract IERC20Pool",
        name: "pool",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "price",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
    ],
    name: "unstakeNftAndClaimCollateral",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "contract IERC20Pool",
        name: "pool",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "price",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
    ],
    name: "unstakeNftAndWithdrawQuote",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "contract IERC20Pool",
        name: "pool",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "amountToWithdraw",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "oldPrice",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "newPrice",
        type: "uint256",
      },
      {
        internalType: "bool",
        name: "revertIfBelowLup",
        type: "bool",
      },
    ],
    name: "withdrawAndMoveQuote",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "contract IERC20Pool",
        name: "pool",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "amountToWithdraw",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "oldPrice",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "newPrice",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
      {
        internalType: "bool",
        name: "revertIfBelowLup",
        type: "bool",
      },
    ],
    name: "withdrawAndMoveQuoteNft",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "contract IERC20Pool",
        name: "pool",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "withdrawCollateral",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "contract IERC20Pool",
        name: "pool",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "price",
        type: "uint256",
      },
    ],
    name: "withdrawQuote",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "contract IERC20Pool",
        name: "pool",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "amountToWithdraw",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "price",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
    ],
    name: "withdrawQuoteNft",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
] as const;

export class AjnaProxyActions__factory {
  static readonly abi = _abi;
  static createInterface(): AjnaProxyActionsInterface {
    return new Interface(_abi) as AjnaProxyActionsInterface;
  }
  static connect(
    address: string,
    runner?: ContractRunner | null
  ): AjnaProxyActions {
    return new Contract(address, _abi, runner) as unknown as AjnaProxyActions;
  }
}