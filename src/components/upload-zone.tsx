"use client"

import { useCallback, useState } from "react"
import { useDropzone } from "react-dropzone"
import { Upload, FileText, Loader2, CheckCircle, Sparkles } from "lucide-react"

interface UploadZoneProps {
  onFileAccepted: (file: File) => void
  isLoading?: boolean
}

export function UploadZone({ onFileAccepted, isLoading }: UploadZoneProps) {
  const [fileName, setFileName] = useState<string | null>(null)

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFileName(acceptedFiles[0].name)
      onFileAccepted(acceptedFiles[0])
    }
  }, [onFileAccepted])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    maxFiles: 1,
    disabled: isLoading,
  })

  return (
    <div
      {...getRootProps()}
      className={`relative border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-300 ${
        isDragActive
          ? "border-primary bg-primary/[0.04] scale-[1.01] shadow-lg shadow-primary/10"
          : "border-muted-foreground/20 hover:border-primary/40 hover:bg-muted/30 hover:shadow-sm"
      } ${isLoading ? "opacity-80 cursor-wait pointer-events-none" : ""}`}
    >
      <input {...getInputProps()} />

      {/* Decorative corners when dragging */}
      {isDragActive && (
        <>
          <div className="absolute top-3 left-3 w-6 h-6 border-t-2 border-l-2 border-primary rounded-tl-lg" />
          <div className="absolute top-3 right-3 w-6 h-6 border-t-2 border-r-2 border-primary rounded-tr-lg" />
          <div className="absolute bottom-3 left-3 w-6 h-6 border-b-2 border-l-2 border-primary rounded-bl-lg" />
          <div className="absolute bottom-3 right-3 w-6 h-6 border-b-2 border-r-2 border-primary rounded-br-lg" />
        </>
      )}

      <div className="flex flex-col items-center gap-4">
        {isLoading ? (
          <>
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Loader2 className="h-8 w-8 text-primary animate-spin" />
              </div>
              <Sparkles className="h-4 w-4 text-primary absolute -top-1 -right-1 animate-pulse" />
            </div>
            <div>
              <p className="font-semibold text-lg">AI is reading your contract...</p>
              <p className="text-sm text-muted-foreground mt-1">Extracting dates, parties, contingencies, and milestones</p>
            </div>
            <div className="flex gap-6 text-xs text-muted-foreground mt-2">
              <span className="flex items-center gap-1.5"><CheckCircle className="h-3 w-3 text-green-500" /> PDF uploaded</span>
              <span className="flex items-center gap-1.5"><Loader2 className="h-3 w-3 animate-spin" /> Parsing contract</span>
              <span className="flex items-center gap-1.5 opacity-50">○ Generating timeline</span>
            </div>
          </>
        ) : fileName ? (
          <>
            <div className="w-16 h-16 rounded-2xl bg-green-50 flex items-center justify-center">
              <FileText className="h-8 w-8 text-green-600" />
            </div>
            <div>
              <p className="font-semibold text-green-700">{fileName}</p>
              <p className="text-sm text-muted-foreground mt-1">Drop another file to replace</p>
            </div>
          </>
        ) : (
          <>
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-colors ${
              isDragActive ? "bg-primary/10" : "bg-muted"
            }`}>
              <Upload className={`h-8 w-8 transition-colors ${isDragActive ? "text-primary" : "text-muted-foreground"}`} />
            </div>
            <div>
              <p className="font-semibold text-lg">
                {isDragActive ? "Drop your contract here" : "Drop your purchase agreement here"}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {isDragActive ? "Release to upload" : "or click to browse — PDF only, CT SmartMLS Standard Forms"}
              </p>
            </div>
            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
              <span>✓ AI-powered parsing</span>
              <span>✓ 60-second setup</span>
              <span>✓ Review before activating</span>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
