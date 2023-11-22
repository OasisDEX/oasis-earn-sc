import * as yup from 'yup';

import type { Command } from '../cli/command';
import { changeAccountOwner } from '../logic/common/steal-dpm';

const argsSchema = yup.object().shape({
  account: yup.string().required(),
  newOwner: yup.string().required(),
});

export const stealDpmAccount: Command<typeof argsSchema> = {
  name: 'steal-dpm' as const,
  args: argsSchema,
  description: 'Steal a DPM account',
  run: async (args, env) => {
    await changeAccountOwner(env, args.account, args.newOwner);
  },
};
