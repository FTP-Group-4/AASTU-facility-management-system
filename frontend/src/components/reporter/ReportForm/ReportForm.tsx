// import { useState } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { ArrowLeft, ArrowRight, Check, AlertCircle } from 'lucide-react';
// import Button from '../../common/UI/Button';
// import Alert from '../../common/UI/Alert';
// import LocationStep from './LocationStep';
// import DetailsStep from './DetailsStep';
// import PhotoStep from './PhotoStep';
// import { useReportStore } from '../../../stores/reportStore';
// import type { SubmitReportRequest, Location, ReportCategory } from '../../../types/report';
// import { cn } from '../../../lib/utils';

// const ReportForm = () => {
//   const navigate = useNavigate();
//   const { submitReport, isLoading: isSubmitting } = useReportStore();
  
//   const [currentStep, setCurrentStep] = useState(1);
//   const [isSubmittingForm, setIsSubmittingForm] = useState(false);
//   const [submitError, setSubmitError] = useState<string | null>(null);
//   const [formErrors, setFormErrors] = useState<Record<string, string>>({});

//   // Form state
//   const [location, setLocation] = useState<Location>({ type: 'specific' });
//   const [category, setCategory] = useState<ReportCategory>('electrical');
//   const [equipmentDescription, setEquipmentDescription] = useState('');
//   const [problemDescription, setProblemDescription] = useState('');
//   const [photos, setPhotos] = useState<File[]>([]);

//   const steps = [
//     { id: 1, title: 'Location', icon: '📍' },
//     { id: 2, title: 'Details', icon: '📝' },
//     { id: 3, title: 'Photos', icon: '📷' },
//     { id: 4, title: 'Review', icon: '👁️' },
//   ];

//   const validateStep = (step: number): boolean => {
//     const errors: Record<string, string> = {};

//     if (step === 1) {
//       if (location.type === 'specific' && !location.block_id) {
//         errors.block_id = 'Block number is required for specific locations';
//       }
//       if (location.type === 'general' && !location.description?.trim()) {
//         errors.description = 'Location description is required for general areas';
//       }
//     }

//     if (step === 2) {
//       if (!equipmentDescription.trim()) {
//         errors.equipment = 'Equipment description is required';
//       } else if (equipmentDescription.length < 10) {
//         errors.equipment = 'Please provide more details about the equipment';
//       }

//       if (!problemDescription.trim()) {
//         errors.problem = 'Problem description is required';
//       } else if (problemDescription.length < 20) {
//         errors.problem = 'Please provide more details about the problem (minimum 20 characters)';
//       }
//     }

//     if (step === 3) {
//       if (photos.length === 0) {
//         errors.photos = 'At least one photo is recommended for better understanding';
//       }
//     }

//     setFormErrors(errors);
//     return Object.keys(errors).length === 0;
//   };

//   const handleNext = () => {
//     if (validateStep(currentStep)) {
//       setCurrentStep(Math.min(currentStep + 1, steps.length));
//     }
//   };

//   const handleBack = () => {
//     setCurrentStep(Math.max(currentStep - 1, 1));
//   };

//   const handleSubmit = async () => {
//     if (!validateStep(currentStep)) return;

//     setIsSubmittingForm(true);
//     setSubmitError(null);

//     const reportData: SubmitReportRequest = {
//       category,
//       location,
//       equipment_description: equipmentDescription,
//       problem_description: problemDescription,
//       photos,
//     };

//     try {
//       const ticketId = await submitReport(reportData);
      
//       // Show success message and navigate
//       navigate(`/reporter/reports/${ticketId}`, {
//         state: { 
//           success: true,
//           message: 'Report submitted successfully!' 
//         },
//       });
//     } catch (error: any) {
//       setSubmitError(error.message || 'Failed to submit report. Please try again.');
//     } finally {
//       setIsSubmittingForm(false);
//     }
//   };

//   const renderStep = () => {
//     switch (currentStep) {
//       case 1:
//         return (
//           <LocationStep
//             value={location}
//             onChange={setLocation}
//             errors={formErrors}
//           />
//         );
//       case 2:
//         return (
//           <DetailsStep
//             {...({
//               category,
//               equipment: equipmentDescription,
//               problem: problemDescription,
//               blockId: location.block_id,
//               roomNumber: location.room_number,
//               onChange: (updates: any) => {
//                 setCategory(updates.category);
//                 setEquipmentDescription(updates.equipment_description);
//                 setProblemDescription(updates.problem_description);
//               },
//               errors: formErrors,
//             } as any)}
//           />
//         );
//       case 3:
//         return (
//           <PhotoStep
//             photos={photos}
//             onChange={setPhotos}
//             maxPhotos={3}
//             maxSize={2048}
//           />
//         );
//       case 4:
//         return (
//           <ReviewStep
//             location={location}
//             category={category}
//             equipment={equipmentDescription}
//             problem={problemDescription}
//             photos={photos}
//           />
//         );
//       default:
//         return null;
//     }
//   };

//   return (
//     <div className="max-w-4xl mx-auto">
//       {/* Progress Steps */}
//       <div className="mb-8">
//         <div className="flex items-center justify-between mb-4">
//           {steps.map((step, index) => (
//             <div key={step.id} className="flex flex-col items-center flex-1">
//               <div className="flex items-center w-full">
//                 {/* Connector Line */}
//                 {index > 0 && (
//                   <div className={cn(
//                     'flex-1 h-1',
//                     currentStep > step.id ? 'bg-primary' : 'bg-border'
//                   )} />
//                 )}

