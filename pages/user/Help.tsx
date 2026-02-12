
import React from 'react';
import { LifeBuoy, Search, Book, Video, MessageCircle, ArrowRight } from 'lucide-react';

export const HelpCenter: React.FC = () => {
  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="text-center space-y-4">
        <h2 className="text-4xl font-extrabold text-slate-900">How can we help?</h2>
        <p className="text-slate-500 text-lg">Search our knowledge base or browse categories below.</p>
        <div className="relative max-w-2xl mx-auto mt-8">
           <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={24} />
           <input type="text" placeholder="Search for answers..." className="w-full pl-14 pr-6 py-5 bg-white border border-slate-200 rounded-3xl shadow-xl shadow-slate-200/50 outline-none focus:ring-2 focus:ring-indigo-500 text-lg" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl transition-all cursor-pointer group">
           <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Book size={28} />
           </div>
           <h3 className="text-xl font-bold text-slate-900">Documentation</h3>
           <p className="text-slate-500 mt-2 text-sm leading-relaxed">Comprehensive guides on how to setup your shop, inventory and repair flows.</p>
           <button className="mt-6 flex items-center gap-2 text-indigo-600 font-bold text-sm">Read Guides <ArrowRight size={16} /></button>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl transition-all cursor-pointer group">
           <div className="w-14 h-14 bg-violet-50 text-violet-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Video size={28} />
           </div>
           <h3 className="text-xl font-bold text-slate-900">Video Tutorials</h3>
           <p className="text-slate-500 mt-2 text-sm leading-relaxed">Watch quick walkthroughs of the key features to get your team up to speed.</p>
           <button className="mt-6 flex items-center gap-2 text-indigo-600 font-bold text-sm">Watch Now <ArrowRight size={16} /></button>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl transition-all cursor-pointer group">
           <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <MessageCircle size={28} />
           </div>
           <h3 className="text-xl font-bold text-slate-900">Direct Support</h3>
           <p className="text-slate-500 mt-2 text-sm leading-relaxed">Can't find what you're looking for? Chat with our specialist team 24/7.</p>
           <button className="mt-6 flex items-center gap-2 text-indigo-600 font-bold text-sm">Start Chat <ArrowRight size={16} /></button>
        </div>
      </div>

      <div className="bg-indigo-600 rounded-3xl p-10 text-white flex flex-col md:flex-row items-center justify-between gap-8 mt-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-10 opacity-10">
          <LifeBuoy size={200} />
        </div>
        <div className="relative z-10">
           <h3 className="text-2xl font-bold">Still stuck? We're here.</h3>
           <p className="text-indigo-100 mt-2">Open a support ticket and we'll get back to you within 4 hours.</p>
        </div>
        <button className="relative z-10 bg-white text-indigo-600 font-bold px-8 py-4 rounded-2xl shadow-xl hover:scale-105 transition-transform">
          Open Ticket
        </button>
      </div>
    </div>
  );
};
