export const formatDate = (date: string): string => {
  return new Date(date).toLocaleDateString('fa-IR');
};

export const formatNationalId = (nationalId: string): string => {
  if (nationalId.length !== 10) return nationalId;
  return `${nationalId.slice(0, 3)}-${nationalId.slice(3, 9)}-${nationalId.slice(9)}`;
};

export const getStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    draft: 'پیش‌نویس',
    under_review: 'در حال بررسی',
    defective: 'نقص دارد',
    approved: 'تأیید شده',
  };
  return labels[status] || status;
};

export const getStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    draft: 'bg-status-draft text-status-draft-foreground',
    under_review: 'bg-status-review text-status-review-foreground',
    defective: 'bg-status-defective text-status-defective-foreground',
    approved: 'bg-status-approved text-status-approved-foreground',
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
