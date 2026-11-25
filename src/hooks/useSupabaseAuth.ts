'use client'
import { useState,useEffect } from 'react'
export interface User {id:string;email?:string;user_metadata?:Record<string,any>}
export interface Session {user:User}
export function useSupabaseAuth(){
  const [user,setUser]=useState<User|null>(null)
  const [session,setSession]=useState<Session|null>(null)
  const [loading,setLoading]=useState(true)
  const [error,setError]=useState<Error|null>(null)
  const accept=(data:any)=>{setUser(data.user||null);setSession(data.user?{user:data.user}:null)}
  useEffect(()=>{let active=true;const refresh=async()=>{try{const res=await fetch('/api/auth',{cache:'no-store'});if(active){if(res.ok)accept(await res.json());else if(res.status===401)accept({});else setError(new Error('Autenticação indisponível'))}}catch{if(active)setError(new Error('Não foi possível conectar ao servidor'))}finally{if(active)setLoading(false)}};void refresh();window.addEventListener('mf-auth',refresh);return()=>{active=false;window.removeEventListener('mf-auth',refresh)}},[])
  const authenticate=async(email:string,password:string,name?:string)=>{
    try{setError(null);const res=await fetch('/api/auth',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,password,name})});const data=await res.json();if(!res.ok)throw new Error(data.error||'Não foi possível autenticar');accept(data);window.dispatchEvent(new Event('mf-auth'));return {error:null}}catch(err){const error=err instanceof Error?err:new Error('Falha de conexão');setError(error);return {error}}
  }
  const signOut=async()=>{const res=await fetch('/api/auth/logout',{method:'POST'});if(!res.ok)throw new Error('Não foi possível encerrar a sessão');accept({});window.dispatchEvent(new Event('mf-auth'))}
  const resetPassword=async(_email:string)=>({error:new Error('Solicite a redefinição da senha ao administrador do servidor.')})
  return {user,session,loading,error,signIn:(email:string,password:string)=>authenticate(email,password),signUp:(email:string,password:string,name:string)=>authenticate(email,password,name),signOut,resetPassword}
}
