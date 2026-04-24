import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Search, FileText, Trash2, Pencil } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "./Dashboard";
import { toast } from "@/hooks/use-toast";

interface Inv { id: string; invoice_number: string; total: number; status: string; issue_date: string; clients: { name: string } | null }

export default function Invoices() {
  const [list, setList] = useState<Inv[]>([]);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<string>("all");

  const load = async () => {
    const { data } = await supabase.from("invoices").select("id, invoice_number, total, status, issue_date, clients(name)").order("created_at", { ascending: false });
    setList((data as any) || []);
  };
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => list.filter(i =>
    (status === "all" || i.status === status) &&
    (q === "" || i.invoice_number.toLowerCase().includes(q.toLowerCase()) || i.clients?.name?.toLowerCase().includes(q.toLowerCase()))
  ), [list, q, status]);

  const remove = async (id: string) => {
    if (!confirm("Delete this invoice?")) return;
    const { error } = await supabase.from("invoices").delete().eq("id", id);
    if (error) return toast({ title: "Error", description: error.message, variant: "destructive" });
    toast({ title: "Invoice deleted" }); load();
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Invoices</h1>
          <p className="text-muted-foreground">All invoices in one place</p>
        </div>
        <Button asChild className="gradient-primary border-0"><Link to="/invoices/new"><Plus className="h-4 w-4" /> New Invoice</Link></Button>
      </div>

      <Card className="p-4 shadow-card">
        <div className="flex gap-2 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search invoice or client..." value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
          </div>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="unpaid">Unpaid</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      <Card className="shadow-card">
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>No invoices found</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Number</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="w-24"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((i) => (
                <TableRow key={i.id}>
                  <TableCell className="font-medium">{i.invoice_number}</TableCell>
                  <TableCell>{i.clients?.name || "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{i.issue_date}</TableCell>
                  <TableCell><StatusBadge status={i.status} /></TableCell>
                  <TableCell className="text-right font-semibold">${Number(i.total).toFixed(2)}</TableCell>
                  <TableCell className="flex gap-1">
                    <Button asChild size="icon" variant="ghost"><Link to={`/invoices/${i.id}`}><Pencil className="h-4 w-4" /></Link></Button>
                    <Button size="icon" variant="ghost" onClick={() => remove(i.id)}><Trash2 className="h-4 w-4" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
