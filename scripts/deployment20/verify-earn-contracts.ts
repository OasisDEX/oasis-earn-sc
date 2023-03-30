import hre from 'hardhat'

import { DeploymentSystem } from './deploy'

async function main() {
  const ds = new DeploymentSystem(hre)

  await ds.init()
  await ds.loadConfig()
  await ds.deployAll()

  const { system } = ds.getSystem()
  const contracts = Object.keys(system)
    .filter(key => key == 'DSGuardFactory')
    .map((key: any) => {
      const entry = system[key]
      return {
        address: entry.config.address,
        constructorArgs: entry.config.constructorArgs.map((param: any) => {
          if (typeof param === 'string' && param.indexOf('address:') >= 0) {
            const contractName = (param as string).replace('address:', '')
            return system[contractName].contract.address
          }
          return param
        }),
      }
    })

  for (const contract of contracts) {
    await ds.verifyContract(contract.address, contract.constructorArgs)
  }
}

main().catch(error => {
  console.error(error)
  process.exitCode = 1
})
