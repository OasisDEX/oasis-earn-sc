import { ethers } from 'ethers';
import { Address } from '@oasisdex/dma-common/types/address';
export interface AjnaDependencies {
  poolInfoAddress: Address;
  ajnaProxyActions: Address;
  provider: ethers.providers.Provider;
  WETH: Address;
}
