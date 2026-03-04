import { useState, useEffect, useContext } from 'react';
import { Settings as SettingsIcon, Shield, Key } from 'lucide-react';
import apiClient from '../../api/apiClient';
import { AuthContext } from '../../context/AuthContext';

export default function Settings() {
  const authContext = useContext(AuthContext);
  const [maintenance, setMaintenance] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Profile Update State
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'IDLE' | 'OTP_SENT'>('IDLE');
  const [profileMsg, setProfileMsg] = useState({ type: '', text: '' });

  useEffect(() => {
    if (authContext?.user) {
      setUsername(authContext.user.username || authContext.user.name || '');
      setEmail(authContext.user.email || '');
    }
    fetchSettings();
  }, [authContext?.user]);

  const fetchSettings = async () => {
    try {
      const response = await apiClient.get('/settings');
      if (response.data) {
        setMaintenance(response.data.maintenance || false);
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleMaintenance = async () => {
    setSaving(true);
    const newStatus = !maintenance;
    try {
      await apiClient.put('/settings', { maintenance: newStatus });
      setMaintenance(newStatus);
    } catch (error) {
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
      const res = await apiClient.post('/auth/admin/request-update-otp');
      setStep('OTP_SENT');
      setProfileMsg({ type: 'success', text: res.data.message });
    } catch (err) {
      if (err instanceof Error) {
        setProfileMsg({ type: 'error', text: 'Failed to send OTP' });
      }
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMsg({ type: '', text: '' });
    setSaving(true);
    try {
      await apiClient.put('/auth/admin/update-profile', {
        otp,
        newUsername: username,
        newEmail: email,
        newPassword: password
      });
      setProfileMsg({ type: 'success', text: 'Profile updated successfully! Please re-login.' });
      setStep('IDLE');
      setPassword('');
      setOtp('');
      setTimeout(() => {
         authContext?.logout();
      }, 3000);
    } catch (err) {
      if (err instanceof Error) {
        setProfileMsg({ type: 'error', text: 'Failed to update profile' });
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-6">Loading settings...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">App Settings</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Configure global application variables and features.</p>
        </div>
      </div>

      <div className="bg-white dark:bg-surface-900 rounded-[24px] shadow-soft border border-gray-100 dark:border-gray-800 p-6 mb-6">
         <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <SettingsIcon className="w-5 h-5 text-brand-500" /> Global Configuration
              </h3>
              <div className="space-y-4">
                 <button className="px-4 py-2 bg-gray-50 dark:bg-surface-800 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-medium w-full text-left hover:bg-gray-100 dark:hover:bg-surface-700 transition-colors">Coin Pricing & Packages</button>
                 
                 <div className="p-4 bg-gray-50 dark:bg-surface-800 rounded-xl flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-white">System Maintenance Mode</h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">When enabled, the app will be inaccessible to users.</p>
                    </div>
                    <button 
                      onClick={toggleMaintenance}
                      disabled={saving}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 ${
                        maintenance ? 'bg-red-500' : 'bg-gray-300 dark:bg-gray-600'
                      } ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <span className="sr-only">Toggle maintenance mode</span>
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          maintenance ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                 </div>
              </div>
            </div>
         </div>
      </div>

      {/* Admin Security Section */}
      <div className="bg-white dark:bg-surface-900 rounded-[24px] shadow-soft border border-gray-100 dark:border-gray-800 p-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5 text-brand-500" /> Admin Account Security
        </h3>
        
        {profileMsg.text && (
          <div className={`p-3 mb-4 rounded-xl text-sm font-medium ${profileMsg.type === 'error' ? 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400' : 'bg-green-50 text-green-600 dark:bg-green-500/10 dark:text-green-400'}`}>
            {profileMsg.text}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <form onSubmit={step === 'IDLE' ? handleRequestOTP : handleUpdateProfile} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Username</label>
              <input
                type="text"
                required
                disabled={step === 'OTP_SENT'}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-surface-800 border border-transparent focus:border-brand-500 dark:focus:border-brand-500 rounded-xl text-sm text-gray-900 dark:text-white outline-none transition-colors disabled:opacity-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Email Address</label>
              <input
                type="email"
                required
                disabled={step === 'OTP_SENT'}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-surface-800 border border-transparent focus:border-brand-500 dark:focus:border-brand-500 rounded-xl text-sm text-gray-900 dark:text-white outline-none transition-colors disabled:opacity-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">New Password (Optional)</label>
              <input
                type="password"
                disabled={step === 'OTP_SENT'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Leave blank to keep current password"
                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-surface-800 border border-transparent focus:border-brand-500 dark:focus:border-brand-500 rounded-xl text-sm text-gray-900 dark:text-white outline-none transition-colors disabled:opacity-50"
              />
            </div>

            {step === 'OTP_SENT' && (
              <div className="pt-2 animate-in fade-in slide-in-from-top-2">
                <label className="block text-sm font-medium text-brand-600 dark:text-brand-400 mb-1.5 flex items-center gap-2">
                  <Key className="w-4 h-4" /> Enter Verification Code
                </label>
                <input
                  type="text"
                  required
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="6-digit OTP sent to your current email"
                  className="w-full px-4 py-2.5 bg-brand-50 dark:bg-brand-500/10 border border-brand-200 dark:border-brand-500/30 focus:border-brand-500 rounded-xl text-sm text-gray-900 dark:text-white outline-none transition-colors"
                />
              </div>
            )}

            <div className="flex gap-3 pt-2">
              {step === 'OTP_SENT' && (
                <button
                  type="button"
                  onClick={() => setStep('IDLE')}
                  disabled={saving}
                  className="px-4 py-2.5 bg-gray-100 dark:bg-surface-800 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-medium hover:bg-gray-200 dark:hover:bg-surface-700 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
              )}
              <button
                type="submit"
                disabled={saving || (!username && !email)}
                className="flex-1 py-2.5 bg-brand-600 text-white rounded-xl text-sm font-medium hover:bg-brand-700 transition-colors shadow-sm shadow-brand-500/20 disabled:opacity-50"
              >
                {saving ? 'Processing...' : step === 'IDLE' ? 'Request Update OTP' : 'Verify & Save Changes'}
              </button>
            </div>
          </form>

          <div className="hidden lg:flex flex-col justify-center items-center text-center p-6 bg-gray-50 dark:bg-surface-800 rounded-2xl border border-gray-100 dark:border-gray-700">
            <Shield className="w-12 h-12 text-brand-500 mb-4" />
            <h4 className="text-base font-semibold text-gray-900 dark:text-white mb-2">Secure Modifications</h4>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              For your security, changing core administrator credentials requires OTP verification. 
              The verification code will be sent to your <strong>currently registered email address</strong>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
