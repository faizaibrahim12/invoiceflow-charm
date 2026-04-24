import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export interface InvoicePdfData {
  invoice_number: string;
  issue_date: string;
  due_date?: string | null;
  status: string;
  notes?: string | null;
  tax_rate: number;
  subtotal: number;
  tax_amount: number;
  total: number;
  company: { company_name?: string | null; address?: string | null; email?: string | null; logo_url?: string | null };
  client: { name?: string | null; email?: string | null; address?: string | null } | null;
  items: { description: string; quantity: number; unit_price: number; line_total: number }[];
}

async function loadImage(url: string): Promise<string | null> {
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    return await new Promise((resolve) => {
      const r = new FileReader();
      r.onloadend = () => resolve(r.result as string);
      r.onerror = () => resolve(null);
      r.readAsDataURL(blob);
    });
  } catch { return null; }
}

export async function generateInvoicePdf(data: InvoicePdfData): Promise<jsPDF> {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 40;
  let y = margin;

  // Header
  if (data.company.logo_url) {
    const img = await loadImage(data.company.logo_url);
    if (img) {
      try { doc.addImage(img, "PNG", margin, y, 60, 60); } catch {}
    }
  }
  doc.setFontSize(24).setFont("helvetica", "bold");
  doc.text("INVOICE", pageW - margin, y + 20, { align: "right" });
  doc.setFontSize(10).setFont("helvetica", "normal").setTextColor(100);
  doc.text(`#${data.invoice_number}`, pageW - margin, y + 38, { align: "right" });
  doc.setTextColor(0);

  y += 80;

  // Company / Client
  doc.setFontSize(9).setTextColor(120);
  doc.text("FROM", margin, y);
  doc.text("BILL TO", pageW / 2, y);
  doc.setTextColor(0).setFontSize(11).setFont("helvetica", "bold");
  doc.text(data.company.company_name || "Your Company", margin, y + 16);
  doc.text(data.client?.name || "Client", pageW / 2, y + 16);
  doc.setFont("helvetica", "normal").setFontSize(10).setTextColor(80);
  const fromLines = [data.company.address, data.company.email].filter(Boolean).join("\n").split("\n");
  const toLines = [data.client?.address, data.client?.email].filter(Boolean).join("\n").split("\n");
  fromLines.forEach((l, i) => doc.text(l, margin, y + 32 + i * 12));
  toLines.forEach((l, i) => doc.text(l, pageW / 2, y + 32 + i * 12));

  y += 32 + Math.max(fromLines.length, toLines.length) * 12 + 20;

  // Dates
  doc.setTextColor(120).setFontSize(9);
  doc.text(`Issue date: ${data.issue_date}`, margin, y);
  if (data.due_date) doc.text(`Due date: ${data.due_date}`, margin + 180, y);
  doc.text(`Status: ${data.status.toUpperCase()}`, pageW - margin, y, { align: "right" });
  doc.setTextColor(0);
  y += 20;

  // Items table
  autoTable(doc, {
    startY: y,
    head: [["Description", "Qty", "Unit Price", "Total"]],
    body: data.items.map(i => [i.description, String(i.quantity), `$${i.unit_price.toFixed(2)}`, `$${i.line_total.toFixed(2)}`]),
    headStyles: { fillColor: [99, 102, 241], textColor: 255, fontStyle: "bold" },
    columnStyles: { 1: { halign: "right" }, 2: { halign: "right" }, 3: { halign: "right" } },
    margin: { left: margin, right: margin },
  });

  let endY = (doc as any).lastAutoTable.finalY + 20;

  // Totals
  const totalsX = pageW - margin - 200;
  doc.setFontSize(10);
  doc.text("Subtotal", totalsX, endY); doc.text(`$${data.subtotal.toFixed(2)}`, pageW - margin, endY, { align: "right" });
  endY += 16;
  if (data.tax_rate > 0) {
    doc.text(`Tax (${data.tax_rate}%)`, totalsX, endY); doc.text(`$${data.tax_amount.toFixed(2)}`, pageW - margin, endY, { align: "right" });
    endY += 16;
  }
  doc.setFont("helvetica", "bold").setFontSize(12);
  doc.text("Total", totalsX, endY + 4); doc.text(`$${data.total.toFixed(2)}`, pageW - margin, endY + 4, { align: "right" });

  if (data.notes) {
    endY += 40;
    doc.setFont("helvetica", "bold").setFontSize(10).text("Notes", margin, endY);
    doc.setFont("helvetica", "normal").setTextColor(80);
    doc.text(doc.splitTextToSize(data.notes, pageW - 2 * margin), margin, endY + 14);
  }

  return doc;
}
