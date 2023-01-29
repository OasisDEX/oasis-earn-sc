import { ADDRESSES } from '@oasisdex/oasis-actions/src'
import { Contract, ethers } from 'ethers'

import AAVEDataProviderABI from '../abi/aaveDataProvider.json'
import { balanceOf } from '../helpers/utils'

async function main() {
  const provider = new ethers.providers.JsonRpcProvider('http://localhost:8545', 2137)
  const signer = provider.getSigner(0)
  const aaveDataProvider = new Contract(
    ADDRESSES.mainnet.aave.DataProvider,
    AAVEDataProviderABI,
    provider,
  )
  const options = {
    debug: true,
    config: { provider, signer, address: await signer.getAddress() },
  }

  const proxyAddress = '0xA1621286039861056d83B9Da8Da41d9261AC8b28'.toLowerCase()

  console.log('DEBUG: ETH User')
  await balanceOf(ADDRESSES.mainnet.ETH, '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266', options)

  console.log('DEBUG: ETH Proxy')
  await balanceOf(ADDRESSES.mainnet.ETH, proxyAddress, options)

  const userStEthReserveDataProxy = await aaveDataProvider.getUserReserveData(
    ADDRESSES.mainnet.STETH,
    proxyAddress,
  )
  console.log('userStEthReserveDataProxy:', userStEthReserveDataProxy)
}

main()
