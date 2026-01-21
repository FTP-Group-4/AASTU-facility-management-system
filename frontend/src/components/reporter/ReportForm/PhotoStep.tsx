import { useState, useRef } from 'react';
import { Camera, Upload, X, Image, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import Button from '../../common/UI/Button';
import { compressImage } from '../../../lib/utils';
import { cn } from '../../../lib/utils';

interface PhotoStepProps {
  photos: string[]; // base64 strings
  onChange: (photos: string[]) => void;
  maxPhotos?: number;
  maxSize?: number; // in KB
}

const PhotoStep = ({ 
  photos, 
  onChange, 
  maxPhotos = 3, 
  maxSize = 2048 
}: PhotoStepProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    if (photos.length + files.length > maxPhotos) {
      setError(`Maximum ${maxPhotos} photos allowed`);
      return;
    }

    const newPhotos: string[] = [];
    const errors: string[] = [];

    for (const file of Array.from(files)) {
      // Check file type
      if (!file.type.startsWith('image/')) {
        errors.push(`${file.name}: Not an image file`);
        continue;
      }

      // Check file size
      if (file.size > maxSize * 1024) {
        errors.push(`${file.name}: File too large (max ${maxSize}KB)`);
        continue;
      }

      try {
        // Compress image
        const compressedFile = await compressImage(file);
        
        // Convert to base64
        const reader = new FileReader();
        const base64 = await new Promise<string>((resolve, reject) => {
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(compressedFile);
        });

        newPhotos.push(base64);
      } catch (err) {
        errors.push(`${file.name}: Failed to process image`);
      }
    }

    if (errors.length > 0) {
      setError(errors.join(', '));
    }

    if (newPhotos.length > 0) {
      onChange([...photos, ...newPhotos]);
    }

    // Clear file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemovePhoto = (index: number) => {
    const newPhotos = [...photos];
    newPhotos.splice(index, 1);
    onChange(newPhotos);
  };

  const handleCapturePhoto = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setError('Camera not supported on this device');
      return;
    }

    setIsCapturing(true);
    setError(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      // Implement camera capture logic here
      // This would require a more complex implementation with video element
      stream.getTracks().forEach(track => track.stop());
      
      // For now, we'll just simulate with file input
      fileInputRef.current?.click();
    } catch (err: any) {
      setError('Camera access denied or not available');
    } finally {
      setIsCapturing(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    handleFileSelect(e.dataTransfer.files);
  };

  return (
    <div className="space-y-6">
      {/* Instructions */}
      <div>
        <h3 className="text-lg font-medium mb-2">Add Photos</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Upload {maxPhotos === 1 ? '1 photo' : `1-${maxPhotos} photos`} to help the maintenance team understand the issue. 
          Clear photos lead to faster resolution.
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-danger-light text-danger rounded-lg p-3 flex items-start gap-2 animate-fade-in">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm">{error}</p>
          </div>
          <button
            type="button"
            onClick={() => setError(null)}
            className="text-danger hover:text-danger/80"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Upload Area */}
      {photos.length < maxPhotos && (
        <div
          className={cn(
            'border-2 border-dashed rounded-lg p-8 text-center transition-all',
            'border-border hover:border-primary hover:bg-accent/5',
            'cursor-pointer'
          )}
          onClick={() => fileInputRef.current?.click()}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <div className="space-y-3">
            <div className="flex justify-center">
              <div className="p-3 rounded-full bg-primary/10">
                <Upload className="w-6 h-6 text-primary" />
              </div>
            </div>
            
            <div>
              <p className="font-medium text-foreground">
                Drag & drop photos or{' '}
                <span className="text-primary hover:underline">browse</span>
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                JPEG, PNG up to {maxSize}KB • {maxPhotos - photos.length} more allowed
              </p>
            </div>

            <div className="flex justify-center gap-3 pt-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
                className="gap-2"
              >
                <Upload className="w-4 h-4" />
                Upload from Device
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleCapturePhoto();
                }}
                disabled={isCapturing}
                className="gap-2"
              >
                <Camera className="w-4 h-4" />
                {isCapturing ? 'Capturing...' : 'Take Photo'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple={maxPhotos > 1}
        capture="environment"
        onChange={(e) => handleFileSelect(e.target.files)}
        className="hidden"
      />

      {/* Photo Preview Grid */}
      {photos.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium">
              Photos ({photos.length}/{maxPhotos})
            </h4>
            {photos.length > 0 && (
              <button
                type="button"
                onClick={() => onChange([])}
                className="text-sm text-danger hover:text-danger/80"
              >
                Remove All
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {photos.map((photo, index) => (
              <div
                key={index}
                className="relative group rounded-lg overflow-hidden border bg-card"
              >
                <img
                  src={photo}
                  alt={`Report photo ${index + 1}`}
                  className="w-full h-48 object-cover"
                />
                
                {/* Remove Button */}
                <button
                  type="button"
                  onClick={() => handleRemovePhoto(index)}
                  className="absolute top-2 right-2 bg-danger text-danger-foreground rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label="Remove photo"
                >
                  <X className="w-4 h-4" />
                </button>

                {/* Photo Info */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                  <p className="text-xs text-white">
                    Photo {index + 1}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Photo Guidelines */}
          <div className="mt-4 bg-muted/50 rounded-lg p-4">
            <h4 className="text-sm font-medium mb-2">Photo Guidelines:</h4>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-3 h-3 mt-0.5 flex-shrink-0 text-success" />
                <span>Take clear, well-lit photos showing the entire problem area</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-3 h-3 mt-0.5 flex-shrink-0 text-success" />
                <span>Include close-ups of specific damage or issues</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-3 h-3 mt-0.5 flex-shrink-0 text-success" />
                <span>Show the surrounding area for context</span>
              </li>
              <li className="flex items-start gap-2">
                <XCircle className="w-3 h-3 mt-0.5 flex-shrink-0 text-warning" />
                <span>Avoid photos with people or sensitive information</span>
              </li>
            </ul>
          </div>
        </div>
      )}

      {/* No Photos Warning */}
      {photos.length === 0 && (
        <div className="bg-warning-light border border-warning/30 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">No photos added</p>
              <p className="text-sm text-muted-foreground mt-1">
                Reports with photos are resolved 3x faster on average. Consider adding at least one photo.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PhotoStep;