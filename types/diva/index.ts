import type {
  User,
  DivaProfile,
  DivaKYCSubmission,
  DivaKYCDocument,
  DivaKYCStatus,
  DivaAccountStatus,
  DivaDocumentType,
  DivaLoginStatus,
} from "@prisma/client";

export type { DivaKYCStatus, DivaAccountStatus, DivaDocumentType, DivaLoginStatus };

export type DivaUser = User & {
  divaProfile?: DivaProfile | null;
  divaKYC?: (DivaKYCSubmission & { documents: DivaKYCDocument[] }) | null;
};

export type KYCWizardState = {
  step: 1 | 2 | 3 | 4;
  step1: {
    fullName: string;
    dateOfBirth: string;
    nationality: string;
    address: string;
  };
  step2Docs: { type: DivaDocumentType; url: string; fileName: string }[];
  step3Selfie: { url: string; fileName: string } | null;
};

export type AdminUserRow = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  createdAt: Date;
  isActive: boolean;
  divaProfile: { accountStatus: DivaAccountStatus; referralCode: string | null } | null;
  divaKYC: { status: DivaKYCStatus; submittedAt: Date | null } | null;
};

export type RegisterInput = {
  name: string;
  email: string;
  phone: string;
  country: string;
  password: string;
  confirmPassword: string;
  referralCode?: string;
};

export type LoginInput = {
  email: string;
  password: string;
  rememberMe?: boolean;
};
