import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertCircle, Shield, ShieldAlert, Monitor, Clock, LogIn, Lock, ArrowLeft, XCircle } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import logsData from "@/data/security_logs.json";
import { useAuth } from "@/hooks/useAuth";

export default function SecurityDashboard() {
  const navigate = useNavigate();
  const { dtmUser } = useAuth();
  
  const [logs, setLogs] = useState<any[]>(logsData);
  const [viewingCapture, setViewingCapture] = useState<string | null>(null);
  const [blockedIPs, setBlockedIPs] = useState<string[]>(() => {
    return JSON.parse(localStorage.getItem("blocked_ips") || "[]");
  });

  useEffect(() => {
    if (dtmUser) {
      setLogs([{
        id: 1,
        user: dtmUser.full_name || "Siz",
        role: dtmUser.role === "superadmin" || dtmUser.role === "admin" ? "Super Admin" : dtmUser.role === "district" ? "Tuman Admin" : "Maktab Admin",
        ip: "127.0.0.1 (Lokal)",
        location: "O'zbekiston (Siz)",
        time: new Date().toLocaleTimeString().slice(0, 5),
        duration: "0h 01m",
        status: "Active"
      }]);
    } else {
      setLogs([]);
    }
  }, [dtmUser]);

  const activeLogs = logs.filter(l => l.status === "Active").length;
  const blockedLogs = logs.filter(l => l.status === "Blocked" || blockedIPs.includes(l.ip)).length;

  const closeSession = (id: number) => {
    setLogs(prev => prev.map(l => l.id === id ? { ...l, status: "Closed", duration: "Yopildi" } : l));
  };

  const blockIP = (ip: string) => {
    setBlockedIPs(prev => {
      const next = [...prev, ip];
      localStorage.setItem("blocked_ips", JSON.stringify(next));
      return next;
    });
    setLogs(prev => prev.map(l => l.ip === ip ? { ...l, status: "Blocked" } : l));
  };

  const unblockIP = (ip: string) => {
    setBlockedIPs(prev => {
      const next = prev.filter(x => x !== ip);
      localStorage.setItem("blocked_ips", JSON.stringify(next));
      return next;
    });
  };

  const chartData = [
    { name: "09:00", kirish: 1, hack: 0 },
    { name: "12:00", kirish: 3, hack: 0 },
    { name: "15:00", kirish: 1, hack: 1 },
    { name: "18:00", kirish: 2, hack: 0 },
    { name: "21:00", kirish: 0, hack: 1 },
    { name: "00:00", kirish: 0, hack: 1 },
  ];

  return (
    <AdminLayout variant="super">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="icon" onClick={() => navigate("/super-admin")} className="rounded-xl h-9 w-9">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Sessiyalar & Xavfsizlik</h1>
              <p className="text-muted-foreground text-sm">Loyihaning xavfsizlik va kirish jurnalini kuzatish</p>
            </div>
          </div>
          <Badge className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border-emerald-500/20 gap-1 rounded-full px-3 py-1">
            <Shield className="h-3.5 w-3.5" /> Himoyalangan
          </Badge>
        </div>

        {/* Warning Banner for Hacking Attempts */}
        {blockedLogs > 0 && (
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex items-center justify-between bg-red-600/10 text-red-600 p-4 rounded-2xl border border-red-600/20"
          >
            <div className="flex items-center gap-2 text-sm font-semibold">
              <ShieldAlert className="h-5 w-5" />
              <span>Diqqat! Oxirgi 24 soat ichida {blockedLogs} ta noqonuniy kirish (Hack) xuruji to'xtatildi!</span>
            </div>
          </motion.div>
        )}

        {/* 1. KPI Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="rounded-2xl border-primary/20 bg-gradient-to-b from-transparent to-primary/5">
            <CardContent className="pt-6">
              <div className="flex justify-between items-start">
                <div className="p-3 bg-primary/10 rounded-xl text-primary">
                  <Monitor className="h-5 w-5" />
                </div>
                <Badge variant="secondary" className="rounded-full">Lokal</Badge>
              </div>
              <p className="text-2xl font-bold mt-4">{logs.length}</p>
              <p className="text-xs text-muted-foreground">Jami sessiyalar jurnali</p>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-emerald-500/20 bg-gradient-to-b from-transparent to-emerald-500/5">
            <CardContent className="pt-6">
              <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-600 w-fit">
                <LogIn className="h-5 w-5" />
              </div>
              <p className="text-2xl font-bold mt-4 text-emerald-600">{activeLogs}</p>
              <p className="text-xs text-muted-foreground">Ayni vaqtda faol (Current)</p>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-red-500/20 bg-gradient-to-b from-transparent to-red-500/5">
            <CardContent className="pt-6">
              <div className="p-3 bg-red-500/10 rounded-xl text-red-600 w-fit">
                <Lock className="h-5 w-5" />
              </div>
              <p className="text-2xl font-bold mt-4 text-red-600">{blockedLogs}</p>
              <p className="text-xs text-muted-foreground">Bloklangan urinishlar (Bot/Hack)</p>
            </CardContent>
          </Card>
        </div>

        {/* 2. Visualizations Chart */}
        <div className="grid gap-5 lg:grid-cols-2">
          <Card className="rounded-2xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-500" /> Kirishlar Dinamikasi
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "10px" }} />
                    <Line type="monotone" dataKey="kirish" stroke="hsl(217 91% 60%)" strokeWidth={2} dot={{ r: 3 }} name="Kirish" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-red-500/10">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2 text-red-600">
                <ShieldAlert className="h-4 w-4" /> To'xtatilgan Xurujlar
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "10px" }} />
                    <Bar dataKey="hack" fill="hsl(0 72% 55%)" radius={[4, 4, 0, 0]} name="Hack urinishi" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 3. Log Table */}
        <Card className="rounded-2xl overflow-hidden border-border/50 shadow-sm">
          <CardHeader className="pb-3 border-b border-border/40">
            <CardTitle className="text-base font-semibold">Tizim Jurnali (Audit Logs)</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-muted/50 border-b border-border/40">
                    <th className="p-3 font-semibold text-xs text-muted-foreground w-10">Id</th>
                    <th className="p-3 font-semibold text-xs text-muted-foreground">Admin/Foydalanuvchi</th>
                    <th className="p-3 font-semibold text-xs text-muted-foreground">IP Manzil</th>
                    <th className="p-3 font-semibold text-xs text-muted-foreground">Joylashuv</th>
                    <th className="p-3 font-semibold text-xs text-muted-foreground">Vaqt</th>
                    <th className="p-3 font-semibold text-xs text-muted-foreground">Holat</th>
                    <th className="p-3 font-semibold text-xs text-muted-foreground w-28">Amallar</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map(l => {
                    const isIpBlocked = l.status === "Blocked" || blockedIPs.includes(l.ip);
                    return (
                      <tr key={l.id} className="border-b border-border/20 last:border-0 hover:bg-muted/30 transition-colors">
                        <td className="p-3 font-mono text-xs text-muted-foreground">{l.id}</td>
                        <td className="p-3">
                          <div className="font-medium">{l.user}</div>
                          <div className="text-xs text-muted-foreground">{l.role}</div>
                        </td>
                        <td className="p-3 font-mono text-xs">{l.ip}</td>
                        <td className="p-3 text-xs">{l.location}</td>
                        <td className="p-3 text-xs">{l.time} <span className="text-muted-foreground ml-1">({l.duration})</span></td>
                        <td className="p-3">
                          {l.status === "Active" && !isIpBlocked ? (
                            <Badge className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/10 border-0 rounded-full font-normal">Faol</Badge>
                          ) : isIpBlocked ? (
                            <div className="space-y-1">
                              <Badge variant="destructive" className="rounded-full font-normal">Bloklandi</Badge>
                              {l.action && <div className="text-[10px] text-red-600">{l.action}</div>}
                            </div>
                          ) : (
                            <Badge variant="secondary" className="rounded-full font-normal">Yopilgan</Badge>
                          )}
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-1.5">
                            {l.status === "Active" && !isIpBlocked && (
                              <Button size="sm" variant="outline" className="h-7 text-[10px] px-2 rounded-lg" onClick={() => closeSession(l.id)}>Yopish</Button>
                            )}
                            {!isIpBlocked ? (
                              <Button size="sm" variant="destructive" className="h-7 text-[10px] px-2 rounded-lg bg-red-600 hove:bg-red-700" onClick={() => blockIP(l.ip)}>Bloklash</Button>
                            ) : (
                              <div className="flex items-center gap-1">
                                <Button size="sm" variant="outline" className="h-7 text-[10px] px-2 rounded-lg text-emerald-600 border-emerald-500/30 hover:bg-emerald-50" onClick={() => unblockIP(l.ip)}>O'chirish</Button>
                                <Button size="sm" variant="outline" className="h-7 text-[10px] px-2 rounded-lg text-red-600 border-red-500/20 bg-red-500/5 hover:bg-red-500/10 gap-1 flex items-center" onClick={() => setViewingCapture(l.ip)}>
                                  📷 Screen
                                </Button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* 4. Blocked IPs State panel */}
        {blockedIPs.length > 0 && (
          <Card className="rounded-2xl border-red-500/20 shadow-sm">
            <CardHeader className="pb-3 border-b border-border/40">
              <CardTitle className="text-sm font-semibold flex items-center gap-2 text-red-600">
                <Lock className="h-4 w-4" /> Bloklangan IP Manzillar ({blockedIPs.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3">
              <div className="flex flex-wrap gap-2">
                {blockedIPs.map(ip => (
                  <Badge key={ip} variant="outline" className="rounded-full flex items-center gap-1 text-xs border-red-200 bg-red-50/50 text-red-700 pr-1">
                    {ip}
                    <Button size="icon" variant="ghost" className="h-4 w-4 rounded-full p-0 text-red-500 hover:text-red-700 hover:bg-red-100" onClick={() => unblockIP(ip)}>
                      <XCircle className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* 🖼️ Screen Capture Modal Simulation */}
        {viewingCapture && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setViewingCapture(null)}>
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-card border border-border/80 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-4 border-b border-border/50 flex items-center justify-between">
                <h3 className="font-bold flex items-center gap-2 text-sm"><ShieldAlert className="h-4 w-4 text-red-600" /> Ekran Tasviri (Sandbox): IP {viewingCapture}</h3>
                <Button size="icon" variant="ghost" className="rounded-full h-8 w-8" onClick={() => setViewingCapture(null)}><XCircle className="h-4 w-4" /></Button>
              </div>
              <div className="p-0 aspect-video bg-black/95 relative flex flex-col items-center justify-center font-mono text-[11px] text-emerald-400">
                <div className="absolute top-3 left-3 text-red-600 text-[10px] animate-pulse font-bold flex items-center gap-1">● REC - CAPTURED</div>
                <pre className="p-6 w-full h-full overflow-hidden text-emerald-500 opacity-80 select-none">
{`
# Session ID: ${Math.random().toString(36).substring(2, 10).toUpperCase()}
# Timestamp: ${new Date().toLocaleTimeString()}
# User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64)
# Location: ${logs.find(l => l.ip === viewingCapture)?.location || "Aniq emas"} (IP orqali)
# Path: /super-admin/compare_entities?filter=all
# Payload: UNION SELECT null, username, password FROM adm_users--
# Local IP: 192.168.1.13

[SYSTEM] Dom rendering captured to internal node capture. Buffer flushed.
[ALERT] Remote view bound to WebSocket channel 5.
[EXEC] block_ip(${viewingCapture});
`}
                </pre>
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent flex items-center justify-center">
                  <div className="text-center">
                    <Lock className="h-12 w-12 mx-auto text-red-500 mb-2 animate-bounce" />
                    <p className="text-sm font-semibold text-white">Xavf to'xtatildi! User blokka tushdi.</p>
                    <p className="text-xs text-muted-foreground mt-1">Noma'lum skriptlar ishga tushirilgan sahifa holati saqlandi.</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
