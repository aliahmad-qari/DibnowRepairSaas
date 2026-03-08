
import React from 'react';
import { BarChart3, TrendingUp, Users, DollarSign, Download, Calendar } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

const data = [
  { name: 'Week 1', revenue: 45000, shops: 120 },
  { name: 'Week 2', revenue: 52000, shops: 155 },
  { name: 'Week 3', revenue: 48000, shops: 140 },
  { name: 'Week 4', revenue: 61000, shops: 190 },
];

export const AdminReports: React.FC = () => {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Platform Reports</h2>
          <p className="text-slate-500">Detailed analytics on revenue, growth, and user behavior.</p>
        </div>
        <div className="flex gap-3">
          <button className="bg-white border border-slate-200 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2">
            <Calendar size={18} /> Last 30 Days
          </button>
          <button className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-semibold flex items-center gap-2 shadow-lg shadow-indigo-100">
            <Download size={18} /> Export PDF
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
          <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
            <TrendingUp size={20} className="text-emerald-500" />
            Revenue Trends
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" hide />
                <YAxis hide />
                <Tooltip />
                <Area type="monotone" dataKey="revenue" stroke="#10b981" fill="#ecfdf5" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
          <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
            <Users size={20} className="text-indigo-500" />
            Shop Onboarding
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" hide />
                <YAxis hide />
                <Tooltip />
                <Area type="monotone" dataKey="shops" stroke="#6366f1" fill="#eef2ff" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8">
        <h3 className="font-bold text-lg mb-6">Key Metrics Table</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-500 text-xs font-bold uppercase">
              <tr>
                <th className="px-6 py-4">Metric</th>
                <th className="px-6 py-4">Current Period</th>
                <th className="px-6 py-4">Previous Period</th>
                <th className="px-6 py-4">Change</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              <tr>
                <td className="px-6 py-4 font-bold text-slate-700">Monthly Recurring Revenue (MRR)</td>
                <td className="px-6 py-4 font-bold">$142,500</td>
                <td className="px-6 py-4">$128,400</td>
                <td className="px-6 py-4 text-emerald-600 font-bold">+10.9%</td>
              </tr>
              <tr>
                <td className="px-6 py-4 font-bold text-slate-700">Average Revenue Per User (ARPU)</td>
                <td className="px-6 py-4 font-bold">$58.12</td>
                <td className="px-6 py-4">$55.20</td>
                <td className="px-6 py-4 text-emerald-600 font-bold">+5.3%</td>
              </tr>
              <tr>
                <td className="px-6 py-4 font-bold text-slate-700">Churn Rate</td>
                <td className="px-6 py-4 font-bold">1.2%</td>
                <td className="px-6 py-4">1.5%</td>
                <td className="px-6 py-4 text-emerald-600 font-bold">-20.0%</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
