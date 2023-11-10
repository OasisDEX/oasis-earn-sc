import { Args, Command } from '@oclif/core'
import { tokens } from '../constants/tokens'

export default class GetToken extends Command {
  static description = 'Get ERC20 token to given addreess'

  static examples = [
    '<%= config.bin %> <%= command.id %>',
  ]

  static args = {
    wallet: Args.string({
      description: 'Wallet address to get token',
      required: false,
    }),
    // flag with no value (-f, --force)
    token: Args.string({
      description: 'Token to get',
      required: true,
      // parse: input => 'output', // gets address from the token symbol
      options: tokens.map(token => token.toLocaleLowerCase()),
    }),
  }

  public async run(): Promise<void> {
    const {args} = await this.parse(GetToken)

    this.log(`${args.token} to ${args.wallet}`)
  }
}
