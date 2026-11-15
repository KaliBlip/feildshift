import type { Metadata } from "next";
import localFont from "next/font/local";
import { I18nProvider } from "@/components/I18nProvider";
import "./globals.css";

const oliveDisplay = localFont({
  src: [
    { path: "../../public/fonts/OliveDisplay-Medium.ttf", weight: "500", style: "normal" },
    { path: "../../public/fonts/OliveDisplay-Bold.ttf", weight: "700", style: "normal" },
  ],
  variable: "--font-display",
  display: "swap",
});

const suncoastGrot = localFont({
  src: [
    { path: "../../public/fonts/SuncoastGrot-Medium.ttf", weight: "500", style: "normal" },
    { path: "../../public/fonts/SuncoastGrot-Bold.ttf", weight: "700", style: "normal" },
    { path: "../../public/fonts/SuncoastGrot-Black.ttf", weight: "900", style: "normal" },
  ],
  variable: "--font-sans",
  display: "swap",
});

const geistMono = localFont({
  src: "../../public/geist-mono-latin.woff2",
  variable: "--font-geist-mono",
  display: "swap",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "ScalarField | Field Shift Agro-Climate Intelligence",
  description:
    "ScalarField translates NASA Earth observations, multi-criteria strategy analysis, and Evidence Passports into bilingual English & Ashanti Twi agricultural decisions.",
  keywords: [
    "agricultural intelligence",
    "NASA Earth observations",
    "Field Shift",
    "Ashanti crop rotation",
    "satellite data",
    "evidence passport",
  ],
  openGraph: {
    title: "ScalarField | Field Shift Agro-Climate Intelligence",
    description:
      "Translating NASA satellite observations into honest, farmer-centred crop rotation intelligence.",
    type: "website",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${oliveDisplay.variable} ${suncoastGrot.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <I18nProvider>{children}</I18nProvider>
      </body>
    </html>
  );
}
