import './globals.css';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'PokeQuest - Learning Platform',
  description: 'A Pokemon-inspired personalized quiz platform powered by Gemini AI.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      {/* Ensure the body tag has the Inter font applied, if using the Google font */}
      <body className={inter.className + " min-h-screen"}>{children}</body>
    </html>
  );
}
