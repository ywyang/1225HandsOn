
import { Link } from 'react-router-dom';
import { Layout } from '../components/Layout/Layout';
import { Card } from '../components/UI/Card';
import { Button } from '../components/UI/Button';

export function HomePage() {
  return (
    <Layout title="Hands-on Training System" showSidebar={false} maxWidth="2xl">
      <div className="min-h-[80vh] flex flex-col justify-center">
        {/* Hero Section */}
        <div className="text-center mb-16 animate-fade-in">
          <div className="mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl mb-6 shadow-strong">
              <span className="text-3xl">🎓</span>
            </div>
          </div>
          <h1 className="text-responsive-xl font-bold text-gray-900 mb-6 text-balance">
            Welcome to <span className="text-gradient">Hands-on Training System</span>
          </h1>
          <p className="text-responsive-lg text-gray-600 mb-8 max-w-3xl mx-auto text-balance">
            A comprehensive platform for programming training exercises and progress tracking
          </p>
        </div>

        {/* Portal Cards */}
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          <Card 
            className="text-center group hover:scale-[1.02] transition-all duration-300" 
            hover={true}
            gradient={true}
          >
            <div className="mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-2xl mb-6 group-hover:scale-110 transition-transform duration-300">
                <span className="text-3xl">👨‍💼</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">Administrator</h2>
              <p className="text-gray-600 mb-6 text-balance">
                Manage exercises, monitor student progress, and view comprehensive statistics
              </p>
            </div>
            <Link to="/admin/login">
              <Button variant="primary" size="lg" fullWidth>
                Administrator Login
              </Button>
            </Link>
          </Card>

          <Card 
            className="text-center group hover:scale-[1.02] transition-all duration-300" 
            hover={true}
            gradient={true}
          >
            <div className="mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-success-100 rounded-2xl mb-6 group-hover:scale-110 transition-transform duration-300">
                <span className="text-3xl">🎓</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">Student</h2>
              <p className="text-gray-600 mb-6 text-balance">
                Access hands-on exercises, track your progress, and view your results
              </p>
            </div>
            <Link to="/student/login">
              <Button variant="success" size="lg" fullWidth>
                Student Portal
              </Button>
            </Link>
          </Card>
        </div>

        {/* Features Section */}
        <Card className="text-center" glass={true}>
          <h3 className="text-2xl font-bold text-gray-900 mb-8">Platform Features</h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="group">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-primary-100 rounded-xl mb-4 group-hover:scale-110 transition-transform duration-300">
                <span className="text-2xl">📝</span>
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Exercise Management</h4>
              <p className="text-gray-600 text-sm">Create and manage hands-on programming exercises with ease</p>
            </div>
            <div className="group">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-success-100 rounded-xl mb-4 group-hover:scale-110 transition-transform duration-300">
                <span className="text-2xl">📊</span>
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Progress Tracking</h4>
              <p className="text-gray-600 text-sm">Monitor student progress and completion rates in real-time</p>
            </div>
            <div className="group sm:col-span-2 lg:col-span-1">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-warning-100 rounded-xl mb-4 group-hover:scale-110 transition-transform duration-300">
                <span className="text-2xl">🏆</span>
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Rankings & Analytics</h4>
              <p className="text-gray-600 text-sm">View rankings and detailed performance analytics</p>
            </div>
          </div>
        </Card>
      </div>
    </Layout>
  );
}