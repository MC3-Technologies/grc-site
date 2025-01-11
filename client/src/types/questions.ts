interface Conditional {
  value: string;
  next: string;
}

interface Question {
  section: "example-section" | "example-section2";
  id: string;
  question: string;
  value: string;
  conditionals: Conditional[];
  next: string | null;
}

interface TextQuestion extends Question {
  type: "text";
}

interface RadioQuestion extends Question {
  type: "radio";
  options: string[];
}

interface SoftwareInventoryEntry {
  id: string;
  type: "software-entry";
  name: string;
  version?: string;
  vendor: string;
  installationDate?: string;
  lastUpdated?: string;
  criticalSoftware: boolean;
  cloudBased: boolean;
  comments?: string;
}
interface HardwareInventoryEntry {
  id: string;
  type: "hardware-entry";
  name: string;
  make: String;
  model: string;
  operatingSystem?: string;
  mobileDevice: boolean;
  hasRemoteConnection?: boolean;
  comments?: string;
}

export type {
  TextQuestion,
  RadioQuestion,
  SoftwareInventoryEntry,
  HardwareInventoryEntry,
};
