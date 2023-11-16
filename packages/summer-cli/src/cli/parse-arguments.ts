export function parseArguments(args: string[]): Record<string, string> {
  const flags = args.slice(3);

  return flags.reduce((acc, flag) => {
    const [key, value] = flag.split('=');
    console.log(key, value);
    if (value === undefined) {
      return acc;
    }
    acc[key] = value;
    return acc;
  }, {} as Record<string, string>);
}
