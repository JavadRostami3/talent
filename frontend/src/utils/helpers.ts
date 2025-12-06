export const formatDate = (date: string): string => {
  return new Date(date).toLocaleDateString('fa-IR');
};

export const formatNationalId = (nationalId: string): string => {
  if (nationalId.length !== 10) return nationalId;
  return `${nationalId.slice(0, 3)}-${nationalId.slice(3, 9)}-${nationalId.slice(9)}`;
};

export const getStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    DRAFT: 'پیش‌نویس',
    SUBMITTED: 'ارسال شده',
    UNDER_UNIVERSITY_REVIEW: 'در حال بررسی دانشگاه',
    UNDER_FACULTY_REVIEW: 'در حال بررسی دانشکده',
    RETURNED_FOR_CORRECTION: 'بازگشت برای اصلاح',
    APPROVED_BY_UNIVERSITY: 'تأیید توسط دانشگاه',
    REJECTED_BY_UNIVERSITY: 'رد توسط دانشگاه',
    APPROVED: 'تأیید شده',
    REJECTED: 'رد شده',
  };
  return labels[status] || status;
};

export const getStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    DRAFT: 'bg-status-draft text-status-draft-foreground',
    SUBMITTED: 'bg-status-review text-status-review-foreground',
    UNDER_UNIVERSITY_REVIEW: 'bg-status-review text-status-review-foreground',
    UNDER_FACULTY_REVIEW: 'bg-status-review text-status-review-foreground',
    RETURNED_FOR_CORRECTION: 'bg-status-defective text-status-defective-foreground',
    APPROVED_BY_UNIVERSITY: 'bg-status-approved text-status-approved-foreground',
    REJECTED_BY_UNIVERSITY: 'bg-status-defective text-status-defective-foreground',
    APPROVED: 'bg-status-approved text-status-approved-foreground',
    REJECTED: 'bg-status-defective text-status-defective-foreground',
  };
  return colors[status] || '';
};

export const validateNationalId = (nationalId: string): boolean => {
  if (!/^\d{10}$/.test(nationalId)) return false;
  
  const check = parseInt(nationalId[9]);
  const sum = nationalId
    .split('')
    .slice(0, 9)
    .reduce((acc, digit, index) => acc + parseInt(digit) * (10 - index), 0);
  
  const remainder = sum % 11;
  return (remainder < 2 && check === remainder) || (remainder >= 2 && check === 11 - remainder);
};
