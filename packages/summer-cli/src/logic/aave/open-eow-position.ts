import { Enviroment } from '../common/enviroment';
import { ADDRESSES } from '@oasisdex/addresses';
import { SupportedTokens, getTokenHolder } from '../../utils/tokens';
import { setAllowance } from '../common/set-allowance';
import { throwOnRevertedTx } from '../../utils/tx';
import { aaveSupply, setAssetAsCollateral, aaveBorrow } from './aave-basic-actions';

export async function createEOWPosition(enviroment: Enviroment, assetToken: SupportedTokens, debtToken: SupportedTokens, depositAmount: number, borrowAmount: number) {
    const aaveAddress = ADDRESSES[enviroment.network].aave.v3.LendingPool
    const guyWithAssets = getTokenHolder(assetToken, enviroment.network);

    await setAllowance(enviroment, guyWithAssets, aaveAddress, assetToken, depositAmount).then(throwOnRevertedTx);

    await aaveSupply(enviroment, guyWithAssets, await enviroment.walletSigner.getAddress(), assetToken, depositAmount).then(throwOnRevertedTx);

    await setAssetAsCollateral(enviroment, await enviroment.walletSigner.getAddress(), assetToken).then(throwOnRevertedTx);

    if(borrowAmount <= 0) {
        return;
    }

    await aaveBorrow(enviroment, debtToken, borrowAmount).then(throwOnRevertedTx);
}
