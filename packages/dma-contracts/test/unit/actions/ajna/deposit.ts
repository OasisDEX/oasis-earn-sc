import { deployPool, prepareEnv } from '@ajna-contracts/scripts'
import { ADDRESSES } from '@deploy-configurations/addresses'
import init from '@dma-common/utils/init'
import { JsonRpcProvider } from '@ethersproject/providers'
import { expect } from 'chai'
import { HardhatRuntimeEnvironment } from 'hardhat/types'

describe('AJNA | POC | Unit', () => {
  let provider: JsonRpcProvider
  let snapshotId: string
  let hre: HardhatRuntimeEnvironment
  before(async () => {
    const config = await init()
    hre = (config as any).hre
    provider = config.provider
  })

  beforeEach(async () => {
    snapshotId = await provider.send('evm_snapshot', [])
  })

  afterEach(async () => {
    await provider.send('evm_revert', [snapshotId])
  })

  it('should work', async () => {
    const env = await prepareEnv(hre)
    await deployPool(
      env.erc20PoolFactory,
      ADDRESSES.mainnet.common.WETH,
      ADDRESSES.mainnet.common.USDC,
    )
    expect(true).to.be.eq(true)
  })
})
