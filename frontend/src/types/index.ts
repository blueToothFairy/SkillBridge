export type UserRole = 'STUDENT' | 'SME' | 'ADMIN';

export type ProjectStatus =
  | 'DRAFT'
  | 'OPEN'
  | 'MATCHED'
  | 'IN_PROGRESS'
  | 'PENDING_ACCEPTANCE'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'UNDER_REVIEW';

export type ApplicationStatus =
  | 'APPLIED'
  | 'SHORTLISTED'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'WITHDRAWN';

export type MilestoneStatus =
  | 'PENDING'
  | 'IN_PROGRESS'
  | 'SUBMITTED'
  | 'ACCEPTED'
  | 'REVISION_REQUIRED';

export type EscrowStatus = 'PENDING' | 'LOCKED' | 'RELEASED';

export type PredefinedSkill =
  | 'HTML'
  | 'CSS'
  | 'JavaScript'
  | 'TypeScript'
  | 'React'
  | 'Node.js'
  | 'Python'
  | 'Java'
  | 'SQL'
  | 'Git'
  | 'Figma'
  | 'Adobe XD'
  | 'Google Ads'
  | 'SEO'
  | 'Content Writing'
  | 'Video Editing'
  | 'Data Analysis'
  | 'Excel'
  | 'Copywriting'
  | 'Mailchimp'
  | 'Marketing'
  | 'Financial Modelling'
  | 'PowerPoint'
  | 'Brand Strategy'
  | 'Content Strategy'
  | 'Shopify'
  | 'Pandas'
  | 'Tableau'
  | 'UI/UX';

export type PredefinedCategory =
  | 'Frontend'
  | 'Backend'
  | 'Full-stack'
  | 'UI/UX'
  | 'Mobile'
  | 'AI/ML'
  | 'Marketing'
  | 'Content'
  | 'Business'
  | 'Data'
  | 'Design';

export interface Milestone {
  id: string;
  projectId: string;
  title: string;
  description: string;
  deadline: string;
  orderIndex: number;
  status: MilestoneStatus;
  deliverableUrl?: string;
  submittedAt?: string;
  amountVnd: number;
  revisionFeedback?: string;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  smeName: string;
  smeCompany: string;
  smeAvatar: string;
  category: PredefinedCategory;
  requiredSkills: PredefinedSkill[];
  budgetVnd: number;
  durationWeeks: number;
  location: 'Remote' | 'On-site';
  status: ProjectStatus;
  maxApplicants: number;
  createdAt: string;
  milestones: Milestone[];
  escrowStatus: EscrowStatus;
  autoAcceptDaysRemaining?: number;
  acceptedStudentId?: string;
  acceptedStudentName?: string;
  acceptedStudentUniversity?: string;
  acceptedStudentAvatar?: string;
  applicantCount: number;
}

export interface Application {
  id: string;
  projectId: string;
  projectTitle: string;
  studentId: string;
  studentName: string;
  studentUniversity: string;
  studentMajor: string;
  studentYear: number;
  studentAvatar: string;
  skills: PredefinedSkill[];
  matchScore: number;
  matchingSkillsCount: number;
  totalRequiredSkills: number;
  status: ApplicationStatus;
  coverMessage: string;
  appliedAt: string;
}

export interface StudentProfile {
  id: string;
  userId: string;
  fullName: string;
  university: string;
  major: string;
  year: number;
  location: string;
  bio: string;
  githubUrl: string;
  linkedInUrl?: string;
  rating: number;
  reviewCount: number;
  completedProjectsCount: number;
  availability: string;
  availableUntil: string;
  skills: {
    expert: PredefinedSkill[];
    proficient: PredefinedSkill[];
    familiar: PredefinedSkill[];
  };
}

export interface PortfolioEntry {
  id: string;
  studentId: string;
  projectTitle: string;
  smeCompany: string;
  smeName: string;
  role: string;
  duration: string;
  skillsApplied: PredefinedSkill[];
  deliverableUrl: string;
  completedDate: string;
  verificationCode: string;
}

export interface DigitalCertificate {
  id: string;
  certificateNumber: string;
  studentName: string;
  university: string;
  projectTitle: string;
  smeCompany: string;
  issueDate: string;
  skillsVerified: PredefinedSkill[];
  verificationCode: string;
}

export interface User {
  id: string;
  email: string;
  role: UserRole;
  profile?: any;
}

export interface RegisterPayload {
  account: {
    email: string;
    password: string;
    role: UserRole;
  };
  profile: {
    fullName?: string;
    university?: string;
    major?: string;
    year?: number;
    skills?: {
      expert: string[];
      proficient: string[];
      familiar: string[];
    };
    companyName?: string;
    taxCode?: string;
    industry?: string;
    website?: string;
  };
}

export interface AuthResponse {
  token: string;
  user: User;
}

export type TagType = 'CATEGORY' | 'SKILL';

export interface Tag {
  id: string;
  name: string;
  type: TagType;
  isActive: boolean;
  createdAt: string;
}

export interface ApiProject {
  id: string;
  smeId: string;
  title: string;
  description: string;
  categoryTagId: string;
  categoryTag?: Tag;
  requiredSkillTags: string[];
  budget: number;
  durationWeeks: number;
  maxApplicants: number;
  deadline: string;
  status: ProjectStatus;
  escrowStatus: EscrowStatus;
  createdAt: string;
  updatedAt: string;
  sme?: {
    id: string;
    companyName: string;
    industry?: string;
    website?: string;
  };
  milestones?: Milestone[];
  applicantCount?: number;
}

export interface CreateProjectPayload {
  title: string;
  description: string;
  categoryTagId: string;
  requiredSkillTags: string[];
  budget: number;
  durationWeeks: number;
  maxApplicants?: number;
  deadline?: string;
  milestones?: {
    title: string;
    description: string;
    deadline: string;
    amountVnd: number;
  }[];
}


