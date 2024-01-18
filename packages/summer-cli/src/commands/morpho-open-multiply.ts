import { ADDRESSES, Network } from '@oasisdex/addresses';
import { RiskRatio, strategies } from '@oasisdex/dma-library';

import { BigNumber } from 'bignumber.js';
import { ethers } from 'ethers';
import * as yup from 'yup';

import type { Command } from '../cli/command';
import { sendTxThroughProxy } from '../logic/common/sendTxThroughProxy';
import { throwOnRevertedTx } from '../utils/tx';

const argsSchema = yup.object().shape({});

const morphoBlueMarket =
  '0xc20ac032046932de07497da27f9c2a3bd8ecaf3fdcab6b4f70b7088ac0404dc9';
const morphoAddress = '0x3ecc1901aa1e6ba58a9c2209b0a6d6ac3f88a6c9';
const proxyAddress = '0xd9b303d013e76ca732a1293eaf276cdb37b437af';

const operationExecutor = '0x07f62a821fc9d588129780fa9ce5787058729966';

export const morphoOpenCommand: Command<typeof argsSchema> = {
  name: 'morpho-open-multiply' as const,
  description: ``,
  args: argsSchema,
  async run(_args, enviroment) {
    const strategy = await strategies.morphoblue.multiply.open(
      {
        collateralAmount: new BigNumber(200),
        collateralPriceUSD: new BigNumber(2559),
        quotePriceUSD: new BigNumber(1),
        marketId: morphoBlueMarket,
        dpmProxyAddress: proxyAddress,
        collateralTokenPrecision: 18,
        quoteTokenPrecision: 6,
        user: await enviroment.walletSigner.getAddress(),
        riskRatio: new RiskRatio(new BigNumber(2), RiskRatio.TYPE.MULITPLE),
        slippage: new BigNumber(0.01),
      },
      {
        provider: enviroment.provider,
        network: enviroment.network,
        morphoAddress: morphoAddress,
        operationExecutor: operationExecutor ||
        ADDRESSES[enviroment.network].mpa.core.OperationExecutor,
        WETH: ADDRESSES[enviroment.network].common.WETH,
        addresses: {
            WETH: ADDRESSES[enviroment.network].common.WETH,
            DAI: ADDRESSES[enviroment.network].common.DAI,
            ETH: ADDRESSES[enviroment.network].common.ETH,
            USDC: ADDRESSES[enviroment.network].common.USDC,
            USDT: ADDRESSES[enviroment.network].common.USDT,
            WBTC: ADDRESSES[enviroment.network].common.WBTC,
            WSTETH: ADDRESSES[enviroment.network].common.WSTETH,
        },
        getSwapData: (): Promise<GetSwapData> => {},
        getCumulatives: () => {
          return Promise.resolve({
            borrowCumulativeDepositUSD: new BigNumber('0'),
            borrowCumulativeFeesUSD: new BigNumber('0'),
            borrowCumulativeWithdrawUSD: new BigNumber('0'),
          });
        },
      },
    );

    const reciept = await sendTxThroughProxy(
      { ...strategy.tx, value: ethers.BigNumber.from(strategy.tx.value) },
      proxyAddress,
      enviroment.provider,
    );

    throwOnRevertedTx(reciept);
  },
};

function formatOneInchSwapUrl(
  fromToken: string,
  toToken: string,
  amount: string,
  slippage: string,
  recepient: string,
  chainId: number,
  oneInchVersion: 'v4.0' | 'v5.0',
  protocols: string[] = [],
) {
  const protocolsParam = !protocols?.length ? '' : `&protocols=${protocols.join(',')}`
  return `${`https://api-oasis.1inch.io`}/${oneInchVersion}/${chainId}/swap?fromTokenAddress=${fromToken.toLowerCase()}&toTokenAddress=${toToken}&amount=${amount}&fromAddress=${recepient}&slippage=${slippage}${protocolsParam}&disableEstimate=true&allowPartialFill=false`
}

async function exchangeTokens(url: string): Promise<any> {
  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(`Error performing 1inch swap request ${url}: ${await response.text()}`)
  }

  return (await response.json()) as Promise<any>
}

async function swapOneInchTokens(
  fromTokenAddress: string,
  toTokenAddress: string,
  amount: string,
  recipient: string,
  slippage: string,
  chainId: number,
  oneInchVersion: 'v4.0' | 'v5.0',
  protocols: string[] = [],
): Promise<any> {
  const url = formatOneInchSwapUrl(
    fromTokenAddress,
    toTokenAddress,
    amount,
    slippage,
    recipient,
    chainId,
    oneInchVersion,
    protocols,
  )

  return exchangeTokens(url)
}

export function getOneInchCall(
  swapAddress: string,
  networkId: Network = NetworkIds.MAINNET,
  oneInchVersion: 'v4.0' | 'v5.0' = 'v4.0',
  debug?: true,
) {
  return async (
    from: string,
    to: string,
    amount: BigNumber,
    slippage: BigNumber,
    protocols: string[] = [],
  ) => {
    const resolvedProcotols = match({ protocols, networkId })
      .with(
        { protocols: [], networkId: NetworkIds.OPTIMISMMAINNET },
        () => OPTIMISM_DEFAULT_PROCOTOLS,
      )
      .with(
        { protocols: [], networkId: NetworkIds.MAINNET },
        () => ETHEREUM_MAINNET_DEFAULT_PROTOCOLS,
      )
      .with(
        { protocols: [], networkId: NetworkIds.ARBITRUMMAINNET },
        () => ARBITRUM_DEFAULT_LIQUIDITY_PROVIDERS,
      )
      .with(
        { protocols: [], networkId: NetworkIds.BASEMAINNET },
        () => BASE_DEFAULT_LIQUIDITY_PROVIDERS,
      )
      .otherwise(() => protocols)

    const response = await swapOneInchTokens(
      from,
      to,
      amount.toString(),
      swapAddress,
      slippage.times('100').toString(), // 1inch expects slippage in percentage format
      networkId,
      oneInchVersion,
      resolvedProcotols,
    )

    if (debug) {
      console.info('1inch')
      console.info('fromTokenAmount', response.fromTokenAmount.toString())
      console.info('toTokenAmount', response.toTokenAmount.toString())
      console.info('slippage', slippage.times('100').toString())
      console.info('minToTokenAmount', response.toTokenAmount.toString())
      console.info('exchangeCalldata', response.tx.data)
      console.info('protocols', protocols)
    }

    return {
      toTokenAddress: to,
      fromTokenAddress: from,
      minToTokenAmount: new BigNumber(response.toTokenAmount)
        .times(new BigNumber(1).minus(slippage))
        .integerValue(BigNumber.ROUND_DOWN),
      toTokenAmount: new BigNumber(response.toTokenAmount),
      fromTokenAmount: new BigNumber(response.fromTokenAmount),
      exchangeCalldata: response.tx.data,
    }
  }
}
