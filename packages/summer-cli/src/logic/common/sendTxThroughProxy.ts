import AccountAbi from '@oasisdex/abis/system/contracts/interfaces/dpm/IAccountImplementation.sol/IAccountImplementation.json';
import { IAccountImplementation } from '@oasisdex/abis/types/ethers-contracts/system/contracts/interfaces/dpm/IAccountImplementation';
import { Contract, ethers } from 'ethers';
import { sendTxFromAddress } from '../../utils/tx';


export async function sendTxThroughProxy(
  tx: ethers.PopulatedTransaction,
  proxyAddress: string,
  provider: ethers.providers.JsonRpcProvider) {
  const proxy = new Contract(proxyAddress, AccountAbi, provider) as any as IAccountImplementation;

  const proxtTx = await proxy.populateTransaction.execute(tx.to, tx.data);
  const owner = await proxy.owner();

  return sendTxFromAddress({...proxtTx, value: tx.value}, owner, provider);
}
