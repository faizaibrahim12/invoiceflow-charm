import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FileText, Users, DollarSign, Clock, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Stats { invoices: number; clients: number; revenue: number; pending: number; }
interface Recent { id: string; invoice_number: string; total: number; status: string; created_at: string; clients: { name: string } | null }

export default function Dashboard() {
  const [stats, setStats] = useState<Stats>({ invoices: 0, clients: 0, revenue: 0, pending: 0 });
  const [recent, setRecent] = useState<Recent[]>([]);

  useEffect(() => {
    (async () => {
      const [{ data: invoices }, { count: clientCount }] = await Promise.all([
        supabase.from("invoices").select("id, invoice_number, total, status, created_at, clients(name)").order("created_at", { ascending: false }),
        supabase.from("clients").select("*", { count: "exact", head: true }),
      ]);
      const all = invoices || [];
      setRecent(all.slice(0, 5) as any);
      setStats({
        invoices: all.length,
        clients: clientCount || 0,
        revenue: all.filter(i => i.status === "paid").reduce((s, i) => s + Number(i.total), 0),
        pending: all.filter(i => i.status !== "paid").reduce((s, i) => s + Number(i.total), 0),
      });
    })();
  }, []);

  const statCards = [
    { label: "Total Revenue", value: `$${stats.revenue.toFixed(2)}`, icon: DollarSign, color: "text-success" },
    { label: "Pending", value: `$${stats.pending.toFixed(2)}`, icon: Clock, color: "text-warning" },
    { label: "Invoices", value: stats.invoices, icon: FileText, color: "text-primary" },
    { label: "Clients", value: stats.clients, icon: Users, color: "text-primary" },
  ];

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Overview of your invoicing activity</p>
        </div>
        <Button asChild className="gradient-primary border-0"><Link to="/invoices/new"><Plus className="h-4 w-4" /> New Invoice</Link></Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((s) => (
          <Card key={s.label} className="p-6 shadow-card">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">{s.label}</p>
              <s.icon className={`h-4 w-4 ${s.color}`} />
            </div>
            <p className="text-2xl font-bold tracking-tight">{s.value}</p>
          </Card>
        ))}
      </div>

      <Card className="p-6 shadow-card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Recent invoices</h2>
          <Button asChild variant="ghost" size="sm"><Link to="/invoices">View all</Link></Button>
        </div>
        {recent.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>No invoices yet. Create your first one!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {recent.map((inv) => (
              <Link key={inv.id} to={`/invoices/${inv.id}`} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition">
                <div>
                  <p className="font-medium">{inv.invoice_number}</p>
                  <p className="text-sm text-muted-foreground">{inv.clients?.name || "—"}</p>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={inv.status} />
                  <span className="font-semibold">${Number(inv.total).toFixed(2)}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { variant: any; label: string; className: string }> = {
    paid: { variant: "default", label: "Paid", className: "bg-success text-success-foreground hover:bg-success/90" },
    pending: { variant: "default", label: "Pending", className: "bg-warning text-warning-foreground hover:bg-warning/90" },
    unpaid: { variant: "default", label: "Unpaid", className: "bg-destructive text-destructive-foreground hover:bg-destructive/90" },
  };
  const m = map[status] || map.pending;
  return <Badge className={m.className}>{m.label}</Badge>;
}
