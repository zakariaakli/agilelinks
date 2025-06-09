/**
 * Unified Button Component System
 * Professional button variants using design tokens
 */

import React from 'react';
import Link from 'next/link';
import { LoaderIcon } from './Icons';
import styles from '../Styles/button.module.css';

interface BaseButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  className?: string;
}

interface ButtonProps extends BaseButtonProps {
  type?: 'button' | 'submit' | 'reset';
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
}

interface LinkButtonProps extends BaseButtonProps {
  href: string;
  target?: string;
  rel?: string;
}

// Main Button Component
export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  className = '',
  type = 'button',
  onClick,
  ...props
}) => {
  const buttonClasses = [
    styles.button,
    styles[variant],
    styles[size],
    fullWidth && styles.fullWidth,
    disabled && styles.disabled,
    loading && styles.loading,
    className
  ].filter(Boolean).join(' ');

  const renderContent = () => (
    <>
      {loading && <LoaderIcon size={size === 'sm' ? 14 : size === 'lg' ? 20 : 16} className={styles.loadingIcon} />}
      {!loading && icon && iconPosition === 'left' && <span className={styles.iconLeft}>{icon}</span>}
      <span className={styles.text}>{children}</span>
      {!loading && icon && iconPosition === 'right' && <span className={styles.iconRight}>{icon}</span>}
    </>
  );

  return (
    <button
      type={type}
      className={buttonClasses}
      disabled={disabled || loading}
      onClick={onClick}
      {...props}
    >
      {renderContent()}
    </button>
  );
};

// Link Button Component (for Next.js routing)
export const LinkButton: React.FC<LinkButtonProps> = ({
  children,
  href,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  className = '',
  target,
  rel,
  ...props
}) => {
  const buttonClasses = [
    styles.button,
    styles[variant],
    styles[size],
    fullWidth && styles.fullWidth,
    disabled && styles.disabled,
    loading && styles.loading,
    className
  ].filter(Boolean).join(' ');

  const renderContent = () => (
    <>
      {loading && <LoaderIcon size={size === 'sm' ? 14 : size === 'lg' ? 20 : 16} className={styles.loadingIcon} />}
      {!loading && icon && iconPosition === 'left' && <span className={styles.iconLeft}>{icon}</span>}
      <span className={styles.text}>{children}</span>
      {!loading && icon && iconPosition === 'right' && <span className={styles.iconRight}>{icon}</span>}
    </>
  );

  if (disabled) {
    return (
      <span className={buttonClasses} {...props}>
        {renderContent()}
      </span>
    );
  }

  // External link
  if (href.startsWith('http') || target === '_blank') {
    return (
      <a
        href={href}
        className={buttonClasses}
        target={target}
        rel={rel || (target === '_blank' ? 'noopener noreferrer' : undefined)}
        {...props}
      >
        {renderContent()}
      </a>
    );
  }

  // Internal Next.js link
  return (
    <Link href={href} className={buttonClasses} {...props}>
      {renderContent()}
    </Link>
  );
};

// Specific button variants for common use cases
export const PrimaryButton: React.FC<Omit<ButtonProps, 'variant'>> = (props) => (
  <Button variant="primary" {...props} />
);

export const SecondaryButton: React.FC<Omit<ButtonProps, 'variant'>> = (props) => (
  <Button variant="secondary" {...props} />
);

export const SuccessButton: React.FC<Omit<ButtonProps, 'variant'>> = (props) => (
  <Button variant="success" {...props} />
);

export const ErrorButton: React.FC<Omit<ButtonProps, 'variant'>> = (props) => (
  <Button variant="error" {...props} />
);

export const GhostButton: React.FC<Omit<ButtonProps, 'variant'>> = (props) => (
  <Button variant="ghost" {...props} />
);

// Icon-only button for compact spaces
export const IconButton: React.FC<ButtonProps & { 'aria-label': string }> = ({
  children,
  size = 'md',
  className = '',
  ...props
}) => (
  <Button
    size={size}
    className={`${styles.iconOnly} ${className}`}
    {...props}
  >
    {children}
  </Button>
);

export default Button;