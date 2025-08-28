import React, { useEffect, useState } from 'react';
import { 
  Users, 
  FileText, 
  TrendingUp, 
  Activity,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { apiService } from '../services/api';
import { API_ENDPOINTS } from '../constants/api';
import { OverviewStats } from '../types/api';
import LoadingSpinner from '../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: React.ElementType;
  color: string;
}

function StatCard({ title, value, change, icon: Icon, color }: StatCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
          {change !== undefined && (
            <div className="flex items-center mt-2">
              {change >= 0 ? (
                <ArrowUpRight className="h-4 w-4 text-green-500" />
              ) : (
                <ArrowDownRight className="h-4 w-4 text-red-500" />
              )}
              <span
                className={`text-sm font-medium ml-1 ${
                  change >= 0 ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {Math.abs(change)}%
              </span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-full ${color}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await apiService.get<OverviewStats>(
        API_ENDPOINTS.ADMIN.STATS.OVERVIEW
      );
      
      if (response.success) {
        setStats(response.data);
      } else {
        toast.error('Failed to load dashboard statistics');
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
      toast.error('Failed to load dashboard statistics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Welcome to the Kids Stories admin dashboard</p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Users"
          value={stats?.totalUsers || 0}
          icon={Users}
          color="bg-blue-500"
        />
        <StatCard
          title="Total Content"
          value={stats?.totalContent || 0}
          icon={FileText}
          color="bg-green-500"
        />
        <StatCard
          title="Active Users"
          value={stats?.activeUsers || 0}
          icon={Activity}
          color="bg-purple-500"
        />
        <StatCard
          title="Total Kids"
          value={stats?.totalKids || 0}
          icon={TrendingUp}
          color="bg-orange-500"
        />
      </div>

      {/* Content breakdown */}
      {stats && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Content by type */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Content by Type
            </h3>
            <div className="space-y-3">
              {Object.entries(stats.contentByType).map(([type, count]) => (
                <div key={type} className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-600 capitalize">
                    {type}
                  </span>
                  <span className="text-sm font-bold text-gray-900">{count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Users by plan */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Users by Plan
            </h3>
            <div className="space-y-3">
              {Object.entries(stats.usersByPlan).map(([plan, count]) => (
                <div key={plan} className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-600 capitalize">
                    {plan}
                  </span>
                  <span className="text-sm font-bold text-gray-900">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Recent activity */}
      {stats && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent content */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Recent Content
            </h3>
            <div className="space-y-3">
              {stats.recentContent.map((content) => (
                <div key={content.id} className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {content.title}
                    </p>
                    <p className="text-xs text-gray-500 capitalize">
                      {content.type}
                    </p>
                  </div>
                  <span className="text-xs text-gray-500">
                    {new Date(content.createdAt).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent users */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Recent Users
            </h3>
            <div className="space-y-3">
              {stats.recentUsers.map((user) => (
                <div key={user.id} className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {user.name || user.email}
                    </p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                  </div>
                  <span className="text-xs text-gray-500">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
