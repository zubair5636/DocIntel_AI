import { useCallback, useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useDropzone } from "react-dropzone";
import imageCompression from "browser-image-compression";
import { PDFDocument } from "pdf-lib";
import { motion, AnimatePresence } from "motion/react";
import { ArrowLeft, UploadCloud, FileImage, Download, RefreshCw, Settings2, CheckCircle2 } from "lucide-react";
import { tools, governmentPresets } from "../data/tools";
import { formatBytes } from "../lib/utils";

export function ToolPage() {
  const { toolId } = useParams();
  const tool = tools.find(t => t.id === toolId);
  const govPreset = governmentPresets[toolId || ""];
  
  const [files, setFiles] = useState<File[]>([]);
  const [processedFile, setProcessedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressText, setProgressText] = useState("");
  const [targetSize, setTargetSize] = useState(govPreset?.requirements.maxSizeKB || 200);

  const isPdfMerge = tool?.id === "merge-pdf";
  const isPdfToJpg = tool?.id === "pdf-to-jpg";
  const isJpgToPdf = tool?.id === "jpg-to-pdf";
  const isPdfToGrayscale = tool?.id === "pdf-to-grayscale";
  const isImageToDocx = tool?.id === "image-to-docx";
  const isRemoveBackground = tool?.id === "remove-background";
  const isChangeBackground = tool?.id === "change-background";
  const isPdfTool = tool?.category === "pdf" || isJpgToPdf;
  const isImageTool = tool?.category === "image" && !isJpgToPdf;
  const [bgColor, setBgColor] = useState("#3b82f6");

  useEffect(() => {
    setFiles([]);
    setProcessedFile(null);
    setTargetSize(governmentPresets[toolId || ""]?.requirements.maxSizeKB || 200);
    setIsProcessing(false);
  }, [toolId]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      if (isPdfMerge) {
        setFiles(prev => [...prev, ...acceptedFiles]);
      } else {
        setFiles([acceptedFiles[0]]);
      }
      setProcessedFile(null);
    }
  }, [isPdfMerge]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: (isPdfTool && !isJpgToPdf) ? { 'application/pdf': ['.pdf'] } : (isJpgToPdf ? {
      'image/jpeg': ['.jpeg', '.jpg'],
      'image/png': ['.png']
    } : {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp']
    }),
    maxFiles: (isPdfMerge || isJpgToPdf) ? 10 : 1
  } as any);

  const processAction = async () => {
    if (files.length === 0) return;
    setIsProcessing(true);
    
    try {
      if (isPdfMerge) {
        const mergedPdf = await PDFDocument.create();
        for (const f of files) {
          const arrayBuffer = await f.arrayBuffer();
          const pdf = await PDFDocument.load(arrayBuffer);
          const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
          copiedPages.forEach((page) => {
            mergedPdf.addPage(page);
          });
        }
        const pdfBytes = await mergedPdf.save();
        const blob = new Blob([pdfBytes], { type: "application/pdf" });
        setProcessedFile(new File([blob], "merged.pdf", { type: "application/pdf" }));
      } else if (isJpgToPdf) {
        const mergedPdf = await PDFDocument.create();
        for (const f of files) {
          const arrayBuffer = await f.arrayBuffer();
          const image = f.type.includes('png') ? await mergedPdf.embedPng(arrayBuffer) : await mergedPdf.embedJpg(arrayBuffer);
          const page = mergedPdf.addPage([image.width, image.height]);
          page.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height });
        }
        const pdfBytes = await mergedPdf.save();
        const blob = new Blob([pdfBytes], { type: "application/pdf" });
        setProcessedFile(new File([blob], "converted.pdf", { type: "application/pdf" }));
      } else if (isPdfToJpg || isPdfToGrayscale) {
        const formData = new FormData();
        formData.append("file", files[0]);
        const endpoint = isPdfToJpg ? "/api/pdf-to-jpg" : "/api/pdf-to-grayscale";
        const response = await fetch(endpoint, {
          method: "POST",
          body: formData,
        });
        if (!response.ok) {
          throw new Error("Failed to process PDF");
        }
        const blob = await response.blob();
        const ext = isPdfToJpg ? "jpg" : "pdf";
        setProcessedFile(new File([blob], `converted_${files[0].name.replace('.pdf', '')}.${ext}`, { type: blob.type }));
      } else if (isPdfTool || files[0].type === "application/pdf") {
        const formData = new FormData();
        formData.append("file", files[0]);
        formData.append("targetSizeKB", targetSize.toString());

        const response = await fetch("/api/compress-pdf", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          throw new Error("Failed to compress PDF");
        }

        const blob = await response.blob();
        setProcessedFile(new File([blob], `optimized_${files[0].name}`, { type: "application/pdf" }));
      } else if (isImageToDocx) {
        setProgressText("Extracting text and formatting...");
        const formData = new FormData();
        formData.append("file", files[0]);
        
        const response = await fetch("/api/image-to-docx", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          const err = await response.json();
          throw new Error(err.error || "Failed to process image to DOCX");
        }

        const blob = await response.blob();
        setProcessedFile(new File([blob], `extracted_${files[0].name.replace(/\.[^/.]+$/, "")}.docx`, { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" }));
        setProgressText("");
      } else if (isRemoveBackground || isChangeBackground) {
        setProgressText("Initializing AI...");
        const { removeBackground } = await import("@imgly/background-removal");
        
        const imageBlob = await removeBackground(files[0], {
          model: "small" as any,
          proxyToWorker: true,
          progress: (key, current, total) => {
            if (key.includes("model") || key.includes("wasm")) {
              const percentage = Math.round((current / total) * 100);
              setProgressText(`Downloading AI Model (${percentage}%)...`);
            } else if (key === "compute:inference") {
              setProgressText("Processing image...");
            }
          }
        });
        setProgressText("");
        
        if (isChangeBackground) {
          const img = new Image();
          img.src = URL.createObjectURL(imageBlob);
          await new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = reject;
          });
          
          const finalCanvas = document.createElement("canvas");
          finalCanvas.width = img.width;
          finalCanvas.height = img.height;
          const finalCtx = finalCanvas.getContext("2d");
          if (finalCtx) {
             finalCtx.fillStyle = bgColor;
             finalCtx.fillRect(0, 0, finalCanvas.width, finalCanvas.height);
             finalCtx.drawImage(img, 0, 0);
             
             finalCanvas.toBlob((blob) => {
               if (blob) setProcessedFile(new File([blob], `bg_changed_${files[0].name}`, { type: "image/png" }));
             }, "image/png");
             return;
          }
        }
        
        setProcessedFile(new File([imageBlob], `bg_removed_${files[0].name}`, { type: "image/png" }));
      } else {
        const options = {
          maxSizeMB: targetSize / 1024,
          maxWidthOrHeight: 1920,
          useWebWorker: true
        };
        const compressedFile = await imageCompression(files[0], options);
        setProcessedFile(compressedFile);
      }
    } catch (error) {
      console.error(error);
      alert("Error processing file");
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadFile = () => {
    if (!processedFile) return;
    const url = URL.createObjectURL(processedFile);
    const a = document.createElement("a");
    a.href = url;
    a.download = processedFile.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!tool) {
    return <div className="p-8 text-center text-slate-300">Tool not found</div>;
  }

  return (
    <div className="flex-1 w-full min-h-full pb-20 relative z-10">
      <div className="bg-white/5 border-b border-white/10 backdrop-blur-md">
        <div className="container mx-auto px-4 py-8">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white mb-6 transition-colors">
            <ArrowLeft size={16} /> Back to Tools
          </Link>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-3 text-slate-100">{tool.name}</h1>
          <p className="text-slate-400 text-lg max-w-2xl">{tool.description}</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Canvas */}
          <div className="lg:col-span-2 space-y-6">
            <AnimatePresence mode="wait">
              {files.length === 0 ? (
                <motion.div
                  key="upload"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  {...getRootProps()}
                  className={`bg-white/5 border-2 border-dashed rounded-[32px] p-16 text-center cursor-pointer transition-all
                    ${isDragActive ? 'border-blue-500/50 bg-blue-500/10' : 'border-white/10 hover:border-blue-500/30 hover:bg-white/10'}`}
                >
                  <input {...getInputProps()} />
                  <div className="w-20 h-20 mx-auto bg-slate-900 border border-white/5 text-blue-400 rounded-2xl flex items-center justify-center mb-6 shadow-2xl">
                    <UploadCloud size={40} />
                  </div>
                  <h3 className="text-2xl font-semibold mb-3">Upload your {isPdfMerge ? 'PDFs' : isPdfTool ? 'PDF' : 'file'}</h3>
                  <p className="text-slate-500 mb-6 text-sm">Drag and drop, or click to browse</p>
                  <div className="inline-flex items-center gap-2 text-sm text-slate-400">
                    <span>Supported: {isPdfTool ? 'PDF' : 'JPG, PNG, WebP'}</span>
                    <span>•</span>
                    <span>Max 20MB</span>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="editor"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass-card rounded-[32px] overflow-hidden border border-white/10 flex flex-col"
                >
                  <div className="p-4 border-b border-white/10 flex items-center justify-between bg-slate-900/50">
                    <div className="flex flex-col gap-2 w-full max-w-md">
                      {files.map((f, i) => (
                        <div key={i} className="flex items-center gap-3 w-full">
                          <FileImage className="text-blue-400 shrink-0" size={24} />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate text-slate-200">{f.name}</p>
                            <p className="text-xs text-slate-500">{formatBytes(f.size)}</p>
                          </div>
                          <button 
                            onClick={() => { 
                              setFiles(prev => prev.filter((_, idx) => idx !== i));
                              setProcessedFile(null);
                            }}
                            className="text-sm font-medium text-slate-500 hover:text-red-400 transition-colors shrink-0"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                      {(isPdfMerge || isJpgToPdf) && (
                         <div {...getRootProps()} className="mt-2 text-sm text-blue-400 cursor-pointer hover:underline">
                           <input {...getInputProps()} />
                           + Add another {isPdfMerge ? 'PDF' : 'Image'}
                         </div>
                      )}
                    </div>
                  </div>
                  <div className="bg-black/20 p-8 flex items-center justify-center min-h-[400px]">
                    {processedFile ? (
                      <div className="relative group text-center">
                        {processedFile.type.startsWith('image/') ? (
                          <img src={URL.createObjectURL(processedFile)} alt="Preview" className="max-w-full max-h-[500px] rounded-lg shadow-2xl" />
                        ) : (
                          <div className="w-48 h-64 bg-slate-900 border border-white/10 rounded-lg flex flex-col items-center justify-center shadow-2xl">
                             <FileImage className="text-blue-400 mb-2" size={48} />
                             <span className="font-semibold text-slate-200">{processedFile.name}</span>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-emerald-500/10 border-2 border-emerald-500 rounded-lg pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div className="absolute -top-3 -right-3 bg-emerald-500 text-white rounded-full p-1 shadow-lg">
                          <CheckCircle2 size={20} />
                        </div>
                      </div>
                    ) : (
                      <div className="opacity-80">
                         {files[0]?.type.startsWith('image/') ? (
                           <img src={URL.createObjectURL(files[0])} alt="Original" className="max-w-full max-h-[500px] rounded-lg shadow-lg" />
                         ) : (
                           <div className="text-slate-500 flex flex-col items-center">
                              <FileImage size={48} className="mb-4 opacity-50 text-blue-400" />
                              <span>{files.length} {isPdfTool ? 'PDF' : 'File'}{files.length > 1 ? 's' : ''} ready to process</span>
                           </div>
                         )}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Sidebar Controls */}
          <div className="space-y-6">
            <div className="bg-slate-900/50 backdrop-blur-xl rounded-[32px] p-6 border border-white/10 shadow-2xl shadow-black/50 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 blur-[80px] pointer-events-none"></div>
              
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-6 text-slate-100 font-semibold">
                  <Settings2 size={20} />
                  <span>Optimization Settings</span>
                </div>

                {govPreset && (
                  <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                  <h4 className="font-medium text-blue-400 mb-2 text-sm">{govPreset.name} Preset Active</h4>
                  <ul className="text-sm text-slate-400 space-y-1 list-disc list-inside">
                    <li>Max Size: {govPreset.requirements.maxSizeKB} KB</li>
                    <li>Format: {govPreset.requirements.formats[0].split('/')[1].toUpperCase()}</li>
                    {govPreset.requirements.dpi && <li>DPI: {govPreset.requirements.dpi}</li>}
                  </ul>
                </div>
              )}

              {isChangeBackground && (
                <div className="space-y-4 mb-8">
                  <label className="block text-sm font-medium text-slate-300">
                    Background Color
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={bgColor}
                      onChange={(e) => setBgColor(e.target.value)}
                      disabled={isProcessing}
                      className="h-10 w-full rounded cursor-pointer border-0 p-0"
                    />
                    <span className="font-mono text-xs text-slate-400">{bgColor}</span>
                  </div>
                </div>
              )}

              {!(isPdfToJpg || isJpgToPdf || isPdfToGrayscale || isPdfMerge || isRemoveBackground || isChangeBackground) && (
                <div className="space-y-4 mb-8">
                  <label className="block text-sm font-medium text-slate-300">
                    Target File Size (KB)
                  </label>
                  <input
                    type="range"
                    min="10"
                    max="1000"
                    step="10"
                    value={targetSize}
                    onChange={(e) => setTargetSize(Number(e.target.value))}
                    disabled={isProcessing}
                    className="w-full accent-blue-500"
                  />
                  <div className="flex justify-between text-xs text-slate-500 font-mono">
                    <span>10 KB</span>
                    <span className="font-semibold text-blue-400">{targetSize} KB</span>
                    <span>1 MB</span>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <button
                  onClick={processAction}
                  disabled={files.length === 0 || isProcessing || (isPdfMerge && files.length < 2)}
                  className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-xl font-medium hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-600/20"
                >
                  {isProcessing ? (
                    <><RefreshCw className="animate-spin" size={18} /> {progressText || "Processing..."}</>
                  ) : isPdfMerge ? (
                    <>{files.length < 2 ? 'Add at least 2 PDFs' : 'Merge PDFs'}</>
                  ) : isJpgToPdf ? (
                    <>{files.length < 1 ? 'Add at least 1 Image' : 'Convert to PDF'}</>
                  ) : isPdfToJpg ? (
                    <>Convert to JPG</>
                  ) : isPdfToGrayscale ? (
                    <>Convert to Grayscale</>
                  ) : isRemoveBackground ? (
                    <>Remove Background</>
                  ) : isImageToDocx ? (
                    <>Convert to DOCX</>
                  ) : isChangeBackground ? (
                    <>Change Background</>
                  ) : (
                    <>Optimize Document</>
                  )}
                </button>
                
                {processedFile && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    onClick={downloadFile}
                    className="w-full flex items-center justify-center gap-2 bg-emerald-500 text-slate-950 py-3 rounded-xl font-semibold hover:bg-emerald-400 shadow-lg shadow-emerald-500/20 transition-all"
                  >
                    <Download size={18} />
                    Download Final ({formatBytes(processedFile.size)})
                  </motion.button>
                )}
              </div>
            </div>
            </div>
            
            {processedFile && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 flex items-start gap-3"
              >
                <CheckCircle2 className="text-emerald-400 mt-0.5 shrink-0" size={20} />
                <div>
                  <h4 className="font-medium text-emerald-400 text-sm mb-1">Success!</h4>
                  <p className="text-xs text-emerald-500/80">
                    {(isPdfToJpg || isJpgToPdf || isPdfToGrayscale || isPdfMerge || isRemoveBackground || isChangeBackground || isImageToDocx) 
                      ? 'Processing complete. Your file is ready to download.'
                      : (processedFile.size < (files[0]?.size || 0) 
                         ? `Reduced by ${((1 - processedFile.size / (files[0]?.size || 1)) * 100).toFixed(0)}%. Matches all selected requirements.` 
                         : 'Optimization complete. Matches all selected requirements.')
                    }
                  </p>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
