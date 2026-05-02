import React from 'react';
import { Link } from 'react-router-dom';

function Home() {
  return (
    <div className="flex min-h-screen overflow-hidden flex-row flex-auto">
      <div className="flex flex-col flex-auto justify-center items-center gap-4">
        <h1 className="text-4xl font-bold">Home</h1>
        <p className="text-base text-muted-foreground">Welcome to the home page</p>
        <Link
          to="/dashboard"
          className="inline-block px-[108px] py-3 text-white bg-[#3a3838] border-2 border-[#3a3838] rounded-[32px] transition-[background-color,color] duration-150 ease-in-out hover:text-[#3a3838] hover:bg-white"
        >
          Dashboard
        </Link>
      </div>
    </div>
  );
}

export default Home;
