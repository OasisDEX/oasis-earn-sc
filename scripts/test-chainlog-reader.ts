import { expect } from 'chai'

import { createDeploy } from '../helpers/deploy'
import init from '../helpers/init'

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

  console.log('cdpManagerAddress', cdpManagerAddress)
  console.log('EthAJoinAddress', ethAJoinAddress)
  console.log('EthAJoinAddressFromHash', ethAJoinAddressFromHash)

  expect(ethAJoinAddress).to.equal(ethAJoinAddressFromHash)
}

main().catch(error => {
  console.error(error)
  process.exitCode = 1
})
