import init from '@oasisdex/dupa-common/utils/init'

export async function initialiseConfig() {
  const config = await init()

  return { config, provider: config.provider, signer: config.signer, address: config.address }
}
