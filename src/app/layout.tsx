import type { Metadata, Viewport } from "next";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: "منصة XTREN · نظام إدارة صفحات الهبوط والربح من Adsterra والبث التلقائي",
  description: "لوحة تحكم احترافية لإدارة صفحات الهبوط الديناميكية، رفع وتخزين ملفات الميديا، وتحقيق الدخل من Adsterra مع البث التلقائي لقنوات Telegram ومنصة X.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" className="dark w-full max-w-full overflow-x-hidden">
      <head>
        <meta name="referrer" content="no-referrer" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;500;600;700;800;900&family=Tajawal:wght@300;400;500;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased min-h-screen selection:bg-brand-500 selection:text-white bg-[#070a12] text-white w-full max-w-full overflow-x-hidden relative">
        {children}
      </body>
    </html>
  );
}
