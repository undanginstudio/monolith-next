import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { MantineProvider, ColorSchemeScript, createTheme } from "@mantine/core";
import { Notifications } from "@mantine/notifications";
import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";
import "@mantine/dates/styles.css";
import "./globals.css";

// ---------------------------------------------------------------------------
// Fonts — loaded via next/font for performance optimization
// ---------------------------------------------------------------------------
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

// ---------------------------------------------------------------------------
// Mantine Theme — Undangin.studio Design System
// ---------------------------------------------------------------------------
const theme = createTheme({
  primaryColor: "sage",
  primaryShade: { light: 5, dark: 6 },

  fontFamily: "var(--font-geist-sans), Inter, sans-serif",
  fontFamilyMonospace: "var(--font-geist-mono), monospace",
  headings: {
    fontFamily: "var(--font-geist-sans), Inter, sans-serif",
    fontWeight: "700",
  },

  defaultRadius: "12px",

  colors: {
    sage: [
      "#f4f6f4", // 0
      "#e7ece8", // 1
      "#cfdbd2", // 2
      "#b3c7b9", // 3
      "#97b0a0", // 4
      "#7a8f81", // 5 (Main Sage Green)
      "#627668", // 6
      "#4d5c52", // 7
      "#39443c", // 8
      "#1e2522", // 9
    ],
  },

  components: {
    Button: {
      defaultProps: {
        radius: "12px",
      },
    },
    Card: {
      defaultProps: {
        radius: "12px",
        shadow: "none",
      },
    },
  },
});

// ---------------------------------------------------------------------------
// Metadata
// ---------------------------------------------------------------------------
export const metadata: Metadata = {
  title: {
    default: "Undangin.studio — Digital Wedding Invitations",
    template: "%s | Undangin.studio",
  },
  description:
    "Create beautiful, personalized digital wedding invitations with RSVP tracking, WhatsApp blasts, and live analytics.",
  keywords: [
    "undangan digital",
    "undangan pernikahan online",
    "wedding invitation",
    "RSVP online",
    "undangin studio",
  ],
  authors: [{ name: "Undangin.studio" }],
  openGraph: {
    type: "website",
    siteName: "Undangin.studio",
    locale: "id_ID",
  },
  robots: {
    index: true,
    follow: true,
  },
};

// ---------------------------------------------------------------------------
// Root Layout
// ---------------------------------------------------------------------------
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="id"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable}`}
    >
      <head>
        {/*
         * ColorSchemeScript must be placed in <head> to prevent the
         * flash-of-incorrect-color-scheme (FOICS) on first paint.
         */}
        <ColorSchemeScript defaultColorScheme="auto" />
      </head>
      <body className="antialiased">
        <MantineProvider theme={theme} defaultColorScheme="auto">
          <Notifications position="top-right" zIndex={9999} />
          {children}
        </MantineProvider>
      </body>
    </html>
  );
}
