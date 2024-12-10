import { tenderly } from 'hardhat'

async function main() {
  console.log('🖖🏽[ethers] Verifying MorphoBlueReallocateTo in Tenderly')

  const address = '0xd9261350974569527be51d1e39e72828b7dc514a'

  await tenderly.verify({
    address,
    name: 'MorphoBlueReallocateTo',
  })
}

main().catch(error => {
  console.error(error)
  process.exitCode = 1
})
