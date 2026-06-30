"use client";
/**
 * PageViewChart — RSVP submissions area chart
 * Adapted from quich-dash PageViewChart with Sage Green theme
 * src/features/dashboard/charts/PageViewChart.tsx
 */
import { AreaChart } from "@mantine/charts";
import "@mantine/charts/styles.css";
import { Flex, Select, Text, rem, useMantineColorScheme } from "@mantine/core";
import { TrendingUp } from "lucide-react";
import CardWrapper from "../components/CardWrapper";

const DATA = [
  { date: "Jul", RSVP: 320 },
  { date: "Agu", RSVP: 210 },
  { date: "Sep", RSVP: 480 },
  { date: "Okt", RSVP: 620 },
  { date: "Nov", RSVP: 590 },
  { date: "Des", RSVP: 780 },
];

export default function PageViewChart() {
  const { colorScheme } = useMantineColorScheme();
  return (
    <CardWrapper p={0} pb={20} h="100%">
      <Flex py={10} px={20} align="center" justify="space-between">
        <Text fz={12} fw={600} c="var(--color-primary)" style={{ letterSpacing: -0.4 }}>
          Page Views
        </Text>
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
          value="3 Bulan Terakhir"
          size="xs"
          data={["3 Bulan Terakhir"]}
          w={130}
        />
      </Flex>
      <Flex mb={22} px={20} align="center" justify="space-between">
        <Text fw={700} fz={24} c="var(--color-primary)">
          485,210
        </Text>
        <Flex align="center" gap={4}>
          <TrendingUp size={16} className="text-[#7A8F81]" />
          <Text fw={700} fz={18} c="#7A8F81">
            +18.3%
          </Text>
        </Flex>
      </Flex>
      <AreaChart
        pr={20}
        h={{ base: 200, md: 260 }}
        data={DATA}
        gridColor="var(--color-border)"
        gridProps={{ strokeDasharray: "6 4" }}
        gridAxis="xy"
        dataKey="date"
        withDots={false}
        series={[{ name: "RSVP", color: "#97b0a0" }]}
        curveType="step"
        connectNulls
      />
    </CardWrapper>
  );
}
