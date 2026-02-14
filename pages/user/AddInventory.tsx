import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { db } from '../../api/db';
import { callBackendAPI } from '../../api/apiClient.ts';
import { useAuth } from '../../context/AuthContext';
import { useCurrency } from '../../context/CurrencyContext.tsx';
import {
  Package, Tag, Hash, DollarSign, Layers, Smartphone, ChevronLeft,
  Save, AlertOctagon, ArrowUpCircle, Palette, FileText, Image as ImageIcon,
  Info, ShoppingCart, Box, ClipboardList, Loader2
} from 'lucide-react';

export const AddInventory: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { currency } = useCurrency();
  const [isLimitReached, setIsLimitReached] = useState(false);
  const [activePlan, setActivePlan] = useState<any>(null);
  const [availableBrands, setAvailableBrands] = useState<any[]>([]);
  const [availableCategories, setAvailableCategories] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    name: '',
    model: '',
    brand: '',
    category: '',
    color: '',
    actualCost: '',
    price: '',
    sku: '', // Serial Number
    stock: '',
    description: '',
    image: null as string | null
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const loadPrerequisites = async () => {
      if (user) {
        try {
          const [dashResp, brandsResp, catsResp] = await Promise.all([
            callBackendAPI('/dashboard/overview', null, 'GET'),
            callBackendAPI('/brands', null, 'GET'),
            callBackendAPI('/categories', null, 'GET')
          ]);

          if (dashResp) {
            const plan = dashResp.plans.find((p: any) =>
              p.name.toLowerCase() === user.planId.toLowerCase() ||
              (user.planId === 'starter' && p.name === 'FREE TRIAL') ||
              (user.planId === 'basic' && p.name === 'BASIC') ||
              (user.planId === 'premium' && p.name === 'PREMIUM') ||
              (user.planId === 'gold' && p.name === 'GOLD')
            ) || dashResp.plans[0];

            setActivePlan(plan);
            if (plan && plan.limits && dashResp.stockCount >= plan.limits.inventoryItems) {
              setIsLimitReached(true);
            }
          }

          setAvailableBrands(brandsResp || []);
          setAvailableCategories(catsResp || []);
        } catch (error) {
          console.error('Failed to load prerequisites:', error);
        }
      }
    };

    loadPrerequisites();
  }, [user]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, image: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLimitReached || isSubmitting) return;
    setIsSubmitting(true);

    try {
      const payload = {
        name: formData.name,
        model: formData.model,
        brand: formData.brand,
        category: formData.category,
        color: formData.color,
        actualCost: parseFloat(formData.actualCost) || 0,
        price: parseFloat(formData.price) || 0,
        sku: formData.sku,
        stock: parseInt(formData.stock) || 0,
        description: formData.description,
        image: formData.image
      };

      const response = await callBackendAPI('/inventory', payload, 'POST');
      if (response) {
        navigate('/user/inventory');
      }
    } catch (error: any) {
      if (error.limitHit) {
        Swal.fire({
          title: 'Requirement Unmet',
          text: error.upgradeMessage || 'You have reached the limit for your current plan.',
          icon: 'warning',
          showCancelButton: true,
          confirmButtonText: 'Upgrade Tier',
          cancelButtonText: 'Review Warehouse',
          confirmButtonColor: '#0052FF',
          cancelButtonColor: '#94a3b8',
          background: '#ffffff',
          customClass: {
            popup: 'rounded-[1.5rem] border-2 border-blue-50 shadow-2xl',
            title: 'text-xl font-black uppercase text-slate-800 tracking-tightest',
            htmlContainer: 'text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-relaxed',
            confirmButton: 'px-8 py-3 rounded-xl font-black uppercase tracking-widest text-[9px] shadow-lg shadow-blue-100',
            cancelButton: 'px-8 py-3 rounded-xl font-black uppercase tracking-widest text-[9px]'
          }
        }).then((result) => {
          if (result.isConfirmed) {
            navigate('/user/pricing');
          } else {
            navigate('/user/inventory');
          }
        });
      } else {
        console.error('Enrollment failed:', error);
        alert(error.message || 'Failed to enroll new stock item.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLimitReached) {
    return (
      <div className="max-w-2xl mx-auto py-20 text-center space-y-6">
        <div className="w-20 h-20 bg-rose-50 text-rose-600 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-rose-100">
          <AlertOctagon size={40} />
        </div>
        <h2 className="text-3xl font-black text-slate-800 tracking-tight">Inventory Limit Reached</h2>
        <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">Platform Restriction Policy</p>
        <p className="text-slate-600 font-medium">Your current plan ({activePlan?.name}) allows for a maximum of <b>{activePlan?.limits.inventoryItems}</b> unique stock items.</p>
        <div className="pt-8 flex flex-col sm:flex-row gap-4 justify-center">
          <button onClick={() => navigate('/user/pricing')} className="bg-[#0052FF] text-white px-8 py-4 rounded-2xl font-black shadow-xl shadow-blue-100 flex items-center justify-center gap-2 hover:scale-105 transition-all uppercase tracking-widest text-[10px]">
            <ArrowUpCircle size={18} /> Expand Inventory Limit
          </button>
          <button onClick={() => navigate(-1)} className="bg-slate-100 text-slate-600 px-8 py-4 rounded-2xl font-black hover:bg-slate-200 transition-all uppercase tracking-widest text-[10px]">
            Return to List
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-3 bg-white hover:bg-slate-50 rounded-2xl border border-slate-100 text-slate-400 transition-all shadow-sm">
          <ChevronLeft />
        </button>
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">Catalog Enrollment</h2>
          <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mt-1">Register new components or gadgets to your central stock ledger.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-6 md:p-12 rounded-[3rem] border border-slate-100 shadow-2xl space-y-12">

        {/* Section: Basic Identification */}
        <div className="space-y-8">
          <h4 className="text-[10px] font-black uppercase text-[#0052FF] tracking-[0.2em] flex items-center gap-2 border-b border-slate-50 pb-4">
            <div className="w-1.5 h-1.5 rounded-full bg-[#0052FF]" /> Core Hardware Identification
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-1.5">
              <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Item Name *</label>
              <div className="relative">
                <Package className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                <input required type="text" className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 font-bold text-sm transition-all" placeholder="Enter product name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Model *</label>
              <div className="relative">
                <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                <input required type="text" className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 font-bold text-sm transition-all" placeholder="Enter model number" value={formData.model} onChange={(e) => setFormData({ ...formData, model: e.target.value })} />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Brand *</label>
              <div className="relative">
                <Tag className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                <select required className="w-full pl-12 pr-10 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 font-bold text-sm appearance-none cursor-pointer" value={formData.brand} onChange={(e) => setFormData({ ...formData, brand: e.target.value })}>
                  <option value="">Select Brand</option>
                  {availableBrands.map(b => <option key={b._id || b.id} value={b.name}>{b.name}</option>)}
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Category *</label>
              <div className="relative">
                <Layers className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                <select required className="w-full pl-12 pr-10 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 font-bold text-sm appearance-none cursor-pointer" value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })}>
                  <option value="">Select Category</option>
                  {availableCategories.map(c => <option key={c._id || c.id} value={c.name}>{c.name}</option>)}
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Color Variant</label>
              <div className="relative">
                <Palette className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                <input type="text" className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 font-bold text-sm transition-all" placeholder="Enter color" value={formData.color} onChange={(e) => setFormData({ ...formData, color: e.target.value })} />
              </div>
            </div>
          </div>
        </div>

        {/* Section: Financial & Inventory Protocol */}
        <div className="space-y-8">
          <h4 className="text-[10px] font-black uppercase text-[#0052FF] tracking-[0.2em] flex items-center gap-2 border-b border-slate-50 pb-4">
            <div className="w-1.5 h-1.5 rounded-full bg-[#0052FF]" /> Financial & Stock Logistics
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Actual Cost ({currency.symbol}) *</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-black text-slate-300 group-focus-within:text-blue-500">{currency.symbol}</div>
                <input required type="number" step="0.01" className="w-full pl-11 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 font-bold text-sm transition-all" placeholder="0.00" value={formData.actualCost} onChange={(e) => setFormData({ ...formData, actualCost: e.target.value })} />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Customer Sale Price ({currency.symbol}) *</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-black text-slate-300 group-focus-within:text-blue-500">{currency.symbol}</div>
                <input required type="number" step="0.01" className="w-full pl-11 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 font-bold text-sm transition-all" placeholder="0.00" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">IMEI/Serial Number</label>
              <div className="relative">
                <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                <input type="text" className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 font-bold text-sm transition-all" placeholder="Enter identification" value={formData.sku} onChange={(e) => setFormData({ ...formData, sku: e.target.value })} />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Quantity *</label>
              <div className="relative">
                <Box className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                <input required type="number" className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 font-bold text-sm transition-all" placeholder="Units count" value={formData.stock} onChange={(e) => setFormData({ ...formData, stock: e.target.value })} />
              </div>
            </div>
          </div>
        </div>

        {/* Section: Extended Content */}
        <div className="space-y-8">
          <h4 className="text-[10px] font-black uppercase text-[#0052FF] tracking-[0.2em] flex items-center gap-2 border-b border-slate-50 pb-4">
            <div className="w-1.5 h-1.5 rounded-full bg-[#0052FF]" /> Asset Metadata & Visuals
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Digital Asset Preview *</label>
              <div className="relative group h-48 bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2.5rem] flex flex-col items-center justify-center overflow-hidden hover:border-blue-400 transition-all cursor-pointer">
                {formData.image ? (
                  <img src={formData.image} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center text-slate-400 group-hover:text-blue-500 transition-colors">
                    <ImageIcon size={48} strokeWidth={1} />
                    <p className="text-[10px] font-black uppercase tracking-widest mt-4">Upload Product Image</p>
                  </div>
                )}
                <input required type="file" accept="image/*" onChange={handleImageChange} className="absolute inset-0 opacity-0 cursor-pointer" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Product Context Summary</label>
              <div className="relative h-48">
                <FileText className="absolute left-5 top-5 text-slate-300" size={18} />
                <textarea className="w-full h-full pl-14 pr-5 py-5 bg-slate-50 border border-slate-200 rounded-[2.5rem] outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 font-bold text-sm transition-all resize-none" placeholder="Enter technical specifications or product details..." value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
              </div>
            </div>
          </div>
        </div>

        <div className="pt-12 border-t border-slate-50 flex flex-col sm:flex-row gap-4">
          <button type="submit" disabled={isSubmitting} className="flex-1 bg-[#0052FF] text-white font-black py-6 rounded-3xl shadow-2xl shadow-blue-200 hover:bg-blue-600 hover:scale-[1.02] active:scale-95 transition-all uppercase tracking-[0.3em] text-[11px] flex items-center justify-center gap-3 disabled:opacity-50">
            {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
            {isSubmitting ? 'Processing...' : 'Authorize Stock Enrollment'}
          </button>
          <button type="button" onClick={() => navigate(-1)} className="px-12 py-6 bg-slate-100 text-slate-600 font-black rounded-3xl hover:bg-slate-200 transition-all uppercase tracking-widest text-[11px]">
            Discard
          </button>
        </div>
      </form>
    </div>
  );
};