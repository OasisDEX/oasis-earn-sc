import { mainnetAddresses } from '@dma-contracts/test/addresses'
import erc20abi from '@oasisdex/abis/external/tokens/IERC20.json'
import { RuntimeConfig } from '@oasisdex/dma-common/types/common'
import { AAVETokens } from '@oasisdex/dma-library'
import BigNumber from 'bignumber.js'
import { HardhatRuntimeEnvironment } from 'hardhat/types'

export type AAVETokensToGet = Exclude<AAVETokens, 'ETH' | 'WETH'>
const tokensWhales: Record<AAVETokensToGet, { whale: string; tokenAddress: string }> = {
  STETH: {
    tokenAddress: mainnetAddresses.STETH,
    whale: '0x41318419cfa25396b47a94896ffa2c77c6434040',
  },
  WBTC: {
    tokenAddress: mainnetAddresses.WBTC,
    whale: '0x051d091b254ecdbbb4eb8e6311b7939829380b27',
  },
  USDC: {
    whale: '0xdea0da1c96f1beb756d61225577ebdeb4bbd364e',
    tokenAddress: mainnetAddresses.USDC,
  },
  WSTETH: {
    whale: '0xe1f8afc92644bfe77080d7dcb0f936f578e00f53',
    tokenAddress: mainnetAddresses.WSTETH,
  },
}

export function buildGetTokenByImpersonateFunction(
  config: RuntimeConfig,
  hre: HardhatRuntimeEnvironment,
): (symbol: AAVETokensToGet, amount: BigNumber) => Promise<boolean> {
  return async function getTokens(symbol: AAVETokensToGet, amount: BigNumber): Promise<boolean> {
    const { tokenAddress, whale } = tokensWhales[symbol]
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
