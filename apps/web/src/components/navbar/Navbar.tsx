import React, { useState } from 'react';
import { Link } from 'react-router-dom';

interface Route {
  label: string;
  path: string;
  type: 'link' | 'button';
}

const leftRoutes: Route[] = [
  { label: 'About', path: '/about', type: 'link' },
];

const linkClass =
  'mx-3 text-black no-underline border-b border-transparent transition-[border-color] duration-150 ease-in-out hover:border-[#505050] text-base leading-6 font-semibold first:ml-0 last:mr-0';

const buttonClass =
  'mx-3 px-16 py-3 text-black no-underline border-2 border-[#bababa] rounded-[26px] transition-[color,background] duration-150 ease-in-out hover:text-white hover:bg-[#bababa] text-base leading-6 font-semibold';

const Navbar = (): JSX.Element => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <>
      {/* Spacer to offset fixed nav — desktop: 64px + 24px padding, mobile: 32px + 24px */}
      <div className="min-h-16 my-6 mx-32 max-[768px]:min-h-8 max-[768px]:mx-12" />

      <div className="fixed top-0 z-[3] flex items-center w-full py-6 px-32 bg-white shadow-[0_3px_6px_#00000029] max-[768px]:flex-col max-[768px]:px-12">
        {/* Logo + hamburger row */}
        <div className="flex-none max-[768px]:flex max-[768px]:justify-between max-[768px]:w-full">
          <Link to="/" className="mr-24 max-[768px]:mr-0">
            <img
              src="/b-logo.png"
              alt="Baseline Core"
              className="w-full h-16 max-h-16 max-w-[250px] object-contain max-[768px]:h-8"
            />
          </Link>
          <div
            className="hidden max-[768px]:flex flex-col justify-evenly w-8 h-8 cursor-pointer"
            onClick={() => setIsMobileOpen((o) => !o)}
            onKeyDown={() => setIsMobileOpen((o) => !o)}
            tabIndex={0}
            role="button"
            aria-label="Toggle menu"
          >
            <div className="h-[5px] bg-black" />
            <div className="h-[5px] bg-black" />
            <div className="h-[5px] bg-black" />
          </div>
        </div>

        {/* Desktop links */}
        <div className="flex flex-auto max-[768px]:hidden">
          <div className="flex flex-[1_1_50%]">
            {leftRoutes.map((route) => (
              <Link
                className={route.type === 'link' ? linkClass : buttonClass}
                to={route.path}
                key={`${route.label}-${route.path}`}
              >
                {route.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Mobile dropdown */}
        <div
          className={`overflow-hidden transition-all duration-200 ease-in-out w-full max-[768px]:block hidden ${
            isMobileOpen ? 'max-h-96' : 'max-h-0'
          }`}
        >
          <div className="flex flex-col items-center justify-center my-4 gap-3">
            {leftRoutes.map((route) => (
              <Link
                className={route.type === 'link' ? linkClass : buttonClass}
                to={route.path}
                key={`mobile-${route.label}-${route.path}`}
              >
                {route.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default Navbar;
