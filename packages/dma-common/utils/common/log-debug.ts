export function logDebug(lines: string[], prefix = '') {
  lines.forEach(line => console.log(`${prefix}${line}`))
}
