import { strategies } from '@oasisdex/oasis-actions/src'
import BigNumber from 'bignumber.js'
import * as ethers from 'ethers'
import { task } from 'hardhat/config'

import AccountAbi from '../abi/account-implementation.json'

task('play').setAction(async (taskArgs, hre) => {
  const [, , signer] = await hre.ethers.getSigners()

  const poolAddress = '0xAd0A04Eb910Aa148F90E460b9D38228d434abA14'
  const poolInfoAddress = '0x09120eAED8e4cD86D85a616680151DAA653880F2'
  const ajnaProxyActions = '0x3E661784267F128e5f706De17Fac1Fc1c9d56f30'

  const userProxyAddress = '0x1d8B17D7ffa1168c2387F3441882Ee3Ad9480921'

  const proxy = new ethers.Contract(userProxyAddress, AccountAbi, signer)

  const strategy = await strategies.ajna.open(
    {
      poolAddress,
      collateralAmount: new BigNumber(12).pow(8),
      debtAmount: new BigNumber(320).pow(6),
      dpmProxyAddress: userProxyAddress,
      price: new BigNumber(210000),
    },
    { provider: hre.ethers.provider, poolInfoAddress, ajnaProxyActions },
  )

  const tx = await proxy.execute(strategy.tx.to, strategy.tx.data, { value: 0 })

  console.log(tx)

  console.log(`Playground`)
})
