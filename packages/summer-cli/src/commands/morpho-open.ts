import * as yup from 'yup';

import type { Command } from '../cli/command';
import { strategies } from '@oasisdex/dma-library'
import { BigNumber } from 'bignumber.js';
import { ADDRESSES } from '@oasisdex/addresses';
import { sendTxThroughProxy } from '../logic/common/sendTxThroughProxy';
import { ethers } from 'ethers';
import { throwOnRevertedTx } from '../utils/tx';

const argsSchema = yup.object().shape({});

const morphoBlueMarket = "0xc20ac032046932de07497da27f9c2a3bd8ecaf3fdcab6b4f70b7088ac0404dc9"
const morphoAddress = '0x3ecc1901aa1e6ba58a9c2209b0a6d6ac3f88a6c9'
const proxyAddress = '0xd9b303d013e76ca732a1293eaf276cdb37b437af'

const operationExecutor = "0x07f62a821fc9d588129780fa9ce5787058729966"

export const morphoOpenCommand: Command<typeof argsSchema> = {
  name: 'morpho-open' as const,
  description: ``,
  args: argsSchema,
  async run(_args, enviroment) {
    const strategy = await strategies.morphoblue.borrow.openDepositBorrow(
      {
        quoteAmount: new BigNumber(50),
        collateralAmount: new BigNumber(200),
        collateralPrice: new BigNumber(2100),
        quotePrice: new BigNumber(200),
        morphoBlueMarket: morphoBlueMarket,
        proxyAddress: proxyAddress,
        collateralPrecision: 18,
        quotePrecision: 18,
        user: await enviroment.walletSigner.getAddress()
      }, {
        provider: enviroment.provider,
        network: enviroment.network,
        addresses: {
          morphoblue: morphoAddress,
          operationExecutor: operationExecutor || ADDRESSES[enviroment.network].mpa.core.OperationExecutor,
          tokens: {
            WETH: ADDRESSES[enviroment.network].common.WETH,
            DAI: ADDRESSES[enviroment.network].common.DAI,
            ETH: ADDRESSES[enviroment.network].common.ETH,
            USDC: ADDRESSES[enviroment.network].common.USDC,
            USDT: ADDRESSES[enviroment.network].common.USDT,
            WBTC: ADDRESSES[enviroment.network].common.WBTC,
            WSTETH : ADDRESSES[enviroment.network].common.WSTETH,
          }
        },
        operationExecutor: operationExecutor || ADDRESSES[enviroment.network].mpa.core.OperationExecutor,
        getCumulatives: () => {
          return Promise.resolve({
            borrowCumulativeDepositUSD: new BigNumber("0"),
            borrowCumulativeFeesUSD: new BigNumber("0"),
            borrowCumulativeWithdrawUSD: new BigNumber("0")
          })
        }
      }
    )

    const reciept = await sendTxThroughProxy(
      {...strategy.tx, value: ethers.BigNumber.from(strategy.tx.value)}, 
      proxyAddress, 
      enviroment.provider
    )

    throwOnRevertedTx(reciept)
  },
};
