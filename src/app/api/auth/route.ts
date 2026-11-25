import { NextRequest,NextResponse } from 'next/server'
import { z } from 'zod'
import { currentUser,sessionToken,setSession,signIn,logout,sameOrigin } from '@/lib/localAuth'
export const dynamic='force-dynamic'
export async function POST(req:NextRequest){
  if(!sameOrigin(req))return NextResponse.json({error:'Origem inválida'},{status:403})
  try{
    const body=await req.json()
    if(body.name)return NextResponse.json({error:'Novas contas devem ser provisionadas pelo administrador.'},{status:403})
    const parsed=z.object({email:z.string().email().max(254),password:z.string().min(1).max(72)}).safeParse(body)
    if(!parsed.success)return NextResponse.json({error:'Dados inválidos'},{status:400})
    const result=await signIn(parsed.data.email,parsed.data.password,req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()||'local')
    if(!result.token)return NextResponse.json({error:result.error},{status:result.status})
    return setSession(NextResponse.json({user:result.user,session:{user:result.user}}),result.token)
  }catch{return NextResponse.json({error:'Não foi possível autenticar. Tente novamente.'},{status:503})}
}
export async function GET(req:NextRequest){
  try{const user=await currentUser(sessionToken(req));return user?NextResponse.json({user,session:{user}},{headers:{'Cache-Control':'no-store'}}):setSession(NextResponse.json({error:'Sessão expirada'},{status:401}),'',0)}
  catch{return NextResponse.json({error:'Autenticação indisponível'},{status:503})}
}
export const DELETE=logout
