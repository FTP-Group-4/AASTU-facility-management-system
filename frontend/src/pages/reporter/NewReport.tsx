import { useState } from 'react';
import type { ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, AlertTriangle, X, ArrowLeft, Zap, Wrench } from 'lucide-react';

const NewReport = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    category: '',
    locationType: 'specific', // specific | general
    blockId: '',
    roomNumber: '',
    locationDescription: '',
    equipment: '',
    description: '',
    photos: [] as string[] // base64 strings
  });

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setFormData(prev => ({
            ...prev,
            photos: [...prev.photos, reader.result as string].slice(0, 3) // Max 3
          }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const removePhoto = (index: number) => {
    setFormData(prev => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Logic to submit would go here (authApi call)
    console.log("Submitting report:", formData);
    // Navigate to dashboard or success page
    navigate('/reporter/dashboard');
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6 flex items-center">
        <button
          onClick={() => navigate(-1)}
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

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">

        {/* Step 1: Category & Location */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Problem Category</label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, category: 'electrical' })}
                  className={`p-4 rounded-xl border-2 flex flex-col items-center justify-center transition-all ${formData.category === 'electrical'
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                    : 'border-gray-200 hover:border-indigo-200 text-gray-600'
                    }`}
                >
                  <Zap className="w-8 h-8 mb-2" />
                  <span className="font-semibold">Electrical</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, category: 'mechanical' })}
                  className={`p-4 rounded-xl border-2 flex flex-col items-center justify-center transition-all ${formData.category === 'mechanical'
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                    : 'border-gray-200 hover:border-indigo-200 text-gray-600'
                    }`}
                >
                  <Wrench className="w-8 h-8 mb-2" />
                  <span className="font-semibold">Mechanical</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Location</label>
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-gray-500 font-medium uppercase mb-1 block">Block Number</label>
                  <input
                    type="number"
                    min="1" max="100"
                    placeholder="e.g. 57"
                    value={formData.blockId}
                    onChange={e => setFormData({ ...formData, blockId: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 font-medium uppercase mb-1 block">Room Number (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. 204B"
                    value={formData.roomNumber}
                    onChange={e => setFormData({ ...formData, roomNumber: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="button"
                disabled={!formData.category || !formData.blockId}
                onClick={() => setCurrentStep(2)}
                className="px-6 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
              <label className="block text-sm font-medium text-gray-700 mb-2">Equipment / Item</label>
              <input
                type="text"
                placeholder="e.g. Ceiling Fan, Projector, Door Lock"
                value={formData.equipment}
                onChange={e => setFormData({ ...formData, equipment: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description of the Problem</label>
              <textarea
                rows={4}
                placeholder="Please describe exactly what is wrong..."
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all resize-none"
              />
            </div>
            <div className="pt-4 flex justify-between">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="px-6 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition-colors"
              >
                Back
              </button>
              <button
                type="button"
                disabled={!formData.description}
                onClick={() => setCurrentStep(3)}
                className="px-6 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
              <label className="block text-sm font-medium text-gray-700 mb-2">Add Photos (Optional)</label>
              <p className="text-sm text-gray-500 mb-4">Photos help the maintenance team understand the issue better.</p>

              <div className="flex flex-wrap gap-4">
                {formData.photos.map((photo, idx) => (
                  <div key={idx} className="relative w-24 h-24 rounded-lg overflow-hidden border border-gray-200">
                    <img src={photo} alt="Preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removePhoto(idx)}
                      className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-0.5 hover:bg-red-500 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}

                {formData.photos.length < 3 && (
                  <label className="w-24 h-24 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:border-indigo-500 hover:bg-indigo-50 transition-all text-gray-400 hover:text-indigo-600">
                    <Camera className="w-6 h-6 mb-1" />
                    <span className="text-xs font-semibold">Add Photo</span>
                    <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                  </label>
                )}
              </div>
            </div>

            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200 flex items-start">
              <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <h4 className="text-sm font-bold text-yellow-800">Before you submit</h4>
                <p className="text-xs text-yellow-700 mt-1">
                  Please ensure the location details are accurate. False reporting may lead to account suspension.
                </p>
              </div>
            </div>

            <div className="pt-4 flex justify-between">
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="px-6 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition-colors"
              >
                Back
              </button>
              <button
                type="submit"
                className="px-8 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 shadow-md transition-all transform hover:-translate-y-0.5"
              >
                Submit Report
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};

export default NewReport;
