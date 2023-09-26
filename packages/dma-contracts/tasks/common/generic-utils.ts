/**
 * Extracts a property from an object using a path in string format.
 *
 * For example, if the object is:
 * {
 *   a: {
 *    b: {
 *      c: 1
 *   }
 * }
 *
 * The path 'a.b.c' will return 1
 *
 * @param obj The object to extract the property from
 * @param path The path to the property in string format
 *
 * @returns The property value
 */
export function getPropertyFromPath(obj: any, path: string): any {
  const pathParts = path.split('.')
  let currentObj = obj

  for (const pathPart of pathParts) {
    currentObj = currentObj[pathPart]
  }

  return currentObj
}
