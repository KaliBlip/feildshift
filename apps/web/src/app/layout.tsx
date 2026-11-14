import type { Metadata } from "next";
import localFont from "next/font/local";
import { I18nProvider } from "@/components/I18nProvider";
import "./globals.css";

const geistSans = localFont({
  src: "../../public/geist-latin.woff2",
  variable: "--font-geist-sans",
  display: "swap",
  weight: "100 900",
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
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <I18nProvider>{children}</I18nProvider>
      </body>
    </html>
  );
}
