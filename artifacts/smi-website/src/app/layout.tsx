import type { Metadata } from 'next';
import './globals.css';
import ThemeRegistry from '@/components/ThemeRegistry';
import { AuthProvider } from '@/contexts/AuthContext';

export const metadata: Metadata = {
  title: 'SMI Arawani | School Management Portal',
  description: 'Scholars Modern Institute Arawani - School Management System',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ThemeRegistry>
          <AuthProvider>
            {children}
          </AuthProvider>
        </ThemeRegistry>
      </body>
    </html>
  );
}
