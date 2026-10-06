/** Complete financial aggregates must never depend on the Data API row limit. */
export async function queryAll(query: any): Promise<{ data: any[]; error: any }> {
  const rows: any[] = []
  // Stable id ordering is required when several entries share a date.
  query = query.order('id')
  for (let offset = 0; offset < 100000;) {
    const { data, error } = await query.range(offset, offset + 499)
    if (error) return { data: [], error }
    if (!data?.length) return { data: rows, error: null }
    rows.push(...data)
    offset += data.length
  }
  throw new Error('Consulta muito extensa. Reduza o período do relatório.')
}
