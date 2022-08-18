import init from '../helpers/init'
import { deploySystem } from '../test/deploySystem'

async function main() {
  const config = await init()
  await deploySystem(config, true)
}

main()
