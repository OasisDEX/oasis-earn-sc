import fs from 'fs'
import path from 'path'

const dmaContractsPath = path.join(__dirname, 'packages/dma-contracts/contracts')

const ajnaContractsPath = path.join(__dirname, 'packages/ajna-contracts/contracts')
const ajnaDirectoriesToSymlink = ['ajna', 'chainlink', 'tokens']

const morphoBluePath = path.join(__dirname, 'packages/morpho-blue/contracts')
const morphoBlueDirectoriesToSymlink = ['morphoblue']

function symlink(sourcePath: string, destinationPath: string, directories: string[]) {
  directories.forEach(sourceDir => {
    const fullSourcePath = path.join(sourcePath, sourceDir)
    const fullDestinationPath = path.join(destinationPath, sourceDir)

    if (fs.existsSync(fullDestinationPath)) {
      fs.unlinkSync(fullDestinationPath)
      console.log(`Removed existing symlink ${fullDestinationPath}`)
    }

    fs.symlinkSync(fullSourcePath, fullDestinationPath, 'dir')

    console.log(`Symlinked ${fullSourcePath} to ${fullDestinationPath}`)
  })
}

/*
 * Symlink the contracts from other packages to dma-contracts.
 *
 * This is necessary because Hardhat doesn't support compiling contracts from other packages. By doing this
 * we can compile those other contracts and use them in the tests.
 */
symlink(ajnaContractsPath, dmaContractsPath, ajnaDirectoriesToSymlink)
symlink(morphoBluePath, dmaContractsPath, morphoBlueDirectoriesToSymlink)
