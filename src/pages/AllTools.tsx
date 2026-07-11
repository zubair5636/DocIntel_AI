import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { tools, categories } from "../data/tools";
import { ToolCard } from "../components/ToolCard";
import * as Icons from "lucide-react";

export function AllTools() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>(searchParams.get("category") || "all");

  useEffect(() => {
    const category = searchParams.get("category");
    if (category) {
      setActiveCategory(category);
    } else {
      setActiveCategory("all");
    }
  }, [searchParams]);

  const handleCategoryChange = (category: string) => {
    setActiveCategory(category);
    if (category === "all") {
      searchParams.delete("category");
    } else {
      searchParams.set("category", category);
    }
    setSearchParams(searchParams);
  };

  const filteredTools = tools.filter(tool => {
    const matchesSearch = tool.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          tool.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === "all" || tool.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="flex-1 w-full py-12">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="mb-12 text-center max-w-2xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 text-slate-100">All Tools</h1>
          <p className="text-lg text-slate-400 mb-8">
            Explore our complete collection of document and image utilities.
          </p>
          
          <div className="relative max-w-xl mx-auto">
            <Icons.Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="Search tools (e.g. 'merge pdf', 'compress image')..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900/50 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 mb-12">
          <button
            onClick={() => handleCategoryChange("all")}
            className={`px-6 py-2.5 rounded-full font-medium transition-all ${
              activeCategory === "all" 
                ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20" 
                : "bg-slate-800/50 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
            }`}
          >
            All Tools
          </button>
          {categories.map(category => (
            <button
              key={category.id}
              onClick={() => handleCategoryChange(category.id)}
              className={`px-6 py-2.5 rounded-full font-medium transition-all ${
                activeCategory === category.id 
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20" 
                  : "bg-slate-800/50 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>

        {filteredTools.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredTools.map((tool, idx) => (
              <ToolCard key={tool.id} tool={tool} delay={(idx % 4) * 0.1} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-800/50 text-slate-400 mb-4">
              <Icons.SearchX size={32} />
            </div>
            <h3 className="text-xl font-medium text-slate-300 mb-2">No tools found</h3>
            <p className="text-slate-500">We couldn't find any tools matching your search criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
}
