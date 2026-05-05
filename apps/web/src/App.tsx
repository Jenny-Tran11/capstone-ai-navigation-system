import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import About from './pages/About';
import Contact from './pages/Contact';
import Features from './pages/Features';
import GetStarted from './pages/GetStarted';
import Home from './pages/Home';
import HowItWorks from './pages/HowItWorks';
import SimplePage from './pages/SimplePage';

const router = createBrowserRouter([
  { path: '/', element: <Home /> },
  { path: '/about', element: <About /> },
  { path: '/features', element: <Features /> },
  { path: '/how-it-works', element: <HowItWorks /> },
  { path: '/get-started', element: <GetStarted /> },
  { path: '/contact', element: <Contact /> },
  {
    path: '/privacy',
    element: (
      <SimplePage
        title="Privacy Policy"
        heading="Your privacy matters."
        description="We collect only what we need to operate the service, protect it rigorously, and never sell your data. AI-Detect stores detection history and user preferences on AWS infrastructure with Cognito-secured access."
      />
    ),
  },
  {
    path: '/terms',
    element: (
      <SimplePage
        title="Terms of Service"
        heading="Terms of Service."
        description="By using AI-Detect you agree to these terms. This is a university capstone project provided for educational and demonstration purposes."
      />
    ),
  },
]);

const App = () => <RouterProvider router={router} />;

export default App;
