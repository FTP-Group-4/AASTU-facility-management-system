import { useState } from 'react';
import { MapPin, Building, Hash, FileText } from 'lucide-react';
import Input from '../../common/UI/Input';
import Select from '../../common/UI/Select';
import type { Location } from '../../../types/report';
import { cn } from '../../../lib/utils';

interface LocationStepProps {
  value: Location;
  onChange: (location: Location) => void;
  errors?: { block_id?: string; description?: string };
}

const LocationStep = ({ value, onChange, errors }: LocationStepProps) => {
  const [isGeneral, setIsGeneral] = useState(value.type === 'general');

  const handleTypeChange = (type: 'specific' | 'general') => {
    setIsGeneral(type === 'general');
    onChange({
      type,
      block_id: type === 'specific' ? value.block_id : undefined,
      room_number: type === 'specific' ? value.room_number : undefined,
      description: type === 'general' ? value.description : '',
    });
  };

  const handleBlockChange = (blockId: number) => {
    onChange({
      ...value,
      block_id: blockId,
    });
  };

  const handleRoomChange = (roomNumber: string) => {
    onChange({
      ...value,
      room_number: roomNumber,
    });
  };

  const handleDescriptionChange = (description: string) => {
    onChange({
      ...value,
      description,
    });
  };

  // Generate block options (1-100)
  const blockOptions = Array.from({ length: 100 }, (_, i) => ({
    value: (i + 1).toString(),
    label: `Block ${i + 1}`,
  }));

  return (
    <div className="space-y-6">
      {/* Location Type Selection */}
      <div>
        <h3 className="text-lg font-medium mb-3">Location Type</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => handleTypeChange('specific')}
            className={cn(
              'p-4 border rounded-lg transition-all',
              !isGeneral
                ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                : 'border-border hover:border-primary/50'
            )}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-primary/10">
                <Building className="w-5 h-5 text-primary" />
              </div>
              <div className="text-left">
                <h4 className="font-medium">Specific Location</h4>
                <p className="text-sm text-muted-foreground">
                  Inside a campus building (Block 1-100)
                </p>
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleTypeChange('general')}
            className={cn(
              'p-4 border rounded-lg transition-all',
              isGeneral
                ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                : 'border-border hover:border-primary/50'
            )}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-primary/10">
                <MapPin className="w-5 h-5 text-primary" />
              </div>
              <div className="text-left">
                <h4 className="font-medium">General Area</h4>
                <p className="text-sm text-muted-foreground">
                  Outdoor spaces, pathways, undefined areas
                </p>
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Specific Location Fields */}
      {!isGeneral && (
        <div className="space-y-4 animate-fade-in">
          <h3 className="text-lg font-medium">Building Details</h3>
          
          <Select
            label="Block Number"
            options={blockOptions}
            value={value.block_id?.toString() || ''}
            onChange={(e) => handleBlockChange(parseInt(e.target.value))}
            placeholder="Select block (1-100)"
            error={errors?.block_id}
            required
          />

          <Input
            label="Room Number (Optional)"
            placeholder="e.g., 201, Lab 3, Office A"
            value={value.room_number || ''}
            onChange={(e) => handleRoomChange(e.target.value)}
            leftIcon={<Building className="w-4 h-4" />}
            helperText="Leave empty if location is general within the block"
          />
        </div>
      )}

      {/* General Location Field */}
      {isGeneral && (
        <div className="space-y-4 animate-fade-in">
          <h3 className="text-lg font-medium">Area Description</h3>
          
          <div>
            <label className="block text-sm font-medium mb-2">
              Location Description *
            </label>
            <textarea
              value={value.description || ''}
              onChange={(e) => handleDescriptionChange(e.target.value)}
              placeholder="Describe the location (e.g., 'Pathway between Block 12 and Library', 'Football field near Block 5')"
              className="w-full min-h-[120px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              required
            />
            {errors?.description && (
              <p className="text-sm text-danger mt-1">{errors.description}</p>
            )}
            <p className="text-xs text-muted-foreground mt-2">
              Be as specific as possible to help the maintenance team find the location
            </p>
          </div>
        </div>
      )}

      {/* Location Preview */}
      <div className="bg-muted/50 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-2">
          <MapPin className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium">Location Preview</span>
        </div>
        <p className="text-sm">
          {!isGeneral && value.block_id 
            ? `Block ${value.block_id}${value.room_number ? `, Room ${value.room_number}` : ''}`
            : value.description || 'No location specified'
          }
        </p>
      </div>
    </div>
  );
};

export default LocationStep;