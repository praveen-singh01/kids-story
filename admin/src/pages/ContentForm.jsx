import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { useForm } from 'react-hook-form'
import { contentAPI } from '../lib/api'
import { ArrowLeft, Save, Upload } from 'lucide-react'
import LoadingSpinner from '../components/LoadingSpinner'
import FileUpload from '../components/FileUpload'
import toast from 'react-hot-toast'

const ContentForm = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const isEditing = Boolean(id)

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm({
    defaultValues: {
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
      isActive: true,
    }
  })

  // Fetch content for editing
  const { data: content, isLoading } = useQuery(
    ['content', id],
    () => contentAPI.getById(id),
    {
      enabled: isEditing,
      onSuccess: (data) => {
        const item = data.data
        Object.keys(item).forEach(key => {
          setValue(key, item[key])
        })
      }
    }
  )

  // Create/Update mutation
  const mutation = useMutation(
    (data) => isEditing ? contentAPI.update(id, data) : contentAPI.create(data),
    {
      onSuccess: () => {
        toast.success(isEditing ? 'Content updated successfully!' : 'Content created successfully!')
        queryClient.invalidateQueries('content')
        navigate('/content')
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'An error occurred')
      }
    }
  )

  const onSubmit = (data) => {
    mutation.mutate(data)
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/content')}
          className="p-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isEditing ? 'Edit Content' : 'Add New Content'}
          </h1>
          <p className="text-gray-600">
            {isEditing ? 'Update your content details' : 'Create new content for your users'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <div className="card">
              <div className="card-header">
                <h3 className="text-lg font-semibold">Basic Information</h3>
              </div>
              <div className="card-content space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Content Type
                    </label>
                    <select {...register('type', { required: 'Type is required' })} className="input">
                      <option value="story">Story</option>
                      <option value="music">Music</option>
                      <option value="meditation">Meditation</option>
                      <option value="affirmation">Affirmation</option>
                    </select>
                    {errors.type && <p className="text-red-600 text-sm mt-1">{errors.type.message}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Age Range
                    </label>
                    <select {...register('ageRange', { required: 'Age range is required' })} className="input">
                      <option value="3-5">3-5 years</option>
                      <option value="6-8">6-8 years</option>
                      <option value="9-12">9-12 years</option>
                    </select>
                    {errors.ageRange && <p className="text-red-600 text-sm mt-1">{errors.ageRange.message}</p>}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title
                  </label>
                  <input
                    {...register('title', { required: 'Title is required' })}
                    className="input"
                    placeholder="Enter content title"
                  />
                  {errors.title && <p className="text-red-600 text-sm mt-1">{errors.title.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Duration (seconds)
                  </label>
                  <input
                    type="number"
                    {...register('durationSec', { 
                      required: 'Duration is required',
                      min: { value: 1, message: 'Duration must be at least 1 second' }
                    })}
                    className="input"
                    placeholder="Duration in seconds"
                  />
                  {errors.durationSec && <p className="text-red-600 text-sm mt-1">{errors.durationSec.message}</p>}
                </div>
              </div>
            </div>

            {/* File Uploads */}
            <div className="card">
              <div className="card-header">
                <h3 className="text-lg font-semibold">Media Files</h3>
              </div>
              <div className="card-content space-y-6">
                <FileUpload
                  label="Audio File"
                  accept="audio/*"
                  currentUrl={watch('audioUrl')}
                  onUpload={(url) => setValue('audioUrl', url)}
                />
                
                <FileUpload
                  label="Cover Image"
                  accept="image/*"
                  currentUrl={watch('imageUrl')}
                  onUpload={(url) => setValue('imageUrl', url)}
                />
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="card">
              <div className="card-header">
                <h3 className="text-lg font-semibold">Settings</h3>
              </div>
              <div className="card-content space-y-4">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    {...register('isFeatured')}
                    className="rounded border-gray-300"
                  />
                  <label className="text-sm font-medium text-gray-700">
                    Featured Content
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    {...register('isActive')}
                    className="rounded border-gray-300"
                  />
                  <label className="text-sm font-medium text-gray-700">
                    Active
                  </label>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={mutation.isLoading}
              className="btn-primary w-full"
            >
              {mutation.isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <LoadingSpinner size="sm" />
                  {isEditing ? 'Updating...' : 'Creating...'}
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <Save className="w-4 h-4" />
                  {isEditing ? 'Update Content' : 'Create Content'}
                </div>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}

export default ContentForm
