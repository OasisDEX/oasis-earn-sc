import { addressesByNetwork } from '@oasisdex/dma-common/test-utils'
import { amountToWei } from '@oasisdex/dma-common/utils/common'
import { swapOneInchTokens } from '@oasisdex/dma-common/utils/swap'
import { Network } from '@oasisdex/dma-deployments/types/network'
import BigNumber from 'bignumber.js'
import { task } from 'hardhat/config'

const mainnetAddresses = addressesByNetwork(Network.MAINNET)

const tokens = {
  STETH: mainnetAddresses.STETH,
  WETH: mainnetAddresses.WETH,
  WBTC: mainnetAddresses.WBTC,
  USDC: mainnetAddresses.USDC,
  DAI: mainnetAddresses.DAI,
  WSTETH: mainnetAddresses.WSTETH,
}

task('getTokens', '')
  .addOptionalParam<string>('to', 'Account to transfer tokens')
  .setAction(async (taskArgs, hre) => {
    const signer = hre.ethers.provider.getSigner(0)
    const recipient = taskArgs.to || (await signer.getAddress())
    const tokensToGet = taskArgs.token
      ? Object.entries(tokens).filter(([token]) => token === taskArgs.token.toUpperCase())
      : Object.entries(tokens)

    const entryBalance = await signer.getBalance()

    console.log(`Entry balance of account: ${entryBalance.toString()}`)

    const tokenAmounts = amountToWei(new BigNumber(1000))
    const swapAmount = amountToWei(new BigNumber(999))

    for (const [token, tokenAddress] of tokensToGet) {
      await hre.network.provider.send('hardhat_setBalance', [
        await signer.getAddress(),
        '0x' + tokenAmounts.toString(16),
      ])
      const response = await swapOneInchTokens(
        mainnetAddresses.ETH,
        tokenAddress,
        swapAmount.toString(),
        recipient,
        '5',
      )

      console.log(`Swapping ETH for ${token}`)
      try {
        await signer.sendTransaction({
          to: response.tx.to,
          data: response.tx.data,
          value: '0x' + new BigNumber(response.tx.value).toString(16),
        })
      } catch (e) {
        console.log(e)
        console.log(`Could not swap ETH for ${token}`)
      }
    }

    console.log(`Setting entry balance`)
    await hre.network.provider.send('hardhat_setBalance', [
      await signer.getAddress(),
      hre.ethers.utils.hexValue(entryBalance),
    ])
  })
