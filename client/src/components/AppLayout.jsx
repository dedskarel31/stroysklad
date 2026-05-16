import Navbar from './Navbar.jsx';

export default function AppLayout({ children }) {
  return (
    <>
      <Navbar />
      <main className="container-fluid px-3 px-md-4" style={{ paddingTop: '5.5rem', paddingBottom: '2rem' }}>
        {children}
      </main>
    </>
  );
}
