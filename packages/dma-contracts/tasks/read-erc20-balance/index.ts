import { task } from 'hardhat/config'

import { amountFromWei } from '../../../dma-common/utils/common'
import erc20abi from '../../abi/external/IERC20.json'

task('read-erc20-balance', 'Reads the balance of an erc-20 for an account, in wei')
  .addParam('account', 'Address for which we are checking the balance.')
  .addParam('token', 'ERC20 for which we are checking the balance')
  .setAction(async (taskArgs, hre) => {
    const accountAddress = await taskArgs.account
    const fromSigner = await hre.ethers.getSigner(accountAddress)
    const tokenAddress = await taskArgs.token

    const fromTokenContract = new hre.ethers.Contract(tokenAddress, erc20abi, fromSigner)
    const tokenSymbol = await fromTokenContract.symbol()
    const precision = await fromTokenContract.decimals()
    const tokenBalance = (await fromTokenContract.balanceOf(accountAddress)).toString()
    const humanBalance = amountFromWei(tokenBalance, precision)

    console.log('========================================================')
    console.log(`account: ${accountAddress}`)
    console.log(`token:   ${tokenAddress}`)
    console.log(`balance: ${humanBalance.toString()} ${tokenSymbol}`)
    console.log(`         (${tokenBalance} wei)`)
    console.log('========================================================')
  })

export {}
