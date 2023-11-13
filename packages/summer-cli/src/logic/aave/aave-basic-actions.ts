import AAVEPoolAbi from '@oasisdex/abis/external/protocols/aave/v3/pool.json';
import { Pool } from '@oasisdex/abis/types/ethers-contracts/protocols/aave/v3/pool';
import { Contract } from 'ethers';
import { Enviroment } from '../common/enviroment';
import { ADDRESSES, Address } from '@oasisdex/addresses';
import {
  SupportedTokens,
  getTokenAddress,
  tokenAmountToWei,
} from '../../utils/tokens';
import { sendTxFromAddress } from '../../utils/tx';

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

  const txData = await AavePool.supply.populateTransaction(
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
    await AavePool.setUserUseReserveAsCollateral.populateTransaction(
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

  const txData = await AavePool.borrow.populateTransaction(
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
