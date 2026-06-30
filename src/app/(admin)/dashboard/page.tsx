/**
 * Dashboard Overview Page — quich-dash layout adaptation
 * src/app/(admin)/dashboard/page.tsx
 */
import type { Metadata } from "next";
import { Box } from "@mantine/core";
import StatsGrid from "@/features/dashboard/components/StatsGrid";
import Insights from "@/features/dashboard/components/Insights";
import UniqueVisitorChart from "@/features/dashboard/charts/UniqueVisitorChart";
import PageViewChart from "@/features/dashboard/charts/PageViewChart";
import OrderTypesChart from "@/features/dashboard/charts/OrderTypesChart";
import BlastStatusChart from "@/features/dashboard/charts/BlastStatusChart";
import RecentOrdersTable from "@/features/dashboard/components/RecentOrdersTable";

export const metadata: Metadata = {
  title: "Dashboard Overview",
  description:
    "Undangin.studio admin panel overview and key performance metrics.",
};

export default function DashboardOverviewPage() {
  return (
    <div className="space-y-5">
      {/* ── quich-dash 9-col responsive grid ──────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-6 xl:grid-cols-9 gap-5 w-full">
        {/* ── Rows 1–2: Stats cards (6 × col-span-3 on XL) ── */}
        <StatsGrid />

        {/* ── Insights panel: col 1-3, spans 2 rows on XL ── */}
        <div className="col-span-1 md:col-span-6 xl:col-span-3 xl:row-span-2 min-h-[520px] xl:min-h-0">
          <Insights />
        </div>

        {/* ── UniqueVisitor: col 4-6 ── */}
        <div className="col-span-1 md:col-span-3 xl:col-span-3 min-h-[240px]">
          <UniqueVisitorChart />
        </div>

        {/* ── RSVP/PageView: col 7-9 ── */}
        <div className="col-span-1 md:col-span-3 xl:col-span-3 min-h-[240px]">
          <PageViewChart />
        </div>

        {/* ── OrderTypes tabbed chart: col 4-9 ── */}
        <div className="col-span-1 md:col-span-6 xl:col-span-6 min-h-[300px]">
          <OrderTypesChart />
        </div>
      </div>

      {/* ── Bottom row: BlastStatus + RecentOrders ────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-9 gap-5 w-full">
        <div className="col-span-1 md:col-span-3">
          <BlastStatusChart />
        </div>
        <div className="col-span-1 md:col-span-6">
          <RecentOrdersTable />
        </div>
      </div>
    </div>
  );
}
