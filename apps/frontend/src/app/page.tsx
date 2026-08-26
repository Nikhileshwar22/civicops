import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="text-center space-y-6 max-w-2xl px-4">
        <div className="flex items-center justify-center space-x-3 mb-8">
          <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-white text-2xl font-bold">C</span>
          </div>
          <h1 className="text-4xl font-bold text-gray-900">CivicOps</h1>
        </div>

        <p className="text-xl text-gray-600">
          Multi-Tenant Civic Operations & Complaint Management Platform
        </p>

        <p className="text-gray-500">
          Report civic issues, track complaints, and manage municipal operations
          efficiently across your organization.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
          <Link
            href="/login"
            className="inline-flex items-center justify-center rounded-md text-sm font-medium h-11 px-8 bg-primary text-white hover:bg-primary/90 transition-colors"
          >
            Sign In
          </Link>
          <Link
            href="/register"
            className="inline-flex items-center justify-center rounded-md text-sm font-medium h-11 px-8 border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Register as Citizen
          </Link>
        </div>

        <div className="pt-12 grid grid-cols-1 sm:grid-cols-3 gap-6 text-left">
          <div className="p-4 bg-white rounded-lg shadow-sm border">
            <h3 className="font-semibold text-gray-900 mb-2">Report Issues</h3>
            <p className="text-sm text-gray-500">
              Easily report civic problems with photos and location tracking
            </p>
          </div>
          <div className="p-4 bg-white rounded-lg shadow-sm border">
            <h3 className="font-semibold text-gray-900 mb-2">Track Progress</h3>
            <p className="text-sm text-gray-500">
              Real-time updates on complaint status and resolution
            </p>
          </div>
          <div className="p-4 bg-white rounded-lg shadow-sm border">
            <h3 className="font-semibold text-gray-900 mb-2">AI-Powered</h3>
            <p className="text-sm text-gray-500">
              Automatic classification and intelligent routing of complaints
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
