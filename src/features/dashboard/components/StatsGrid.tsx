"use client";
/**
 * StatsGrid — 6 stats cards rendered on client (avoids Server→Client icon prop error)
 * src/features/dashboard/components/StatsGrid.tsx
 */
import { Users, Send, Eye, CalendarCheck, ShoppingBag, UserCheck } from "lucide-react";
import { Card, Divider, Flex, Group, Text, Box, ActionIcon } from "@mantine/core";
import { ArrowRight } from "lucide-react";

interface Stat {
  label: string;
  value: number;
  href: string;
  gradient: string;
  borderColor: string;
  Icon: React.ComponentType<{ size?: number; className?: string }>;
}

const STATS: Stat[] = [
  {
    label: "Total Client",
    value: 152,
    href: "/dashboard/clients",
    gradient: "linear-gradient(135deg, rgba(122,143,129,1) 0%, rgba(78,103,86,1) 100%)",
    borderColor: "rgba(122,143,129,0.4)",
    Icon: UserCheck,
  },
  {
    label: "Total Undangan",
    value: 2845,
    href: "/dashboard/invitations",
    gradient: "linear-gradient(135deg, rgba(59,130,246,1) 0%, rgba(37,99,235,1) 100%)",
    borderColor: "rgba(59,130,246,0.35)",
    Icon: Users,
  },
  {
    label: "Total RSVP",
    value: 12481,
    href: "/dashboard/invitations",
    gradient: "linear-gradient(135deg, rgba(168,85,247,1) 0%, rgba(126,34,206,1) 100%)",
    borderColor: "rgba(168,85,247,0.35)",
    Icon: CalendarCheck,
  },
  {
    label: "Total Visitor",
    value: 89450,
    href: "/dashboard/analytics",
    gradient: "linear-gradient(135deg, rgba(249,115,22,1) 0%, rgba(234,88,12,1) 100%)",
    borderColor: "rgba(249,115,22,0.35)",
    Icon: Eye,
  },
  {
    label: "WA Blast Terkirim",
    value: 18204,
    href: "/dashboard/blast",
    gradient: "linear-gradient(135deg, rgba(16,185,129,1) 0%, rgba(5,150,105,1) 100%)",
    borderColor: "rgba(16,185,129,0.35)",
    Icon: Send,
  },
  {
    label: "Order Fisik",
    value: 45,
    href: "/dashboard/orders",
    gradient: "linear-gradient(135deg, rgba(244,63,94,1) 0%, rgba(225,29,72,1) 100%)",
    borderColor: "rgba(244,63,94,0.35)",
    Icon: ShoppingBag,
  },
];

function StatCard({ stat }: { stat: Stat }) {
  const { Icon } = stat;
  return (
    <Card
      p={0}
      radius="12px"
      style={{ border: "1px solid var(--color-border)", boxShadow: "0 1px 3px rgba(0,0,0,0.02)", height: "100%", backgroundColor: "var(--color-surface)" }}
    >
      <Box p={16}>
        <Group align="center" gap={16} wrap="nowrap">
          <Box
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: stat.gradient,
              border: `1px solid ${stat.borderColor}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Icon size={20} className="text-white" />
          </Box>
          <Flex direction="column" gap={4} align="start" style={{ overflow: "hidden" }}>
            <Text fw={700} lh={1} fz={20} c="var(--color-primary)" style={{ letterSpacing: -0.5 }} truncate="end">
              {stat.value.toLocaleString("id-ID")}
            </Text>
            <Text fw={500} fz={13} c="var(--color-secondary)" style={{ letterSpacing: -0.2 }} truncate="end">
              {stat.label}
            </Text>
          </Flex>
        </Group>
      </Box>

      <Divider variant="dashed" color="var(--color-border)" />

      <Box px={16} py={12}>
        <Group align="center" w="100%" justify="space-between" wrap="nowrap">
          <Text
            component="a"
            href={stat.href}
            fz={12}
            fw={600}
            c="var(--color-secondary)"
            style={{ letterSpacing: -0.3, textDecoration: "none" }}
          >
            Lihat detail
          </Text>
          <ActionIcon variant="transparent" size="sm" color="gray">
            <ArrowRight size={16} strokeWidth={2.5} />
          </ActionIcon>
        </Group>
      </Box>
    </Card>
  );
}

export default function StatsGrid() {
  return (
    <>
      {STATS.map((stat) => (
        <div key={stat.label} className="col-span-1 md:col-span-2 xl:col-span-3">
          <StatCard stat={stat} />
        </div>
      ))}
    </>
  );
}
