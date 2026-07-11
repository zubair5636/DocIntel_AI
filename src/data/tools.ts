import { Tool, GovernmentPreset } from "../types";

export const categories = [
  { id: "pdf", name: "PDF Tools", description: "Edit, merge, and convert PDFs" },
  { id: "image", name: "Image Tools", description: "Resize, compress, and edit images" },
  { id: "government", name: "Gov Portals", description: "1-click presets for official uploads" },
  { id: "compress", name: "Compression", description: "Reduce file size instantly" },
];

export const tools: Tool[] = [
  // PDF Tools
  { id: "merge-pdf", name: "Merge PDF", description: "Combine multiple PDFs into one unified document.", category: "pdf", iconName: "Layers", href: "/tool/merge-pdf", isPopular: true },
  { id: "compress-pdf", name: "Compress PDF", description: "Reduce PDF file size without losing quality.", category: "pdf", iconName: "Minimize", href: "/tool/compress-pdf", isPopular: true },
  
  // Convert Tools
  { id: "pdf-to-jpg", name: "PDF to JPG", description: "Convert PDF document to a single JPG image.", category: "pdf", iconName: "Image", href: "/tool/pdf-to-jpg", isPopular: true },
  { id: "jpg-to-pdf", name: "JPG to PDF", description: "Convert JPG/PNG images to PDF document.", category: "image", iconName: "FileImage", href: "/tool/jpg-to-pdf", isPopular: true },
  { id: "image-to-docx", name: "Image to DOCX", description: "Convert handwritten or printed paper images into typed DOCX.", category: "image", iconName: "FileText", href: "/tool/image-to-docx", isNew: true },
  { id: "pdf-to-grayscale", name: "Grayscale PDF", description: "Convert a PDF to black & white.", category: "pdf", iconName: "Contrast", href: "/tool/pdf-to-grayscale" },

  // Image Tools
  { id: "remove-background", name: "Remove Background", description: "Automatically remove the background from an image.", category: "image", iconName: "Eraser", href: "/tool/remove-background", isPopular: true },
  { id: "change-background", name: "Change Background", description: "Change the background color of an image.", category: "image", iconName: "Palette", href: "/tool/change-background" },
  { id: "compress-image", name: "Compress Image", description: "Smart compression for JPG, PNG, and WebP.", category: "image", iconName: "ImageMinus", href: "/tool/compress-image", isPopular: true },
  { id: "resize-image", name: "Resize Image", description: "Change image dimensions and scale.", category: "image", iconName: "Scaling", href: "/tool/resize-image" },
  { id: "passport-photo", name: "Passport Photo", description: "Create official passport photos with correct specs.", category: "image", iconName: "UserSquare", href: "/tool/passport-photo", isNew: true },
  
  // Gov Portals
  { id: "gov-pan-card", name: "PAN Card Photo", description: "Format photo for NSDL/UTIITL PAN application.", category: "government", iconName: "Landmark", href: "/tool/gov-pan-card", isPopular: true },
  { id: "gov-aadhaar", name: "Aadhaar Document", description: "Prepare documents for UIDAI updates.", category: "government", iconName: "Fingerprint", href: "/tool/gov-aadhaar" },
  { id: "gov-upsc", name: "UPSC Signature", description: "Format signature for UPSC portal.", category: "government", iconName: "PenTool", href: "/tool/gov-upsc" },
];

export const governmentPresets: Record<string, GovernmentPreset> = {
  "gov-pan-card": {
    id: "gov-pan-card",
    name: "PAN Card Application",
    description: "NSDL/UTIITL Photo & Signature Requirements",
    requirements: {
      maxSizeKB: 50,
      formats: ["image/jpeg", "image/jpg"],
      dpi: 200,
    }
  },
  "gov-upsc": {
    id: "gov-upsc",
    name: "UPSC Application",
    description: "Photograph and Signature formatting",
    requirements: {
      maxSizeKB: 300,
      formats: ["image/jpeg", "image/jpg"],
    }
  }
};
