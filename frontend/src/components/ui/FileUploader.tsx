import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Upload, X, CheckCircle, FileIcon } from 'lucide-react';
import { uploadService } from '@/services/uploadService';
import { toast } from '@/hooks/use-toast';

interface FileUploaderProps {
  documentType: string;
  label: string;
  onUploadComplete: (file: any) => void;
  existingFile?: any;
  disabled?: boolean;
}

export const FileUploader = ({
  documentType,
  label,
  onUploadComplete,
  existingFile,
  disabled = false,
}: FileUploaderProps) => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadedFile, setUploadedFile] = useState(existingFile);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: 'خطا',
        description: 'حجم فایل نباید بیشتر از 10 مگابایت باشد',
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);
    setProgress(0);

    try {
      const result = await uploadService.uploadDocument(file, documentType, (progressEvent) => {
        setProgress(progressEvent.percentage);
      });

      setUploadedFile(result);
      onUploadComplete(result);
      toast({
        title: 'موفق',
        description: 'فایل با موفقیت آپلود شد',
      });
    } catch (error) {
      toast({
        title: 'خطا',
        description: 'آپلود فایل با خطا مواجه شد',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!uploadedFile) return;

    try {
      await uploadService.deleteDocument(uploadedFile.id);
      setUploadedFile(null);
      setProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      toast({
        title: 'موفق',
        description: 'فایل حذف شد',
      });
    } catch (error) {
      toast({
        title: 'خطا',
        description: 'حذف فایل با خطا مواجه شد',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-foreground">{label}</label>
      <div className="border-2 border-dashed border-border rounded-lg p-4 bg-card">
        {!uploadedFile ? (
          <div className="space-y-3">
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileSelect}
              disabled={disabled || uploading}
              className="hidden"
              accept=".pdf,.jpg,.jpeg,.png"
            />
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled || uploading}
            >
              <Upload className="ml-2 h-4 w-4" />
              {uploading ? 'در حال آپلود...' : 'انتخاب فایل'}
            </Button>
            {uploading && (
              <div className="space-y-1">
                <Progress value={progress} className="h-2" />
                <p className="text-xs text-center text-muted-foreground">{progress}%</p>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-success" />
              <div className="flex items-center gap-2">
                <FileIcon className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">{uploadedFile.name}</span>
              </div>
            </div>
            {!disabled && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleDelete}
                className="text-destructive hover:text-destructive"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}
      </div>
      <p className="text-xs text-muted-foreground">فرمت‌های مجاز: PDF, JPG, PNG - حداکثر حجم: 10MB</p>
    </div>
  );
};
