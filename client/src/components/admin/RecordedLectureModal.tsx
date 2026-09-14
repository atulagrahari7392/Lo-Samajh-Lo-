import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  UploadCloud,
  HardDrive,
  Youtube,
  Play,
  CheckCircle2,
  AlertCircle,
  Clock,
  Film,
  Image as ImageIcon,
  Sparkles,
  Camera,
  RefreshCw,
  Trash2,
  ExternalLink,
  ShieldCheck,
  FileVideo,
  Eye,
  Check,
  AlertTriangle,
  Sliders,
  FileText,
  Plus,
  HelpCircle,
} from 'lucide-react';
import { api } from '../../services/api';
import { Course, RecordedClass, ClassResource } from '../../types';
import { useToast } from '../../context/ToastContext';
import { formatImageUrl, handleImageError, DEFAULT_LECTURE_THUMBNAIL } from '../../utils/image';

export type UploadState =
  | 'IDLE'
  | 'SELECTED'
  | 'VALIDATING'
  | 'UPLOADING'
  | 'PROCESSING'
  | 'SAVING'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED';

interface RecordedLectureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  courses: Course[];
  initialData?: RecordedClass | null; // For Edit mode
  defaultCourseId?: string;
}

export const RecordedLectureModal: React.FC<RecordedLectureModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  courses,
  initialData,
  defaultCourseId,
}) => {
  const { success: toastSuccess, error: toastError, info: toastInfo } = useToast();

  // Core Form Fields
  const [courseId, setCourseId] = useState(defaultCourseId || (courses[0]?.id ?? ''));
  const [title, setTitle] = useState('');
  const [chapter, setChapter] = useState('Chapter 1');
  const [durationMinutes, setDurationMinutes] = useState(45);
  const [videoUrl, setVideoUrl] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [description, setDescription] = useState('');
  const [isPublished, setIsPublished] = useState(true);

  // Related Quiz / Test
  const [quizId, setQuizId] = useState<string>('');
  const [availableTests, setAvailableTests] = useState<any[]>([]);

  // Class Resources (Notes, Practice Sheets, Worksheets)
  const [resources, setResources] = useState<ClassResource[]>([]);
  const [pendingResources, setPendingResources] = useState<any[]>([]);
  const [uploadingResource, setUploadingResource] = useState(false);
  const [resourceTypeToAdd, setResourceTypeToAdd] = useState<'NOTES' | 'PRACTICE_SHEET' | 'WORKSHEET' | 'OTHER'>('NOTES');
  const [resourceTitleToAdd, setResourceTitleToAdd] = useState('');

  // Video Source: 'drive' (Google Drive 5TB), 'upload' (Local server upload), 'youtube' (YouTube / URL)
  const [videoSource, setVideoSource] = useState<'drive' | 'upload' | 'youtube'>('drive');

  // Video File & Metadata
  const [selectedVideoFile, setSelectedVideoFile] = useState<File | null>(null);
  const [videoMetadata, setVideoMetadata] = useState<{
    name: string;
    sizeFormatted: string;
    sizeBytes: number;
    mimeType: string;
    durationSeconds: number;
    durationFormatted: string;
    resolution: string;
  } | null>(null);

  // Upload Progress & State
  const [uploadState, setUploadState] = useState<UploadState>('IDLE');
  const [uploadProgress, setUploadProgress] = useState({
    percent: 0,
    loaded: 0,
    total: 0,
    speedMB: '0.0 MB/s',
    etaFormatted: '',
  });
  const [errorMessage, setErrorMessage] = useState('');
  const [isCancelConfirmOpen, setIsCancelConfirmOpen] = useState(false);
  const cancelRef = useRef<{ cancel?: () => void }>({});

  // Duplicate File Check
  const [duplicateWarning, setDuplicateWarning] = useState<{
    name: string;
    existingUrl: string;
    sizeFormatted: string;
  } | null>(null);

  // Thumbnail Generator (Client-Side Canvas Extraction)
  const [isGeneratingThumbnail, setIsGeneratingThumbnail] = useState(false);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
  const [scrubberTime, setScrubberTime] = useState(2);
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);
  const thumbnailVideoRef = useRef<HTMLVideoElement | null>(null);

  // Completion State
  const [completedLecture, setCompletedLecture] = useState<{
    id: string;
    title: string;
    courseName: string;
    durationFormatted: string;
    videoSize: string;
    thumbnail: string | null;
    isPublished: boolean;
    storageProvider: string;
  } | null>(null);

  // Drag & Drop Highlight
  const [isDragging, setIsDragging] = useState(false);

  // Reset or Populate on Open
  useEffect(() => {
    if (!isOpen) {
      if (videoPreviewUrl) {
        URL.revokeObjectURL(videoPreviewUrl);
        setVideoPreviewUrl(null);
      }
      return;
    }

    // Fetch available tests for quiz association
    api.tests.adminGetAll().then((res) => {
      if (res.success && res.tests) {
        setAvailableTests(res.tests);
      }
    }).catch(() => {});

    if (initialData) {
      setCourseId(initialData.courseId);
      setTitle(initialData.title);
      setChapter(initialData.chapter || 'Chapter 1');
      setDurationMinutes(initialData.durationMinutes || 45);
      setVideoUrl(initialData.videoUrl);
      setThumbnailUrl(initialData.thumbnail || '');
      setDescription(initialData.description || '');
      setIsPublished(Boolean(initialData.isPublished));
      setQuizId(initialData.quizId || '');
      setResources(initialData.resources || []);
      setPendingResources([]);
      if (initialData.videoUrl.includes('youtube.com') || initialData.videoUrl.includes('youtu.be')) {
        setVideoSource('youtube');
      } else if (initialData.videoUrl.includes('drive.google.com')) {
        setVideoSource('drive');
      } else {
        setVideoSource('upload');
      }
      setUploadState('IDLE');
      setCompletedLecture(null);
    } else {
      setCourseId(defaultCourseId || (courses[0]?.id ?? ''));
      setTitle('');
      setChapter('Chapter 1');
      setDurationMinutes(45);
      setVideoUrl('');
      setThumbnailUrl('');
      setDescription('');
      setIsPublished(true);
      setQuizId('');
      setResources([]);
      setPendingResources([]);
      setVideoSource('drive');
      setSelectedVideoFile(null);
      setVideoMetadata(null);
      setUploadState('IDLE');
      setDuplicateWarning(null);
      setCompletedLecture(null);
    }
  }, [isOpen, initialData]);

  // Clean up object URL on unmount
  useEffect(() => {
    return () => {
      if (videoPreviewUrl) {
        URL.revokeObjectURL(videoPreviewUrl);
      }
    };
  }, [videoPreviewUrl]);

  // Format Helper: Bytes to MB/GB
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Format Helper: Seconds to MM:SS or HH:MM:SS
  const formatSeconds = (sec: number) => {
    const s = Math.floor(sec % 60);
    const m = Math.floor((sec / 60) % 60);
    const h = Math.floor(sec / 3600);
    if (h > 0) {
      return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // Handle Video File Selection & Extraction
  const handleSelectVideoFile = async (file: File) => {
    const validExtensions = ['.mp4', '.webm', '.mkv', '.mov'];
    const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
    if (!validExtensions.includes(ext)) {
      toastError(`Unsupported video format (${ext}). Supported formats: MP4, WebM, MKV.`);
      return;
    }

    const maxSizeBytes = 2 * 1024 * 1024 * 1024; // 2 GB
    if (file.size > maxSizeBytes) {
      toastError(`File is too large (${formatBytes(file.size)}). Maximum allowed size is 2 GB.`);
      return;
    }

    if (file.size === 0) {
      toastError('Selected file is empty or corrupted.');
      return;
    }

    try {
      const dupRes = await api.upload.checkDuplicate(file.name);
      if (dupRes?.exists && dupRes.asset) {
        setDuplicateWarning({
          name: dupRes.asset.name,
          existingUrl: dupRes.asset.webUrl,
          sizeFormatted: formatBytes(dupRes.asset.size),
        });
      } else {
        setDuplicateWarning(null);
      }
    } catch {
      setDuplicateWarning(null);
    }

    setSelectedVideoFile(file);
    setUploadState('SELECTED');
    setErrorMessage('');

    const objectUrl = URL.createObjectURL(file);
    setVideoPreviewUrl(objectUrl);

    const tempVideo = document.createElement('video');
    tempVideo.preload = 'metadata';
    tempVideo.src = objectUrl;

    tempVideo.onloadedmetadata = () => {
      const durationSec = Math.floor(tempVideo.duration) || 0;
      const width = tempVideo.videoWidth || 0;
      const height = tempVideo.videoHeight || 0;
      const resolution = width && height ? `${width} × ${height}` : 'Standard';

      setVideoMetadata({
        name: file.name,
        sizeFormatted: formatBytes(file.size),
        sizeBytes: file.size,
        mimeType: file.type || 'video/mp4',
        durationSeconds: durationSec,
        durationFormatted: formatSeconds(durationSec),
        resolution,
      });

      if (!title.trim()) {
        const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
        setTitle(cleanName.charAt(0).toUpperCase() + cleanName.slice(1));
      }

      if (durationSec > 0) {
        const mins = Math.max(1, Math.ceil(durationSec / 60));
        setDurationMinutes(mins);
      }
    };
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleSelectVideoFile(e.dataTransfer.files[0]);
    }
  };

  const executeUpload = async (): Promise<string | null> => {
    if (!selectedVideoFile) return videoUrl;

    setUploadState('UPLOADING');
    setErrorMessage('');
    setUploadProgress({
      percent: 0,
      loaded: 0,
      total: selectedVideoFile.size,
      speedMB: '0.0 MB/s',
      etaFormatted: 'Calculating...',
    });

    try {
      const res = await api.upload.uploadWithProgress(
        selectedVideoFile,
        {
          category: 'VIDEOS',
          entityType: 'RECORDED_CLASS',
        },
        (progress) => {
          const speedInMB = (progress.speedBytesPerSec / (1024 * 1024)).toFixed(1);
          let etaStr = '';
          if (progress.remainingSeconds > 0) {
            etaStr = progress.remainingSeconds > 60
              ? `~${Math.ceil(progress.remainingSeconds / 60)} min remaining`
              : `~${progress.remainingSeconds} sec remaining`;
          }

          setUploadProgress({
            percent: progress.percent,
            loaded: progress.loaded,
            total: progress.total,
            speedMB: `${speedInMB} MB/s`,
            etaFormatted: etaStr,
          });

          if (progress.percent >= 100) {
            setUploadState('PROCESSING');
          }
        },
        cancelRef.current
      );

      if (res.success && res.fileUrl) {
        setUploadState('SAVING');
        setVideoUrl(res.fileUrl);
        return res.fileUrl;
      } else {
        throw new Error(res.message || 'File processing failed on server');
      }
    } catch (err: any) {
      if (err.statusCode === -1 || err.message?.includes('cancelled')) {
        setUploadState('CANCELLED');
        toastInfo('Video upload was cancelled.');
      } else {
        setUploadState('FAILED');
        const reason = err.message || 'Network interruption or upload timeout. Please check your connection.';
        setErrorMessage(reason);
        toastError(`Upload failed: ${reason}`);
      }
      return null;
    }
  };

  const handleCancelUpload = () => {
    if (cancelRef.current.cancel) {
      cancelRef.current.cancel();
    }
    setIsCancelConfirmOpen(false);
  };

  const handleCaptureFrame = async () => {
    if (!thumbnailVideoRef.current) return;
    try {
      setUploadingThumbnail(true);
      const video = thumbnailVideoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 1280;
      canvas.height = video.videoHeight || 720;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas 2D context unavailable');

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      canvas.toBlob(
        async (blob) => {
          if (!blob) {
            toastError('Could not capture frame from video.');
            setUploadingThumbnail(false);
            return;
          }

          const frameFile = new File([blob], `thumb-${Date.now()}.jpg`, { type: 'image/jpeg' });
          try {
            const upRes = await api.upload.file(frameFile, { category: 'IMAGES' });
            if (upRes.success && upRes.fileUrl) {
              setThumbnailUrl(formatImageUrl(upRes.fileUrl, DEFAULT_LECTURE_THUMBNAIL));
              setIsGeneratingThumbnail(false);
              toastSuccess('Thumbnail frame captured & uploaded to Google Drive!');
            } else {
              toastError('Could not upload captured frame.');
            }
          } catch (e: any) {
            toastError(e.message || 'Failed to upload thumbnail');
          } finally {
            setUploadingThumbnail(false);
          }
        },
        'image/jpeg',
        0.88
      );
    } catch (err: any) {
      toastError(err.message || 'Error capturing video frame');
      setUploadingThumbnail(false);
    }
  };

  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validImageExts = ['.jpg', '.jpeg', '.png', '.webp'];
    const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
    if (!validImageExts.includes(ext)) {
      toastError('Thumbnail must be a JPG, PNG, or WebP image.');
      return;
    }

    try {
      setUploadingThumbnail(true);
      const res = await api.upload.file(file, { category: 'IMAGES' });
      if (res.success && res.fileUrl) {
        setThumbnailUrl(formatImageUrl(res.fileUrl, DEFAULT_LECTURE_THUMBNAIL));
        toastSuccess('Thumbnail uploaded successfully!');
      }
    } catch (err: any) {
      toastError(err.message || 'Failed to upload thumbnail');
    } finally {
      setUploadingThumbnail(false);
    }
  };

  const handleUploadResource = async (file: File) => {
    const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
    const allowedExts = ['.pdf', '.png', '.jpg', '.jpeg', '.doc', '.docx'];
    if (!allowedExts.includes(ext)) {
      toastError('Please upload a valid document (PDF, PNG, JPG, DOC).');
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      toastError('File size exceeds the allowed limit (50 MB).');
      return;
    }
    if (file.size === 0) {
      toastError('Selected file is empty or corrupted.');
      return;
    }

    try {
      setUploadingResource(true);
      const title = resourceTitleToAdd.trim() || file.name.replace(/\.[^/.]+$/, '');
      const uploadRes = await api.upload.file(file, { category: 'COURSES', entityType: 'RECORDED_CLASS' });
      if (!uploadRes.success) throw new Error('Upload failed');

      const sizeFormatted = (uploadRes as any).sizeFormatted || formatBytes(file.size);
      const newResData = {
        title,
        resourceType: resourceTypeToAdd,
        fileUrl: uploadRes.fileUrl,
        fileAssetId: uploadRes.driveFileId || null,
        fileSize: sizeFormatted,
        isPublished: true,
      };

      if (initialData?.id) {
        const addRes = await api.recorded.addResource(initialData.id, newResData);
        if (addRes.success && addRes.resource) {
          setResources((prev) => [...prev, addRes.resource]);
          toastSuccess(`${resourceTypeToAdd.replace('_', ' ')} attached successfully!`);
        }
      } else {
        setPendingResources((prev) => [...prev, newResData]);
        toastSuccess(`${resourceTypeToAdd.replace('_', ' ')} uploaded and will be saved with lecture.`);
      }
      setResourceTitleToAdd('');
    } catch (err: any) {
      toastError(err.message || 'Failed to upload study resource');
    } finally {
      setUploadingResource(false);
    }
  };

  const handleRemoveResource = async (resItem: any, index: number) => {
    try {
      if (resItem.id) {
        await api.recorded.deleteResource(resItem.id);
        setResources((prev) => prev.filter((r) => r.id !== resItem.id));
      } else {
        setPendingResources((prev) => prev.filter((_, i) => i !== index));
      }
      toastSuccess('Resource removed.');
    } catch (err: any) {
      toastError(err.message || 'Failed to remove resource');
    }
  };

  const handleSubmit = async (publishImmediate: boolean) => {
    if (!courseId) {
      toastError('Please select a course for this lecture.');
      return;
    }
    if (!title.trim()) {
      toastError('Lecture title is required.');
      return;
    }

    let finalVideoUrl = videoUrl;
    if ((videoSource === 'drive' || videoSource === 'upload') && selectedVideoFile && !videoUrl) {
      const uploadedUrl = await executeUpload();
      if (!uploadedUrl) return;
      finalVideoUrl = uploadedUrl;
    }

    if (!finalVideoUrl.trim()) {
      toastError('A valid video file or video URL is required.');
      return;
    }

    try {
      setUploadState('SAVING');

      const payload = {
        courseId,
        title: title.trim(),
        chapter: chapter.trim() || 'Chapter 1',
        durationMinutes: parseInt(String(durationMinutes), 10) || 45,
        videoUrl: finalVideoUrl.trim(),
        thumbnail: thumbnailUrl.trim() || null,
        description: description.trim() || null,
        isPublished: publishImmediate,
        quizId: quizId.trim() || null,
      };

      let resultLecture: RecordedClass;
      if (initialData?.id) {
        const res = await api.recorded.update(initialData.id, payload);
        if (!res.success) throw new Error(res.message || 'Update failed');
        resultLecture = res.lecture;
        toastSuccess('Recorded lecture updated successfully!');
      } else {
        const res = await api.recorded.create(payload);
        if (!res.success) throw new Error(res.message || 'Creation failed');
        resultLecture = res.recorded;

        // Attach any pending resources
        if (pendingResources.length > 0) {
          for (const pr of pendingResources) {
            await api.recorded.addResource(resultLecture.id, pr).catch(() => {});
          }
        }
        toastSuccess(publishImmediate ? 'Recorded lecture published successfully!' : 'Recorded lecture saved as draft!');
      }

      const selectedCourse = courses.find((c) => c.id === courseId);
      setCompletedLecture({
        id: resultLecture.id,
        title: resultLecture.title,
        courseName: selectedCourse?.title || 'Course Lecture',
        durationFormatted: `${resultLecture.durationMinutes} minutes`,
        videoSize: videoMetadata ? videoMetadata.sizeFormatted : 'Cloud Stream',
        thumbnail: resultLecture.thumbnail || null,
        isPublished: resultLecture.isPublished,
        storageProvider: videoSource === 'drive' ? 'Google Drive (5 TB Plan)' : videoSource === 'upload' ? 'Cloud Server' : 'YouTube Stream',
      });

      setUploadState('COMPLETED');
      onSuccess();
    } catch (err: any) {
      setUploadState('FAILED');
      setErrorMessage(err.message || 'Failed to save lecture metadata to database.');
      toastError(err.message || 'Error saving lecture to database');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl border border-slate-200 flex flex-col max-h-[92vh] overflow-hidden my-auto">
        {/* HEADER */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#6C63FF]/10 text-[#6C63FF] flex items-center justify-center font-bold">
              <Film className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {initialData ? 'Edit Recorded Lecture' : 'Add Recorded Lecture'}
              </h2>
              <p className="text-xs text-slate-500">
                {initialData ? 'Update video media and lecture settings' : 'Upload lecture video to 5 TB Google Drive storage with student player preview'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* BODY */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {uploadState === 'COMPLETED' && completedLecture ? (
            <div className="py-8 px-4 text-center space-y-6 animate-in zoom-in-95 duration-200">
              <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-inner border border-emerald-100">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                  <Check className="w-3.5 h-3.5" />
                  Lecture Saved Successfully
                </span>
                <h3 className="text-xl font-extrabold text-slate-900 mt-2">{completedLecture.title}</h3>
                <p className="text-xs text-slate-500 mt-0.5">{completedLecture.courseName}</p>
              </div>

              {/* Summary Card */}
              <div className="max-w-md mx-auto bg-slate-50 border border-slate-200/80 rounded-2xl p-4 text-left grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 font-semibold block text-[10px] uppercase">Storage Backend</span>
                  <span className="font-bold text-slate-800 flex items-center gap-1 mt-0.5">
                    <HardDrive className="w-3.5 h-3.5 text-emerald-600" />
                    {completedLecture.storageProvider}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold block text-[10px] uppercase">Duration</span>
                  <span className="font-bold text-slate-800 block mt-0.5">{completedLecture.durationFormatted}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold block text-[10px] uppercase">File Size</span>
                  <span className="font-bold text-slate-800 block mt-0.5">{completedLecture.videoSize}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold block text-[10px] uppercase">Status</span>
                  <span
                    className={`inline-block font-bold mt-0.5 px-2 py-0.5 rounded text-[10px] ${
                      completedLecture.isPublished
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}
                  >
                    {completedLecture.isPublished ? 'Published to Students' : 'Draft Mode'}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setUploadState('IDLE');
                    setCompletedLecture(null);
                    setSelectedVideoFile(null);
                    setVideoUrl('');
                    setTitle('');
                  }}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-[#6C63FF] hover:bg-[#584feb] transition-colors shadow-md shadow-[#6C63FF]/20"
                >
                  Upload Another Lecture
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
                >
                  Done & Close
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* SECTION 1: LECTURE DETAILS */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 block">Course *</label>
                    <select
                      required
                      value={courseId}
                      onChange={(e) => setCourseId(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium bg-white focus:ring-2 focus:ring-[#6C63FF]/30 outline-none"
                    >
                      {courses.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 block">Chapter / Section</label>
                    <input
                      type="text"
                      value={chapter}
                      onChange={(e) => setChapter(e.target.value)}
                      placeholder="e.g. Chapter 2 - Modern History"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-[#6C63FF]/30 outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">Lecture Title *</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Indian National Movement - Part 1"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-[#6C63FF]/30 outline-none"
                  />
                </div>
              </div>

              {/* SECTION 2: VIDEO SOURCE SELECTOR */}
              <div className="space-y-3 pt-2">
                <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                  <span>Video Source *</span>
                  <span className="text-[10px] text-slate-400 font-normal">Choose upload method</span>
                </label>

                <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-2xl text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setVideoSource('drive')}
                    className={`py-2 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
                      videoSource === 'drive'
                        ? 'bg-white text-emerald-600 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <HardDrive className="w-4 h-4" />
                    <span className="hidden sm:inline">Google Drive (5TB)</span>
                    <span className="sm:hidden">Drive (5TB)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setVideoSource('upload')}
                    className={`py-2 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
                      videoSource === 'upload'
                        ? 'bg-white text-[#6C63FF] shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <UploadCloud className="w-4 h-4" />
                    <span className="hidden sm:inline">Local Upload</span>
                    <span className="sm:hidden">Local</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setVideoSource('youtube')}
                    className={`py-2 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
                      videoSource === 'youtube'
                        ? 'bg-white text-red-600 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Youtube className="w-4 h-4" />
                    <span className="hidden sm:inline">YouTube / URL</span>
                    <span className="sm:hidden">YouTube</span>
                  </button>
                </div>

                {videoSource === 'drive' && (
                  <div className="p-3.5 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 font-bold text-emerald-800">
                        <HardDrive className="w-4 h-4 text-emerald-600" />
                        <span>Google Drive Storage Active</span>
                      </div>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-200/80 text-emerald-800">
                        <Check className="w-3 h-3" /> Connected ✓
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      All uploaded video lectures stream directly to your 5 TB Google Drive storage under{' '}
                      <code className="bg-emerald-100/60 px-1 py-0.5 rounded text-emerald-900 font-mono text-[10px]">
                        LoSamajhLo / Videos /
                      </code>
                    </p>
                  </div>
                )}
              </div>

              {/* SECTION 3: VIDEO UPLOAD ZONE OR URL INPUT */}
              {videoSource === 'youtube' ? (
                <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 block">Video URL *</label>
                    <input
                      type="url"
                      required
                      value={videoUrl}
                      onChange={(e) => {
                        const val = e.target.value.trim();
                        const ytMatch = val.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([a-zA-Z0-9_-]+)/);
                        if (ytMatch && ytMatch[1]) {
                          setVideoUrl(`https://www.youtube.com/embed/${ytMatch[1]}`);
                        } else {
                          setVideoUrl(val);
                        }
                      }}
                      placeholder="https://www.youtube.com/watch?v=... or https://..."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-[#6C63FF]/30 outline-none bg-white"
                    />
                  </div>

                  {videoUrl && (
                    <div className="aspect-video w-full rounded-xl overflow-hidden bg-black shadow-sm">
                      <iframe
                        src={videoUrl}
                        title="Video Preview"
                        className="w-full h-full border-0"
                        allowFullScreen
                      />
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {!selectedVideoFile && !videoUrl ? (
                    <div
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      className={`relative border-2 border-dashed rounded-3xl p-8 text-center transition-all cursor-pointer ${
                        isDragging
                          ? 'border-[#6C63FF] bg-[#6C63FF]/5 scale-[1.01]'
                          : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                      }`}
                    >
                      <input
                        type="file"
                        accept="video/mp4,video/webm,video/mkv,video/quicktime"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            handleSelectVideoFile(e.target.files[0]);
                          }
                        }}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                      />

                      <div className="w-14 h-14 rounded-2xl bg-white shadow-sm border border-slate-100 flex items-center justify-center mx-auto text-[#6C63FF] mb-3">
                        <UploadCloud className="w-7 h-7" />
                      </div>

                      <h4 className="text-sm font-bold text-slate-800">
                        Drag & Drop Video File Here
                      </h4>
                      <p className="text-xs text-slate-500 mt-1">or click to browse from your computer</p>

                      <div className="inline-flex items-center gap-2 mt-4 px-3 py-1 rounded-full bg-white border border-slate-200 text-[11px] font-semibold text-slate-600 shadow-sm">
                        <span>MP4 • WebM • MKV</span>
                        <span className="text-slate-300">|</span>
                        <span>Max 2 GB</span>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-12 h-12 rounded-xl bg-[#6C63FF]/10 text-[#6C63FF] flex items-center justify-center shrink-0">
                            <FileVideo className="w-6 h-6" />
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-xs font-bold text-slate-900 truncate" title={videoMetadata?.name || videoUrl}>
                              {videoMetadata?.name || videoUrl.slice(0, 50)}
                            </h4>
                            <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5 flex-wrap">
                              {videoMetadata && (
                                <>
                                  <span className="font-semibold text-slate-700">{videoMetadata.sizeFormatted}</span>
                                  <span>•</span>
                                  <span>{videoMetadata.resolution}</span>
                                  <span>•</span>
                                  <span className="flex items-center gap-0.5">
                                    <Clock className="w-3 h-3" />
                                    {videoMetadata.durationFormatted}
                                  </span>
                                </>
                              )}
                              {videoUrl && (
                                <span className="text-emerald-600 font-bold flex items-center gap-0.5">
                                  <CheckCircle2 className="w-3 h-3" /> Ready
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {uploadState !== 'UPLOADING' && uploadState !== 'PROCESSING' && (
                          <div className="flex items-center gap-1 shrink-0">
                            <label className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-200 cursor-pointer transition-colors text-xs font-semibold">
                              Change
                              <input
                                type="file"
                                accept="video/mp4,video/webm,video/mkv,video/quicktime"
                                onChange={(e) => {
                                  if (e.target.files && e.target.files[0]) {
                                    handleSelectVideoFile(e.target.files[0]);
                                  }
                                }}
                                className="hidden"
                              />
                            </label>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedVideoFile(null);
                                setVideoMetadata(null);
                                setVideoUrl('');
                                setUploadState('IDLE');
                                setDuplicateWarning(null);
                              }}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                              title="Remove file"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>

                      {duplicateWarning && (
                        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-2">
                          <div className="flex items-center gap-1.5 font-bold text-amber-800">
                            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                            <span>A file named "{duplicateWarning.name}" already exists in storage.</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setVideoUrl(duplicateWarning.existingUrl);
                                setDuplicateWarning(null);
                                toastInfo('Reusing existing file asset from storage.');
                              }}
                              className="px-3 py-1 bg-amber-200 hover:bg-amber-300 text-amber-900 rounded-lg text-xs font-bold transition-colors"
                            >
                              Use Existing File
                            </button>
                            <button
                              type="button"
                              onClick={() => setDuplicateWarning(null)}
                              className="px-3 py-1 bg-white hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
                            >
                              Upload As New
                            </button>
                          </div>
                        </div>
                      )}

                      {(uploadState === 'UPLOADING' || uploadState === 'PROCESSING') && (
                        <div className="space-y-2 pt-2 border-t border-slate-200/60">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-slate-700 flex items-center gap-1.5">
                              <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#6C63FF]" />
                              {uploadState === 'PROCESSING' ? 'Processing on Google Drive...' : 'Uploading video stream...'}
                            </span>
                            <span className="font-mono font-bold text-[#6C63FF]">{uploadProgress.percent}%</span>
                          </div>

                          <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-[#6C63FF] to-indigo-500 transition-all duration-200 ease-out"
                              style={{ width: `${uploadProgress.percent}%` }}
                            />
                          </div>

                          <div className="flex items-center justify-between text-[11px] text-slate-500">
                            <span>
                              {formatBytes(uploadProgress.loaded)} / {formatBytes(uploadProgress.total)}
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-slate-700">{uploadProgress.speedMB}</span>
                              {uploadProgress.etaFormatted && (
                                <span className="text-slate-400 font-mono">({uploadProgress.etaFormatted})</span>
                              )}
                            </div>
                          </div>

                          <div className="flex justify-end pt-1">
                            <button
                              type="button"
                              onClick={() => setIsCancelConfirmOpen(true)}
                              className="text-xs text-rose-600 hover:text-rose-700 font-semibold transition-colors"
                            >
                              Cancel Upload
                            </button>
                          </div>
                        </div>
                      )}

                      {uploadState === 'FAILED' && (
                        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl space-y-2 text-xs">
                          <div className="flex items-center gap-1.5 font-bold text-rose-800">
                            <AlertCircle className="w-4 h-4 text-rose-600" />
                            <span>Upload failed: {errorMessage}</span>
                          </div>
                          <button
                            type="button"
                            onClick={executeUpload}
                            className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold text-xs transition-colors shadow-sm"
                          >
                            <RefreshCw className="w-3 h-3" />
                            Retry Upload
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* SECTION 4: THUMBNAIL SYSTEM */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-[#6C63FF]" />
                    <span>Lecture Thumbnail (16:9 recommended)</span>
                  </label>
                  {thumbnailUrl && (
                    <button
                      type="button"
                      onClick={() => setThumbnailUrl('')}
                      className="text-[11px] text-rose-600 hover:underline font-semibold"
                    >
                      Remove Thumbnail
                    </button>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row items-start gap-4">
                  <div className="w-full sm:w-48 aspect-video rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden shrink-0 relative group">
                    {thumbnailUrl ? (
                      <img
                        src={formatImageUrl(thumbnailUrl, DEFAULT_LECTURE_THUMBNAIL)}
                        alt="Thumbnail"
                        onError={handleImageError(DEFAULT_LECTURE_THUMBNAIL)}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-center p-3 text-slate-400 space-y-1">
                        <ImageIcon className="w-6 h-6 mx-auto opacity-50" />
                        <span className="text-[10px] block font-medium">No Thumbnail</span>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors">
                        <UploadCloud className="w-3.5 h-3.5" />
                        <span>{uploadingThumbnail ? 'Uploading...' : 'Upload Image'}</span>
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          disabled={uploadingThumbnail}
                          onChange={handleThumbnailUpload}
                          className="hidden"
                        />
                      </label>

                      {videoPreviewUrl && (
                        <button
                          type="button"
                          onClick={() => setIsGeneratingThumbnail(!isGeneratingThumbnail)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#6C63FF]/10 hover:bg-[#6C63FF]/20 text-[#6C63FF] text-xs font-bold transition-colors"
                        >
                          <Camera className="w-3.5 h-3.5" />
                          <span>Generate from Video Frame</span>
                        </button>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Standard aspect ratio 16:9 (1280×720 or 1920×1080). JPG, PNG, or WebP.
                    </p>
                  </div>
                </div>

                {isGeneratingThumbnail && videoPreviewUrl && (
                  <div className="p-4 bg-slate-900 rounded-2xl text-white space-y-3 animate-in fade-in-50">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold flex items-center gap-1.5 text-[#8f88ff]">
                        <Sliders className="w-4 h-4" />
                        Select Frame for Thumbnail
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsGeneratingThumbnail(false)}
                        className="text-xs text-slate-400 hover:text-white"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="aspect-video w-full rounded-xl overflow-hidden bg-black relative max-h-56">
                      <video
                        ref={thumbnailVideoRef}
                        src={videoPreviewUrl}
                        className="w-full h-full object-contain"
                        crossOrigin="anonymous"
                        playsInline
                        muted
                      />
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span>Time: {formatSeconds(scrubberTime)}</span>
                        <span>Total: {videoMetadata?.durationFormatted || '00:00'}</span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={videoMetadata?.durationSeconds || 100}
                        step={0.5}
                        value={scrubberTime}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          setScrubberTime(val);
                          if (thumbnailVideoRef.current) {
                            thumbnailVideoRef.current.currentTime = val;
                          }
                        }}
                        className="w-full accent-[#6C63FF] cursor-pointer"
                      />
                    </div>

                    <button
                      type="button"
                      disabled={uploadingThumbnail}
                      onClick={handleCaptureFrame}
                      className="w-full py-2 bg-[#6C63FF] hover:bg-[#584feb] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-md transition-all"
                    >
                      <Camera className="w-4 h-4" />
                      {uploadingThumbnail ? 'Saving Frame...' : 'Use This Frame as Thumbnail'}
                    </button>
                  </div>
                )}
              </div>

              {/* SECTION 5: DURATION & DESCRIPTION */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-100">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">Duration (Minutes)</label>
                  <input
                    type="number"
                    min={1}
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(parseInt(e.target.value, 10) || 1)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-[#6C63FF]/30 outline-none"
                  />
                  {videoMetadata && (
                    <span className="text-[10px] text-slate-400 block">
                      Auto-detected: {videoMetadata.durationFormatted}
                    </span>
                  )}
                </div>

                <div className="sm:col-span-2 space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">Description (Optional)</label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Key concepts, topics or exam highlights covered..."
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-[#6C63FF]/30 outline-none"
                  />
                </div>
              </div>

              {/* SECTION 6: RELATED QUIZ / TEST */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2.5">
                <div>
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <HelpCircle className="w-4 h-4 text-[#6C63FF]" />
                    Related Examination / Quiz (Optional)
                  </label>
                  <p className="text-[11px] text-slate-500">
                    Link an existing test to this class. Students will see a "Take Quiz" option directly beside the lecture.
                  </p>
                </div>

                <select
                  value={quizId}
                  onChange={(e) => setQuizId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 bg-white focus:ring-2 focus:ring-[#6C63FF]/30 outline-none"
                >
                  <option value="">-- No Quiz Associated (None) --</option>
                  {availableTests.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.title} ({t.durationMinutes} mins • {t.totalMarks} marks)
                    </option>
                  ))}
                </select>
              </div>

              {/* SECTION 7: CLASS STUDY RESOURCES (Class Notes & Practice Sheets) */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3.5">
                <div>
                  <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-[#6C63FF]" />
                    Class Study Resources (Notes & Practice Sheets)
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Attach PDFs stored in Google Drive 5TB storage. Students can open notes inside the website.
                  </p>
                </div>

                {/* Attached Resources List */}
                {[...resources, ...pendingResources].length > 0 ? (
                  <div className="space-y-2">
                    {[...resources, ...pendingResources].map((item, idx) => (
                      <div
                        key={item.id || idx}
                        className="flex items-center justify-between p-3 rounded-xl bg-white border border-slate-200 shadow-2xs text-xs"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${
                            item.resourceType === 'NOTES'
                              ? 'bg-blue-100 text-blue-800'
                              : item.resourceType === 'PRACTICE_SHEET'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-purple-100 text-purple-800'
                          }`}>
                            {item.resourceType?.replace('_', ' ') || 'NOTES'}
                          </span>
                          <span className="font-bold text-slate-800 truncate">{item.title}</span>
                          <span className="text-[10px] text-slate-400">({item.fileSize || 'PDF'})</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <a
                            href={item.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                            title="Preview file"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                          <button
                            type="button"
                            onClick={() => handleRemoveResource(item, idx)}
                            className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50"
                            title="Remove resource"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-400 italic">No study resources attached to this lecture yet.</p>
                )}

                {/* Upload New Resource Strip */}
                <div className="pt-2 border-t border-slate-200 flex flex-col sm:flex-row items-center gap-2">
                  <select
                    value={resourceTypeToAdd}
                    onChange={(e) => setResourceTypeToAdd(e.target.value as any)}
                    className="w-full sm:w-44 px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-white outline-none"
                  >
                    <option value="NOTES">Class Notes (PDF)</option>
                    <option value="PRACTICE_SHEET">Practice Sheet (PDF)</option>
                    <option value="WORKSHEET">Worksheet</option>
                    <option value="OTHER">Other Material</option>
                  </select>

                  <input
                    type="text"
                    value={resourceTitleToAdd}
                    onChange={(e) => setResourceTitleToAdd(e.target.value)}
                    placeholder="Document title (optional)"
                    className="w-full sm:flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 bg-white outline-none"
                  />

                  <label className="w-full sm:w-auto px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors shrink-0">
                    <UploadCloud className="w-3.5 h-3.5" />
                    <span>{uploadingResource ? 'Uploading...' : 'Upload PDF'}</span>
                    <input
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                      disabled={uploadingResource}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleUploadResource(file);
                        e.target.value = '';
                      }}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* SECTION 8: PUBLISH SETTINGS */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center justify-between">
                <div>
                  <label htmlFor="publish-immediate" className="text-xs font-bold text-slate-800 cursor-pointer block">
                    Publish immediately for enrolled students
                  </label>
                  <p className="text-[11px] text-slate-500">
                    {isPublished
                      ? 'Students will see this recorded lecture right away in their course dashboard.'
                      : 'Saved as draft. Only administrators can view this lecture.'}
                  </p>
                </div>
                <input
                  id="publish-immediate"
                  type="checkbox"
                  checked={isPublished}
                  onChange={(e) => setIsPublished(e.target.checked)}
                  className="w-5 h-5 rounded text-[#6C63FF] focus:ring-[#6C63FF] cursor-pointer"
                />
              </div>
            </>
          )}
        </div>

        {/* FOOTER ACTIONS */}
        {uploadState !== 'COMPLETED' && (
          <div className="px-6 py-4 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200/60 transition-colors"
            >
              Cancel
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={uploadState === 'UPLOADING' || uploadState === 'PROCESSING' || uploadState === 'SAVING'}
                onClick={() => handleSubmit(false)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 transition-colors disabled:opacity-50"
              >
                Save as Draft
              </button>

              <button
                type="button"
                disabled={uploadState === 'UPLOADING' || uploadState === 'PROCESSING' || uploadState === 'SAVING'}
                onClick={() => handleSubmit(true)}
                className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-[#6C63FF] hover:bg-[#584feb] transition-all shadow-md shadow-[#6C63FF]/20 disabled:opacity-50 flex items-center gap-1.5"
              >
                {(uploadState === 'UPLOADING' || uploadState === 'PROCESSING' || uploadState === 'SAVING') && (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                )}
                <span>
                  {uploadState === 'UPLOADING'
                    ? 'Uploading Video...'
                    : uploadState === 'PROCESSING'
                    ? 'Saving to Drive...'
                    : uploadState === 'SAVING'
                    ? 'Finalizing...'
                    : initialData
                    ? 'Update Lecture'
                    : 'Publish Lecture'}
                </span>
              </button>
            </div>
          </div>
        )}

        {/* Cancel Upload Confirmation Modal */}
        {isCancelConfirmOpen && (
          <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 p-4">
            <div className="bg-white max-w-sm w-full rounded-2xl p-5 space-y-4 shadow-2xl border border-slate-200 text-center animate-in zoom-in-95">
              <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm">Cancel upload?</h4>
                <p className="text-xs text-slate-500 mt-1">
                  The current video upload will be stopped and partial files will be discarded.
                </p>
              </div>
              <div className="flex items-center justify-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCancelConfirmOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
                >
                  Continue Upload
                </button>
                <button
                  type="button"
                  onClick={handleCancelUpload}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 transition-colors shadow-sm"
                >
                  Cancel Upload
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecordedLectureModal;
