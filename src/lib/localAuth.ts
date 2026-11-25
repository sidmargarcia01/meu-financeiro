import { createHash, randomBytes } from 'node:crypto'
import bcrypt from 'bcryptjs'
import { NextRequest, NextResponse } from 'next/server'
import { pool } from './localDatabase'
export const SESSION_COOKIE = 'mf-session'
const digest = (value: string) => createHash('sha256').update(value).digest('hex')
export function sessionToken(req: NextRequest) {
  const header = req.headers.get('authorization')
  return header?.startsWith('Bearer ') ? header.slice(7) : req.cookies.get(SESSION_COOKIE)?.value
}
export function sameOrigin(req: NextRequest) {
  const origin = req.headers.get('origin')
  const expected = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin
  return !origin || origin === new URL(expected).origin
}
export async function currentUser(token?: string) {
  if (!token || !/^[a-f0-9]{64}$/.test(token)) return null
  const result = await pool().query(`SELECT u.id,u.email,u.raw_user_meta_data AS user_metadata
    FROM app_private.sessions s JOIN auth.users u ON u.id=s.user_id
    WHERE s.token_hash=$1 AND s.expires_at>now() AND u.deleted_at IS NULL
    AND (u.banned_until IS NULL OR u.banned_until<now())`, [digest(token)])
  return result.rows[0] || null
}
export async function signIn(email: string, password: string, address: string) {
  const key = digest(address+'|'+email.toLowerCase())
  const attempt = await pool().query(`INSERT INTO app_private.login_attempts(key,attempts,window_start)
    VALUES($1,1,now()) ON CONFLICT(key) DO UPDATE SET
    attempts=CASE WHEN login_attempts.window_start<now()-interval '15 minutes' THEN 1 ELSE login_attempts.attempts+1 END,
    window_start=CASE WHEN login_attempts.window_start<now()-interval '15 minutes' THEN now() ELSE login_attempts.window_start END RETURNING attempts`, [key])
  if (attempt.rows[0].attempts>10) return { error: 'Muitas tentativas. Aguarde 15 minutos.', status: 429 }
  const result = await pool().query(`SELECT id,email,encrypted_password,raw_user_meta_data AS user_metadata
    FROM auth.users WHERE lower(email)=lower($1) AND deleted_at IS NULL
    AND email_confirmed_at IS NOT NULL AND (banned_until IS NULL OR banned_until<now())`, [email])
  const user = result.rows[0]
  const hash = user?.encrypted_password || '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy'
  const valid = await bcrypt.compare(password, hash)
  if (!user || !valid) return { error: 'Email ou senha inválidos', status: 401 }
  const token = randomBytes(32).toString('hex')
  await pool().query(`INSERT INTO app_private.sessions(token_hash,user_id,expires_at) VALUES($1,$2,now()+interval '12 hours')`, [digest(token),user.id])
  await pool().query('DELETE FROM app_private.login_attempts WHERE key=$1', [key])
  delete user.encrypted_password
  return { user, token, status: 200 }
}
export function setSession(response: NextResponse, token: string, maxAge=43200) {
  response.cookies.set(SESSION_COOKIE,token,{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax',path:'/',maxAge})
  response.headers.set('Cache-Control','no-store')
  return response
}
export async function logout(req: NextRequest) {
  if (!sameOrigin(req)) return NextResponse.json({error:'Origem inválida'},{status:403})
  const token=sessionToken(req)
  if(token) await pool().query('DELETE FROM app_private.sessions WHERE token_hash=$1',[digest(token)])
  return setSession(NextResponse.json({message:'Sessão encerrada'}),'',0)
}
