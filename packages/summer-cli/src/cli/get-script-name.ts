export function getCommandName(args: string[]): string | undefined {
  const scriptName = args[2];

  return scriptName;
}
