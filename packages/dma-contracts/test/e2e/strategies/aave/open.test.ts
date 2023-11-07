import { Network } from '@deploy-configurations/types/network'
import { expect } from '@dma-common/test-utils'
import { isOptimismByNetwork } from '@dma-common/utils/common'
import {
  getSupportedStrategies,
  SystemWithAavePositions,
  systemWithAavePositions,
  SystemWithAAVEV3Positions,
} from '@dma-contracts/test/fixtures'
import {
  getSupportedAaveV3Strategies,
  systemWithAaveV3Positions,
} from '@dma-contracts/test/fixtures/system/system-with-aave-v3-positions'
import { PositionTransition } from '@dma-library'
import { IPosition } from '@domain'
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers'
import BigNumber from 'bignumber.js'

const networkFork = process.env.NETWORK_FORK as Network
const EXPECT_LARGER_SIMULATED_FEE = 'Expect simulated fee to be more than the user actual pays'

describe.skip(`Strategy | AAVE | Open Position | E2E`, async function () {
  describe.skip('Using AAVE V2', async function () {
    let fixture: SystemWithAavePositions

    const supportedStrategies = getSupportedStrategies()

    describe.skip('Open position: With Uniswap', function () {
      before(async function () {
        if (isOptimismByNetwork(networkFork)) {
          this.skip()
        }

        const _fixture = await systemWithAavePositions({
          use1inch: false,
          configExtensionPaths: [`test/uSwap.conf.ts`],
          network: networkFork,
        })()
        if (!_fixture) throw new Error('Failed to load fixture')
        fixture = _fixture
      })

      describe.skip('Using DSProxy', function () {
        let position: IPosition
        let simulatedPosition: IPosition
        let simulatedTransition: PositionTransition['simulation']
        let feeWalletBalanceChange: BigNumber

        before(async function () {
          const { dsProxyPosition: dsProxyStEthEthEarnPositionDetails } = fixture

          position = await dsProxyStEthEthEarnPositionDetails.getPosition()
          simulatedPosition = dsProxyStEthEthEarnPositionDetails.__openPositionSimulation.position
          simulatedTransition = dsProxyStEthEthEarnPositionDetails.__openPositionSimulation
          feeWalletBalanceChange = dsProxyStEthEthEarnPositionDetails.__feeWalletBalanceChange
        })

        it('Should draw the correct amount of debt', async () => {
          expect.toBe(
            simulatedPosition.debt.amount.toFixed(0),
            'lte',
            position.debt.amount.toFixed(0),
          )
        })
        it('Should deposit all collateral', async () => {
          expect.toBe(
            simulatedPosition.collateral.amount,
            'lte',
            position.collateral.amount.toFixed(0),
          )
        })
        it('Should have the correct multiple', async () => {
          expect.toBe(position.riskRatio.multiple, 'lte', simulatedPosition.riskRatio.multiple)
        })
        it('Should collect fee', async () => {
          expect.toBeEqual(simulatedTransition.swap.tokenFee, feeWalletBalanceChange)
        })
      })
      describe.skip('Using DPM Proxy', async function () {
        supportedStrategies.forEach(({ name: strategy }) => {
          let position: IPosition
          let simulatedPosition: IPosition
          let simulatedTransition: PositionTransition['simulation']
          let feeWalletBalanceChange: BigNumber

          before(async function () {
            const { dpmPositions } = fixture
            const positionDetails = dpmPositions[strategy]
            if (!positionDetails) {
              this.skip()
            }
            position = await positionDetails.getPosition()
            simulatedPosition = positionDetails.__openPositionSimulation.position
            simulatedTransition = positionDetails.__openPositionSimulation
            feeWalletBalanceChange = positionDetails.__feeWalletBalanceChange
          })

          it(`Should draw the correct amount of debt for ${strategy}`, async () => {
            expect.toBe(
              simulatedPosition.debt.amount.toFixed(0),
              'lte',
              position.debt.amount.toFixed(0),
            )
          })
          it(`Should deposit all collateral for ${strategy}`, async () => {
            expect.toBe(
              simulatedPosition.collateral.amount,
              'lte',
              position.collateral.amount.toFixed(0),
            )
          })
          it(`Should have the correct multiple for ${strategy}`, async () => {
            expect.toBe(position.riskRatio.multiple, 'lte', simulatedPosition.riskRatio.multiple)
          })
          it(`Should collect fee for ${strategy}`, async () => {
            expect.toBeEqual(simulatedTransition.swap.tokenFee, feeWalletBalanceChange)
          })
        })
      })
    })
    describe.skip('Open position: With 1inch', function () {
      before(async function () {
        if (isOptimismByNetwork(networkFork)) {
          this.skip()
        }
        const _fixture = await systemWithAavePositions({
          use1inch: true,
          configExtensionPaths: [`test/swap.conf.ts`],
          network: networkFork,
        })()

        if (!_fixture) throw new Error('Failed to load fixture')
        fixture = _fixture
      })

      describe.skip('Using DSProxy', () => {
        let position: IPosition
        let simulatedPosition: IPosition
        let simulatedTransition: PositionTransition['simulation']
        let feeWalletBalanceChange: BigNumber

        before(async () => {
          const { dsProxyPosition: dsProxyStEthEthEarnPositionDetails } = fixture

          position = await dsProxyStEthEthEarnPositionDetails.getPosition()
          simulatedPosition = dsProxyStEthEthEarnPositionDetails.__openPositionSimulation.position
          simulatedTransition = dsProxyStEthEthEarnPositionDetails.__openPositionSimulation
          feeWalletBalanceChange = dsProxyStEthEthEarnPositionDetails.__feeWalletBalanceChange
        })

        it('Should draw the correct amount of debt', async () => {
          expect.toBe(
            simulatedPosition.debt.amount.toFixed(0),
            'lte',
            position.debt.amount.toFixed(0),
          )
        })
        it('Should deposit all collateral', async () => {
          expect.toBe(
            simulatedPosition.collateral.amount,
            'lte',
            position.collateral.amount.toFixed(0),
          )
        })
        it('Should have the correct multiple', async () => {
          expect.toBe(position.riskRatio.multiple, 'lte', simulatedPosition.riskRatio.multiple)
        })
        it('Should collect fee', async () => {
          expect.toBeEqual(simulatedTransition.swap.tokenFee, feeWalletBalanceChange)
        })
      })
      describe.skip('Using DPM Proxy', async () => {
        supportedStrategies.forEach(({ name: strategy }) => {
          let position: IPosition
          let simulatedPosition: IPosition
          let simulatedTransition: PositionTransition['simulation']
          let feeWalletBalanceChange: BigNumber

          before(async function () {
            const { dpmPositions } = fixture
            const positionDetails = dpmPositions[strategy]
            if (!positionDetails) {
              this.skip()
            }
            position = await positionDetails.getPosition()
            simulatedPosition = positionDetails.__openPositionSimulation.position
            simulatedTransition = positionDetails.__openPositionSimulation
            feeWalletBalanceChange = positionDetails.__feeWalletBalanceChange
          })

          it(`Should draw the correct amount of debt for ${strategy}`, async () => {
            expect.toBe(
              simulatedPosition.debt.amount.toFixed(0),
              'lte',
              position.debt.amount.toFixed(0),
            )
          })
          it(`Should deposit all collateral for ${strategy}`, async () => {
            expect.toBe(
              simulatedPosition.collateral.amount,
              'lte',
              position.collateral.amount.toFixed(0),
            )
          })
          it(`Should have the correct multiple for ${strategy}`, async () => {
            expect.toBe(position.riskRatio.multiple, 'lte', simulatedPosition.riskRatio.multiple)
          })
          it(`Should collect fee for ${strategy}`, async () => {
            expect.toBeEqual(simulatedTransition.swap.tokenFee, feeWalletBalanceChange)
          })
        })
      })
    })
  })
  describe.skip('Using AAVE V3', async function () {
    const supportedStrategies = getSupportedAaveV3Strategies(networkFork)

    describe.skip('Open position: With Uniswap', function () {
      let env: SystemWithAAVEV3Positions
      const fixture = systemWithAaveV3Positions({
        use1inch: false,
        network: networkFork,
        systemConfigPath: `test/${networkFork}.conf.ts`,
        configExtensionPaths: [`test/uSwap.conf.ts`],
      })
      before(async function () {
        const _env = await loadFixture(fixture)
        if (!_env) throw new Error('Failed to set up system')
        env = _env
      })

      describe.skip('Using DSProxy', () => {
        let position: IPosition
        let simulatedPosition: IPosition
        let simulatedTransition: PositionTransition['simulation']
        let feeWalletBalanceChange: BigNumber

        before(async () => {
          const { dsProxyPosition: dsProxyEthUsdcMultiplyPositionDetails } = env

          position = await dsProxyEthUsdcMultiplyPositionDetails.getPosition()
          simulatedPosition =
            dsProxyEthUsdcMultiplyPositionDetails.__openPositionSimulation.position
          simulatedTransition = dsProxyEthUsdcMultiplyPositionDetails.__openPositionSimulation
          feeWalletBalanceChange = dsProxyEthUsdcMultiplyPositionDetails.__feeWalletBalanceChange
        })

        it('Should draw the correct amount of debt', async () => {
          expect.toBe(
            simulatedPosition.debt.amount.toFixed(0),
            'lte',
            position.debt.amount.toFixed(0),
          )
        })
        it('Should deposit all collateral', async () => {
          expect.toBe(
            simulatedPosition.collateral.amount,
            'lte',
            position.collateral.amount.toFixed(0),
          )
        })
        it('Should have the correct multiple', async () => {
          expect.toBe(position.riskRatio.multiple, 'lte', simulatedPosition.riskRatio.multiple)
        })
        it('Should collect fee', async () => {
          expect.toBe(
            simulatedTransition.swap.tokenFee,
            'gte',
            feeWalletBalanceChange,
            EXPECT_LARGER_SIMULATED_FEE,
          )
        })
      })
      describe.skip('Using DPM Proxy', async () => {
        const insufficientLiquidityStrategies = ['WSTETH/ETH Earn']
        supportedStrategies
          .filter(({ name }) => !insufficientLiquidityStrategies.includes(name))
          .forEach(({ name: strategy }) => {
            let position: IPosition
            let simulatedPosition: IPosition
            let simulatedTransition: PositionTransition['simulation']
            let feeWalletBalanceChange: BigNumber

            before(async function () {
              const { dpmPositions } = env
              const positionDetails = dpmPositions[strategy]
              if (!positionDetails) {
                this.skip()
              }
              position = await positionDetails.getPosition()
              simulatedPosition = positionDetails.__openPositionSimulation.position
              simulatedTransition = positionDetails.__openPositionSimulation
              feeWalletBalanceChange = positionDetails.__feeWalletBalanceChange
            })

            it(`Should draw the correct amount of debt for ${strategy}`, async () => {
              expect.toBe(
                simulatedPosition.debt.amount.toFixed(0),
                'lte',
                position.debt.amount.toFixed(0),
              )
            })
            it(`Should deposit all collateral for ${strategy}`, async () => {
              expect.toBe(
                simulatedPosition.collateral.amount,
                'lte',
                position.collateral.amount.toFixed(0),
              )
            })
            it(`Should have the correct multiple for ${strategy}`, async () => {
              expect.toBe(position.riskRatio.multiple, 'lte', simulatedPosition.riskRatio.multiple)
            })
            it(`Should collect fee for ${strategy}`, async () => {
              expect.toBe(
                simulatedTransition.swap.tokenFee,
                'gte',
                feeWalletBalanceChange,
                EXPECT_LARGER_SIMULATED_FEE,
              )
            })
          })
      })
    })
    describe.skip('Open position: With 1inch', () => {
      let env: SystemWithAAVEV3Positions
      const fixture = systemWithAaveV3Positions({
        use1inch: true,
        network: networkFork,
        systemConfigPath: `test/${networkFork}.conf.ts`,
        configExtensionPaths: [`test/swap.conf.ts`],
      })
      before(async function () {
        const _env = await loadFixture(fixture)
        if (!_env) throw new Error('Failed to set up system')
        env = _env
      })

      describe.skip('Using DSProxy', () => {
        let position: IPosition
        let simulatedPosition: IPosition
        let simulatedTransition: PositionTransition['simulation']
        let feeWalletBalanceChange: BigNumber

        before(async () => {
          const { dsProxyPosition: dsProxyEthUsdcMultiplyPositionDetails } = env

          position = await dsProxyEthUsdcMultiplyPositionDetails.getPosition()
          simulatedPosition =
            dsProxyEthUsdcMultiplyPositionDetails.__openPositionSimulation.position
          simulatedTransition = dsProxyEthUsdcMultiplyPositionDetails.__openPositionSimulation
          feeWalletBalanceChange = dsProxyEthUsdcMultiplyPositionDetails.__feeWalletBalanceChange
        })

        it('Should draw the correct amount of debt', async () => {
          expect.toBe(
            simulatedPosition.debt.amount.toFixed(0),
            'lte',
            position.debt.amount.toFixed(0),
          )
        })
        it('Should deposit all collateral', async () => {
          expect.toBe(
            simulatedPosition.collateral.amount,
            'lte',
            position.collateral.amount.toFixed(0),
          )
        })
        it('Should have the correct multiple', async () => {
          expect.toBe(position.riskRatio.multiple, 'lte', simulatedPosition.riskRatio.multiple)
        })
        it('Should collect fee', async () => {
          expect.toBe(
            simulatedTransition.swap.tokenFee,
            'gte',
            feeWalletBalanceChange,
            EXPECT_LARGER_SIMULATED_FEE,
          )
        })
      })
      describe.skip('Using DPM Proxy', function () {
        supportedStrategies.forEach(({ name: strategy }) => {
          let position: IPosition
          let simulatedPosition: IPosition
          let simulatedTransition: PositionTransition['simulation']
          let feeWalletBalanceChange: BigNumber

          before(async function () {
            const { dpmPositions } = env
            const positionDetails = dpmPositions[strategy]
            if (!positionDetails) {
              this.skip()
            }
            position = await positionDetails.getPosition()
            simulatedPosition = positionDetails.__openPositionSimulation.position
            simulatedTransition = positionDetails.__openPositionSimulation
            feeWalletBalanceChange = positionDetails.__feeWalletBalanceChange
          })

          it(`Should draw the correct amount of debt for ${strategy}`, async () => {
            expect.toBe(
              simulatedPosition.debt.amount.toFixed(0),
              'lte',
              position.debt.amount.toFixed(0),
            )
          })
          it(`Should deposit all collateral for ${strategy}`, async () => {
            expect.toBe(
              simulatedPosition.collateral.amount,
              'lte',
              position.collateral.amount.toFixed(0),
            )
          })
          it(`Should have the correct multiple for ${strategy}`, async () => {
            expect.toBe(position.riskRatio.multiple, 'lte', simulatedPosition.riskRatio.multiple)
          })
          it(`Should collect fee for ${strategy}`, async () => {
            expect.toBe(
              simulatedTransition.swap.tokenFee,
              'gte',
              feeWalletBalanceChange,
              EXPECT_LARGER_SIMULATED_FEE,
            )
          })
        })
      })
    })
  })
})
