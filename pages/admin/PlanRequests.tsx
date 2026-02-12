
import React, { useState, useEffect } from 'react';
import { 
  ClipboardList, CheckCircle2, XCircle, Search, Clock, ArrowUpRight, 
  Hash, Building, Landmark, Trash2, ShieldCheck, X, FileText, 
  Zap, DollarSign, Loader2, Check 
} from 'lucide-react';
import { db } from '../../api/db';

export const PlanRequests: React.FC = () => {
  const [requests, setRequests] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Approval Form State
  const [approvalRequest, setApprovalRequest] = useState<any | null>(null);
  const [approvalMeta, setApprovalMeta] = useState({
    planStatus: 'active',
    invoiceStatus: 'paid'
  });
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const loadRequests = () => {
      setRequests(db.planRequests.getAll());
    };
    loadRequests();
    window.addEventListener('storage', loadRequests);
    return () => window.removeEventListener('storage', loadRequests);
  }, []);

  const openApprovalModal = (req: any) => {
    setApprovalRequest(req);
    setApprovalMeta({
      planStatus: 'active',
      invoiceStatus: 'paid'
    });
  };

  const handleDeny = (id: string) => {
    if (window.confirm("Are you sure you want to deny this request?")) {
      db.planRequests.updateStatus(id, 'denied');
    }
  };

  const handleFinalApproval = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!approvalRequest) return;

    setIsProcessing(true);
    // Simulation
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    db.planRequests.updateStatus(approvalRequest.id, 'approved', approvalMeta);
    
    setIsProcessing(false);
    setApprovalRequest(null);
  };

  const filteredRequests = requests.filter(req => 
    req.shopName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    req.transactionId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    req.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">Manual Plan Audits</h2>
          <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mt-1">Review and authorize tier promotes from manual bank nodes.</p>
        </div>
        <div className="flex items-center gap-3">
           <div className="bg-amber-50 text-amber-700 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-amber-100 flex items-center gap-2">
             <Clock size={16} /> {requests.filter(r => r.status === 'pending').length} Awaiting Verification
           </div>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-50 bg-slate-50/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
           <div className="relative flex-1 max-w-md">
             <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
             <input 
               type="text" 
               placeholder="Filter by Shop or Transaction ID..." 
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
               className="w-full pl-14 pr-6 py-4 bg-white border-2 border-slate-100 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/5 outline-none transition-all shadow-sm"
             />
           </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/50 text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] border-b border-slate-100">
              <tr>
                <th className="px-10 py-6">Audit Request</th>
                <th className="px-10 py-6">Target Plan</th>
                <th className="px-10 py-6 text-center">Transaction ID</th>
                <th className="px-10 py-6 text-right">Value</th>
                <th className="px-10 py-6 text-center">Protocol Status</th>
                <th className="px-10 py-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredRequests.map(req => (
                <tr key={req.id} className="hover:bg-indigo-50/30 transition-all group">
                  <td className="px-10 py-7">
                    <div className="flex items-center gap-4">
                       <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-100">
                          <Building className="text-slate-400" size={24} />
                       </div>
                       <div>
                          <p className="font-black text-slate-800 text-sm tracking-tight">{req.shopName}</p>
                          <p className="text-[10px] text-slate-400 font-black uppercase mt-1 tracking-widest flex items-center gap-1">
                             <Clock size={10} /> {req.date}
                          </p>
                       </div>
                    </div>
                  </td>
                  <td className="px-10 py-7">
                    <div className="flex flex-col">
                       <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-slate-400 line-through uppercase">{req.currentPlanName}</span>
                          <ArrowUpRight size={14} className="text-indigo-500" />
                          <span className="text-sm font-black text-indigo-600 uppercase">{req.requestedPlanName}</span>
                       </div>
                    </div>
                  </td>
                  <td className="px-10 py-7 text-center">
                    <span className="font-mono text-xs font-black text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
                       #{req.transactionId}
                    </span>
                  </td>
                  <td className="px-10 py-7 text-right">
                    <p className="font-black text-slate-900 text-base tracking-tighter">
                       {req.amount > 0 ? `${req.currency || '$'}${req.amount.toFixed(2)}` : 'FREE'}
                    </p>
                  </td>
                  <td className="px-10 py-7 text-center">
                    <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase inline-flex items-center gap-2 border ${
                      req.status === 'pending' ? 'bg-amber-50 text-amber-700 border-amber-100' : 
                      req.status === 'approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-rose-50 text-rose-700 border-rose-100'
                    }`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${
                        req.status === 'pending' ? 'bg-amber-500' : req.status === 'approved' ? 'bg-emerald-500' : 'bg-rose-500'
                      }`} />
                      {req.status}
                    </span>
                  </td>
                  <td className="px-10 py-7 text-right">
                    <div className="flex items-center justify-end gap-3">
                      {req.status === 'pending' ? (
                        <>
                          <button 
                            onClick={() => openApprovalModal(req)}
                            className="bg-emerald-50 text-emerald-600 p-2.5 rounded-xl hover:bg-emerald-100 shadow-sm transition-all border border-emerald-100"
                            title="Open Approval Form"
                          >
                            <CheckCircle2 size={18} />
                          </button>
                          <button 
                            onClick={() => handleDeny(req.id)}
                            className="bg-rose-50 text-rose-600 p-2.5 rounded-xl hover:bg-rose-100 shadow-sm transition-all border border-rose-100"
                            title="Deny Request"
                          >
                            <XCircle size={18} />
                          </button>
                        </>
                      ) : (
                        <div className="text-[9px] font-black text-slate-300 uppercase tracking-widest italic">
                           Audit Finalized
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredRequests.length === 0 && (
                <tr>
                   <td colSpan={6} className="py-32 text-center">
                      <div className="flex flex-col items-center justify-center gap-4 opacity-20">
                         <ClipboardList size={64} />
                         <p className="text-sm font-black uppercase tracking-widest">No Plan Audit Logs Identified</p>
                      </div>
                   </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* APPROVAL MODAL FORM - FULLY RESPONSIVE */}
      {approvalRequest && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 animate-in fade-in duration-300 backdrop-blur-xl bg-slate-950/60">
           <div className="bg-white w-full max-w-xl rounded-[2rem] sm:rounded-[2.5rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col border border-indigo-100 max-h-[95vh] sm:max-h-[90vh]">
              
              {/* Modal Header */}
              <div className="bg-indigo-600 p-6 sm:p-8 text-white flex items-center justify-between shrink-0">
                 <div className="flex items-center gap-3 sm:gap-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-md border border-white/20 shrink-0">
                       <ShieldCheck size={20} className="sm:w-6 sm:h-6" />
                    </div>
                    <div>
                       <h3 className="text-base sm:text-xl font-black uppercase tracking-widest leading-none">Audit Authorization</h3>
                       <p className="text-[8px] sm:text-[10px] font-bold text-indigo-100 mt-1 sm:mt-1.5 uppercase tracking-tighter">Manual Payment Verification Protocol</p>
                    </div>
                 </div>
                 <button onClick={() => setApprovalRequest(null)} className="p-2 hover:bg-white/20 rounded-full transition-all shrink-0">
                    <X size={20} className="sm:w-6 sm:h-6" />
                 </button>
              </div>

              {/* Modal Body - Scrollable */}
              <div className="overflow-y-auto flex-1 custom-scrollbar">
                <form onSubmit={handleFinalApproval} className="p-6 sm:p-10 space-y-6 sm:space-y-8">
                  {/* Context Summary */}
                  <div className="bg-slate-50 p-5 sm:p-6 rounded-[1.5rem] sm:rounded-3xl border border-slate-100 space-y-3 sm:space-y-4">
                      <div className="flex justify-between items-center gap-4">
                        <span className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest shrink-0">Requesting Shop</span>
                        <span className="text-xs sm:text-sm font-black text-slate-800 truncate">{approvalRequest.shopName}</span>
                      </div>
                      <div className="flex justify-between items-center gap-4">
                        <span className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest shrink-0">Target Upgrade</span>
                        <span className="text-xs sm:text-sm font-black text-indigo-600 uppercase truncate">{approvalRequest.requestedPlanName}</span>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center pt-3 sm:pt-4 border-t border-slate-200 gap-2 sm:gap-4">
                        <span className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest">Bank Reference (TX ID)</span>
                        <span className="font-mono text-[10px] sm:text-xs font-black text-slate-900 bg-white px-2 py-1 rounded border border-slate-200 break-all sm:break-normal">
                          #{approvalRequest.transactionId}
                        </span>
                      </div>
                  </div>

                  {/* Control Toggles */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                      <div className="space-y-1.5 sm:space-y-2">
                        <label className="text-[9px] sm:text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Plan Logic Status</label>
                        <div className="relative">
                            <Zap className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <select 
                              className="w-full pl-11 pr-4 py-3 sm:py-4 bg-slate-50 border-2 border-slate-100 rounded-xl sm:rounded-2xl outline-none focus:border-indigo-500 font-bold text-xs sm:text-sm appearance-none cursor-pointer transition-all"
                              value={approvalMeta.planStatus}
                              onChange={e => setApprovalMeta({...approvalMeta, planStatus: e.target.value})}
                            >
                              <option value="active">ACTIVE</option>
                              <option value="pending">PENDING</option>
                              <option value="suspended">SUSPENDED</option>
                            </select>
                        </div>
                      </div>
                      <div className="space-y-1.5 sm:space-y-2">
                        <label className="text-[9px] sm:text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Invoice Record</label>
                        <div className="relative">
                            <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <select 
                              className="w-full pl-11 pr-4 py-3 sm:py-4 bg-slate-50 border-2 border-slate-100 rounded-xl sm:rounded-2xl outline-none focus:border-indigo-500 font-bold text-xs sm:text-sm appearance-none cursor-pointer transition-all"
                              value={approvalMeta.invoiceStatus}
                              onChange={e => setApprovalMeta({...approvalMeta, invoiceStatus: e.target.value})}
                            >
                              <option value="paid">PAID</option>
                              <option value="unpaid">UNPAID / VOID</option>
                            </select>
                        </div>
                      </div>
                  </div>

                  <div className="bg-emerald-50 p-5 sm:p-6 rounded-2xl sm:rounded-3xl border border-emerald-100 flex items-start gap-3 sm:gap-4">
                      <Check size={18} className="text-emerald-600 mt-0.5 shrink-0" />
                      <div className="space-y-1">
                        <p className="text-[9px] sm:text-[10px] font-black text-emerald-800 uppercase tracking-widest leading-none">Protocol Authorization Summary</p>
                        <p className="text-[8px] sm:text-[9px] font-bold text-emerald-600/70 leading-relaxed uppercase mt-1">
                            Authorizing this request will set the plan to <span className="underline">{approvalMeta.planStatus}</span> and the financial invoice to <span className="underline">{approvalMeta.invoiceStatus}</span>. User dashboard will update immediately.
                        </p>
                      </div>
                  </div>

                  <button 
                    type="submit" 
                    disabled={isProcessing}
                    className="w-full bg-indigo-600 text-white font-black py-4 sm:py-6 rounded-xl sm:rounded-[2rem] shadow-2xl shadow-indigo-200 hover:bg-indigo-700 transition-all uppercase tracking-[0.2em] sm:tracking-[0.3em] text-[10px] sm:text-[11px] flex items-center justify-center gap-3 sm:gap-4 group active:scale-95 disabled:opacity-50"
                  >
                      {isProcessing ? (
                        <><Loader2 className="animate-spin" size={18} /> Transmitting Protocol...</>
                      ) : (
                        <><ShieldCheck size={18} /> Authorize and Activate Tier</>
                      )}
                  </button>
                </form>
              </div>
           </div>
        </div>
      )}

    </div>
  );
};