//                 {/* Step Circle */}
//                 <div className={cn(
//                   'w-10 h-10 rounded-full flex items-center justify-center relative',
//                   currentStep === step.id
//                     ? 'bg-primary text-primary-foreground ring-4 ring-primary/20'
//                     : currentStep > step.id
//                     ? 'bg-success text-success-foreground'
//                     : 'bg-muted text-muted-foreground'
//                 )}>
//                   {currentStep > step.id ? (
//                     <Check className="w-5 h-5" />
//                   ) : (
//                     <span>{step.icon}</span>
//                   )}
//                 </div>

//                 {/* Connector Line */}
//                 {index < steps.length - 1 && (
//                   <div className={cn(
//                     'flex-1 h-1',
//                     currentStep > step.id ? 'bg-primary' : 'bg-border'
//                   )} />
//                 )}
//               </div>
              
//               <span className={cn(
//                 'text-sm mt-2 font-medium',
//                 currentStep === step.id ? 'text-foreground' : 'text-muted-foreground'
//               )}>
//                 {step.title}
//               </span>
//             </div>
//           ))}
//         </div>
//       </div>

//       {/* Error Alert */}
//       {submitError && (
//         <Alert variant="destructive" className="mb-6 animate-fade-in">
//           <AlertCircle className="h-4 w-4" />
//           <Alert.Title>Submission Error</Alert.Title>
//           <Alert.Description>{submitError}</Alert.Description>
//         </Alert>
//       )}

//       {/* Form Content */}
//       <div className="bg-card rounded-lg border p-6 mb-6">
//         {renderStep()}
//       </div>

//       {/* Navigation Buttons */}
//       <div className="flex justify-between">
//         <Button
//           variant="outline"
//           onClick={handleBack}
//           disabled={currentStep === 1 || isSubmittingForm}
//           className="gap-2"
//         >
//           <ArrowLeft className="w-4 h-4" />
//           Back
//         </Button>

//         {currentStep < steps.length ? (
//           <Button
//             onClick={handleNext}
//             className="gap-2"
//           >
//             Next
//             <ArrowRight className="w-4 h-4" />
//           </Button>
//         ) : (
//           <Button
//             onClick={handleSubmit}
//             isLoading={isSubmittingForm || isSubmitting}
//             disabled={isSubmittingForm || isSubmitting}
//             className="gap-2"
//           >
//             Submit Report
//             <Check className="w-4 h-4" />
//           </Button>
//         )}
//       </div>
//     </div>
//   );
// };

// const ReviewStep = ({
//   location,
//   category,
//   equipment,
//   problem,
//   photos,
// }: {
//   location: Location;
//   category: ReportCategory;
//   equipment: string;
//   problem: string;
//   photos: File[];
// }) => {
//   return (
//     <div className="space-y-6">
//       <h3 className="text-lg font-medium">Review Your Report</h3>
      
//       {/* Location Review */}
//       <div className="space-y-4">
//         <h4 className="font-medium">Location</h4>
//         <div className="bg-muted/50 rounded-lg p-4">
//           <p className="font-medium">
//             {location.type === 'specific'
//               ? `Block ${location.block_id}${location.room_number ? `, Room ${location.room_number}` : ''}`
//               : location.description}
//           </p>
//           <p className="text-sm text-muted-foreground mt-1">
//             {location.type === 'specific' ? 'Specific Building Location' : 'General Campus Area'}
//           </p>
//         </div>
//       </div>

//       {/* Details Review */}
//       <div className="space-y-4">
//         <h4 className="font-medium">Details</h4>
//         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//           <div className="bg-muted/50 rounded-lg p-4">
//             <p className="text-sm text-muted-foreground">Category</p>
//             <p className="font-medium capitalize">{category}</p>
//           </div>
//           <div className="bg-muted/50 rounded-lg p-4">
//             <p className="text-sm text-muted-foreground">Equipment</p>
//             <p className="font-medium">{equipment}</p>
//           </div>
//         </div>
        
//         <div className="bg-muted/50 rounded-lg p-4">
//           <p className="text-sm text-muted-foreground mb-2">Problem Description</p>
//           <p className="whitespace-pre-wrap">{problem}</p>
//         </div>
//       </div>

//       {/* Photos Review */}
//       <div className="space-y-4">
//         <h4 className="font-medium">Photos ({photos.length})</h4>
//         {photos.length > 0 ? (
//           <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
//             {photos.map((photo, index) => (
//               <div key={index} className="rounded-lg overflow-hidden border">
//                 <img
//                   src={photo}
//                   alt={`Report photo ${index + 1}`}
//                   className="w-full h-32 object-cover"
//                 />
//               </div>
//             ))}
//           </div>
//         ) : (
//           <div className="bg-warning-light border border-warning/30 rounded-lg p-4">
//             <p className="text-sm">No photos added (optional but recommended)</p>
//           </div>
//         )}
//       </div>

//       {/* Submission Info */}
//       <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
//         <h4 className="font-medium text-primary mb-2">What happens next?</h4>
//         <ul className="text-sm space-y-1">
//           <li>1. Report will be submitted to the coordinator for review</li>
//           <li>2. Coordinator will assign priority (Emergency/High/Medium/Low)</li>
//           <li>3. Maintenance team will be assigned based on category</li>
//           <li>4. You'll receive notifications on status updates</li>
//           <li>5. You can track progress in "My Reports"</li>
//         </ul>
//       </div>
//     </div>
//   );
// };

// export default ReportForm;