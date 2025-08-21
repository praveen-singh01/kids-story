import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, X, File, Image, Music } from 'lucide-react'
import { uploadAPI } from '../lib/api'
import { formatFileSize } from '../lib/utils'
import LoadingSpinner from './LoadingSpinner'
import toast from 'react-hot-toast'

const FileUpload = ({ label, accept, currentUrl, onUpload, maxSize = 50 * 1024 * 1024 }) => {
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  const onDrop = useCallback(async (acceptedFiles) => {
    const file = acceptedFiles[0]
    if (!file) return

    if (file.size > maxSize) {
      toast.error(`File size must be less than ${formatFileSize(maxSize)}`)
      return
    }

    setUploading(true)
    setUploadProgress(0)

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90))
      }, 200)

      const response = await uploadAPI.uploadFile(file)
      
      clearInterval(progressInterval)
      setUploadProgress(100)
      
      if (response.success) {
        onUpload(response.data.url)
        toast.success('File uploaded successfully!')
      } else {
        throw new Error(response.message || 'Upload failed')
      }
    } catch (error) {
      toast.error(error.message || 'Upload failed')
    } finally {
      setUploading(false)
      setUploadProgress(0)
    }
  }, [maxSize, onUpload])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: accept ? { [accept]: [] } : undefined,
    multiple: false,
    disabled: uploading,
  })

  const getFileIcon = () => {
    if (accept?.includes('image')) return Image
    if (accept?.includes('audio')) return Music
    return File
  }

  const FileIcon = getFileIcon()

  const removeFile = () => {
    onUpload('')
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        {label}
      </label>
      
      {currentUrl ? (
        <div className="relative">
          {accept?.includes('image') ? (
            <div className="relative w-full h-48 rounded-lg overflow-hidden bg-gray-100">
              <img
                src={currentUrl}
                alt="Preview"
                className="w-full h-full object-cover"
              />
              <button
                onClick={removeFile}
                className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full hover:bg-red-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
              <FileIcon className="w-8 h-8 text-gray-400" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">File uploaded</p>
                <p className="text-xs text-gray-500 truncate">{currentUrl}</p>
              </div>
              <button
                onClick={removeFile}
                className="p-1 text-red-600 hover:text-red-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      ) : (
        <div
          {...getRootProps()}
          className={`
            relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
            ${isDragActive 
              ? 'border-primary-400 bg-primary-50' 
              : 'border-gray-300 hover:border-gray-400'
            }
            ${uploading ? 'pointer-events-none' : ''}
          `}
        >
          <input {...getInputProps()} />
          
          {uploading ? (
            <div className="space-y-3">
              <LoadingSpinner size="lg" />
              <div className="space-y-2">
                <p className="text-sm text-gray-600">Uploading...</p>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500">{uploadProgress}%</p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="mx-auto w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                <Upload className="w-6 h-6 text-gray-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {isDragActive ? 'Drop the file here' : 'Click to upload or drag and drop'}
                </p>
                <p className="text-xs text-gray-500">
                  {accept || 'Any file type'} • Max {formatFileSize(maxSize)}
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default FileUpload
