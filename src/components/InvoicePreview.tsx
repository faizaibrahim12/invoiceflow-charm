import type { InvoicePdfData } from "@/lib/invoicePdf";

export function InvoicePreview({ data }: { data: InvoicePdfData }) {
  return (
    <div className="bg-white text-slate-900 p-8 rounded-lg shadow-card text-sm" style={{ minHeight: "29.7cm" }}>
      <div className="flex items-start justify-between mb-8">
        <div>
          {data.company.logo_url && <img src={data.company.logo_url} alt="logo" className="h-16 mb-2 object-contain" />}
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold tracking-tight">INVOICE</div>
          <div className="text-slate-500 mt-1">#{data.invoice_number}</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-8 mb-8">
        <div>
          <div className="text-xs uppercase text-slate-400 font-semibold mb-1">From</div>
          <div className="font-semibold">{data.company.company_name || "Your Company"}</div>
          {data.company.address && <div className="text-slate-600 whitespace-pre-line">{data.company.address}</div>}
          {data.company.email && <div className="text-slate-600">{data.company.email}</div>}
        </div>
        <div>
          <div className="text-xs uppercase text-slate-400 font-semibold mb-1">Bill to</div>
          <div className="font-semibold">{data.client?.name || "—"}</div>
          {data.client?.address && <div className="text-slate-600 whitespace-pre-line">{data.client.address}</div>}
          {data.client?.email && <div className="text-slate-600">{data.client.email}</div>}
        </div>
      </div>

      <div className="flex justify-between text-xs text-slate-500 mb-4 border-y border-slate-200 py-2">
        <span>Issue: <strong className="text-slate-900">{data.issue_date}</strong></span>
        {data.due_date && <span>Due: <strong className="text-slate-900">{data.due_date}</strong></span>}
        <span>Status: <strong className="text-slate-900 uppercase">{data.status}</strong></span>
      </div>

      <table className="w-full mb-6">
        <thead>
          <tr className="bg-indigo-500 text-white text-left">
            <th className="p-2 rounded-l">Description</th>
            <th className="p-2 text-right">Qty</th>
            <th className="p-2 text-right">Price</th>
            <th className="p-2 text-right rounded-r">Total</th>
          </tr>
        </thead>
        <tbody>
          {data.items.map((it, i) => (
            <tr key={i} className="border-b border-slate-100">
              <td className="p-2">{it.description || <span className="text-slate-300">—</span>}</td>
              <td className="p-2 text-right">{it.quantity}</td>
              <td className="p-2 text-right">${it.unit_price.toFixed(2)}</td>
              <td className="p-2 text-right">${it.line_total.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex justify-end">
        <div className="w-64 space-y-1">
          <div className="flex justify-between text-slate-600"><span>Subtotal</span><span>${data.subtotal.toFixed(2)}</span></div>
          {data.tax_rate > 0 && <div className="flex justify-between text-slate-600"><span>Tax ({data.tax_rate}%)</span><span>${data.tax_amount.toFixed(2)}</span></div>}
          <div className="flex justify-between border-t border-slate-200 pt-2 font-bold text-base"><span>Total</span><span>${data.total.toFixed(2)}</span></div>
        </div>
      </div>

      {data.notes && (
        <div className="mt-8 pt-4 border-t border-slate-200">
          <div className="text-xs uppercase text-slate-400 font-semibold mb-1">Notes</div>
          <div className="text-slate-600 whitespace-pre-line">{data.notes}</div>
        </div>
      )}
    </div>
  );
}
