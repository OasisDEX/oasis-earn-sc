import init, { impersonateRichAccount } from '../../helpers/init'

export async function initialiseConfig() {
  const config = await init(undefined, impersonateRichAccount)

  return { config, provider: config.provider, signer: config.signer, address: config.address }
}
