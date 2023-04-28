import { RuntimeConfig } from '@dma-common/types/common';
import { Optional } from '@dma-common/types/optional';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
/**
 * tokenIn: string - asset address
 * tokenOut: string - asset address
 * amountIn: BigNumber - already formatted to wei
 * amountOutMinimum: BigNumber - already fromatted to wei. The least amount to receive.
 * recipient: string - wallet's addrees that's going to receive the funds
 */
export declare function swapUniswapTokens(tokenIn: string, tokenOut: string, amountIn: string, amountOutMinimum: string, recipient: string, { provider, signer }: Optional<Pick<RuntimeConfig, 'provider' | 'signer' | 'address'>, 'address'>, hre?: HardhatRuntimeEnvironment): Promise<void>;
//# sourceMappingURL=uniswap.d.ts.map