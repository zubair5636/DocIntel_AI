import React from "react";
import { Link } from "react-router-dom";
import { tools } from "../data/tools";
import { cn } from "../lib/utils";
import * as Icons from "lucide-react";
import { motion } from "motion/react";
import { ToolCard } from "../components/ToolCard";

export function Home() {
  const popularTools = tools.filter(t => t.isPopular);
  const govTools = tools.filter(t => t.category === "government");

  return (
    <div className="flex-1 w-full">
      {/* Hero Section */}
      <section className="relative pt-20 pb-20">
        <div className="container mx-auto px-4 relative z-10 text-center max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 font-medium text-[10px] uppercase tracking-widest mb-6 border border-blue-500/20">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-400"></span>
              </span>
              Processing happens locally in your browser
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 bg-gradient-to-b from-white to-slate-400 bg-clip-text text-transparent">
              Every Document Tool <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
                You'll Ever Need.
              </span>
            </h1>
            
            <p className="text-lg md:text-xl text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed">
              Convert, Compress, Resize, Scan, Edit, Protect and Prepare Documents for Any Website or Government Portal in seconds.
            </p>

            <div className="flex gap-4 justify-center">
              <Link to="/tools" className="bg-blue-600 text-white px-8 py-4 rounded-full font-semibold hover:shadow-lg shadow-blue-600/20 transition-all active:scale-95 hover:bg-blue-500">
                Explore Tools
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Popular Tools Grid */}
      <section className="py-20 relative">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="flex items-center justify-between mb-10">
            <h2 className="text-3xl font-display font-bold">Popular Tools</h2>
            <Link to="/tools" className="text-blue-400 font-medium hover:underline flex items-center gap-1">
              View all tools <Icons.ArrowRight size={16} />
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {popularTools.map((tool, idx) => (
              <ToolCard key={tool.id} tool={tool} delay={idx * 0.1} />
            ))}
          </div>
        </div>
      </section>

      {/* Government Portals Section */}
      <section className="py-20 relative border-t border-white/5">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="mb-12 max-w-2xl">
            <div className="flex items-center gap-2 text-emerald-400 font-semibold mb-2">
              <Icons.ShieldCheck size={20} />
              Government Portal Mode
            </div>
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">1-Click Official Formats</h2>
            <p className="text-slate-400 text-lg">
              Struggling with "File size must be under 50KB"? We've pre-configured the exact requirements for PAN, Aadhaar, UPSC, and Passport applications.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {govTools.map((tool, idx) => (
              <ToolCard key={tool.id} tool={tool} delay={idx * 0.1} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
