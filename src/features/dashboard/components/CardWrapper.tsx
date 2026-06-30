/**
 * CardWrapper — shared card container for all dashboard panels
 * src/features/dashboard/components/CardWrapper.tsx
 */
import type { CardProps } from "@mantine/core";
import { Card } from "@mantine/core";

interface Props extends CardProps {
  children: React.ReactNode;
}

export default function CardWrapper({ children, ...rest }: Props) {
  return (
    <Card
      {...rest}
      radius="12px"
      style={{
        border: "1px solid var(--color-border)",
        boxShadow: "none",
        backgroundColor: "var(--color-surface)",
        ...rest.style,
      }}
    >
      {children}
    </Card>
  );
}
