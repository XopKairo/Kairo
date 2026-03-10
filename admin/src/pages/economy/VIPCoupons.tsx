import { useState, useEffect } from 'react';
import { Crown, Tag, Plus, Trash2 } from 'lucide-react';
import apiClient from '../../api/apiClient';

interface VipPackage {
  _id: string;
  name: string;
  priceINR: number;
  durationDays: number;
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
  const [vipPackages, setVipPackages] = useState<VipPackage[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);

  const fetchData = async () => {
    try {
      const [vipRes, couponRes] = await Promise.all([
        apiClient.get('/admin/economy/vip'),
        apiClient.get('/admin/economy/coupons')
      ]);
      setVipPackages(vipRes.data);
      setCoupons(couponRes.data);
    } catch {
      console.error(e);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const deleteCoupon = async (id: string) => {
    if(!confirm('Delete this coupon?')) return;
    try {
      await apiClient.delete('/admin/economy/coupons/' + id);
      setCoupons(coupons.filter(c => c._id !== id));
    } catch { alert('Failed'); }
  };

  return (
    <div className="space-y-10">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">VIP & Coupons</h1>
      </div>

      {/* VIP Packages Section */}
      <div className="bg-white dark:bg-surface-900 rounded-[32px] p-8 shadow-sm border border-gray-100 dark:border-gray-800">
         <div className="flex justify-between items-center mb-8">
           <div>
             <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
               <Crown className="text-yellow-500" /> VIP Membership Plans
             </h3>
             <p className="text-sm text-gray-500">Manage VIP access for elite users</p>
           </div>
           <button className="bg-brand-600 hover:bg-brand-700 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 transition-all">
             <Plus size={20}/> New Plan
           </button>
         </div>
         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {vipPackages.map(pkg => (
              <div key={pkg._id} className="p-6 bg-gray-50 dark:bg-surface-800 rounded-[24px] border border-gray-100 dark:border-gray-700">
                <p className="text-xl font-black text-gray-900 dark:text-white">{pkg.name}</p>
                <p className="text-2xl font-bold text-brand-600 mt-2">₹{pkg.priceINR}</p>
                <p className="text-sm text-gray-500 mt-1">{pkg.durationDays} Days</p>
                <div className="mt-4 flex gap-2">
                   <span className={`px-2 py-1 rounded-lg text-[10px] font-bold ${pkg.isActive ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                      {pkg.isActive ? 'ACTIVE' : 'INACTIVE'}
                   </span>
                </div>
              </div>
            ))}
         </div>
      </div>

      {/* Coupons Section */}
      <div className="bg-white dark:bg-surface-900 rounded-[32px] p-8 shadow-sm border border-gray-100 dark:border-gray-800">
         <div className="flex justify-between items-center mb-8">
           <div>
             <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
               <Tag className="text-brand-500" /> Discount Coupons
             </h3>
             <p className="text-sm text-gray-500">Manage promo codes for recharges</p>
           </div>
           <button className="bg-brand-600 hover:bg-brand-700 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 transition-all">
             <Plus size={20}/> Create Coupon
           </button>
         </div>
         <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="text-gray-400 text-sm uppercase tracking-wider">
                <tr>
                  <th className="pb-4 font-bold">Code</th>
                  <th className="pb-4 font-bold">Discount %</th>
                  <th className="pb-4 font-bold">Max Cap</th>
                  <th className="pb-4 font-bold">Expiry</th>
                  <th className="pb-4 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {coupons.map(c => (
                  <tr key={c._id}>
                    <td className="py-4 font-bold text-gray-900 dark:text-white">{c.code}</td>
                    <td className="py-4 text-brand-600 font-black">{c.discountPercentage}%</td>
                    <td className="py-4 text-gray-900 dark:text-white">₹{c.maxDiscountAmount}</td>
                    <td className="py-4 text-sm text-gray-500">{new Date(c.expiryDate).toLocaleDateString()}</td>
                    <td className="py-4 text-right">
                       <button onClick={() => deleteCoupon(c._id)} className="text-red-500 hover:text-red-700 p-2">
                          <Trash2 size={18} />
                       </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
         </div>
      </div>
    </div>
  );
}
