import { RuntimeConfig } from '@dma-common/types/common';
import BigNumber from 'bignumber.js';
import { Signer } from 'ethers';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
export declare function approve(asset: string, spender: string, amount: BigNumber, config: RuntimeConfig, debug?: boolean, hre?: HardhatRuntimeEnvironment): Promise<void>;
export declare function send(to: string, tokenAddr: string, amount: string, signer?: Signer, hre?: HardhatRuntimeEnvironment): Promise<void>;
//# sourceMappingURL=index.d.ts.map