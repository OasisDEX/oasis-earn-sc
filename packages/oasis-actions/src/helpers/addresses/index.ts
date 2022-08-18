import _ from 'lodash'

import AAVE_ADDRESSES from './aave.json'
import COMMON_ADDRESSES from './common.json'
import MAKER_ADDRESSES from './maker.json'

export const ADDRESSES = _.merge(AAVE_ADDRESSES, COMMON_ADDRESSES, MAKER_ADDRESSES)
