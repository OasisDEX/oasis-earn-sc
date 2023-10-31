import { IrmMock, Morpho } from '@typechain'
import type {
  MorphoMarketsConfig,
  OraclesConfig,
  OraclesDeployment,
  TokensConfig,
  TokensDeployment,
} from '@types'
import { BigNumber, Contract, Signer } from 'ethers'
import { ethers } from 'hardhat'

import { MorphoLLTVPrecision, MorphoPricePrecision } from '../config'

async function deployContract<T extends Contract>(
  contractName: string,
  args: any[],
  signerOrOptions?: Signer | undefined,
): Promise<T> {
  const factory = await ethers.getContractFactory(contractName, signerOrOptions)
  const contract = (await factory.deploy(...args)) as unknown as T
  await contract.deployed()
  await contract.deployTransaction.wait()
  return contract
}

export function getMarketId(
  loanTokenAddress: string,
  collateralTokenAddress: string,
  oracleAddress: string,
  irmAddress: string,
  lltv: BigNumber,
) {
  const encodedParams = ethers.utils.defaultAbiCoder.encode(
    ['address', 'address', 'address', 'address', 'uint256'],
    [loanTokenAddress, collateralTokenAddress, oracleAddress, irmAddress, lltv],
  )
  return ethers.utils.keccak256(encodedParams)
}

export async function deployTokens(
  tokensConfig: TokensConfig,
  signer: Signer,
): Promise<TokensDeployment> {
  const tokensDeployment: TokensDeployment = {}

  console.log('==================== TOKEN DEPLOYMENT =====================')
  for (const tokenName of Object.keys(tokensConfig)) {
    const tokenInfo = tokensConfig[tokenName]

    console.log(`Deploying ${tokenName}...`)
    const contract = await deployContract<ReturnType<typeof tokenInfo.factory.getContract>>(
      tokenInfo.contractName,
      [],
      signer,
    )

    tokensDeployment[tokenName] = {
      contract,
    }
  }

  return tokensDeployment
}

export async function deployOracles(
  oraclesConfig: OraclesConfig,
  marketsConfig: MorphoMarketsConfig,
  signer: Signer,
): Promise<OraclesDeployment> {
  const oraclesDeployment: OraclesDeployment = {}

  for (const market of Object.keys(marketsConfig.markets)) {
    const marketInfo = marketsConfig.markets[market]
    const oracleInfo = oraclesConfig[marketInfo.loanToken][marketInfo.collateralToken]

    if (!oracleInfo) {
      throw new Error(`Oracle for market ${market} not found`)
    }

    console.log(
      `Deploying Oracle for pair ${marketInfo.loanToken}/${marketInfo.collateralToken}...`,
    )

    const oracle = await deployContract<ReturnType<typeof oracleInfo.factory.getContract>>(
      oracleInfo.contractName,
      [],
      signer,
    )

    await oracle.setPrice(oracleInfo.initialPrice)

    console.log(
      `   Oracle deployed to ${oracle.address} with initial price ${ethers.utils.formatUnits(
        oracleInfo.initialPrice,
        MorphoPricePrecision,
      )}`,
    )

    if (!oraclesDeployment[marketInfo.loanToken]) {
      oraclesDeployment[marketInfo.loanToken] = {}
    }

    oraclesDeployment[marketInfo.loanToken][marketInfo.collateralToken] = {
      contract: oracle,
    }
  }

  return oraclesDeployment
}

export async function createMarkets(
  marketConfig: MorphoMarketsConfig,
  tokensConfig: TokensDeployment,
  oraclesDeployment: OraclesDeployment,
  morpho: Morpho,
  irm: IrmMock,
) {
  // Create all markets
  for (const market of marketConfig.markets) {
    const loanToken = tokensConfig[market.loanToken]
    const collateralToken = tokensConfig[market.collateralToken]
    const oracle = oraclesDeployment[market.loanToken][market.collateralToken]
    const lltv = ethers.utils.parseUnits(market.lltv, MorphoLLTVPrecision)

    // Check that market was created correctly
    const marketId = getMarketId(
      loanToken.contract.address,
      collateralToken.contract.address,
      oracle.contract.address,
      irm.address,
      lltv,
    )

    console.log(`--------------- Market ${market.label} ----------------`)
    console.log(`  Market ID: ${marketId}`)
    console.log(`  Loan token: ${market.loanToken} (${loanToken.contract.address})`)
    console.log(
      `  Collateral token: ${market.collateralToken} (${collateralToken.contract.address})`,
    )
    console.log(`  Oracle: ${oracle.contract.address}`)
    console.log(`  IRM: ${irm.address}`)
    console.log(`  LLTV: ${market.lltv} (${lltv.toString()})`)

    const isLLTVEnabled = await morpho.isLltvEnabled(lltv)
    if (!isLLTVEnabled) {
      await morpho.enableLltv(lltv)
    }

    await morpho.createMarket({
      loanToken: loanToken.contract.address,
      collateralToken: collateralToken.contract.address,
      oracle: oracle.contract.address,
      irm: irm.address,
      lltv: lltv,
    })

    const marketParams = await morpho.idToMarketParams(marketId)
    if (
      marketParams.loanToken.toLowerCase() !== loanToken.contract.address.toLowerCase() ||
      marketParams.collateralToken.toLowerCase() !==
        collateralToken.contract.address.toLowerCase() ||
      marketParams.oracle.toLowerCase() !== oracle.contract.address.toLowerCase() ||
      marketParams.irm.toLowerCase() !== irm.address.toLowerCase() ||
      !marketParams.lltv.eq(lltv)
    ) {
      console.log(JSON.stringify(marketParams))
      throw new Error(`Market ${market.label} was not created correctly`)
    }

    console.log(`\n`)
  }
}

export async function deployMorphoBlue(
  morphoMarketsConfig: MorphoMarketsConfig,
  tokensDeployment: TokensDeployment,
  oraclesDeployment: OraclesDeployment,
  signer: Signer,
  signerAddress: string,
): Promise<Morpho> {
  console.log('\n==================== MORPHO DEPLOYMENT =====================')
  const morpho = await deployContract<Morpho>('Morpho', [signerAddress], signer)
  const irm = await deployContract<IrmMock>('IrmMock', [], signer)

  console.log(`Morpho deployed to ${morpho.address}`)
  console.log(`IRM deployed to ${irm.address}`)

  // Enable IRM for all markets
  await morpho.enableIrm(irm.address)

  console.log('\n==================== MARKET CREATION =====================\n')
  await createMarkets(morphoMarketsConfig, tokensDeployment, oraclesDeployment, morpho, irm)
  console.log('==========================================================')

  return morpho
}
