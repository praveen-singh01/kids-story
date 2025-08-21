import { useState } from 'react'
import { useQuery } from 'react-query'
import { usersAPI } from '../lib/api'
import { Search, Filter, Users as UsersIcon, Crown } from 'lucide-react'
import LoadingSpinner from '../components/LoadingSpinner'
import { formatDate, getInitials } from '../lib/utils'

const Users = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState({
    plan: '',
    status: '',
  })

  const { data, isLoading, error } = useQuery(
    ['users', searchTerm, filters],
    () => usersAPI.getAll({
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
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600">
            Manage user accounts and subscriptions
          </p>
        </div>
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
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input pl-10"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <select
                value={filters.plan}
                onChange={(e) => setFilters({ ...filters, plan: e.target.value })}
                className="input"
              >
                <option value="">All Plans</option>
                <option value="free">Free</option>
                <option value="premium">Premium</option>
                <option value="family">Family</option>
              </select>
              
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="input"
              >
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Users List */}
      <div className="card">
        <div className="card-content">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : error ? (
            <div className="text-center py-12 text-red-600">
              <p>Error loading users. Please try again.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Showing {data?.data?.users?.length || 0} of {data?.data?.pagination?.total || 0} users
              </p>
              
              {data?.data?.users?.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <UsersIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>No users found matching your criteria.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>User</th>
                        <th>Plan</th>
                        <th>Status</th>
                        <th>Kids</th>
                        <th>Joined</th>
                        <th>Last Login</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data?.data?.users?.map((user) => (
                        <tr key={user.id}>
                          <td>
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center text-sm font-medium">
                                {getInitials(user.name || user.email)}
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">
                                  {user.name || 'Unnamed User'}
                                </p>
                                <p className="text-sm text-gray-500">{user.email}</p>
                              </div>
                            </div>
                          </td>
                          <td>
                            <div className="flex items-center gap-2">
                              {user.subscription?.plan === 'premium' && (
                                <Crown className="w-4 h-4 text-yellow-500" />
                              )}
                              <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                                user.subscription?.plan === 'premium' 
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : user.subscription?.plan === 'family'
                                  ? 'bg-purple-100 text-purple-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                {user.subscription?.plan || 'free'}
                              </span>
                            </div>
                          </td>
                          <td>
                            <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                              user.subscription?.status === 'active'
                                ? 'bg-green-100 text-green-800'
                                : user.subscription?.status === 'cancelled'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {user.subscription?.status || 'inactive'}
                            </span>
                          </td>
                          <td>
                            <span className="text-sm text-gray-900">
                              {user.kidsCount || 0}
                            </span>
                          </td>
                          <td>
                            <span className="text-sm text-gray-500">
                              {formatDate(user.createdAt)}
                            </span>
                          </td>
                          <td>
                            <span className="text-sm text-gray-500">
                              {formatDate(user.lastLoginAt)}
                            </span>
                          </td>
                          <td>
                            <button className="text-primary-600 hover:text-primary-700 text-sm font-medium">
                              View Details
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Users
