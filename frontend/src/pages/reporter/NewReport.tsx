import { useState, useRef, useEffect } from 'react';
import type { ChangeEvent } from 'react'; // Added useEffect import
import { useNavigate } from 'react-router-dom';
import { Camera, AlertTriangle, X, ArrowLeft, Zap, Wrench, Loader2 } from 'lucide-react';
import { useReportStore } from '../../stores/reportStore';
import type { ReportCategory, Location } from '../../types/report'; // Added Location import
import Button from '../../components/common/UI/Button';

const NewReport = () => {
  const navigate = useNavigate();
  const { submitReport, isLoading } = useReportStore();
  const [currentStep, setCurrentStep] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    category: '' as ReportCategory | '',
    locationType: 'specific' as 'specific' | 'general',
    blockId: '',
    roomNumber: '',
    locationDescription: '',
    equipment: '',
    description: '',
    photos: [] as File[] // Store File objects
  });

  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        setError('File size too large. Max 5MB.');
        return;
      }
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Only image files are allowed.');
        return;
      }

      // Add file to form data
      const newPhotos = [...formData.photos, file].slice(0, 3); // Max 3 files
      
      // Create preview URLs
      const newPreviews = [...photoPreviews];
      const newPreviewUrl = URL.createObjectURL(file);
      newPreviews.push(newPreviewUrl);
      
      setFormData(prev => ({
        ...prev,
        photos: newPhotos
      }));
      setPhotoPreviews(newPreviews.slice(0, 3)); // Keep only 3 previews
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removePhoto = (index: number) => {
    // Revoke object URL to prevent memory leaks
    URL.revokeObjectURL(photoPreviews[index]);
    
    setFormData(prev => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index)
    }));
    
    setPhotoPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const validateForm = () => {
    // Step 1 validation
    if (!formData.category) {
      return 'Please select a problem category';
    }
    
    if (formData.locationType === 'specific') {
      if (!formData.blockId.trim()) {
        return 'Block number is required for indoor locations';
      }
      const blockNum = parseInt(formData.blockId);
      if (isNaN(blockNum) || blockNum < 1 || blockNum > 100) {
        return 'Block number must be between 1 and 100';
      }
    } else {
      if (!formData.locationDescription.trim()) {
        return 'Location description is required for outdoor locations';
      }
      if (formData.locationDescription.trim().length < 10) {
        return 'Please provide a more detailed location description (minimum 10 characters)';
      }
    }
    
    // Step 2 validation
    if (!formData.equipment.trim()) {
      return 'Equipment description is required';
    }
    if (formData.equipment.trim().length < 3) {
      return 'Please provide a more detailed equipment description (minimum 3 characters)';
    }
    
    if (!formData.description.trim()) {
      return 'Problem description is required';
    }
    if (formData.description.trim().length < 10) {
      return 'Please provide a more detailed problem description (minimum 10 characters)';
    }
    
    // Step 3 validation
    if (formData.photos.length === 0) {
      return 'At least one photo is required';
    }
    
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate entire form
    if (currentStep < 3) {
      // If not on final step, just continue
      setCurrentStep(currentStep + 1);
      return;
    }

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      // Go back to step with error
      if (validationError.includes('category') || validationError.includes('Block') || validationError.includes('Location')) {
        setCurrentStep(1);
      } else if (validationError.includes('Equipment') || validationError.includes('Problem')) {
        setCurrentStep(2);
      }
      return;
    }

    try {
      console.log('Preparing submission with:', {
        category: formData.category,
        locationType: formData.locationType,
        photos: formData.photos.map(p => p.name)
      });

      // Prepare location object with proper typing
      const location: Location = {
        type: formData.locationType,
      };

      if (formData.locationType === 'specific') {
        location.block_id = parseInt(formData.blockId);
        if (formData.roomNumber.trim()) {
          location.room_number = formData.roomNumber.trim();
        }
      } else {
        location.description = formData.locationDescription.trim();
      }

      // Prepare the complete payload with type assertion
      const payload = {
        category: formData.category as ReportCategory,
        location: location,
        equipment_description: formData.equipment.trim(),
        problem_description: formData.description.trim(),
        photos: formData.photos,
      };

      console.log('Submitting payload:', payload);

      const ticketId = await submitReport(payload);
      console.log("Report submitted successfully. Ticket ID:", ticketId);
      
      // Clean up preview URLs
      photoPreviews.forEach(url => URL.revokeObjectURL(url));
      
      navigate('/reporter/dashboard');
    } catch (err: any) {
      console.error("Full error object:", err);
      
      // Handle specific API error codes
      if (err.error_code === 'DUPLICATE_REPORT') {
        const duplicateId = err.data?.duplicate_ticket_id;
        setError(`This issue has already been reported. Ticket ID: ${duplicateId}`);
      } else if (err.error_code === 'VALID_001') {
        setError('Invalid block number. Must be between 1-100.');
      } else if (err.error_code === 'VALID_002') {
        setError(err.message || 'Required information is missing. Please check all fields.');
      } else if (err.message?.includes('401') || err.message?.includes('unauthorized')) {
        setError('Session expired. Please log in again.');
      } else if (err.message?.includes('network')) {
        setError('Network error. Please check your connection and try again.');
      } else if (err.message?.includes('photo') || err.message?.includes('Photo')) {
        setError('Photo upload failed. Please try again with different images.');
      } else {
        setError(err.message || 'Failed to submit report. Please try again.');
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      navigate(-1);
    }
  };

  // Clean up preview URLs on unmount
  useEffect(() => {
    return () => {
      photoPreviews.forEach(url => URL.revokeObjectURL(url));
    };
  }, [photoPreviews]);

  return (
    <div className="max-w-2xl mx-auto p-4">
      <div className="mb-6 flex items-center">
        <button
          type="button"
          onClick={handleBack}
          className="p-2 mr-2 rounded-full hover:bg-gray-100 text-gray-600 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">New Issue Report</h1>
          <p className="text-sm text-gray-500">Step {currentStep} of 3</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-200 h-2 rounded-full mb-8">
        <div
          className="bg-indigo-600 h-2 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${(currentStep / 3) * 100}%` }}
        ></div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium">Submission Error</p>
            <p className="text-sm mt-1">{error}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">

        {/* Step 1: Category & Location */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Problem Category <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, category: 'electrical' })}
                  className={`p-4 rounded-xl border-2 flex flex-col items-center justify-center transition-all ${
                    formData.category === 'electrical'
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                      : 'border-gray-200 hover:border-indigo-200 hover:bg-indigo-50/50 text-gray-600'
                  }`}
                >
                  <Zap className="w-8 h-8 mb-2" />
                  <span className="font-semibold">Electrical</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, category: 'mechanical' })}
                  className={`p-4 rounded-xl border-2 flex flex-col items-center justify-center transition-all ${
                    formData.category === 'mechanical'
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                      : 'border-gray-200 hover:border-indigo-200 hover:bg-indigo-50/50 text-gray-600'
                  }`}
                >
                  <Wrench className="w-8 h-8 mb-2" />
                  <span className="font-semibold">Mechanical</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Location <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, locationType: 'specific' })}
                  className={`py-3 rounded-lg border text-sm font-medium transition-all ${
                    formData.locationType === 'specific'
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300'
                  }`}
                >
                  Indoor (Block/Room)
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, locationType: 'general' })}
                  className={`py-3 rounded-lg border text-sm font-medium transition-all ${
                    formData.locationType === 'general'
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300'
                  }`}
                >
                  Outdoor / General
                </button>
              </div>

              <div className="space-y-4">
                {formData.locationType === 'specific' ? (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-gray-500 font-medium uppercase mb-1 block">
                        Block Number <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="100"
                        placeholder="e.g. 57"
                        value={formData.blockId}
                        onChange={e => setFormData({ ...formData, blockId: e.target.value })}
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                        required
                      />
                      <p className="text-xs text-gray-400 mt-1">Must be 1-100</p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 font-medium uppercase mb-1 block">
                        Room Number
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 204B"
                        value={formData.roomNumber}
                        onChange={e => setFormData({ ...formData, roomNumber: e.target.value })}
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                      />
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="text-xs text-gray-500 font-medium uppercase mb-1 block">
                      Location Description <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      rows={2}
                      placeholder="e.g. Pathway near Library, Soccer field gate"
                      value={formData.locationDescription}
                      onChange={e => setFormData({ ...formData, locationDescription: e.target.value })}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all resize-none"
                      required
                    />
                    <p className="text-xs text-gray-400 mt-1">Minimum 10 characters</p>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="button"
                disabled={!formData.category || (formData.locationType === 'specific' ? !formData.blockId : !formData.locationDescription)}
                onClick={() => setCurrentStep(2)}
                className="px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Details */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Equipment / Item <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Ceiling Fan, Projector, Door Lock"
                value={formData.equipment}
                onChange={e => setFormData({ ...formData, equipment: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                required
              />
              <p className="text-xs text-gray-400 mt-1">Minimum 3 characters</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description of the Problem <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={4}
                placeholder="Please describe exactly what is wrong..."
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all resize-none"
                required
              />
              <p className="text-xs text-gray-400 mt-1">Minimum 10 characters</p>
            </div>

            <div className="pt-4 flex justify-between">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="px-6 py-3 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition-colors border border-gray-300"
              >
                Back
              </button>
              <button
                type="button"
                disabled={!formData.description.trim() || !formData.equipment.trim()}
                onClick={() => setCurrentStep(3)}
                className="px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Photos & Submit */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Add Photos <span className="text-red-500">*</span>
              </label>
              <p className="text-sm text-gray-500 mb-4">
                At least 1 photo is required. You can upload up to 3 photos. Each photo max 5MB.
              </p>

              <div className="flex flex-wrap gap-4 mb-4">
                {photoPreviews.map((preview, idx) => (
                  <div key={idx} className="relative w-32 h-32 rounded-lg overflow-hidden border border-gray-200 shadow-sm">
                    <img
                      src={preview}
                      alt={`Preview ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removePhoto(idx)}
                      className="absolute top-2 right-2 bg-black/70 text-white rounded-full p-1 hover:bg-red-500 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs p-2 truncate">
                      {formData.photos[idx]?.name || `Photo ${idx + 1}`}
                    </div>
                  </div>
                ))}

                {formData.photos.length < 3 && (
                  <label className="w-32 h-32 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:border-indigo-500 hover:bg-indigo-50 transition-all text-gray-400 hover:text-indigo-600">
                    <Camera className="w-8 h-8 mb-2" />
                    <span className="text-sm font-semibold">Add Photo</span>
                    <span className="text-xs mt-1">{formData.photos.length}/3</span>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                      capture="environment"
                    />
                  </label>
                )}
              </div>
              
              {formData.photos.length > 0 && (
                <div className="text-sm text-gray-600">
                  <p>Uploaded: {formData.photos.length} photo(s)</p>
                  <ul className="list-disc list-inside mt-1 text-xs text-gray-500">
                    {formData.photos.map((photo, idx) => (
                      <li key={idx}>{photo.name} ({(photo.size / 1024).toFixed(1)} KB)</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200 flex items-start">
              <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <h4 className="text-sm font-bold text-yellow-800">Important Information</h4>
                <ul className="text-xs text-yellow-700 mt-1 space-y-1">
                  <li>• Photos help the maintenance team understand the issue better</li>
                  <li>• Ensure location details are accurate</li>
                  <li>• Duplicate reports will be automatically flagged</li>
                  <li>• You cannot edit the report after submission</li>
                </ul>
              </div>
            </div>

            <div className="pt-4 flex justify-between">
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="px-6 py-3 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition-colors border border-gray-300"
              >
                Back
              </button>
              <Button
                type="submit"
                disabled={isLoading || formData.photos.length === 0}
                className="px-8 py-3 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : 'Submit Report'}
              </Button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};

export default NewReport;