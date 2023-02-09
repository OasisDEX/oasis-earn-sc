import BigNumber from 'bignumber.js'
import {
  ChangeVariantType,
  ContentCardProps,
  DetailsSectionContentCard,
} from 'components/DetailsSectionContentCard'
import { formatAmount } from 'helpers/formatters/format'
import { useTranslation } from 'next-i18next'
import React from 'react'

interface ContentCardCollateralLockedProps {
  collateralToken: string
  collateralLocked: BigNumber
  afterCollateralLocked?: BigNumber
  collateralLockedUSD: BigNumber
  changeVariant?: ChangeVariantType
}

export function ContentCardCollateralLocked({
  collateralToken,
  collateralLocked,
  afterCollateralLocked,
  collateralLockedUSD,
  changeVariant = 'positive',
}: ContentCardCollateralLockedProps) {
  const { t } = useTranslation()

  const formatted = {
    loanToValue: formatAmount(collateralLocked, collateralToken),
    afterCollateralLocked: afterCollateralLocked && formatAmount(collateralLocked, collateralToken),
    collateralLockedUSD: `$${formatAmount(collateralLockedUSD, 'USD')}`,
  }

  const contentCardSettings: ContentCardProps = {
    title: t('ajna.borrow.common.overview.collateral-locked'),
    value: formatted.loanToValue,
    unit: collateralToken,
    footnote: formatted.collateralLockedUSD,
  }

  if (afterCollateralLocked !== undefined)
    contentCardSettings.change = {
      value: `${formatted.afterCollateralLocked} ${t('system.cards.common.after')}`,
      variant: changeVariant,
    }

  return <DetailsSectionContentCard {...contentCardSettings} />
}