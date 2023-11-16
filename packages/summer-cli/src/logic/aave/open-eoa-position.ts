import { ADDRESSES } from '@oasisdex/addresses';

import { SupportedTokens } from '../../utils/tokens';
import { throwOnRevertedTx } from '../../utils/tx';
import { Enviroment } from '../common/enviroment';
import { getTokens } from '../common/get-tokens';
import { setAllowance } from '../common/set-allowance';
import {
  aaveBorrow,
  aaveSupply,
  setAssetAsCollateral,
} from './aave-basic-actions';

export async function createEOAPosition(
  enviroment: Enviroment,
  assetToken: SupportedTokens,
  debtToken: SupportedTokens,
  depositAmount: number,
  borrowAmount: number,
) {
  const aaveAddress = ADDRESSES[enviroment.network].aave.v3.LendingPool;
  const walletAddress = await enviroment.walletSigner.getAddress();

  await getTokens(enviroment, assetToken, depositAmount).then(
    throwOnRevertedTx,
  );

  await setAllowance(
    enviroment,
    walletAddress,
    aaveAddress,
    assetToken,
    depositAmount,
  ).then(throwOnRevertedTx);

  await aaveSupply(
    enviroment,
    walletAddress,
    await enviroment.walletSigner.getAddress(),
    assetToken,
    depositAmount,
  ).then(throwOnRevertedTx);

  await setAssetAsCollateral(
    enviroment,
    await enviroment.walletSigner.getAddress(),
    assetToken,
  ).then(throwOnRevertedTx);

  if (borrowAmount <= 0) {
    return;
  }

  await aaveBorrow(enviroment, debtToken, borrowAmount).then(throwOnRevertedTx);
}
