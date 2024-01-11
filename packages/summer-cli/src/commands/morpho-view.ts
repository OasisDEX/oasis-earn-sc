import { views } from '@oasisdex/dma-library';
import { BigNumber } from 'bignumber.js';
import * as yup from 'yup';

import type { Command } from '../cli/command';

const argsSchema = yup.object().shape({});

const morphoBlueMarket =
  '0xc20ac032046932de07497da27f9c2a3bd8ecaf3fdcab6b4f70b7088ac0404dc9';
const morphoAddress = '0x3ecc1901aa1e6ba58a9c2209b0a6d6ac3f88a6c9';
const proxyAddress = '0xc160a4d20f9e1f66b916cc1df1ee818e95f30890';

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
        getCumulatives: () => {
          return Promise.resolve({
            borrowCumulativeDepositUSD: new BigNumber('0'),
            borrowCumulativeFeesUSD: new BigNumber('0'),
            borrowCumulativeWithdrawUSD: new BigNumber('0'),
          });
        },
        provider: enviroment.provider,
        morphoAddress: morphoAddress,
      },
    );
    console.log(`
      Morpho position:
        collateralToken ${position.marketPatams.collateralToken}
        collateral ${position.collateralAmount.toString()}
        debtToken ${position.marketPatams.loanToken}
        debt ${position.debtAmount.toString()}
        liquidationPrice ${position.liquidationPrice.toString()}

      Market:
        totalSupplyAssets ${position.market.totalSupplyAssets.toString()}
        totalSupplyShares ${position.market.totalSupplyShares.toString()}
        totalBorrowAssets ${position.market.totalBorrowAssets.toString()}
        totalBorrowShares ${position.market.totalBorrowShares.toString()}
      `);
  },
};
