import React from 'react';
import { RouterProvider, createBrowserRouter } from 'react-router-dom';
import About from './pages/About';
import Contact from './pages/Contact';
import GetStarted from './pages/GetStarted';
import Home from './pages/Home';
import SignIn from './pages/SignIn';
import SimplePage from './pages/SimplePage';

const router = createBrowserRouter([
  { path: '/', element: <Home /> },
  { path: '/about', element: <About /> },
  { path: '/signin', element: <SignIn /> },
  { path: '/get-started', element: <GetStarted /> },
  { path: '/contact', element: <Contact /> },
  {
    path: '/features',
    element: (
      <SimplePage
        title="Features"
        badge="Platform"
        heading="Everything your team needs."
        description="From real-time collaboration to powerful integrations, Baseline Core gives modern teams the tools to move fast without sacrificing craft."
      />
    ),
  },
  {
    path: '/integrations',
    element: (
      <SimplePage
        title="Integrations"
        badge="Platform"
        heading="Connect the tools you love."
        description="Baseline Core works with the services your team already relies on — from project management to analytics and beyond."
      />
    ),
  },
  {
    path: '/pricing',
    element: (
      <SimplePage
        title="Pricing"
        badge="Simple pricing"
        heading="Honest pricing, no surprises."
        description="Start for free and scale as your team grows. Every plan includes the full Baseline Core experience — no hidden limits."
      />
    ),
  },
  {
    path: '/changelog',
    element: (
      <SimplePage
        title="Changelog"
        badge="What's new"
        heading="Always getting better."
        description="We ship improvements every week. Here's a running log of everything we've built, fixed, and refined."
      />
    ),
  },
  {
    path: '/careers',
    element: (
      <SimplePage
        title="Careers"
        badge="Join us"
        heading="Help us shape the future of software."
        description="We're a small, thoughtful team building tools that feel effortless. If that resonates with you, we'd love to talk."
      />
    ),
  },
  {
    path: '/blog',
    element: (
      <SimplePage
        title="Blog"
        badge="Insights"
        heading="Ideas from the Baseline Core team."
        description="We write about design, engineering, and the craft of building software that people actually enjoy using."
      />
    ),
  },
  {
    path: '/privacy',
    element: (
      <SimplePage
        title="Privacy Policy"
        heading="Your privacy matters."
        description="We collect only what we need, protect it rigorously, and never sell your data. Read on for the full details of how we handle your information."
      />
    ),
  },
  {
    path: '/terms',
    element: (
      <SimplePage
        title="Terms of Service"
        heading="Terms of Service."
        description="By using Baseline Core you agree to these terms. We've written them in plain language so they're easy to understand."
      />
    ),
  },
]);

const App = () => <RouterProvider router={router} />;

export default App;
