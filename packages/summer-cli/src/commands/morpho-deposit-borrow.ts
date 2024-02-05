import { ADDRESSES } from '@oasisdex/addresses';
import { strategies } from '@oasisdex/dma-library';
import { BigNumber } from 'bignumber.js';
import { ethers } from 'ethers';
import * as yup from 'yup';

import type { Command } from '../cli/command';
import { getCumulatives } from '../logic/common/getCumulatives';
import { sendTxThroughProxy } from '../logic/common/sendTxThroughProxy';
import { throwOnRevertedTx } from '../utils/tx';

const argsSchema = yup.object().shape({});

const morphoBlueMarket =
  '0xc54d7acf14de29e0e5527cabd7a576506870346a78a11a6762e2cca66322ec41';
const morphoAddress = '0xBBBBBbbBBb9cC5e90e3b3Af64bdAF62C37EEFFCb';
const proxyAddress = '0x8451C582AB882fb534175B5465E91DfbDE97917e';

const operationExecutor = '0xcA71C36D26f515AD0cce1D806B231CBC1185CdfC';

export const morphoDepositBorrowCommand: Command<typeof argsSchema> = {
  name: 'morpho-deposit-borrow' as const,
  description: ``,
  args: argsSchema,
  async run(_args, enviroment) {
    const strategy = await strategies.morphoblue.borrow.depositBorrow(
      {
        quoteAmount: new BigNumber(10),
        collateralAmount: new BigNumber(10),
        collateralPrice: new BigNumber(2656),
        quotePrice: new BigNumber(2323),
        morphoBlueMarket: morphoBlueMarket,
        proxyAddress: proxyAddress,
        collateralPrecision: 18,
        quotePrecision: 18,
        user: await enviroment.walletSigner.getAddress(),
      },
      {
        provider: enviroment.provider,
        network: enviroment.network,
        addresses: {
          morphoblue: morphoAddress,
          operationExecutor:
            operationExecutor ||
            ADDRESSES[enviroment.network].mpa.core.OperationExecutor,
          tokens: {
            WETH: ADDRESSES[enviroment.network].common.WETH,
            DAI: ADDRESSES[enviroment.network].common.DAI,
            ETH: ADDRESSES[enviroment.network].common.ETH,
            USDC: ADDRESSES[enviroment.network].common.USDC,
            USDT: ADDRESSES[enviroment.network].common.USDT,
            WBTC: ADDRESSES[enviroment.network].common.WBTC,
            WSTETH: ADDRESSES[enviroment.network].common.WSTETH,
          },
        },
        operationExecutor:
          operationExecutor ||
          ADDRESSES[enviroment.network].mpa.core.OperationExecutor,
        getCumulatives,
      },
    );

    if (strategy.simulation.errors.length > 0) {
      throw new Error(JSON.stringify(strategy.simulation.errors));
    }

    const reciept = await sendTxThroughProxy(
      { ...strategy.tx, value: ethers.BigNumber.from(strategy.tx.value) },
      proxyAddress,
      enviroment.provider,
    );

    throwOnRevertedTx(reciept);
  },
};
