import { ADDRESSES } from '@oasisdex/addresses';
import { RiskRatio, strategies } from '@oasisdex/dma-library';

import { BigNumber } from 'bignumber.js';
import { ethers } from 'ethers';
import * as yup from 'yup';

import type { Command } from '../cli/command';
import { sendTxThroughProxy } from '../logic/common/sendTxThroughProxy';
import { throwOnRevertedTx } from '../utils/tx';
import { getOneInchCall } from '../logic/common/swap';
import { getCumulatives } from '../logic/common/getCumulatives';

const argsSchema = yup.object().shape({
  amount: yup.number().required(),
  ltv: yup.number().required().min(0.1).max(0.9),
  collateralPriceUsd: yup.number().required(),
  quotePriceUsd: yup.number().required(),
});

const morphoBlueMarket =
  '0xb323495f7e4148be5643a4ea4a8221eef163e4bccfdedc2a6f4696baacbc86cc';
const morphoAddress = '0xBBBBBbbBBb9cC5e90e3b3Af64bdAF62C37EEFFCb';
const proxyAddress = '0x8451C582AB882fb534175B5465E91DfbDE97917e';

const operationExecutor = '0xcA71C36D26f515AD0cce1D806B231CBC1185CdfC';

export const morphoOpenMultiplyCommand: Command<typeof argsSchema> = {
  name: 'morpho-open-multiply' as const,
  description: ``,
  args: argsSchema,
  async run(args, enviroment) {

    const strategy = await strategies.morphoblue.multiply.open(
      {
        collateralAmount: new BigNumber(args.amount),
        collateralPriceUSD: new BigNumber(args.collateralPriceUsd),
        quotePriceUSD: new BigNumber(args.quotePriceUsd),
        marketId: morphoBlueMarket,
        dpmProxyAddress: proxyAddress,
        collateralTokenPrecision: 18,
        quoteTokenPrecision: 6,
        user: await enviroment.walletSigner.getAddress(),
        riskRatio: new RiskRatio(new BigNumber(args.ltv), RiskRatio.TYPE.LTV),
        slippage: new BigNumber(0.05),
      },
      {
        provider: enviroment.provider,
        network: enviroment.network,
        morphoAddress: morphoAddress,
        operationExecutor: operationExecutor ||
        ADDRESSES[enviroment.network].mpa.core.OperationExecutor,
        addresses: {
            WETH: ADDRESSES[enviroment.network].common.WETH,
            DAI: ADDRESSES[enviroment.network].common.DAI,
            ETH: ADDRESSES[enviroment.network].common.ETH,
            USDC: ADDRESSES[enviroment.network].common.USDC,
            USDT: ADDRESSES[enviroment.network].common.USDT,
            WBTC: ADDRESSES[enviroment.network].common.WBTC,
            WSTETH: ADDRESSES[enviroment.network].common.WSTETH,
        },
        getSwapData: getOneInchCall(ADDRESSES[enviroment.network].mpa.core.Swap, 1, 'v4.0', true),
        getCumulatives,
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

