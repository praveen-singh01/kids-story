import { Link } from 'react-router-dom'
import { formatDate, getContentTypeLabel, getAgeRangeLabel } from '../lib/utils'
import { FileText, Music, Star, BookOpen } from 'lucide-react'

const getContentIcon = (type) => {
  const icons = {
    story: BookOpen,
    music: Music,
    meditation: Star,
    affirmation: FileText,
  }
  return icons[type] || FileText
}

const getContentColor = (type) => {
  const colors = {
    story: 'text-blue-600 bg-blue-50',
    music: 'text-pink-600 bg-pink-50',
    meditation: 'text-purple-600 bg-purple-50',
    affirmation: 'text-green-600 bg-green-50',
  }
  return colors[type] || 'text-gray-600 bg-gray-50'
}

const RecentActivity = ({ content }) => {
  if (!content || content.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
        <p>No recent content found</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {content.map((item) => {
        const Icon = getContentIcon(item.type)
        const colorClass = getContentColor(item.type)
        
        return (
          <div key={item.id} className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors">
            <div className={`p-2 rounded-lg ${colorClass}`}>
              <Icon className="w-4 h-4" />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="text-sm font-medium text-gray-900 truncate">
                  {item.title}
                </h4>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                  {getContentTypeLabel(item.type)}
                </span>
              </div>
              
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <span>{getAgeRangeLabel(item.ageRange)}</span>
                <span>•</span>
                <span>{formatDate(item.publishedAt)}</span>
                <span>•</span>
                <span>{item.popularityScore || 0} plays</span>
              </div>
            </div>
            
            <Link
              to={`/content/${item.id}/edit`}
              className="text-primary-600 hover:text-primary-700 text-sm font-medium"
            >
              Edit
            </Link>
          </div>
        )
      })}
      
      <div className="pt-4 border-t border-gray-200">
        <Link
          to="/content"
          className="text-sm text-primary-600 hover:text-primary-700 font-medium"
        >
          View all content →
        </Link>
      </div>
    </div>
  )
}

export default RecentActivity
