import { Link } from "react-router-dom";
import { FileText, Sparkles, Download, Users, ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/hooks/useAuth";

export default function Landing() {
  const { user } = useAuth();
  return (
    <div className="min-h-screen gradient-subtle">
      <header className="container flex items-center justify-between py-6">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-xl gradient-primary flex items-center justify-center shadow-elegant">
            <FileText className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold tracking-tight">InvoiceFlow</span>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button asChild variant="ghost"><Link to={user ? "/dashboard" : "/auth"}>{user ? "Dashboard" : "Sign in"}</Link></Button>
          <Button asChild className="gradient-primary border-0"><Link to={user ? "/dashboard" : "/auth"}>Get started</Link></Button>
        </div>
      </header>

      <section className="container py-20 md:py-32 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent text-accent-foreground text-xs font-medium mb-6">
          <Sparkles className="h-3 w-3" /> Built for modern freelancers & teams
        </div>
        <h1 className="text-5xl md:text-7xl font-bold tracking-tighter max-w-4xl mx-auto leading-[1.05]">
          Invoicing that <span className="bg-clip-text text-transparent gradient-primary">flows</span>.
        </h1>
        <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
          Create stunning invoices, track clients, and get paid faster. No spreadsheets. No friction.
        </p>
        <div className="mt-10 flex items-center justify-center gap-3">
          <Button asChild size="lg" className="gradient-primary border-0 shadow-elegant">
            <Link to={user ? "/dashboard" : "/auth"}>Start free <ArrowRight className="h-4 w-4" /></Link>
          </Button>
        </div>
      </section>

      <section className="container py-16 grid md:grid-cols-3 gap-6">
        {[
          { icon: Users, title: "Manage clients", desc: "Keep all your clients organized in one place." },
          { icon: FileText, title: "Live preview", desc: "See your invoice update in real time as you type." },
          { icon: Download, title: "Instant PDF", desc: "Download polished, branded PDFs in one click." },
        ].map((f) => (
          <div key={f.title} className="p-6 rounded-2xl bg-card border shadow-card">
            <div className="h-10 w-10 rounded-lg bg-accent flex items-center justify-center mb-4">
              <f.icon className="h-5 w-5 text-accent-foreground" />
            </div>
            <h3 className="font-semibold mb-2">{f.title}</h3>
            <p className="text-sm text-muted-foreground">{f.desc}</p>
          </div>
        ))}
      </section>

      <footer className="container py-12 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} InvoiceFlow. Built with Lovable.
      </footer>
    </div>
  );
}
