import AAVEPoolAbi from '@oasisdex/abis/external/protocols/aave/v3/pool.json';
// eslint-disable-next-line import/no-unresolved
import { Pool } from '@oasisdex/abis/types/ethers-contracts/protocols/aave/v3/pool';
import { Address, ADDRESSES } from '@oasisdex/addresses';
import { Contract } from 'ethers';

import {
  getTokenAddress,
  SupportedTokens,
  tokenAmountToWei,
} from '../../utils/tokens';
import { sendTxFromAddress } from '../../utils/tx';
import { Enviroment } from '../common/enviroment';

enum AAVEBorrowRate {
  STABLE = 1,
  VARIABLE = 2,
}

function getAavePool(enviroment: Enviroment): Pool {
  const aaveAddress = ADDRESSES[enviroment.network].aave.v3.LendingPool;
  const AavePool = new Contract(
    aaveAddress,
    AAVEPoolAbi,
    enviroment.provider,
  ) as any as Pool;
  return AavePool;
}

export async function aaveSupply(
  enviroment: Enviroment,
  from: Address,
  onBehalfOf: Address,
  asset: SupportedTokens,
  amount: number,
) {
  const AavePool = getAavePool(enviroment);
  const assetAddress = getTokenAddress(asset, enviroment.network);

  const txData = await AavePool.populateTransaction.supply(
    assetAddress,
    tokenAmountToWei(asset, amount),
    onBehalfOf,
    0,
  );

  return sendTxFromAddress(txData, from, enviroment.provider);
}

export async function setAssetAsCollateral(
  enviroment: Enviroment,
  from: Address,
  asset: SupportedTokens,
) {
  const AavePool = getAavePool(enviroment);
  const assetAddress = getTokenAddress(asset, enviroment.network);

  const txData =
    await AavePool.populateTransaction.setUserUseReserveAsCollateral(
      assetAddress,
      true,
    );

  return sendTxFromAddress(txData, from, enviroment.provider);
}

export async function aaveBorrow(
  enviroment: Enviroment,
  debt: SupportedTokens,
  amount: number,
  rate: AAVEBorrowRate = AAVEBorrowRate.VARIABLE,
) {
  const AavePool = getAavePool(enviroment);
  const debtAddress = getTokenAddress(debt, enviroment.network);

  const txData = await AavePool.populateTransaction.borrow(
    debtAddress,
    tokenAmountToWei(debt, amount),
    rate,
    0,
    await enviroment.walletSigner.getAddress(),
  );

  return sendTxFromAddress(
    txData,
    await enviroment.walletSigner.getAddress(),
    enviroment.provider,
  );
}
