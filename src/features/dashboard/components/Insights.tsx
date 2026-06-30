"use client";
/**
 * Insights — Right amber panel mirroring quich-dash Insights
 * Adapted to Undangin.studio: Sage Green gradient, local metrics
 * src/features/dashboard/components/Insights.tsx
 */
import { ActionIcon, Box, Flex, Text, rem } from "@mantine/core";
import { MoreHorizontal } from "lucide-react";

const activities = [
  {
    id: 1,
    type: "RSVP Masuk",
    time: "2 menit lalu",
    pages: [{ id: 1, content: "Budi Prasetyo — Hadir (3 tamu)" }],
  },
  {
    id: 2,
    type: "WhatsApp Terkirim",
    time: "15 menit lalu",
    pages: [{ id: 1, content: "Batch ke-3 — 48 penerima sukses" }],
  },
  {
    id: 3,
    type: "Pembayaran Terverifikasi",
    time: "1 jam lalu",
    pages: [{ id: 1, content: "Order UDS-202606-0007 — Rp1.200.000" }],
  },
];

export default function Insights() {
  return (
    <Box
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        justifyContent: "space-between",
        boxShadow: "none",
        borderRadius: 12,
        border: "1px solid #f1f5f9",
        background: "linear-gradient(180deg, #7A8F81 0%, #4d5c52 100%)",
        padding: "var(--mantine-spacing-lg)",
        overflow: "hidden",
      }}
    >
      {/* Decorative circles */}
      <Box
        style={{
          position: "absolute",
          width: rem(200),
          height: rem(200),
          borderRadius: "50%",
          right: -80,
          top: -80,
          backgroundColor: "rgba(255,255,255,0.15)",
        }}
      />
      <Box
        style={{
          position: "absolute",
          width: rem(90),
          height: rem(90),
          borderRadius: "50%",
          right: 0,
          top: 160,
          backgroundColor: "rgba(255,255,255,0.12)",
        }}
      />

      {/* Header */}
      <Flex w="100%" align="center" justify="space-between" style={{ zIndex: 1 }}>
        <Flex align="center" gap={14}>
          <Box
            style={{
              width: rem(40),
              height: rem(40),
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              backgroundColor: "rgba(255,255,255,0.2)",
              borderRadius: 8,
              border: "1px solid rgba(255,255,255,0.3)",
            }}
          >
            <span className="text-white font-bold text-base">U</span>
          </Box>
          <Flex direction="column" align="start" gap={2}>
            <Text fw={700} lh={1} fz={16} style={{ letterSpacing: -0.4 }} c="white">
              undangin.studio
            </Text>
            <Text fz={12} lh={1} fw={500} c="rgba(255,255,255,0.75)">
              Ringkasan Aktivitas
            </Text>
          </Flex>
        </Flex>
        <ActionIcon
          radius="md"
          size={34}
          variant="transparent"
          style={{ backgroundColor: "rgba(255,255,255,0.15)" }}
        >
          <MoreHorizontal size={16} color="white" />
        </ActionIcon>
      </Flex>

      {/* Big Metric */}
      <Text
        style={{
          fontSize: rem(64),
          color: "white",
          fontWeight: 700,
          letterSpacing: -2,
          textShadow: "1px 1px 4px rgba(0,0,0,0.15)",
          zIndex: 1,
        }}
      >
        84%
      </Text>

      <Flex direction="column" align="start" gap={6} style={{ zIndex: 1 }}>
        <Text fz={14} fw={600} c="white">
          Tingkat kehadiran bulan ini.
        </Text>
        <Text fz={12} fw={500} c="rgba(255,255,255,0.8)">
          Rata-rata dari seluruh undangan aktif yang memiliki konfirmasi RSVP tamu.
        </Text>
      </Flex>

      {/* Activity Feed */}
      <Box
        style={{
          width: "100%",
          display: "flex",
          flexDirection: "column",
          gap: rem(14),
          backgroundColor: "white",
          borderRadius: 10,
          padding: "var(--mantine-spacing-md)",
          zIndex: 1,
        }}
      >
        {activities.map((activity) => (
          <Flex key={activity.id} direction="column" gap={6} w="100%">
            <Flex w="100%" align="center" gap={10}>
              <Text fz={13} c="var(--color-primary)" fw={600} style={{ letterSpacing: -0.3 }}>
                {activity.type}
              </Text>
              <Text fz={11} c="var(--color-secondary)" fw={500}>
                {activity.time}
              </Text>
            </Flex>
            {activity.pages.map((page) => (
              <Flex key={page.id} align="start" gap={8}>
                <Box
                  style={{
                    width: rem(8),
                    height: rem(8),
                    marginTop: rem(3),
                    borderRadius: "50%",
                    flexShrink: 0,
                    border: "1.5px solid #7A8F81",
                    backgroundColor: "#7A8F81",
                  }}
                />
                <Text fz={12} c="var(--color-secondary)" fw={500} style={{ letterSpacing: -0.3 }}>
                  {page.content}
                </Text>
              </Flex>
            ))}
          </Flex>
        ))}
      </Box>
    </Box>
  );
}
