import type { Command } from './command';

export function getCommandsMap<T extends string, C extends Command>(
  commands: Record<T, C>,
) {
  return Object.values(commands).reduce<Record<string, Command>>(
    (acc, value) => {
      const command = value as Command;
      return { ...acc, [command.name]: command };
    },
    {} as Record<string, Command>,
  );
}
