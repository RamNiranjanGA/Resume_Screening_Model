import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'LuminaryHire — AI-Powered Video Resume Screening',
  description: 'Apply to jobs with a 60-second video or voice intro. Our AI matches you to roles instantly — no paper resume required.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        {children}
      </body>
    </html>
  );
}
