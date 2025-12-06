import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DocumentLightboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  alt: string;
}

export const DocumentLightboxModal = ({
  isOpen,
  onClose,
  imageUrl,
  alt,
}: DocumentLightboxModalProps) => {
  const [isZoomed, setIsZoomed] = useState(false);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      setIsZoomed(false);
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleImageClick = () => {
    setIsZoomed(!isZoomed);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75"
      onClick={handleBackdropClick}
    >
      <button
        onClick={onClose}
        className="absolute right-4 top-4 z-50 rounded-sm bg-[#1b4498] p-2 text-white ring-offset-background transition-opacity hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        aria-label="بستن"
      >
        <X className="h-6 w-6 text-white" strokeWidth={3} />
      </button>
      <div className="relative max-h-[90vh] max-w-[90vw] p-4">
        <img
          src={imageUrl}
          alt={alt}
          onClick={handleImageClick}
          className={cn(
            'max-h-[90vh] max-w-[90vw] cursor-zoom-in object-contain transition-transform duration-200',
            isZoomed && 'scale-[1.3] cursor-zoom-out'
          )}
        />
      </div>
    </div>
  );
};

