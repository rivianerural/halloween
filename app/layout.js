import localFont from 'next/font/local';
import './globals.css';

const creepster = localFont({ src: './fonts/Creepster-Regular.ttf', weight: '400', variable: '--font-creep', display: 'swap' });
const montserrat = localFont({ src: './fonts/Montserrat-Variable.ttf', weight: '100 900', variable: '--font-sans', display: 'swap' });

export const metadata = {
  title: 'Sorteio das travessuras | erural',
  description: 'Doçuras ou Travessuras: sorteie sua travessura.',
  icons: { icon: 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🦇</text></svg>' },
};

export const viewport = { width: 'device-width', initialScale: 1, viewportFit: 'cover', themeColor: '#F26B1D' };

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR" className={`${creepster.variable} ${montserrat.variable}`}>
      <body>{children}</body>
    </html>
  );
}
