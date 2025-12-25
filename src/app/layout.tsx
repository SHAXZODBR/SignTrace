import Sidebar from '@/components/Sidebar';
import './globals.css';

export const metadata = {
  title: 'SignTrace - AI-Driven Accountability Framework',
  description: 'Process monitoring and anti-corruption analysis system',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <div className="dashboard-layout">
          <Sidebar />
          <main className="main-content">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
