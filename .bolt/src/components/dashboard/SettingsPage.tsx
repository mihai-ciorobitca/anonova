import React, { useState, useRef, useEffect } from 'react';
import { Shield, Key, Lock, Save, User, Mail, Camera, Pencil, Clock, Loader, Check, X } from 'lucide-react';
import Button from '../Button';
import GlitchText from '../GlitchText';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

// Plan ID to name mapping
const PLAN_NAMES = {
  'b656d741-4e93-474a-81ee-373f3e1af15e': 'Free Plan',
  '4c8dfd01-a537-4038-87aa-5ed665e4a4fb': 'Pro Plan',
  'f224bb82-2ada-494b-9f04-75b5191f11a2': 'Enterprise Plan'
} as const;

const SettingsPage = () => {
  const { user } = useAuth();
  const [twoFactorMethod, setTwoFactorMethod] = useState('authenticator');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isChangingEmail, setIsChangingEmail] = useState(false);
  const [verificationCode, setVerificationCode] = useState(['', '', '', '', '', '']);
  const [newEmail, setNewEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showVerification, setShowVerification] = useState(false);
  const [userPlan, setUserPlan] = useState<string>('Loading...');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Profile data state
  const [profileData, setProfileData] = useState({
    firstName: user?.user_metadata?.first_name || '',
    lastName: user?.user_metadata?.last_name || '',
    email: user?.email || '',
    avatar: user?.user_metadata?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop&crop=faces',
    joinDate: new Date(user?.created_at || Date.now()).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }),
    lastLogin: 'Today at 2:30 PM',
    timezone: 'UTC-5 (Eastern Time)',
    role: 'Loading...' // Will be updated when plan is fetched
  });

  // Fetch user's plan when component mounts
  useEffect(() => {
    const fetchUserPlan = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('users')
          .select('plan_id')
          .eq('id', user.id)
          .single();

        if (error) throw error;

        const planName = data.plan_id ? PLAN_NAMES[data.plan_id as keyof typeof PLAN_NAMES] : 'Free Plan';
        setUserPlan(planName);
        setProfileData(prev => ({
          ...prev,
          role: `${planName} Member`
        }));
      } catch (err) {
        console.error('Error fetching user plan:', err);
        setUserPlan('Free Plan');
        setProfileData(prev => ({
          ...prev,
          role: 'Free Plan Member'
        }));
      }
    };

    fetchUserPlan();
  }, [user]);

  // Update profile data when user metadata changes
  useEffect(() => {
    if (user) {
      setProfileData(prev => ({
        ...prev,
        firstName: user.user_metadata?.first_name || '',
        lastName: user.user_metadata?.last_name || '',
        email: user.email || '',
        avatar: user.user_metadata?.avatar_url || prev.avatar
      }));
    }
  }, [user]);

  const handleProfileUpdate = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          first_name: profileData.firstName,
          last_name: profileData.lastName
        }
      });

      if (error) throw error;
      setSuccess('Profile updated successfully!');
      setIsEditingProfile(false);
    } catch (err) {
      setError('Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Create a unique file name
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Math.random()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      // Delete old avatar if exists
      if (user.user_metadata?.avatar_url) {
        const oldPath = user.user_metadata.avatar_url.split('/').pop();
        if (oldPath) {
          await supabase.storage
            .from('avatars')
            .remove([`avatars/${oldPath}`]);
        }
      }

      // Upload new file
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Update user metadata with new avatar URL
      const { data: userData, error: updateError } = await supabase.auth.updateUser({
        data: { avatar_url: publicUrl }
      });

      if (updateError) throw updateError;

      // Update local state with new avatar
      if (userData.user) {
        setProfileData(prev => ({
          ...prev,
          avatar: userData.user.user_metadata.avatar_url
        }));
      }

      setSuccess('Profile photo updated successfully!');
    } catch (err) {
      console.error('Error uploading photo:', err);
      setError('Failed to upload photo. Please try again.');
    } finally {
      setLoading(false);
      // Clear the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleEmailChange = async () => {
    if (!newEmail) return;
    
    setLoading(true);
    setError('');
    
    try {
      const { error } = await supabase.auth.updateUser({ email: newEmail });
      
      if (error) throw error;
      
      setShowVerification(true);
      setSuccess('Verification email sent to your new email address.');
    } catch (error: any) {
      setError(error.message || 'Failed to update email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerificationSubmit = async () => {
    setLoading(true);
    setError('');
    
    try {
      // In a real app, you would verify the code here
      const code = verificationCode.join('');
      if (code === '123456') { // Mock verification
        setProfileData(prev => ({ ...prev, email: newEmail }));
        setIsChangingEmail(false);
        setShowVerification(false);
        setSuccess('Email updated successfully!');
        
        // Reset states
        setNewEmail('');
        setVerificationCode(['', '', '', '', '', '']);
      } else {
        setError('Invalid verification code. Please try again.');
      }
    } catch (error) {
      setError('Failed to verify code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (index: number, value: string) => {
    if (value.length > 1) return;
    
    const newCode = [...verificationCode];
    newCode[index] = value;
    setVerificationCode(newCode);

    if (value && index < 5) {
      const nextInput = document.getElementById(`verify-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !verificationCode[index] && index > 0) {
      const prevInput = document.getElementById(`verify-${index - 1}`);
      prevInput?.focus();
    }
  };

  return (
    <div className="space-y-8">
      <div className="mb-8">
        <GlitchText 
          text="Security & Settings"
          className="text-4xl font-bold mb-4"
        />
        <p className="text-gray-400">Manage your account security and preferences</p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* My Profile */}
        <div className="space-y-6">
          <div className="bg-black/40 backdrop-blur-sm border border-[#0F0]/20 rounded-xl p-6">
            <h3 className="text-xl font-bold text-[#0F0] mb-6 flex items-center gap-2">
              <User className="w-5 h-5" />
              My Profile
            </h3>

            <div className="flex items-center gap-6 mb-8">
              <div className="relative">
                <img
                  src={profileData.avatar}
                  alt="Profile"
                  className="w-20 h-20 rounded-full object-cover border-2 border-[#0F0]/50"
                />
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                />
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 p-1.5 bg-black/80 border border-[#0F0]/50 rounded-full text-[#0F0] hover:bg-[#0F0]/10 transition-colors"
                  disabled={loading}
                >
                  {loading ? (
                    <Loader className="w-4 h-4 animate-spin" />
                  ) : (
                    <Camera className="w-4 h-4" />
                  )}
                </button>
              </div>
              <div>
                <h4 className="text-lg font-semibold">
                  {profileData.firstName} {profileData.lastName}
                </h4>
                <p className="text-gray-400">{profileData.role}</p>
              </div>
            </div>

            {/* Success Message */}
            {success && (
              <div className="flex items-center gap-2 text-[#0F0] bg-[#0F0]/10 p-4 rounded-lg mb-4">
                <Check className="w-5 h-5" />
                <span>{success}</span>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="flex items-center gap-2 text-red-500 bg-red-500/10 p-4 rounded-lg mb-4">
                <X className="w-5 h-5" />
                <span>{error}</span>
              </div>
            )}

            {isEditingProfile ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">First Name</label>
                    <input
                      type="text"
                      value={profileData.firstName}
                      onChange={(e) => setProfileData(prev => ({ ...prev, firstName: e.target.value }))}
                      className="w-full bg-black/50 border border-[#0F0]/30 rounded-lg py-3 px-4 text-white placeholder-gray-500 focus:border-[#0F0] focus:ring-1 focus:ring-[#0F0] transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Last Name</label>
                    <input
                      type="text"
                      value={profileData.lastName}
                      onChange={(e) => setProfileData(prev => ({ ...prev, lastName: e.target.value }))}
                      className="w-full bg-black/50 border border-[#0F0]/30 rounded-lg py-3 px-4 text-white placeholder-gray-500 focus:border-[#0F0] focus:ring-1 focus:ring-[#0F0] transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">Email</label>
                  <div className="flex gap-4">
                    <input
                      type="email"
                      value={user?.email || ''}
                      disabled
                      className="flex-1 bg-black/50 border border-[#0F0]/30 rounded-lg py-3 px-4 text-gray-400 cursor-not-allowed"
                    />
                    <Button 
                      variant="secondary"
                      onClick={() => setIsChangingEmail(true)}
                    >
                      Change Email
                    </Button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">Timezone</label>
                  <select
                    value={profileData.timezone}
                    onChange={(e) => setProfileData(prev => ({ ...prev, timezone: e.target.value }))}
                    className="w-full bg-black/50 border border-[#0F0]/30 rounded-lg py-3 px-4 text-white focus:border-[#0F0] focus:ring-1 focus:ring-[#0F0] transition-all"
                  >
                    <option value="UTC-5 (Eastern Time)">UTC-5 (Eastern Time)</option>
                    <option value="UTC-6 (Central Time)">UTC-6 (Central Time)</option>
                    <option value="UTC-7 (Mountain Time)">UTC-7 (Mountain Time)</option>
                    <option value="UTC-8 (Pacific Time)">UTC-8 (Pacific Time)</option>
                  </select>
                </div>

                <div className="flex gap-4">
                  <Button 
                    className="flex-1" 
                    onClick={handleProfileUpdate}
                    disabled={loading}
                  >
                    {loading ? (
                      <Loader className="w-5 h-5 animate-spin" />
                    ) : (
                      'Save Changes'
                    )}
                  </Button>
                  <Button 
                    variant="secondary" 
                    className="flex-1"
                    onClick={() => setIsEditingProfile(false)}
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 border border-[#0F0]/20 rounded-lg">
                    <div className="text-sm text-gray-400 mb-1">Member Since</div>
                    <div className="font-semibold">{profileData.joinDate}</div>
                  </div>
                  <div className="p-4 border border-[#0F0]/20 rounded-lg">
                    <div className="text-sm text-gray-400 mb-1">Last Login</div>
                    <div className="font-semibold">{profileData.lastLogin}</div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border border-[#0F0]/20 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Mail className="w-5 h-5 text-[#0F0]" />
                      <div>
                        <div className="text-sm text-gray-400">Email</div>
                        <div className="font-semibold">{user?.email}</div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-4 border border-[#0F0]/20 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Clock className="w-5 h-5 text-[#0F0]" />
                      <div>
                        <div className="text-sm text-gray-400">Timezone</div>
                        <div className="font-semibold">{profileData.timezone}</div>
                      </div>
                    </div>
                  </div>
                </div>

                <Button 
                  variant="secondary"
                  className="w-full"
                  onClick={() => setIsEditingProfile(true)}
                >
                  <Pencil className="w-4 h-4 mr-2" />
                  Edit Profile
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Security Settings */}
        <div className="space-y-6">
          <div className="bg-black/40 backdrop-blur-sm border border-[#0F0]/20 rounded-xl p-6">
            <h3 className="text-xl font-bold text-[#0F0] mb-6 flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Security Settings
            </h3>

            {/* Password Change */}
            <div className="space-y-4 mb-6">
              <label className="block text-sm text-gray-400">Change Password</label>
              <input
                type="password"
                placeholder="Current Password"
                className="w-full bg-black/50 border border-[#0F0]/30 rounded-lg py-3 px-4 text-white placeholder-gray-500 focus:border-[#0F0] focus:ring-1 focus:ring-[#0F0] transition-all"
              />
              <input
                type="password"
                placeholder="New Password"
                className="w-full bg-black/50 border border-[#0F0]/30 rounded-lg py-3 px-4 text-white placeholder-gray-500 focus:border-[#0F0] focus:ring-1 focus:ring-[#0F0] transition-all"
              />
              <input
                type="password"
                placeholder="Confirm New Password"
                className="w-full bg-black/50 border border-[#0F0]/30 rounded-lg py-3 px-4 text-white placeholder-gray-500 focus:border-[#0F0] focus:ring-1 focus:ring-[#0F0] transition-all"
              />
            </div>

            {/* 2FA Settings */}
            <div className="space-y-4">
              <label className="block text-sm text-gray-400">Two-Factor Authentication</label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setTwoFactorMethod('authenticator')}
                  className={`flex items-center gap-2 p-3 rounded-lg border transition-all ${
                    twoFactorMethod === 'authenticator'
                      ? 'border-[#0F0] bg-[#0F0]/10'
                      : 'border-gray-700 hover:border-[#0F0]/50'
                  }`}
                >
                  <Key className="w-4 h-4" />
                  <span>Authenticator</span>
                </button>
                <button
                  onClick={() => setTwoFactorMethod('sms')}
                  className={`flex items-center gap-2 p-3 rounded-lg border transition-all ${
                    twoFactorMethod === 'sms'
                      ? 'border-[#0F0] bg-[#0F0]/10'
                      : 'border-gray-700 hover:border-[#0F0]/50'
                  }`}
                >
                  <Shield className="w-4 h-4" />
                  <span>SMS</span>
                </button>
              </div>
            </div>

            {/* Save Button */}
            <Button className="w-full mt-6">
              <Save className="w-4 h-4 mr-2" />
              Save Security Settings
            </Button>
          </div>
        </div>
      </div>

      {/* Email Change Modal */}
      {isChangingEmail && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div 
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => {
              if (!showVerification) {
                setIsChangingEmail(false);
                setNewEmail('');
                setError('');
              }
            }}
          />
          
          <div className="relative bg-black/90 border border-[#0F0]/30 rounded-xl p-8 max-w-md w-full mx-4">
            <button
              onClick={() => {
                if (!showVerification) {
                  setIsChangingEmail(false);
                  setNewEmail('');
                  setError('');
                }
              }}
              className="absolute top-4 right-4 text-gray-400 hover:text-[#0F0] transition-colors"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="mb-6">
              <h3 className="text-2xl font-bold text-[#0F0] mb-2">
                {showVerification ? 'Verify New Email' : 'Change Email Address'}
              </h3>
              <p className="text-gray-400">
                {showVerification 
                  ? 'Enter the verification code sent to your new email address'
                  : 'Enter your new email address to receive a verification code'}
              </p>
            </div>

            {showVerification ? (
              <div className="space-y-6">
                {/* Success Message */}
                {success && (
                  <div className="flex items-center gap-2 text-[#0F0] bg-[#0F0]/10 p-4 rounded-lg">
                    <Check className="w-5 h-5" />
                    <span>{success}</span>
                  </div>
                )}

                {/* Error Message */}
                {error && (
                  <div className="flex items-center gap-2 text-red-500 bg-red-500/10 p-4 rounded-lg">
                    <X className="w-5 h-5" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Code Input Grid */}
                <div className="grid grid-cols-6 gap-3">
                  {verificationCode.map((digit, index) => (
                    <input
                      key={index}
                      id={`verify-${index}`}
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleInputChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      className="w-full h-14 bg-black/50 border border-[#0F0]/30 rounded-lg text-center text-2xl text-[#0F0] font-mono
                        focus:border-[#0F0] focus:ring-1 focus:ring-[#0F0] transition-all"
                    />
                  ))}
                </div>

                <Button
                  className="w-full"
                  onClick={handleVerificationSubmit}
                  disabled={loading || verificationCode.some(digit => !digit)}
                >
                  {loading ? (
                    <Loader className="w-5 h-5 animate-spin" />
                  ) : (
                    'Verify Email'
                  )}
                </Button>

                <div className="text-center">
                  <button
                    onClick={handleEmailChange}
                    disabled={loading}
                    className="text-[#0F0]/70 hover:text-[#0F0] transition-colors"
                  >
                    Resend verification code
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Error Message */}
                {error && (
                  <div className="flex items-center gap-2 text-red-500 bg-red-500/10 p-4 rounded-lg">
                    <X className="w-5 h-5" />
                    <span>{error}</span>
                  </div>
                )}

                <div>
                  <label className="block text-sm text-gray-400 mb-2">New Email Address</label>
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="w-full bg-black/50 border border-[#0F0]/30 rounded-lg py-3 px-4 text-white placeholder-gray-500 focus:border-[#0F0] focus:ring-1 focus:ring-[#0F0] transition-all"
                    placeholder="Enter your new email"
                  />
                </div>

                <Button
                  className="w-full"
                  onClick={handleEmailChange}
                  disabled={loading || !newEmail}
                >
                  {loading ? (
                    <Loader className="w-5 h-5 animate-spin" />
                  ) : (
                    'Send Verification Code'
                  )}
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsPage;
