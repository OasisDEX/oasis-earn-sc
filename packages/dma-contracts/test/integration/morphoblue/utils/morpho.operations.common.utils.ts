import { DeployedSystem } from '@deploy-configurations/types/deployed-system'
import { executeThroughDPMProxy, getDPMParamsForOperationExecutor } from '@dma-common/utils/execute'
import { TestDeploymentSystem, TestHelpers } from '@dma-contracts/utils'
import { MorphoSystem, TokensDeployment } from '@morpho-blue'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { AccountImplementation } from '@typechain'
import { BigNumber, ContractReceipt } from 'ethers'

export type MorphoMarketStatus = {
  totalSupplyAssets: BigNumber
  totalSupplyShares: BigNumber
  totalBorrowAssets: BigNumber
  totalBorrowShares: BigNumber
  lastUpdate: BigNumber
  fee: BigNumber
}

export type MorphoMarketPosition = {
  supplyShares: BigNumber
  borrowShares: BigNumber
  collateral: BigNumber
}

// Helper functions
export function getContextFromTestSystem(testSystem: TestDeploymentSystem): {
  system: DeployedSystem
  morphoSystem: MorphoSystem
  tokensDeployment: TokensDeployment
  testHelpers: TestHelpers
  userDPMProxy: AccountImplementation
} {
  const system = testSystem.deployment.system
  const morphoSystem = testSystem.extraDeployment.system as MorphoSystem
  const tokensDeployment = morphoSystem.tokensDeployment
  const testHelpers = testSystem.helpers
  const userDPMProxy = testSystem.helpers.userDPMProxy

  return { system, morphoSystem, tokensDeployment, testHelpers, userDPMProxy }
}

export async function executeOperation(
  system: DeployedSystem,
  user: SignerWithAddress,
  userDPMProxy: AccountImplementation,
  calls: any[],
  operationName: string,
): Promise<{
  success: boolean
  receipt: ContractReceipt
}> {
  const opExecutorParams = getDPMParamsForOperationExecutor(
    system.OperationExecutor.contract,
    calls,
    operationName,
  )

  const [success, receipt] = await executeThroughDPMProxy(
    userDPMProxy.address,
    opExecutorParams,
    user,
  )

  return { success, receipt }
}
