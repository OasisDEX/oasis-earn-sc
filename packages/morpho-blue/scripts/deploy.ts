import { BigNumber, Contract, Signer } from 'ethers'
import hre, { ethers } from 'hardhat'

import {
  FakeDAI__factory,
  FakeUSDC__factory,
  FakeUSDT__factory,
  FakeWBTC__factory,
  FakeWETH__factory,
  FakeWSTETH__factory,
  IrmMock,
  Morpho,
  OracleMock,
} from '../typechain'
import MorphoConfig from './deploy-config.json'

const MorphoPricePrecision = 36
const MorphoLLTVPrecision = 18

const TokensConfig = {
  DAI: {
    factory: FakeDAI__factory,
    contractName: 'FakeDAI',
    contract: undefined,
    oracle: undefined,
    initialPrice: ethers.utils.parseUnits('1.0', MorphoPricePrecision),
  },
  USDC: {
    factory: FakeUSDC__factory,
    contractName: 'FakeUSDC',
    contract: undefined,
    oracle: undefined,
    initialPrice: ethers.utils.parseUnits('1.0', MorphoPricePrecision),
  },
  USDT: {
    factory: FakeUSDT__factory,
    contractName: 'FakeUSDT',
    contract: undefined,
    oracle: undefined,
    initialPrice: ethers.utils.parseUnits('1.0', MorphoPricePrecision),
  },
  WBTC: {
    factory: FakeWBTC__factory,
    contractName: 'FakeWBTC',
    contract: undefined,
    oracle: undefined,
    initialPrice: ethers.utils.parseUnits('18000.0', MorphoPricePrecision),
  },
  WETH: {
    factory: FakeWETH__factory,
    contractName: 'FakeWETH',
    contract: undefined,
    oracle: undefined,
    initialPrice: ethers.utils.parseUnits('1500.0', MorphoPricePrecision),
  },
  WSTETH: {
    factory: FakeWSTETH__factory,
    contractName: 'FakeWSTETH',
    contract: undefined,
    oracle: undefined,
    initialPrice: ethers.utils.parseUnits('1500.0', MorphoPricePrecision),
  },
}

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

function getMarketId(
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

async function deployTokens(config: any, signer: Signer) {
  for (const tokenName of Object.keys(config)) {
    const tokenInfo = config[tokenName]

    console.log(`Deploying ${tokenName}...`)
    tokenInfo.contract = await deployContract<ReturnType<typeof tokenInfo.factory.connect>>(
      tokenInfo.contractName,
      [],
      signer,
    )

    tokenInfo.oracle = await deployContract<OracleMock>('OracleMock', [], signer)
    await tokenInfo.oracle.setPrice(tokenInfo.initialPrice)

    console.log(`   Token deployed to ${tokenInfo.contract.address}`)
    console.log(
      `   Oracle deployed to ${
        tokenInfo.oracle.address
      } with initial price ${ethers.utils.formatUnits(
        tokenInfo.initialPrice,
        MorphoPricePrecision,
      )}`,
    )
  }
}

async function createMarkets(marketConfig: any, tokensConfig: any, morpho: Morpho, irm: IrmMock) {
  // Create all markets
  for (const market of marketConfig.markets) {
    const loanToken = tokensConfig[market.loanToken]
    const collateralToken = tokensConfig[market.collateralToken]
    const lltv = ethers.utils.parseUnits(market.lltv, MorphoLLTVPrecision)

    // Check that market was created correctly
    const marketId = getMarketId(
      loanToken.contract.address,
      collateralToken.contract.address,
      collateralToken.oracle.address,
      irm.address,
      lltv,
    )

    console.log(`--------------- Market ${market.label} ----------------`)
    console.log(`  Market ID: ${marketId}`)
    console.log(`  Loan token: ${market.loanToken} (${loanToken.contract.address})`)
    console.log(
      `  Collateral token: ${market.collateralToken} (${collateralToken.contract.address})`,
    )
    console.log(`  Oracle: ${collateralToken.oracle.address}`)
    console.log(`  IRM: ${irm.address}`)
    console.log(`  LLTV: ${market.lltv} (${lltv.toString()})`)

    const isLLTVEnabled = await morpho.isLltvEnabled(lltv)
    if (!isLLTVEnabled) {
      await morpho.enableLltv(lltv)
    }

    await morpho.createMarket({
      loanToken: loanToken.contract.address,
      collateralToken: collateralToken.contract.address,
      oracle: collateralToken.oracle.address,
      irm: irm.address,
      lltv: lltv,
    })

    const marketParams = await morpho.idToMarketParams(marketId)
    if (
      marketParams.loanToken.toLowerCase() !== loanToken.contract.address.toLowerCase() ||
      marketParams.collateralToken.toLowerCase() !==
        collateralToken.contract.address.toLowerCase() ||
      marketParams.oracle.toLowerCase() !== collateralToken.oracle.address.toLowerCase() ||
      marketParams.irm.toLowerCase() !== irm.address.toLowerCase() ||
      !marketParams.lltv.eq(lltv)
    ) {
      console.log(JSON.stringify(marketParams))
      throw new Error(`Market ${market.label} was not created correctly`)
    }

    console.log(`\n`)
  }
}

async function main() {
  const signer = (await hre.ethers.getSigners())[0]

  console.log('==================== TOKEN DEPLOYMENT =====================')
  await deployTokens(TokensConfig, signer)

  console.log('\n==================== MORPHO DEPLOYMENT =====================')
  const morpho = await deployContract<Morpho>('Morpho', [signer.address], signer)
  const irm = await deployContract<IrmMock>('IrmMock', [], signer)

  console.log(`Morpho deployed to ${morpho.address}`)
  console.log(`IRM deployed to ${irm.address}`)

  // Enable IRM for all markets
  await morpho.enableIrm(irm.address)

  console.log('\n==================== MARKET CREATION =====================\n')
  await createMarkets(MorphoConfig, TokensConfig, morpho, irm)
  console.log('==========================================================')

  console.log('\nMorpho system deployed and configured successfully!')
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
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
