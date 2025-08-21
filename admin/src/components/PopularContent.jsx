import { Link } from 'react-router-dom'
import { formatDate, getContentTypeLabel, formatDuration } from '../lib/utils'
import { Play, TrendingUp } from 'lucide-react'

const PopularContent = ({ content }) => {
  if (!content || content.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <TrendingUp className="w-12 h-12 mx-auto mb-3 text-gray-300" />
        <p>No popular content found</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {content.map((item, index) => (
        <div key={item.id} className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors">
          {/* Rank */}
          <div className="flex items-center justify-center w-8 h-8 bg-primary-100 text-primary-700 rounded-full text-sm font-bold">
            {index + 1}
          </div>
          
          {/* Content Image */}
          <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-gray-200">
            {item.imageUrl ? (
              <img
                src={item.imageUrl}
                alt={item.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Play className="w-5 h-5 text-gray-400" />
              </div>
            )}
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
              <span>{formatDuration(item.durationSec)}</span>
              <span>•</span>
              <span>{item.popularityScore || 0} plays</span>
              <span>•</span>
              <span>{formatDate(item.publishedAt)}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-green-600">
              <TrendingUp className="w-4 h-4" />
              <span className="text-sm font-medium">
                {item.popularityScore || 0}
              </span>
            </div>
            <Link
              to={`/content/${item.id}/edit`}
              className="text-primary-600 hover:text-primary-700 text-sm font-medium"
            >
              Edit
            </Link>
          </div>
        </div>
      ))}
      
      <div className="pt-4 border-t border-gray-200">
        <Link
          to="/analytics"
          className="text-sm text-primary-600 hover:text-primary-700 font-medium"
        >
          View detailed analytics →
        </Link>
      </div>
    </div>
  )
}

export default PopularContent
