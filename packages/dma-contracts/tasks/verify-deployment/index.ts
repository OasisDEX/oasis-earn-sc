import { getConfigByNetwork } from '@deploy-configurations/configs'
import { ADDRESS_ZERO } from '@deploy-configurations/constants'
import {
  ConfigEntry,
  SystemConfig,
  SystemConfigEntry,
} from '@deploy-configurations/types/deployment-config'
import { Network } from '@deploy-configurations/types/network'
import { ServiceRegistry } from '@typechain/index'
import { color } from 'console-log-colors'
import { task } from 'hardhat/config'

import {
  getServiceRegistry,
  isInvalidAddress,
  ServiceRegistryMaybe,
  ValidationResult,
} from '../common'

// This functions help coloring strings for console output
const { red, yellow, green } = color

function getValidationStatusString(verificationResult: ValidationResult): string {
  if (verificationResult.totalEntries === 0) {
    return red('0%') + ' (0/0)'
  }

  const verificationPercentage: number = Math.round(
    (verificationResult.totalValidated / verificationResult.totalEntries) * 100,
  )

  if (verificationPercentage < 30) {
    return (
      red(`${verificationPercentage.toFixed(2)}%`) +
      ` (${verificationResult.totalValidated}/${verificationResult.totalEntries})`
    )
  } else if (verificationPercentage < 70) {
    return (
      yellow(`${verificationPercentage.toFixed(2)}%`) +
      ` (${verificationResult.totalValidated}/${verificationResult.totalEntries})`
    )
  } else {
    return (
      green(`${verificationPercentage.toFixed(2)}%`) +
      ` (${verificationResult.totalValidated}/${verificationResult.totalEntries})`
    )
  }
}

async function validateContracts(
  config: { [key: string]: SystemConfigEntry },
  serviceRegistry: ServiceRegistry,
): Promise<ValidationResult> {
  let totalEntries = 0
  let totalValidated = 0

  if (Object.keys(config).length === 0) {
    return {
      success: false,
      totalEntries,
      totalValidated,
    }
  }

  for (const entryName in config) {
    if (entryName === 'ServiceRegistry') {
      continue
    }

    totalEntries++

    const configEntry: SystemConfigEntry = config[entryName]
    if (configEntry.serviceRegistryName) {
      const registryAddress = await serviceRegistry.getRegisteredService(
        configEntry.serviceRegistryName,
      )

      if (registryAddress === ADDRESS_ZERO) {
        console.log(`${entryName}: ❌ (not deployed)`)
        continue
      }

      if (registryAddress.toLowerCase() !== configEntry.address.toLowerCase()) {
        console.log(
          `${entryName}: ❌ (address mismatch ${configEntry.address} <--> ${registryAddress})`,
        )
        continue
      }
    }

    totalValidated++

    console.log(`${entryName}: ✅ (${configEntry.address})`)
  }

  return {
    success: totalEntries === totalValidated,
    totalEntries,
    totalValidated,
  }
}

async function validateDependencies(config: {
  [key: string]: ConfigEntry
}): Promise<ValidationResult> {
  if (Object.keys(config).length === 0) {
    return {
      success: false,
      totalEntries: 0,
      totalValidated: 0,
    }
  }

  const validatedEntries = Object.entries(config).filter(([name, entry]) => {
    if (isInvalidAddress(entry.address)) {
      console.log(`${name}: ❌ (not configured)`)
      return false
    } else {
      console.log(`${name}: ✅ (${entry.address})`)
      return true
    }
  })

  const totalEntries = Object.keys(config).length
  const totalValidated = validatedEntries.length

  return {
    success: totalEntries === totalValidated,
    totalEntries,
    totalValidated,
  }
}

