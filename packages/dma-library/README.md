# DMA Library

## What we have
Current solution wasn't really designed from the ground up, it rather had just one assumption how we structure and divide the responsibilities:
- Actions - bacis building block of the dma system, that included preparation of parameters for actions and paramsMapping.
- Operations - Combine actions into more complex entity, it should just be responsible for selecting and ordering actions.
- Strategy - top level of the library that should provide operation with calculations and return standaraised intereface for external consumers. 

The goal of the library was also to come up with standaralized the position interface.

## What went wrong

- Lack of tests, and hard to test in general.
- The Position interface and implementaion was too ridget, there was a lot of responsibility baked into the position class, we were extending the class whenever we needed something.
- There wasn't a clear idea for views, they emerged rather organicly.
- Complex type structure, many types extend other types creating long chains of dependencies.
- New approach introduced for ajna creating yet another standard. 

## What can we do better

[Sandbox](https://codesandbox.io/s/summer-sdk-mrszvj?file=/src/index.ts)

The idea in new approach would be to come up with a framework for handling new protocol. There should be a clear division of responsibilities, well typed and prepared in such way that we can accomadate different protocols features. 

There are some ideas how such `sdk` could look like. 

```
const sdk = makeSdk(mainnet)

sdk.getUserPositions("0xUser"): Promise<Maybe<Id[]>>

sdk.<protocol>.getPosition(dpmAddress: Address, (ilk, debt-coll,pool, maker)): Promise<Position<Protocol>>
or
sdk.getPosition(dpmAddress: Address, protocol: Protocol): Promise<Maybe<Position>>
sdk.getPosition("0x1234", sdk.Protocol.Maker)
sdk.getPosition("0x00", sdk.protocol.maker('eth-a')): Promise<Maybe<Position<Protocol.Maker>>>
sdk.getPosition("0x00", sdk.protocol.aave.v2('eth', 'dai')): Promise<Maybe<Position<Protocol.Maker>>>
sdk.getPosition("0x00", sdk.protocol.ajna('0xPool')): Promise<Maybe<Position<Protocol.Maker>>>

```

The idea is to have a Position interface that is generic and based on the protocol string literal we can narrow type to specific protocol data types. 

```
export function getLiqudationPenalty(
  position: LendingPosition<"MAKER">
): BigNumber {
  // this is just an example how can we handle specific protocol params
  return position.debtAmount.times(
    position.protocolData.protocolSpecificData.liquidationPenalty
  );
}

export function getLtv(position: LendingPosition<Protocol>): BigNumber {
  const debtValue = position.debtAmount.times(position.protocolData.debtPrice);
  const collateralValue = position.collateralAmount.times(
    position.protocolData.collateralPrice
  );

  return debtValue.div(collateralValue);
}
```

or maybe we can construct protocols from some modular interfaces

```
interface BasePosition<P extends Protocol> {
  proxy: Address;
  protocol: P;
}

interface WithSingleCollateral {
  collateralToken: Address;
  collateral: BigNumber;
}

interface WithSingleDebt {
  dobtToken: Address;
  debt: BigNumber;
}

interface WithCollateralPriceUSD {
  collateralPriceUSD: BigNumber;
}

interface WithDebtPriceUSD {
  debtPriceUSD: BigNumber;
}

interface WithLiquidationPenalty {
  liquidationPenalty: BigNumber;
}

type MakerPosition = BasePosition<"MAKER"> &
  WithSingleCollateral &
  WithSingleDebt &
  WithCollateralPriceUSD &
  WithDebtPriceUSD &
  WithLiquidationPenalty;

type MorphoPosition = BasePosition<"MORPHO_BLUE"> &
  WithSingleCollateral &
  WithSingleDebt &
  WithCollateralPriceUSD &
  WithDebtPriceUSD &
  WithLiquidationPenalty;

type LtvPosition = WithSingleCollateral &
  WithSingleDebt &
  WithCollateralPriceUSD &
  WithDebtPriceUSD;

function getLtv(position: LtvPosition) {
  return position.debt
    .times(position.debtPriceUSD)
    .div(position.collateral.times(position.collateralPriceUSD));
}
```
