import erc20abi from "@oasisdex/abis/external/tokens/IERC20.json";
import { addressesByNetwork } from "@oasisdex/dma-common/test-utils";
import { RuntimeConfig } from "@oasisdex/dma-common/types/common";
import { Network } from "@oasisdex/dma-deployments/types/network";
import { AAVETokens } from "@oasisdex/dma-library";
import BigNumber from "bignumber.js";
import { constants } from "ethers";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { isMainnetByNetwork } from "@oasisdex/dma-common/utils/common";

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
      whale: '0x41318419cfa25396b47a94896ffa2c77c6434040',
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
      whale: constants.AddressZero,
    },
    USDC: {
      tokenAddress: optimismAddressesForTests.USDC,
      whale: constants.AddressZero,
    },
    WSTETH: {
      tokenAddress: optimismAddressesForTests.WSTETH,
      whale: constants.AddressZero,
    },
  },
}

export function buildGetTokenByImpersonateFunction(
  config: RuntimeConfig,
  hre: HardhatRuntimeEnvironment,
  network: Network,
): (symbol: AAVETokensToGet, amount: BigNumber) => Promise<boolean> {
  return async function getTokens(symbol: AAVETokensToGet, amount: BigNumber): Promise<boolean> {
    if (!isMainnetByNetwork(network)) {
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
