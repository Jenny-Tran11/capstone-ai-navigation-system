import React from 'react';

interface Props {
  children: JSX.Element | JSX.Element[];
}

const PageContent = (props: Props) => {
  const { children } = props;

  return (
    <div className="relative px-[min(12vw,144px)] py-[98px] bg-[#efefef] w-full">
      <div className="animate-[fade_500ms_forwards_ease-in-out]">{children}</div>
    </div>
  );
};

export default PageContent;
