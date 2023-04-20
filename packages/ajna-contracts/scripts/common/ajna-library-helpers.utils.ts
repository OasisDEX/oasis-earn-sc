import { strategies, views } from "@oasisdex/oasis-actions";
import { BigNumber as BN } from "bignumber.js";
import { BigNumber, Contract, ethers, providers, Signer } from "ethers";

import { AjnaProxyActions, ERC20Pool, IAccountImplementation, PoolInfoUtils, Token, WETH } from "../../typechain-types";

function createOpenOrDeposit(fnName: "open" | "depositBorrow") {
  return async function (
    ajnaProxyActionsContract: AjnaProxyActions,
    poolContract: ERC20Pool,
    collateralToken: Token | WETH,
    collateralPrecision: number,
    quotePrecision: number,
    borrowerProxy: IAccountImplementation,
    borrower: Signer,
    collateralAmount: BigNumber,
    quoteAmount: BigNumber,
    price: BigNumber,
    poolInfoAddress: PoolInfoUtils,
    provider: providers.Provider,
    weth: WETH
  ) {
    const openStrategy = await strategies.ajna[fnName](
      {
        position: await views.ajna.getPosition(
          {
            proxyAddress: borrowerProxy.address,
            poolAddress: poolContract.address,
          },
          { poolInfoAddress: poolInfoAddress.address, provider }
        ),
        collateralAmount: new BN(collateralAmount.toString()),
        collateralTokenPrecision: collateralPrecision,
        quoteAmount: new BN(quoteAmount.toString()),
        quoteTokenPrecision: quotePrecision,
        dpmProxyAddress: borrowerProxy.address,
        poolAddress: poolContract.address,
        // @ts-ignore
        price: BigNumber.from(price.toString()),
      },
      {
        ajnaProxyActions: ajnaProxyActionsContract.address,
        poolInfoAddress: poolInfoAddress.address,
        provider,
        WETH: weth.address,
      }
    );

    await collateralToken
      .connect(borrower)
      .approve(borrowerProxy.address, ethers.utils.parseUnits(collateralAmount.toString(), collateralPrecision));
    const tx = await borrowerProxy.connect(borrower).execute(openStrategy.tx.to, openStrategy.tx.data, {
      gasLimit: 3000000,
      value: openStrategy.tx.value,
    });
    await tx.wait();
    return tx;
  };
}
export async function withdrawCollateralAndRepayQuote(
  ajnaProxyActionsContract: Contract,
  poolContract: Contract,
  borrowToken: Contract,
  collateralPrecision: number,
  quotePrecision: number,
  borrowerProxy: Contract,
  borrower: Signer,
  collateralAmount: BigNumber,
  debtAmount: BigNumber,
  poolInfo: Contract,
  provider: providers.Provider,
  WETH: string
) {
  const withdrawStrategy = await strategies.ajna.paybackWithdraw(
    {
      position: await views.ajna.getPosition(
        {
          proxyAddress: borrowerProxy.address,
          poolAddress: poolContract.address,
        },
        { poolInfoAddress: poolInfo.address, provider }
      ),
      collateralAmount: new BN(collateralAmount.toString()),
      quoteAmount: new BN(debtAmount.toString()),
      quoteTokenPrecision: quotePrecision,
      collateralTokenPrecision: collateralPrecision,
      dpmProxyAddress: borrowerProxy.address,
      poolAddress: poolContract.address,
    },
    {
      ajnaProxyActions: ajnaProxyActionsContract.address,
      poolInfoAddress: poolInfo.address,
      provider,
      WETH,
    }
  );

  await borrowToken
    .connect(borrower)
    .approve(borrowerProxy.address, ethers.utils.parseUnits(debtAmount.toString(), quotePrecision));
  const tx = await borrowerProxy.connect(borrower).execute(withdrawStrategy.tx.to, withdrawStrategy.tx.data, {
    gasLimit: 3000000,
    value: withdrawStrategy.tx.value,
  });

  await tx.wait();

  return tx;
}

export const openPosition = createOpenOrDeposit("open");

export const depositCollateralAndDrawQuote = createOpenOrDeposit("depositBorrow");

export async function provideLiquidity(
  usdc: Contract,
  lender: Signer,
  poolContract: Contract,
  amount: BigNumber,
  bucketIndex: BigNumber,
  getExpiryTimestamp: () => Promise<number>
) {
  const amountWei = ethers.utils.parseUnits(amount.toString(), 18);
  await usdc.connect(lender).approve(poolContract.address, amountWei);
  const expiry = await getExpiryTimestamp();
  const tx = await poolContract.connect(lender).addQuoteToken(amountWei, bucketIndex, expiry);
  await tx.wait();
}
