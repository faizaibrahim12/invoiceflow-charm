import { useEffect, useRef, useState } from "react";
import { Loader2, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";

export default function Settings() {
  const { user } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({ company_name: "", address: "", email: "", logo_url: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
      if (data) setForm({ company_name: data.company_name || "", address: data.address || "", email: data.email || user.email || "", logo_url: data.logo_url || "" });
      setLoading(false);
    })();
  }, [user]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").upsert({ id: user.id, ...form });
    setSaving(false);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else toast({ title: "Saved", description: "Company profile updated" });
  };

  const onUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    const path = `${user.id}/logo-${Date.now()}-${file.name}`;
    const { error: upErr } = await supabase.storage.from("logos").upload(path, file, { upsert: true });
    if (upErr) { setUploading(false); return toast({ title: "Upload failed", description: upErr.message, variant: "destructive" }); }
    const { data } = supabase.storage.from("logos").getPublicUrl(path);
    setForm(f => ({ ...f, logo_url: data.publicUrl }));
    setUploading(false);
    toast({ title: "Logo uploaded" });
  };

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Your company profile appears on every invoice</p>
      </div>

      <Card className="p-6 shadow-card">
        <form onSubmit={save} className="space-y-4">
          <div className="space-y-2"><Label>Company name</Label><Input value={form.company_name} onChange={(e) => setForm({ ...form, company_name: e.target.value })} /></div>
          <div className="space-y-2"><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
          <div className="space-y-2"><Label>Address</Label><Textarea value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
          <div className="space-y-2">
            <Label>Logo</Label>
            <div className="flex items-center gap-4">
              {form.logo_url && <img src={form.logo_url} alt="logo" className="h-16 w-16 object-contain rounded border" />}
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onUpload} />
              <Button type="button" variant="outline" onClick={() => fileRef.current?.click()} disabled={uploading}>
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />} Upload
              </Button>
            </div>
          </div>
          <Button type="submit" disabled={saving} className="gradient-primary border-0">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Save changes
          </Button>
        </form>
      </Card>
    </div>
  );
}
