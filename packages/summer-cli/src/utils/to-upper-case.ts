export function toUpperCase<S extends string>(string: S): Uppercase<S> {
  return string.toUpperCase() as Uppercase<S>;
}
