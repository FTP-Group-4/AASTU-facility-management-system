import { useState, useEffect } from 'react';
import { Wrench, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import Input from '../../common/UI/Input';
import Select from '../../common/UI/Select';
import type { ReportCategory } from '../../../types/report';
import { reportApi } from '../../../api/reports/reportApi';
import { cn } from '../../../lib/utils';

interface DetailsStepProps {
  category: ReportCategory;
  equipment: string;
  problem: string;
  blockId?: number;
  roomNumber?: string;
  onChange: (updates: {
    category: ReportCategory;
    equipment_description: string;
    problem_description: string;
  }) => void;
  errors?: {
    category?: string;
    equipment?: string;
    problem?: string;
  };
}

const DetailsStep = ({
  category,
  equipment,
  problem,
  blockId,
  roomNumber,
  onChange,
  errors,
}: DetailsStepProps) => {
  const [duplicateCheck, setDuplicateCheck] = useState<{
    isDuplicate: boolean;
    ticketId?: string;
    status?: string;
    similarityScore?: number;
    isChecking: boolean;
  }>({
    isDuplicate: false,
    isChecking: false,
  });

  // Check for duplicates when equipment description changes
  useEffect(() => {
    const checkDuplicate = async () => {
      if (!equipment.trim() || !blockId) return;

      setDuplicateCheck(prev => ({ ...prev, isChecking: true }));

      try {
        const response = await reportApi.checkDuplicate({
          block_id: blockId,
          room_number: roomNumber,
          equipment_description: equipment,
        });

        setDuplicateCheck({
          isDuplicate: response.is_duplicate,
          ticketId: response.duplicate_ticket_id,
          status: response.duplicate_status,
          similarityScore: response.similarity_score,
          isChecking: false,
        });
      } catch (error) {
        console.error('Duplicate check failed:', error);
        setDuplicateCheck(prev => ({ ...prev, isChecking: false }));
      }
    };

    const timer = setTimeout(() => {
      if (equipment.length > 5) {
        checkDuplicate();
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [equipment, blockId, roomNumber]);

  const handleCategoryChange = (cat: ReportCategory) => {
    onChange({
      category: cat,
      equipment_description: equipment,
      problem_description: problem,
    });
  };

  const handleEquipmentChange = (value: string) => {
    onChange({
      category,
      equipment_description: value,
      problem_description: problem,
    });
  };

  const handleProblemChange = (value: string) => {
    onChange({
      category,
      equipment_description: equipment,
      problem_description: value,
    });
  };

  return (
    <div className="space-y-6">
      {/* Category Selection */}
      <div>
        <h3 className="text-lg font-medium mb-3">Problem Category</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => handleCategoryChange('electrical')}
            className={cn(
              'p-4 border rounded-lg transition-all',
              category === 'electrical'
                ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                : 'border-border hover:border-primary/50'
            )}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/30">
                <div className="w-5 h-5 flex items-center justify-center">
                  <span className="text-blue-600 dark:text-blue-400 font-bold">⚡</span>
                </div>
              </div>
              <div className="text-left">
                <h4 className="font-medium">Electrical</h4>
                <p className="text-sm text-muted-foreground">
                  Power issues, lighting, outlets, electrical equipment
                </p>
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleCategoryChange('mechanical')}
            className={cn(
              'p-4 border rounded-lg transition-all',
              category === 'mechanical'
                ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                : 'border-border hover:border-primary/50'
            )}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-orange-100 dark:bg-orange-900/30">
                <Wrench className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div className="text-left">
                <h4 className="font-medium">Mechanical</h4>
                <p className="text-sm text-muted-foreground">
                  Doors, windows, furniture, plumbing, structural issues
                </p>
              </div>
            </div>
          </button>
        </div>
        {errors?.category && (
          <p className="text-sm text-danger mt-2">{errors.category}</p>
        )}
      </div>

      {/* Equipment Description */}
      <div className="space-y-3">
        <Input
          label="Equipment Description *"
          placeholder="e.g., 'Projector in classroom 201', 'Lab computer #5', 'Third floor bathroom sink'"
          value={equipment}
          onChange={(e) => handleEquipmentChange(e.target.value)}
          error={errors?.equipment}
          required
          minLength={10}
          maxLength={200}
          helperText="Be specific about which equipment has the issue"
        />

        {/* Duplicate Check */}
        {equipment.length > 5 && (
          <div className={cn(
            'rounded-lg p-3 border transition-all animate-fade-in',
            duplicateCheck.isDuplicate
              ? 'bg-warning-light border-warning/30'
              : 'bg-success-light border-success/30'
          )}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {duplicateCheck.isChecking ? (
                  <>
                    <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm">Checking for duplicates...</span>
                  </>
                ) : duplicateCheck.isDuplicate ? (
                  <>
                    <AlertTriangle className="w-4 h-4 text-warning" />
                    <span className="text-sm font-medium">
                      Similar issue already reported
                    </span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 text-success" />
                    <span className="text-sm font-medium">
                      No similar issues found
                    </span>
                  </>
                )}
              </div>

              {duplicateCheck.similarityScore && (
                <span className="text-xs px-2 py-1 rounded-full bg-white dark:bg-gray-800">
                  {Math.round(duplicateCheck.similarityScore * 100)}% match
                </span>
              )}
            </div>

            {duplicateCheck.isDuplicate && duplicateCheck.ticketId && (
              <div className="mt-2 text-sm">
                <p>
                  Ticket <span className="font-mono">{duplicateCheck.ticketId}</span>{' '}
                  is currently <span className="font-medium">{duplicateCheck.status}</span>
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  You can still submit if this is a different or recurring issue
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Problem Description */}
      <div>
        <label className="block text-sm font-medium mb-2">
          Problem Description *
        </label>
        <textarea
          value={problem}
          onChange={(e) => handleProblemChange(e.target.value)}
          placeholder="Describe the problem in detail. Include: What happened, when it started, what you've tried, and any safety concerns."
          className="w-full min-h-[150px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          required
          minLength={20}
          maxLength={500}
        />
        {errors?.problem && (
          <p className="text-sm text-danger mt-1">{errors.problem}</p>
        )}
        <div className="flex justify-between mt-2">
          <p className="text-xs text-muted-foreground">
            Minimum 20 characters, maximum 500
          </p>
          <p className={cn(
            'text-xs',
            problem.length < 20 ? 'text-warning' :
            problem.length > 450 ? 'text-warning' : 'text-muted-foreground'
          )}>
            {problem.length}/500
          </p>
        </div>
      </div>

      {/* Character Count Guidelines */}
      <div className="bg-muted/50 rounded-lg p-4">
        <h4 className="text-sm font-medium mb-2">Tips for a good report:</h4>
        <ul className="text-xs text-muted-foreground space-y-1">
          <li className="flex items-start gap-2">
            <CheckCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
            <span>Describe exactly what's wrong (e.g., "No power", "Leaking water", "Broken hinge")</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
            <span>Include when the issue started and how often it occurs</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
            <span>Mention any safety concerns (e.g., exposed wires, tripping hazard)</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
            <span>Note if it affects classes or other activities</span>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default DetailsStep;