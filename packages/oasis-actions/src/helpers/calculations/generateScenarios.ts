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

const RANGE = 'Scenarios_to_Import!A1:I23'
//TODO: create Scenario type

export type Scenario = {
  name: string
  type: 'Open' | 'Increase multiple' | 'Decrease multiple'
  protocol: 'Maker' | 'AAVE'
  collateralAddedByUser: BigNumber
  debtAddedByUser: BigNumber
  targetCollateralRatio: BigNumber
  currentCollateral: BigNumber
  currentDebt: BigNumber
  oraclePrice: BigNumber
  marketPrice: BigNumber
  slippage: BigNumber
  marketPriceAdjustedForSlippage: BigNumber
  oazoFees: BigNumber
  flashloanFees: BigNumber
  liquidationRatio: BigNumber
  X: BigNumber
  Y: BigNumber
  isFlashLoanRequired: boolean
  debtDelta: BigNumber
  collateralDelta: BigNumber
  multiple: BigNumber
  targetCollateral: BigNumber
  targetDebt: BigNumber
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

generateTestScenarios()

export function mapRowsToScenarios(rows: any[][]): Scenario[] {
  const [, ...transposedRows] = rows[0].map((_, colIndex) => rows.map(row => row[colIndex]))

  const scenarios: Scenario[] = transposedRows.map(
    row =>
      ({
        name: row[0],
        type: row[1],
        protocol: row[2],
        collateralAddedByUser: prepareImportedNumber(row[3]),
        debtAddedByUser: prepareImportedNumber(row[4]),
        targetCollateralRatio: prepareImportedNumber(row[5]),
        currentCollateral: prepareImportedNumber(row[6]),
        currentDebt: prepareImportedNumber(row[7]),
        oraclePrice: prepareImportedNumber(row[8]),
        marketPrice: prepareImportedNumber(row[9]),
        slippage: prepareImportedNumber(row[10]),
        marketPriceAdjustedForSlippage: prepareImportedNumber(row[11]),
        oazoFees: prepareImportedNumber(row[12]),
        flashloanFees: prepareImportedNumber(row[13]),
        liquidationRatio: prepareImportedNumber(row[14]),
        X: prepareImportedNumber(row[15]),
        Y: prepareImportedNumber(row[16]),
        isFlashLoanRequired: getFlagValue(row[17]),
        debtDelta: prepareImportedNumber(row[18]),
        collateralDelta: prepareImportedNumber(row[19]),
        multiple: prepareImportedNumber(row[20]),
        targetDebt: prepareImportedNumber(row[21]),
        targetCollateral: prepareImportedNumber(row[22]),
      } as Scenario),
  )

  return scenarios
}

function prepareImportedNumber(numberLikeString: string): BigNumber {
  const noCommas = numberLikeString.replace(',', '')

  const isPercentage = noCommas.includes('%')
  const noPercentages = noCommas.replace('%', '')

  return isPercentage ? new BigNumber(noPercentages).div(100) : new BigNumber(noPercentages)
}

function getFlagValue(booleanLikeString: string) {
  return booleanLikeString === 'FALSE' ? false : true
}
