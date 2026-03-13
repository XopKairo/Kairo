import { useState, useEffect } from 'react';
import { Crown, Ticket, Plus, Trash2, ShieldCheck, Clock } from 'lucide-react';
import apiClient from '../../api/apiClient';

interface VIPPackage {
  _id: string;
  name: string;
  priceINR: number;
  durationDays: number;
  features: string[];
  isActive: boolean;
}

interface Coupon {
  _id: string;
  code: string;
  discountPercentage: number;
  maxDiscountAmount: number;
  expiryDate: string;
  isActive: boolean;
}

export default function VIPCoupons() {
  const [vipPackages, setVipPackages] = useState<VIPPackage[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);

  // Modal states
  const [isVipModalOpen, setIsVipModalOpen] = useState(false);
  const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);

  // Form states
  const [vipForm, setVipForm] = useState({ name: '', priceINR: 0, durationDays: 30, features: '' });
  const [couponForm, setCouponForm] = useState({ code: '', discountPercentage: 10, maxDiscountAmount: 100, expiryDate: '' });

  const fetchData = async () => {
    try {
      const [vipRes, couponRes] = await Promise.all([
        apiClient.get('/admin/economy/vip'),
        apiClient.get('/admin/economy/coupons')
      ]);
      setVipPackages(vipRes.data);
      setCoupons(couponRes.data);
    } catch (e) {
      console.error('Fetch failed');
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleAddVIP = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = { ...vipForm, features: vipForm.features.split(',').map(f => f.trim()) };
      await apiClient.post('/admin/economy/vip', data);
      setIsVipModalOpen(false);
      fetchData();
    } catch { alert('Failed'); }
  };

  const handleAddCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.post('/admin/economy/coupons', couponForm);
      setIsCouponModalOpen(false);
      fetchData();
    } catch { alert('Failed'); }
  };

  const deleteVIP = async (id: string) => {
    if (!window.confirm('Delete VIP plan?')) return;
    await apiClient.delete('/admin/economy/vip/' + id);
    fetchData();
  };

  const deleteCoupon = async (id: string) => {
    if (!window.confirm('Delete Coupon?')) return;
    await apiClient.delete('/admin/economy/coupons/' + id);
    fetchData();
  };

  return (
    <div className="space-y-10 pb-20">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white uppercase tracking-tight">Economy Control</h1>
          <p className="text-sm text-gray-500 font-bold uppercase tracking-widest mt-1">Manage VIP Plans & Discount Coupons</p>
        </div>
      </div>

      {/* VIP Section */}
      <section className="space-y-6">
        <div className="flex justify-between items-center bg-brand-50/50 dark:bg-brand-950/20 p-6 rounded-[32px] border border-brand-100 dark:border-brand-900/30">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-brand-100 dark:bg-brand-900/40 rounded-2xl">
              <Crown className="text-brand-600 w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold">VIP Membership Plans</h2>
              <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Manage VIP access for elite users</p>
            </div>
          </div>
          <button onClick={() => setIsVipModalOpen(true)} className="bg-brand-600 text-white px-6 py-3 rounded-2xl font-black text-sm flex items-center gap-2 shadow-lg shadow-brand-500/30">
            <Plus size={18} strokeWidth={3}/> NEW PLAN
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {vipPackages.map(pkg => (
            <div key={pkg._id} className="bg-white dark:bg-surface-900 p-6 rounded-[32px] border border-gray-100 dark:border-gray-800 shadow-sm relative overflow-hidden group">
              <div className="flex justify-between items-start mb-4">
                <span className="px-3 py-1 bg-brand-50 text-brand-600 text-[10px] font-black rounded-full border border-brand-100">{pkg.durationDays} DAYS</span>
                <button onClick={() => deleteVIP(pkg._id)} className="p-2 text-gray-400 hover:text-red-600 transition-colors"><Trash2 size={18}/></button>
              </div>
              <h3 className="text-xl font-black uppercase tracking-tight mb-4">{pkg.name}</h3>
              <div className="text-3xl font-black text-brand-600 mb-6">₹{pkg.priceINR}</div>
              
              <ul className="space-y-2 mb-6">
                {pkg.features.map((f, i) => (
                  <li key={i} className="flex items-center gap-2 text-xs font-bold text-gray-500">
                    <ShieldCheck size={14} className="text-brand-500" /> {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Coupons Section */}
      <section className="space-y-6">
        <div className="flex justify-between items-center bg-blue-50/50 dark:bg-blue-950/20 p-6 rounded-[32px] border border-blue-100 dark:border-blue-900/30">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/40 rounded-2xl">
              <Ticket className="text-blue-600 w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Discount Coupons</h2>
              <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Manage promo codes for recharges</p>
            </div>
          </div>
          <button onClick={() => setIsCouponModalOpen(true)} className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-black text-sm flex items-center gap-2 shadow-lg shadow-blue-500/30">
            <Plus size={18} strokeWidth={3}/> CREATE COUPON
          </button>
        </div>

        <div className="bg-white dark:bg-surface-900 rounded-[32px] overflow-hidden border border-gray-100 dark:border-gray-800 shadow-sm">
          <table className="w-full text-left">
            <thead className="bg-gray-50 dark:bg-surface-800/50 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b dark:border-gray-800">
              <tr>
                <th className="p-6">Code</th>
                <th className="p-6">Discount %</th>
                <th className="p-6">Max Cap</th>
                <th className="p-6">Expiry</th>
                <th className="p-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
              {coupons.map(c => (
                <tr key={c._id}>
                  <td className="p-6 font-black text-blue-600 font-mono tracking-wider">{c.code}</td>
                  <td className="p-6 font-bold">{c.discountPercentage}% OFF</td>
                  <td className="p-6 font-bold">₹{c.maxDiscountAmount}</td>
                  <td className="p-6">
                    <div className="flex items-center gap-2 text-xs font-bold text-gray-500">
                      <Clock size={14} /> {new Date(c.expiryDate).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="p-6 text-right">
                    <button onClick={() => deleteCoupon(c._id)} className="p-2 text-gray-400 hover:text-red-600 transition-colors"><Trash2 size={18}/></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* VIP Modal */}
      {isVipModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-surface-900 w-full max-w-md rounded-[40px] p-10 border border-white/10 shadow-2xl">
            <h2 className="text-2xl font-black mb-8 uppercase tracking-tighter">New VIP Plan</h2>
            <form onSubmit={handleAddVIP} className="space-y-5">
              <input required placeholder="PLAN NAME (e.g. GOLD)" className="w-full p-4 bg-gray-50 dark:bg-surface-800 rounded-2xl font-bold text-sm" value={vipForm.name} onChange={e => setVipForm({...vipForm, name: e.target.value})} />
              <div className="grid grid-cols-2 gap-4">
                <input required type="number" placeholder="PRICE INR" className="w-full p-4 bg-gray-50 dark:bg-surface-800 rounded-2xl font-bold text-sm" value={vipForm.priceINR} onChange={e => setVipForm({...vipForm, priceINR: parseInt(e.target.value)})} />
                <input required type="number" placeholder="DAYS" className="w-full p-4 bg-gray-50 dark:bg-surface-800 rounded-2xl font-bold text-sm" value={vipForm.durationDays} onChange={e => setVipForm({...vipForm, durationDays: parseInt(e.target.value)})} />
              </div>
              <textarea required placeholder="FEATURES (Comma separated)" className="w-full p-4 bg-gray-50 dark:bg-surface-800 rounded-2xl font-bold text-sm h-32" value={vipForm.features} onChange={e => setVipForm({...vipForm, features: e.target.value})} />
              <button className="w-full py-5 bg-brand-600 text-white rounded-[24px] font-black mt-6 shadow-xl">PUBLISH VIP PLAN</button>
              <button type="button" onClick={() => setIsVipModalOpen(false)} className="w-full py-2 text-gray-500 font-bold uppercase text-xs mt-2">CANCEL</button>
            </form>
          </div>
        </div>
      )}

      {/* Coupon Modal */}
      {isCouponModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-surface-900 w-full max-w-md rounded-[40px] p-10 border border-white/10 shadow-2xl">
            <h2 className="text-2xl font-black mb-8 uppercase tracking-tighter">Create Promo Code</h2>
            <form onSubmit={handleAddCoupon} className="space-y-5">
              <input required placeholder="COUPON CODE" className="w-full p-4 bg-gray-50 dark:bg-surface-800 rounded-2xl font-bold text-sm uppercase" value={couponForm.code} onChange={e => setCouponForm({...couponForm, code: e.target.value.toUpperCase()})} />
              <div className="grid grid-cols-2 gap-4">
                <input required type="number" placeholder="DISCOUNT %" className="w-full p-4 bg-gray-50 dark:bg-surface-800 rounded-2xl font-bold text-sm" value={couponForm.discountPercentage} onChange={e => setCouponForm({...couponForm, discountPercentage: parseInt(e.target.value)})} />
                <input required type="number" placeholder="MAX OFF (₹)" className="w-full p-4 bg-gray-50 dark:bg-surface-800 rounded-2xl font-bold text-sm" value={couponForm.maxDiscountAmount} onChange={e => setCouponForm({...couponForm, maxDiscountAmount: parseInt(e.target.value)})} />
              </div>
              <input required type="date" className="w-full p-4 bg-gray-50 dark:bg-surface-800 rounded-2xl font-bold text-sm" value={couponForm.expiryDate} onChange={e => setCouponForm({...couponForm, expiryDate: e.target.value})} />
              <button className="w-full py-5 bg-blue-600 text-white rounded-[24px] font-black mt-6 shadow-xl">ACTIVATE COUPON</button>
              <button type="button" onClick={() => setIsCouponModalOpen(false)} className="w-full py-2 text-gray-500 font-bold uppercase text-xs mt-2">CANCEL</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
