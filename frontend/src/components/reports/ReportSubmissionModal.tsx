import React, { useState } from 'react';
import { 
  MapPin, 
  FileText, 
  Camera, 
  AlertTriangle, 
  CheckCircle,
  Building2,
  Home,
  X
} from 'lucide-react';
import { Modal } from '../shared/Modal';
import { Button } from '../shared/Button';
import { Input } from '../shared/Input';
import { useApp } from '../../contexts/AppContext';
import type { Category, Priority } from '../../types';
import { mockBlocks } from '../../utils/mockData';

interface ReportSubmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ReportFormData) => void;
}

export interface ReportFormData {
  category: Category;
  priority: Priority;
  location: {
    block: string;
    floor: string;
    room: string;
    description: string;
  };
  title: string;
  description: string;
  photos: File[];
}

export function ReportSubmissionModal({ isOpen, onClose, onSubmit }: ReportSubmissionModalProps) {
  const { language, t } = useApp();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<ReportFormData>({
    category: 'plumbing',
    priority: 'medium',
    location: {
      block: '',
      floor: '',
      room: '',
      description: ''
    },
    title: '',
    description: '',
    photos: []
  });
  const [showDuplicateWarning, setShowDuplicateWarning] = useState(false);

  const categories: { value: Category; label: { en: string; am: string }; icon: React.ReactNode }[] = [
    { value: 'plumbing', label: { en: 'Plumbing', am: 'የውሃ ስርዓት' }, icon: '🚰' },
    { value: 'electrical', label: { en: 'Electrical', am: 'የኤሌክትሪክ' }, icon: '⚡' },
    { value: 'structural', label: { en: 'Structural', am: 'መዋቅራዊ' }, icon: '🏗️' },
    { value: 'hvac', label: { en: 'HVAC', am: 'HVAC' }, icon: '❄️' },
    { value: 'cleaning', label: { en: 'Cleaning', am: 'ጽዳት' }, icon: '🧹' },
    { value: 'landscaping', label: { en: 'Landscaping', am: 'የመሬት አቀማመጥ' }, icon: '🌳' },
    { value: 'it', label: { en: 'IT', am: 'አይቲ' }, icon: '💻' },
    { value: 'furniture', label: { en: 'Furniture', am: 'የቤት ዕቃዎች' }, icon: '🪑' },
    { value: 'other', label: { en: 'Other', am: 'ሌላ' }, icon: '📋' }
  ];

  const priorities: { value: Priority; label: { en: string; am: string }; description: { en: string; am: string } }[] = [
    { 
      value: 'emergency', 
      label: { en: 'Emergency', am: 'የአደጋ ጊዜ' },
      description: { en: 'Immediate danger or critical issue', am: 'አፋጣኝ አደጋ ወይም ወሳኝ ጉዳይ' }
    },
    { 
      value: 'high', 
      label: { en: 'High', am: 'ከፍተኛ' },
      description: { en: 'Major disruption to operations', am: 'ለስራዎች ከፍተኛ መስተጓጎል' }
    },
    { 
      value: 'medium', 
      label: { en: 'Medium', am: 'መካከለኛ' },
      description: { en: 'Moderate impact on daily activities', am: 'በዕለታዊ እንቅስቃሴዎች ላይ መካከለኛ ተፅእኖ' }
    },
    { 
      value: 'low', 
      label: { en: 'Low', am: 'ዝቅተኛ' },
      description: { en: 'Minor issue, can wait', am: 'ትንሽ ጉዳይ፣ መጠበቅ ይችላል' }
    }
  ];

  const handleNext = () => {
    if (step < 4) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files).slice(0, 3);
      setFormData({ ...formData, photos: files });
    }
  };

  const handleSubmit = () => {
    // Simulate duplicate check
    if (formData.title.toLowerCase().includes('leak')) {
      setShowDuplicateWarning(true);
    } else {
      onSubmit(formData);
      handleClose();
    }
  };

  const handleClose = () => {
    setStep(1);
    setFormData({
      category: 'plumbing',
      priority: 'medium',
      location: { block: '', floor: '', room: '', description: '' },
      title: '',
      description: '',
      photos: []
    });
    setShowDuplicateWarning(false);
    onClose();
  };

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-4">
            <h3 className="font-semibold text-[var(--color-text-primary)]">
              {t('Select Issue Category', 'የጉዳይ ምድብ ይምረጡ')}
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {categories.map((cat) => (
                <button
                  key={cat.value}
                  onClick={() => setFormData({ ...formData, category: cat.value })}
                  className={`
                    p-4 rounded-lg border-2 transition-all
                    ${formData.category === cat.value
                      ? 'border-[var(--color-primary)] bg-[var(--color-primary)] bg-opacity-10'
                      : 'border-[var(--color-border)] hover:border-[var(--color-primary)]'
                    }
                  `}
                >
                  <div className="text-3xl mb-2">{cat.icon}</div>
                  <div className="text-sm font-medium">
                    {language === 'am' ? cat.label.am : cat.label.en}
                  </div>
                </button>
              ))}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <h3 className="font-semibold text-[var(--color-text-primary)]">
              {t('Location Details', 'የቦታ ዝርዝሮች')}
            </h3>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">
                  {t('Block', 'ብሎክ')}
                </label>
                <select
                  value={formData.location.block}
                  onChange={(e) => setFormData({
                    ...formData,
                    location: { ...formData.location, block: e.target.value }
                  })}
                  className="w-full px-3 py-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                >
                  <option value="">{t('Select block', 'ብሎክ ይምረጡ')}</option>
                  {mockBlocks.map((block) => (
                    <option key={block.id} value={block.name}>
                      {language === 'am' && block.nameAm ? block.nameAm : block.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Input
                  label={t('Floor', 'ፎቅ')}
                  placeholder="3"
                  value={formData.location.floor}
                  onChange={(e) => setFormData({
                    ...formData,
                    location: { ...formData.location, floor: e.target.value }
                  })}
                  fullWidth
                />
                <Input
                  label={t('Room', 'ክፍል')}
                  placeholder="304"
                  value={formData.location.room}
                  onChange={(e) => setFormData({
                    ...formData,
                    location: { ...formData.location, room: e.target.value }
                  })}
                  fullWidth
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">
                  {t('Additional Location Details', 'ተጨማሪ የቦታ ዝርዝሮች')}
                </label>
                <textarea
                  value={formData.location.description}
                  onChange={(e) => setFormData({
                    ...formData,
                    location: { ...formData.location, description: e.target.value }
                  })}
                  placeholder={t('e.g., Near the main entrance, second door on the left', 'ለምሳሌ፣ ከዋናው መግቢያ አጠገብ፣ ሁለተኛው በር ግራ በኩል')}
                  rows={3}
                  className="w-full px-3 py-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] resize-none"
                />
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <h3 className="font-semibold text-[var(--color-text-primary)]">
              {t('Problem Description', 'የችግር መግለጫ')}
            </h3>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">
                  {t('Priority Level', 'የቅድሚያ ደረጃ')}
                </label>
                <div className="space-y-2">
                  {priorities.map((p) => (
                    <button
                      key={p.value}
                      onClick={() => setFormData({ ...formData, priority: p.value })}
                      className={`
                        w-full p-3 rounded-lg border-2 text-left transition-all
                        ${formData.priority === p.value
                          ? 'border-[var(--color-primary)] bg-[var(--color-primary)] bg-opacity-10'
                          : 'border-[var(--color-border)] hover:border-[var(--color-primary)]'
                        }
                      `}
                    >
                      <div className="font-medium text-[var(--color-text-primary)]">
                        {language === 'am' ? p.label.am : p.label.en}
                      </div>
                      <div className="text-sm text-[var(--color-text-secondary)]">
                        {language === 'am' ? p.description.am : p.description.en}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <Input
                label={t('Issue Title', 'የጉዳይ ርዕስ')}
                placeholder={t('Brief summary of the issue', 'የጉዳዩ አጭር ማጠቃለያ')}
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                fullWidth
              />

              <div>
                <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">
                  {t('Detailed Description', 'ዝርዝር መግለጫ')}
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder={t('Describe the problem in detail...', 'ችግሩን በዝርዝር ይግለጹ...')}
                  rows={4}
                  className="w-full px-3 py-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">
                  {t('Photos (up to 3)', 'ፎቶዎች (እስከ 3)')}
                </label>
                <div className="border-2 border-dashed border-[var(--color-border)] rounded-lg p-6 text-center">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handlePhotoUpload}
                    className="hidden"
                    id="photo-upload"
                  />
                  <label htmlFor="photo-upload" className="cursor-pointer">
                    <Camera className="w-8 h-8 mx-auto mb-2 text-[var(--color-text-tertiary)]" />
                    <p className="text-sm text-[var(--color-text-secondary)]">
                      {t('Click to upload photos', 'ፎቶዎችን ለመስቀል ጠቅ ያድርጉ')}
                    </p>
                    {formData.photos.length > 0 && (
                      <p className="text-sm text-[var(--color-primary)] mt-2">
                        {formData.photos.length} {t('photo(s) selected', 'ፎቶ(ዎች) ተመርጠዋል')}
                      </p>
                    )}
                  </label>
                </div>
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <h3 className="font-semibold text-[var(--color-text-primary)]">
              {t('Review Your Report', 'ሪፖርትዎን ይገምግሙ')}
            </h3>

            {showDuplicateWarning && (
              <div className="p-4 bg-[var(--color-warning)] bg-opacity-10 border border-[var(--color-warning)] rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-[var(--color-warning)] flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-[var(--color-text-primary)] mb-1">
                      {t('Possible Duplicate', 'ሊሆን የሚችል ድግግሞሽ')}
                    </p>
                    <p className="text-sm text-[var(--color-text-secondary)]">
                      {t(
                        'A similar issue was recently reported. Do you still want to submit?',
                        'ተመሳሳይ ጉዳይ በቅርቡ ሪፖርት ተደርጓል። አሁንም መላክ ይፈልጋሉ?'
                      )}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-3 bg-[var(--color-surface)] p-4 rounded-lg">
              <div>
                <span className="text-sm text-[var(--color-text-secondary)]">{t('Category', 'ምድብ')}</span>
                <p className="font-medium text-[var(--color-text-primary)] capitalize">{formData.category}</p>
              </div>
              <div>
                <span className="text-sm text-[var(--color-text-secondary)]">{t('Priority', 'ቅድሚያ')}</span>
                <p className="font-medium text-[var(--color-text-primary)] capitalize">{formData.priority}</p>
              </div>
              <div>
                <span className="text-sm text-[var(--color-text-secondary)]">{t('Location', 'ቦታ')}</span>
                <p className="font-medium text-[var(--color-text-primary)]">
                  {formData.location.block}, {t('Floor', 'ፎቅ')} {formData.location.floor}, {t('Room', 'ክፍል')} {formData.location.room}
                </p>
              </div>
              <div>
                <span className="text-sm text-[var(--color-text-secondary)]">{t('Title', 'ርዕስ')}</span>
                <p className="font-medium text-[var(--color-text-primary)]">{formData.title}</p>
              </div>
              <div>
                <span className="text-sm text-[var(--color-text-secondary)]">{t('Description', 'መግለጫ')}</span>
                <p className="text-[var(--color-text-primary)]">{formData.description}</p>
              </div>
              {formData.photos.length > 0 && (
                <div>
                  <span className="text-sm text-[var(--color-text-secondary)]">{t('Photos', 'ፎቶዎች')}</span>
                  <p className="text-[var(--color-text-primary)]">{formData.photos.length} {t('attached', 'ተያይዘዋል')}</p>
                </div>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={t('Report New Issue', 'አዲስ ጉዳይ ሪፖርት ያድርጉ')}
      size="lg"
      footer={
        <div className="flex items-center justify-between w-full">
          <div className="flex gap-1">
            {[1, 2, 3, 4].map((s) => (
              <div
                key={s}
                className={`h-2 w-8 rounded-full ${
                  s === step ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-border)]'
                }`}
              />
            ))}
          </div>
          <div className="flex gap-2">
            {step > 1 && (
              <Button variant="outline" onClick={handleBack}>
                {t('Back', 'ተመለስ')}
              </Button>
            )}
            {step < 4 ? (
              <Button onClick={handleNext}>
                {t('Next', 'ቀጣይ')}
              </Button>
            ) : (
              <Button onClick={handleSubmit} variant="success">
                <CheckCircle className="w-4 h-4" />
                {t('Submit Report', 'ሪፖርት አስገባ')}
              </Button>
            )}
          </div>
        </div>
      }
    >
      {renderStepContent()}
    </Modal>
  );
}
