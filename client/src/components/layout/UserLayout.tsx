import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Navbar from '../navbar/Navbar';
import Footer from '../footer/Footer';
import FloatingSocialSidebar from '../common/FloatingSocialSidebar';

interface UserLayoutProps {
  children: React.ReactNode;
}

export const ScrollToTop: React.FC = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

export const UserLayout: React.FC<UserLayoutProps> = ({ children }) => {
  const { pathname } = useLocation();
  return (
    <div className="min-h-screen flex flex-col bg-[#F0F4FF]">
      <ScrollToTop />
      <Navbar />
      <FloatingSocialSidebar />
      <main key={pathname} className="flex-1 min-h-[calc(100vh-140px)] page-enter">
        {children}
      </main>
      <Footer />
    </div>
  );
};


export default UserLayout;
