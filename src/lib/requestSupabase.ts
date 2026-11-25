import { AsyncLocalStorage } from 'node:async_hooks'
import { localDataClient } from './localDatabase'
type DatabaseClient = ReturnType<typeof localDataClient>
const clients = new AsyncLocalStorage<DatabaseClient>()
export const createRequestClient = localDataClient
export function runWithSupabase<T>(client: DatabaseClient, callback: () => T): T { return clients.run(client, callback) }
export function getRequestSupabase(): DatabaseClient {
  const client=clients.getStore()
  if(!client)throw new Error('Consulta financeira sem contexto autenticado')
  return client
}
export const supabase = new Proxy({} as DatabaseClient, {get(_target,property){
  const client=getRequestSupabase();const value=Reflect.get(client,property)
  return typeof value==='function'?value.bind(client):value
}})
