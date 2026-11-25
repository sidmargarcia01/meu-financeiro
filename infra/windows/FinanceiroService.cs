using System;
using System.Diagnostics;
using System.ServiceProcess;
using System.IO;
public class FinanceiroService:ServiceBase {
 Process child;
 readonly object gate=new object();
 public FinanceiroService(){ServiceName="MeuFinanceiroWeb";CanStop=true;AutoLog=true;}
 void Log(string file,string line){if(line==null)return;lock(gate){File.AppendAllText(@"C:\ProgramData\MeuFinanceiro\logs\"+file,line+Environment.NewLine);}}
 protected override void OnStart(string[] args){
  var start=new ProcessStartInfo(@"C:\ProgramData\MeuFinanceiro\node.exe",@"--env-file=C:\ProgramData\MeuFinanceiro\secrets\app.env server.js");
  start.WorkingDirectory=@"C:\ProgramData\MeuFinanceiro\releases\20261125-native-02";
  start.UseShellExecute=false;start.CreateNoWindow=true;start.RedirectStandardOutput=true;start.RedirectStandardError=true;
  start.EnvironmentVariables["NEXT_TELEMETRY_DISABLED"]="1";
  child=new Process();child.StartInfo=start;child.EnableRaisingEvents=true;
  child.OutputDataReceived+=(s,e)=>Log("web.out.log",e.Data);
  child.ErrorDataReceived+=(s,e)=>Log("web.err.log",e.Data);
  child.Exited+=(s,e)=>Environment.Exit(1);
  child.Start();child.BeginOutputReadLine();child.BeginErrorReadLine();
 }
 protected override void OnStop(){if(child!=null&&!child.HasExited){child.EnableRaisingEvents=false;child.Kill();child.WaitForExit(10000);}}
 public static void Main(){ServiceBase.Run(new FinanceiroService());}
}
