import React from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, Menu } from "lucide-react";
import "./_group.css";

export function Warm() {
  return (
    <div className="warm-theme min-h-screen flex flex-col selection:bg-[hsl(var(--primary))] selection:text-white">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-[hsl(var(--background))]/80 backdrop-blur-md border-b border-[hsl(var(--border))]">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[hsl(var(--primary))] flex items-center justify-center">
              <span className="text-white font-bold text-sm">B</span>
            </div>
            <span className="text-xl font-medium tracking-tight">Baseline Core</span>
          </div>
          
          <div className="hidden md:flex items-center gap-8 text-sm font-medium">
            <a href="#" className="hover:text-[hsl(var(--primary))] transition-colors">Platform</a>
            <a href="#" className="hover:text-[hsl(var(--primary))] transition-colors">Solutions</a>
            <a href="#" className="hover:text-[hsl(var(--primary))] transition-colors">Our Story</a>
            <a href="#" className="hover:text-[hsl(var(--primary))] transition-colors">Journal</a>
          </div>

          <div className="hidden md:flex items-center gap-4">
            <a href="#" className="text-sm font-medium hover:text-[hsl(var(--primary))] transition-colors">Sign in</a>
            <Button className="bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))]/90 text-white rounded-full px-6 transition-all duration-300">
              Get Started
            </Button>
          </div>

          <button className="md:hidden p-2 text-[hsl(var(--foreground))]">
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center pt-24 pb-16 px-6 relative overflow-hidden">
        {/* Soft background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[hsl(var(--accent))]/10 rounded-full blur-3xl -z-10 pointer-events-none" />
        
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[hsl(var(--primary))]/20 bg-[hsl(var(--primary))]/5 text-[hsl(var(--primary))] text-sm font-medium mb-4">
            <span className="w-2 h-2 rounded-full bg-[hsl(var(--primary))]" />
            Introducing Baseline Core 2.0
          </div>
          
          <h1 className="text-5xl md:text-7xl leading-tight font-editorial text-[hsl(var(--foreground))]">
            Software that feels <strong>human</strong>.<br />
            Built for modern teams.
          </h1>
          
          <p className="text-lg md:text-xl text-[hsl(var(--foreground))]/70 max-w-2xl mx-auto leading-relaxed font-light">
            We believe technology should adapt to your rhythm, not the other way around. 
            Baseline Core is the flexible foundation for teams that value craft as much as velocity.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Button size="lg" className="bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))]/90 text-white rounded-full px-8 h-14 text-base w-full sm:w-auto shadow-lg shadow-[hsl(var(--primary))]/20 group transition-all duration-300">
              Start your journey
              <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button size="lg" variant="outline" className="rounded-full px-8 h-14 text-base w-full sm:w-auto border-[hsl(var(--border))] hover:bg-[hsl(var(--primary))]/5 hover:text-[hsl(var(--primary))] hover:border-[hsl(var(--primary))]/30 transition-all duration-300">
              Read our manifesto
            </Button>
          </div>
        </div>

        <div className="mt-20 w-full max-w-6xl mx-auto px-4 sm:px-6">
          <div className="relative rounded-[2rem] overflow-hidden shadow-2xl shadow-[hsl(var(--foreground))]/5 aspect-[16/9] bg-white">
            <img 
              src="/__mockup/images/warm-hero.png" 
              alt="Team collaborating in a modern warm studio" 
              className="w-full h-full object-cover"
            />
            {/* Soft inset shadow/border */}
            <div className="absolute inset-0 rounded-[2rem] border border-black/5 pointer-events-none" />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-[hsl(var(--border))] py-16 px-6 mt-12">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-[hsl(var(--primary))] flex items-center justify-center">
                <span className="text-white font-bold text-xs">B</span>
              </div>
              <span className="text-lg font-medium tracking-tight">Baseline Core</span>
            </div>
            <p className="text-sm text-[hsl(var(--foreground))]/60 max-w-xs">
              Crafting human-centred software foundations for modern creative teams.
            </p>
          </div>
          
          <div className="space-y-4">
            <h4 className="font-semibold text-[hsl(var(--foreground))]">Platform</h4>
            <div className="flex flex-col gap-3 text-sm text-[hsl(var(--foreground))]/60">
              <a href="#" className="hover:text-[hsl(var(--primary))] transition-colors">Features</a>
              <a href="#" className="hover:text-[hsl(var(--primary))] transition-colors">Integrations</a>
              <a href="#" className="hover:text-[hsl(var(--primary))] transition-colors">Pricing</a>
              <a href="#" className="hover:text-[hsl(var(--primary))] transition-colors">Changelog</a>
            </div>
          </div>
          
          <div className="space-y-4">
            <h4 className="font-semibold text-[hsl(var(--foreground))]">Company</h4>
            <div className="flex flex-col gap-3 text-sm text-[hsl(var(--foreground))]/60">
              <a href="#" className="hover:text-[hsl(var(--primary))] transition-colors">About Us</a>
              <a href="#" className="hover:text-[hsl(var(--primary))] transition-colors">Careers</a>
              <a href="#" className="hover:text-[hsl(var(--primary))] transition-colors">Blog</a>
              <a href="#" className="hover:text-[hsl(var(--primary))] transition-colors">Contact</a>
            </div>
          </div>
          
          <div className="space-y-4">
            <h4 className="font-semibold text-[hsl(var(--foreground))]">Connect</h4>
            <div className="flex flex-col gap-3 text-sm text-[hsl(var(--foreground))]/60">
              <a href="#" className="hover:text-[hsl(var(--primary))] transition-colors">hello@baselinecore.com</a>
              <a href="#" className="hover:text-[hsl(var(--primary))] transition-colors">Twitter</a>
              <a href="#" className="hover:text-[hsl(var(--primary))] transition-colors">LinkedIn</a>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-16 pt-8 border-t border-[hsl(var(--border))] flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-[hsl(var(--foreground))]/50">
          <p>© {new Date().getFullYear()} Baseline Core. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <a href="#" className="hover:text-[hsl(var(--foreground))] transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-[hsl(var(--foreground))] transition-colors">Terms of Service</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
