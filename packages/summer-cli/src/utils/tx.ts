import {
  ContractTransaction,
  JsonRpcProvider,
  TransactionReceipt,
} from 'ethers';

export async function sendTxFromAddress(
  tx: ContractTransaction,
  from: string,
  provider: JsonRpcProvider,
): Promise<TransactionReceipt> {
  const txToSend = {
    ...tx,
    from,
  };

  const txHash = await provider.send('eth_sendTransaction', [txToSend]);

  return provider.getTransactionReceipt(txHash);
}

export function throwOnRevertedTx(tx: TransactionReceipt): TransactionReceipt {
  if (tx.status === 0) {
    throw new Error(`Transaction ${tx.hash} reverted`);
  }
  return tx;
}
