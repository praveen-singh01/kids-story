import { useState, useEffect } from 'react'
import axios from 'axios'

const API_BASE = 'http://localhost:3000/api/v1'

function App() {
  const [content, setContent] = useState([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({})
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [formData, setFormData] = useState({
    type: 'story',
    title: '',
    durationSec: '',
    ageRange: '3-5',
    tags: [],
    language: 'en',
    region: 'US',
    audioUrl: '',
    imageUrl: '',
    isFeatured: false,
    isActive: true
  })

  useEffect(() => {
    loadContent()
  }, [])

  const loadContent = async () => {
    try {
      setLoading(true)
      const response = await axios.get(`${API_BASE}/explore/list?limit=50`)

      if (response.data.success) {
        const contentData = response.data.data.content
        setContent(contentData)

        // Calculate stats
        const statsData = contentData.reduce((acc, item) => {
          acc.total = (acc.total || 0) + 1
          acc[item.type] = (acc[item.type] || 0) + 1
          if (item.isFeatured) acc.featured = (acc.featured || 0) + 1
          return acc
        }, {})

        setStats(statsData)
      }
    } catch (error) {
      console.error('Error loading content:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleTagsChange = (e) => {
    const selectedTags = Array.from(e.target.selectedOptions, option => option.value)
    setFormData(prev => ({
      ...prev,
      tags: selectedTags
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      // Convert duration to number
      const submitData = {
        ...formData,
        durationSec: parseInt(formData.durationSec)
      }

      if (editingId) {
        // Update existing content
        console.log('Updating content:', editingId, submitData)

        const updatedContent = {
          ...content.find(c => c._id === editingId),
          ...submitData,
          updatedAt: new Date().toISOString(),
          slug: formData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
        }

        // Update content list
        setContent(prev => prev.map(c => c._id === editingId ? updatedContent : c))

        alert('Content updated successfully!')
      } else {
        // Create new content
        console.log('Creating content:', submitData)

        const newContent = {
          _id: Date.now().toString(),
          ...submitData,
          popularityScore: 0,
          publishedAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          slug: formData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
        }

        // Add to content list
        setContent(prev => [newContent, ...prev])

        // Update stats
        setStats(prev => ({
          ...prev,
          total: (prev.total || 0) + 1,
          [formData.type]: (prev[formData.type] || 0) + 1,
          featured: formData.isFeatured ? (prev.featured || 0) + 1 : prev.featured
        }))

        alert('Content created successfully!')
      }

      // Reset form
      setFormData({
        type: 'story',
        title: '',
        durationSec: '',
        ageRange: '3-5',
        tags: [],
        language: 'en',
        region: 'US',
        audioUrl: '',
        imageUrl: '',
        isFeatured: false,
        isActive: true
      })

      setEditingId(null)
      setShowAddForm(false)

    } catch (error) {
      console.error('Error creating content:', error)
      alert('Error creating content: ' + error.message)
    }
  }

  const formatDuration = (seconds) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const getTypeColor = (type) => {
    const colors = {
      story: 'bg-blue-100 text-blue-800',
      music: 'bg-purple-100 text-purple-800',
      meditation: 'bg-green-100 text-green-800',
      affirmation: 'bg-yellow-100 text-yellow-800'
    }
    return colors[type] || 'bg-gray-100 text-gray-800'
  }

  const getTypeIcon = (type) => {
    const icons = {
      story: '📖',
      music: '🎵',
      meditation: '🧘',
      affirmation: '💭'
    }
    return icons[type] || '📄'
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold">🌙</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Bedtime Stories</h1>
                <p className="text-sm text-gray-500">Admin Dashboard</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowAddForm(true)}
                className="inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium bg-green-600 text-white hover:bg-green-700 transition-colors"
              >
                + Add Content
              </button>
              <button
                onClick={loadContent}
                className="inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors"
              >
                Refresh Data
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Add Content Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900">
                  {editingId ? 'Edit Content' : 'Add New Content'}
                </h2>
                <button
                  onClick={() => {
                    setShowAddForm(false)
                    setEditingId(null)
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Content Type
                  </label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="story">Story</option>
                    <option value="music">Music</option>
                    <option value="meditation">Meditation</option>
                    <option value="affirmation">Affirmation</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Age Range
                  </label>
                  <select
                    name="ageRange"
                    value={formData.ageRange}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="3-5">3-5 years</option>
                    <option value="6-8">6-8 years</option>
                    <option value="9-12">9-12 years</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter content title"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Duration (seconds)
                </label>
                <input
                  type="number"
                  name="durationSec"
                  value={formData.durationSec}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Duration in seconds"
                  min="1"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Audio URL
                  </label>
                  <input
                    type="url"
                    name="audioUrl"
                    value={formData.audioUrl}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://example.com/audio.mp3"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">Or upload a file below</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Image URL
                  </label>
                  <input
                    type="url"
                    name="imageUrl"
                    value={formData.imageUrl}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://example.com/image.jpg"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">Or upload a file below</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Upload Audio File
                  </label>
                  <input
                    type="file"
                    accept="audio/*"
                    onChange={(e) => {
                      const file = e.target.files[0]
                      if (file) {
                        // In a real app, you'd upload this to your server
                        // For now, we'll just show the filename
                        setFormData(prev => ({
                          ...prev,
                          audioUrl: `https://cdn.example.com/audio/${file.name}`
                        }))
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Upload Image File
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files[0]
                      if (file) {
                        // In a real app, you'd upload this to your server
                        // For now, we'll just show the filename
                        setFormData(prev => ({
                          ...prev,
                          imageUrl: `https://cdn.example.com/images/${file.name}`
                        }))
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tags
                </label>
                <select
                  multiple
                  name="tags"
                  value={formData.tags}
                  onChange={handleTagsChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  size="4"
                >
                  <option value="folk_tales">Folk Tales</option>
                  <option value="affirmations">Affirmations</option>
                  <option value="meditations">Meditations</option>
                  <option value="music">Music</option>
                  <option value="adventure">Adventure</option>
                  <option value="fantasy">Fantasy</option>
                  <option value="educational">Educational</option>
                  <option value="calming">Calming</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple tags</p>
              </div>

              <div className="flex items-center gap-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="isFeatured"
                    checked={formData.isFeatured}
                    onChange={handleInputChange}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Featured Content</span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="isActive"
                    checked={formData.isActive}
                    onChange={handleInputChange}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Active</span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false)
                    setEditingId(null)
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
                >
                  {editingId ? 'Update Content' : 'Create Content'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Content</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total || 0}</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-xl">
                <span className="text-blue-600 text-xl">📚</span>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Stories</p>
                <p className="text-2xl font-bold text-gray-900">{stats.story || 0}</p>
              </div>
              <div className="p-3 bg-green-50 rounded-xl">
                <span className="text-green-600 text-xl">📖</span>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Music</p>
                <p className="text-2xl font-bold text-gray-900">{stats.music || 0}</p>
              </div>
              <div className="p-3 bg-purple-50 rounded-xl">
                <span className="text-purple-600 text-xl">🎵</span>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Featured</p>
                <p className="text-2xl font-bold text-gray-900">{stats.featured || 0}</p>
              </div>
              <div className="p-3 bg-orange-50 rounded-xl">
                <span className="text-orange-600 text-xl">⭐</span>
              </div>
            </div>
          </div>
        </div>

        {/* Content Table */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Content Management</h2>
            <p className="text-sm text-gray-600">Manage your stories, music, meditations, and affirmations</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Age Range</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Popularity</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {content.map((item) => (
                  <tr key={item._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-lg bg-gray-200 flex items-center justify-center">
                            {getTypeIcon(item.type)}
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{item.title}</div>
                          <div className="text-sm text-gray-500">{item.slug}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(item.type)}`}>
                        {item.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.ageRange}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatDuration(item.durationSec)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.popularityScore}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${item.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {item.isActive ? 'Active' : 'Inactive'}
                      </span>
                      {item.isFeatured && <span className="ml-2 text-yellow-500">⭐</span>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => {
                          setEditingId(item._id)
                          setFormData({
                            type: item.type,
                            title: item.title,
                            durationSec: item.durationSec.toString(),
                            ageRange: item.ageRange,
                            tags: item.tags || [],
                            language: item.language || 'en',
                            region: item.region || 'US',
                            audioUrl: item.audioUrl,
                            imageUrl: item.imageUrl,
                            isFeatured: item.isFeatured,
                            isActive: item.isActive
                          })
                          setShowAddForm(true)
                        }}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => {
                          if (confirm('Are you sure you want to delete this content?')) {
                            setContent(prev => prev.filter(c => c._id !== item._id))
                            // Update stats
                            setStats(prev => ({
                              ...prev,
                              total: (prev.total || 1) - 1,
                              [item.type]: Math.max(0, (prev[item.type] || 1) - 1),
                              featured: item.isFeatured ? Math.max(0, (prev.featured || 1) - 1) : prev.featured
                            }))
                          }
                        }}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  )
}

export default App
