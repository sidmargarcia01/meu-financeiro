import { NextRequest, NextResponse } from 'next/server'
import { AuthUser } from '@/models/common'
import { createRequestClient, runWithSupabase } from '@/lib/requestSupabase'
import { currentUser,sessionToken,sameOrigin } from '@/lib/localAuth'
export async function withAuth(request:NextRequest,handler:(request:NextRequest,user:AuthUser)=>Promise<NextResponse>):Promise<NextResponse>{
  if(!['GET','HEAD','OPTIONS'].includes(request.method)&&!sameOrigin(request))return createAuthError('Origem inválida',403)
  const token=sessionToken(request)
  if(!token)return createAuthError('Não autorizado')
  let user
  try{user=await currentUser(token)}catch{return createAuthError('Não foi possível validar a sessão',503)}
  if(!user)return createAuthError('Sessão inválida ou expirada')
  return runWithSupabase(createRequestClient(user.id),()=>handler(request,{id:user.id,email:user.email??''}))
}
export async function withOptionalAuth(request:NextRequest,handler:(request:NextRequest,user?:AuthUser)=>Promise<NextResponse>){return sessionToken(request)?withAuth(request,handler):handler(request)}
export async function withPlanCheck(request:NextRequest,handler:(request:NextRequest,user:AuthUser)=>Promise<NextResponse>,requiredFeatures?:string[]){return withAuth(request,handler)}
export function createAuthError(message:string,status=401){return NextResponse.json({error:message},{status})}
export function createAuthorizationError(message='Acesso negado'){return createAuthError(message,403)}
