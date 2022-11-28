const fetch = require('node-fetch')
const fs = require('fs')
const path = require('path')
const mainnetInfoUrl = 'https://blockexplorer.one/ajax/eth/mainnet/info'
const envFile = `${path.join(__dirname)}/.env`
const envFileBackup = `${path.join(__dirname)}/.env_bak`
const newLine = '\n'

const updateNumber = () => {
  fetch(mainnetInfoUrl)
    .then(res => res.json())
    .then(res => {
      console.log('')
      if (!res.height) {
        console.error('❌ Block height not found', res)
        return
      }
      if (!fs.existsSync(envFile)) {
        console.error(`❌ .env file not found (${envFile})`)
        return
      }
      if (!fs.existsSync(envFileBackup)) {
        fs.copyFile(envFile, envFileBackup, () => {
          console.log('✨ Made an .env backup at', envFileBackup)
        })
      }
      const blockHeight = res.height
      console.log('😊 Found block height:', blockHeight)
      const envFileContents = fs.readFileSync(envFile, 'utf8')
      const envFileContentLines = envFileContents.split(newLine)
      const filteredEnvFileContentLines = envFileContentLines.map(line =>
        line.startsWith('BLOCK_NUMBER') ? `BLOCK_NUMBER=${blockHeight - 50}` : line,
      )
      try {
        fs.writeFileSync(envFile, filteredEnvFileContentLines.join(newLine))
        console.log('🙌 Updated the block number with', blockHeight - 50, '(latest block minus 50)')
      } catch (error) {
        console.error(`❌ Could not update the block number (${error})`)
      }
      console.log('')
    })
}
updateNumber()
