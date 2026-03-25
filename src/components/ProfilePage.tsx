// Created: 2025-12-22
// Last updated: 2026-02-13

import { useState, useEffect } from 'react';
import { User, Mail, Loader2, Save, ArrowLeft, Trash2, AlertTriangle, ShieldQuestion } from 'lucide-react';
import TimezonePicker from './TimezonePicker';
import { DeleteConfirmModal, DeletionScheduledView } from './profile';
import SecurityQuestionModal from './SecurityQuestionModal';
import { supabase } from '../lib/supabase';

interface UserProfile {
  id: string;
  display_name: string;
  email: string;
  timezone: string;
  security_question: string;
}

interface ProfilePageProps {
  onBack: () => void;
}

export default function ProfilePage({ onBack }: ProfilePageProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [timezone, setTimezone] = useState('UTC');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [deletionScheduledFor, setDeletionScheduledFor] = useState<string | null>(null);
  const [showSecurityModal, setShowSecurityModal] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    try {
      setIsLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('Not authenticated');
        return;
      }

      const { data, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (profileError) throw profileError;

      if (data) {
        setProfile(data);
        setDisplayName(data.display_name);
        setTimezone(data.timezone);
      }
    } catch (err) {
      console.error('Error loading profile:', err);
      setError('Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setIsSaving(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Not authenticated');
      }

      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({
          display_name: displayName.trim(),
          timezone: timezone,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      setSuccessMessage('Profile updated successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);

      await loadProfile();
    } catch (err) {
      console.error('Error updating profile:', err);
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeleteAccount() {
    if (deleteConfirmText !== 'DELETE') {
      return;
    }

    setIsDeleting(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-account`;
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete account');
      }

      const purgeDate = new Date(result.purge_at);
      setDeletionScheduledFor(purgeDate.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
      }));

      setShowDeleteConfirm(false);
      setDeleteConfirmText('');
    } catch (err) {
      console.error('Error deleting account:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete account');
      setShowDeleteConfirm(false);
    } finally {
      setIsDeleting(false);
    }
  }

  async function handleAcknowledgeDeletion() {
    await supabase.auth.signOut();
    window.location.href = '/signin';
  }

  function handleCancelDelete() {
    setShowDeleteConfirm(false);
    setDeleteConfirmText('');
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-2" />
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (deletionScheduledFor) {
    return (
      <DeletionScheduledView
        scheduledDate={deletionScheduledFor}
        onAcknowledge={handleAcknowledgeDeletion}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back
        </button>

        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-6">
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              <User className="w-7 h-7" />
              My Profile
            </h1>
            <p className="text-blue-100 mt-1">Manage your account settings</p>
          </div>

          <div className="p-8">
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                {error}
              </div>
            )}

            {successMessage && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
                {successMessage}
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Mail className="w-4 h-4 inline mr-2" />
                  Email
                </label>
                <input
                  type="email"
                  value={profile?.email || ''}
                  disabled
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
                />
                <p className="mt-1 text-sm text-gray-500">
                  Email cannot be changed
                </p>
              </div>

              <div>
                <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-2">
                  <User className="w-4 h-4 inline mr-2" />
                  Display Name
                </label>
                <input
                  id="displayName"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Enter your display name"
                  required
                  maxLength={50}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>

              <TimezonePicker
                value={timezone}
                onChange={setTimezone}
              />

              <div className="pt-6 border-t border-gray-200">
                <h3 className="text-base font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <ShieldQuestion className="w-5 h-5 text-blue-600" />
                  Security Settings
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Your security question is used to verify your identity for password recovery.
                </p>
                <button
                  type="button"
                  onClick={() => setShowSecurityModal(true)}
                  className="px-6 py-3 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg font-medium transition-colors flex items-center gap-2"
                >
                  <ShieldQuestion className="w-5 h-5" />
                  Manage Security Question
                </button>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </form>

            <div className="mt-8 pt-8 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-orange-600" />
                Danger Zone
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Permanently delete your account and all associated data. This action cannot be undone.
              </p>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="px-6 py-3 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                <Trash2 className="w-5 h-5" />
                Delete My Account
              </button>
            </div>
          </div>
        </div>

        <DeleteConfirmModal
          isOpen={showDeleteConfirm}
          isDeleting={isDeleting}
          confirmText={deleteConfirmText}
          onConfirmTextChange={setDeleteConfirmText}
          onConfirm={handleDeleteAccount}
          onCancel={handleCancelDelete}
        />

        <SecurityQuestionModal
          isOpen={showSecurityModal}
          currentQuestion={profile?.security_question || ''}
          onClose={() => setShowSecurityModal(false)}
          onSuccess={() => {
            setSuccessMessage('Security question updated successfully!');
            setTimeout(() => setSuccessMessage(null), 3000);
            loadProfile();
          }}
        />
      </div>
    </div>
  );
}
