import fs from 'fs'
import path from 'path'

const ajnaContractsPath = path.join(__dirname, 'packages/ajna-contracts/contracts')
const dmaContractsPath = path.join(__dirname, 'packages/dma-contracts/contracts')

const directoriesToSymlink = ['ajna', 'chainlink', 'tokens']

/*
 * Symlink the contracts from ajna-contracts to dma-contracts.
 * This is necessary because the DMA contracts need to be able to access the contracts and build artifacts
 * from the ajna-contracts package.
 * This allows the ajna system to be deployed to a node during testing in dma-contracts and enables dma-library development
 * and testing against ajna prior to ajna being deployed to mainnet and testnets.
 */
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
