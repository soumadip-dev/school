import { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  faHome,
  faUsers,
  faBlog,
  faImage,
  faComments,
  faHandHoldingHeart,
  faCalendarAlt,
  faLightbulb,
  faChalkboardTeacher,
  faUser,
  faSignInAlt,
  faSignOutAlt,
  faBars,
  faTimes,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useAuthStore } from '../store/authStore';

const menuItemsBase = [
  { path: '/', label: 'Home', icon: faHome },
  { path: '/alumni', label: 'Alumni', icon: faUsers },
  { path: '/blog', label: 'Blog', icon: faBlog },
  { path: '/album', label: 'Album', icon: faImage },
  { path: '/discuss', label: 'Discuss', icon: faComments },
  { path: '/donate', label: 'Donate', icon: faHandHoldingHeart },
  { path: '/events', label: 'Events', icon: faCalendarAlt },
  { path: '/ideas', label: 'Ideas', icon: faLightbulb },
  { path: '/guidance', label: 'Guidance', icon: faChalkboardTeacher },
  { path: '/profile', label: 'My Profile', icon: faUser },
];

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { isAuthenticated, isAdmin, checkAuth, logout } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setMenuOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLogout = async () => {
    const res = await logout();
    if (res.success) navigate('/signin');
  };

  // Filter menu items based on authentication and admin status
  const getMenuItems = () => {
    const baseItems = [...menuItemsBase];

    // Remove "My Profile" if user is admin
    const filteredItems = baseItems.filter(item => !(item.path === '/profile' && isAdmin));

    // Add login/logout button
    const finalItems = [
      ...filteredItems,
      isAuthenticated
        ? { path: '#', label: 'Logout', icon: faSignOutAlt, onClick: handleLogout }
        : { path: '/signin', label: 'Login', icon: faSignInAlt },
    ];

    return finalItems;
  };

  const menuItems = getMenuItems();

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 bg-[#004D40] text-white transition-all duration-300 ${
          isScrolled ? 'shadow-lg py-1 sm:py-2' : 'py-2 sm:py-3'
        }`}
      >
        {/* Changed container layout here */}
        <div className="w-full flex justify-between items-center px-4 sm:px-6 lg:px-8">
          {/* Logo/Brand (Left aligned) */}
          <div className="flex-shrink-0">
            <div className="text-lg sm:text-xl font-bold tracking-tight cursor-pointer hover:text-gray-200 transition-colors whitespace-nowrap">
              JZS Alumni
            </div>
          </div>

          {/* Desktop Navigation (Right aligned) */}
          <ul className="hidden md:flex items-center space-x-1 lg:space-x-2 xl:space-x-3 font-medium">
            {menuItems.map(({ path, label, onClick }) => (
              <li key={label}>
                {onClick ? (
                  <button
                    onClick={onClick}
                    className="hover:bg-[#01796B] px-2 sm:px-3 lg:px-4 py-1 sm:py-2 rounded-lg transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-[#01796B] focus:ring-opacity-50 text-sm lg:text-base whitespace-nowrap cursor-pointer"
                  >
                    {label}
                  </button>
                ) : (
                  <NavLink
                    to={path}
                    className={({ isActive }) =>
                      `hover:bg-[#01796B] px-2 sm:px-3 lg:px-4 py-1 sm:py-2 rounded-lg transition-all duration-200 block hover:scale-105 text-sm lg:text-base whitespace-nowrap ${
                        isActive ? 'bg-[#00332E] text-white shadow-inner' : 'text-gray-100'
                      }`
                    }
                  >
                    {label}
                  </NavLink>
                )}
              </li>
            ))}
          </ul>

          {/* Mobile menu button */}
          <button
            className="md:hidden text-white p-1 sm:p-2 rounded-lg hover:bg-[#01796B] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#01796B] focus:ring-opacity-50 cursor-pointer"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            <FontAwesomeIcon
              icon={menuOpen ? faTimes : faBars}
              className="text-lg sm:text-xl transition-transform duration-200"
            />
          </button>
        </div>

        {/* Mobile Navigation */}
        <div
          className={`md:hidden transition-all duration-300 ease-in-out overflow-hidden ${
            menuOpen ? 'max-h-96 opacity-100 py-2 sm:py-3' : 'max-h-0 opacity-0'
          }`}
        >
          <ul className="space-y-1 sm:space-y-2 font-medium border-t border-[#01796B] pt-2 sm:pt-3">
            {menuItems.map(({ path, label, onClick }) => (
              <li key={label}>
                {onClick ? (
                  <button
                    onClick={() => {
                      onClick();
                      setMenuOpen(false);
                    }}
                    className="w-full text-left hover:bg-[#074b46] px-3 sm:px-4 py-2 sm:py-3 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#01796B] focus:ring-opacity-50 text-sm sm:text-base cursor-pointer"
                  >
                    {label}
                  </button>
                ) : (
                  <NavLink
                    to={path}
                    onClick={() => setMenuOpen(false)}
                    className={({ isActive }) =>
                      `w-full block hover:bg-[#074b46] px-3 sm:px-4 py-2 sm:py-3 rounded-lg transition-all duration-200 text-sm sm:text-base ${
                        isActive ? 'bg-[#074b46] text-white font-semibold' : 'text-gray-100'
                      }`
                    }
                  >
                    {label}
                  </NavLink>
                )}
              </li>
            ))}
          </ul>
        </div>

        {menuOpen && (
          <div
            className="fixed top-0 left-0 right-0 bottom-0 bg-black bg-opacity-50 z-40 md:hidden cursor-pointer"
            onClick={() => setMenuOpen(false)}
            style={{ top: '100%' }}
          />
        )}
      </nav>

      {/* Spacer to prevent content from going behind navbar */}
      <div className="h-10 sm:h-15"></div>
    </>
  );
};

export default Navbar;