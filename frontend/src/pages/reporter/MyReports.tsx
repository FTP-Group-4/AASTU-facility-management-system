import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/common/UI/Button';
import ReportForm from '../../components/reporter/ReportForm/ReportForm';

const NewReport = () => {
  const navigate = useNavigate();

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
        </div>
        
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Submit New Report</h1>
          <p className="text-muted-foreground mt-2">
            Report a maintenance issue in 4 simple steps
          </p>
        </div>
      </div>

      {/* Form Container */}
      <div className="bg-card border rounded-xl p-6">
        <ReportForm />
      </div>

      {/* Help Section */}
      <div className="mt-8 bg-muted/50 rounded-lg p-6">
        <h3 className="text-lg font-medium mb-3">Need Help?</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <h4 className="font-medium mb-2">Emergency Issues</h4>
            <p className="text-sm text-muted-foreground">
              For immediate safety hazards (fire, electrical sparking, gas leaks), 
              call Campus Security: <strong>+251-XXX-XXX-XXX</strong>
            </p>
          </div>
          <div>
            <h4 className="font-medium mb-2">Photo Guidelines</h4>
            <p className="text-sm text-muted-foreground">
              Clear photos help maintenance teams understand issues better. 
              Include overview shots and close-ups of the problem.
            </p>
          </div>
          <div>
            <h4 className="font-medium mb-2">Response Time</h4>
            <p className="text-sm text-muted-foreground">
              Emergency: 2 hours, High: 24 hours, Medium: 3 days, Low: 1 week.
              You'll receive updates at every stage.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewReport;