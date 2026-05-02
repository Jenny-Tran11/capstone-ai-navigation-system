import React from 'react';
import { Link } from 'react-router-dom';

const AboutBanner = (): JSX.Element => (
  <div className="flex items-center justify-evenly py-[280px] px-24 max-[1200px]:flex-col-reverse max-[1200px]:py-8 max-[1200px]:px-4">
    <div className="flex-auto max-w-[550px] max-[1200px]:max-w-none">
      <h1 className="text-[72px] leading-[88px] font-bold max-[768px]:text-[40px] max-[768px]:leading-[49px]">
        About us
      </h1>
      <p className="text-2xl leading-8 max-[768px]:text-base max-[768px]:leading-6">
        Duis aute irure dolor in reprehenderit in voluptate velit esse cillum
        dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non
        proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
        Maecenas sapien massa, aliquet id lectus sed, vulputate molestie nunc.
      </p>
      <Link
        to="/#"
        className="inline-block px-[108px] py-3 text-white no-underline bg-[#3a3838] border-2 border-[#3a3838] rounded-[32px] transition-[background-color,color] duration-150 ease-in-out hover:text-[#3a3838] hover:bg-white text-base leading-6 font-semibold max-[768px]:text-xs max-[768px]:leading-5"
      >
        Button
      </Link>
    </div>
    <div className="flex-none w-[500px] h-[480px] m-4 max-[1200px]:w-full max-[1200px]:mb-8">
      <img src="./placeholder.svg" alt="placeholder" className="w-full h-full object-cover" />
    </div>
  </div>
);

export default AboutBanner;
