import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";

interface Client { id: string; name: string; email: string | null; address: string | null }

export default function Clients() {
  const { user } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Client | null>(null);
  const [form, setForm] = useState({ name: "", email: "", address: "" });

  const load = async () => {
    const { data } = await supabase.from("clients").select("*").order("created_at", { ascending: false });
    setClients(data || []);
  };
  useEffect(() => { load(); }, []);

  const openNew = () => { setEditing(null); setForm({ name: "", email: "", address: "" }); setOpen(true); };
  const openEdit = (c: Client) => { setEditing(c); setForm({ name: c.name, email: c.email || "", address: c.address || "" }); setOpen(true); };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (editing) {
      const { error } = await supabase.from("clients").update(form).eq("id", editing.id);
      if (error) return toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      const { error } = await supabase.from("clients").insert({ ...form, user_id: user.id });
      if (error) return toast({ title: "Error", description: error.message, variant: "destructive" });
    }
    toast({ title: editing ? "Client updated" : "Client added" });
    setOpen(false); load();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this client?")) return;
    const { error } = await supabase.from("clients").delete().eq("id", id);
    if (error) return toast({ title: "Error", description: error.message, variant: "destructive" });
    toast({ title: "Client deleted" }); load();
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Clients</h1>
          <p className="text-muted-foreground">Manage your customer directory</p>
        </div>
        <Button onClick={openNew} className="gradient-primary border-0"><Plus className="h-4 w-4" /> Add Client</Button>
      </div>

      <Card className="shadow-card">
        {clients.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>No clients yet</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Address</TableHead>
                <TableHead className="w-24"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell className="text-muted-foreground">{c.email}</TableCell>
                  <TableCell className="text-muted-foreground truncate max-w-xs">{c.address}</TableCell>
                  <TableCell className="flex gap-1">
                    <Button size="icon" variant="ghost" onClick={() => openEdit(c)}><Pencil className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => remove(c.id)}><Trash2 className="h-4 w-4" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Edit client" : "New client"}</DialogTitle></DialogHeader>
          <form onSubmit={save} className="space-y-4">
            <div className="space-y-2"><Label>Name</Label><Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div className="space-y-2"><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
            <div className="space-y-2"><Label>Address</Label><Textarea value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
            <DialogFooter><Button type="submit" className="gradient-primary border-0">Save</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
