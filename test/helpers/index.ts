export const getPrivate = <T extends {}>(obj: T, propertyName: string): any => {
  return Object.getOwnPropertyDescriptor(obj, propertyName)?.value
}
