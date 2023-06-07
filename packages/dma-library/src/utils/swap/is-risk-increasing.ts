import { IRiskRatio } from '@domain'

export const isRiskIncreasing = (currentMultiple: IRiskRatio, newMultiple: IRiskRatio) =>
  newMultiple.multiple.gte(currentMultiple.multiple)
