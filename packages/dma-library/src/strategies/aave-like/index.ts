import { AaveLikeDepositBorrow, depositBorrow } from './borrow/deposit-borrow'

type AaveLike = {
  borrow: {
    depositBorrow: AaveLikeDepositBorrow
  }
}

export const aaveLike: AaveLike = {
  borrow: {
    depositBorrow,
  },
}
