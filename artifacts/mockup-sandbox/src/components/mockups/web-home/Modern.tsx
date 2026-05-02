import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight, Box, ChevronRight, Github, Twitter, Linkedin, Menu } from 'lucide-react';

export function Modern() {
  return (
    <div className="min-h-screen bg-white text-zinc-900 font-sans selection:bg-zinc-900 selection:text-white flex flex-col" style={{ fontFamily: '"Montserrat", sans-serif' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700&display=swap');
        
        .font-montserrat {
          font-family: 'Montserrat', sans-serif;
        }
      `}</style>
      
      {/* Navbar */}
      <header className="sticky top-0 z-50 w-full border-b border-zinc-100 bg-white/80 backdrop-blur-md">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Box className="w-6 h-6 text-zinc-900" />
            <span className="font-bold text-lg tracking-tight">Baseline Core</span>
          </div>
          
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-600">
            <a href="#features" className="hover:text-zinc-900 transition-colors">Platform</a>
            <a href="#solutions" className="hover:text-zinc-900 transition-colors">Solutions</a>
            <a href="#resources" className="hover:text-zinc-900 transition-colors">Resources</a>
            <a href="#pricing" className="hover:text-zinc-900 transition-colors">Pricing</a>
          </nav>
          
          <div className="flex items-center gap-4">
            <a href="#login" className="hidden md:block text-sm font-medium text-zinc-600 hover:text-zinc-900 transition-colors">Sign in</a>
            <Button className="bg-zinc-900 text-white hover:bg-zinc-800 rounded-full px-6 shadow-sm hidden md:flex">
              Get Started
            </Button>
            <button className="md:hidden p-2 text-zinc-600">
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex items-center">
        <section className="container mx-auto px-6 py-20 md:py-32">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="max-w-2xl">
              <div className="inline-flex items-center rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-medium text-zinc-600 mb-8">
                <span className="flex h-2 w-2 rounded-full bg-blue-600 mr-2"></span>
                Baseline 2.0 is now available
              </div>
              
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-zinc-900 leading-[1.1] mb-6">
                The foundation for <span className="font-light text-zinc-500">ambitious</span> software.
              </h1>
              
              <p className="text-lg md:text-xl text-zinc-500 leading-relaxed mb-10 max-w-lg">
                Accelerate your development cycle with our enterprise-grade infrastructure. Build, scale, and secure your applications without the operational overhead.
              </p>
              
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <Button size="lg" className="bg-zinc-900 text-white hover:bg-zinc-800 rounded-full px-8 h-12 text-base shadow-lg shadow-zinc-200">
                  Start building free
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
                <Button size="lg" variant="outline" className="rounded-full px-8 h-12 text-base border-zinc-200 text-zinc-600 hover:bg-zinc-50">
                  Book a demo
                </Button>
              </div>
              
              <div className="mt-12 flex items-center gap-6 text-sm text-zinc-400">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  No credit card required
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  14-day free trial
                </div>
              </div>
            </div>
            
            <div className="relative w-full aspect-square md:aspect-[4/3] rounded-3xl overflow-hidden bg-zinc-50 border border-zinc-100 flex items-center justify-center p-8 shadow-2xl shadow-zinc-100/50">
              <img 
                src="/__mockup/images/modern-hero.png" 
                alt="Baseline Core Abstract Architecture" 
                className="w-full h-full object-cover rounded-2xl"
              />
              <div className="absolute inset-0 ring-1 ring-inset ring-black/5 rounded-3xl pointer-events-none"></div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-100 bg-white pt-16 pb-8">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 mb-16">
            <div className="col-span-2 lg:col-span-2">
              <div className="flex items-center gap-2 mb-6">
                <Box className="w-5 h-5 text-zinc-900" />
                <span className="font-bold text-base tracking-tight">Baseline Core</span>
              </div>
              <p className="text-zinc-500 text-sm max-w-xs mb-6 leading-relaxed">
                Empowering engineering teams to ship faster, scale confidently, and focus on what matters most.
              </p>
              <div className="flex items-center gap-4 text-zinc-400">
                <a href="#" className="hover:text-zinc-900 transition-colors"><Twitter className="w-4 h-4" /></a>
                <a href="#" className="hover:text-zinc-900 transition-colors"><Github className="w-4 h-4" /></a>
                <a href="#" className="hover:text-zinc-900 transition-colors"><Linkedin className="w-4 h-4" /></a>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold text-zinc-900 text-sm mb-4">Product</h4>
              <ul className="space-y-3 text-sm text-zinc-500">
                <li><a href="#" className="hover:text-zinc-900 transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-zinc-900 transition-colors">Integrations</a></li>
                <li><a href="#" className="hover:text-zinc-900 transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-zinc-900 transition-colors">Changelog</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-zinc-900 text-sm mb-4">Company</h4>
              <ul className="space-y-3 text-sm text-zinc-500">
                <li><a href="#" className="hover:text-zinc-900 transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-zinc-900 transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-zinc-900 transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-zinc-900 transition-colors">Contact</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-zinc-900 text-sm mb-4">Legal</h4>
              <ul className="space-y-3 text-sm text-zinc-500">
                <li><a href="#" className="hover:text-zinc-900 transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-zinc-900 transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-zinc-900 transition-colors">Cookie Policy</a></li>
              </ul>
            </div>
          </div>
          
          <div className="pt-8 border-t border-zinc-100 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-zinc-400 text-sm">
              © {new Date().getFullYear()} Baseline Core Inc. All rights reserved.
            </p>
            <div className="flex items-center gap-6 text-sm text-zinc-400">
              <span>San Francisco, CA</span>
              <span>hello@baselinecore.com</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
