import IAccountGuardAbi from '@oasisdex/abis/external/libs/DPM/account-guard.json';
import IAccountImplementationAbi from '@oasisdex/abis/external/libs/DPM/account-implementation.json';
import { ethers } from 'ethers';

import type { Enviroment } from './enviroment';

export const changeAccountOwner = async (
  enviroment: Enviroment,
  account: string,
  newOwner: string,
): Promise<boolean> => {
  const provider = enviroment.provider;
  const accountInterface = new ethers.utils.Interface(
    IAccountImplementationAbi,
  );
  const guardInterface = new ethers.utils.Interface(IAccountGuardAbi);
  const contract = new ethers.Contract(account, accountInterface, provider);
  const guard = await contract.guard();
  const owner = await contract.owner();

  const encoded = guardInterface.encodeFunctionData('changeOwner', [
    newOwner,
    account,
  ]);
  try {
    await provider.send('eth_sendTransaction', [
      { from: owner, to: guard, input: encoded },
    ]);
    return true;
  } catch (error) {
    return false;
  }
};
