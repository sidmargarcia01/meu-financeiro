using System;
using System.Diagnostics;
using System.ServiceProcess;
using System.IO;
public class FinanceiroService:ServiceBase {
 Process child;
 bool stopping;
 readonly object gate=new object();
 public FinanceiroService(){ServiceName="MeuFinanceiroWeb";CanStop=true;AutoLog=true;}
 void Log(string file,string line){if(line==null)return;lock(gate){File.AppendAllText(@"C:\ProgramData\MeuFinanceiro\logs\"+file,line+Environment.NewLine);}}
 protected override void OnStart(string[] args){
  stopping=false;
  var start=new ProcessStartInfo(@"C:\ProgramData\MeuFinanceiro\node.exe",@"--env-file=C:\ProgramData\MeuFinanceiro\secrets\app.env server.js");
  var release=Path.GetFullPath(File.ReadAllText(@"C:\ProgramData\MeuFinanceiro\current-release.txt").Trim());
  if(!release.StartsWith(@"C:\ProgramData\MeuFinanceiro\releases\",StringComparison.OrdinalIgnoreCase)||!File.Exists(Path.Combine(release,"server.js")))throw new InvalidOperationException("Invalid managed release");
  start.WorkingDirectory=release;
  start.UseShellExecute=false;start.CreateNoWindow=true;start.RedirectStandardOutput=true;start.RedirectStandardError=true;
  start.EnvironmentVariables["NEXT_TELEMETRY_DISABLED"]="1";
  child=new Process();child.StartInfo=start;child.EnableRaisingEvents=true;
  child.OutputDataReceived+=(s,e)=>Log("web.out.log",e.Data);
  child.ErrorDataReceived+=(s,e)=>Log("web.err.log",e.Data);
  child.Exited+=(s,e)=>{if(!stopping)Environment.Exit(1);};
  child.Start();child.BeginOutputReadLine();child.BeginErrorReadLine();
 }
 protected override void OnStop(){stopping=true;if(child!=null&&!child.HasExited){child.EnableRaisingEvents=false;child.Kill();child.WaitForExit(10000);}}
 public static void Main(){ServiceBase.Run(new FinanceiroService());}
}
