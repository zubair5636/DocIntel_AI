import React from "react";
import { Link } from "react-router-dom";
import * as Icons from "lucide-react";
import { motion } from "motion/react";

export const ToolCard: React.FC<{ tool: any, delay?: number }> = ({ tool, delay = 0 }) => {
  const Icon = (Icons as any)[tool.iconName] || Icons.File;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay }}
    >
      <Link 
        to={tool.href}
        className="block h-full group bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all duration-300"
      >
        <div className="flex items-start justify-between mb-4">
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center group-hover:bg-blue-500 group-hover:text-white transition-colors border border-blue-500/20">
            <Icon size={24} />
          </div>
          {tool.isNew && (
            <span className="px-2 py-1 text-[10px] uppercase font-bold tracking-widest bg-emerald-500/10 text-emerald-400 rounded-lg">New</span>
          )}
        </div>
        <h3 className="text-lg font-semibold mb-2 group-hover:text-blue-400 transition-colors">{tool.name}</h3>
        <p className="text-sm text-slate-400 line-clamp-2">{tool.description}</p>
      </Link>
    </motion.div>
  );
}
