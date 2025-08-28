import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload as UploadIcon, File, X, Check, AlertCircle } from 'lucide-react';
import { apiService } from '../services/api';
import LoadingSpinner from '../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

interface UploadedFile {
  file: File;
  url?: string;
  progress: number;
  status: 'uploading' | 'success' | 'error';
  error?: string;
}

export default function Upload() {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles = acceptedFiles.map(file => ({
      file,
      progress: 0,
      status: 'uploading' as const,
    }));

    setUploadedFiles(prev => [...prev, ...newFiles]);

    // Upload each file
    newFiles.forEach((fileObj, index) => {
      uploadFile(fileObj.file, uploadedFiles.length + index);
    });
  }, [uploadedFiles.length]);

  const uploadFile = async (file: File, index: number) => {
    try {
      const response = await apiService.uploadFile(file, (progress) => {
        setUploadedFiles(prev => 
          prev.map((f, i) => 
            i === index ? { ...f, progress } : f
          )
        );
      });

      if (response.success) {
        setUploadedFiles(prev => 
          prev.map((f, i) => 
            i === index 
              ? { ...f, status: 'success', url: response.data.url, progress: 100 }
              : f
          )
        );
        toast.success(`${file.name} uploaded successfully`);
      } else {
        throw new Error(response.message || 'Upload failed');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      setUploadedFiles(prev => 
        prev.map((f, i) => 
          i === index 
            ? { ...f, status: 'error', error: errorMessage, progress: 0 }
            : f
        )
      );
      toast.error(`Failed to upload ${file.name}`);
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const copyToClipboard = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success('URL copied to clipboard');
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'audio/*': ['.mp3', '.wav', '.m4a', '.aac'],
      'image/*': ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
    },
    maxSize: 50 * 1024 * 1024, // 50MB
  });

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">File Upload</h1>
        <p className="text-gray-600">Upload audio files and images for your content</p>
      </div>

      {/* Upload Area */}
      <div className="bg-white shadow-sm border border-gray-200 rounded-lg p-6">
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            isDragActive
              ? 'border-primary-400 bg-primary-50'
              : 'border-gray-300 hover:border-gray-400'
          }`}
        >
          <input {...getInputProps()} />
          <UploadIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          {isDragActive ? (
            <p className="text-lg text-primary-600">Drop the files here...</p>
          ) : (
            <div>
              <p className="text-lg text-gray-600 mb-2">
                Drag & drop files here, or click to select files
              </p>
              <p className="text-sm text-gray-500">
                Supports audio files (MP3, WAV, M4A, AAC) and images (JPG, PNG, GIF, WebP)
              </p>
              <p className="text-sm text-gray-500">Maximum file size: 50MB</p>
            </div>
          )}
        </div>
      </div>

      {/* Uploaded Files */}
      {uploadedFiles.length > 0 && (
        <div className="bg-white shadow-sm border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Uploaded Files</h3>
          <div className="space-y-4">
            {uploadedFiles.map((fileObj, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    <File className="h-5 w-5 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {fileObj.file.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatFileSize(fileObj.file.size)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {fileObj.status === 'uploading' && (
                      <LoadingSpinner size="sm" />
                    )}
                    {fileObj.status === 'success' && (
                      <Check className="h-5 w-5 text-green-500" />
                    )}
                    {fileObj.status === 'error' && (
                      <AlertCircle className="h-5 w-5 text-red-500" />
                    )}
                    <button
                      onClick={() => removeFile(index)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Progress Bar */}
                {fileObj.status === 'uploading' && (
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                    <div
                      className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${fileObj.progress}%` }}
                    />
                  </div>
                )}

                {/* Success State */}
                {fileObj.status === 'success' && fileObj.url && (
                  <div className="bg-green-50 border border-green-200 rounded p-3">
                    <p className="text-sm text-green-800 mb-2">Upload successful!</p>
                    <div className="flex items-center justify-between">
                      <code className="text-xs bg-white px-2 py-1 rounded border text-gray-700 flex-1 mr-2">
                        {fileObj.url}
                      </code>
                      <button
                        onClick={() => copyToClipboard(fileObj.url!)}
                        className="text-xs bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                      >
                        Copy URL
                      </button>
                    </div>
                  </div>
                )}

                {/* Error State */}
                {fileObj.status === 'error' && (
                  <div className="bg-red-50 border border-red-200 rounded p-3">
                    <p className="text-sm text-red-800">
                      Upload failed: {fileObj.error}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Usage Guidelines */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">Usage Guidelines</h3>
        <div className="text-sm text-blue-800 space-y-2">
          <p>• <strong>Audio Files:</strong> Use high-quality MP3 or WAV files for the best user experience</p>
          <p>• <strong>Images:</strong> Recommended size is 400x400px or larger for content thumbnails</p>
          <p>• <strong>File Names:</strong> Use descriptive names to help organize your content</p>
          <p>• <strong>Storage:</strong> Files are stored securely and can be used immediately in your content</p>
        </div>
      </div>
    </div>
  );
}
