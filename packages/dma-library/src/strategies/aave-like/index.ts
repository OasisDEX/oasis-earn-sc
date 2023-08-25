import { AaveLikeDepositBorrow, depositBorrow } from './borrow/deposit-borrow'
import { AaveLikeOpenDepositBorrow, openDepositBorrow } from './borrow/open-deposit-borrow'

type AaveLike = {
  borrow: {
    depositBorrow: AaveLikeDepositBorrow
    openDepositBorrow: AaveLikeOpenDepositBorrow
  }
}

export const aaveLike: AaveLike = {
  borrow: {
    depositBorrow,
    openDepositBorrow,
  },
}
