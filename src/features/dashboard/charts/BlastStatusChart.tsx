"use client";
/**
 * BlastStatusChart — mirroring quich-dash DeviceUsersChart
 * Shows WhatsApp blast status distribution (sent, failed, pending)
 * src/features/dashboard/charts/BlastStatusChart.tsx
 */
import { BarChart } from "@mantine/charts";
import "@mantine/charts/styles.css";
import {
  ActionIcon,
  Badge,
  Button,
  Flex,
  Group,
  Select,
  Text,
  rem,
  useMantineColorScheme,
} from "@mantine/core";
import { ArrowUpRight, MoreHorizontal } from "lucide-react";
import CardWrapper from "../components/CardWrapper";

export default function BlastStatusChart() {
  const { colorScheme } = useMantineColorScheme();
  return (
    <CardWrapper px={0} h="100%">
      <Group px={16} align="center" justify="space-between">
        <Text fz={12} fw={600} c="var(--color-primary)" style={{ letterSpacing: -0.4 }}>
          WA Blast Status
        </Text>
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
          <ActionIcon radius="md" size="sm" variant="light" color="sage">
            <MoreHorizontal size={14} />
          </ActionIcon>
        </Flex>
      </Group>

      <Flex my={10} px={16} gap={4} direction="column" align="start">
        <Text fw={500} fz={11} c="var(--color-secondary)" style={{ letterSpacing: -0.4 }}>
          Total Pesan Terkirim
        </Text>
        <Flex align="center" gap={6}>
          <Text fw={700} fz={20} c="var(--color-primary)" style={{ letterSpacing: -0.4 }}>
            18,204
          </Text>
          <Badge color="sage" variant="light" size="xs">
            +5.7%
          </Badge>
        </Flex>
      </Flex>

      <BarChart
        pr={16}
        mb={10}
        mih={200}
        gridColor="var(--color-border)"
        gridAxis="xy"
        h="55%"
        styles={{
          axis: {
            color: "var(--color-secondary)",
            fontWeight: 600,
            letterSpacing: rem(-0.4),
            fontSize: rem(10),
          },
        }}
        maxBarWidth={14}
        withBarValueLabel
        data={[
          { status: "Terkirim", persen: 98 },
          { status: "Gagal", persen: 1 },
          { status: "Pending", persen: 1 },
        ]}
        dataKey="status"
        orientation="vertical"
        yAxisProps={{ width: 70 }}
        barProps={{
          radius: 8,
          label: {
            position: "right",
            color: "var(--color-primary)",
            fontSize: rem(10),
            fontWeight: 700,
            formatter: (value: unknown) => value + "%",
          },
        }}
        series={[{ name: "persen", color: "#7A8F81" }]}
      />

      <Group px={16} align="center" justify="space-between">
        <Text fw={600} fz={10} c="var(--color-primary)" style={{ letterSpacing: -0.2 }}>
          Tingkat sukses blast sangat baik 🎉
        </Text>
        <Button size="xs" variant="transparent" p={0}>
          <Flex gap={4} align="center">
            <Text fw={600} fz={10} c="#7A8F81">
              Lihat laporan
            </Text>
            <ArrowUpRight size={12} color="#7A8F81" />
          </Flex>
        </Button>
      </Group>
    </CardWrapper>
  );
}
