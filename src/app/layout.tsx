import type { Metadata, Viewport } from "next";
import { Outfit } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { ThemeProvider } from "@/hooks/use-theme";
import { ThemedToaster } from "@/components/themed-toaster";
import {
  DEFAULT_MODE,
  MODE_STORAGE_KEY,
  MODES,
  CUSTOM_COLOR_STORAGE_KEY,
  DEFAULT_CUSTOM_COLOR,
} from "@/lib/themes";

const outfit = Outfit({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "WOTTL | WhatsApp CRM",
    template: "%s — WOTTL | WhatsApp CRM",
  },
  description: "Best WhatsApp CRM for managing your business conversations.",
  robots: {
    index: false,
    follow: false,
  },
  icons: {
    icon: "/icon.png",
  },
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#020617",
  colorScheme: "dark light",
};

// Inline boot script — runs before React hydrates so the user's
// chosen accent (data-theme) AND mode (data-mode) are on the <html>
// element before first paint. Without this every page load flashes
// the server-rendered defaults for a frame before the React tree
// mounts and applies the picked values.
//
// Kept dependency-free (no imports, no JSX) — must be a string the
// browser can run as a single <script>. Knowledge of valid ids is
// sourced from the THEME_IDS / MODES constants so adding one doesn't
// silently break the boot path.
const THEME_BOOT_SCRIPT = `
(function(){
  var d = document.documentElement;
  try {
    var CUSTOM_KEY = ${JSON.stringify(CUSTOM_COLOR_STORAGE_KEY)};
    var DEFAULT_COLOR = ${JSON.stringify(DEFAULT_CUSTOM_COLOR)};
    var savedColor = localStorage.getItem(CUSTOM_KEY);
    var hex = (savedColor && /^#[0-9A-F]{6}$/i.test(savedColor)) ? savedColor : DEFAULT_COLOR;
    
    // YIQ contrast
    var cleanHex = hex.replace("#", "");
    var r = parseInt(cleanHex.substring(0, 2), 16);
    var g = parseInt(cleanHex.substring(2, 4), 16);
    var b = parseInt(cleanHex.substring(4, 6), 16);
    var yiq = (r * 299 + g * 587 + b * 114) / 1000;
    var foreground = yiq >= 128 ? "#000000" : "#ffffff";
    
    var soft = hex + "1f";
    var soft2 = hex + "38";
    
    d.style.setProperty("--primary", hex);
    d.style.setProperty("--primary-foreground", foreground);
    d.style.setProperty("--primary-hover", "color-mix(in srgb, " + hex + ", black 15%)");
    d.style.setProperty("--primary-soft", soft);
    d.style.setProperty("--primary-soft-2", soft2);
    d.style.setProperty("--ring", hex);
    d.style.setProperty("--chart-1", hex);
    d.style.setProperty("--sidebar-primary", hex);
    d.style.setProperty("--sidebar-primary-foreground", foreground);
    d.style.setProperty("--sidebar-ring", hex);

    var MODE_KEY = ${JSON.stringify(MODE_STORAGE_KEY)};
    var MODE_DEFAULT = ${JSON.stringify(DEFAULT_MODE)};
    var MODES = ${JSON.stringify(MODES)};
    var savedMode = localStorage.getItem(MODE_KEY);
    d.dataset.mode = MODES.indexOf(savedMode) !== -1 ? savedMode : MODE_DEFAULT;
  } catch (_e) {
    d.dataset.mode = ${JSON.stringify(DEFAULT_MODE)};
  }
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-mode={DEFAULT_MODE}
      className={`${outfit.variable} h-full antialiased`}
      // The `theme-boot` script below rewrites `data-theme` and
      // `data-mode` on <html> from localStorage before React hydrates,
      // so for any non-default choice the client DOM intentionally
      // differs from the server-rendered defaults. suppressHydration-
      // Warning silences the expected mismatch — it only applies to
      // this element's own attributes, so genuine mismatches in
      // children still surface.
      suppressHydrationWarning
    >
      <head>
        <Script
          id="theme-boot"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: THEME_BOOT_SCRIPT }}
        />
      </head>
      <body className="min-h-full bg-background text-foreground font-sans">
        <ThemeProvider>
          {children}
          <ThemedToaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
