"use client";
/**
 * RecentOrdersTable — clean table showing last 5 orders
 * src/features/dashboard/components/RecentOrdersTable.tsx
 */
import { Card, Text, Badge } from "@mantine/core";
import { FileText } from "lucide-react";

interface MockOrder {
  orderNumber: string;
  clientName: string;
  eventType: string;
  orderStatus:
    | "draft"
    | "pending_payment"
    | "payment_verified"
    | "in_production"
    | "completed"
    | "cancelled";
  statusLabel: string;
  date: string;
  amount: string;
}

const LATEST_ORDERS: MockOrder[] = [
  {
    orderNumber: "UDS-202606-0007",
    clientName: "Budi Prasetyo",
    eventType: "Pernikahan",
    orderStatus: "payment_verified",
    statusLabel: "Terverifikasi",
    date: "30 Jun 2026",
    amount: "Rp 1.200.000",
  },
  {
    orderNumber: "UDS-202606-0006",
    clientName: "Riana Lestari",
    eventType: "Lamaran",
    orderStatus: "in_production",
    statusLabel: "Dalam Produksi",
    date: "29 Jun 2026",
    amount: "Rp 850.000",
  },
  {
    orderNumber: "UDS-202606-0005",
    clientName: "Aditya Pratama",
    eventType: "Pernikahan",
    orderStatus: "completed",
    statusLabel: "Selesai",
    date: "28 Jun 2026",
    amount: "Rp 1.500.000",
  },
  {
    orderNumber: "UDS-202606-0004",
    clientName: "Siti Rahma",
    eventType: "Khitanan",
    orderStatus: "pending_payment",
    statusLabel: "Menunggu",
    date: "27 Jun 2026",
    amount: "Rp 650.000",
  },
  {
    orderNumber: "UDS-202606-0003",
    clientName: "Dian Wijaya",
    eventType: "Aqiqah",
    orderStatus: "cancelled",
    statusLabel: "Dibatalkan",
    date: "26 Jun 2026",
    amount: "Rp 750.000",
  },
];

const STATUS_BADGE: Record<MockOrder["orderStatus"], { color: string }> = {
  draft: { color: "gray" },
  pending_payment: { color: "yellow" },
  payment_verified: { color: "blue" },
  in_production: { color: "indigo" },
  completed: { color: "teal" },
  cancelled: { color: "red" },
};

export default function RecentOrdersTable() {
  return (
    <Card
      radius="12px"
      style={{
        border: "1px solid var(--color-border)",
        boxShadow: "none",
        padding: "24px",
        backgroundColor: "var(--color-surface)",
      }}
    >
      <div className="flex items-center justify-between mb-5">
        <div>
          <div className="flex items-center gap-2">
            <FileText size={16} className="text-brand" />
            <Text fw={700} fz={15} c="var(--color-primary)" style={{ letterSpacing: -0.3 }}>
              Aktivitas Pesanan Terbaru
            </Text>
          </div>
          <Text fz={12} c="var(--color-secondary)" mt={2}>
            Daftar 5 invoice dan pesanan klien yang terdaftar di dalam database.
          </Text>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-border">
              {["No. Order", "Nama Klien", "Tipe Acara", "Nominal", "Status", "Tanggal"].map(
                (h) => (
                  <th
                    key={h}
                    className="py-2.5 px-3 text-[10px] font-bold text-secondary uppercase tracking-wider"
                  >
                    {h}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody>
            {LATEST_ORDERS.map((order) => (
              <tr
                key={order.orderNumber}
                className="border-b border-border hover:bg-app transition-colors"
              >
                <td className="py-3 px-3 text-sm font-semibold text-primary">
                  {order.orderNumber}
                </td>
                <td className="py-3 px-3 text-sm text-primary">
                  {order.clientName}
                </td>
                <td className="py-3 px-3 text-sm text-secondary">
                  {order.eventType}
                </td>
                <td className="py-3 px-3 text-sm font-semibold text-primary">
                  {order.amount}
                </td>
                <td className="py-3 px-3">
                  <Badge
                    color={STATUS_BADGE[order.orderStatus].color}
                    variant="light"
                    radius="sm"
                    size="sm"
                  >
                    {order.statusLabel}
                  </Badge>
                </td>
                <td className="py-3 px-3 text-sm text-secondary">
                  {order.date}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
