import { useCallback, useState } from "react";
import type { FormEvent } from "react";

// ─── Generic form hook ────────────────────────────────────────────────────────

type Errors<T> = Partial<Record<keyof T, string>>;
type Touched<T> = Partial<Record<keyof T, boolean>>;

type Validator<T> = (values: T) => Errors<T>;

interface UseFormOptions<T> {
  initialValues: T;
  validate?: Validator<T>;
  onSubmit: (values: T) => void | Promise<void>;
}

export function useForm<T extends Record<string, unknown>>({
  initialValues, validate, onSubmit,
}: UseFormOptions<T>) {
  const [values, setValues]     = useState<T>(initialValues);
  const [errors, setErrors]     = useState<Errors<T>>({});
  const [touched, setTouched]   = useState<Touched<T>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError]   = useState<string | null>(null);
  const [submitCount, setSubmitCount]   = useState(0);

  const handleChange = useCallback(<K extends keyof T>(field: K, value: T[K]) => {
    setValues(prev => ({ ...prev, [field]: value }));
    // Clear individual error on change
    setErrors(prev => ({ ...prev, [field]: undefined }));
  }, []);

  const handleBlur = useCallback(<K extends keyof T>(field: K) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    if (validate) {
      const errs = validate(values);
      setErrors(prev => ({ ...prev, [field]: errs[field] }));
    }
  }, [validate, values]);

  const handleSubmit = useCallback(async (e?: FormEvent) => {
    e?.preventDefault();
    setTouched(Object.fromEntries(Object.keys(values).map(k => [k, true])) as Touched<T>);
    const errs = validate ? validate(values) : {};
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitCount(c => c + 1);
    try {
      await onSubmit(values);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An error occurred.";
      setSubmitError(msg);
    } finally {
      setIsSubmitting(false);
    }
  }, [values, validate, onSubmit]);

  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
    setSubmitError(null);
  }, [initialValues]);

  const setFieldValue = useCallback(<K extends keyof T>(field: K, value: T[K]) => {
    setValues(prev => ({ ...prev, [field]: value }));
  }, []);

  const setFieldError = useCallback(<K extends keyof T>(field: K, error: string) => {
    setErrors(prev => ({ ...prev, [field]: error }));
  }, []);

  return {
    values, errors, touched, isSubmitting, submitError, submitCount,
    handleChange, handleBlur, handleSubmit, reset, setFieldValue, setFieldError,
    /** Whether a field has an error AND has been touched */
    fieldError: (field: keyof T) => touched[field] ? errors[field] : undefined,
  };
}
