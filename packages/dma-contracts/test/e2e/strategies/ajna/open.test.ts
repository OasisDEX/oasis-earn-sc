import { Network } from '@deploy-configurations/types/network'
import { ZERO } from '@dma-common/constants'
import { expect } from '@dma-common/test-utils'
import { EnvWithAjnaPositions } from '@dma-contracts/test/fixtures'
import {
  envWithAjnaPositions,
  getSupportedAjnaPositions,
} from '@dma-contracts/test/fixtures/system/env-with-ajna-positions'
import { AjnaPosition } from '@dma-library'
import { Strategy } from '@dma-library/types'
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers'
import BigNumber from 'bignumber.js'

const networkFork = process.env.NETWORK_FORK as Network
const EXPECT_LARGER_SIMULATED_FEE = 'Expect simulated fee to be more than the user actual pays'

describe('Strategy | AJNA | Open Multiply | E2E', () => {
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

  describe('Open multiply positions', function () {
    supportedPositions.forEach(({ name: variant }) => {
      let position: AjnaPosition
      let simulatedPosition: AjnaPosition
      let simulation: Strategy<AjnaPosition>['simulation']
      let feesCollected: BigNumber

      before(async function () {
        const { positions, ajnaSystem } = env
        const positionDetails = positions[variant]
        if (!positionDetails) {
          throw new Error('Position not found')
        }

        position = await positionDetails.getPosition(
          {
            proxyAddress: positionDetails.proxy,
            poolAddress: positionDetails.pool.poolAddress,
            collateralPrice: positionDetails.__collateralPrice,
            quotePrice: positionDetails.__quotePrice,
          },
          {
            poolInfoAddress: ajnaSystem.poolInfo.address,
            provider: env.config.provider,
            getPoolData: undefined,
          },
        )
        simulation = positionDetails.__openPositionSimulation
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
      it(`Should collect fee for ${variant}`, async () => {
        // const simulatedFee = simulation.swaps[0].tokenFee || ZERO
        expect.toBe(ZERO, 'gte', feesCollected, EXPECT_LARGER_SIMULATED_FEE)
      })
    })
  })
})
