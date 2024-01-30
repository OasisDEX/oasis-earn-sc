import { Address } from '@deploy-configurations/types/address'
import { Network } from '@deploy-configurations/types/network'
import { DeploymentSystem } from '@dma-contracts/scripts/deployment/deploy'
import { TestHelpers } from '@dma-contracts/utils'
import { sendImpersonateFunds } from '@dma-contracts/utils/send-impersonate-funds'
import { MockExchange } from '@typechain'
import { ethers } from 'ethers'
import { HardhatRuntimeEnvironment } from 'hardhat/types'

import { fetchAAVEContracts } from './aave'

export async function fundMockExchange(
  hre: HardhatRuntimeEnvironment,
  ds: DeploymentSystem,
  helpers: TestHelpers, // eslint-disable-line @typescript-eslint/no-unused-vars
  extraDeployment: any, // eslint-disable-line @typescript-eslint/no-unused-vars
  useFallbackSwap: boolean, // eslint-disable-line @typescript-eslint/no-unused-vars
) {
  const whaleAddress: Address = '0xD831B3353Be1449d7131e92c8948539b1F18b86A'
  const USDCAddress: Address = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'
  const DAIAddress: Address = '0x6b175474e89094c44da98b954eedeac495271d0f'
  const WETHAddress: Address = '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2'

  const { oracle } = await fetchAAVEContracts(hre, ds.getSystem().system, Network.MAINNET)
  const mockExchange = ds.getSystem().system.MockExchange.contract as MockExchange

  const WETH = await hre.ethers.getContractAt('IWETH', WETHAddress)

  await WETH.deposit({ value: ethers.utils.parseEther('1000') })

  await WETH.transfer(mockExchange.address, ethers.utils.parseEther('1000'))

  const signer = hre.ethers.provider.getSigner()

  await sendImpersonateFunds(
    hre,
    whaleAddress,
    DAIAddress,
    ethers.utils.parseEther('100000'),
    mockExchange.address,
  )

  const USDCPrice = await oracle.getAssetPrice(USDCAddress)
  const DAIPrice = await oracle.getAssetPrice(DAIAddress)
  const WETHPrice = await oracle.getAssetPrice(WETHAddress)

  // Scale prices by 10**10 because AAVE prices only use 8 decimals
  await mockExchange.setPrice(USDCAddress, USDCPrice.mul('10000000000'))
  await mockExchange.setPrice(DAIAddress, DAIPrice.mul('10000000000'))
  await mockExchange.setPrice(WETHAddress, WETHPrice.mul('10000000000'))
}
