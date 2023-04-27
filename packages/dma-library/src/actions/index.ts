import { v2, v3 } from './aave'
import {
  positionCreated,
  pullToken,
  returnFunds,
  sendToken,
  setApproval,
  swap,
  takeAFlashLoan,
  unwrapEth,
  wrapEth,
} from './common'
import { openVault } from './maker'

const common = {
  pullToken,
  sendToken,
  setApproval,
  swap,
  returnFunds,
  positionCreated,
  wrapEth,
  unwrapEth,
  takeAFlashLoan,
}

const maker = {
  openVault,
}

const aave = {
  v2,
  v3,
}

const actions = { aave, common, maker }

export { actions }
