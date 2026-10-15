import { Inter, JetBrains_Mono, Playfair_Display } from 'next/font/google';

export const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '600', '900'],
  display: 'swap',
  variable: '--font-inter',
});

export const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['100', '400', '800'],
  display: 'swap',
  variable: '--font-jetbrains-mono',
});

export const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['400', '700', '900'],
  style: ['normal', 'italic'],
  display: 'swap',
  variable: '--font-playfair',
});

/** Combined CSS-variable class names, applied to <html>; tailwind fontFamily reads the variables. */
export const fontVariables = [inter.variable, jetbrainsMono.variable, playfair.variable].join(' ');
