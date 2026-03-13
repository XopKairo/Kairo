import { useState, useEffect, useContext } from 'react';
import { Settings as SettingsIcon, Shield, Key } from 'lucide-react';
import apiClient from '../../api/apiClient';
import { AuthContext } from '../../context/AuthContext';

export default function Settings() {
  const authContext = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // App Config
  const [maintenance, setMaintenance] = useState(false);
  const [rewardPerAd, setRewardPerAd] = useState(5);
  const [dailyLimit, setDailyLimit] = useState(10);
  const [callRate, setCallRate] = useState(30);
  const [commission, setCommission] = useState(30);
  const [coinToInrRate, setCoinToInrRate] = useState(0.1);
  const [isAiModerationEnabled, setIsAiModerationEnabled] = useState(true);
  const [aiSensitivity, setAiSensitivity] = useState('High');

  // Admin Profile
  const [username, setUsername] = useState(authContext?.user?.username || '');
  const [email, setEmail] = useState(authContext?.user?.email || '');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'IDLE' | 'OTP_SENT'>('IDLE');
  const [profileMsg, setProfileMsg] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchSettings();
  }, [authContext?.user]);

  const fetchSettings = async () => {
    try {
      const response = await apiClient.get('/admin/settings');
      if (response.data) {
        setMaintenance(response.data.maintenance || false);
        setRewardPerAd(response.data.rewardPerAd || 5);
        setDailyLimit(response.data.dailyLimit || 10);
        setCallRate(response.data.callRate || 30);
        setCommission(response.data.commission || 30);
        setCoinToInrRate(response.data.coinToInrRate || 0.1);
        setIsAiModerationEnabled(response.data.isAiModerationEnabled !== undefined ? response.data.isAiModerationEnabled : true);
        setAiSensitivity(response.data.aiSensitivity || 'High');
      }
    } catch (error: any) {
      console.error('Failed to fetch settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleMaintenance = async () => {
    setSaving(true);
    const newStatus = !maintenance;
    try {
      await apiClient.put('/admin/settings', { maintenance: newStatus });
      setMaintenance(newStatus);
    } catch (error: any) {
      console.error('Failed to update maintenance mode:', error);
      alert('Failed to update maintenance mode. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleRequestOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMsg({ type: '', text: '' });
    setSaving(true);
    try {
      const res = await apiClient.post('/admin/auth/request-update-otp');
      setStep('OTP_SENT');
      setProfileMsg({ type: 'success', text: res.data.message });
    } catch (err) {
      setProfileMsg({ type: 'error', text: 'Failed to send OTP' });
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMsg({ type: '', text: '' });
    setSaving(true);
    try {
      await apiClient.put('/admin/auth/update-profile', {
        otp,
        newUsername: username,
        newEmail: email,
        newPassword: password
      });
      setProfileMsg({ type: 'success', text: 'Profile updated successfully! Please re-login.' });
      setStep('IDLE');
      setPassword('');
      setOtp('');
      setTimeout(() => { authContext?.logout(); }, 3000);
    } catch (err) {
      setProfileMsg({ type: 'error', text: 'Failed to update profile' });
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateAds = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await apiClient.put('/admin/settings', { rewardPerAd, dailyLimit });
      alert('Ad settings updated!');
    } catch {
      alert('Update failed');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await apiClient.put('/admin/settings', { 
        callRate, 
        commission, 
        coinToInrRate,
        isAiModerationEnabled, 
        aiSensitivity 
      });
      alert('Global configuration updated!');
    } catch {
      alert('Update failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-gray-500">Loading settings...</div>;

  return (
    <div className="max-w-4xl space-y-8 pb-20">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">App Settings</h1>
        <p className="text-sm text-gray-500">Configure global app parameters and security.</p>
      </div>

      {/* Global Configuration */}
      <div className="bg-white dark:bg-surface-900 rounded-[32px] p-8 shadow-sm border border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 bg-brand-50 dark:bg-brand-900/20 rounded-2xl">
            <SettingsIcon className="text-brand-600 w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold">Global Configuration</h2>
        </div>

        <form onSubmit={handleUpdateConfig} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Call Rate (Coins/Min)</label>
            <input type="number" value={callRate} onChange={e => setCallRate(parseInt(e.target.value))} className="w-full p-4 bg-gray-50 dark:bg-surface-800 rounded-2xl border-none font-bold" />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Admin Commission (%)</label>
            <input type="number" value={commission} onChange={e => setCommission(parseInt(e.target.value))} className="w-full p-4 bg-gray-50 dark:bg-surface-800 rounded-2xl border-none font-bold" />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Coin Rate (1 Coin = ? INR)</label>
            <input type="number" step="0.01" value={coinToInrRate} onChange={e => setCoinToInrRate(parseFloat(e.target.value))} className="w-full p-4 bg-gray-50 dark:bg-surface-800 rounded-2xl border-none font-bold text-brand-600" />
            <p className="text-[10px] text-gray-400 mt-1 font-bold italic">Current: 10 Coins = ₹{(10 * coinToInrRate).toFixed(2)}</p>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Moderation Sensitivity</label>
            <select value={aiSensitivity} onChange={e => setAiSensitivity(e.target.value)} className="w-full p-4 bg-gray-50 dark:bg-surface-800 rounded-2xl border-none font-bold">
              <option value="Low">Low (Permissive)</option>
              <option value="Medium">Medium (Standard)</option>
              <option value="High">High (Strict)</option>
            </select>
          </div>
          <div className="md:col-span-2 flex items-center justify-between p-4 bg-gray-50 dark:bg-surface-800 rounded-2xl">
            <div>
              <p className="text-sm font-bold">AI Nudity/Abuse Moderation</p>
              <p className="text-xs text-gray-500">Automatically detects and terminates explicit calls.</p>
            </div>
            <button type="button" onClick={() => setIsAiModerationEnabled(!isAiModerationEnabled)} className={`w-12 h-6 rounded-full transition-colors ${isAiModerationEnabled ? 'bg-brand-600' : 'bg-gray-300'}`}>
              <div className={`w-4 h-4 bg-white rounded-full mx-1 transition-transform ${isAiModerationEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
            </button>
          </div>
          <button type="submit" disabled={saving} className="md:col-span-2 py-4 bg-brand-600 text-white rounded-2xl font-bold shadow-lg shadow-brand-500/20">Update Configuration</button>
        </form>
      </div>

      {/* Ad Rewards */}
      <div className="bg-white dark:bg-surface-900 rounded-[32px] p-8 shadow-sm border border-gray-100 dark:border-gray-800">
        <h2 className="text-xl font-bold mb-8">Ad Rewards & Limits</h2>
        <form onSubmit={handleUpdateAds} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Reward Per Ad (Coins)</label>
            <input type="number" value={rewardPerAd} onChange={e => setRewardPerAd(parseInt(e.target.value))} className="w-full p-4 bg-gray-50 dark:bg-surface-800 rounded-2xl border-none font-bold" />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Daily Limit Per User</label>
            <input type="number" value={dailyLimit} onChange={e => setDailyLimit(parseInt(e.target.value))} className="w-full p-4 bg-gray-50 dark:bg-surface-800 rounded-2xl border-none font-bold" />
          </div>
          <button type="submit" disabled={saving} className="md:col-span-2 py-4 bg-gray-50 hover:bg-gray-100 text-gray-900 dark:bg-surface-800 dark:text-white rounded-2xl font-bold transition-all">Update Ad Settings</button>
        </form>
      </div>

      {/* Maintenance Mode */}
      <div className="bg-red-50 dark:bg-red-950/20 rounded-[32px] p-8 border border-red-100 dark:border-red-900/30">
        <h2 className="text-xl font-bold text-red-600 mb-2">System Maintenance Mode</h2>
        <p className="text-sm text-red-500 mb-8 font-medium">Disable app access for all users during scheduled maintenance.</p>
        <button onClick={toggleMaintenance} disabled={saving} className={`px-8 py-4 rounded-2xl font-black transition-all ${maintenance ? 'bg-red-600 text-white' : 'bg-white text-red-600 border border-red-200'}`}>
          {maintenance ? 'ACTIVATE SYSTEM NOW' : 'TOGGLE MAINTENANCE MODE'}
        </button>
      </div>

      {/* Admin Security */}
      <div className="bg-white dark:bg-surface-900 rounded-[32px] p-8 shadow-sm border border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-2xl">
            <Shield className="text-blue-600 w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold">Admin Account Security</h2>
        </div>

        {profileMsg.text && (
          <div className={`p-4 rounded-2xl mb-6 font-bold text-sm ${profileMsg.type === 'success' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
            {profileMsg.text}
          </div>
        )}

        <form onSubmit={step === 'IDLE' ? handleRequestOTP : handleUpdateProfile} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Username</label>
              <input disabled={step === 'IDLE'} value={username} onChange={e => setUsername(e.target.value)} className="w-full p-4 bg-gray-50 dark:bg-surface-800 rounded-2xl border-none font-bold" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Email Address</label>
              <input disabled={step === 'IDLE'} value={email} onChange={e => setEmail(e.target.value)} className="w-full p-4 bg-gray-50 dark:bg-surface-800 rounded-2xl border-none font-bold" />
            </div>
            {step === 'OTP_SENT' && (
              <>
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 text-brand-600 animate-pulse">Enter OTP Sent to Email</label>
                  <input required placeholder="6-digit code" value={otp} onChange={e => setOtp(e.target.value)} className="w-full p-4 bg-brand-50 dark:bg-brand-900/20 border-2 border-brand-500 rounded-2xl font-mono text-center text-2xl font-black" maxLength={6} />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">New Password (Optional)</label>
                  <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Leave blank to keep current" className="w-full p-4 bg-gray-50 dark:bg-surface-800 rounded-2xl border-none font-bold" />
                </div>
              </>
            )}
          </div>
          
          <button type="submit" disabled={saving} className={`w-full py-5 rounded-2xl font-black shadow-lg transition-all ${step === 'IDLE' ? 'bg-blue-600 text-white shadow-blue-500/20' : 'bg-brand-600 text-white shadow-brand-500/20'}`}>
            {saving ? 'PROCESSING...' : step === 'IDLE' ? 'REQUEST UPDATE OTP' : 'CONFIRM PROFILE UPDATE'}
          </button>
          
          {step === 'OTP_SENT' && (
            <button type="button" onClick={() => setStep('IDLE')} className="w-full py-2 text-gray-400 font-bold uppercase text-xs tracking-widest">Back</button>
          )}
        </form>
      </div>
    </div>
  );
}
