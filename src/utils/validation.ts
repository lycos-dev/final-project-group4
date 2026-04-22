// ─── Primitives ───────────────────────────────────────────────────────────────

export const required = (v: string): string | null =>
  v.trim().length === 0 ? 'This field is required' : null;

export const minLength = (v: string, n: number, label = 'Value'): string | null =>
  v.trim().length < n ? `${label} must be at least ${n} characters` : null;

export const maxLength = (v: string, n: number, label = 'Value'): string | null =>
  v.trim().length > n ? `${label} must be ${n} characters or fewer` : null;

export const validateEmail = (email: string): boolean =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

// ─── Numeric Helpers ──────────────────────────────────────────────────────────

export const numberInRange = (
  v: string,
  min: number,
  max: number,
  label = 'Value',
): string | null => {
  const n = Number(v);
  if (v.trim() === '' || Number.isNaN(n)) return `${label} must be a number`;
  if (n < min || n > max) return `${label} must be between ${min} and ${max}`;
  return null;
};

export const positiveNumber = (v: string, label = 'Value'): string | null => {
  const n = Number(v);
  if (v.trim() === '' || Number.isNaN(n)) return `${label} must be a number`;
  if (n <= 0) return `${label} must be greater than 0`;
  return null;
};

// ─── Profile-specific Rules ───────────────────────────────────────────────────

/** Name: non-empty, 2–50 chars */
export const validateName = (v: string): string | null =>
  required(v) ?? minLength(v, 2, 'Name') ?? maxLength(v, 50, 'Name');

/** Age: integer, 10–120 */
export const validateAge = (v: string): string | null =>
  numberInRange(v, 10, 120, 'Age');

/**
 * Height validation.
 * metric  → cm  (50–272 cm)
 * imperial → in  (20–107 in  ≈ 1′8″–8′11″)
 */
export const validateHeight = (v: string, isImperial: boolean): string | null =>
  isImperial
    ? numberInRange(v, 20, 107, 'Height (in)')
    : numberInRange(v, 50, 272, 'Height (cm)');

/**
 * Weight validation.
 * metric  → kg  (1–500 kg)
 * imperial → lb  (2–1100 lb)
 */
export const validateWeight = (v: string, isImperial: boolean): string | null =>
  isImperial
    ? numberInRange(v, 2, 1100, 'Weight (lb)')
    : numberInRange(v, 1, 500, 'Weight (kg)');

/** Fitness goal: optional, max 200 chars */
export const validateGoal = (v: string): string | null =>
  maxLength(v, 200, 'Goal');

// ─── Aggregate Profile Validator ──────────────────────────────────────────────

export interface ProfileFormErrors {
  name: string | null;
  age: string | null;
  height: string | null;
  weight: string | null;
  goal: string | null;
}

export const validateProfileForm = (
  fields: { name: string; age: string; height: string; weight: string; goal: string },
  isImperial: boolean,
): ProfileFormErrors => ({
  name: validateName(fields.name),
  age: validateAge(fields.age),
  height: validateHeight(fields.height, isImperial),
  weight: validateWeight(fields.weight, isImperial),
  goal: validateGoal(fields.goal),
});

export const hasErrors = (errors: ProfileFormErrors): boolean =>
  Object.values(errors).some((v) => v !== null);