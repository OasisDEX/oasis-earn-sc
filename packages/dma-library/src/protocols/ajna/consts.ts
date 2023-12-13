export const ajnaCollateralizationFactor = 1.04

// This offset is needed for actions like paybackAll and withdrawAll because of the debt that is constantly growing over time
// performing these actions without this buffer would lead to issues with tx since params passed will be already out of date
// while sending tx
export const ajnaPaybackAllWithdrawAllValueOffset = 0.00005 // 0.005%
