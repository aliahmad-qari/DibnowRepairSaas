import React, { useState, useEffect } from 'react';
import { useSearchParams, useParams, Link } from 'react-router-dom';
import { 
  Search, Package, Clock, CheckCircle, Wrench, 
  AlertCircle, ChevronRight, MapPin, Calendar, 
  User, Phone, Mail, Tag, Loader2, RefreshCw, 
  Copy, Share2, ExternalLink, Eye, EyeOff, XCircle, Smartphone
} from 'lucide-react';

interface RepairDetails {
  trackingId: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  device: string;
  deviceModel?: string;
  serialNumber?: string;
  description: string;
  status: string;
  priority: string;
  category?: string;
  brand?: string;
  estimatedCost?: number;
  finalCost?: number;
  paymentStatus: string;
  estimatedCompletionDate?: string;
  actualCompletionDate?: string;
  createdAt: string;
  updatedAt: string;
  progressPercentage: number;
  statusHistory: {
    status: string;
    note?: string;
    updatedBy?: string;
    timestamp: string;
  }[];
  shop?: {
    name: string;
    company?: string;
    email: string;
    phone?: string;
    address?: string;
  };
  images?: {
    url: string;
    caption?: string;
  }[];
  publicViewEnabled: boolean;
}

const statusConfig: Record<string, { label: string; color: string; bgColor: string; icon: React.ReactNode }> = {
  pending: { label: 'Repair Received', color: 'text-yellow-400', bgColor: 'bg-yellow-500', icon: <Package size={16} /> },
  diagnosing: { label: 'Under Diagnosis', color: 'text-blue-400', bgColor: 'bg-blue-500', icon: <Wrench size={16} /> },
  in_progress: { label: 'Under Repair', color: 'text-indigo-400', bgColor: 'bg-indigo-500', icon: <Wrench size={16} /> },
  parts_ordered: { label: 'Parts Ordered', color: 'text-purple-400', bgColor: 'bg-purple-500', icon: <Package size={16} /> },
  completed: { label: 'Completed', color: 'text-emerald-400', bgColor: 'bg-emerald-500', icon: <CheckCircle size={16} /> },
  ready: { label: 'Ready for Pickup', color: 'text-teal-400', bgColor: 'bg-teal-500', icon: <CheckCircle size={16} /> },
  delivered: { label: 'Delivered', color: 'text-green-400', bgColor: 'bg-green-500', icon: <CheckCircle size={16} /> },
  cancelled: { label: 'Cancelled', color: 'text-red-400', bgColor: 'bg-red-500', icon: <AlertCircle size={16} /> },
  refunded: { label: 'Refunded', color: 'text-gray-400', bgColor: 'bg-gray-500', icon: <RefreshCw size={16} /> }
};

const timelineOrder = ['pending', 'diagnosing', 'parts_ordered', 'in_progress', 'completed', 'ready', 'delivered'];

