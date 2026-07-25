import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { getStorefrontConfig } from "@/lib/storefront";
import PrintButton from "./PrintButton";

export const dynamic = "force-dynamic";

export default async function InvoicePage({ params }: { params: Promise<{ orderNumber: string }> }) {
  const { orderNumber } = await params;
  const order = await db.order.findFirst({
    where: { orderNumber },
    include: { items: true },
  });
  if (!order) notFound();

  const config = await getStorefrontConfig();
  const settingRows = await db.setting.findMany({ where: { key: { in: ["store_address", "seller_gstin"] } } });
  const s: Record<string, string> = {};
  for (const r of settingRows) s[r.key] = r.value;

  const subtotal = Number(order.subtotal);
  const shipping = Number(order.shippingCharge);
  const gstAmount = order.gstAmount ? Number(order.gstAmount) : 0;
  const total = Number(order.totalAmount);

  const money = (n: number) => `₹${n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="min-h-screen bg-gray-100 py-8 print:bg-white print:py-0">
      <style>{`@media print { .no-print { display: none !important; } @page { margin: 12mm; } }`}</style>

      <div className="max-w-3xl mx-auto px-4 no-print mb-4 flex items-center justify-between">
        <a href="/track" className="text-sm text-gray-500 hover:text-orange-500">← Back</a>
        <PrintButton />
      </div>

      <div className="max-w-3xl mx-auto bg-white shadow-sm print:shadow-none p-8 md:p-10">
        {/* Header */}
        <div className="flex items-start justify-between pb-6 border-b-2 border-gray-900">
          <div>
            {config.storeLogo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={config.storeLogo} alt={config.storeName} className="h-12 w-auto object-contain mb-2" />
            ) : (
              <h1 className="text-2xl font-bold text-gray-900">{config.storeName}</h1>
            )}
            <p className="text-xs text-gray-500 mt-1 max-w-xs whitespace-pre-line">{s.store_address || "India"}</p>
            <p className="text-xs text-gray-500">📞 {config.storePhone} · ✉️ {config.storeEmail}</p>
            {s.seller_gstin && <p className="text-xs text-gray-600 mt-0.5">GSTIN: {s.seller_gstin}</p>}
          </div>
          <div className="text-right">
            <h2 className="text-2xl font-bold text-gray-900">INVOICE</h2>
            <p className="text-sm text-gray-600 mt-1">#{order.orderNumber}</p>
            <p className="text-xs text-gray-500">{new Date(order.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })}</p>
            <span className={`inline-block mt-1 text-xs font-semibold px-2 py-0.5 rounded ${order.paymentStatus === "PAID" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
              {order.paymentStatus}
            </span>
          </div>
        </div>

        {/* Bill to */}
        <div className="grid grid-cols-2 gap-6 py-6">
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">Bill / Ship To</p>
            <p className="font-semibold text-gray-900">{order.customerName}</p>
            <p className="text-sm text-gray-600">{order.customerPhone}</p>
            {order.customerEmail && <p className="text-sm text-gray-600">{order.customerEmail}</p>}
            <p className="text-sm text-gray-600 mt-1">{order.address}, {order.city}, {order.state} - {order.pinCode}</p>
            {order.gstNumber && <p className="text-xs text-gray-600 mt-1">Customer GSTIN: {order.gstNumber}</p>}
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">Payment</p>
            <p className="text-sm text-gray-600">Status: {order.paymentStatus}</p>
            {order.courierName && <p className="text-sm text-gray-600">Courier: {order.courierName}</p>}
            {order.trackingNumber && <p className="text-sm text-gray-600">AWB: {order.trackingNumber}</p>}
          </div>
        </div>

        {/* Items */}
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-900 text-white text-left">
              <th className="px-3 py-2 font-medium">Product</th>
              <th className="px-3 py-2 font-medium text-center">Qty</th>
              <th className="px-3 py-2 font-medium text-right">Unit</th>
              <th className="px-3 py-2 font-medium text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item) => {
              const custom = item.customizationData as Record<string, string> | null;
              const details = custom
                ? Object.entries(custom)
                    .filter(([k, v]) => v && !k.startsWith("_") && !String(v).startsWith("http") && !String(v).startsWith("["))
                    .map(([k, v]) => `${k}: ${v}`)
                    .join(" · ")
                : "";
              return (
                <tr key={item.id} className="border-b border-gray-100 align-top">
                  <td className="px-3 py-2.5">
                    <p className="font-medium text-gray-900">{item.productName}</p>
                    {details && <p className="text-[11px] text-gray-500 mt-0.5">{details}</p>}
                  </td>
                  <td className="px-3 py-2.5 text-center">{item.quantity}</td>
                  <td className="px-3 py-2.5 text-right">{money(Number(item.unitPrice))}</td>
                  <td className="px-3 py-2.5 text-right font-medium">{money(Number(item.totalPrice))}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Totals */}
        <div className="flex justify-end mt-4">
          <div className="w-64 space-y-1.5 text-sm">
            <div className="flex justify-between text-gray-600"><span>Subtotal</span><span>{money(subtotal)}</span></div>
            <div className="flex justify-between text-gray-600"><span>Shipping</span><span>{money(shipping)}</span></div>
            {order.giftWrapping && <div className="flex justify-between text-gray-600"><span>Gift Wrap</span><span>{money(49)}</span></div>}
            {gstAmount > 0 && (
              <div className="flex justify-between text-gray-600">
                <span>GST{order.gstRate ? ` (${order.gstRate}%)` : ""}</span>
                <span>{money(gstAmount)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-gray-900 text-base pt-2 border-t-2 border-gray-900">
              <span>Grand Total</span><span>{money(total)}</span>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-10 pt-6 border-t border-gray-100">
          Thank you for shopping with {config.storeName}! · This is a computer-generated invoice.
        </p>
      </div>
    </div>
  );
}
