export const required = (v: string) => (v.trim().length === 0 ? 'Required' : null);

export const numberInRange = (v: string, min: number, max: number, label = 'Value') => {
  const n = Number(v);
  if (Number.isNaN(n)) return `${label} must be a number`;
  if (n < min || n > max) return `${label} must be between ${min} and ${max}`;
  return null;
};

export const positiveNumber = (v: string, label = 'Value') => {
  const n = Number(v);
  if (Number.isNaN(n)) return `${label} must be a number`;
  if (n <= 0) return `${label} must be greater than 0`;
  return null;
};

export const validateEmail = (email: string) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const maxLength = (v: string, n: number) =>
  v.length > n ? `Must be ${n} characters or fewer` : null;
