import { forwardRef, useState, useRef } from 'react';
import type { InputHTMLAttributes } from 'react';
import { cn } from '../../../lib/utils';
import { Upload, X, Image, File as FileIcon, AlertCircle, CheckCircle } from 'lucide-react';
import { compressImage } from '../../../lib/utils';

export interface FileUploadProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  label?: string;
  error?: string;
  helperText?: string;
  accept?: string;
  multiple?: boolean;
  maxFiles?: number;
  maxSize?: number; // in KB
  onFilesChange?: (files: File[]) => void;
  preview?: boolean;
  compression?: boolean;
  compressionQuality?: number;
  required?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  uploadedFiles?: File[];
  onRemoveFile?: (index: number) => void;
}

interface UploadedFile {
  id: string;
  file: File;
  previewUrl?: string;
  error?: string;
  uploading?: boolean;
}

const FileUpload = forwardRef<HTMLInputElement, FileUploadProps>(
  ({
    className,
    label,
    error,
    helperText,
    accept = 'image/*',
    multiple = false,
    maxFiles = 3,
    maxSize = 2048, // 2MB
    onFilesChange,
    preview = true,
    compression = true,
    compressionQuality = 0.8,
    required = false,
    disabled = false,
    fullWidth = true,
    uploadedFiles = [],
    onRemoveFile,
    id,
    ...props
  }, ref) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const [files, setFiles] = useState<UploadedFile[]>([]);
    const [dragActive, setDragActive] = useState(false);
    
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

    const getFileIcon = (fileType: string) => {
      if (fileType.startsWith('image/')) return <Image className="w-5 h-5" />;
      return <FileIcon className="w-5 h-5" />;
    };

    const formatFileSize = (bytes: number) => {
      if (bytes === 0) return '0 Bytes';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const validateFile = (file: File): string | null => {
      // Check file size
      if (file.size > maxSize * 1024) {
        return `File size must be less than ${maxSize}KB`;
      }

      // Check file type
      if (accept !== '*' && !accept.split(',').some(type => {
        const pattern = type.trim().replace('*', '.*');
        return new RegExp(`^${pattern}$`).test(file.type);
      })) {
        return `File type must be ${accept}`;
      }

      return null;
    };

    const handleFileChange = async (newFiles: FileList) => {
      const fileArray = Array.from(newFiles);
      
      // Check max files limit
      const totalFiles = files.length + fileArray.length;
      if (totalFiles > maxFiles) {
        alert(`Maximum ${maxFiles} files allowed`);
        return;
      }

      const newUploadedFiles: UploadedFile[] = [];

      for (const file of fileArray) {
        const error = validateFile(file);
        
        if (error) {
          newUploadedFiles.push({
            id: Math.random().toString(36).substr(2, 9),
            file,
            error,
          });
          continue;
        }

        let processedFile: File | Blob = file;
        
        // Compress image if enabled
        if (compression && file.type.startsWith('image/')) {
          try {
            const compressed = await compressImage(file);
            // If compressImage returns a Blob, wrap it into a File to preserve File properties
            if (compressed instanceof File) {
              processedFile = compressed;
            } else {
              processedFile = new File(
                [compressed],
                file.name,
                { type: compressed.type || file.type, lastModified: file.lastModified ?? Date.now() }
              );
            }
          } catch (err) {
            console.error('Failed to compress image:', err);
            processedFile = file;
          }
        }

        const uploadedFile: UploadedFile = {
          id: Math.random().toString(36).substr(2, 9),
          file: processedFile as File,
          uploading: false,
        };

        // Create preview URL for images
        if (preview && (processedFile as File).type.startsWith('image/')) {
          uploadedFile.previewUrl = URL.createObjectURL(processedFile as File);
        }

        newUploadedFiles.push(uploadedFile);
      }

      const updatedFiles = [...files, ...newUploadedFiles];
      setFiles(updatedFiles);
      
      // Call onChange with just the File objects
      if (onFilesChange) {
        onFilesChange(updatedFiles.map(f => f.file));
      }

      // Reset input
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    };

    const handleRemoveFile = (index: number) => {
      const fileToRemove = files[index];
      
      // Revoke object URL to prevent memory leaks
      if (fileToRemove.previewUrl) {
        URL.revokeObjectURL(fileToRemove.previewUrl);
      }

      const updatedFiles = files.filter((_, i) => i !== index);
      setFiles(updatedFiles);
      
      if (onFilesChange) {
        onFilesChange(updatedFiles.map(f => f.file));
      }
      
      if (onRemoveFile) {
        onRemoveFile(index);
      }
    };

    const handleDrag = (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      
      if (e.type === 'dragenter' || e.type === 'dragover') {
        setDragActive(true);
      } else if (e.type === 'dragleave') {
        setDragActive(false);
      }
    };

    const handleDrop = (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);
      
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        handleFileChange(e.dataTransfer.files);
      }
    };

    const handleButtonClick = () => {
      inputRef.current?.click();
    };

    return (
      <div className={cn('space-y-3', fullWidth && 'w-full')}>
        {label && (
          <div className="flex items-center justify-between">
            <label
              htmlFor={inputId}
              className="block text-sm font-medium text-foreground"
            >
              {label}
              {required && <span className="text-danger ml-1">*</span>}
            </label>
            <span className="text-xs text-muted-foreground">
              {files.length}/{maxFiles} files
            </span>
          </div>
        )}

        {/* Hidden file input */}
        <input
          ref={(node) => {
            if (typeof ref === 'function') {
              ref(node);
            } else if (ref) {
              ref.current = node;
            }
            inputRef.current = node;
          }}
          type="file"
          id={inputId}
          accept={accept}
          multiple={multiple}
          onChange={(e) => e.target.files && handleFileChange(e.target.files)}
          disabled={disabled || files.length >= maxFiles}
          className="hidden"
          {...props}
        />

        {/* Drop Zone */}
        <div
          className={cn(
            'border-2 border-dashed rounded-lg p-6 text-center transition-all duration-200',
            dragActive
              ? 'border-primary bg-primary-muted border-solid'
              : 'border-border hover:border-primary hover:bg-accent/5',
            error && 'border-danger',
            disabled && 'opacity-50 cursor-not-allowed',
            className
          )}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={handleButtonClick}
        >
          <div className="space-y-3">
            <div className="flex justify-center">
              <div className={cn(
                'p-3 rounded-full',
                dragActive ? 'bg-primary/10' : 'bg-muted'
              )}>
                <Upload className={cn(
                  'w-6 h-6',
                  dragActive ? 'text-primary' : 'text-muted-foreground'
                )} />
              </div>
            </div>
            
            <div>
              <p className="font-medium text-foreground">
                Drag & drop files or{' '}
                <span className="text-primary hover:underline cursor-pointer">
                  browse
                </span>
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {accept === 'image/*' ? 'Images' : 'Files'} up to {maxSize}KB
                {multiple && ` • Max ${maxFiles} files`}
              </p>
            </div>
          </div>
        </div>

        {/* File Previews */}
        {preview && files.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {files.map((file, index) => (
              <div
                key={file.id}
                className={cn(
                  'relative rounded-lg border p-3 group',
                  file.error ? 'border-danger/50' : 'border-border'
                )}
              >
                {/* Remove Button */}
                <button
                  type="button"
                  onClick={() => handleRemoveFile(index)}
                  className="absolute -top-2 -right-2 bg-danger text-danger-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity touch-target z-10"
                  aria-label={`Remove ${file.file.name}`}
                >
                  <X className="w-4 h-4" />
                </button>

                {/* File Preview */}
                {file.previewUrl ? (
                  <div className="aspect-square rounded overflow-hidden mb-2 bg-muted">
                    <img
                      src={file.previewUrl}
                      alt={file.file.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="aspect-square rounded overflow-hidden mb-2 bg-muted flex items-center justify-center">
                    {getFileIcon(file.file.type)}
                  </div>
                )}

                {/* File Info */}
                <div className="space-y-1">
                  <p className="text-sm font-medium truncate" title={file.file.name}>
                    {file.file.name}
                  </p>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{formatFileSize(file.file.size)}</span>
                    {file.error ? (
                      <AlertCircle className="w-3 h-3 text-danger" />
                    ) : file.uploading ? (
                      <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <CheckCircle className="w-3 h-3 text-success" />
                    )}
                  </div>
                  
                  {file.error && (
                    <p className="text-xs text-danger mt-1">{file.error}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Non-preview file list */}
        {!preview && files.length > 0 && (
          <div className="space-y-2">
            {files.map((file, index) => (
              <div
                key={file.id}
                className="flex items-center justify-between p-2 rounded bg-muted"
              >
                <div className="flex items-center gap-2">
                  {getFileIcon(file.file.type)}
                  <span className="text-sm truncate max-w-[200px]">
                    {file.file.name}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground">
                    {formatFileSize(file.file.size)}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveFile(index)}
                    className="text-danger hover:text-danger/80 p-1 touch-target"
                    aria-label={`Remove ${file.file.name}`}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {error && (
          <div className="flex items-center gap-1 text-sm text-danger">
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </div>
        )}

        {helperText && !error && (
          <p className="text-sm text-muted-foreground">{helperText}</p>
        )}
      </div>
    );
  }
);

FileUpload.displayName = 'FileUpload';
export default FileUpload;