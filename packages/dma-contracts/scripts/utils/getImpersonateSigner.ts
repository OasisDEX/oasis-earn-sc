import type { ethers } from 'ethers'
import type { HardhatRuntimeEnvironment } from 'hardhat/types'

export const impersonationEnabled = (): boolean => {
  return process.env.IMPERSONATE_ENABLED === 'true'
}

/**
 * Get the signer for the address in the env.IMPERSONATE_ADDRESSs to impersonate
 */
export const getImpersonationSigner = async (
  hre: HardhatRuntimeEnvironment,
): Promise<ethers.Signer> => {
  const address = process.env.IMPERSONATE_ADDRESS
  if (!address) {
    throw new Error('IMPERSONATE_ADDRESS env variable is required')
  }

  // add impersonate account
  await hre.network.provider.request({
    method: 'hardhat_impersonateAccount',
    params: [address],
  })
  // get the signer
  const signer = await hre.ethers.getSigner(address)
  // add funds to the signer
  await hre.network.provider.send('hardhat_setBalance', [
    address,
    '0x56BC75E2D63100000', // 1000 ETH
  ])

  return signer
}
