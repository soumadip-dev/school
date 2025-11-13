import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';

const Layout = () => (
  <div className="flex flex-col min-h-screen overflow-x-hidden">
    <Navbar />
    <main className="flex-grow">
      <Outlet />
    </main>
  </div>
);

export default Layout;
