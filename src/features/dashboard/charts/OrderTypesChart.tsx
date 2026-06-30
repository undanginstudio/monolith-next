"use client";
/**
 * OrderTypesChart — mirroring quich-dash PageNamesChart (tabbed bar chart)
 * Shows distribution of invitation types per order
 * src/features/dashboard/charts/OrderTypesChart.tsx
 */
import { useState } from "react";
import { BarChart } from "@mantine/charts";
import "@mantine/charts/styles.css";
import {
  ActionIcon,
  Box,
  Flex,
  Group,
  Select,
  Text,
  rem,
  useMantineColorScheme,
  Tabs,
} from "@mantine/core";
import { MoreHorizontal } from "lucide-react";
import CardWrapper from "../components/CardWrapper";

const TABS = [
  { value: "event", label: "Tipe Acara" },
  { value: "blast", label: "WA Blast" },
  { value: "fisik", label: "Order Fisik" },
];

export default function OrderTypesChart() {
  const { colorScheme } = useMantineColorScheme();
  const [tab, setTab] = useState("event");

  return (
    <CardWrapper p={0} pb={16} h="100%">
      <Flex
        gap={6}
        direction={{ base: "column", md: "row" }}
        align="center"
        p={16}
        justify="space-between"
      >
        {/* Simple pill tabs */}
        <Flex
          gap={2}
          style={{
            background: "var(--color-app)",
            borderRadius: 8,
            padding: 4,
          }}
        >
          {TABS.map((t) => (
            <button
              key={t.value}
              onClick={() => setTab(t.value)}
              style={{
                fontSize: rem(11),
                fontWeight: 600,
                padding: "4px 12px",
                borderRadius: 6,
                letterSpacing: rem(-0.3),
                color: tab === t.value ? "var(--color-primary)" : "var(--color-secondary)",
                background: tab === t.value ? "var(--color-surface)" : "transparent",
                boxShadow: tab === t.value ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                border: "none",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              {t.label}
            </button>
          ))}
        </Flex>

        <Flex align="center" gap={10}>
          <Select
            styles={{
              input: {
                fontSize: rem(10),
                fontWeight: 600,
                borderWidth: 0,
                letterSpacing: rem(-0.4),
                backgroundColor: "var(--color-app)",
                color: "var(--color-primary)",
              },
            }}
            radius="md"
            value="Bulan Ini"
            size="xs"
            data={["Bulan Ini"]}
            w={100}
          />
          <ActionIcon radius="md" size="sm" variant="light">
            <MoreHorizontal size={14} />
          </ActionIcon>
        </Flex>
      </Flex>

      <Box style={{ flex: 1 }} mx={16}>
        {tab === "event" && (
          <Flex direction="column" h="100%">
            <Group w="100%" px={16} py={8} align="center" justify="space-between">
              <Text fz={11} fw={600} c="var(--color-secondary)">Tipe Acara</Text>
              <Text fz={11} fw={600} c="var(--color-secondary)">Jumlah Order</Text>
            </Group>
            <BarChart
              gridAxis="none"
              withXAxis={false}
              mih={180}
              h={280}
              styles={{
                axis: {
                  color: "var(--color-primary)",
                  fontWeight: 600,
                  letterSpacing: rem(-0.4),
                  fontSize: rem(11),
                },
              }}
              withRightYAxis
              rightYAxisProps={{ dataKey: "Order" }}
              maxBarWidth={14}
              data={[
                { page: "Pernikahan", Order: 85 },
                { page: "Lamaran", Order: 42 },
                { page: "Khitanan", Order: 28 },
                { page: "Aqiqah", Order: 18 },
                { page: "Ulang Tahun", Order: 12 },
              ]}
              dataKey="page"
              orientation="vertical"
              yAxisProps={{ width: 100 }}
              barProps={{ radius: 8 }}
              series={[{ name: "Order", color: "#7A8F81" }]}
            />
          </Flex>
        )}
        {tab === "blast" && (
          <Flex align="center" justify="center" h={280}>
            <Text fz={12} c="var(--color-secondary)">Data WA Blast akan ditampilkan di sini.</Text>
          </Flex>
        )}
        {tab === "fisik" && (
          <Flex align="center" justify="center" h={280}>
            <Text fz={12} c="var(--color-secondary)">Data Order Fisik akan ditampilkan di sini.</Text>
          </Flex>
        )}
      </Box>
    </CardWrapper>
  );
}
