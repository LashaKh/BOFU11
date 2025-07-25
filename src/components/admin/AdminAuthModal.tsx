import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { signIn, isUserAdmin } from '../../lib/auth';
import toast from 'react-hot-toast';
import { BaseModal } from '../ui/BaseModal';

interface AdminAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdminAuthenticated: () => void;
}

export function AdminAuthModal({ isOpen, onClose, onAdminAuthenticated }: AdminAuthModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // First, try to sign in with the provided credentials
      await signIn(formData.email, formData.password);
      
      // Check if the user is an admin
      const adminStatus = await isUserAdmin();
      
      if (adminStatus) {
        // User is an admin, authenticate them
        toast.success('Admin authenticated!');
        onClose();
        
        // Small delay to ensure modal closes before navigation
        setTimeout(() => {
          navigate('/admin', { replace: true });
        }, 100);
      } else {
        // User is not an admin, sign them out and show error
        await supabase.auth.signOut();
        toast.error('This account does not have admin privileges');
      }
    } catch (error) {
      console.error('Admin auth error:', error);
      toast.error(error instanceof Error ? error.message : 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Admin Login"
      size="md"
      theme="dark"
      overlayClassName="bg-black bg-opacity-75"
      contentClassName="bg-gray-900 border-2 border-gray-600 shadow-2xl"
    >
      <div className="p-6 bg-gray-900">
        <div className="mb-4">
          <p className="text-sm text-gray-400">
            Please enter your admin credentials to access the dashboard.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="admin-email" className="block text-sm font-medium text-gray-400">
                Email
              </label>
              <input
                type="email"
                id="admin-email"
                name="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                className="mt-1 block w-full rounded-md bg-white border-2 border-primary-500/20 shadow-sm focus:border-primary-500 focus:ring focus:ring-primary-500/30 text-black placeholder:text-gray-500 py-2 px-3"
              />
            </div>
            
            <div>
              <label htmlFor="admin-password" className="block text-sm font-medium text-gray-400">
                Password
              </label>
              <input
                type="password"
                id="admin-password"
                name="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                className="mt-1 block w-full rounded-md bg-white border-2 border-primary-500/20 shadow-sm focus:border-primary-500 focus:ring focus:ring-primary-500/30 text-black placeholder:text-gray-500 py-2 px-3"
              />
            </div>
            
            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full inline-flex justify-center items-center rounded-md border-2 border-primary-500/20 shadow-glow bg-primary-400 py-2 px-4 text-sm font-medium text-white hover:bg-primary-500 hover:shadow-glow-strong hover:border-primary-500/40 transition-all"
              >
                {isLoading ? (
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-primary-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : 'Login as Admin'}
              </button>
            </div>
          </div>
        </form>
        
        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={onClose}
            className="text-sm text-white hover:text-primary-300"
          >
            Back to regular login
          </button>
        </div>
      </div>
    </BaseModal>
  );
} 