import { getCommandName, parseArguments } from './cli';
import * as commands from './commands';
import { makeCommandRunner } from './cli/command-runner';

async function main(args: string[]) {
  const commandName = getCommandName(args);
  const argsMap = parseArguments(args);

  const commandRunner = makeCommandRunner(commands);

  const run = await commandRunner.run(commandName, argsMap);

  console.log(run);
}

main(process.argv);
