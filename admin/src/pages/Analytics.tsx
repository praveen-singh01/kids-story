import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  Users,
  FileText,
  Activity,
  Clock,
  Star,
  Play,
} from 'lucide-react';
import { apiService } from '../services/api';
import { API_ENDPOINTS } from '../constants/api';
import LoadingSpinner from '../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

interface ContentStats {
  totalContent: number;
  contentByType: Record<string, number>;
  contentByAgeRange: Record<string, number>;
  featuredContent: number;
  averageDuration: number;
  totalPlays: number;
}

interface UserStats {
  totalUsers: number;
  activeUsers: number;
  usersByPlan: Record<string, number>;
  newUsersThisMonth: number;
  userGrowthRate: number;
}

interface EngagementStats {
  totalPlays: number;
  averageSessionDuration: number;
  topContent: Array<{
    id: string;
    title: string;
    plays: number;
    type: string;
  }>;
  engagementByType: Record<string, number>;
}

export default function Analytics() {
  const [contentStats, setContentStats] = useState<ContentStats | null>(null);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [engagementStats, setEngagementStats] = useState<EngagementStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      
      const [contentResponse, userResponse, engagementResponse] = await Promise.all([
        apiService.get(API_ENDPOINTS.ADMIN.STATS.CONTENT),
        apiService.get(API_ENDPOINTS.ADMIN.STATS.USERS),
        apiService.get(API_ENDPOINTS.ADMIN.STATS.ENGAGEMENT),
      ]);

      if (contentResponse.success) {
        setContentStats(contentResponse.data);
      }
      
      if (userResponse.success) {
        setUserStats(userResponse.data);
      }
      
      if (engagementResponse.success) {
        setEngagementStats(engagementResponse.data);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast.error('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m ${seconds % 60}s`;
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
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
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
        <p className="text-gray-600">Insights into content performance and user engagement</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Content</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {contentStats?.totalContent || 0}
              </p>
            </div>
            <div className="p-3 rounded-full bg-blue-500">
              <FileText className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Users</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {userStats?.totalUsers || 0}
              </p>
            </div>
            <div className="p-3 rounded-full bg-green-500">
              <Users className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Plays</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {formatNumber(engagementStats?.totalPlays || 0)}
              </p>
            </div>
            <div className="p-3 rounded-full bg-purple-500">
              <Play className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Users</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {userStats?.activeUsers || 0}
              </p>
            </div>
            <div className="p-3 rounded-full bg-orange-500">
              <Activity className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts and Breakdowns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Content by Type */}
        {contentStats && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <BarChart3 className="h-5 w-5 mr-2" />
              Content by Type
            </h3>
            <div className="space-y-3">
              {Object.entries(contentStats.contentByType).map(([type, count]) => (
                <div key={type} className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-600 capitalize">
                    {type}
                  </span>
                  <div className="flex items-center">
                    <div className="w-24 bg-gray-200 rounded-full h-2 mr-3">
                      <div
                        className="bg-primary-600 h-2 rounded-full"
                        style={{
                          width: `${(count / Math.max(...Object.values(contentStats.contentByType))) * 100}%`,
                        }}
                      />
                    </div>
                    <span className="text-sm font-bold text-gray-900 w-8 text-right">
                      {count}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Users by Plan */}
        {userStats && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <TrendingUp className="h-5 w-5 mr-2" />
              Users by Plan
            </h3>
            <div className="space-y-3">
              {Object.entries(userStats.usersByPlan).map(([plan, count]) => (
                <div key={plan} className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-600 capitalize">
                    {plan}
                  </span>
                  <div className="flex items-center">
                    <div className="w-24 bg-gray-200 rounded-full h-2 mr-3">
                      <div
                        className="bg-green-600 h-2 rounded-full"
                        style={{
                          width: `${(count / Math.max(...Object.values(userStats.usersByPlan))) * 100}%`,
                        }}
                      />
                    </div>
                    <span className="text-sm font-bold text-gray-900 w-8 text-right">
                      {count}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Content Performance */}
        {contentStats && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Star className="h-5 w-5 mr-2" />
              Content Performance
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Featured Content</span>
                <span className="text-sm font-semibold text-gray-900">
                  {contentStats.featuredContent}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Average Duration</span>
                <span className="text-sm font-semibold text-gray-900">
                  {formatDuration(contentStats.averageDuration || 0)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Total Plays</span>
                <span className="text-sm font-semibold text-gray-900">
                  {formatNumber(contentStats.totalPlays || 0)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Top Content */}
        {engagementStats && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Clock className="h-5 w-5 mr-2" />
              Top Performing Content
            </h3>
            <div className="space-y-3">
              {engagementStats.topContent.slice(0, 5).map((content, index) => (
                <div key={content.id} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <span className="text-xs font-medium text-gray-500 w-4">
                      {index + 1}
                    </span>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {content.title}
                      </p>
                      <p className="text-xs text-gray-500 capitalize">
                        {content.type}
                      </p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-gray-900">
                    {formatNumber(content.plays)} plays
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
