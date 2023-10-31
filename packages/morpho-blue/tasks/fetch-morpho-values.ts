import { ethers, Signer } from 'ethers'
import { task } from 'hardhat/config'

import { Morpho, Morpho__factory } from '../typechain'

export function getMorpho(
  morphoAddress: string,
  signerOrProvider: Signer | ethers.providers.Provider,
): Morpho {
  if (!ethers.utils.isAddress(morphoAddress)) {
    throw new Error(`Invalid Morpho address: ${morphoAddress}`)
  }

  return Morpho__factory.connect(morphoAddress, signerOrProvider)
}

task(
  'fetch-morpho-values',
  'Retrieves all Morpho values from the given Morpho address at the given network',
)
  .addParam('address', 'Address of the Morpho contract')
  .setAction(async (taskArgs, hre) => {
    const { name: network } = hre.network
    const { ethers } = hre

    const morpho = getMorpho(taskArgs.address, ethers.provider)

    const curatedMarketsIDs = [
      '0x867be47dfa7e9d54f7be835987ff51788b32a34c1948f0c7f4e0d4a15ac99178',
      '0xb18c0c56757318918759dffb22723e1e060b982868c3bf197901e8b1ab1aa112',
      '0x0551effbb9a05f751e77d04d15bdb12bcf2b6ed0a7c442ad8ad95b3087593c72',
      '0x12a221139da627861202080e40fa0a37e84f91d7c74243390e8708fc5643d6ab',
      '0x12a221139da627861202080e40fa0a37e84f91d7c74243390e8708fc5643d6ab',
      '0x5f4ed9549c6937473e3d6d3410c3f6571d31d541dffd48bbbfa80ece736f4870',
      '0xcf5ebd892a58dc0c902add93b50382af5e19c59f4d0184d6f70b757c2c32d6e0',
    ]

    try {
      console.log(`===== Morpho ${taskArgs.address} at ${network} ====`)
      const owner = await morpho.owner()
      const feeRecipient = await morpho.feeRecipient()

      console.log(`Owner: ${owner}`)
      console.log(`Fee recipient: ${feeRecipient}`)

      console.log('============ Curated markets ============')
      for (const marketID of curatedMarketsIDs) {
        const market = await morpho.market(marketID)
        const marketParams = await morpho.idToMarketParams(marketID)

        const isIRMEnabled = await morpho.isIrmEnabled(marketParams.irm)
        const isLltvEnabled = await morpho.isLltvEnabled(marketParams.lltv)

        console.log(`ID: ${marketID}`)
        console.log(`  Loan Token: ${marketParams.loanToken}`)
        console.log(`  Collateral Token: ${marketParams.collateralToken}`)
        console.log(`  Oracle: ${marketParams.oracle}`)
        console.log(`  IRM: ${marketParams.irm} ${isIRMEnabled ? '(enabled)' : '(disabled)'}`)
        console.log(`  LLTV: ${marketParams.lltv} ${isLltvEnabled ? '(enabled)' : '(disabled)'}`)
        console.log(`  ----------------------------------------------------------------`)
        console.log(`  Total Supply Assets: ${market.totalSupplyAssets}`)
        console.log(`  Total Borrow Assets: ${market.totalBorrowAssets}`)
        console.log(`  Total Supply Shares: ${market.totalSupplyShares}`)
        console.log(`  Total Borrow Shares: ${market.totalBorrowShares}`)
        console.log(`  Last Update: ${market.lastUpdate}`)
        console.log(`  Fee: ${market.fee}`)
        console.log(`----------------------------------------------------------------`)
      }
    } catch (e) {
      if (JSON.stringify(e).includes('CALL_EXCEPTION')) {
        throw new Error(`Morpho contract not deployed at ${taskArgs.address} on ${network} network`)
      }
    }
  })
