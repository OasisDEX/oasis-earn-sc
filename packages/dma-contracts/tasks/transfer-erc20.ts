import { task } from 'hardhat/config'

import erc20abi from '../../abis/external/tokens/IERC20.json'

task('transfer-erc20', 'Transfers erc20 funds between two addresses.  Mainnet not supported :(')
  .addParam('from', 'Address of the wallet that we are transferring tokens from.')
  .addParam('to', 'Address of the wallet that we are transferring tokens to.')
  .addParam(
    'token',
    'The address of the token that we want to transfer.  The entire token balance will be transferred.',
  )
  .setAction(async (taskArgs, hre) => {
    const fromAddress = await taskArgs.from
    const fromSigner = await hre.ethers.getSigner(fromAddress)

    const toAddress = await taskArgs.to
    const toSigner = await hre.ethers.getSigner(toAddress)

    const tokenAddress = await taskArgs.token

    const ethProvider = hre.ethers.provider.getSigner(0)

    // send the rich some eth so that she can cover the gas costs of the transaction
    await ethProvider.sendTransaction({
      from: await ethProvider.getAddress(),
      to: fromAddress,
      value: hre.ethers.utils.parseEther('1'),
      gasLimit: hre.ethers.utils.hexlify(1000000),
    })

    console.log(`
    from  = ${fromAddress}
    to    = ${toAddress}
    token = ${tokenAddress}
    `)

    await hre.network.provider.request({
      method: 'hardhat_impersonateAccount',
      params: [fromAddress],
    })

    console.log(' ----------------------------- ')
    console.log('| starting balances for token |')
    console.log(' ----------------------------- ')
    const fromTokenContract = new hre.ethers.Contract(tokenAddress, erc20abi, fromSigner)
    let fromTokenBalance = await fromTokenContract.balanceOf(fromAddress)
    console.log(`from: ${fromTokenBalance}`)

    const toTokenContract = new hre.ethers.Contract(tokenAddress, erc20abi, toSigner)
    let toTokenBalance = await toTokenContract.balanceOf(toAddress)
    console.log(`to  : ${toTokenBalance}`)

    await fromTokenContract.transfer(toAddress, fromTokenBalance.toString())

    console.log(' --------------------------- ')
    console.log('| ending balances for token |')
    console.log(' --------------------------- ')
    fromTokenBalance = await fromTokenContract.balanceOf(fromAddress)
    console.log(`from: ${fromTokenBalance}`)
    toTokenBalance = await toTokenContract.balanceOf(toAddress)
    console.log(`to  : ${toTokenBalance}`)

    console.log(' --------------------------- ')
    console.log('done')
  })

export {}
