import type { Command } from '../cli/command';
import * as yup from 'yup';
import { allowedTokensLowerCased, tokens } from '../utils/tokens';
import { getTokens } from '../logic/common/get-tokens';
import { toUpperCase } from '../utils/to-upper-case';

const argsSchema = yup.object().shape({
  token: yup
    .string()
    .required()
    .oneOf(allowedTokensLowerCased),
  amount: yup.number().required().moreThan(0),
});

export const getTokensCommand: Command<typeof argsSchema> = {
  name: 'get-tokens' as const,
  description: `Get tokens to provided wallet, avaiable tokens: ${tokens.join(
    ', ',
  )} `,
  args: argsSchema,
  async run(args, enviroment) {
    const token = toUpperCase(args.token);
    await getTokens(enviroment, token, args.amount);
  },
};
