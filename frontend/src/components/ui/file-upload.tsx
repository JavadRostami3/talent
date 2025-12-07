import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Upload, File, CheckCircle2, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileUploadProps {
  label?: string;
  accept?: string;
  disabled?: boolean;
  uploaded?: boolean;
  uploading?: boolean;
  uploadProgress?: number;
  fileName?: string;
  onFileSelect: (file: File | null) => void;
  onUpload?: () => void;
  onRemove?: () => void;
  className?: string;
}

export function FileUpload({
  label,
  accept = '.pdf,.jpg,.jpeg,.png',
  disabled = false,
  uploaded = false,
  uploading = false,
  uploadProgress = 0,
  fileName,
  onFileSelect,
  onUpload,
  onRemove,
  className,
}: FileUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setSelectedFile(file);
    onFileSelect(file);
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    onFileSelect(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onRemove?.();
  };

  return (
    <div className={cn('space-y-3', className)}>
      {label && (
        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          {label}
        </label>
      )}

      {/* Upload Area */}
      <div
        className={cn(
          'relative rounded-lg border-2 border-dashed transition-colors',
          uploaded ? 'border-green-500 bg-green-50/50' : 'border-gray-300 bg-gray-50/50',
          disabled && 'opacity-50 cursor-not-allowed',
          !disabled && !uploaded && 'hover:border-primary hover:bg-primary/5 cursor-pointer'
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleFileChange}
          disabled={disabled || uploaded}
          className="hidden"
        />

        <div className="p-6 text-center">
          {uploaded ? (
            // Uploaded State
            <div className="flex flex-col items-center gap-3">
              <div className="p-3 rounded-full bg-green-100">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-green-700">فایل با موفقیت آپلود شد</p>
                {fileName && (
                  <p className="text-xs text-muted-foreground mt-1">{fileName}</p>
                )}
              </div>
              {onRemove && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleRemoveFile}
                  className="mt-2"
                >
                  <X className="h-4 w-4 ml-2" />
                  حذف فایل
                </Button>
              )}
            </div>
          ) : uploading ? (
            // Uploading State
            <div className="flex flex-col items-center gap-3">
              <div className="p-3 rounded-full bg-primary/10">
                <Upload className="h-8 w-8 text-primary animate-pulse" />
              </div>
              <div className="w-full max-w-xs space-y-2">
                <div className="flex items-center gap-3">
                  <File className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{selectedFile?.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {selectedFile && `${(selectedFile.size / 1024).toFixed(2)} KB از ${(selectedFile.size / 1024).toFixed(2)} KB`}
                    </p>
                  </div>
                </div>
                <Progress value={uploadProgress} className="h-2" />
                <p className="text-xs text-primary text-right">در حال آپلود... {uploadProgress}%</p>
              </div>
            </div>
          ) : selectedFile ? (
            // File Selected State
            <div className="flex flex-col items-center gap-3">
              <div className="p-3 rounded-full bg-primary/10">
                <File className="h-8 w-8 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">{selectedFile.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(selectedFile.size / 1024).toFixed(2)} KB
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleRemoveFile}
                >
                  <X className="h-4 w-4 ml-2" />
                  حذف
                </Button>
                {onUpload && (
                  <Button
                    type="button"
                    size="sm"
                    onClick={onUpload}
                    className="bg-primary"
                  >
                    آپلود فایل
                  </Button>
                )}
              </div>
            </div>
          ) : (
            // Empty State
            <div className="flex flex-col items-center gap-3">
              <div className="p-3 rounded-full bg-primary/10">
                <Upload className="h-8 w-8 text-primary" />
              </div>
              <div>
                <button
                  type="button"
                  onClick={handleBrowseClick}
                  disabled={disabled}
                  className="text-sm font-medium text-primary hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  انتخاب فایل
                </button>
                <p className="text-xs text-muted-foreground mt-1">
                  فرمت‌های مجاز: PDF, JPG, PNG
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
