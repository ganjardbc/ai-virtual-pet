import { forwardRef, type InputHTMLAttributes } from 'react';

interface TextInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> {
  readonly id: string;
  readonly label: string;
  readonly error?: string | undefined;
}

export const TextInput = forwardRef<HTMLInputElement, TextInputProps>(function TextInput(
  { id, label, error, ...props },
  ref,
) {
  const errorId = `${id}-error`;

  return (
    <div className="field">
      <label className="field__label" htmlFor={id}>
        {label}
      </label>
      <input
        ref={ref}
        id={id}
        className="field__input"
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        {...props}
      />
      <p id={errorId} className="field__error" role={error ? 'alert' : undefined}>
        {error ?? ''}
      </p>
    </div>
  );
});
