import { createDeploy } from '@dma-common/utils/deploy'
import init from '@dma-common/utils/init'
import { expect } from 'chai'

async function main() {
  const config = await init()

  const options = {
    debug: true,
    config,
  }

  const deploy = await createDeploy(options)

  const chainlogAddress = '0xdA0Ab1e0017DEbCd72Be8599041a2aa3bA7e740F'
  const [chainLogView] = await deploy('ChainLogView', [chainlogAddress])

  const cdpManagerAddress = await chainLogView.getServiceAddress('CDP_MANAGER')
  const ethAJoinAddress = await chainLogView.getIlkJoinAddressByName('ETH_A')
  const ethAJoinAddressFromHash = await chainLogView.getIlkJoinAddressByHash(
    '0x4554485f41000000000000000000000000000000000000000000000000000000',
  )
  const psmPaxJoinAddress = await chainLogView.getIlkJoinAddressByName('PSM_PAX_A')
  const psmPaxJoinAddressFromHash = await chainLogView.getIlkJoinAddressByHash(
    '0x50534d2d5041582d410000000000000000000000000000000000000000000000',
  )

  console.log('cdpManagerAddress', cdpManagerAddress)
  console.log('EthAJoinAddress', ethAJoinAddress)
  console.log('EthAJoinAddressFromHash', ethAJoinAddressFromHash)
  console.log('psmPaxJoinAddress', psmPaxJoinAddress)
  console.log('psmPaxJoinAddressFromHash', psmPaxJoinAddressFromHash)

  expect(ethAJoinAddress).to.equal(ethAJoinAddressFromHash)
  expect(psmPaxJoinAddress).to.equal(psmPaxJoinAddressFromHash)
}

main().catch(error => {
  console.error(error)
  process.exitCode = 1
})
