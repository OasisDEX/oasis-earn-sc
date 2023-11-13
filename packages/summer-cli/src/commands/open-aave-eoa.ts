import * as yup from 'yup';

import type { Command } from '../cli/command';
import { createEOAPosition } from '../logic/aave/open-eoa-position';
import { toUpperCase } from '../utils/to-upper-case';
import { allowedTokensLowerCased } from '../utils/tokens';

const argsSchema = yup.object().shape({
  assetToken: yup.string().required().oneOf(allowedTokensLowerCased),
  debtToken: yup.string().required().oneOf(allowedTokensLowerCased),
  assetAmount: yup.number().required().moreThan(0),
  debtAmount: yup.number().required().min(0),
});

export const openAaveEoa: Command<typeof argsSchema> = {
  name: 'open-aave-eoa' as const,
  args: argsSchema,
  description: 'Open Aave position on external wallet',
  run: async (args, env) => {
    await createEOAPosition(
      env,
      toUpperCase(args.assetToken),
      toUpperCase(args.debtToken),
      args.assetAmount,
      args.debtAmount,
    );
  },
};