task('verify-deployment', 'Verify the deployment for a certain network').setAction(
  async (_: any, hre) => {
    const { name: network } = hre.network
    const { ethers } = hre

    // Disable the annoying duplicated definition warning
    ethers.utils.Logger.setLogLevel(ethers.utils.Logger.levels.ERROR)

    console.log('\n====== DEPLOYMENT VERIFICATION ======')
    console.log(`Network: ${network}`)

    const config: SystemConfig = getConfigByNetwork(network as Network)

    console.log('\n== SERVICE REGISTRY ==')
    const serviceRegistry: ServiceRegistryMaybe | undefined = await getServiceRegistry(
      ethers.provider,
      config,
    )
    if (!serviceRegistry) {
      console.log('No service registry found, stopping scan')
      return
    }

    console.log(`ServiceRegistry: ✅ ${serviceRegistry.address}`)

    console.log('\n== CORE ==')
    const coreVerificationResult: ValidationResult = await validateContracts(
      config.mpa.core,
      serviceRegistry,
    )
    if (!coreVerificationResult.success) {
      console.log(
        `\nSome Core contracts failed the verification (${coreVerificationResult.totalValidated}/${coreVerificationResult.totalEntries})`,
      )
      return
    }

    console.log('\n== ACTIONS ==')
    const actionVerificationResult: ValidationResult = await validateContracts(
      config.mpa.actions,
      serviceRegistry,
    )
    if (!actionVerificationResult.success) {
      console.log(
        `\nSome Action contracts failed the verification (${actionVerificationResult.totalValidated}/${actionVerificationResult.totalEntries})`,
      )
    }

    console.log('\n== COMMON ==')
    const commonVerificationResult: ValidationResult = await validateDependencies(config.common)
    if (!commonVerificationResult.success) {
      console.log(
        `\nSome Common contracts failed the verification (${commonVerificationResult.totalValidated}/${commonVerificationResult.totalEntries})`,
      )
    }

    console.log('\n== AAVE V2 ==')
    const aaveV2VerificationResult: ValidationResult = await validateDependencies(config.aave.v2)
    if (!aaveV2VerificationResult.success) {
      console.log(
        `\nSome Aave V2 contracts failed the verification (${aaveV2VerificationResult.totalValidated}/${aaveV2VerificationResult.totalEntries})`,
      )
    }

    console.log('\n== AAVE V3 ==')
    const aaveV3VerificationResult: ValidationResult = await validateDependencies(config.aave.v3)
    if (!aaveV3VerificationResult.success) {
      console.log(
        `\nSome Aave V3 contracts failed the verification (${aaveV3VerificationResult.totalValidated}/${aaveV3VerificationResult.totalEntries})`,
      )
    }

    console.log('\n== SPARK ==')
    const sparkVerificationResult: ValidationResult = await validateDependencies(config.spark)
    if (!sparkVerificationResult.success) {
      console.log(
        `\nSome Spark contracts failed the verification (${sparkVerificationResult.totalValidated}/${sparkVerificationResult.totalEntries})`,
      )
    }

    console.log('\n== MAKER ==')
    console.log('\n== MAKER COMMON ==')
    const makerCommonVerificationResult: ValidationResult = await validateDependencies(
      config.maker.common,
    )
    if (!makerCommonVerificationResult.success) {
      console.log(
        `\nSome Maker common contracts failed the verification (${makerCommonVerificationResult.totalValidated}/${makerCommonVerificationResult.totalEntries})`,
      )
    }

    console.log('\n== MAKER JOINS ==')
    const makerJoinsVerificationResult: ValidationResult = await validateDependencies(
      config.maker.joins,
    )
    if (!makerJoinsVerificationResult.success) {
      console.log(
        `\nSome Maker joins contracts failed the verification (${makerJoinsVerificationResult.totalValidated}/${makerJoinsVerificationResult.totalEntries})`,
      )
    }

    console.log('\n== MAKER PIPS ==')
    const makerPipsVerificationResult: ValidationResult = await validateDependencies(
      config.maker.pips,
    )
    if (!makerPipsVerificationResult.success) {
      console.log(
        `\nSome Maker pips contracts failed the verification (${makerPipsVerificationResult.totalValidated}/${makerPipsVerificationResult.totalEntries})`,
      )
    }

    console.log('\n== AUTOMATION ==')
    const automationVerificationResult: ValidationResult = await validateDependencies(
      config.automation,
    )
    if (!automationVerificationResult.success) {
      console.log(
        `\nSome Automation contracts failed the verification (${automationVerificationResult.totalValidated}/${automationVerificationResult.totalEntries})`,
      )
    }

    console.log('\n== AJNA ==')
    const ajnaVerificationResult: ValidationResult = await validateDependencies(config.ajna)
    if (!ajnaVerificationResult.success) {
      console.log(
        `\nSome Ajna contracts failed the verification (${ajnaVerificationResult.totalValidated}/${ajnaVerificationResult.totalEntries})`,
      )
    }

    console.log('\n== MORPHO BLUE ==')
    const morphoblueVerificationResult: ValidationResult = await validateDependencies(
      config.morphoblue,
    )
    if (!morphoblueVerificationResult.success) {
      console.log(
        `\nSome MorphoBlue contracts failed the verification (${morphoblueVerificationResult.totalValidated}/${morphoblueVerificationResult.totalEntries})`,
      )
    }

    console.log('\n====== SUMMARY ======')
    console.log(`ServiceRegistry: ✅ Verified`)
    console.log(`Core: ${getValidationStatusString(coreVerificationResult)}`)
    console.log(`Actions: ${getValidationStatusString(actionVerificationResult)}`)
    console.log(`Common: ${getValidationStatusString(commonVerificationResult)}`)
    console.log(`Aave V2: ${getValidationStatusString(aaveV2VerificationResult)}`)
    console.log(`Aave V3: ${getValidationStatusString(aaveV3VerificationResult)}`)
    console.log(`Spark: ${getValidationStatusString(sparkVerificationResult)}`)
    console.log(`Maker Common: ${getValidationStatusString(makerCommonVerificationResult)}`)
    console.log(`Maker Joins: ${getValidationStatusString(makerJoinsVerificationResult)}`)
    console.log(`Maker Pips: ${getValidationStatusString(makerPipsVerificationResult)}`)
    console.log(`Automation: ${getValidationStatusString(automationVerificationResult)}`)
    console.log(`Ajna: ${getValidationStatusString(ajnaVerificationResult)}`)

    console.log('\nCheck the logs above for more details')
    console.log('\nDone! ')
  },
)
