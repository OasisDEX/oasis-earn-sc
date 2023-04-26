import init from '@dma-common/utils/init'
import { JsonRpcProvider } from '@ethersproject/providers'
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers'
import { ADDRESSES } from '@oasisdex/addresses'
import { deployPool, prepareEnv } from '@oasisdex/ajna-contracts/scripts'
import { expect } from 'chai'

describe('AJNA | POC | Unit', () => {
  let provider: JsonRpcProvider
  let snapshotId: string
  before(async () => {
    const config = await init()
    provider = config.provider
  })

  beforeEach(async () => {
    snapshotId = await provider.send('evm_snapshot', [])
  })

  afterEach(async () => {
    await provider.send('evm_revert', [snapshotId])
  })

  it('should work', async () => {
    const env = await loadFixture(prepareEnv)
    await deployPool(
      env.erc20PoolFactory,
      ADDRESSES.mainnet.common.WETH,
      ADDRESSES.mainnet.common.USDC,
    )
    expect(true).to.be.eq(true)
  })
})
