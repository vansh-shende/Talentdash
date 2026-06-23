import Sidebar from '@/components/layout/sidebar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <main style={{ 
        marginLeft: '260px', 
        flex: 1, 
        padding: '40px',
        backgroundColor: 'var(--bg-primary)',
        minHeight: '100vh',
        transition: 'margin-left var(--transition-normal)'
      }}>
        {children}
      </main>
    </div>
  );
}
