import BigNumber from 'bignumber.js'
import { default as dotenv } from 'dotenv'
import fs from 'fs'
import { google } from 'googleapis'
import path from 'path'
import process from 'process'

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly']

const CREDENTIALS_PATH = path.join(process.cwd(), './src/helpers/calculations/credentials.json')

dotenv.config({ path: path.join(process.cwd(), '../../.env') })

const auth = new google.auth.GoogleAuth({
  keyFile: CREDENTIALS_PATH,
  scopes: SCOPES,
})

// set auth as a global default
google.options({
  auth: auth,
})

const RANGE = 'Scenarios_to_Import!A1:K31'

export type Scenario = {
  name: string
  type: 'Open' | 'Increase multiple' | 'Decrease multiple'
  protocol: 'Maker' | 'AAVE'
  collateralDepositedByUser: BigNumber
  debtDenominatedTokensDepositedByUser: BigNumber
  targetLoanToValue: BigNumber
  currentCollateral: BigNumber
  currentDebt: BigNumber
  oraclePrice: BigNumber
  oraclePriceFLtoDebtToken: BigNumber
  marketPrice: BigNumber
  slippage: BigNumber
  marketPriceAdjustedForSlippage: BigNumber
  oazoFees: BigNumber
  flashloanFees: BigNumber
  liquidationThreshold: BigNumber
  liquidationThresholdFL: BigNumber
  maxLoanToValue: BigNumber
  maxLoanToValueFL: BigNumber
  amountToSwapOrSwappedAmountToPayback: BigNumber
  Y: BigNumber
  isFlashLoanRequired: boolean
  debtDelta: BigNumber
  collateralDelta: BigNumber
  multiple: BigNumber
  amountToFlashloan: BigNumber
  targetCollateral: BigNumber
  targetDebt: BigNumber
  healthFactor: BigNumber
  minOraclePrice: BigNumber
  feePaidFromBaseToken: BigNumber
  feePaidFromCollateralToken: BigNumber
}

export async function generateTestScenarios() {
  const sheets = google.sheets({ version: 'v4' })
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.SHEET_ID,
    range: RANGE,
  })

  const rows = res.data.values

  if (!rows || rows.length === 0) {
    console.log('No data found.')
    return
  }

  const data = JSON.stringify(rows)
  fs.writeFileSync(path.join(process.cwd(), './src/helpers/calculations/scenarios.json'), data)
}

export function mapRowsToScenarios(rows: any[][]): Scenario[] {
  const [, headers, ...transposedRows] = rows[0].map((_, colIndex) =>
    rows.map(row => row[colIndex]),
  )
  const scenarios: Scenario[] = transposedRows.map(row =>
    row.reduce((acc, cur, index) => {
      acc[headers[index]] = prepareImportedValue(cur)
      return acc
    }, {}),
  )

  return scenarios
}

function prepareImportedValue(numberLikeString: string): BigNumber | string | boolean {
  const noCommas = numberLikeString.replace(/,/g, '')
  const isPercentage = noCommas.includes('%')
  const noPercentages = noCommas.replace('%', '')

  const isNumberLike = !Number.isNaN(Number(noPercentages))
  const isBoolLike = ['FALSE', 'TRUE'].some(el => noPercentages.includes(el))

  if (isNumberLike) {
    return isPercentage ? new BigNumber(noPercentages).div(100) : new BigNumber(noPercentages)
  }
  if (isBoolLike) {
    return getFlagValue(noPercentages)
  }

  return noPercentages
}

function getFlagValue(booleanLikeString: string) {
  return booleanLikeString === 'FALSE' ? false : true
}
