import React from 'react';

const DashboardContent = (): JSX.Element => {
  return (
    <div>
      <h1 className="text-[40px] leading-[49px] font-normal mb-8 md:text-2xl md:leading-8">Dashboard</h1>
      <div className="grid gap-4 grid-cols-2 xl:grid-cols-1">
        <div className="mb-4 p-8 bg-white border border-[#bababa]">
          <h2 className="text-2xl leading-8 md:text-base md:leading-6">My Site Preview</h2>
        </div>
      </div>
    </div>
  );
};

export default DashboardContent;
