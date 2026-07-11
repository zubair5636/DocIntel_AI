import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Layers } from "lucide-react";
import { GlobalSearch } from "../GlobalSearch";

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col relative bg-[#020617] text-slate-100 font-sans overflow-x-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 blur-[120px] rounded-full pointer-events-none z-0"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/20 blur-[120px] rounded-full pointer-events-none z-0"></div>

      <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-slate-950/50 backdrop-blur-md">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-emerald-400 flex items-center justify-center text-white font-bold shadow-lg shadow-blue-500/20">
              <span className="text-xs">DI</span>
            </div>
            <span className="font-semibold text-lg tracking-tight">DocIntel <span className="text-blue-400">AI</span></span>
          </Link>

          <GlobalSearch />

          <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-slate-400">
            <Link to="/tools" className="hover:text-white transition-colors">Tools</Link>
            <Link to="/tools?category=government" className="hover:text-white transition-colors text-blue-400">Gov Portal Mode</Link>
          </nav>
          <div className="flex items-center gap-4">
            <Link to="/tools" className="bg-white text-slate-950 px-4 py-1.5 rounded-full hover:bg-slate-200 transition-all shadow-xl shadow-white/5 text-sm font-medium">
              Get Started
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col relative z-10">
        {children}
      </main>

      <footer className="border-t border-white/5 bg-[#020617] mt-auto py-12 relative z-10">
        <div className="container mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
               <div className="w-6 h-6 rounded bg-gradient-to-br from-blue-500 to-emerald-400 flex items-center justify-center text-white font-bold shadow-lg shadow-blue-500/20">
                  <span className="text-[10px]">DI</span>
               </div>
              <span className="font-semibold text-base tracking-tight">DocIntel <span className="text-blue-400">AI</span></span>
            </div>
            <p className="text-sm text-slate-500">
              The world's most advanced, free document and image processing platform. 
              Privacy-first, lightning-fast.
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-4 text-slate-300">Tools</h3>
            <ul className="space-y-2 text-sm text-slate-500">
              <li><Link to="/tool/compress-pdf" className="hover:text-white transition-colors">Compress PDF</Link></li>
              <li><Link to="/tool/merge-pdf" className="hover:text-white transition-colors">Merge PDF</Link></li>
              <li><Link to="/tool/resize-image" className="hover:text-white transition-colors">Resize Image</Link></li>
              <li><Link to="/tool/remove-background" className="hover:text-white transition-colors">Remove Background</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-4 text-slate-300">Solutions</h3>
            <ul className="space-y-2 text-sm text-slate-500">
              <li><Link to="/tools?category=government" className="hover:text-white transition-colors">Government Portals</Link></li>
              <li><Link to="/tools/job-applications" className="hover:text-white transition-colors">Job Applications</Link></li>
              <li><Link to="/tools/education" className="hover:text-white transition-colors">Education Portals</Link></li>
              <li><Link to="/tools/visa" className="hover:text-white transition-colors">Visa Forms</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-4 text-slate-300">Legal</h3>
            <ul className="space-y-2 text-sm text-slate-500">
              <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Contact Us</a></li>
            </ul>
          </div>
        </div>
      </footer>
    </div>
  );
}
