'use client';

import Login from '@/components/Login'

export default function LoginPage() {
  // Check environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  const isConfigured = supabaseUrl && supabaseKey;
  
  if (!isConfigured) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-red-100">
        <div className="max-w-md w-full mx-4">
          <div className="bg-white rounded-lg shadow-lg p-8 border-l-4 border-red-500">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0">
                <svg className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h2 className="ml-3 text-xl font-bold text-gray-900">Configuration Error</h2>
            </div>
            <p className="text-gray-700 mb-4">
              Supabase is not properly configured. Please ensure the following environment variables are set:
            </p>
            <ul className="list-disc list-inside text-sm text-gray-600 space-y-2 mb-4">
              <li className={supabaseUrl ? 'text-green-600' : 'text-red-600'}>
                NEXT_PUBLIC_SUPABASE_URL {supabaseUrl ? '✓' : '✗'}
              </li>
              <li className={supabaseKey ? 'text-green-600' : 'text-red-600'}>
                NEXT_PUBLIC_SUPABASE_ANON_KEY {supabaseKey ? '✓' : '✗'}
              </li>
            </ul>
            <p className="text-sm text-gray-600">
              Check your <code className="bg-gray-100 px-2 py-1 rounded">.env.local</code> file or Vercel environment variables.
            </p>
          </div>
        </div>
      </div>
    );
  }
  
  return <Login />
}
