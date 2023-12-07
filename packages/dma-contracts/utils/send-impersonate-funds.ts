import { Address } from '@deploy-configurations/types/address'
import { ERC20, ERC20__factory } from '@typechain'
import { BigNumber } from 'ethers'
import { HardhatRuntimeEnvironment } from 'hardhat/types'

function isAddress(address: Address | ERC20): address is Address {
  return typeof address === 'string'
}

export async function sendImpersonateFunds(
  hre: HardhatRuntimeEnvironment,
  impersonateAccountAddress: Address,
  token: ERC20 | Address,
  amount: BigNumber,
  tokenReceiver: Address,
) {
  await hre.network.provider.request({
    method: 'hardhat_impersonateAccount',
    params: [impersonateAccountAddress],
  })

  const newSigner = await hre.ethers.getSigner(impersonateAccountAddress)
  let tokenContract: ERC20

  if (isAddress(token)) {
    tokenContract = ERC20__factory.connect(token, newSigner)
  } else {
    tokenContract = token.connect(newSigner)
  }

  await tokenContract.transfer(tokenReceiver, amount)

  await hre.network.provider.request({
    method: 'hardhat_stopImpersonatingAccount',
    params: [impersonateAccountAddress],
  })
}
