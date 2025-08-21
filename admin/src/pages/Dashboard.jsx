import { useQuery } from 'react-query'
import { contentAPI, usersAPI } from '../lib/api'
import {
  FileText,
  Users,
  Play,
  TrendingUp,
  Clock,
  Star,
  Music,
  BookOpen,
} from 'lucide-react'
import LoadingSpinner from '../components/LoadingSpinner'
import StatsCard from '../components/StatsCard'
import RecentActivity from '../components/RecentActivity'
import PopularContent from '../components/PopularContent'

const Dashboard = () => {
  const { data: contentStats, isLoading: contentLoading } = useQuery(
    'contentStats',
    contentAPI.getStats,
    {
      refetchInterval: 30000, // Refetch every 30 seconds
    }
  )

  const { data: recentContent, isLoading: recentLoading } = useQuery(
    'recentContent',
    () => contentAPI.getAll({ limit: 5, sort: 'publishedAt', order: 'desc' })
  )

  const { data: popularContent, isLoading: popularLoading } = useQuery(
    'popularContent',
    () => contentAPI.getAll({ limit: 5, sort: 'popularityScore', order: 'desc' })
  )

  if (contentLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  const stats = contentStats?.data || {}

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">
          Welcome to your admin dashboard. Here's what's happening with your content.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Content"
          value={stats.totalContent || 0}
          icon={FileText}
          color="blue"
          trend={stats.contentGrowth}
        />
        <StatsCard
          title="Total Users"
          value={stats.totalUsers || 0}
          icon={Users}
          color="green"
          trend={stats.userGrowth}
        />
        <StatsCard
          title="Total Plays"
          value={stats.totalPlays || 0}
          icon={Play}
          color="purple"
          trend={stats.playsGrowth}
        />
        <StatsCard
          title="Avg. Duration"
          value={`${Math.round((stats.avgDuration || 0) / 60)}m`}
          icon={Clock}
          color="orange"
        />
      </div>

      {/* Content Type Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Stories"
          value={stats.contentByType?.story || 0}
          icon={BookOpen}
          color="indigo"
          subtitle="Published stories"
        />
        <StatsCard
          title="Music"
          value={stats.contentByType?.music || 0}
          icon={Music}
          color="pink"
          subtitle="Music tracks"
        />
        <StatsCard
          title="Meditations"
          value={stats.contentByType?.meditation || 0}
          icon={Star}
          color="teal"
          subtitle="Meditation content"
        />
        <StatsCard
          title="Affirmations"
          value={stats.contentByType?.affirmation || 0}
          icon={TrendingUp}
          color="amber"
          subtitle="Affirmation content"
        />
      </div>

      {/* Content Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Content */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-gray-900">Recent Content</h3>
            <p className="text-sm text-gray-600">Latest published content</p>
          </div>
          <div className="card-content">
            {recentLoading ? (
              <div className="flex justify-center py-8">
                <LoadingSpinner />
              </div>
            ) : (
              <RecentActivity content={recentContent?.data?.content || []} />
            )}
          </div>
        </div>

        {/* Popular Content */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-gray-900">Popular Content</h3>
            <p className="text-sm text-gray-600">Most played content</p>
          </div>
          <div className="card-content">
            {popularLoading ? (
              <div className="flex justify-center py-8">
                <LoadingSpinner />
              </div>
            ) : (
              <PopularContent content={popularContent?.data?.content || []} />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
