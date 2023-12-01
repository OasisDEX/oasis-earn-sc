/**
 * Action definition
 *
 * @dev This type defines an action that can be used in a operation. It contains the
 * path in the `loadContractNames` object to fetch the hash and whether it is optional or not.
 */
export type ActionPathDefinition = {
  serviceNamePath: string
  optional: boolean
}

/**
 * Operation path definition
 *
 * @dev This type defines the paths of a full operation. It contains the name of the operation and
 * the paths to all the actions that compose it. It follows the schema of `packages/deploy-configurations/operations-definitions`
 * and it is intended in aiding the automatic generation of those files
 */
export type OperationPathsDefinition = {
  name: string
  actions: ActionPathDefinition[]
}