export const TrackRepair: React.FC = () => {
  const { trackingId: urlTrackingId } = useParams<{ trackingId?: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [trackingId, setTrackingId] = useState(urlTrackingId || searchParams.get('tracking') || '');
  const [email, setEmail] = useState(searchParams.get('email') || '');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [repair, setRepair] = useState<RepairDetails | null>(null);
  const [searchMode, setSearchMode] = useState<'tracking' | 'email'>('tracking');
  const [copied, setCopied] = useState(false);
  const [showShareOptions, setShowShareOptions] = useState(false);

  useEffect(() => {
    if (urlTrackingId) {
      setTrackingId(urlTrackingId);
      setSearchParams({ tracking: urlTrackingId });
    }
  }, [urlTrackingId, setSearchParams]);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);
    setRepair(null);
    setIsLoading(true);
    setShowShareOptions(false);

    try {
      let url = '';
      if (searchMode === 'tracking' && trackingId) {
        url = `/api/public/repair-status/${encodeURIComponent(trackingId)}`;
      } else if (searchMode === 'email' && email) {
        url = `/api/public/repair-status/email/${encodeURIComponent(email)}`;
      } else {
        setError('Please enter a tracking ID or email address');
        setIsLoading(false);
        return;
      }

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || 'Repair not found. Please check your tracking ID.');
        setIsLoading(false);
        return;
      }

      setRepair(data.repair);
      
      if (trackingId) {
        setSearchParams({ tracking: trackingId });
      }
    } catch (err) {
      setError('Connection error. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (trackingId && !repair && !isLoading) {
      handleSearch();
    }
  }, [trackingId]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDateShort = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const copyToClipboard = async () => {
    if (repair?.trackingId) {
      await navigator.clipboard.writeText(repair.trackingId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const shareOnWhatsApp = () => {
    if (repair?.trackingId) {
      const text = `Track my repair: ${repair.trackingId}`;
      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    }
  };

  const shareViaEmail = () => {
    if (repair?.trackingId) {
      const subject = `Repair Tracking: ${repair.trackingId}`;
      const body = `Track my repair using ID: ${repair.trackingId}`;
      window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    }
  };

  const currentStatus = repair ? statusConfig[repair.status] : null;
  const progress = repair?.progressPercentage || 0;
  
  const getCurrentTimelineIndex = (status: string) => {
    return timelineOrder.indexOf(status);
  };

  return (
    <div className="min-h-screen bg-[#0f172a] py-12 px-4">
      <div className="absolute top-0 left-0 w-full h-full opacity-30 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#0052FF] blur-[150px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#00D1FF] blur-[150px] rounded-full" />
      </div>

      <div className="max-w-5xl mx-auto relative z-10">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-2xl shadow-2xl mb-6">
            <Package size={40} className="text-blue-600" />
          </div>
          <h1 className="text-4xl font-black text-white uppercase tracking-tight mb-2">
            Track Your Repair
          </h1>
          <p className="text-slate-400 text-lg font-medium">
            Enter your tracking ID to check repair status instantly
          </p>
          <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full">
            <Smartphone size={16} className="text-blue-400" />
            <span className="text-slate-400 text-sm">Like TCS Tracking - Real-time Updates</span>
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-8 mb-8">
          <div className="flex p-1 bg-slate-800/50 rounded-2xl mb-6">
            <button
              onClick={() => { setSearchMode('tracking'); setError(null); }}
              className={`flex-1 py-4 px-6 rounded-xl text-sm font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
                searchMode === 'tracking' 
                  ? 'bg-blue-600 text-white shadow-lg' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Tag size={16} />
              Tracking ID
            </button>
            <button
              onClick={() => { setSearchMode('email'); setError(null); }}
              className={`flex-1 py-4 px-6 rounded-xl text-sm font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
                searchMode === 'email' 
                  ? 'bg-blue-600 text-white shadow-lg' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Mail size={16} />
              Email Address
            </button>
          </div>

          <form onSubmit={handleSearch} className="space-y-4">
            {searchMode === 'tracking' ? (
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={22} />
                <input
                  type="text"
                  placeholder="Enter tracking ID (e.g., DIB-REP-2026-000123)"
                  className="w-full pl-14 pr-4 py-4 bg-slate-800/50 border border-slate-600 rounded-2xl text-white placeholder-slate-400 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-mono text-lg"
                  value={trackingId}
                  onChange={(e) => setTrackingId(e.target.value.toUpperCase())}
                  disabled={isLoading}
                  autoFocus
                />
              </div>
            ) : (
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={22} />
                <input
                  type="email"
                  placeholder="Enter your email address"
                  className="w-full pl-14 pr-4 py-4 bg-slate-800/50 border border-slate-600 rounded-2xl text-white placeholder-slate-400 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-lg"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  autoFocus
                />
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-2xl shadow-xl hover:scale-[1.01] active:scale-95 transition-all text-lg uppercase tracking-[0.2em] flex items-center justify-center gap-3"
            >
              {isLoading ? (
                <>
                  <Loader2 size={22} className="animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Search size={22} />
                  Track Repair
                </>
              )}
            </button>
          </form>

          {error && (
            <div className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-4">
              <div className="w-10 h-10 bg-red-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <XCircle size={22} className="text-red-400" />
              </div>
              <div>
                <p className="text-white font-bold">Repair Not Found</p>
                <p className="text-slate-400 text-sm">{error}</p>
              </div>
            </div>
          )}
        </div>

        {repair && !error && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-[2.5rem] p-8 mb-6 border border-white/10">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
                <div>
                  <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-2">Tracking ID</p>
                  <div className="flex items-center gap-3">
                    <p className="text-3xl font-mono font-black text-white tracking-wider">{repair.trackingId}</p>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={copyToClipboard}
                        className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-all"
                        title="Copy Tracking ID"
                      >
                        {copied ? (
                          <CheckCircle size={18} className="text-emerald-400" />
                        ) : (
                          <Copy size={18} className="text-slate-400 hover:text-white" />
                        )}
                      </button>
                      <div className="relative">
                        <button
                          onClick={() => setShowShareOptions(!showShareOptions)}
                          className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-all"
                          title="Share"
                        >
                          <Share2 size={18} className="text-slate-400 hover:text-white" />
                        </button>
                        {showShareOptions && (
                          <div className="absolute right-0 top-12 bg-slate-800 border border-white/10 rounded-xl p-3 shadow-xl z-20 min-w-[160px]">
                            <button
                              onClick={shareOnWhatsApp}
                              className="w-full flex items-center gap-3 px-4 py-2 hover:bg-white/10 rounded-lg text-left text-white text-sm transition-all"
                            >
                              <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                                <span className="text-xs font-bold">W</span>
                              </div>
                              WhatsApp
                            </button>
                            <button
                              onClick={shareViaEmail}
                              className="w-full flex items-center gap-3 px-4 py-2 hover:bg-white/10 rounded-lg text-left text-white text-sm transition-all"
                            >
                              <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                                <Mail size={12} />
                              </div>
                              Email
                            </button>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(window.location.href);
                                setCopied(true);
                                setTimeout(() => setCopied(false), 2000);
                                setShowShareOptions(false);
                              }}
                              className="w-full flex items-center gap-3 px-4 py-2 hover:bg-white/10 rounded-lg text-left text-white text-sm transition-all"
                            >
                              <Copy size={14} />
                              Copy Link
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {currentStatus && (
                    <div className={`inline-flex items-center gap-3 px-6 py-4 rounded-2xl ${currentStatus.bgColor} text-white shadow-lg`}>
                      <span className="transform scale-125">{currentStatus.icon}</span>
                      <span className="font-black uppercase tracking-wider text-lg">{currentStatus.label}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="mb-2">
                <div className="flex justify-between text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
                  <span>Progress</span>
                  <span>{progress}%</span>
                </div>
                <div className="h-4 bg-slate-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-500 via-blue-400 to-emerald-400 rounded-full transition-all duration-1000"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
                <div className="flex items-center gap-3 p-4 bg-white/5 rounded-xl">
                  <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                    <Calendar size={18} className="text-blue-400" />
                  </div>
                  <div>
                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Received</p>
                    <p className="text-white font-bold text-sm">{formatDateShort(repair.createdAt)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-white/5 rounded-xl">
                  <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                    <Wrench size={18} className="text-purple-400" />
                  </div>
                  <div>
                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Device</p>
                    <p className="text-white font-bold text-sm truncate max-w-[120px]">{repair.device}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-white/5 rounded-xl">
                  <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                    <User size={18} className="text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Customer</p>
                    <p className="text-white font-bold text-sm truncate max-w-[120px]">{repair.customerName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-white/5 rounded-xl">
                  <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                    <Tag size={18} className="text-yellow-400" />
                  </div>
                  <div>
                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Payment</p>
                    <p className={`font-bold text-sm uppercase ${
                      repair.paymentStatus === 'paid' ? 'text-emerald-400' : 'text-yellow-400'
                    }`}>
                      {repair.paymentStatus}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-8">
                <h3 className="text-white font-black uppercase tracking-wider mb-6 flex items-center gap-3">
                  <Clock size={20} className="text-blue-400" />
                  Repair Timeline
                </h3>
                
                <div className="relative">
                  <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-slate-700" />
                  
                  <div className="space-y-6">
                    {timelineOrder.map((status, index) => {
                      const statusInfo = statusConfig[status];
                      const isCompleted = getCurrentTimelineIndex(repair.status) >= index;
                      const isCurrent = repair.status === status;
                      
                      return (
                        <div key={status} className="relative flex items-start gap-4 pl-10">
                          <div className={`absolute left-[11px] w-3 h-3 rounded-full border-4 border-slate-900 z-10 ${
                            isCompleted 
                              ? statusInfo.bgColor 
                              : 'bg-slate-600'
                          } ${isCurrent ? 'animate-pulse shadow-lg shadow-blue-500/50' : ''}`} />
                          
                          <div className={`flex-1 p-4 rounded-xl transition-all ${
                            isCurrent 
                              ? 'bg-blue-500/10 border border-blue-500/30' 
                              : isCompleted 
                                ? 'bg-white/5' 
                                : 'bg-white/5 opacity-50'
                          }`}>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className={isCompleted ? statusInfo.color : 'text-slate-500'}>
                                  {statusInfo.icon}
                                </span>
                                <span className={`font-bold uppercase text-sm ${
                                  isCompleted ? 'text-white' : 'text-slate-500'
                                }`}>
                                  {statusInfo.label}
                                </span>
                              </div>
                              {isCurrent && (
                                <span className="px-2 py-1 bg-blue-500 text-white text-[10px] font-bold uppercase rounded-full">
                                  Current
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-8">
                  <h3 className="text-white font-black uppercase tracking-wider mb-6 flex items-center gap-3">
                    <Smartphone size={20} className="text-emerald-400" />
                    Device Details
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-white/5 rounded-xl">
                      <span className="text-slate-400 text-xs font-bold uppercase tracking-widest">Device</span>
                      <span className="text-white font-bold">{repair.device}</span>
                    </div>
                    {repair.deviceModel && (
                      <div className="flex justify-between items-center p-3 bg-white/5 rounded-xl">
                        <span className="text-slate-400 text-xs font-bold uppercase tracking-widest">Model</span>
                        <span className="text-white font-bold">{repair.deviceModel}</span>
                      </div>
                    )}
                    {repair.serialNumber && (
                      <div className="flex justify-between items-center p-3 bg-white/5 rounded-xl">
                        <span className="text-slate-400 text-xs font-bold uppercase tracking-widest">Serial Number</span>
                        <span className="text-white font-mono text-sm">{repair.serialNumber}</span>
                      </div>
                    )}
                    {repair.brand && (
                      <div className="flex justify-between items-center p-3 bg-white/5 rounded-xl">
                        <span className="text-slate-400 text-xs font-bold uppercase tracking-widest">Brand</span>
                        <span className="text-white font-bold">{repair.brand}</span>
                      </div>
                    )}
                    {repair.category && (
                      <div className="flex justify-between items-center p-3 bg-white/5 rounded-xl">
                        <span className="text-slate-400 text-xs font-bold uppercase tracking-widest">Category</span>
                        <span className="text-white font-bold">{repair.category}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center p-3 bg-white/5 rounded-xl">
                      <span className="text-slate-400 text-xs font-bold uppercase tracking-widest">Priority</span>
                      <span className={`font-bold uppercase text-sm ${
                        repair.priority === 'urgent' ? 'text-red-400' :
                        repair.priority === 'high' ? 'text-orange-400' :
                        repair.priority === 'medium' ? 'text-yellow-400' :
                        'text-slate-400'
                      }`}>
                        {repair.priority}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-8">
                  <h3 className="text-white font-black uppercase tracking-wider mb-6 flex items-center gap-3">
                    <Tag size={20} className="text-yellow-400" />
                    Cost Information
                  </h3>
                  
                  <div className="space-y-4">
                    {repair.estimatedCost && (
                      <div className="flex justify-between items-center p-3 bg-white/5 rounded-xl">
                        <span className="text-slate-400 text-xs font-bold uppercase tracking-widest">Estimated Cost</span>
                        <span className="text-white font-bold text-lg">${repair.estimatedCost.toFixed(2)}</span>
                      </div>
                    )}
                    {repair.finalCost && (
                      <div className="flex justify-between items-center p-3 bg-white/5 rounded-xl">
                        <span className="text-slate-400 text-xs font-bold uppercase tracking-widest">Final Cost</span>
                        <span className="text-emerald-400 font-bold text-lg">${repair.finalCost.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center p-3 bg-white/5 rounded-xl">
                      <span className="text-slate-400 text-xs font-bold uppercase tracking-widest">Payment Status</span>
                      <span className={`font-bold uppercase text-sm ${
                        repair.paymentStatus === 'paid' ? 'text-emerald-400' : 'text-yellow-400'
                      }`}>
                        {repair.paymentStatus}
                      </span>
                    </div>
                    {repair.estimatedCompletionDate && (
                      <div className="flex justify-between items-center p-3 bg-white/5 rounded-xl">
                        <span className="text-slate-400 text-xs font-bold uppercase tracking-widest">Est. Completion</span>
                        <span className="text-white font-bold">{formatDateShort(repair.estimatedCompletionDate)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {repair.description && (
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-8 mb-6">
                <h3 className="text-white font-black uppercase tracking-wider mb-4 flex items-center gap-3">
                  <AlertCircle size={20} className="text-orange-400" />
                  Problem Description
                </h3>
                <p className="text-slate-300 leading-relaxed">{repair.description}</p>
              </div>
            )}

            {repair.statusHistory && repair.statusHistory.length > 0 && (
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-8 mb-6">
                <h3 className="text-white font-black uppercase tracking-wider mb-6 flex items-center gap-3">
                  <Clock size={20} className="text-purple-400" />
                  Status History
                </h3>
                <div className="space-y-4">
                  {[...repair.statusHistory].reverse().slice(0, 10).map((history, index) => (
                    <div key={index} className="relative flex items-start gap-4 p-4 bg-white/5 rounded-xl">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2" />
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-white font-bold uppercase text-sm">
                            {statusConfig[history.status]?.label || history.status}
                          </p>
                          <p className="text-slate-500 text-xs">{formatDate(history.timestamp)}</p>
                        </div>
                        {history.note && (
                          <p className="text-slate-400 text-sm">{history.note}</p>
                        )}
                        {history.updatedBy && (
                          <p className="text-slate-500 text-xs mt-1">Updated by: {history.updatedBy}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {repair.shop && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-[2.5rem] p-8 mb-6">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 bg-emerald-500 rounded-2xl flex items-center justify-center flex-shrink-0">
                    <MapPin size={24} className="text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-emerald-400 text-xs font-bold uppercase tracking-widest mb-1">Repair Shop</p>
                    <p className="text-white font-black text-xl mb-1">{repair.shop.name}</p>
                    {repair.shop.company && (
                      <p className="text-slate-400 text-sm mb-3">{repair.shop.company}</p>
                    )}
                    <div className="flex flex-wrap gap-4">
                      {repair.shop.email && (
                        <a href={`mailto:${repair.shop.email}`} className="flex items-center gap-2 text-slate-300 hover:text-white text-sm transition-colors">
                          <Mail size={14} />
                          {repair.shop.email}
                        </a>
                      )}
                      {repair.shop.phone && (
                        <a href={`tel:${repair.shop.phone}`} className="flex items-center gap-2 text-slate-300 hover:text-white text-sm transition-colors">
                          <Phone size={14} />
                          {repair.shop.phone}
                        </a>
                      )}
                      {repair.shop.address && (
                        <span className="flex items-center gap-2 text-slate-300 text-sm">
                          <MapPin size={14} />
                          {repair.shop.address}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="text-center">
              <p className="text-slate-400 text-sm mb-4">Need help with your repair?</p>
              <Link 
                to="/user/quick/support" 
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-2xl font-bold text-sm transition-all shadow-lg hover:shadow-xl"
              >
                Contact Support
                <ExternalLink size={16} />
              </Link>
            </div>
          </div>
        )}

        {!repair && !isLoading && !error && (
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-12 text-center">
            <div className="w-24 h-24 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Package size={48} className="text-blue-400" />
            </div>
            <h3 className="text-white font-black uppercase tracking-wider text-2xl mb-4">
              How to Track Your Repair
            </h3>
            <div className="max-w-lg mx-auto space-y-4 text-slate-400">
              <p>
                Enter the <span className="text-blue-400 font-mono">Tracking ID</span> provided when your repair was created 
                to get real-time updates on your device repair status.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
                <div className="p-4 bg-white/5 rounded-xl">
                  <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <Tag size={20} className="text-blue-400" />
                  </div>
                  <p className="text-white font-bold text-sm mb-1">1. Get ID</p>
                  <p className="text-slate-400 text-xs">Receive tracking ID when drop-off</p>
                </div>
                <div className="p-4 bg-white/5 rounded-xl">
                  <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <Search size={20} className="text-emerald-400" />
                  </div>
                  <p className="text-white font-bold text-sm mb-1">2. Enter ID</p>
                  <p className="text-slate-400 text-xs">Paste ID in the search box above</p>
                </div>
                <div className="p-4 bg-white/5 rounded-xl">
                  <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <Clock size={20} className="text-purple-400" />
                  </div>
                  <p className="text-white font-bold text-sm mb-1">3. Track</p>
                  <p className="text-slate-400 text-xs">View real-time repair progress</p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="mt-12 text-center">
          <p className="text-slate-500 text-sm">
            Powered by <span className="text-blue-400 font-bold">DibNow</span> - Professional Repair Management
          </p>
        </div>
      </div>
    </div>
  );
};
