import { Helmet } from 'react-helmet';
import Footer from '../footer/Footer';
import Navbar from '../navbar/Navbar';

interface Props {
  children: JSX.Element;
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
        <title>{title ? `${title} | Baseline Core` : 'Baseline Core'}</title>
      </Helmet>
      <Navbar />
      <div className="flex-1">{children}</div>
      <Footer />
    </div>
  );
};

export default PageWrapper;
