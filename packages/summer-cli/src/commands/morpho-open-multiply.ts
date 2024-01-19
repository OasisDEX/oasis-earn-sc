import { ADDRESSES } from '@oasisdex/addresses';
import { RiskRatio, strategies } from '@oasisdex/dma-library';

import { BigNumber } from 'bignumber.js';
import { ethers } from 'ethers';
import * as yup from 'yup';

import type { Command } from '../cli/command';
import { sendTxThroughProxy } from '../logic/common/sendTxThroughProxy';
import { throwOnRevertedTx } from '../utils/tx';
import { getOneInchCall } from '../logic/common/swap';

const argsSchema = yup.object().shape({});

const morphoBlueMarket =
  '0x7dde86a1e94561d9690ec678db673c1a6396365f7d1d65e129c5fff0990ff758';
const morphoAddress = '0xBBBBBbbBBb9cC5e90e3b3Af64bdAF62C37EEFFCb';
const proxyAddress = '0x8451C582AB882fb534175B5465E91DfbDE97917e';

const operationExecutor = '0xcA71C36D26f515AD0cce1D806B231CBC1185CdfC';

export const morphoOpenMultiplyCommand: Command<typeof argsSchema> = {
  name: 'morpho-open-multiply' as const,
  description: ``,
  args: argsSchema,
  async run(_args, enviroment) {
    console.log('Opening position...');
    const strategy = await strategies.morphoblue.multiply.open(
      {
        collateralAmount: new BigNumber(1),
        collateralPriceUSD: new BigNumber(2488),
        quotePriceUSD: new BigNumber(1),
        marketId: morphoBlueMarket,
        dpmProxyAddress: proxyAddress,
        collateralTokenPrecision: 18,
        quoteTokenPrecision: 6,
        user: await enviroment.walletSigner.getAddress(),
        riskRatio: new RiskRatio(new BigNumber(1.2), RiskRatio.TYPE.MULITPLE),
        slippage: new BigNumber(0.1),
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

