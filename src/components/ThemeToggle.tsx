"use client";

import { useMantineColorScheme } from "@mantine/core";
import { Sun, Moon } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch by mounting the interactive parts only on the client
  useEffect(() => {
    setMounted(true);
  }, []);

  // Return a placeholder structure with identical size/borders before mounting
  if (!mounted) {
    return (
      <div 
        className="w-10 h-10 rounded-xl border border-slate-200 dark:border-neutral-800 bg-surface flex items-center justify-center" 
        aria-hidden="true" 
      />
    );
  }

  const isDark = colorScheme === "dark";

  const handleToggle = () => {
    // Graceful fallback for unsupported browsers or users preferring reduced motion
    if (
      !("startViewTransition" in document) ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      toggleColorScheme();
      return;
    }

    document.startViewTransition(() => {
      toggleColorScheme();
    });
  };

  return (
    <button
      onClick={handleToggle}
      className="relative flex items-center justify-center w-10 h-10 rounded-xl border border-slate-200 dark:border-neutral-800 bg-surface text-secondary hover:text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-brand overflow-hidden"
      aria-label="Toggle color scheme"
    >
      <motion.div
        initial={false}
        animate={{
          rotate: isDark ? -90 : 0,
          scale: isDark ? 0 : 1,
          opacity: isDark ? 0 : 1,
        }}
        transition={{ duration: 0.25, ease: "easeInOut" }}
        className="absolute"
      >
        <Sun size={18} strokeWidth={2.5} />
      </motion.div>

      <motion.div
        initial={false}
        animate={{
          rotate: isDark ? 0 : 90,
          scale: isDark ? 1 : 0,
          opacity: isDark ? 1 : 0,
        }}
        transition={{ duration: 0.25, ease: "easeInOut" }}
        className="absolute"
      >
        <Moon size={18} strokeWidth={2.5} />
      </motion.div>
    </button>
  );
}
