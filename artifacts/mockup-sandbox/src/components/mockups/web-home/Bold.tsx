import React from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, Terminal, Layers, Shield, Menu } from "lucide-react";

export function Bold() {
  return (
    <div className="min-h-screen bg-[#0A0A0B] text-slate-200 font-['Montserrat',sans-serif] selection:bg-cyan-500/30">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700;800&display=swap');
        
        .glow-button {
          box-shadow: 0 0 20px -5px rgba(6, 182, 212, 0.5);
          transition: all 0.3s ease;
        }
        .glow-button:hover {
          box-shadow: 0 0 30px 0px rgba(6, 182, 212, 0.8);
        }
        
        .hero-bg {
          background: radial-gradient(circle at 50% 0%, rgba(6, 182, 212, 0.15) 0%, rgba(10, 10, 11, 1) 50%);
        }
      `}</style>

      {/* Sticky Navbar */}
      <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-[#0A0A0B]/80 backdrop-blur-md">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center">
              <Terminal className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-white tracking-tight text-xl">Baseline</span>
          </div>
          
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-400">
            <a href="#" className="hover:text-white transition-colors">Platform</a>
            <a href="#" className="hover:text-white transition-colors">Solutions</a>
            <a href="#" className="hover:text-white transition-colors">Documentation</a>
            <a href="#" className="hover:text-white transition-colors">Pricing</a>
          </nav>

          <div className="hidden md:flex items-center gap-4">
            <a href="#" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">Log in</a>
            <Button className="bg-cyan-500 hover:bg-cyan-400 text-black font-semibold rounded-none glow-button border border-cyan-300/50">
              Start Building
            </Button>
          </div>
          
          <button className="md:hidden text-slate-400">
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <main>
        <section className="relative pt-24 pb-32 overflow-hidden hero-bg">
          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-4xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold uppercase tracking-wider mb-8">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
                Baseline Engine v2.0 is live
              </div>
              
              <h1 className="text-5xl md:text-7xl font-extrabold text-white tracking-tight mb-8 leading-tight">
                Ship infrastructure <br className="hidden md:block" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600">at lightspeed.</span>
              </h1>
              
              <p className="text-lg md:text-xl text-slate-400 mb-12 max-w-2xl mx-auto leading-relaxed">
                The developer platform that unifies your microservices, databases, and edge deployments into a single, cohesive developer experience. No YAML required.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20">
                <Button size="lg" className="w-full sm:w-auto bg-cyan-500 hover:bg-cyan-400 text-black font-bold h-14 px-8 rounded-none glow-button text-base">
                  Start for free <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
                <Button size="lg" variant="outline" className="w-full sm:w-auto h-14 px-8 rounded-none border-slate-700 hover:bg-white/5 text-white font-semibold text-base bg-transparent">
                  Read the docs
                </Button>
              </div>
            </div>

            {/* Hero Visual */}
            <div className="max-w-5xl mx-auto relative">
              <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0B] via-transparent to-transparent z-10 h-full w-full"></div>
              <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 to-blue-600 opacity-20 blur-2xl"></div>
              <div className="relative border border-white/10 rounded-lg overflow-hidden bg-[#111113] shadow-2xl">
                <div className="h-8 border-b border-white/5 flex items-center px-4 gap-2 bg-[#0A0A0B]">
                  <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50"></div>
                </div>
                <img 
                  src="/__mockup/images/bold-hero.png" 
                  alt="Baseline Core Infrastructure Dashboard" 
                  className="w-full h-auto object-cover opacity-90"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Features Preview */}
        <section className="py-24 border-t border-white/5 bg-[#0A0A0B]">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              <div className="p-6 border border-white/5 bg-[#111113] hover:border-cyan-500/30 transition-colors group">
                <Layers className="w-10 h-10 text-cyan-500 mb-6 group-hover:scale-110 transition-transform" />
                <h3 className="text-xl font-bold text-white mb-3">Unified Architecture</h3>
                <p className="text-slate-400 text-sm leading-relaxed">Connect your entire stack with zero configuration. We automatically map dependencies and optimize routing.</p>
              </div>
              <div className="p-6 border border-white/5 bg-[#111113] hover:border-cyan-500/30 transition-colors group">
                <Terminal className="w-10 h-10 text-cyan-500 mb-6 group-hover:scale-110 transition-transform" />
                <h3 className="text-xl font-bold text-white mb-3">Developer First</h3>
                <p className="text-slate-400 text-sm leading-relaxed">Built for the terminal. Our CLI is faster than your thoughts and integrates directly into your existing CI/CD.</p>
              </div>
              <div className="p-6 border border-white/5 bg-[#111113] hover:border-cyan-500/30 transition-colors group">
                <Shield className="w-10 h-10 text-cyan-500 mb-6 group-hover:scale-110 transition-transform" />
                <h3 className="text-xl font-bold text-white mb-3">Enterprise Secure</h3>
                <p className="text-slate-400 text-sm leading-relaxed">SOC2 Type II certified out of the box. E2E encryption and automated secrets management by default.</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 bg-[#050505] pt-16 pb-8">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16">
            <div className="col-span-2">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-6 h-6 rounded bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center">
                  <Terminal className="w-3 h-3 text-white" />
                </div>
                <span className="font-bold text-white tracking-tight">Baseline Core</span>
              </div>
              <p className="text-slate-400 text-sm max-w-xs mb-6">
                The modern infrastructure platform for developers who want to focus on code, not configuration.
              </p>
              <div className="text-slate-500 text-sm">
                San Francisco, CA
              </div>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-6 uppercase tracking-wider text-xs">Product</h4>
              <ul className="space-y-4 text-sm text-slate-400">
                <li><a href="#" className="hover:text-cyan-400 transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-cyan-400 transition-colors">Integrations</a></li>
                <li><a href="#" className="hover:text-cyan-400 transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-cyan-400 transition-colors">Changelog</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-6 uppercase tracking-wider text-xs">Company</h4>
              <ul className="space-y-4 text-sm text-slate-400">
                <li><a href="#" className="hover:text-cyan-400 transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-cyan-400 transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-cyan-400 transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-cyan-400 transition-colors">Contact</a></li>
              </ul>
            </div>
          </div>
          
          <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500">
            <p>© {new Date().getFullYear()} Baseline Core Inc. All rights reserved.</p>
            <div className="flex items-center gap-6">
              <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
