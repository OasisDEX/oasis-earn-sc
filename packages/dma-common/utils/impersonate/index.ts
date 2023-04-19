import hre from 'hardhat'

export const impersonateAccount = async (account: string) => {
  await hre.network.provider.request({
    method: 'hardhat_impersonateAccount',
    params: [account],
  })
}

export const stopImpersonatingAccount = async (account: string) => {
  await hre.network.provider.request({
    method: 'hardhat_stopImpersonatingAccount',
    params: [account],
  })
}
