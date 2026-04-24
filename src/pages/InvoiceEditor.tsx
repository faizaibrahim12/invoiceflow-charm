import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Plus, Trash2, Download, Save, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { InvoicePreview } from "@/components/InvoicePreview";
import { generateInvoicePdf, type InvoicePdfData } from "@/lib/invoicePdf";
import { toast } from "@/hooks/use-toast";

interface Item { id?: string; description: string; quantity: number; unit_price: number; line_total: number }
interface Client { id: string; name: string; email: string | null; address: string | null }
interface Profile { company_name: string | null; address: string | null; email: string | null; logo_url: string | null }

const newItem = (): Item => ({ description: "", quantity: 1, unit_price: 0, line_total: 0 });
const genNumber = () => `INV-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.floor(Math.random() * 9000 + 1000)}`;

export default function InvoiceEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isNew = !id || id === "new";

  const [clients, setClients] = useState<Client[]>([]);
  const [profile, setProfile] = useState<Profile>({ company_name: "", address: "", email: "", logo_url: "" });
  const [clientId, setClientId] = useState<string>("");
  const [number, setNumber] = useState(genNumber());
  const [issueDate, setIssueDate] = useState(new Date().toISOString().slice(0, 10));
  const [dueDate, setDueDate] = useState("");
  const [taxRate, setTaxRate] = useState(0);
  const [status, setStatus] = useState("pending");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<Item[]>([newItem()]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(!isNew);

  useEffect(() => {
    (async () => {
      const [{ data: cs }, { data: prof }] = await Promise.all([
        supabase.from("clients").select("*").order("name"),
        supabase.from("profiles").select("*").maybeSingle(),
      ]);
      setClients(cs || []);
      if (prof) setProfile(prof as Profile);

      if (!isNew) {
        const { data: inv } = await supabase.from("invoices").select("*, invoice_items(*)").eq("id", id).maybeSingle();
        if (inv) {
          setNumber(inv.invoice_number);
          setClientId(inv.client_id || "");
          setIssueDate(inv.issue_date);
          setDueDate(inv.due_date || "");
          setTaxRate(Number(inv.tax_rate));
          setStatus(inv.status);
          setNotes(inv.notes || "");
          const sortedItems = (inv.invoice_items || []).sort((a: any, b: any) => a.position - b.position);
          setItems(sortedItems.length ? sortedItems.map((it: any) => ({
            id: it.id, description: it.description, quantity: Number(it.quantity),
            unit_price: Number(it.unit_price), line_total: Number(it.line_total),
          })) : [newItem()]);
        }
        setLoading(false);
      }
    })();
  }, [id, isNew]);

  const totals = useMemo(() => {
    const subtotal = items.reduce((s, i) => s + i.quantity * i.unit_price, 0);
    const tax_amount = subtotal * (taxRate / 100);
    return { subtotal, tax_amount, total: subtotal + tax_amount };
  }, [items, taxRate]);

  const updateItem = (idx: number, patch: Partial<Item>) => {
    setItems(prev => prev.map((it, i) => {
      if (i !== idx) return it;
      const merged = { ...it, ...patch };
      merged.line_total = merged.quantity * merged.unit_price;
      return merged;
    }));
  };

  const selectedClient = clients.find(c => c.id === clientId) || null;

  const previewData: InvoicePdfData = {
    invoice_number: number, issue_date: issueDate, due_date: dueDate || null,
    status, notes, tax_rate: taxRate,
    subtotal: totals.subtotal, tax_amount: totals.tax_amount, total: totals.total,
    company: profile, client: selectedClient, items,
  };

  const save = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const payload = {
        user_id: user.id, client_id: clientId || null, invoice_number: number,
        issue_date: issueDate, due_date: dueDate || null, tax_rate: taxRate,
        subtotal: totals.subtotal, tax_amount: totals.tax_amount, total: totals.total,
        status: status as any, notes,
      };
      let invoiceId = id;
      if (isNew) {
        const { data, error } = await supabase.from("invoices").insert(payload).select().single();
        if (error) throw error;
        invoiceId = data.id;
      } else {
        const { error } = await supabase.from("invoices").update(payload).eq("id", id!);
        if (error) throw error;
        await supabase.from("invoice_items").delete().eq("invoice_id", id!);
      }
      const itemsPayload = items.map((it, idx) => ({
        invoice_id: invoiceId!, description: it.description,
        quantity: it.quantity, unit_price: it.unit_price, line_total: it.line_total, position: idx,
      }));
      if (itemsPayload.length) {
        const { error } = await supabase.from("invoice_items").insert(itemsPayload);
        if (error) throw error;
      }
      toast({ title: "Saved", description: "Invoice saved successfully" });
      if (isNew) navigate(`/invoices/${invoiceId}`);
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally { setSaving(false); }
  };

  const downloadPdf = async () => {
    const doc = await generateInvoicePdf(previewData);
    doc.save(`${number}.pdf`);
  };

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{isNew ? "New invoice" : "Edit invoice"}</h1>
          <p className="text-muted-foreground">Fill in details — preview updates live</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={downloadPdf}><Download className="h-4 w-4" /> PDF</Button>
          <Button onClick={save} disabled={saving} className="gradient-primary border-0">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <Card className="p-6 space-y-4 shadow-card">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Invoice #</Label><Input value={number} onChange={(e) => setNumber(e.target.value)} /></div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="unpaid">Unpaid</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Issue date</Label><Input type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} /></div>
              <div className="space-y-2"><Label>Due date</Label><Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} /></div>
            </div>
            <div className="space-y-2">
              <Label>Client</Label>
              <Select value={clientId} onValueChange={setClientId}>
                <SelectTrigger><SelectValue placeholder="Select a client" /></SelectTrigger>
                <SelectContent>
                  {clients.length === 0 && <div className="px-2 py-1 text-sm text-muted-foreground">No clients — add one first</div>}
                  {clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </Card>

          <Card className="p-6 space-y-3 shadow-card">
            <div className="flex items-center justify-between">
              <Label className="text-base">Items</Label>
              <Button size="sm" variant="outline" onClick={() => setItems([...items, newItem()])}><Plus className="h-3 w-3" /> Add</Button>
            </div>
            <div className="space-y-2">
              {items.map((it, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                  <Input className="col-span-6" placeholder="Description" value={it.description} onChange={(e) => updateItem(idx, { description: e.target.value })} />
                  <Input className="col-span-2" type="number" min="0" step="0.01" placeholder="Qty" value={it.quantity} onChange={(e) => updateItem(idx, { quantity: Number(e.target.value) })} />
                  <Input className="col-span-3" type="number" min="0" step="0.01" placeholder="Price" value={it.unit_price} onChange={(e) => updateItem(idx, { unit_price: Number(e.target.value) })} />
                  <Button size="icon" variant="ghost" className="col-span-1" onClick={() => setItems(items.filter((_, i) => i !== idx))}><Trash2 className="h-4 w-4" /></Button>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6 space-y-4 shadow-card">
            <div className="space-y-2">
              <Label>Tax rate (%)</Label>
              <Input type="number" min="0" step="0.01" value={taxRate} onChange={(e) => setTaxRate(Number(e.target.value))} />
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Payment terms, thank-you note, etc." />
            </div>
          </Card>
        </div>

        <div className="lg:sticky lg:top-20 lg:self-start">
          <InvoicePreview data={previewData} />
        </div>
      </div>
    </div>
  );
}
