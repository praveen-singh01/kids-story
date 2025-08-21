import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from 'react-query'
import { contentAPI } from '../lib/api'
import { Plus, Search, Filter } from 'lucide-react'
import LoadingSpinner from '../components/LoadingSpinner'

const Content = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState({
    type: '',
    ageRange: '',
    isActive: '',
  })

  const { data, isLoading, error } = useQuery(
    ['content', searchTerm, filters],
    () => contentAPI.getAll({
      q: searchTerm,
      ...filters,
      limit: 20,
    }),
    {
      keepPreviousData: true,
    }
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Content Management</h1>
          <p className="text-gray-600">
            Manage your stories, music, meditations, and affirmations
          </p>
        </div>
        <Link to="/content/new" className="btn-primary">
          <Plus className="w-4 h-4 mr-2" />
          Add Content
        </Link>
      </div>

      {/* Search and Filters */}
      <div className="card">
        <div className="card-content">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search content..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input pl-10"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <select
                value={filters.type}
                onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                className="input"
              >
                <option value="">All Types</option>
                <option value="story">Stories</option>
                <option value="music">Music</option>
                <option value="meditation">Meditations</option>
                <option value="affirmation">Affirmations</option>
              </select>
              
              <select
                value={filters.ageRange}
                onChange={(e) => setFilters({ ...filters, ageRange: e.target.value })}
                className="input"
              >
                <option value="">All Ages</option>
                <option value="3-5">3-5 years</option>
                <option value="6-8">6-8 years</option>
                <option value="9-12">9-12 years</option>
              </select>
              
              <select
                value={filters.isActive}
                onChange={(e) => setFilters({ ...filters, isActive: e.target.value })}
                className="input"
              >
                <option value="">All Status</option>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Content List */}
      <div className="card">
        <div className="card-content">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : error ? (
            <div className="text-center py-12 text-red-600">
              <p>Error loading content. Please try again.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Showing {data?.data?.content?.length || 0} of {data?.data?.pagination?.total || 0} items
              </p>
              
              {data?.data?.content?.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <p>No content found matching your criteria.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {data?.data?.content?.map((item) => (
                    <div key={item.id} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium text-gray-900">{item.title}</h3>
                          <p className="text-sm text-gray-600">
                            {item.type} • {item.ageRange} • {item.popularityScore || 0} plays
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            item.isActive 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {item.isActive ? 'Active' : 'Inactive'}
                          </span>
                          <Link
                            to={`/content/${item.id}/edit`}
                            className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                          >
                            Edit
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Content
