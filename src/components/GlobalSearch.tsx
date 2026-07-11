import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import { tools } from "../data/tools";
import * as Icons from "lucide-react";

export function GlobalSearch() {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const filteredTools = tools.filter(tool => 
    tool.name.toLowerCase().includes(query.toLowerCase()) || 
    tool.description.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 5); // Limit results

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="flex-1 max-w-md mx-8 relative hidden md:block" ref={wrapperRef}>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
           <Search size={16} className="text-slate-400" />
        </div>
        <input
          ref={inputRef}
          type="text"
          placeholder="Search tools... (⌘K)"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          className="w-full bg-white/5 border border-white/10 rounded-full py-1.5 pl-10 pr-12 text-sm focus:outline-none focus:border-blue-500/50 transition-all text-slate-200 placeholder-slate-400"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] bg-white/10 px-1.5 py-0.5 rounded text-slate-400 pointer-events-none">
          ⌘K
        </div>
      </div>

      {isOpen && query && (
        <div className="absolute top-full mt-2 w-full bg-slate-900 border border-white/10 rounded-2xl shadow-2xl shadow-black/50 overflow-hidden z-50">
          {filteredTools.length > 0 ? (
            <ul className="py-2">
              {filteredTools.map((tool) => {
                const Icon = (Icons as any)[tool.iconName] || Icons.File;
                return (
                  <li key={tool.id}>
                    <button
                      onClick={() => {
                        navigate(tool.href);
                        setIsOpen(false);
                        setQuery("");
                      }}
                      className="w-full text-left px-4 py-3 hover:bg-white/5 transition-colors flex items-center gap-3 group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                        <Icon size={16} />
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-slate-200 truncate">{tool.name}</div>
                        <div className="text-xs text-slate-500 truncate">{tool.description}</div>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="px-4 py-8 text-center text-slate-500 text-sm">
              No tools found matching "{query}"
            </div>
          )}
        </div>
      )}
    </div>
  );
}
