import fs from 'fs'
import path from 'path'

const ajnaContractsPath = path.join(__dirname, 'packages/ajna-contracts/contracts')
const dmaContractsPath = path.join(__dirname, 'packages/dma-contracts/contracts')

const directoriesToSymlink = ['ajna', 'chainlink', 'tokens']

directoriesToSymlink.forEach(dir => {
  const sourcePath = path.join(ajnaContractsPath, dir)
  const destinationPath = path.join(dmaContractsPath, dir)

  if (fs.existsSync(destinationPath)) {
    fs.unlinkSync(destinationPath)
    console.log(`Removed existing symlink ${destinationPath}`)
  }

  fs.symlinkSync(sourcePath, destinationPath, 'dir')
  console.log(`Symlinked ${sourcePath} to ${destinationPath}`)
})
