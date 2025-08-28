import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus } from 'lucide-react';

export default function CreateContent() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => navigate('/content')}
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Content
        </button>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-gray-900">Create New Content</h1>
        <p className="text-gray-600">Add a new story, affirmation, meditation, or music piece</p>
      </div>

      {/* Placeholder */}
      <div className="bg-white shadow-sm border border-gray-200 rounded-lg p-12">
        <div className="text-center">
          <Plus className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Content Creation Form</h3>
          <p className="mt-1 text-sm text-gray-500">
            The content creation form will be available here. For now, you can manage existing content from the content list.
          </p>
          <div className="mt-6">
            <button
              onClick={() => navigate('/content')}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              View Content List
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
