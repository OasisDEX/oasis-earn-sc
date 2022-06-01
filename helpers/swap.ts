import "@nomiclabs/hardhat-ethers";
import { ethers } from "hardhat";
import fetch from "node-fetch";
import ADDRESSES from "../helpers/addresses.json";
import UNISWAP_ROUTER_V3_ABI from "../contracts/abis/IUniswapRouter.json";
import { OneInchSwapResponse, RuntimeConfig } from "./types";

export async function swapUniswapTokens(
  tokenIn: string,
  tokenOut: string,
  amountIn: string,
  amountOutMinimum: string,
  recipient: string,
  { provider, signer }: RuntimeConfig
) {
  const value = tokenIn === ADDRESSES.main.WETH ? amountIn : 0;

  const UNISWAP_ROUTER_V3 = "0xe592427a0aece92de3edee1f18e0157c05861564";

  const uniswapV3 = new ethers.Contract(
    UNISWAP_ROUTER_V3,
    UNISWAP_ROUTER_V3_ABI,
    provider
  ).connect(signer);

  const swapParams = {
    tokenIn,
    tokenOut,
    fee: 3000,
    recipient,
    deadline: new Date().getTime(),
    amountIn,
    amountOutMinimum,
    sqrtPriceLimitX96: 0,
  };

  await uniswapV3.exactInputSingle(swapParams, { value, gasLimit: 3000000 });
}

function formatOneInchSwapUrl(
  fromToken: string,
  toToken: string,
  amount: string,
  slippage: string,
  recepient: string,
  protocols: string[] = []
) {
  const protocolsParam = !protocols?.length
    ? ""
    : `&protocols=${protocols.join(",")}`;
  return `https://oasis.api.enterprise.1inch.exchange/v4.0/1/swap?fromTokenAddress=${fromToken.toLowerCase()}&toTokenAddress=${toToken}&amount=${amount}&fromAddress=${recepient}&slippage=${slippage}${protocolsParam}&disableEstimate=true&allowPartialFill=false`;
}

async function exchangeTokens(url: string): Promise<OneInchSwapResponse> {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(
      `Error performing 1inch swap request ${url}: ${await response.text()}`
    );
  }

  return response.json() as Promise<OneInchSwapResponse>;
}

export async function swapOneInchTokens(
  fromTokenAddress: string,
  toTokenAddress: string,
  amount: string,
  recepient: string,
  slippage: string,
  protocols: string[] = []
): Promise<OneInchSwapResponse> {
  const url = formatOneInchSwapUrl(
    fromTokenAddress,
    toTokenAddress,
    amount,
    slippage,
    recepient,
    protocols
  );

  return exchangeTokens(url);
}
