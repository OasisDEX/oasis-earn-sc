import erc20abi from '@abis/external/tokens/IERC20.json'
import { Network } from '@deploy-configurations/types/network'
import { addressesByNetwork } from '@dma-common/test-utils'
import { RuntimeConfig } from '@dma-common/types/common'
import { isMainnetByNetwork, isOptimismByNetwork } from '@dma-common/utils/common'
import { AAVETokens } from '@dma-library'
import BigNumber from 'bignumber.js'
import { constants } from 'ethers'
import { HardhatRuntimeEnvironment } from 'hardhat/types'

export type AAVETokensToGet = Exclude<AAVETokens, 'ETH' | 'WETH'>
const mainnetAddressesForTests = addressesByNetwork(Network.MAINNET)
const optimismAddressesForTests = addressesByNetwork(Network.OPTIMISM)
const tokensWhales: {
  [Network.MAINNET]: Record<AAVETokensToGet, { whale: string; tokenAddress: string }>
  [Network.OPTIMISM]: Record<AAVETokensToGet, { whale: string; tokenAddress: string }>
} = {
  [Network.MAINNET]: {
    STETH: {
      tokenAddress: mainnetAddressesForTests.STETH,
      whale: '0x6555e1CC97d3cbA6eAddebBCD7Ca51d75771e0B8',
    },
    WBTC: {
      tokenAddress: mainnetAddressesForTests.WBTC,
      whale: '0x051d091b254ecdbbb4eb8e6311b7939829380b27',
    },
    USDC: {
      whale: '0xdea0da1c96f1beb756d61225577ebdeb4bbd364e',
      tokenAddress: mainnetAddressesForTests.USDC,
    },
    WSTETH: {
      whale: '0xe1f8afc92644bfe77080d7dcb0f936f578e00f53',
      tokenAddress: mainnetAddressesForTests.WSTETH,
    },
  },
  [Network.OPTIMISM]: {
    STETH: {
      tokenAddress: optimismAddressesForTests.STETH,
      whale: constants.AddressZero,
    },
    WBTC: {
      tokenAddress: optimismAddressesForTests.WBTC,
      // ~3 WBTC as of Block number 97219392
      whale: '0x2ccef4910318c71b619f2303f2243bca305578e4',
    },
    USDC: {
      tokenAddress: optimismAddressesForTests.USDC,
      whale: '0xd165164cbAb65004Da73C596712687C16b981274',
    },
    WSTETH: {
      tokenAddress: optimismAddressesForTests.WSTETH,
      // ~872 WSTETH as of Block number 97219392
      whale: '0x766854992bd5363ebeeff0113f5a5795796befab',
    },
  },
}

export function buildGetTokenByImpersonateFunction(
  config: RuntimeConfig,
  hre: HardhatRuntimeEnvironment,
  network: Network,
): (symbol: AAVETokensToGet, amount: BigNumber) => Promise<boolean> {
  return async function getTokens(symbol: AAVETokensToGet, amount: BigNumber): Promise<boolean> {
    if (!(isMainnetByNetwork(network) || isOptimismByNetwork(network))) {
      throw new Error('Not implemented for this network yet')
    }
    const { tokenAddress, whale } = tokensWhales[network][symbol]

    const fromSigner = await hre.ethers.getSigner(whale)

    await config.signer.sendTransaction({
      from: await config.signer.getAddress(),
      to: whale,
      value: hre.ethers.utils.parseEther('1'),
      gasLimit: hre.ethers.utils.hexlify(1000000),
    })

    await hre.network.provider.request({
      method: 'hardhat_impersonateAccount',
      params: [whale],
    })

    const fromTokenContract = new hre.ethers.Contract(tokenAddress, erc20abi, fromSigner)

    await fromTokenContract.transfer(
      config.address,
      hre.ethers.utils.parseUnits(amount.toString(), 'wei'),
    )

    return true
  }
}
