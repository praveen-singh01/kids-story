import { useQuery } from 'react-query'
import { contentAPI } from '../lib/api'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts'
import { TrendingUp, Users, Play, Clock } from 'lucide-react'
import LoadingSpinner from '../components/LoadingSpinner'
import StatsCard from '../components/StatsCard'

const COLORS = ['#0ea5e9', '#a855f7', '#10b981', '#f59e0b', '#ef4444']

const Analytics = () => {
  const { data: stats, isLoading } = useQuery(
    'analyticsStats',
    contentAPI.getStats,
    {
      refetchInterval: 60000, // Refetch every minute
    }
  )

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  const analyticsData = stats?.data || {}

  // Mock data for charts (replace with real data from API)
  const contentTypeData = [
    { name: 'Stories', value: analyticsData.contentByType?.story || 0 },
    { name: 'Music', value: analyticsData.contentByType?.music || 0 },
    { name: 'Meditations', value: analyticsData.contentByType?.meditation || 0 },
    { name: 'Affirmations', value: analyticsData.contentByType?.affirmation || 0 },
  ]

  const ageRangeData = [
    { name: '3-5 years', plays: 1200, content: 45 },
    { name: '6-8 years', plays: 1800, content: 62 },
    { name: '9-12 years', plays: 950, content: 38 },
  ]

  const weeklyData = [
    { day: 'Mon', plays: 120 },
    { day: 'Tue', plays: 150 },
    { day: 'Wed', plays: 180 },
    { day: 'Thu', plays: 165 },
    { day: 'Fri', plays: 200 },
    { day: 'Sat', plays: 250 },
    { day: 'Sun', plays: 220 },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
        <p className="text-gray-600">
          Insights into your content performance and user engagement
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Plays"
          value={analyticsData.totalPlays || 0}
          icon={Play}
          color="blue"
          trend={12.5}
        />
        <StatsCard
          title="Active Users"
          value={analyticsData.activeUsers || 0}
          icon={Users}
          color="green"
          trend={8.2}
        />
        <StatsCard
          title="Avg. Session"
          value={`${Math.round((analyticsData.avgSessionDuration || 0) / 60)}m`}
          icon={Clock}
          color="purple"
          trend={-2.1}
        />
        <StatsCard
          title="Engagement Rate"
          value={`${(analyticsData.engagementRate || 0).toFixed(1)}%`}
          icon={TrendingUp}
          color="orange"
          trend={5.7}
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Content Type Distribution */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-gray-900">Content Distribution</h3>
            <p className="text-sm text-gray-600">Content by type</p>
          </div>
          <div className="card-content">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={contentTypeData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {contentTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Age Range Performance */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-gray-900">Age Range Performance</h3>
            <p className="text-sm text-gray-600">Plays by age group</p>
          </div>
          <div className="card-content">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={ageRangeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="plays" fill="#0ea5e9" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Weekly Plays Trend */}
        <div className="card lg:col-span-2">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-gray-900">Weekly Plays Trend</h3>
            <p className="text-sm text-gray-600">Daily plays over the past week</p>
          </div>
          <div className="card-content">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="plays" 
                  stroke="#0ea5e9" 
                  strokeWidth={2}
                  dot={{ fill: '#0ea5e9' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Top Performing Content */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-semibold text-gray-900">Top Performing Content</h3>
          <p className="text-sm text-gray-600">Most popular content this month</p>
        </div>
        <div className="card-content">
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((rank) => (
              <div key={rank} className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50">
                <div className="flex items-center justify-center w-8 h-8 bg-primary-100 text-primary-700 rounded-full text-sm font-bold">
                  {rank}
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">Sample Content Title {rank}</h4>
                  <p className="text-sm text-gray-500">Story • 3-5 years • 1,{200 - rank * 50} plays</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{(95 - rank * 5).toFixed(1)}%</p>
                  <p className="text-xs text-gray-500">Completion rate</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Analytics
