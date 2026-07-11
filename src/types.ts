import { LucideIcon } from "lucide-react";

export type ToolCategory = 
  | "pdf" 
  | "image" 
  | "convert" 
  | "compress" 
  | "government" 
  | "scanner" 
  | "qr" 
  | "security";

export interface Tool {
  id: string;
  name: string;
  description: string;
  category: ToolCategory;
  iconName: string;
  href: string;
  isPopular?: boolean;
  isNew?: boolean;
}

export interface GovernmentPreset {
  id: string;
  name: string;
  description: string;
  requirements: {
    maxSizeKB: number;
    minWidth?: number;
    minHeight?: number;
    maxWidth?: number;
    maxHeight?: number;
    formats: string[];
    dpi?: number;
  };
}
