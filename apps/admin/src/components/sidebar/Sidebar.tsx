import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

const Sidebar = (): JSX.Element => {
  const location = useLocation();
  const [isToggled, setIsToggled] = useState(false);

  useEffect(() => {
    if (window.innerWidth < 400) {
      setIsToggled(true);
    }
  }, []);

  const sidebarWidth = 338;

  return (
    <div
      className="relative z-[3] flex-none h-screen py-12 px-11 bg-white transition-[margin-left] duration-[250ms] linear"
      style={{
        width: sidebarWidth,
        marginLeft: isToggled ? -sidebarWidth : 0,
      }}
    >
      <div
        className="absolute top-[10px] right-[-42px] w-8 h-8 border-t-[16px] border-l-[16px] border-[#b2b2b2] rotate-0 cursor-pointer opacity-25 transition-[transform,opacity] duration-[150ms] ease-in-out hover:rotate-45 hover:opacity-100"
        style={{ transform: isToggled ? 'rotate(90deg)' : undefined }}
        onClick={() => setIsToggled((t) => !t)}
      />
      <img className="mb-12 h-10 max-h-[50px] max-w-[200px] object-contain" src="/logo.png" alt="Baseline" />

      <nav className="mt-12 flex flex-col gap-0">
        {[
          { to: '/dashboard', label: 'Dashboard', icon: '/icons/home.svg', alt: 'Home' },
          { to: '/admins', label: 'Admins', icon: '/icons/users.svg', alt: 'Admins' },
          { to: '/settings', label: 'Account Settings', icon: '/icons/gear.svg', alt: 'Settings' },
        ].map(({ to, label, icon, alt }) => {
          const isActive = location.pathname === to;
          return (
            <Link
              key={to}
              to={to}
              className={`flex items-center mb-4 no-underline ${isActive ? 'pointer-events-none select-none' : ''}`}
            >
              <img
                src={icon}
                alt={alt}
                className="w-5 h-10 flex-none object-contain"
                style={{ filter: isActive ? 'brightness(0)' : undefined }}
              />
              <span
                className={`ml-[15px] font-light text-[17px] leading-5 border-b transition-[border-color] duration-150 ease-in-out ${
                  isActive
                    ? 'text-black border-transparent'
                    : 'text-[#707070] border-transparent hover:border-[#707070]'
                }`}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
};

export default Sidebar;
