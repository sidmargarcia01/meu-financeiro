$ErrorActionPreference='Stop'
$root='C:\ProgramData\MeuFinanceiro'
$directory=[IO.Path]::GetFullPath((Join-Path $root 'backups'))
if(!(Test-Path (Join-Path $root '.meu-financeiro'))){throw 'INVALID_INSTALLATION'}
$stamp=[DateTime]::UtcNow.ToString('yyyyMMdd-HHmmss')
$file=Join-Path $directory ('meu-financeiro-'+$stamp+'.dump')
$env:PGPASSWORD=[IO.File]::ReadAllText((Join-Path $root 'secrets\postgres.pw'))
try{
 & (Join-Path $root 'runtime\bin\pg_dump.exe') -h 127.0.0.1 -p 5440 -U postgres -d meu_financeiro -Fc -f $file
 if($LASTEXITCODE -ne 0){throw 'BACKUP_FAILED'}
 $globals=Join-Path $directory ('meu-financeiro-'+$stamp+'.globals.sql')
 & (Join-Path $root 'runtime\bin\pg_dumpall.exe') -h 127.0.0.1 -p 5440 -U postgres --globals-only --no-role-passwords -f $globals
 if($LASTEXITCODE -ne 0){throw 'BACKUP_ROLES_FAILED'}
 (Get-FileHash $globals -Algorithm SHA256).Hash | Set-Content ($globals+'.sha256')
 & (Join-Path $root 'runtime\bin\pg_restore.exe') --list $file *> (Join-Path $directory ($stamp+'.contents.txt'))
 if($LASTEXITCODE -ne 0){throw 'BACKUP_ARCHIVE_INVALID'}
 (Get-FileHash $file -Algorithm SHA256).Hash | Set-Content ($file+'.sha256')
 & (Join-Path $root 'runtime\bin\psql.exe') -X -h 127.0.0.1 -p 5440 -U postgres -d meu_financeiro -v ON_ERROR_STOP=1 -c "DELETE FROM app_private.sessions WHERE expires_at<now(); DELETE FROM app_private.login_attempts WHERE window_start<now()-interval '1 day';" | Out-Null
 if($LASTEXITCODE -ne 0){throw 'SESSION_MAINTENANCE_FAILED'}
 foreach($item in Get-ChildItem -LiteralPath $directory -File){
  $resolved=[IO.Path]::GetFullPath($item.FullName)
  if(!$resolved.StartsWith($directory+'\',[StringComparison]::OrdinalIgnoreCase)){throw 'INVALID_BACKUP_PATH'}
  if(($item.Name -match '^meu-financeiro-\d{8}-\d{6}\.(dump|globals\.sql)(\.sha256)?$' -or $item.Name -match '^\d{8}-\d{6}\.contents\.txt$') -and $item.LastWriteTimeUtc -lt [DateTime]::UtcNow.AddDays(-30)){Remove-Item -LiteralPath $resolved -Force}
 }
 Write-Output 'BACKUP_VERIFIED'
}finally{$env:PGPASSWORD=$null}
