import { getEnvitoment } from '../utils/get-enviroment';
import { Command } from './command';
import { getCommandsMap } from './get-commands-map';

interface SuccessfullRun {
  run: 'successfull';
  command: string;
}

enum RunFailures {
  InvalidArguments = 'invalid-arguments',
  CommandNotFound = 'command-not-found',
  CommandFailed = 'command-failed',
}

interface FailedRun {
  run: 'failed';
  error: RunFailures;
  command?: string;
  args: Record<string, string>;
  e?: unknown;
}

type Run = SuccessfullRun | FailedRun;

export function makeCommandRunner(commands: Record<string, Command>) {
  const commandsMap = getCommandsMap(commands);
  const avaiableCommands = Object.keys(commandsMap);

  return {
    run: async (
      commandName: string | undefined,
      args: Record<string, string>,
    ): Promise<Run> => {
      if (commandName == undefined || !avaiableCommands.includes(commandName)) {
        return {
          run: 'failed',
          error: RunFailures.CommandNotFound,
          command: commandName,
          args,
        };
      }

      const commandToRun = commandsMap[commandName];
      try {
        const parsedArgs = await commandToRun.args.validate(args);
        const enviroment = await getEnvitoment();
        try {
          await commandToRun.run(parsedArgs, enviroment);
          return {
            run: 'successfull',
            command: commandName,
          };
        } catch (e) {
          return {
            run: 'failed',
            error: RunFailures.CommandFailed,
            command: commandName,
            args,
            e,
          };
        }
      } catch (e) {
        return {
          run: 'failed',
          error: RunFailures.InvalidArguments,
          command: commandName,
          args,
          e,
        };
      }
    },
  };
}
