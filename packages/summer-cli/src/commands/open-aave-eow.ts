import type { Command } from '../cli/command';
import * as yup from 'yup';
import { allowedTokensLowerCased } from '../utils/tokens';
import { createEOWPosition } from '../logic/aave/open-eow-position';
import { toUpperCase } from '../utils/to-upper-case';

const argsSchema = yup.object().shape({
    assetToken: yup
      .string()
      .required()
      .oneOf(allowedTokensLowerCased),
    debtToken: yup
    .string()
    .required()
    .oneOf(allowedTokensLowerCased),
    assetAmount: yup.number().required().moreThan(0),
    debtAmount: yup.number().required().min(0),
  });

export const openAaveEow: Command<typeof argsSchema> = {
    name: 'open-aave-eow',
    args: argsSchema,
    description: 'Open Aave position on external wallet',
    run: async (args, env) => {
        await createEOWPosition(
            env,
            toUpperCase(args.assetToken),
            toUpperCase(args.debtToken),
            args.assetAmount,
            args.debtAmount,
        );
    },
};
