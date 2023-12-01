export const ProtocolNames = [
  'AAVE',
  'AAVE_V3',
  'Maker',
  'Compound',
  'Ajna',
  'Spark',
  'MorphoBlue',
] as const

export type Protocol = (typeof ProtocolNames)[number]

export const isProtocol = (x: any): x is Protocol => ProtocolNames.includes(x)
