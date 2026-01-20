import { useState, useEffect } from 'react';
import { 
  AlertCircle, 
  CheckCircle, 
  ChevronRight,
  Info,
  Settings,
  User,
  Building,
  Search,
  Plus,
  Edit,
  Trash2,
  Eye,
  Download,
  Share2,
  Bell,
  Menu,
  Sun,
  Moon,
  Languages,
  HelpCircle,
  MessageSquare
} from 'lucide-react';

// UI Components
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './Card';
import Button from './Button';
import Badge from './Badge';
import Alert from './Alert';
import PriorityBadge from './PriorityBadge';
import StatusBadge from './StatusBadge';
import SLAIndicator from './SLAIndicator';
import Spinner from './Spinner';
import { Modal, ModalContent, ModalFooter } from './Modal';
import FileUpload from './FileUpload';
import Pagination from './Pagination';
import Input from './Input';
import Select from './Select';

// Hooks
import { usePagination } from '../../../hooks/usePagination';

// Utils
import { cn } from '../../../lib/utils';

// Mock data
const mockReports = Array.from({ length: 45 }, (_, i) => ({
  id: `REP-${String(i + 1).padStart(4, '0')}`,
  title: `Report ${i + 1}`,
  description: `Issue with equipment in Block ${Math.floor(Math.random() * 100) + 1}`,
  priority: ['emergency', 'high', 'medium', 'low'][i % 4] as 'emergency' | 'high' | 'medium' | 'low',
  status: ['submitted', 'pending', 'UIShowcaseroved', 'assigned', 'in-progress', 'completed', 'closed', 'reopened', 'rejected'][i % 9] as any,
  createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
  deadline: new Date(Date.now() + (Math.random() * 72 * 60 * 60 * 1000)).toISOString(),
  block: Math.floor(Math.random() * 100) + 1,
  category: i % 2 === 0 ? 'Electrical' : 'Mechanical',
  reporter: `Student ${i + 1}`,
}));

