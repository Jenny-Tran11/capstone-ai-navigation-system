import type { ReactNode } from 'react';
import { Helmet } from 'react-helmet-async';
import Footer from '../footer/Footer';
import Navbar from '../navbar/Navbar';

interface Props {
  children: ReactNode;
  title?: string;
}

const PageWrapper = (props: Props): JSX.Element => {
  const { children, title } = props;

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: 'var(--warm-bg)' }}
    >
      <Helmet>
        <title>
          {title ? `${title} | AI-Detect` : 'AI-Detect — Accessible Navigation'}
        </title>
      </Helmet>
      <Navbar />
      <div className="flex-1">{children}</div>
      <Footer />
    </div>
  );
};

export default PageWrapper;
