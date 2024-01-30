import { views } from '@oasisdex/dma-library';
import { BigNumber } from 'bignumber.js';
import * as yup from 'yup';

import type { Command } from '../cli/command';
import { getCumulatives } from '../logic/common/getCumulatives';

const argsSchema = yup.object().shape({});

const morphoBlueMarket =
  '0xc54d7acf14de29e0e5527cabd7a576506870346a78a11a6762e2cca66322ec41';
const morphoAddress = '0xBBBBBbbBBb9cC5e90e3b3Af64bdAF62C37EEFFCb';
const proxyAddress = '0x8451C582AB882fb534175B5465E91DfbDE97917e';

export const morphoViewCommand: Command<typeof argsSchema> = {
  name: 'morpho-view' as const,
  description: ``,
  args: argsSchema,
  async run(_args, enviroment) {
    const position = await views.morpho.getPosition(
      {
        proxyAddress: proxyAddress,
        marketId: morphoBlueMarket,
        collateralPriceUSD: new BigNumber(2100),
        quotePriceUSD: new BigNumber(200),
        collateralPrecision: 18,
        quotePrecision: 18,
      },
      {
        getCumulatives,
        provider: enviroment.provider,
        morphoAddress: morphoAddress,
      },
    );
    console.log(`
      Morpho position:
        collateralToken ${position.marketParams.collateralToken}
        collateral ${position.collateralAmount.toString()}
        debtToken ${position.marketParams.loanToken}
        debt ${position.debtAmount.toString()}
        liquidationPrice ${position.liquidationPrice.toString()}
        ltv ${position.riskRatio.loanToValue.toString()}

      Market:
        totalSupplyAssets ${position.market.totalSupplyAssets.toString()}
        totalSupplyShares ${position.market.totalSupplyShares.toString()}
        totalBorrowAssets ${position.market.totalBorrowAssets.toString()}
        totalBorrowShares ${position.market.totalBorrowShares.toString()}
      `);
  },
};
