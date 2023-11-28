import * as yup from 'yup';

import type { Command } from '../cli/command';
import { views } from '@oasisdex/dma-library'
import { BigNumber } from 'bignumber.js';

const argsSchema = yup.object().shape({});

export const morphoCommand: Command<typeof argsSchema> = {
  name: 'morpho' as const,
  description: ``,
  args: argsSchema,
  async run(_args, enviroment) {
    const position = await views.morpho.getPosition(
      {
        proxyAddress: "0xb8C1a95D3E3A34481600780833550a260eDf37AD",
        marketId: "0x127e1aa376a073ecdcddb49856150ac84771f1226d92fd5bd8a92f77cf606e15",
        collateralPriceUSD: new BigNumber(10),
        quotePriceUSD: new BigNumber(10),
        collateralPrecision: 18,
        quotePrecision: 18,
      },
      {
        provider: enviroment.provider,
        morphoAddress: "0x64c7044050Ba0431252df24fEd4d9635a275CB41",
        getCumulatives: () => {
          return {
            borrowCumulativeDepositUSD: new BigNumber("0"),
            borrowCumulativeFeesUSD: new BigNumber("0"),
            borrowCumulativeWithdrawUSD: new BigNumber("0")
          }
        }
      }
    )
    console.log(`
    Morpho Position:
    market                    ${position.marketPatams.id}
    loanToken:                ${position.marketPatams.loanToken}
    collateralToken:          ${position.marketPatams.collateralToken}

    owner:                    ${position.owner}
    collateral:               ${position.collateralAmount.toString()}
    debt:                     ${position.debtAmount.toString()}
    netValue:                 ${position.netValue.toString()}
    pnl:                      ${position.pnl.withFees.toString()}
    marketPrice:              ${position.marketPrice.toString()}
    liquidationPrice:         ${position.liquidationPrice.toString()}
    liquidationToMarketPrice: ${position.liquidationToMarketPrice.toString()}
    collateralAvailable:      ${position.collateralAvailable.toString()}
    riskRatio:                ${position.riskRatio.loanToValue.toString()}
    maxRiskRatio:             ${position.maxRiskRatio.loanToValue.toString()}
    minRiskRatio:             ${position.minRiskRatio.loanToValue.toString()}
    borrowRate:               ${position.borrowRate.toString()}
    buyingPower:              ${position.buyingPower.toString()}
    netValue:                 ${position.netValue.toString()}
    debtAvailable:            ${position.debtAvailable().toString()}
    `)
  },
};
