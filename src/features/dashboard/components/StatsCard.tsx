"use client";
/**
 * StatsCard — mirrors quich-dash StatsCard with Sage Green gradients
 * src/features/dashboard/components/StatsCard.tsx
 */
import { Card, Divider, Flex, Group, Text, Box, ActionIcon } from "@mantine/core";
import { ArrowRight } from "lucide-react";
import CardWrapper from "./CardWrapper";

interface Props {
  value: string | number;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  href?: string;
  gradient: string;
  borderColor: string;
}

export default function StatsCard({
  value,
  label,
  icon: Icon,
  href = "#",
  gradient,
  borderColor,
}: Props) {
  return (
    <CardWrapper p={0} h="100%">
      <Card.Section p={14}>
        <Group align="center" gap={14}>
          <Box
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: gradient,
              border: `1.5px solid ${borderColor}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Icon size={18} className="text-white" />
          </Box>
          <Flex direction="column" gap={2} align="start">
            <Text fw={700} lh={1} fz={18} c="#1E2522" style={{ letterSpacing: -0.4 }}>
              {typeof value === "number" ? value.toLocaleString() : value}
            </Text>
            <Text fw={500} fz={12} c="#64748B" style={{ letterSpacing: -0.4 }}>
              {label}
            </Text>
          </Flex>
        </Group>
      </Card.Section>
      <Divider variant="dashed" color="#f1f5f9" />
      <Card.Section px={14} py={10}>
        <Group align="center" w="100%" justify="space-between">
          <Text
            component="a"
            href={href}
            fz={12}
            fw={500}
            c="#7A8F81"
            style={{ letterSpacing: -0.4, textDecoration: "none" }}
          >
            Lihat detail
          </Text>
          <ActionIcon variant="subtle" radius="sm" color="sage" size="sm">
            <ArrowRight size={14} />
          </ActionIcon>
        </Group>
      </Card.Section>
    </CardWrapper>
  );
}
