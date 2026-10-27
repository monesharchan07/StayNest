import React from 'react';

export default function FormField({
  label,
  id,
  type = 'text',
  value,
  onChange,
  error,
  placeholder,
  required = false,
  helpText,
  children,
  ...props
}) {
  return (
    <div className="form-group">
      {label && (
        <label htmlFor={id} className="form-label">
          {label} {required && <span style={{ color: 'var(--color-error)' }}>*</span>}
        </label>
      )}

      {children ? (
        children
      ) : type === 'textarea' ? (
        <textarea
          id={id}
          className={`form-input ${error ? 'error' : ''}`}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          rows={props.rows || 4}
          required={required}
          {...props}
        />
      ) : type === 'select' ? (
        <select
          id={id}
          className={`form-select ${error ? 'error' : ''}`}
          value={value}
          onChange={onChange}
          required={required}
          {...props}
        >
          {props.options?.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          id={id}
          type={type}
          className={`form-input ${error ? 'error' : ''}`}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          {...props}
        />
      )}

      {error && <div className="form-error">{error}</div>}
      {helpText && !error && (
        <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
          {helpText}
        </div>
      )}
    </div>
  );
}
