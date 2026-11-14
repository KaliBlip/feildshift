import type { Metadata } from "next";
import localFont from "next/font/local";
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
  title: "ScalarField | Agriculture, Informed by Earth",
  description:
    "ScalarField translates NASA Earth observations and machine learning into clear, actionable agricultural intelligence — helping farmers navigate climate uncertainty with confidence.",
  keywords: ["agricultural intelligence", "NASA Earth observations", "precision farming", "satellite data", "crop forecasting"],
  openGraph: {
    title: "ScalarField | Agriculture, Informed by Earth",
    description:
      "Translating satellite data into farmer-centred decisions. Powered by NASA Earth observations and agricultural science.",
    type: "website",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
