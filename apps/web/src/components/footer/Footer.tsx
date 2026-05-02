import React from 'react';
import { Link } from 'react-router-dom';

const Footer = (): JSX.Element => (
  <div className="flex p-32 text-white bg-[#3a3838] max-[1200px]:flex-col max-[1200px]:p-8 max-[1200px]:px-4">
    <div className="flex-[1_1_33%] max-[1200px]:flex-auto max-[1200px]:mb-4">
      <img src="/logo-white.svg" alt="logo" className="h-10 object-contain" />
      <div className="mt-8">
        <Link
          to="/about"
          className="mr-[42px] text-white no-underline text-2xl leading-8 font-semibold max-[768px]:text-base max-[768px]:leading-6 hover:underline"
        >
          About
        </Link>
      </div>
      <div className="mt-8 text-2xl leading-8 font-normal max-[768px]:text-base max-[768px]:leading-6">
        Business Address
        <br />
        Smith Street
        <br />
        1234 5678
      </div>
    </div>
    <div className="flex-[1_1_33%] max-[1200px]:flex-auto">{/* Column for mailing list */}</div>
  </div>
);

export default Footer;
