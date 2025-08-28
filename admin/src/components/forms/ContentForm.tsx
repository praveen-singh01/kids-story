import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Upload, File, Image, Video, Music } from 'lucide-react';
import { ContentItem, CategoryItem, UploadedFile } from '../../types/api';
import { CreateContentData, contentService } from '../../services/content';
import { categoryService } from '../../services/category';
import LoadingSpinner from '../common/LoadingSpinner';
import { toast } from 'react-hot-toast';

const contentSchema = z.object({
  categoryId: z.string().min(1, 'Category is required'),
  type: z.string(),
  title: z.string().min(1, 'Title is required').max(200, 'Title must be less than 200 characters'),
  durationSec: z.number().min(1, 'Duration must be at least 1 second').max(3600, 'Duration must be less than 1 hour'),
  ageRange: z.string(),
  tags: z.array(z.string()).min(1, 'At least one tag is required'),
  language: z.string().optional(),
  region: z.string().optional(),
  audioUrl: z.string().url('Please enter a valid audio URL'),
  videoUrl: z.string().optional(),
  imageUrl: z.string().url('Please enter a valid image URL'),
  thumbnailUrl: z.string().optional(),
  isFeatured: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

type ContentFormData = z.infer<typeof contentSchema>;

interface ContentFormProps {
  initialData?: Partial<ContentItem>;
  onSubmit: (data: CreateContentData) => Promise<void>;
  isLoading?: boolean;
  submitLabel?: string;
}

const CONTENT_TYPES = [
  { value: 'story', label: 'Story' },
  { value: 'affirmation', label: 'Affirmation' },
  { value: 'meditation', label: 'Meditation' },
  { value: 'music', label: 'Music' },
];

const AGE_RANGES = [
  { value: '3-5', label: '3-5 years' },
  { value: '6-8', label: '6-8 years' },
  { value: '9-12', label: '9-12 years' },
];

const AVAILABLE_TAGS = [
  'folk_tales', 'affirmations', 'meditations', 'music', 
  'adventure', 'fantasy', 'educational', 'calming'
];

export default function ContentForm({
  initialData,
  onSubmit,
  isLoading = false,
  submitLabel = 'Save Content',
}: ContentFormProps) {
  const [selectedTags, setSelectedTags] = useState<string[]>(initialData?.tags || []);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<{
    audio?: string;
    video?: string;
    image?: string;
    thumbnail?: string;
  }>({
    audio: initialData?.audioUrl || '',
    video: initialData?.videoUrl || '',
    image: initialData?.imageUrl || '',
    thumbnail: initialData?.thumbnailUrl || '',
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<ContentFormData>({
    resolver: zodResolver(contentSchema),
    defaultValues: {
      categoryId: initialData?.categoryId || '',
      type: initialData?.type || 'story',
      title: initialData?.title || '',
      durationSec: initialData?.durationSec || 60,
      ageRange: initialData?.ageRange || '3-5',
      tags: initialData?.tags || [],
      language: initialData?.language || 'en',
      region: initialData?.region || 'US',
      audioUrl: initialData?.audioUrl || '',
      videoUrl: initialData?.videoUrl || '',
      imageUrl: initialData?.imageUrl || '',
      thumbnailUrl: initialData?.thumbnailUrl || '',
      isFeatured: initialData?.isFeatured || false,
      isActive: initialData?.isActive !== false,
    },
  });

  // Load categories on component mount
  useEffect(() => {
    const loadCategories = async () => {
      try {
        setLoadingCategories(true);
        const activeCategories = await categoryService.getActiveCategories();
        setCategories(activeCategories);
      } catch (error) {
        toast.error('Failed to load categories');
        console.error('Error loading categories:', error);
      } finally {
        setLoadingCategories(false);
      }
    };

    loadCategories();
  }, []);

  // Update form values when uploaded files change
  useEffect(() => {
    if (uploadedFiles.audio) setValue('audioUrl', uploadedFiles.audio);
    if (uploadedFiles.video) setValue('videoUrl', uploadedFiles.video);
    if (uploadedFiles.image) setValue('imageUrl', uploadedFiles.image);
    if (uploadedFiles.thumbnail) setValue('thumbnailUrl', uploadedFiles.thumbnail);
  }, [uploadedFiles, setValue]);

  const handleTagToggle = (tag: string) => {
    const newTags = selectedTags.includes(tag)
      ? selectedTags.filter(t => t !== tag)
      : [...selectedTags, tag];
    
    setSelectedTags(newTags);
    setValue('tags', newTags);
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleDurationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const [minutes, seconds] = e.target.value.split(':').map(Number);
    const totalSeconds = (minutes || 0) * 60 + (seconds || 0);
    setValue('durationSec', totalSeconds);
  };

  const handleFileUpload = async (file: File, type: 'audio' | 'video' | 'image' | 'thumbnail') => {
    try {
      setUploadingFiles(true);

      const selectedCategory = categories.find(cat => cat.id === watch('categoryId'));
      const categorySlug = selectedCategory?.slug;

      let uploadedFile: UploadedFile;
      switch (type) {
        case 'audio':
          uploadedFile = await contentService.uploadAudio(file, categorySlug);
          break;
        case 'video':
          uploadedFile = await contentService.uploadVideo(file, categorySlug);
          break;
        case 'image':
          uploadedFile = await contentService.uploadImage(file, categorySlug);
          break;
        case 'thumbnail':
          uploadedFile = await contentService.uploadThumbnail(file, categorySlug);
          break;
        default:
          throw new Error(`Unsupported file type: ${type}`);
      }

      setUploadedFiles(prev => ({
        ...prev,
        [type]: uploadedFile.url,
      }));

      toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} uploaded successfully`);
    } catch (error: any) {
      toast.error(error.message || `Failed to upload ${type}`);
    } finally {
      setUploadingFiles(false);
    }
  };

  const onFormSubmit = async (data: any) => {
    await onSubmit(data as CreateContentData);
  };

  const durationSec = watch('durationSec');

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Title */}
        <div className="md:col-span-2">
          <label htmlFor="title" className="block text-sm font-medium text-gray-700">
            Title *
          </label>
          <input
            {...register('title')}
            type="text"
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            placeholder="Enter content title"
          />
          {errors.title && (
            <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
          )}
        </div>

        {/* Category */}
        <div className="md:col-span-2">
          <label htmlFor="categoryId" className="block text-sm font-medium text-gray-700">
            Category *
          </label>
          {loadingCategories ? (
            <div className="mt-1 flex items-center">
              <LoadingSpinner size="sm" />
              <span className="ml-2 text-sm text-gray-500">Loading categories...</span>
            </div>
          ) : (
            <select
              {...register('categoryId')}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            >
              <option value="">Select a category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          )}
          {errors.categoryId && (
            <p className="mt-1 text-sm text-red-600">{errors.categoryId.message}</p>
          )}
        </div>

        {/* Type */}
        <div>
          <label htmlFor="type" className="block text-sm font-medium text-gray-700">
            Content Type *
          </label>
          <select
            {...register('type')}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
          >
            {CONTENT_TYPES.map(type => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
          {errors.type && (
            <p className="mt-1 text-sm text-red-600">{errors.type.message?.toString()}</p>
          )}
        </div>

        {/* Age Range */}
        <div>
          <label htmlFor="ageRange" className="block text-sm font-medium text-gray-700">
            Age Range *
          </label>
          <select
            {...register('ageRange')}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
          >
            {AGE_RANGES.map(age => (
              <option key={age.value} value={age.value}>
                {age.label}
              </option>
            ))}
          </select>
          {errors.ageRange && (
            <p className="mt-1 text-sm text-red-600">{errors.ageRange.message?.toString()}</p>
          )}
        </div>

        {/* Duration */}
        <div>
          <label htmlFor="duration" className="block text-sm font-medium text-gray-700">
            Duration *
          </label>
          <input
            type="text"
            placeholder="MM:SS"
            defaultValue={formatDuration(durationSec || 60)}
            onChange={handleDurationChange}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
          />
          <p className="mt-1 text-xs text-gray-500">
            Format: MM:SS (e.g., 5:30 for 5 minutes 30 seconds)
          </p>
          {errors.durationSec && (
            <p className="mt-1 text-sm text-red-600">{errors.durationSec.message}</p>
          )}
        </div>

        {/* Language & Region */}
        <div>
          <label htmlFor="language" className="block text-sm font-medium text-gray-700">
            Language
          </label>
          <input
            {...register('language')}
            type="text"
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            placeholder="en"
          />
        </div>

        {/* Audio Upload */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Audio File *
          </label>
          <div className="space-y-3">
            {uploadedFiles.audio ? (
              <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center">
                  <Music className="h-5 w-5 text-green-600 mr-2" />
                  <span className="text-sm text-green-800">Audio uploaded successfully</span>
                </div>
                <button
                  type="button"
                  onClick={() => setUploadedFiles(prev => ({ ...prev, audio: '' }))}
                  className="text-green-600 hover:text-green-800"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                <div className="text-center">
                  <Music className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="mt-4">
                    <label htmlFor="audio-upload" className="cursor-pointer">
                      <span className="mt-2 block text-sm font-medium text-gray-900">
                        Upload audio file
                      </span>
                      <span className="mt-1 block text-sm text-gray-500">
                        MP3, WAV, AAC up to 50MB
                      </span>
                    </label>
                    <input
                      id="audio-upload"
                      type="file"
                      accept="audio/*"
                      className="sr-only"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload(file, 'audio');
                      }}
                    />
                  </div>
                </div>
              </div>
            )}
            <input
              {...register('audioUrl')}
              type="hidden"
            />
            {errors.audioUrl && (
              <p className="text-sm text-red-600">{errors.audioUrl.message}</p>
            )}
          </div>
        </div>

        {/* Video Upload (Optional) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Video File (Optional)
          </label>
          <div className="space-y-3">
            {uploadedFiles.video ? (
              <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center">
                  <Video className="h-5 w-5 text-green-600 mr-2" />
                  <span className="text-sm text-green-800">Video uploaded successfully</span>
                </div>
                <button
                  type="button"
                  onClick={() => setUploadedFiles(prev => ({ ...prev, video: '' }))}
                  className="text-green-600 hover:text-green-800"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                <div className="text-center">
                  <Video className="mx-auto h-8 w-8 text-gray-400" />
                  <div className="mt-2">
                    <label htmlFor="video-upload" className="cursor-pointer">
                      <span className="text-sm font-medium text-gray-900">Upload video</span>
                      <span className="block text-xs text-gray-500">MP4, WebM up to 500MB</span>
                    </label>
                    <input
                      id="video-upload"
                      type="file"
                      accept="video/*"
                      className="sr-only"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload(file, 'video');
                      }}
                    />
                  </div>
                </div>
              </div>
            )}
            <input {...register('videoUrl')} type="hidden" />
          </div>
        </div>

        {/* Image Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Cover Image *
          </label>
          <div className="space-y-3">
            {uploadedFiles.image ? (
              <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center">
                  <Image className="h-5 w-5 text-green-600 mr-2" />
                  <span className="text-sm text-green-800">Image uploaded successfully</span>
                </div>
                <button
                  type="button"
                  onClick={() => setUploadedFiles(prev => ({ ...prev, image: '' }))}
                  className="text-green-600 hover:text-green-800"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                <div className="text-center">
                  <Image className="mx-auto h-8 w-8 text-gray-400" />
                  <div className="mt-2">
                    <label htmlFor="image-upload" className="cursor-pointer">
                      <span className="text-sm font-medium text-gray-900">Upload image</span>
                      <span className="block text-xs text-gray-500">JPG, PNG, WebP up to 10MB</span>
                    </label>
                    <input
                      id="image-upload"
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload(file, 'image');
                      }}
                    />
                  </div>
                </div>
              </div>
            )}
            <input {...register('imageUrl')} type="hidden" />
            {errors.imageUrl && (
              <p className="text-sm text-red-600">{errors.imageUrl.message}</p>
            )}
          </div>
        </div>

        {/* Thumbnail Upload (Optional) */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Thumbnail (Optional)
          </label>
          <div className="space-y-3">
            {uploadedFiles.thumbnail ? (
              <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center">
                  <Image className="h-5 w-5 text-green-600 mr-2" />
                  <span className="text-sm text-green-800">Thumbnail uploaded successfully</span>
                </div>
                <button
                  type="button"
                  onClick={() => setUploadedFiles(prev => ({ ...prev, thumbnail: '' }))}
                  className="text-green-600 hover:text-green-800"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                <div className="text-center">
                  <Image className="mx-auto h-8 w-8 text-gray-400" />
                  <div className="mt-2">
                    <label htmlFor="thumbnail-upload" className="cursor-pointer">
                      <span className="text-sm font-medium text-gray-900">Upload thumbnail</span>
                      <span className="block text-xs text-gray-500">JPG, PNG, WebP up to 10MB</span>
                    </label>
                    <input
                      id="thumbnail-upload"
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload(file, 'thumbnail');
                      }}
                    />
                  </div>
                </div>
              </div>
            )}
            <input {...register('thumbnailUrl')} type="hidden" />
          </div>
        </div>

        {/* Tags */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tags *
          </label>
          <div className="flex flex-wrap gap-2">
            {AVAILABLE_TAGS.map(tag => (
              <button
                key={tag}
                type="button"
                onClick={() => handleTagToggle(tag)}
                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  selectedTags.includes(tag)
                    ? 'bg-primary-100 text-primary-800 border border-primary-200'
                    : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
                }`}
              >
                {tag.replace('_', ' ')}
                {selectedTags.includes(tag) && (
                  <X className="ml-1 h-3 w-3" />
                )}
              </button>
            ))}
          </div>
          {errors.tags && (
            <p className="mt-1 text-sm text-red-600">{errors.tags.message}</p>
          )}
        </div>

        {/* Checkboxes */}
        <div className="md:col-span-2 space-y-4">
          <div className="flex items-center">
            <input
              {...register('isFeatured')}
              type="checkbox"
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <label className="ml-2 block text-sm text-gray-900">
              Featured content
            </label>
          </div>
          <div className="flex items-center">
            <input
              {...register('isActive')}
              type="checkbox"
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <label className="ml-2 block text-sm text-gray-900">
              Active (visible to users)
            </label>
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isLoading || uploadingFiles}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading || uploadingFiles ? (
            <>
              <LoadingSpinner size="sm" className="mr-2" />
              {uploadingFiles ? 'Uploading files...' : 'Saving...'}
            </>
          ) : (
            submitLabel
          )}
        </button>
      </div>
    </form>
  );
}