const UIShowcase = () => {
  const [darkMode, setDarkMode] = useState(false);
  const [language, setLanguage] = useState<'en' | 'am'>('en');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [fileUploadKey, setFileUploadKey] = useState(0);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // Pagination hook
  const pageSize = 10;
  const totalItems = mockReports.length;
  const pagination = usePagination({
    totalItems,
    pageSize,
    initialPage: 1,
  });

  // Filter reports
  const filteredReports = mockReports.filter(report => {
    const matchesSearch = searchQuery === '' || 
      report.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesPriority = selectedPriority === 'all' || report.priority === selectedPriority;
    const matchesStatus = selectedStatus === 'all' || report.status === selectedStatus;
    
    return matchesSearch && matchesPriority && matchesStatus;
  });

  // Handle file upload
  const handleFilesChange = (files: File[]) => {
    setSelectedFiles(files);
    console.log('Selected files:', files);
  };

  // Handle remove file
  const handleRemoveFile = (index: number) => {
    const newFiles = [...selectedFiles];
    newFiles.splice(index, 1);
    setSelectedFiles(newFiles);
  };

  // Toggle dark mode
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  return (
    <div className={cn(
      "min-h-screen bg-background text-foreground transition-colors",
      darkMode && "dark"
    )}>
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-card/95 backdrop-blur supports-backdrop-filter:bg-card/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" className="md:hidden">
              <Menu className="h-5 w-5" />
            </Button>
            
            <div className="flex items-center gap-2">
              <Building className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-xl font-bold gradient-text">AASTU FMS</h1>
                <p className="text-xs text-muted-foreground">Facilities Management System</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Language Toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLanguage(language === 'en' ? 'am' : 'en')}
              className="gap-1"
            >
              <Languages className="h-4 w-4" />
              <span className="hidden sm:inline">{language === 'en' ? 'አማርኛ' : 'English'}</span>
            </Button>

            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDarkMode(!darkMode)}
              className="gap-1"
            >
              {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              <span className="hidden sm:inline">{darkMode ? 'Light' : 'Dark'}</span>
            </Button>

            {/* Notifications */}
            <Button variant="ghost" size="sm" className="relative">
              <Bell className="h-4 w-4" />
              <Badge 
                variant="destructive" 
                size="sm" 
                className="absolute -top-1 -right-1"
              >
                3
              </Badge>
            </Button>

            {/* User Menu */}
            <Button variant="ghost" size="sm" className="gap-2">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Admin</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto p-4 md:p-6">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">UI Components Showcase</h1>
          <p className="text-muted-foreground mt-2">
            All UI components for AASTU Facilities Management System
          </p>
        </div>

        {/* Alerts Section */}
        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-4">Alerts & Notifications</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <Alert>
              <Info className="h-4 w-4" />
              <Alert.Title>Information</Alert.Title>
              <Alert.Description>
                This is an informational alert. Use for general messages.
              </Alert.Description>
            </Alert>

            <Alert variant="warning">
              <Alert.Title>Warning</Alert.Title>
              <Alert.Description>
                You are UIShowcaseroaching storage limit. Clear some space.
              </Alert.Description>
            </Alert>

            <Alert variant="destructive">
              <Alert.Title>Error</Alert.Title>
              <Alert.Description>
                Failed to sync reports. Please check your connection.
              </Alert.Description>
            </Alert>

            <Alert variant="success">
              <Alert.Title>Success</Alert.Title>
              <Alert.Description>
                3 reports synced successfully with the server.
              </Alert.Description>
            </Alert>

            <Alert variant="info" dismissible onDismiss={() => alert('Dismissed!')}>
              <Alert.Title>Dismissible Alert</Alert.Title>
              <Alert.Description>
                Click the X button to dismiss this alert.
              </Alert.Description>
            </Alert>

            <Alert variant="warning" showIcon={false}>
              <Alert.Title>No Icon</Alert.Title>
              <Alert.Description>
                This alert doesn't show an icon.
              </Alert.Description>
            </Alert>
          </div>
        </section>

        {/* Buttons Section */}
        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-4">Buttons</h2>
          <div className="grid gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <Button>Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="danger">Danger</Button>
              <Button variant="success">Success</Button>
              <Button disabled>Disabled</Button>
              <Button isLoading>Loading</Button>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button size="sm">Small</Button>
              <Button size="md">Medium</Button>
              <Button size="lg">Large</Button>
              <Button size="xl">Extra Large</Button>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button priority="emergency">Emergency</Button>
              <Button priority="high">High Priority</Button>
              <Button priority="medium">Medium Priority</Button>
              <Button priority="low">Low Priority</Button>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button className="w-full sm:w-auto">Full Width (mobile)</Button>
              <Button className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                With Icon
              </Button>
              <Button className="flex items-center gap-2">
                Next
                <ChevronRight className="w-4 h-4" />
              </Button>
              <Button className="flex items-center gap-2">
                <Download className="w-4 h-4" />
                Export
                <Share2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </section>

        {/* Badges Section */}
        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-4">Badges & Indicators</h2>
          <div className="grid gap-6">
            {/* Priority Badges */}
            <div>
              <h3 className="text-lg font-medium mb-3">Priority Badges</h3>
              <div className="flex flex-wrap gap-3">
                <PriorityBadge priority="emergency" />
                <PriorityBadge priority="high" />
                <PriorityBadge priority="medium" />
                <PriorityBadge priority="low" />
                <PriorityBadge priority="emergency" showText={false} />
                <PriorityBadge priority="high" size="lg" />
              </div>
            </div>

            {/* Status Badges */}
            <div>
              <h3 className="text-lg font-medium mb-3">Status Badges</h3>
              <div className="flex flex-wrap gap-3">
                <StatusBadge status="submitted" />
                <StatusBadge status="pending" />
                <StatusBadge status="approved" />
                <StatusBadge status="assigned" />
                <StatusBadge status="in-progress" />
                <StatusBadge status="completed" />
                <StatusBadge status="closed" />
                <StatusBadge status="reopened" />
                <StatusBadge status="rejected" />
              </div>
            </div>

            {/* Regular Badges */}
            <div>
              <h3 className="text-lg font-medium mb-3">Regular Badges</h3>
              <div className="flex flex-wrap gap-3">
                <Badge>Default</Badge>
                <Badge variant="primary">Primary</Badge>
                <Badge variant="secondary">Secondary</Badge>
                <Badge variant="outline">Outline</Badge>
                <Badge variant="destructive">Destructive</Badge>
                <Badge size="sm">Small</Badge>
                <Badge size="lg">Large</Badge>
                <Badge rounded>Rounded</Badge>
                <Badge className="flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" />
                  With Icon
                </Badge>
              </div>
            </div>

            {/* SLA Indicators */}
            <div>
              <h3 className="text-lg font-medium mb-3">SLA Indicators</h3>
              <div className="flex flex-wrap gap-4">
                <SLAIndicator 
                  deadline={new Date(Date.now() + 1 * 60 * 60 * 1000)} 
                  currentTime={new Date()}
                />
                <SLAIndicator 
                  deadline={new Date(Date.now() + 8 * 60 * 60 * 1000)}
                  currentTime={new Date()}
                />
                <SLAIndicator 
                  deadline={new Date(Date.now() + 24 * 60 * 60 * 1000)}
                  currentTime={new Date()}
                />
                <SLAIndicator 
                  deadline={new Date(Date.now() - 2 * 60 * 60 * 1000)}
                  currentTime={new Date()}
                />
              </div>
            </div>
          </div>
        </section>

        {/* Cards Section */}
        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-4">Cards</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Interactive Card */}
            <Card interactive className="animate-fade-in">
              <CardHeader>
                <CardTitle>Interactive Card</CardTitle>
                <CardDescription>Hover for elevation effect</CardDescription>
              </CardHeader>
              <CardContent>
                <p>This card has interactive hover effects. Try hovering over it!</p>
              </CardContent>
              <CardFooter>
                <Button variant="outline" size="sm">Learn More</Button>
              </CardFooter>
            </Card>

            {/* Priority Card */}
            <Card priority="emergency" className="animate-fade-in" style={{ animationDelay: '100ms' }}>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Emergency Report</CardTitle>
                <PriorityBadge priority="emergency" />
              </CardHeader>
              <CardContent>
                <p className="text-sm">Electrical sparking in Block 57, Room 201. Immediate attention required.</p>
                <div className="mt-4">
                  <SLAIndicator 
                    deadline={new Date(Date.now() + 1 * 60 * 60 * 1000)}
                    currentTime={new Date()}
                    size="sm"
                  />
                </div>
              </CardContent>
              <CardFooter className="justify-between">
                <Badge>Block 57</Badge>
                <Button size="sm">Assign</Button>
              </CardFooter>
            </Card>

            {/* Status Card */}
            <Card status="in-progress" className="animate-fade-in" style={{ animationDelay: '200ms' }}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Repair in Progress</CardTitle>
                  <StatusBadge status="in-progress" />
                </div>
                <CardDescription>Mechanical issue in Block 23</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm">Broken window needs replacement. Parts have been ordered.</p>
                <div className="mt-4 flex items-center gap-2 text-sm">
                  <User className="w-4 h-4" />
                  <span>Assigned to: Electrical Team A</span>
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" size="sm" className="w-full">View Details</Button>
              </CardFooter>
            </Card>

            {/* Stats Card */}
            <Card className="animate-fade-in" style={{ animationDelay: '300ms' }}>
              <CardHeader>
                <CardTitle>System Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Total Reports</span>
                  <Badge variant="primary">145</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Pending UIShowcaseroval</span>
                  <Badge variant="outline">12</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">In Progress</span>
                  <Badge variant="secondary">8</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Completed Today</span>
                  <Badge variant="default">24</Badge>
                </div>
              </CardContent>
            </Card>

            {/* User Card */}
            <Card className="animate-fade-in" style={{ animationDelay: '400ms' }}>
              <CardHeader className="text-center">
                <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                  <User className="w-8 h-8 text-primary" />
                </div>
                <CardTitle>John Doe</CardTitle>
                <CardDescription>Coordinator</CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Building className="w-4 h-4" />
                  <span className="text-sm">Assigned Blocks: 57, 58, 59</span>
                </div>
                <Badge variant="outline">SLA Compliance: 94%</Badge>
              </CardContent>
            </Card>

            {/* Glass Effect Card */}
            <Card className="animate-fade-in glass-effect border border-white/20" style={{ animationDelay: '500ms' }}>
              <CardHeader>
                <CardTitle>Glass Effect</CardTitle>
                <CardDescription>With backdrop blur</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm">This card uses glass morphism effect with backdrop blur.</p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Form Components Section */}
        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-4">Form Components</h2>
          
          <div className="grid gap-6 md:grid-cols-2">
            {/* Input Fields */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Input Fields</h3>
              <Input 
                label="Email Address"
                placeholder="user.aastu.edu.et"
                type="email"
                helperText="Use your AASTU email address"
              />
              
              <Input 
                label="Block Number"
                placeholder="Enter block number (1-100)"
                type="number"
                min="1"
                max="100"
                error={selectedPriority === 'all' ? '' : 'Block number must be between 1 and 100'}
              />
              
              <Input 
                label="Search Reports"
                placeholder="Search by title, description..."
                leftIcon={<Search className="w-4 h-4" />}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              
              <Input 
                label="Disabled Field"
                placeholder="This field is disabled"
                disabled
              />
            </div>

            {/* Select Fields */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Select Fields</h3>
              
              <Select
                label="Priority Level"
                options={[
                  { value: 'all', label: 'All Priorities' },
                  { value: 'emergency', label: 'Emergency' },
                  { value: 'high', label: 'High' },
                  { value: 'medium', label: 'Medium' },
                  { value: 'low', label: 'Low' },
                ]}
                value={selectedPriority}
                onChange={(e) => setSelectedPriority(e.target.value)}
              />
              
              <Select
                label="Report Status"
                options={[
                  { value: 'all', label: 'All Statuses' },
                  { value: 'submitted', label: 'Submitted' },
                  { value: 'pending', label: 'Pending UIShowcaseroval' },
                  { value: 'UIShowcaseroved', label: 'UIShowcaseroved' },
                  { value: 'assigned', label: 'Assigned' },
                  { value: 'in-progress', label: 'In Progress' },
                  { value: 'completed', label: 'Completed' },
                  { value: 'closed', label: 'Closed' },
                ]}
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
              />
              
              <Select
                label="Category"
                options={[
                  { value: 'electrical', label: 'Electrical' },
                  { value: 'mechanical', label: 'Mechanical' },
                ]}
                helperText="Select the type of maintenance issue"
              />
              
              <Select
                label="Disabled Select"
                options={[{ value: '1', label: 'Option 1' }]}
                disabled
              />
            </div>
          </div>

          {/* File Upload */}
          <div className="mt-6">
            <h3 className="text-lg font-medium mb-4">File Upload</h3>
            <FileUpload
              key={fileUploadKey}
              label="Upload Photos"
              accept="image/*"
              multiple
              maxFiles={3}
              maxSize={2048}
              onFilesChange={handleFilesChange}
              preview
              compression
              required
              uploadedFiles={selectedFiles}
              onRemoveFile={handleRemoveFile}
            />
            <div className="mt-3 flex gap-3">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setFileUploadKey(prev => prev + 1)}
              >
                Reset Upload
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setSelectedFiles([])}
              >
                Clear Files
              </Button>
            </div>
          </div>
        </section>

        {/* Modal Section */}
        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-4">Modal</h2>
          
          <div className="flex flex-wrap gap-3">
            <Button onClick={() => setIsModalOpen(true)}>Open Modal</Button>
            <Button variant="outline" onClick={() => setIsModalOpen(true)}>Large Modal</Button>
            <Button variant="ghost" onClick={() => setIsModalOpen(true)}>Modal without Overlay</Button>
          </div>

          <Modal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            title="Submit New Report"
            description="Fill in the details of the maintenance issue"
            size="lg"
            showCloseButton
            closeOnEsc
          >
            <ModalContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input label="Block Number" placeholder="e.g., 57" />
                <Input label="Room Number" placeholder="e.g., 201" />
              </div>
              
              <Select
                label="Category"
                options={[
                  { value: 'electrical', label: 'Electrical' },
                  { value: 'mechanical', label: 'Mechanical' },
                ]}
              />
              
              <Input 
                label="Equipment Description" 
                placeholder="e.g., Projector in classroom 201"
              />
              
              <div>
                <label className="block text-sm font-medium mb-2">
                  Problem Description
                </label>
                <textarea 
                  className="w-full min-h-25 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  placeholder="Describe the issue in detail..."
                />
              </div>
              
              <FileUpload
                label="Upload Photos (Optional)"
                accept="image/*"
                multiple
                maxFiles={3}
                preview
              />
            </ModalContent>
            
            <ModalFooter>
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => {
                alert('Report submitted!');
                setIsModalOpen(false);
              }}>
                Submit Report
              </Button>
            </ModalFooter>
          </Modal>
        </section>

        {/* Pagination Section */}
        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-4">Pagination</h2>
          
          <Card>
            <CardHeader>
              <CardTitle>Reports List</CardTitle>
              <CardDescription>
                Showing {pagination.getItemRange().start}-{pagination.getItemRange().end} of {totalItems} reports
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <div className="space-y-3">
                {filteredReports
                  .slice(
                    (currentPage - 1) * pageSize,
                    currentPage * pageSize
                  )
                  .map((report) => (
                    <div 
                      key={report.id} 
                      className={cn(
                        "flex items-center justify-between p-3 rounded-lg border",
                        "hover:bg-accent/50 transition-colors"
                      )}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">{report.title}</span>
                          <PriorityBadge priority={report.priority} size="sm" />
                          <StatusBadge status={report.status} size="sm" />
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {report.description}
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Building className="w-3 h-3" />
                            Block {report.block}
                          </span>
                          <span>{report.category}</span>
                          <span>{report.reporter}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Edit className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
            
            <CardFooter>
              <Pagination
                currentPage={currentPage}
                totalPages={Math.ceil(filteredReports.length / pageSize)}
                onPageChange={setCurrentPage}
                totalItems={filteredReports.length}
                pageSize={pageSize}
                showInfo
                showFirstLast
                showPrevNext
                className="w-full"
              />
            </CardFooter>
          </Card>

          <div className="mt-6 space-y-4">
            <h3 className="text-lg font-medium">Pagination Variants</h3>
            <div className="space-y-3">
              <Pagination
                currentPage={1}
                totalPages={5}
                onPageChange={setCurrentPage}
                showInfo={false}
              />
              
              <Pagination
                currentPage={3}
                totalPages={20}
                onPageChange={setCurrentPage}
                showFirstLast={false}
              />
              
              <Pagination
                currentPage={8}
                totalPages={100}
                onPageChange={setCurrentPage}
                showInfo
                disabled
              />
            </div>
          </div>
        </section>

        {/* Spinner & Loading States */}
        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-4">Loading States</h2>
          
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card className="text-center p-6">
              <Spinner size="sm" className="mx-auto mb-3" />
              <p className="text-sm">Small Spinner</p>
            </Card>
            
            <Card className="text-center p-6">
              <Spinner className="mx-auto mb-3" />
              <p className="text-sm">Medium Spinner</p>
            </Card>
            
            <Card className="text-center p-6">
              <Spinner size="lg" className="mx-auto mb-3" />
              <p className="text-sm">Large Spinner</p>
            </Card>
            
            <Card className="text-center p-6">
              <Spinner size="xl" className="mx-auto mb-3" />
              <p className="text-sm">Extra Large</p>
            </Card>
          </div>
          
          <div className="mt-6">
            <h3 className="text-lg font-medium mb-3">Spinner Variants</h3>
            <div className="flex flex-wrap items-center gap-4 p-4 rounded-lg bg-muted">
              <Spinner variant="primary" />
              <Spinner variant="secondary" />
              <Spinner variant="dark" />
              <Spinner variant="white" className="bg-primary p-2 rounded" />
              <Spinner label="Loading..." />
            </div>
          </div>
        </section>

        {/* Utility Components */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">Utility Components</h2>
          
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Network Status</CardTitle>
              </CardHeader>
              <CardContent>
                <Alert variant="warning" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <Alert.Title>System Maintenance</Alert.Title>
                  <Alert.Description>
                    The system will be undergoing maintenance from 2:00 AM to 4:00 AM.
                  </Alert.Description>
                </Alert>
                
                <Button 
                  variant="outline" 
                  className="w-full"
                >
                  Check System Status
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Action Buttons</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  New Report
                </Button>
                
                <Button 
                  variant="outline"
                  className="w-full flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Export Data
                </Button>
                
                <Button 
                  variant="ghost"
                  className="w-full flex items-center gap-2"
                >
                  <Settings className="w-4 h-4" />
                  Settings
                </Button>
                
                <Button 
                  variant="danger"
                  className="w-full flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete All
                </Button>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-6 mt-10">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <Building className="h-6 w-6 text-primary" />
              <span className="font-semibold">AASTU FMS</span>
            </div>
            
            <div className="text-sm text-muted-foreground text-center">
              <p>Addis Ababa Science & Technology University</p>
              <p className="mt-1">Facilities Management System v1.0.0</p>
            </div>
            
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm">
                <HelpCircle className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <MessageSquare className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <Settings className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default UIShowcase;