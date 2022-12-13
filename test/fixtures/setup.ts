import init from '../../helpers/init'

export async function initialiseConfig() {
  const config = await init()

  return { config, provider: config.provider, signer: config.signer, address: config.address }
}
