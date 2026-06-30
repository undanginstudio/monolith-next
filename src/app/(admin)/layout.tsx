"use client";

/**
 * Admin Layout AppShell — Undangin.studio (Quich-Dash Sidebar Adaptation)
 * src/app/(admin)/layout.tsx
 */
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  AppShell,
  Burger,
  Group,
  Text,
  Avatar,
  Menu,
  UnstyledButton,
  Box,
  Flex,
  TextInput,
  Kbd,
  Divider,
  Button,
  ActionIcon,
  Indicator,
  ThemeIcon,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import {
  IconSearch,
  IconBellFilled,
  IconSettings,
  IconLogout,
  IconUser,
  IconLink,
  IconSquareLetterM,
  IconChevronLeft,
  IconChevronRight,
  IconCalendarEvent,
  IconLayoutDashboard,
  IconReceipt2,
  IconWand,
  IconBrandWhatsapp,
  IconTemplate,
  IconChartBar,
} from "@tabler/icons-react";
import { logout } from "@/features/auth/actions/auth.actions";
import { ThemeToggle } from "@/components/ThemeToggle";

// ---------------------------------------------------------------------------
// Nav Items Definition
// ---------------------------------------------------------------------------
const NAV_ITEMS = [
  {
    label: "Overview",
    href: "/dashboard",
    icon: IconLayoutDashboard,
    activeIcon: IconLayoutDashboard,
  },
  {
    label: "Orders & Billing",
    href: "/dashboard/orders",
    icon: IconReceipt2,
    activeIcon: IconReceipt2,
  },
  {
    label: "Invitation Builder",
    href: "/dashboard/invitations",
    icon: IconWand,
    activeIcon: IconWand,
  },
  {
    label: "Guest & WA Blast",
    href: "/dashboard/guests",
    icon: IconBrandWhatsapp,
    activeIcon: IconBrandWhatsapp,
  },
  {
    label: "Template Catalog",
    href: "/dashboard/templates",
    icon: IconTemplate,
    activeIcon: IconTemplate,
  },
  {
    label: "RSVP & Analytics",
    href: "/dashboard/analytics",
    icon: IconChartBar,
    activeIcon: IconChartBar,
  },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileOpened, { toggle: toggleMobile }] = useDisclosure();
  const pathname = usePathname();
  const [themeChecked, setThemeChecked] = useState(false);

  // Sidebar hover and collapse logic
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const isExpanded = !isCollapsed || isHovered;

  // Local date display (hydration safe)
  const [currentDate, setCurrentDate] = useState<string>("");

  useEffect(() => {
    setCurrentDate(
      new Intl.DateTimeFormat("id-ID", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      }).format(new Date()),
    );
  }, []);

  // Helper to determine active state
  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return pathname === "/dashboard";
    }
    return pathname.startsWith(href);
  };

  const textStyle: React.CSSProperties = {
    opacity: isExpanded ? 1 : 0,
    maxWidth: isExpanded ? 200 : 0,
    marginLeft: isExpanded ? 12 : 0,
    overflow: "hidden",
    whiteSpace: "nowrap",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    display: "inline-block",
  };

  return (
    <AppShell
      layout="alt" // Alt layout makes the Navbar span full height (logo in sidebar)
      header={{ height: 70 }}
      navbar={{
        width: isExpanded ? 260 : 80,
        breakpoint: "sm",
        collapsed: { mobile: !mobileOpened },
      }}
      padding="md"
      transitionDuration={300}
      transitionTimingFunction="cubic-bezier(0.4, 0, 0.2, 1)"
      styles={{
        main: {
          backgroundColor: "var(--color-app)",
          transition: "background-color 0.2s ease",
        },
      }}
    >
      {/* ── SIDEBAR ───────────────────────────────────────────────────────── */}
      <AppShell.Navbar
        p="md"
        className="border-r border-border bg-surface"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{ overflow: "hidden" }}
      >
        <Box className="flex flex-col h-full" style={{ position: "relative" }}>
          {/* Logo & Toggle */}
          <Flex align="center" justify="space-between" mb="lg" px={4} mt={4}>
            <Group gap={0} wrap="nowrap">
              <ThemeIcon
                radius="xl"
                size={32}
                color="#8A4BFF"
                style={{ flexShrink: 0 }}
              >
                <IconSquareLetterM size={20} stroke={2} />
              </ThemeIcon>
              <Text
                fw={700}
                size="lg"
                c="var(--color-primary)"
                style={{
                  letterSpacing: -0.5,
                  ...textStyle,
                  marginLeft: isExpanded ? 12 : 0,
                }}
              >
                Mantine
              </Text>
            </Group>

            <ActionIcon
              variant="subtle"
              color="gray"
              onClick={() => setIsCollapsed(!isCollapsed)}
              title={isCollapsed ? "Unpin sidebar" : "Pin sidebar"}
              style={{
                opacity: isExpanded ? 1 : 0,
                transform: isExpanded ? "scale(1)" : "scale(0.8)",
                pointerEvents: isExpanded ? "auto" : "none",
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              }}
            >
              {isCollapsed ? (
                <IconChevronRight size={18} />
              ) : (
                <IconChevronLeft size={18} />
              )}
            </ActionIcon>
          </Flex>

          {/* Search Input */}
          <Box
            mb="xl"
            px={4}
            style={{
              position: "relative",
              height: 36,
              display: "flex",
              alignItems: "center",
            }}
          >
            <Box
              style={{
                opacity: isExpanded ? 1 : 0,
                width: isExpanded ? "100%" : 0,
                pointerEvents: isExpanded ? "auto" : "none",
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                position: "absolute",
                left: 4,
                right: 4,
                overflow: "hidden",
              }}
            >
              <TextInput
                placeholder="Search"
                size="sm"
                radius="md"
                leftSection={
                  <IconSearch size={16} className="text-slate-400" />
                }
                rightSection={
                  <Kbd
                    size="xs"
                    className="text-slate-400 font-sans border-slate-200"
                  >
                    /
                  </Kbd>
                }
                styles={{
                  input: {
                    backgroundColor: "var(--color-surface)",
                    border: "1px solid var(--color-border)",
                    color: "var(--color-primary)",
                    fontWeight: 500,
                    minWidth: 200, // Prevent squishing
                  },
                }}
              />
            </Box>

            <ActionIcon
              variant="light"
              size="lg"
              color="gray"
              radius="md"
              style={{
                opacity: isExpanded ? 0 : 1,
                pointerEvents: isExpanded ? "none" : "auto",
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                position: "absolute",
                left: 4,
              }}
            >
              <IconSearch size={18} />
            </ActionIcon>
          </Box>

          {/* NAVIGATION SECTION */}
          <Text
            size="xs"
            fw={700}
            c="var(--color-secondary)"
            mb="sm"
            px={4}
            style={{ letterSpacing: 0.5, ...textStyle, marginLeft: 0 }}
          >
            NAVIGATION
          </Text>

          <div className="space-y-1 mb-6">
            {NAV_ITEMS.map((item) => {
              const active = isActive(item.href);
              const Icon = active ? item.activeIcon : item.icon;

              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className="no-underline block"
                  onClick={() => {
                    if (mobileOpened) toggleMobile();
                  }}
                  title={!isExpanded ? item.label : undefined}
                >
                  <div
                    className={`flex items-center px-4 py-2.5 rounded-xl transition-all duration-200 ${
                      active
                        ? "bg-app text-primary font-semibold"
                        : "text-secondary hover:bg-app hover:text-primary font-medium"
                    }`}
                  >
                    <Icon
                      size={20}
                      stroke={active ? 2.5 : 2}
                      className={active ? "text-primary" : "text-secondary"}
                      style={{ flexShrink: 0 }}
                    />
                    <Text size="sm" style={textStyle}>
                      {item.label}
                    </Text>
                  </div>
                </Link>
              );
            })}
          </div>
        </Box>
      </AppShell.Navbar>

      {/* ── HEADER ────────────────────────────────────────────────────────── */}
      <AppShell.Header
        withBorder={false}
        style={{ backgroundColor: "transparent" }}
        className="px-4 pt-4"
      >
        <Group
          h="100%"
          justify="space-between"
          align="center"
          className="bg-surface rounded-2xl px-6 border border-border shadow-sm"
        >
          <Group>
            <Burger
              opened={mobileOpened}
              onClick={toggleMobile}
              hiddenFrom="sm"
              size="sm"
              color="#64748B"
            />
            <Text className="font-bold tracking-tight text-primary" size="lg">
              Dashboard
            </Text>
          </Group>

          <Group gap="md" align="center">
            {/* Dynamic Local Date Widget */}
            <Flex
              align="center"
              gap={6}
              className="hidden md:flex bg-app px-3 py-1.5 rounded-lg border border-border mr-2"
              style={{ minHeight: 34 }}
            >
              <IconCalendarEvent size={16} className="text-brand" />
              <Text
                fw={600}
                fz={13}
                className="text-secondary"
                style={{ letterSpacing: -0.2 }}
              >
                {currentDate || "Memuat..."}
              </Text>
            </Flex>

            <ActionIcon variant="transparent" color="gray" size="lg">
              <Indicator color="red" size={8} offset={4} withBorder>
                <IconBellFilled size={20} className="text-primary" />
              </Indicator>
            </ActionIcon>

            <ThemeToggle />

            <Divider
              orientation="vertical"
              h={32}
              color="var(--color-border)"
            />

            <Menu shadow="md" width={200} radius="12px" position="bottom-end">
              <Menu.Target>
                <UnstyledButton className="flex items-center gap-3 rounded-lg hover:bg-app transition-colors p-1 pr-2">
                  <Avatar
                    radius="xl"
                    size="md"
                    src="https://raw.githubusercontent.com/mantinedev/mantine/master/.demo/avatars/avatar-1.png"
                  />
                  <div className="hidden md:block text-left">
                    <Text
                      size="sm"
                      className="font-bold text-primary"
                      style={{ letterSpacing: -0.3 }}
                    >
                      Shin thant
                    </Text>
                    <Text size="xs" className="text-secondary font-medium">
                      Frontend dev
                    </Text>
                  </div>
                </UnstyledButton>
              </Menu.Target>

              <Menu.Dropdown className="border border-border bg-surface">
                <Menu.Item
                  leftSection={
                    <IconUser size={14} className="text-secondary" />
                  }
                >
                  Profil
                </Menu.Item>
                <Menu.Item
                  leftSection={
                    <IconSettings size={14} className="text-secondary" />
                  }
                >
                  Pengaturan
                </Menu.Item>
                <Menu.Divider className="border-border" />
                <Menu.Item
                  color="red"
                  onClick={() => logout()}
                  leftSection={<IconLogout size={14} />}
                >
                  Keluar
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          </Group>
        </Group>
      </AppShell.Header>

      {/* ── MAIN CONTENT VIEWPORT ────────────────────────────────────────── */}
      <AppShell.Main>{children}</AppShell.Main>
    </AppShell>
  );
}
