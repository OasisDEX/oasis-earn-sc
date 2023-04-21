import { ADDRESSES } from '@oasisdex/addresses'
import { getAddressesFor } from '@oasisdex/dma-common/utils/common'
import { Network } from '@oasisdex/dma-deployments/types/network'
import { task } from 'hardhat/config'

task('verify-earn', 'Verifies Earn Contracts').setAction(async (_: any, hre) => {
  const { name: network } = hre.network
  console.log(`Network: ${network}. Verifying contracts...\n`)
  const {
    AUTOMATION_SERVICE_REGISTRY: SERVICE_REGISTRY,
    OPERATION_EXECUTOR,
    OPERATION_STORAGE,
    OPERATIONS_REGISTRY,
    SWAP,
    PULL_TOKEN_ACTION,
    SEND_TOKEN_ACTION,
    SET_APPROVAL_ACTION,
    SWAP_ACTION,
    TAKE_FLASHLOAN_ACTION,
    UNWRAP_ETH_ACTION,
    WRAP_ETH_ACTION,
    RETURN_FUNDS_ACTION,
    AAVE_BORROW_ACTION,
    AAVE_DEPOSIT_ACTION,
    AAVE_WITHDRAW_ACTION,
    AAVE_PAYBACK_ACTION,
    POSITION_CREATED_ACTION,
    DAI,
  } = await getAddressesFor(network as Network)

  const contracts = [
    {
      address: OPERATION_STORAGE,
      constructorArguments: [SERVICE_REGISTRY, OPERATION_EXECUTOR],
    },
    {
      address: OPERATION_EXECUTOR,
      constructorArguments: [SERVICE_REGISTRY],
    },
    {
      address: OPERATIONS_REGISTRY,
      constructorArguments: [],
    },
    {
      address: SWAP,
      constructorArguments: [
        ADDRESSES[Network.MAINNET].common.AuthorizedCaller,
        ADDRESSES[Network.MAINNET].common.FeeRecipient,
        20,
        SERVICE_REGISTRY,
      ], // Doesn't really matter where we take authorizedCaller and feeRecipient from
    },
    {
      address: PULL_TOKEN_ACTION,
      constructorArguments: [],
    },
    {
      address: SEND_TOKEN_ACTION,
      constructorArguments: [],
    },
    {
      address: SET_APPROVAL_ACTION,
      constructorArguments: [SERVICE_REGISTRY],
    },
    {
      address: SWAP_ACTION,
      constructorArguments: [SERVICE_REGISTRY],
    },
    {
      address: TAKE_FLASHLOAN_ACTION,
      constructorArguments: [SERVICE_REGISTRY, DAI],
    },
    {
      address: AAVE_BORROW_ACTION,
      constructorArguments: [SERVICE_REGISTRY],
    },
    {
      address: AAVE_DEPOSIT_ACTION,
      constructorArguments: [SERVICE_REGISTRY],
    },
    {
      address: AAVE_WITHDRAW_ACTION,
      constructorArguments: [SERVICE_REGISTRY],
    },
    {
      address: AAVE_PAYBACK_ACTION,
      constructorArguments: [SERVICE_REGISTRY],
    },
    {
      address: UNWRAP_ETH_ACTION,
      constructorArguments: [SERVICE_REGISTRY],
    },
    {
      address: WRAP_ETH_ACTION,
      constructorArguments: [SERVICE_REGISTRY],
    },
    {
      address: RETURN_FUNDS_ACTION,
      constructorArguments: [],
    },
    {
      address: POSITION_CREATED_ACTION,
      constructorArguments: [],
    },
  ]

  for (const { address, constructorArguments } of contracts) {
    try {
      await hre.run('verify:verify', {
        address,
        constructorArguments,
      })
    } catch (e: any) {
      console.log(`DEBUG: Error during verification of ${address}: ${e.message}`)
    }
  }
})
