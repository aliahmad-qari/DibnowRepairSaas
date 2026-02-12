import React, { useState, useEffect } from 'react';
import { Layers, Plus, Edit2, Trash2, CheckCircle2, Zap, Rocket, Building, ShieldCheck, XCircle, X, Save, DollarSign, ListPlus, Star, ShieldAlert, Globe, Tag } from 'lucide-react';
import { db } from '../../api/db';
import { SubscriptionPlan } from '../../types';

export const Plans: React.FC = () => {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState<any | null>(null);
  
  const initialPlanState = {
    name: '',
    price: '',
    baseCurrency: 'GBP',
    duration: 'monthly' as 'monthly' | 'yearly',
    features: [''],
    limits: {
      repairsPerMonth: 0,
      teamMembers: 0,
      inventoryItems: 0,
      categories: 0,
      brands: 0,
      aiDiagnostics: false
    }
  };

  const [newPlan, setNewPlan] = useState(initialPlanState);

  useEffect(() => {
    const loadPlans = () => setPlans(db.plans.getAll());
    loadPlans();
    window.addEventListener('storage', loadPlans);
    return () => window.removeEventListener('storage', loadPlans);
  }, []);

  const handleAddFeature = (isEdit = false) => {
    if (isEdit) {
      setEditingPlan({ ...editingPlan, features: [...editingPlan.features, ''] });
    } else {
      setNewPlan({ ...newPlan, features: [...newPlan.features, ''] });
    }
  };

  const handleFeatureChange = (index: number, value: string, isEdit = false) => {
    if (isEdit) {
      const updated = [...editingPlan.features];
      updated[index] = value;
      setEditingPlan({ ...editingPlan, features: updated });
    } else {
      const updated = [...newPlan.features];
      updated[index] = value;
      setNewPlan({ ...newPlan, features: updated });
    }
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    db.plans.add({
      name: newPlan.name,
      price: parseFloat(newPlan.price),
      baseCurrency: newPlan.baseCurrency,
      duration: newPlan.duration,
      features: newPlan.features.filter(f => f.trim() !== ''),
      limits: newPlan.limits
    });
    setPlans(db.plans.getAll());
    setShowCreateModal(false);
    setNewPlan(initialPlanState);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlan) return;
    db.plans.update(editingPlan.id, {
      ...editingPlan,
      price: parseFloat(editingPlan.price.toString()),
      features: editingPlan.features.filter((f: string) => f.trim() !== '')
    });
    setEditingPlan(null);
    setPlans(db.plans.getAll());
  };

  const handleDeletePlan = (id: string) => {
    if (window.confirm("CRITICAL: Permanent decommissioning of this subscription tier node? This will affect all shops currently assigned to this plan.")) {
      db.plans.remove(id);
      setPlans(db.plans.getAll());
    }
  };

  const openEditModal = (plan: SubscriptionPlan) => {
    setEditingPlan({ ...plan });
  };

  return (
    <div className="space-y-8 pb-20 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">System Tier Architect</h2>
          <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mt-1">Configure global monetization and platform access policies.</p>
        </div>
        <button 
          onClick={() => setShowCreateModal(true)}
          className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black flex items-center justify-center gap-2 shadow-xl shadow-indigo-100 hover:scale-105 transition-all text-[10px] uppercase tracking-widest w-full md:w-auto"
        >
          <Plus size={18} /> Deploy New Operational Tier
        </button>
      </div>

      {/* PLAN ARCHITECT MODALS (Create/Edit) */}
      {(showCreateModal || editingPlan) && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 my-auto flex flex-col max-h-[90vh]">
            <div className={`${editingPlan ? 'bg-blue-600' : 'bg-indigo-600'} p-6 text-white flex items-center justify-between shrink-0`}>
               <div className="flex items-center gap-3">
                 <Rocket size={20} />
                 <h3 className="text-lg font-black uppercase tracking-widest">{editingPlan ? 'Edit Operational Tier' : 'Architect New Tier'}</h3>
               </div>
               <button onClick={() => { setShowCreateModal(false); setEditingPlan(null); }} className="p-2 hover:bg-white/20 rounded-full transition-colors"><X size={20}/></button>
            </div>
            
            <div className="overflow-y-auto p-8 custom-scrollbar">
              <form onSubmit={editingPlan ? handleEditSubmit : handleCreateSubmit} className="space-y-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Plan Title</label>
                    <input 
                      required 
                      type="text" 
                      className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 text-sm font-bold" 
                      placeholder="e.g. ULTIMATE" 
                      value={editingPlan ? editingPlan.name : newPlan.name} 
                      onChange={e => editingPlan ? setEditingPlan({...editingPlan, name: e.target.value}) : setNewPlan({...newPlan, name: e.target.value})} 
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Price</label>
                      <input 
                        required 
                        type="number" 
                        step="0.01" 
                        className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none text-sm font-bold" 
                        placeholder="0.00" 
                        value={editingPlan ? editingPlan.price : newPlan.price} 
                        onChange={e => editingPlan ? setEditingPlan({...editingPlan, price: e.target.value}) : setNewPlan({...newPlan, price: e.target.value})} 
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Base Currency</label>
                      <select 
                        className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-black" 
                        value={editingPlan ? editingPlan.baseCurrency : newPlan.baseCurrency} 
                        onChange={e => editingPlan ? setEditingPlan({...editingPlan, baseCurrency: e.target.value}) : setNewPlan({...newPlan, baseCurrency: e.target.value})}
                      >
                        <option value="GBP">GBP (£)</option>
                        <option value="USD">USD ($)</option>
                        <option value="EUR">EUR (€)</option>
                        <option value="PKR">PKR (Rs)</option>
                        <option value="INR">INR (₹)</option>
                        <option value="AED">AED (DH)</option>
                        <option value="AUD">AUD (A$)</option>
                        <option value="CAD">CAD (C$)</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <h4 className="text-[10px] font-black uppercase text-indigo-600 tracking-[0.2em] flex items-center gap-2">
                     <div className="w-1.5 h-1.5 rounded-full bg-indigo-600" /> Operational Capacity Constraints
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="space-y-1">
                       <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Repair Customers</label>
                       <input 
                         type="number" 
                         className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold" 
                         value={editingPlan ? editingPlan.limits.repairsPerMonth : newPlan.limits.repairsPerMonth} 
                         onChange={e => editingPlan ? setEditingPlan({...editingPlan, limits: {...editingPlan.limits, repairsPerMonth: parseInt(e.target.value)}}) : setNewPlan({...newPlan, limits: {...newPlan.limits, repairsPerMonth: parseInt(e.target.value)}})} 
                       />
                    </div>
                    <div className="space-y-1">
                       <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Stock Items</label>
                       <input 
                         type="number" 
                         className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold" 
                         value={editingPlan ? editingPlan.limits.inventoryItems : newPlan.limits.inventoryItems} 
                         onChange={e => editingPlan ? setEditingPlan({...editingPlan, limits: {...editingPlan.limits, inventoryItems: parseInt(e.target.value)}}) : setNewPlan({...newPlan, limits: {...newPlan.limits, inventoryItems: parseInt(e.target.value)}})} 
                       />
                    </div>
                    <div className="space-y-1">
                       <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Team Members</label>
                       <input 
                         type="number" 
                         className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold" 
                         value={editingPlan ? editingPlan.limits.teamMembers : newPlan.limits.teamMembers} 
                         onChange={e => editingPlan ? setEditingPlan({...editingPlan, limits: {...editingPlan.limits, teamMembers: parseInt(e.target.value)}}) : setNewPlan({...newPlan, limits: {...newPlan.limits, teamMembers: parseInt(e.target.value)}})} 
                       />
                    </div>
                    <div className="space-y-1">
                       <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Categories</label>
                       <input 
                         type="number" 
                         className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold" 
                         value={editingPlan ? editingPlan.limits.categories : newPlan.limits.categories} 
                         onChange={e => editingPlan ? setEditingPlan({...editingPlan, limits: {...editingPlan.limits, categories: parseInt(e.target.value)}}) : setNewPlan({...newPlan, limits: {...newPlan.limits, categories: parseInt(e.target.value)}})} 
                       />
                    </div>
                    <div className="space-y-1">
                       <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Brands</label>
                       <input 
                         type="number" 
                         className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold" 
                         value={editingPlan ? editingPlan.limits.brands : newPlan.limits.brands} 
                         onChange={e => editingPlan ? setEditingPlan({...editingPlan, limits: {...editingPlan.limits, brands: parseInt(e.target.value)}}) : setNewPlan({...newPlan, limits: {...newPlan.limits, brands: parseInt(e.target.value)}})} 
                       />
                    </div>
                  </div>
                  <div className="flex items-center gap-4 p-6 bg-indigo-50 rounded-[2rem] border border-indigo-100">
                     <input 
                        type="checkbox" 
                        id="ai-admin" 
                        checked={editingPlan ? editingPlan.limits.aiDiagnostics : newPlan.limits.aiDiagnostics} 
                        onChange={e => editingPlan ? setEditingPlan({...editingPlan, limits: {...editingPlan.limits, aiDiagnostics: e.target.checked}}) : setNewPlan({...newPlan, limits: {...newPlan.limits, aiDiagnostics: e.target.checked}})} 
                        className="w-6 h-6 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer" 
                     />
                     <div className="flex flex-col">
                       <label htmlFor="ai-admin" className="text-xs font-black uppercase text-indigo-900 cursor-pointer tracking-wider">AI Diagnostics Authorized</label>
                       <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-tight">Enable automated checklist generation for users.</span>
                     </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <h4 className="text-[10px] font-black uppercase text-indigo-600 tracking-[0.2em] flex items-center justify-between">
                     <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-600" /> Platform Features Catalog
                     </div>
                     <button type="button" onClick={() => handleAddFeature(!!editingPlan)} className="text-indigo-600 flex items-center gap-1 hover:underline text-[9px] font-black uppercase">
                        <ListPlus size={14} /> Add Line Item
                     </button>
                  </h4>
                  <div className="space-y-3">
                    {(editingPlan ? editingPlan.features : newPlan.features).map((feature: string, idx: number) => (
                      <div key={idx} className="flex gap-2 animate-in slide-in-from-left-2">
                        <input 
                          type="text" 
                          className="flex-1 p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-indigo-500" 
                          placeholder={`Bullet Point ${idx + 1}`} 
                          value={feature} 
                          onChange={e => handleFeatureChange(idx, e.target.value, !!editingPlan)} 
                        />
                        <button 
                          type="button" 
                          onClick={() => {
                            if (editingPlan) {
                              setEditingPlan({...editingPlan, features: editingPlan.features.filter((_:any, i:number) => i !== idx)});
                            } else {
                              setNewPlan({...newPlan, features: newPlan.features.filter((_, i) => i !== idx)});
                            }
                          }} 
                          className="p-3 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors"
                        >
                          <X size={18}/>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <button type="submit" className={`w-full ${editingPlan ? 'bg-blue-600 hover:bg-blue-700' : 'bg-indigo-600 hover:bg-indigo-700'} text-white font-black py-5 rounded-[2rem] shadow-xl transition-all uppercase tracking-[0.2em] text-[10px] flex items-center justify-center gap-3`}>
                  <Save size={18} /> {editingPlan ? 'Update Operational Tier' : 'Publish Operational Tier'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Plans List Visualization (GRID FORMAT AS REQUESTED) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {plans.map((plan: any) => (
          <div key={plan.id} className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col group hover:shadow-2xl transition-all duration-500 relative">
            <div className="p-10 border-b border-slate-50 bg-white group-hover:bg-slate-50/30 transition-colors">
              <h3 className="text-xl font-black text-slate-800 tracking-tight uppercase leading-none">{plan.name}</h3>
              <p className="text-[11px] font-bold text-slate-400 mt-2 uppercase tracking-widest">{plan.baseCurrency || 'GBP'} {plan.price} / cycle</p>
            </div>
            
            <div className="p-10 flex-1 grid grid-cols-2 gap-y-8 gap-x-6 bg-white">
               <div>
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest leading-none mb-1">Repairs</p>
                  <p className="text-2xl font-black text-slate-800 tracking-tighter">
                    {plan.limits.repairsPerMonth >= 999 ? '∞' : plan.limits.repairsPerMonth}
                  </p>
               </div>
               <div>
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest leading-none mb-1">Stock</p>
                  <p className="text-2xl font-black text-slate-800 tracking-tighter">
                    {plan.limits.inventoryItems >= 999 ? '∞' : plan.limits.inventoryItems}
                  </p>
               </div>
               <div>
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest leading-none mb-1">Cats</p>
                  <p className="text-2xl font-black text-slate-800 tracking-tighter">
                    {plan.limits.categories >= 999 ? '∞' : plan.limits.categories}
                  </p>
               </div>
               <div>
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest leading-none mb-1">Brands</p>
                  <p className="text-2xl font-black text-slate-800 tracking-tighter">
                    {plan.limits.brands >= 999 ? '∞' : plan.limits.brands}
                  </p>
               </div>
               <div className="col-span-2 pt-4 border-t border-slate-50">
                  <p className="text-[10px] font-black uppercase text-indigo-600 tracking-widest mb-3">Key Protocol Features</p>
                  <div className="space-y-2">
                    {plan.features.slice(0, 3).map((f: string, i: number) => (
                        <div key={i} className="flex items-center gap-2 text-[10px] font-bold text-slate-500 truncate">
                          <CheckCircle2 size={12} className="text-emerald-500 shrink-0" /> {f}
                        </div>
                    ))}
                    {plan.features.length > 3 && <p className="text-[8px] font-bold text-slate-300 uppercase">+ {plan.features.length - 3} more nodes</p>}
                  </div>
               </div>
            </div>

            {/* ACTION FOOTER */}
            <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3">
               <button 
                  onClick={() => openEditModal(plan)}
                  className="flex-1 py-3 bg-white border border-slate-200 text-slate-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all flex items-center justify-center gap-2 shadow-sm"
               >
                 <Edit2 size={14} /> Edit
               </button>
               <button 
                  onClick={() => handleDeletePlan(plan.id)}
                  className="flex-1 py-3 bg-white border border-slate-200 text-slate-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-600 hover:text-white hover:border-rose-600 transition-all flex items-center justify-center gap-2 shadow-sm"
               >
                 <Trash2 size={14} /> Delete
               </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};