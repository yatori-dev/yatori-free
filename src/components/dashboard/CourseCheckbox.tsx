import { useEffect, useRef } from 'react';

interface CourseCheckboxProps {
  checked: boolean;
  disabled?: boolean;
  indeterminate: boolean;
  onChange: () => void;
  'aria-label'?: string;
}

export function CourseCheckbox({ checked, disabled = false, indeterminate, onChange, 'aria-label': ariaLabel }: CourseCheckboxProps) {
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (ref.current) ref.current.indeterminate = indeterminate;
  }, [indeterminate]);

  return (
    <input
      type="checkbox"
      ref={ref}
      checked={checked}
      disabled={disabled}
      onChange={onChange}
      aria-label={ariaLabel}
      className="h-4 w-4 shrink-0 cursor-pointer rounded border-border bg-card accent-primary disabled:cursor-not-allowed disabled:opacity-50"
    />
  );
}
