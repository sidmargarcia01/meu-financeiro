/** @jest-environment node */
jest.unmock('@/lib/queryAll')
jest.unmock('@/lib/requestSupabase')
import { signedAmount, addMonthsClamped, splitCents } from '@/lib/financial'
import { queryAll } from '@/lib/queryAll'
import { runWithSupabase, getRequestSupabase, supabase } from '@/lib/requestSupabase'
import { createTransactionInputSchema, updateTransactionSchema } from '@/models/transaction'

describe('financial invariants', () => {
  test('expense signs and both transfer directions preserve a consolidated balance', () => {
    expect(1000 + signedAmount('DESPESA', -100)).toBe(900)
    expect(signedAmount('DESPESA', 100)).toBe(-100)
    expect(signedAmount('TRANSFERENCIA', -100) + signedAmount('TRANSFERENCIA', 100)).toBe(0)
  })
  test('month-end installments retain the original day and leap years', () => {
    expect([0,1,2].map(i => addMonthsClamped('2026-01-31',i).toISOString().slice(0,10)))
      .toEqual(['2026-01-31','2026-02-28','2026-03-31'])
    expect(addMonthsClamped('2024-01-31',1).toISOString().slice(0,10)).toBe('2024-02-29')
  })
  test('installments conserve every cent', () => {
    for (const count of [2,3,7,12,120]) {
      expect(splitCents(100,count).reduce((s,v) => s + Math.round(v*100),0)).toBe(10000)
    }
    expect(() => splitCents(1,3.5)).toThrow()
  })
  test('invalid calendar dates are rejected and optional fields can be cleared', () => {
    expect(createTransactionInputSchema.safeParse({description:'X',amount:1,type:'DESPESA',dueDate:'2026-02-31'}).success).toBe(false)
    expect(updateTransactionSchema.safeParse({notes:null,centerId:null,competenceDate:null}).success).toBe(true)
  })
  test('aggregates read all rows even if the server cap is smaller than the requested page', async () => {
    const rows=Array.from({length:1237},(_,id)=>({id,amount:1}))
    let start=0
    const q={order:jest.fn().mockReturnThis(),range:jest.fn((offset:number)=>{start=offset;return q}),
      then(resolve:any){return Promise.resolve({data:rows.slice(start,start+200),error:null}).then(resolve)}}
    const result=await queryAll(q)
    expect(result.data).toHaveLength(1237)
    expect(result.data.reduce((s,r)=>s+r.amount,0)).toBe(1237)
  })
  test('query failure never returns a misleading partial sum', async () => {
    const q={order:jest.fn().mockReturnThis(),range:jest.fn().mockResolvedValue({data:null,error:{message:'offline'}})}
    expect((await queryAll(q)).error.message).toBe('offline')
  })
  test('concurrent requests cannot share authentication state', async () => {
    const a={from:jest.fn(()=> 'A')},b={from:jest.fn(()=> 'B')}
    const result=await Promise.all([a,b].map(client=>runWithSupabase(client as any, async()=>{
      await Promise.resolve(); expect(getRequestSupabase()).toBe(client)
      return supabase.from('accounts')
    })))
    expect(result).toEqual(['A','B'])
    expect(()=>supabase.from('accounts')).toThrow('sem contexto autenticado')
  })
})
