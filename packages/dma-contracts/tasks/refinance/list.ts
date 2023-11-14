import { getAvailableRefinanceOperationsNames } from '@dma-library'
import { task } from 'hardhat/config'

function listRefinanceOperations() {
  console.log('==============================')
  console.log('Refinance Operations')
  console.log('==============================')

  const refinanceOperationsNames = getAvailableRefinanceOperationsNames()
  if (!refinanceOperationsNames || refinanceOperationsNames.length === 0) {
    console.log('No operations found')
    return
  }

  refinanceOperationsNames.forEach((name: string) => {
    console.log(name)
  })
}

task('refinance-list', 'Allows to interact with the OperationsRegistry').setAction(
  async (taskArgs, hre) => {
    const { ethers } = hre

    // Disable the annoying duplicated definition warning
    ethers.utils.Logger.setLogLevel(ethers.utils.Logger.levels.ERROR)

    listRefinanceOperations()
  },
)
