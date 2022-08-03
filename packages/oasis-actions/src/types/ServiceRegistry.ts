export interface ServiceRegistry {
  getServiceAddress(name: string): Promise<string>
}
