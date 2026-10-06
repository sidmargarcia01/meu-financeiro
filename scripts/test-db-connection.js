// Read-only health check. No credentials or financial records are printed.
(async () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('Configure NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY');
  const response = await fetch(new URL('/auth/v1/health', url), {headers:{apikey:key}});
  if (!response.ok) throw new Error('Supabase health status: ' + response.status);
  console.log('Supabase acessível');
})().catch(error => { console.error(error.message); process.exitCode = 1; });
