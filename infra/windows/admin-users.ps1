param(
 [Parameter(Mandatory=$true)][ValidateSet('create','reset-password','approve')][string]$Action,
 [Parameter(Mandatory=$true)][string]$Email,
 [string]$Name,
 [string]$PasswordFile
)
$ErrorActionPreference='Stop'
$root='C:\ProgramData\MeuFinanceiro'
$oldAdmin=$env:ADMIN_DATABASE_URL;$oldPath=$env:NODE_PATH
try {
 $password=[IO.File]::ReadAllText((Join-Path $root 'secrets\postgres.pw'))
 $env:ADMIN_DATABASE_URL='postgresql://postgres:'+ [Uri]::EscapeDataString($password)+'@127.0.0.1:5440/meu_financeiro'
 $password=$null
 $release=[IO.File]::ReadAllText((Join-Path $root 'current-release.txt')).Trim()
 $env:NODE_PATH=Join-Path $release 'node_modules'
 $arguments=@($Action,$Email)
 if($Action -eq 'create'){
  if([string]::IsNullOrWhiteSpace($Name) -or !$PasswordFile){throw 'NAME_AND_PRIVATE_PASSWORD_FILE_REQUIRED'}
  $arguments+=@($Name,$PasswordFile)
 }elseif($Action -eq 'reset-password'){
  if(!$PasswordFile){throw 'PRIVATE_PASSWORD_FILE_REQUIRED'}
  $arguments+=$PasswordFile
 }
 & (Join-Path $root 'node.exe') (Join-Path $PSScriptRoot 'manage-user.cjs') @arguments
 if($LASTEXITCODE -ne 0){throw 'LOCAL_ACCOUNT_OPERATION_FAILED'}
}finally{$env:ADMIN_DATABASE_URL=$oldAdmin;$env:NODE_PATH=$oldPath}
