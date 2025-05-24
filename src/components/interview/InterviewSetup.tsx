
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Phone, User, Briefcase, GraduationCap } from "lucide-react";

interface InterviewSetupProps {
  onStartInterview: (data: any) => void;
  isLoading: boolean;
}

const InterviewSetup = ({ onStartInterview, isLoading }: InterviewSetupProps) => {
  const [formData, setFormData] = useState({
    interviewType: '',
    targetRole: '',
    experienceLevel: '',
    companyFocus: '',
    focusAreas: [] as string[]
  });

  const interviewTypes = [
    { value: 'technical', label: 'Technical Interview' },
    { value: 'behavioral', label: 'Behavioral Interview' },
    { value: 'leadership', label: 'Leadership Interview' },
    { value: 'system-design', label: 'System Design Interview' },
    { value: 'case-study', label: 'Case Study Interview' }
  ];

  const experienceLevels = [
    { value: 'entry', label: 'Entry Level (0-2 years)' },
    { value: 'mid', label: 'Mid Level (3-5 years)' },
    { value: 'senior', label: 'Senior Level (6-10 years)' },
    { value: 'executive', label: 'Executive Level (10+ years)' }
  ];

  const focusOptions = [
    'Problem Solving',
    'Communication Skills',
    'Team Leadership',
    'Technical Knowledge',
    'System Architecture',
    'Project Management',
    'Data Structures & Algorithms',
    'Database Design',
    'API Development',
    'Cloud Technologies'
  ];

  const handleFocusAreaChange = (area: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      focusAreas: checked 
        ? [...prev.focusAreas, area]
        : prev.focusAreas.filter(item => item !== area)
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.interviewType || !formData.targetRole || !formData.experienceLevel) {
      return;
    }
    onStartInterview(formData);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card className="shadow-lg">
        <CardHeader className="text-center bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="h-8 w-8" />
          </div>
          <CardTitle className="text-2xl">AI Interviewer</CardTitle>
          <CardDescription className="text-blue-100">
            Set up your personalized mock interview experience
          </CardDescription>
        </CardHeader>
        <CardContent className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Interview Type */}
            <div className="space-y-2">
              <Label htmlFor="interviewType" className="text-base font-medium">
                Interview Type *
              </Label>
              <Select 
                value={formData.interviewType} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, interviewType: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select interview type" />
                </SelectTrigger>
                <SelectContent>
                  {interviewTypes.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Target Role */}
            <div className="space-y-2">
              <Label htmlFor="targetRole" className="text-base font-medium">
                Target Role *
              </Label>
              <Input
                id="targetRole"
                placeholder="e.g., Senior Software Engineer, Product Manager, Data Scientist"
                value={formData.targetRole}
                onChange={(e) => setFormData(prev => ({ ...prev, targetRole: e.target.value }))}
                className="text-base"
              />
            </div>

            {/* Experience Level */}
            <div className="space-y-2">
              <Label htmlFor="experienceLevel" className="text-base font-medium">
                Experience Level *
              </Label>
              <Select 
                value={formData.experienceLevel} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, experienceLevel: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select your experience level" />
                </SelectTrigger>
                <SelectContent>
                  {experienceLevels.map(level => (
                    <SelectItem key={level.value} value={level.value}>
                      {level.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Company Focus */}
            <div className="space-y-2">
              <Label htmlFor="companyFocus" className="text-base font-medium">
                Company/Industry Focus (Optional)
              </Label>
              <Input
                id="companyFocus"
                placeholder="e.g., Fintech, Healthcare, E-commerce, Startup"
                value={formData.companyFocus}
                onChange={(e) => setFormData(prev => ({ ...prev, companyFocus: e.target.value }))}
                className="text-base"
              />
            </div>

            {/* Focus Areas */}
            <div className="space-y-2">
              <Label className="text-base font-medium">
                Focus Areas (Select up to 3)
              </Label>
              <div className="grid grid-cols-2 gap-3">
                {focusOptions.map(area => (
                  <div key={area} className="flex items-center space-x-2">
                    <Checkbox
                      id={area}
                      checked={formData.focusAreas.includes(area)}
                      onCheckedChange={(checked) => handleFocusAreaChange(area, !!checked)}
                      disabled={!formData.focusAreas.includes(area) && formData.focusAreas.length >= 3}
                    />
                    <Label htmlFor={area} className="text-sm font-normal">
                      {area}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-lg py-6"
              disabled={isLoading || !formData.interviewType || !formData.targetRole || !formData.experienceLevel}
            >
              <Phone className="h-5 w-5 mr-2" />
              {isLoading ? "Starting Interview..." : "Start Interview Call"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default InterviewSetup;
