'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { User, Building2, Mail, Phone, Lock } from 'lucide-react';

type ProfileData = {
  adminUser: {
    id: string;
    full_name: string;
    email: string;
    phone: string | null;
    role: string;
  };
  company: {
    id: string;
    name: string;
    slug: string;
  };
};

export default function ProfilePage() {
  const supabase = createClient();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [passwordModal, setPasswordModal] = useState(false);
  const [form, setForm] = useState({
    full_name: '',
    phone: '',
    company_name: '',
  });
  const [passwordForm, setPasswordForm] = useState({
    newPassword: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    setLoading(true);
    const response = await fetch('/api/profile');
    if (response.ok) {
      const data = await response.json();
      setProfile(data);
      setForm({
        full_name: data.adminUser.full_name || '',
        phone: data.adminUser.phone || '',
        company_name: data.company.name || '',
      });
    }
    setLoading(false);
  }

  async function handleSave() {
    setSaving(true);
    setError('');
    setSuccess('');

    const response = await fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });

    if (response.ok) {
      setSuccess('Profile updated successfully!');
      setEditMode(false);
      await loadProfile();
      setTimeout(() => setSuccess(''), 3000);
    } else {
      const data = await response.json();
      setError(data.error || 'Failed to update profile');
    }

    setSaving(false);
  }

  async function handlePasswordChange() {
    setError('');
    setSuccess('');

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    const { error } = await supabase.auth.updateUser({ 
      password: passwordForm.newPassword 
    });

    if (error) {
      setError(error.message);
    } else {
      setSuccess('Password changed successfully!');
      setPasswordModal(false);
      setPasswordForm({ newPassword: '', confirmPassword: '' });
      setTimeout(() => setSuccess(''), 3000);
    }
  }

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-gray-500">Loading profile...</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-red-500">Failed to load profile</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Profile & Settings</h1>
        {!editMode ? (
          <Button onClick={() => setEditMode(true)}>Edit Profile</Button>
        ) : (
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => {
              setEditMode(false);
              setForm({
                full_name: profile.adminUser.full_name || '',
                phone: profile.adminUser.phone || '',
                company_name: profile.company.name || '',
              });
            }}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        )}
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700 dark:bg-green-950 dark:text-green-300">
          {success}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Personal Information */}
        <Card>
          <CardTitle>Personal Information</CardTitle>
          <div className="mt-4 space-y-4">
            <div>
              <label className="mb-1 flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                <User className="h-4 w-4" />
                Full Name
              </label>
              {editMode ? (
                <input
                  value={form.full_name}
                  onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800"
                />
              ) : (
                <p className="text-sm text-gray-900 dark:text-gray-100">{profile.adminUser.full_name}</p>
              )}
            </div>
            <div>
              <label className="mb-1 flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                <Mail className="h-4 w-4" />
                Email
              </label>
              <p className="text-sm text-gray-900 dark:text-gray-100">{profile.adminUser.email}</p>
              <p className="mt-1 text-xs text-gray-500">Email cannot be changed</p>
            </div>
            <div>
              <label className="mb-1 flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                <Phone className="h-4 w-4" />
                Phone
              </label>
              {editMode ? (
                <input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800"
                  placeholder="+1 (555) 000-0000"
                />
              ) : (
                <p className="text-sm text-gray-900 dark:text-gray-100">
                  {profile.adminUser.phone || 'Not set'}
                </p>
              )}
            </div>
          </div>
        </Card>

        {/* Company Information */}
        <Card>
          <CardTitle>Company Information</CardTitle>
          <div className="mt-4 space-y-4">
            <div>
              <label className="mb-1 flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                <Building2 className="h-4 w-4" />
                Company Name
              </label>
              {editMode ? (
                <input
                  value={form.company_name}
                  onChange={(e) => setForm({ ...form, company_name: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800"
                />
              ) : (
                <p className="text-sm text-gray-900 dark:text-gray-100">{profile.company.name}</p>
              )}
            </div>
            <div>
              <label className="mb-1 flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                Company Slug
              </label>
              <p className="text-sm text-gray-900 dark:text-gray-100">{profile.company.slug}</p>
              <p className="mt-1 text-xs text-gray-500">Slug cannot be changed</p>
            </div>
            <div>
              <label className="mb-1 flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                Role
              </label>
              <p className="text-sm capitalize text-gray-900 dark:text-gray-100">
                {profile.adminUser.role}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Security */}
      <Card>
        <CardTitle>Security</CardTitle>
        <div className="mt-4">
          <div className="flex items-center justify-between rounded-lg border border-gray-200 p-4 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-100 p-2 dark:bg-blue-900">
                <Lock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Password</p>
                <p className="text-xs text-gray-500">Change your password</p>
              </div>
            </div>
            <Button variant="outline" onClick={() => setPasswordModal(true)}>
              Change Password
            </Button>
          </div>
        </div>
      </Card>

      {/* Password Change Modal */}
      <Modal open={passwordModal} onClose={() => setPasswordModal(false)} title="Change Password">
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              New Password
            </label>
            <input
              type="password"
              value={passwordForm.newPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800"
              placeholder="Minimum 8 characters"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Confirm Password
            </label>
            <input
              type="password"
              value={passwordForm.confirmPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800"
              placeholder="Re-enter password"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setPasswordModal(false)}>
              Cancel
            </Button>
            <Button onClick={handlePasswordChange}>
              Update Password
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
