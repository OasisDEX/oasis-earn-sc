import { Args, Command } from '@oclif/core'
import { isSupportedToken, tokens } from '../utils/tokens'
import { getEnvitoment } from '../utils/get-enviroment'
import { getTokens } from '../logic/common/get-tokens'

export default class GetToken extends Command {
  static description = 'Get ERC20 token to given addreess'

  static examples = [
    '<%= config.bin %> <%= command.id %>',
  ]

  static args = {
    token: Args.string({
      description: 'Token to get',
      required: true,
      // parse: input => 'output', // gets address from the token symbol
      options: tokens.map(token => token.toLocaleLowerCase()),
    }),
    amount: Args.integer({
      description: 'Token amount',
      required: true,
    }),
  }

  public async run(): Promise<void> {
    const {args} = await this.parse(GetToken)
    const enviroment = getEnvitoment()

    if(!isSupportedToken(args.token)) {
      this.error(`Token not supported: ${args.token}`);
    }

    await getTokens(enviroment, args.token, 100)
  }
}
