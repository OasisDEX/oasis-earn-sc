import { JsonRpcProvider } from '@ethersproject/providers'
import { ADDRESSES, OPERATION_NAMES, strategy } from '@oasisdex/oasis-actions/src'
import BigNumber from 'bignumber.js'
import { Contract, ethers } from 'ethers'
import hre from 'hardhat'

// import AAVELendigPoolABI from '../../abi/aaveLendingPool.json'
import AAVEDataProviderABI from '../abi/aaveDataProvider.json'
import { executeThroughProxy } from '../helpers/deploy'
import { amountToWei, balanceOf } from '../helpers/utils'

async function main() {
  const provider = new ethers.providers.JsonRpcProvider('http://localhost:8545', 2137)
  const signer = provider.getSigner(0)
  const aaveDataProvider = new Contract(
    ADDRESSES.main.aave.DataProvider,
    AAVEDataProviderABI,
    provider,
  )
  const options = {
    debug: true,
    config: { provider, signer, address: await signer.getAddress() },
  }

  const proxyAddress = '0xA1621286039861056d83B9Da8Da41d9261AC8b28'.toLowerCase()

  console.log('DEBUG: ETH')
  await balanceOf(ADDRESSES.main.ETH, '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266', options)

  console.log('DEBUG: ETH Proxy')
  await balanceOf(ADDRESSES.main.ETH, proxyAddress, options)

  const userStEthReserveDataProxy = await aaveDataProvider.getUserReserveData(
    ADDRESSES.main.stETH,
    proxyAddress,
  )
  console.log('userStEthReserveDataProxy:', userStEthReserveDataProxy)
  //
  // const userStEthReserveDataUser = await aaveDataProvider.getUserReserveData(
  //   ADDRESSES.main.stETH,
  //   '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'.toLowerCase(),
  // )
  // console.log('userStEthReserveDataUser:', userStEthReserveDataUser)
}

main()
