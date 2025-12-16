import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../../components/Layout/Layout';
import { Card } from '../../components/UI/Card';
import { Button } from '../../components/UI/Button';
import { ErrorMessage } from '../../components/UI/ErrorMessage';
import { useAuth } from '../../contexts/AuthContext';

export function StudentLoginPage() {
  const [name, setName] = useState('');
  const [isLookup, setIsLookup] = useState(false);
  const { state, login, clearError } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      return;
    }

    try {
      await login({ name });
      navigate('/student/dashboard');
    } catch (error) {
      // Error is handled by the auth context
    }
  };

  return (
    <Layout title="Student Portal" showSidebar={false}>
      <div className="max-w-md mx-auto">
        <Card title={isLookup ? "Access Key Lookup" : "Student Registration"}>
          <div className="mb-4">
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                type="button"
                onClick={() => setIsLookup(false)}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  !isLookup
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Register
              </button>
              <button
                type="button"
                onClick={() => setIsLookup(true)}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  isLookup
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Lookup Key
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {state.error && (
              <ErrorMessage 
                message={state.error} 
                onDismiss={clearError}
              />
            )}
            
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Your Name
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Enter your full name"
                required
              />
            </div>

            <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-md">
              {isLookup ? (
                <>
                  <strong>Access Key Lookup:</strong> Enter your name to retrieve your existing access key.
                </>
              ) : (
                <>
                  <strong>Registration:</strong> Enter your name to get a unique access key for the training exercises.
                </>
              )}
            </div>

            <Button
              type="submit"
              variant="success"
              size="lg"
              className="w-full"
              loading={state.loading}
            >
              {isLookup ? 'Lookup Access Key' : 'Register & Get Access Key'}
            </Button>
          </form>

          <div className="mt-4 text-center">
            <a
              href="/"
              className="text-sm text-green-600 hover:text-green-800"
            >
              ← Back to Home
            </a>
          </div>
        </Card>
      </div>
    </Layout>
  );
}