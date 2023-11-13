import { getCommandName, parseArguments } from './cli';
import * as commands from './commands';
import { makeCommandRunner } from './cli/command-runner';

async function main(args: string[]) {
  const commandName = getCommandName(args);
  const argsMap = parseArguments(args);

  const commandRunner = makeCommandRunner(commands);

  commandRunner.run(commandName, argsMap)
}

main(process.argv);
