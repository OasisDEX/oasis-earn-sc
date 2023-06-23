import { mainnetConfig } from '@deploy-configurations/configs'

function main() {
  const contracts = Object.entries({
    ...mainnetConfig.mpa.core,
    ...mainnetConfig.mpa.actions,
  }).map(([key, value]) => {
    return {
      key,
      name: value.name,
      serviceRegistryName: value.serviceRegistryName,
      address: value.address,
    }
  })

  const inString = contracts.map(({ key, name, serviceRegistryName, address }) => {
    return `${name}: ${address}`
  })

  inString.forEach(value => {
    console.log(value)
  })
}

main()
