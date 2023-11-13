import { ContractTransaction, JsonRpcProvider } from 'ethers';


export async function sendTxFromAddress(tx: ContractTransaction, from: string, provider: JsonRpcProvider): Promise<string> {
  const txToSend = {
    ...tx,
    from,
  };

  return provider.send('eth_sendTransaction', [txToSend]);
}
