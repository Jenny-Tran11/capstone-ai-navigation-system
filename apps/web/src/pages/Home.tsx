import CtaSection from '../components/cta-section/CtaSection';
import FeaturesSection from '../components/features-section/FeaturesSection';
import Hero from '../components/hero/Hero';
import HowItWorksSection from '../components/how-it-works-section/HowItWorksSection';
import PageWrapper from '../components/page-wrapper/PageWrapper';
import ProblemSection from '../components/problem-section/ProblemSection';
import StatsSection from '../components/stats-section/StatsSection';
import TechStackSection from '../components/tech-stack-section/TechStackSection';

const Home = (): JSX.Element => (
  <PageWrapper title="Home">
    <>
      <Hero />
      <StatsSection />
      <ProblemSection />
      <FeaturesSection />
      <HowItWorksSection />
      <TechStackSection />
      <CtaSection />
    </>
  </PageWrapper>
);

export default Home;
