import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Fraunces, Geist, Geist_Mono } from 'next/font/google'
import Script from 'next/script'
import { LanguageProvider } from '@/components/language-provider'
import './globals.css'

const geistSans = Geist({ subsets: ['latin'], variable: '--font-geist-sans' })
const geistMono = Geist_Mono({ subsets: ['latin'], variable: '--font-geist-mono' })
const fraunces = Fraunces({ subsets: ['latin'], variable: '--font-fraunces' })

export const metadata: Metadata = {
  title: 'Worktime',
  description: 'Worktime — Slovak Philharmonic work-hour management.',
  applicationName: 'Worktime',
  generator: 'v0.app',
  icons: {
    icon: '/icon.svg',
    shortcut: '/icon.svg',
    apple: '/icon.svg',
  },
}

export const viewport: Viewport = {
  colorScheme: 'light',
  themeColor: '#ffffff',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

const fitEpcNamesScript = `
(() => {
  const selector = '[class*="pointer-events-none"][class*="absolute"][class*="inset-0"][class*="text-black"] > span:nth-child(3)';
  let frame = 0;

  const fitNames = () => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      document.querySelectorAll(selector).forEach((element) => {
        const el = element;
        el.style.removeProperty('font-size');
        el.style.setProperty('white-space', 'nowrap', 'important');
        el.style.setProperty('overflow', 'hidden', 'important');
        el.style.setProperty('text-overflow', 'clip', 'important');

        const base = parseFloat(getComputedStyle(el).fontSize) || 11;
        let size = base;
        el.style.setProperty('font-size', size + 'px', 'important');

        while (size > 4.5 && el.scrollWidth > el.clientWidth) {
          size -= 0.25;
          el.style.setProperty('font-size', size + 'px', 'important');
        }
      });
    });
  };

  const observer = new MutationObserver(fitNames);
  observer.observe(document.documentElement, { childList: true, subtree: true, characterData: true });
  window.addEventListener('resize', fitNames);
  fitNames();
})();
`

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="sk" className={`bg-background ${geistSans.variable} ${geistMono.variable} ${fraunces.variable}`}>
      <body className="antialiased font-sans">
        <LanguageProvider>{children}</LanguageProvider>
        <Script id="fit-epc-employee-names" strategy="afterInteractive">{fitEpcNamesScript}</Script>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
