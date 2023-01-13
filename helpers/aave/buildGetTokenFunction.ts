import { AAVETokens } from '@oasisdex/oasis-actions'

import erc20abi from '../../abi/external/IERC20.json'
import { mainnetAddresses } from '../../test/addresses'
import { HardhatRuntimeConfig } from '../types/common'

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
}

export function buildGetTokenFunction(
  config: HardhatRuntimeConfig,
): (symbol: AAVETokensToGet, amount: string) => Promise<boolean> {
  return async function getTokens(symbol: AAVETokensToGet, amount: string): Promise<boolean> {
    const { tokenAddress, whale } = tokensWhales[symbol]
    const fromSigner = await config.ethers.getSigner(whale)

    await config.signer.sendTransaction({
      from: await config.signer.getAddress(),
      to: whale,
      value: config.ethers.utils.parseEther('1'),
      gasLimit: config.ethers.utils.hexlify(1000000),
    })

    await config.network.provider.request({
      method: 'hardhat_impersonateAccount',
      params: [whale],
    })

    const fromTokenContract = new config.ethers.Contract(tokenAddress, erc20abi, fromSigner)

    await fromTokenContract.transfer(config.address, config.ethers.utils.parseUnits(amount, 'wei'))

    return true
  }
}
