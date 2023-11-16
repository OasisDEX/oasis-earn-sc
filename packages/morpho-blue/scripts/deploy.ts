import hre from 'hardhat'

import {
  getMorphoDefaultMarketsConfig,
  getMorphoDefaultOraclesConfig,
  getMorphoDefaultTokensConfig,
} from './config'
import { deployMorphoBlue, deployOracles, deployTokens } from './utils'

async function main() {
  const signer = (await hre.ethers.getSigners())[0]

  const tokensConfig = getMorphoDefaultTokensConfig()
  const oraclesConfig = getMorphoDefaultOraclesConfig()
  const marketsConfig = getMorphoDefaultMarketsConfig()

  const tokensDeployment = await deployTokens(tokensConfig, signer)
  const oraclesDeployment = await deployOracles(oraclesConfig, marketsConfig, signer)

  await deployMorphoBlue(marketsConfig, tokensDeployment, oraclesDeployment, signer, signer.address)

  await console.log('\nMorpho system deployed and configured successfully!')
}

main()
  .then(() => {
    // success message or other processing
    process.exitCode = 0
    process.exit()
  })
  .catch(error => {
    console.error(error)
    process.exitCode = 1
    process.exit()
  })
