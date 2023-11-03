import { Address } from '@deploy-configurations/types/address'
import { Network } from '@deploy-configurations/types/network'
import { ZERO } from '@dma-common/constants'
import { expect } from '@dma-common/test-utils'
import { balanceOf } from '@dma-common/utils/balances/index'
import { AjnaPositionDetails, EnvWithAjnaPositions } from '@dma-contracts/test/fixtures'
import {
  envWithAjnaPositions,
  getSupportedAjnaPositions,
} from '@dma-contracts/test/fixtures/system/env-with-ajna-positions'
import { AjnaPosition, views } from '@dma-library'
import { Strategy } from '@dma-library/types'
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers'
import BigNumber from 'bignumber.js'

const networkFork = process.env.NETWORK_FORK as Network
const EXPECT_LARGER_SIMULATED_FEE = 'Expect simulated fee to be more than the user actual pays'

describe.skip('Strategy | AJNA | Open Multiply | E2E', () => {
  const supportedPositions = getSupportedAjnaPositions(networkFork)
  let env: EnvWithAjnaPositions
  const fixture = envWithAjnaPositions({
    network: networkFork,
    systemConfigPath: `test/${networkFork}.conf.ts`,
    configExtensionPaths: [`test/uSwap.conf.ts`],
  })
  before(async function () {
    env = await loadFixture(fixture)
    if (!env) throw new Error('Env not setup')
  })

  type Token = {
    symbol: string
    precision: number
    address: Address
  }

  describe.skip('Open multiply positions', function () {
    supportedPositions.forEach(({ name: variant }) => {
      let position: AjnaPosition
      let simulatedPosition: AjnaPosition
      let simulation: Strategy<AjnaPosition>['simulation']
      let debtToken: Token
      let collateralToken: Token
      let positionDetails: AjnaPositionDetails
      let feesCollected: BigNumber

      before(async function () {
        const { positions, ajnaSystem } = env
        positionDetails = positions[variant]
        if (!positionDetails) {
          throw new Error('Position not found')
        }

        position = await views.ajna.getPosition(
          {
            proxyAddress: positionDetails.proxy,
            poolAddress: positionDetails.pool.poolAddress,
            collateralPrice: positionDetails.__collateralPrice,
            quotePrice: positionDetails.__quotePrice,
          },
          {
            poolInfoAddress: ajnaSystem.poolInfo.address,
            provider: env.config.provider,
            getPoolData: env.dependencies.getPoolData,
          },
        )
        debtToken = positionDetails.debtToken
        collateralToken = positionDetails.collateralToken
        simulation = positionDetails.__openPositionSimulation
        simulatedPosition = simulation.position
        feesCollected = positionDetails.__feesCollected
      })

      it(`Should draw the correct amount of debt for ${variant}`, async () => {
        expect.toBe(simulatedPosition.debtAmount.toFixed(0), 'lte', position.debtAmount.toFixed(0))
      })
      it(`Should deposit all collateral for ${variant}`, async () => {
        expect.toBe(
          simulatedPosition.collateralAmount.toFixed(0),
          'lte',
          position.collateralAmount.toFixed(0),
        )
      })
      it(`Should have the correct multiple for ${variant}`, async () => {
        expect.toBe(position.riskRatio.multiple, 'lte', simulatedPosition.riskRatio.multiple)
      })
      it(`Should not have anything left on the proxy for ${variant}`, async () => {
        const proxyDebtBalance = await balanceOf(debtToken.address, positionDetails.proxy, {
          config: env.config,
          isFormatted: true,
        })
        const proxyCollateralBalance = await balanceOf(
          collateralToken.address,
          positionDetails.proxy,
          {
            config: env.config,
            isFormatted: true,
          },
        )

        expect.toBeEqual(proxyDebtBalance, ZERO)
        expect.toBeEqual(proxyCollateralBalance, ZERO)
      })
      it(`Should have collected a fee for ${variant}`, async () => {
        const simulatedFee = simulation.swaps[0].fee || ZERO
        expect.toBe(simulatedFee, 'gte', feesCollected, EXPECT_LARGER_SIMULATED_FEE)
      })
    })
  })
})
