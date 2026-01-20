import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Calendar, 
  Building, 
  User, 
  Clock, 
  FileText,
  Image,
  MessageSquare,
  Star,
  Download,
  Share2,
  AlertTriangle
} from 'lucide-react';
import Button from '../../components/common/UI/Button';
import Badge from '../../components/common/UI/Badge';
import Alert from '../../components/common/UI/Alert';
import PriorityBadge from '../../components/common/UI/PriorityBadge';
import StatusBadge from '../../components/common/UI/StatusBadge';
import SLAIndicator from '../../components/common/UI/SLAIndicator';
import { useReportStore } from '../../stores/reportStore';
import { formatDate } from '../../lib/utils';
import { cn } from '../../lib/utils';

const ReportDetails = () => {
  const { ticketId } = useParams<{ ticketId: string }>();
  const navigate = useNavigate();
  const { currentReport, fetchReport, isLoading, error } = useReportStore();
  
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [showRatingForm, setShowRatingForm] = useState(false);

  useEffect(() => {
    if (ticketId) {
      fetchReport(ticketId);
    }
  }, [ticketId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-muted-foreground">Loading report details...</p>
        </div>
      </div>
    );
  }

  if (error || !currentReport) {
    return (
      <div className="max-w-4xl mx-auto p-4 md:p-6">
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <Alert.Title>Error Loading Report</Alert.Title>
          <Alert.Description>
            {error || 'Report not found. It may have been deleted or you may not have access.'}
          </Alert.Description>
        </Alert>
        <Button
          variant="outline"
          onClick={() => navigate('/reporter/reports')}
          className="gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Reports
        </Button>
      </div>
    );
  }

  const canRate = currentReport.status === 'completed' && !currentReport.rating;
  const isOverdue = currentReport.sla && currentReport.sla.remaining_hours < 0;

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Report Details
            </h1>
            <code className="text-sm text-muted-foreground font-mono">
              {currentReport.ticket_id}
            </code>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <Share2 className="w-4 h-4" />
            Share
          </Button>
          <Button variant="outline" size="sm" className="gap-2">
            <Download className="w-4 h-4" />
            Export
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Status Banner */}
          <div className={cn(
            'rounded-lg p-4 border',
            isOverdue 
              ? 'bg-danger-light border-danger/30'
              : 'bg-card border-border'
          )}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <StatusBadge status={currentReport.status} size="lg" />
                <PriorityBadge priority={currentReport.priority} size="lg" />
              </div>
              
              {currentReport.sla && (
                <SLAIndicator 
                  deadline={new Date(currentReport.sla.deadline)}
                  currentTime={new Date()}
                  size="lg"
                />
              )}
            </div>
          </div>

          {/* Problem Details */}
          <div className="bg-card border rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4">Problem Details</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-medium mb-2 flex items-center gap-2">
                  <Building className="w-4 h-4" />
                  Location
                </h3>
                <p className="text-muted-foreground">
                  {currentReport.location.type === 'specific'
                    ? `Block ${currentReport.location.block_id}${currentReport.location.room_number ? `, Room ${currentReport.location.room_number}` : ''}`
                    : currentReport.location.description}
                </p>
              </div>
              
              <div>
                <h3 className="font-medium mb-2 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Equipment
                </h3>
                <p className="text-muted-foreground">
                  {currentReport.equipment_description}
                </p>
              </div>
            </div>

            <div className="mt-6">
              <h3 className="font-medium mb-2">Problem Description</h3>
              <div className="bg-muted/50 rounded-lg p-4">
                <p className="whitespace-pre-wrap">{currentReport.problem_description}</p>
              </div>
            </div>
          </div>

          {/* Photos */}
          {currentReport.photos.length > 0 && (
            <div className="bg-card border rounded-lg p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Image className="w-5 h-5" />
                Photos ({currentReport.photos.length})
              </h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {currentReport.photos.map((photo, index) => (
                  <div key={photo.id} className="rounded-lg overflow-hidden border">
                    <img
                      src={photo.url}
                      alt={`Report photo ${index + 1}`}
                      className="w-full h-48 object-cover cursor-pointer hover:scale-105 transition-transform"
                      onClick={() => window.open(photo.url, '_blank')}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Workflow Timeline */}
          <div className="bg-card border rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4">Progress Timeline</h2>
            
            <div className="space-y-4">
              {currentReport.workflow.map((step, index) => (
                <div key={index} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className={cn(
                      'w-3 h-3 rounded-full',
                      index === 0 ? 'bg-primary' : 'bg-border'
                    )} />
                    {index < currentReport.workflow.length - 1 && (
                      <div className="w-0.5 h-full bg-border mt-1" />
                    )}
                  </div>
                  
                  <div className="flex-1 pb-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">{step.action}</h4>
                      <span className="text-sm text-muted-foreground">
                        {formatDate(step.at, 'short')}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      By {step.by}
                    </p>
                    {step.priority && (
                      <div className="mt-2">
                        <Badge variant="outline">Priority: {step.priority}</Badge>
                      </div>
                    )}
                    {step.notes && (
                      <p className="text-sm mt-2 bg-muted/50 rounded p-2">
                        {step.notes}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Rating Section */}
          {canRate && (
            <div className="bg-card border rounded-lg p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Star className="w-5 h-5" />
                Rate This Service
              </h2>
              
              {!showRatingForm ? (
                <div className="text-center py-8">
                  <p className="mb-4">How would you rate the maintenance service?</p>
                  <Button onClick={() => setShowRatingForm(true)}>
                    Rate Now
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex justify-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        className="text-3xl hover:scale-110 transition-transform"
                      >
                        {star <= rating ? '⭐' : '☆'}
                      </button>
                    ))}
                  </div>
                  
                  {rating <= 3 && (
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Please provide feedback (required for low ratings)
                      </label>
                      <textarea
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="What could have been better?"
                        className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                        required={rating <= 3}
                      />
                    </div>
                  )}
                  
                  <div className="flex gap-3">
                    <Button variant="outline" onClick={() => setShowRatingForm(false)}>
                      Cancel
                    </Button>
                    <Button disabled={rating <= 3 && !comment.trim()}>
                      Submit Rating
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Report Info Card */}
          <div className="bg-card border rounded-lg p-6">
            <h3 className="font-bold mb-4">Report Information</h3>
            
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Submitted By</p>
                <p className="font-medium flex items-center gap-2">
                  <User className="w-4 h-4" />
                  {currentReport.submitted_by.name}
                </p>
                <p className="text-sm text-muted-foreground">
                  {currentReport.submitted_by.department}
                </p>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground">Submission Date</p>
                <p className="font-medium flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  {formatDate(currentReport.submitted_at, 'long')}
                </p>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground">Category</p>
                <Badge variant="outline" className="capitalize">
                  {currentReport.category}
                </Badge>
              </div>
              
              {currentReport.rating && (
                <div>
                  <p className="text-sm text-muted-foreground">Your Rating</p>
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={cn(
                          'w-4 h-4',
                          i < currentReport.rating! 
                            ? 'text-warning fill-warning' 
                            : 'text-muted-foreground'
                        )}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Actions Card */}
          <div className="bg-card border rounded-lg p-6">
            <h3 className="font-bold mb-4">Actions</h3>
            
            <div className="space-y-3">
              {currentReport.status === 'submitted' && (
                <Button variant="outline" className="w-full justify-start gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Contact Coordinator
                </Button>
              )}
              
              {currentReport.status === 'completed' && !currentReport.rating && (
                <Button 
                  onClick={() => setShowRatingForm(true)}
                  className="w-full justify-start gap-2"
                >
                  <Star className="w-4 h-4" />
                  Rate Service
                </Button>
              )}
              
              <Button variant="outline" className="w-full justify-start gap-2">
                <MessageSquare className="w-4 h-4" />
                Add Comment
              </Button>
              
              <Button variant="outline" className="w-full justify-start gap-2">
                <FileText className="w-4 h-4" />
                View Certificate
              </Button>
            </div>
          </div>

          {/* Help Card */}
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-6">
            <h3 className="font-bold mb-2 text-primary">Need Help?</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Having issues with this report?
            </p>
            <Button variant="outline" size="sm" className="w-full">
              Contact Support
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportDetails;