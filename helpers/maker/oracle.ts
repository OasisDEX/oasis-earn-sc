import { JsonRpcProvider } from '@ethersproject/providers'
import BigNumber from 'bignumber.js'

import { ADDRESSES } from '../addresses'

export async function getOraclePrice(
  provider: JsonRpcProvider,
  pipAddress = ADDRESSES.main.maker.pipWETH,
): Promise<BigNumber> {
  const storageHexToBigNumber = (uint256: string) => {
    const matches = uint256.match(/^0x(\w+)$/)
    if (!matches?.length) {
      throw new Error(`invalid uint256: ${uint256}`)
    }

    const match = matches[0]
    return match.length <= 32
      ? [new BigNumber(0), new BigNumber(uint256)]
      : [
          new BigNumber(`0x${match.substring(0, match.length - 32)}`),
          new BigNumber(`0x${match.substring(match.length - 32, match.length)}`),
        ]
  }
  const slotCurrent = 3
  const priceHex = await provider.getStorageAt(pipAddress, slotCurrent)
  const p = storageHexToBigNumber(priceHex)
  return p[1].shiftedBy(-18)
}
