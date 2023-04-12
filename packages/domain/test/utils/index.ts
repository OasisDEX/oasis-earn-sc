import BigNumber from 'bignumber.js'
import * as dotenv from 'dotenv'
import * as fs from 'fs'
import { google } from 'googleapis'
import * as path from 'path'
import * as process from 'process'

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly']

const CREDENTIALS_PATH = path.join(process.cwd(), 'credentials.json')

dotenv.config({ path: path.join(process.cwd(), '../../.env') })

const auth = new google.auth.GoogleAuth({
  keyFile: CREDENTIALS_PATH,
  scopes: SCOPES,
})

// set auth as a global default
google.options({
  auth: auth,
})

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

export async function fetchTestScenarios<S>(range: string): Promise<Array<S>> {
  const scenariosFilePath = generateFilepathForRange(range)

  if (fs.existsSync(scenariosFilePath)) {
    const data = JSON.parse(fs.readFileSync(scenariosFilePath, { encoding: 'utf8' }))

    return mapRowsToScenarios<S>(data)
  } else {
    console.error(`No file found for range ${range}.  Checked ${scenariosFilePath}`)
    throw new Error(`No test scenarios found for range ${range}`)
  }
}

export function mapRowsToScenarios<S>(rows: string[][]): S[] {
  const [, headers, ...transposedRows] = rows[0].map((_, colIndex) =>
    rows.filter(row => !!row[colIndex]).map(row => row[colIndex]),
  )
  const scenarios: S[] = transposedRows.map(row =>
    row.reduce<S>((acc, cur, index) => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      acc[headers[index]] = prepareImportedValue(cur)
      return acc
    }, {} as S),
  )
  return scenarios
}

function generateFilepathForRange(range: string) {
  return path.join(__dirname, `../scenarios/${range}.json`)
}

export async function generateTestScenarios(range: string) {
  const sheets = google.sheets({ version: 'v4' })
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.SHEET_ID,
    range: range,
  })

  const rows = res.data.values

  if (!rows || rows.length === 0) {
    console.log('No data found.')
    return
  }

  const data = JSON.stringify(rows, null, 2)
  const filePath = generateFilepathForRange(range)
  fs.writeFileSync(filePath, data, { encoding: 'utf8' })
}
