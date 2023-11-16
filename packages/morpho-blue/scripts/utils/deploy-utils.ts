import { IrmMock, Morpho } from '@typechain'
import { MarketParamsStruct } from '@typechain/contracts/Morpho'
import type {
  MarketSupplyConfig,
  MorphoMarket,
  MorphoMarketInfo,
  MorphoMarketsConfig,
  MorphoSystem,
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

export function getMarketId(market: MarketParamsStruct) {
  const encodedParams = ethers.utils.defaultAbiCoder.encode(
    ['address', 'address', 'address', 'address', 'uint256'],
    [market.loanToken, market.collateralToken, market.oracle, market.irm, market.lltv],
  )
  return ethers.utils.keccak256(encodedParams)
}

export function getMarketParams(
  market: MorphoMarket,
  tokensDeployment: TokensDeployment,
  oraclesDeployment: OraclesDeployment,
  irm: IrmMock,
): MarketParamsStruct {
  const loanToken = tokensDeployment[market.loanToken]
  const collateralToken = tokensDeployment[market.collateralToken]
  const oracle = oraclesDeployment[market.loanToken][market.collateralToken]
  const lltv = ethers.utils.parseUnits(market.lltv, MorphoLLTVPrecision)

  return {
    loanToken: loanToken.contract.address,
    collateralToken: collateralToken.contract.address,
    oracle: oracle.contract.address,
    irm: irm.address,
    lltv: lltv,
  }
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

    const decimals = (await contract.decimals()) as BigNumber

    tokensDeployment[tokenName] = {
      contract,
      decimals: decimals.toNumber(),
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
  tokensDeployment: TokensDeployment,
  oraclesDeployment: OraclesDeployment,
  morpho: Morpho,
  irm: IrmMock,
): Promise<MorphoMarketInfo[]> {
  const marketsInfo: MorphoMarketInfo[] = []

  // Create all markets
  for (const market of marketConfig.markets) {
    const loanToken = tokensDeployment[market.loanToken]
    const collateralToken = tokensDeployment[market.collateralToken]
    const oracle = oraclesDeployment[market.loanToken][market.collateralToken]
    const lltv = ethers.utils.parseUnits(market.lltv, MorphoLLTVPrecision)

    const marketParams = getMarketParams(market, tokensDeployment, oraclesDeployment, irm)

    // Check that market was created correctly
    const marketId = getMarketId(marketParams)

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

    await morpho.createMarket(marketParams)

    const configuredParams = await morpho.idToMarketParams(marketId)
    if (
      configuredParams.loanToken.toLowerCase() !== loanToken.contract.address.toLowerCase() ||
      configuredParams.collateralToken.toLowerCase() !==
        collateralToken.contract.address.toLowerCase() ||
      configuredParams.oracle.toLowerCase() !== oracle.contract.address.toLowerCase() ||
      configuredParams.irm.toLowerCase() !== irm.address.toLowerCase() ||
      !configuredParams.lltv.eq(lltv)
    ) {
      console.log(JSON.stringify(configuredParams))
      throw new Error(`Market ${market.label} was not created correctly`)
    }

    console.log(`\n`)

    marketsInfo.push({
      ...market,
      id: marketId,
      solidityParams: marketParams,
    })
  }

  return marketsInfo
}

export async function deployMorphoBlue(
  morphoMarketsConfig: MorphoMarketsConfig,
  tokensDeployment: TokensDeployment,
  oraclesDeployment: OraclesDeployment,
  signer: Signer,
  signerAddress: string,
): Promise<MorphoSystem> {
  console.log('\n==================== MORPHO DEPLOYMENT =====================')
  const morpho = await deployContract<Morpho>('Morpho', [signerAddress], signer)
  const irm = await deployContract<IrmMock>('IrmMock', [], signer)

  console.log(`Morpho deployed to ${morpho.address}`)
  console.log(`IRM deployed to ${irm.address}`)

  // Enable IRM for all markets
  await morpho.enableIrm(irm.address)

  console.log('\n==================== MARKET CREATION =====================\n')
  const marketsInfo = await createMarkets(
    morphoMarketsConfig,
    tokensDeployment,
    oraclesDeployment,
    morpho,
    irm,
  )
  console.log('==========================================================')

  return {
    morpho: morpho,
    irm: irm,
    marketsInfo: marketsInfo,
    tokensDeployment: tokensDeployment,
    oraclesDeployment: oraclesDeployment,
  }
}

/**
 * @notice Adds markets liquidity
 */
export async function setupMarkets(
  morphoSystem: MorphoSystem,
  supplyConfig: MarketSupplyConfig,
  signer: Signer,
  signerAddress: string,
) {
  console.log('\n==================== MARKET SETUP =====================')
  for (const market of morphoSystem.marketsInfo) {
    const marketParams = getMarketParams(
      market,
      morphoSystem.tokensDeployment,
      morphoSystem.oraclesDeployment,
      morphoSystem.irm,
    )

    const supplyAmount = supplyConfig[market.loanToken]
    if (!supplyAmount) {
      throw new Error(`Supply amount for ${market.loanToken} not found`)
    }

    console.log(`Supplying ${supplyAmount.toString()} ${market.loanToken} to ${market.label}...`)

    await morphoSystem.tokensDeployment[market.loanToken].contract
      .connect(signer)
      .mint(signerAddress, supplyAmount)
    await morphoSystem.tokensDeployment[market.loanToken].contract
      .connect(signer)
      .approve(morphoSystem.morpho.address, supplyAmount)

    await morphoSystem.morpho
      .connect(signer)
      .supply(marketParams, supplyAmount, 0, signerAddress, [])
  }
}
