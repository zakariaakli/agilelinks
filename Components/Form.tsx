/**
 * Enhanced Form Component System
 * Professional form elements using design tokens
 */

import React from 'react';
import { AlertTriangleIcon, CheckCircleIcon, LoaderIcon } from './Icons';
import styles from '../Styles/form.module.css';

// Form Container
interface FormProps {
  children: React.ReactNode;
  onSubmit?: (e: React.FormEvent) => void;
  className?: string;
}

export const Form: React.FC<FormProps> = ({ children, onSubmit, className = '', ...props }) => (
  <form className={`${styles.form} ${className}`} onSubmit={onSubmit} {...props}>
    {children}
  </form>
);

// Form Group
interface FormGroupProps {
  children: React.ReactNode;
  className?: string;
}

export const FormGroup: React.FC<FormGroupProps> = ({ children, className = '', ...props }) => (
  <div className={`${styles.formGroup} ${className}`} {...props}>
    {children}
  </div>
);

// Label
interface LabelProps {
  children: React.ReactNode;
  htmlFor?: string;
  required?: boolean;
  className?: string;
}

export const Label: React.FC<LabelProps> = ({ children, htmlFor, required = false, className = '', ...props }) => (
  <label className={`${styles.label} ${className}`} htmlFor={htmlFor} {...props}>
    {children}
    {required && <span className={styles.required}>*</span>}
  </label>
);

// Input
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  variant?: 'default' | 'error' | 'success';
  fullWidth?: boolean;
}

export const Input: React.FC<InputProps> = ({ 
  variant = 'default', 
  fullWidth = true, 
  className = '', 
  ...props 
}) => {
  const inputClasses = [
    styles.input,
    styles[variant],
    fullWidth && styles.fullWidth,
    className
  ].filter(Boolean).join(' ');

  return <input className={inputClasses} {...props} />;
};

// Textarea
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  variant?: 'default' | 'error' | 'success';
  fullWidth?: boolean;
  resize?: 'none' | 'vertical' | 'horizontal' | 'both';
}

export const Textarea: React.FC<TextareaProps> = ({ 
  variant = 'default', 
  fullWidth = true, 
  resize = 'vertical',
  className = '', 
  ...props 
}) => {
  const textareaClasses = [
    styles.textarea,
    styles[variant],
    styles[`resize-${resize}`],
    fullWidth && styles.fullWidth,
    className
  ].filter(Boolean).join(' ');

  return <textarea className={textareaClasses} {...props} />;
};

// Select
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  variant?: 'default' | 'error' | 'success';
  fullWidth?: boolean;
  children: React.ReactNode;
}

export const Select: React.FC<SelectProps> = ({ 
  variant = 'default', 
  fullWidth = true, 
  className = '', 
  children,
  ...props 
}) => {
  const selectClasses = [
    styles.select,
    styles[variant],
    fullWidth && styles.fullWidth,
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={styles.selectWrapper}>
      <select className={selectClasses} {...props}>
        {children}
      </select>
    </div>
  );
};

// Radio Group
interface RadioGroupProps {
  name: string;
  value?: string;
  onChange?: (value: string) => void;
  children: React.ReactNode;
  className?: string;
}

export const RadioGroup: React.FC<RadioGroupProps> = ({ 
  name, 
  value, 
  onChange, 
  children, 
  className = '' 
}) => (
  <div className={`${styles.radioGroup} ${className}`} role="radiogroup">
    {React.Children.map(children, (child) => {
      if (React.isValidElement(child) && child.type === RadioOption) {
        return React.cloneElement(child, { name, selectedValue: value, onChange });
      }
      return child;
    })}
  </div>
);

// Radio Option
interface RadioOptionProps {
  value: string;
  children: React.ReactNode;
  name?: string;
  selectedValue?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  className?: string;
}

export const RadioOption: React.FC<RadioOptionProps> = ({ 
  value, 
  children, 
  name, 
  selectedValue, 
  onChange, 
  disabled = false,
  className = '' 
}) => {
  const isSelected = selectedValue === value;
  
  return (
    <label className={`${styles.radioOption} ${isSelected ? styles.selected : ''} ${disabled ? styles.disabled : ''} ${className}`}>
      <input
        type="radio"
        name={name}
        value={value}
        checked={isSelected}
        onChange={() => onChange?.(value)}
        disabled={disabled}
        className={styles.radioInput}
      />
      <span className={styles.radioIndicator}></span>
      <span className={styles.radioLabel}>{children}</span>
    </label>
  );
};

// Checkbox
interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  variant?: 'default' | 'error' | 'success';
}

export const Checkbox: React.FC<CheckboxProps> = ({ 
  label, 
  variant = 'default', 
  className = '', 
  ...props 
}) => {
  const checkboxClasses = [
    styles.checkbox,
    styles[variant],
    className
  ].filter(Boolean).join(' ');

  if (label) {
    return (
      <label className={styles.checkboxWrapper}>
        <input type="checkbox" className={checkboxClasses} {...props} />
        <span className={styles.checkboxIndicator}></span>
        <span className={styles.checkboxLabel}>{label}</span>
      </label>
    );
  }

  return <input type="checkbox" className={checkboxClasses} {...props} />;
};

// Helper Text
interface HelperTextProps {
  children: React.ReactNode;
  variant?: 'default' | 'error' | 'success';
  className?: string;
}

export const HelperText: React.FC<HelperTextProps> = ({ 
  children, 
  variant = 'default', 
  className = '' 
}) => {
  const icon = variant === 'error' ? <AlertTriangleIcon size={16} /> : 
               variant === 'success' ? <CheckCircleIcon size={16} /> : null;

  return (
    <div className={`${styles.helperText} ${styles[variant]} ${className}`}>
      {icon && <span className={styles.helperIcon}>{icon}</span>}
      <span>{children}</span>
    </div>
  );
};

// Field
interface FieldProps {
  label?: string;
  required?: boolean;
  error?: string;
  success?: string;
  helperText?: string;
  children: React.ReactNode;
  className?: string;
}

export const Field: React.FC<FieldProps> = ({ 
  label, 
  required = false, 
  error, 
  success, 
  helperText, 
  children, 
  className = '' 
}) => {
  const variant = error ? 'error' : success ? 'success' : 'default';
  const message = error || success || helperText;

  return (
    <FormGroup className={className}>
      {label && <Label required={required}>{label}</Label>}
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, { variant });
        }
        return child;
      })}
      {message && (
        <HelperText variant={variant}>
          {message}
        </HelperText>
      )}
    </FormGroup>
  );
};

// Loading Button (enhanced version of our Button component for forms)
interface FormButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'success' | 'error';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  children: React.ReactNode;
}

export const FormButton: React.FC<FormButtonProps> = ({ 
  loading = false,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  children,
  disabled,
  className = '',
  ...props 
}) => {
  const buttonClasses = [
    'btn-primary', // Use global button styles
    loading && 'loading',
    fullWidth && 'w-full',
    className
  ].filter(Boolean).join(' ');

  return (
    <button 
      className={buttonClasses}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <LoaderIcon size={16} className="animate-spin" />}
      {!loading && children}
    </button>
  );
};

export default Form;