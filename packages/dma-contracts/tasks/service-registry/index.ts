import { getConfigByNetwork } from '@deploy-configurations/configs'
import { ConfigEntry, SystemConfig } from '@deploy-configurations/types/deployment-config'
import { Network } from '@deploy-configurations/types/network'
import { ServiceRegistry } from '@typechain/index'
import { task } from 'hardhat/config'

import {
  getPropertyFromPath,
  getServiceRegistry,
  isInvalidAddress,
  ServiceRegistryMaybe,
} from '../common'

function showLocalConfig(configPath: string, network: string) {
  const config: SystemConfig = getConfigByNetwork(network as Network) as SystemConfig

  const property = configPath === 'all' ? config : getPropertyFromPath(config, configPath)

  if (!property) {
    throw new Error(`Property ${configPath} not found`)
  }

  console.log('\n====== LOCAL CONFIG ======')
  console.log(`Network: ${network}`)
  console.log(`Path: ${configPath}`)
  console.log('==============================\n')
  console.log(property)
  console.log('\n==============================\n')
}

async function showRemoteEntry(serviceRegistry: ServiceRegistry, service: ConfigEntry) {
  if (!service.serviceRegistryName) {
    console.log(`[✅][NOT REQUIRED] ${service.name}: ${service.address}`)
    return
  }

  let serviceAddress
  try {
    serviceAddress = await serviceRegistry.getRegisteredService(service.serviceRegistryName)
  } catch (e) {
    console.log(`[❌][FETCH ERROR]  ${service.name}: ${e}`)
  }

  if (isInvalidAddress(serviceAddress)) {
    console.log(`[❌][UNCONFIGURED] ${service.name} is not registered in SystemRegistry`)
    return
  }

  if (serviceAddress !== service.address) {
    console.log(
      `[❌][ MISMATCHED ] ${service.name}: ${serviceAddress} (expected ${service.address})`,
    )
    return
  }

  console.log(`[✅][ CONFIGURED ] ${service.name}: ${serviceAddress}`)
}

async function showRemoteConfig(configPath: string, network: string, ethers: any) {
  const config: SystemConfig = getConfigByNetwork(network as Network) as SystemConfig

  const serviceRegistry: ServiceRegistryMaybe = await getServiceRegistry(ethers.provider, config)
  if (!serviceRegistry) {
    console.log('ServiceRegistry not deployed, cannot fetch values')
    return
  }

  const property = getPropertyFromPath(config, configPath)

  if (!property) {
    throw new Error(`Property ${configPath} not found`)
  }

  console.log('\n====== REMOTE CONFIG ======')
  console.log(`Network: ${network}`)
  console.log(`Path: ${configPath}`)
  console.log(`ServiceRegistry: ${serviceRegistry.address}`)
  console.log('==============================\n')

  if (property.name !== undefined) {
    // Single entry
    await showRemoteEntry(serviceRegistry, property as ConfigEntry)
  } else {
    // Multiple entries
    for (const serviceName of Object.keys(property)) {
      const service = property[serviceName] as ConfigEntry
      await showRemoteEntry(serviceRegistry, service)
    }
  }

  console.log('\n==============================\n')
}

async function pushEntryToRemote(serviceRegistry: ServiceRegistry, service: ConfigEntry) {
  if (!service.serviceRegistryName) {
    console.log(`[✅][LOCAL CONFIG] ${service.name}: ${service.address}`)
    return
  }

  let serviceAddress: undefined | string
  try {
    serviceAddress = await serviceRegistry.getRegisteredService(service.serviceRegistryName)
  } catch (e) {
    console.log(`[❌][FETCH ERROR]  ${service.name}: ${e}`)
  }

  if (isInvalidAddress(serviceAddress)) {
    const serviceNameHash = await serviceRegistry.getServiceNameHash(service.serviceRegistryName)

    try {
      const tx = await serviceRegistry.addNamedService(serviceNameHash, service.address)
      await tx.wait()
    } catch (e) {
      if (JSON.stringify(e).includes('registry/only-owner')) {
        console.log(`[❌][ PUSH ERROR ] ${service.name}: Only owner can push to SystemRegistry`)
      } else {
        console.log(`[❌][ PUSH ERROR ] ${service.name}: ${e}`)
      }
      return
    }

    const newServiceAddress = await serviceRegistry.getRegisteredService(
      service.serviceRegistryName,
    )

    if (newServiceAddress !== service.address.toLowerCase()) {
      console.log(
        `[❌][ PUSH ERROR ] ${service.name}: read address ${newServiceAddress} does not match expected ${service.address}`,
      )
      return
    }

    console.log(`[❌][UNCONFIGURED] ${service.name} is not registered in SystemRegistry`)
  }

  if (serviceAddress !== service.address.toLowerCase()) {
    console.log(
      `[❌][ MISMATCHED ] ${service.name}: is already configured with address ${serviceAddress}, cannot push ${service.address}`,
    )
    return
  }

  console.log(`[✅][ CONFIGURED ] ${service.name}: ${serviceAddress}`)
}

async function pushConfigToRemote(configPath: string, network: string, ethers: any) {
  const signer = (await ethers.getSigners())[0]

  const config: SystemConfig = getConfigByNetwork(network as Network) as SystemConfig

  const serviceRegistry: ServiceRegistryMaybe = await getServiceRegistry(signer, config)
  if (!serviceRegistry) {
    console.log('ServiceRegistry not deployed, cannot fetch values')
    return
  }

  const property = getPropertyFromPath(config, configPath)

  if (!property) {
    throw new Error(`Property ${configPath} not found`)
  }

  console.log('\n====== ADDING CONFIG ======')
  console.log(`Network: ${network}`)
  console.log(`Path: ${configPath}`)
  console.log(`ServiceRegistry: ${serviceRegistry.address}`)
  console.log('==============================\n')

  if (property.name !== undefined) {
    // Single entry
    await pushEntryToRemote(serviceRegistry, property as ConfigEntry)
  } else {
    // Multiple entries
    for (const serviceName of Object.keys(property)) {
      const service = property[serviceName] as ConfigEntry

      await pushEntryToRemote(serviceRegistry, service)
    }
  }

  console.log('\n==============================\n')
}

task('service-registry', 'Performs several operations in the service registry')
  .addOptionalParam(
    'pushconfig',
    "Pushes the values of the given property path in the local config for the given network to the SystemRegistry  (i.e. property path='aave.v3')",
  )
  .addOptionalParam(
    'showlocal',
    "Shows the given property path of the local config for the selected network (i.e. property path='aave.v3'). Use 'all' to show all the config",
  )
  .addOptionalParam(
    'showremote',
    "Shows the values of the SystemRegistry for the given property path in the local config for the given network (i.e. property path='aave.v3')",
  )
  .setAction(async (taskArgs, hre) => {
    const { name: network } = hre.network
    const { ethers } = hre

    // Disable the annoying duplicated definition warning
    ethers.utils.Logger.setLogLevel(ethers.utils.Logger.levels.ERROR)

    if (taskArgs.pushconfig) {
      await pushConfigToRemote(taskArgs.pushconfig, network, ethers)
    } else if (taskArgs.showlocal) {
      showLocalConfig(taskArgs.showlocal, network)
    } else if (taskArgs.showremote) {
      await showRemoteConfig(taskArgs.showremote, network, ethers)
    } else {
      throw new Error('Either --pushconfig, --showlocal or --showremote must be specified')
    }
  })
