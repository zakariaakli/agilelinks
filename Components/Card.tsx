/**
 * Unified Card Component System
 * Consistent card styling throughout the platform
 */

import React from 'react';
import styles from '../Styles/card.module.css';

interface CardProps {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'outlined' | 'minimal' | 'gradient';
  padding?: 'sm' | 'md' | 'lg' | 'none';
  className?: string;
  onClick?: () => void;
  href?: string;
  hoverable?: boolean;
  loading?: boolean;
}

interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
}

interface CardBodyProps {
  children: React.ReactNode;
  className?: string;
}

interface CardFooterProps {
  children: React.ReactNode;
  className?: string;
}

// Main Card Component
export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  padding = 'md',
  className = '',
  onClick,
  href,
  hoverable = false,
  loading = false,
  ...props
}) => {
  const cardClasses = [
    styles.card,
    styles[variant],
    styles[`padding-${padding}`],
    (onClick || href || hoverable) && styles.interactive,
    loading && styles.loading,
    className
  ].filter(Boolean).join(' ');

  const CardContent = () => (
    <>
      {loading && (
        <div className={styles.loadingOverlay}>
          <div className={styles.loadingSpinner}></div>
        </div>
      )}
      {children}
    </>
  );

  if (href) {
    return (
      <a href={href} className={cardClasses} {...props}>
        <CardContent />
      </a>
    );
  }

  if (onClick) {
    return (
      <button className={cardClasses} onClick={onClick} {...props}>
        <CardContent />
      </button>
    );
  }

  return (
    <div className={cardClasses} {...props}>
      <CardContent />
    </div>
  );
};

// Card Header Component
export const CardHeader: React.FC<CardHeaderProps> = ({
  children,
  className = '',
  ...props
}) => (
  <div className={`${styles.cardHeader} ${className}`} {...props}>
    {children}
  </div>
);

// Card Body Component
export const CardBody: React.FC<CardBodyProps> = ({
  children,
  className = '',
  ...props
}) => (
  <div className={`${styles.cardBody} ${className}`} {...props}>
    {children}
  </div>
);

// Card Footer Component
export const CardFooter: React.FC<CardFooterProps> = ({
  children,
  className = '',
  ...props
}) => (
  <div className={`${styles.cardFooter} ${className}`} {...props}>
    {children}
  </div>
);

// Specialized Card Variants
export const FeatureCard: React.FC<Omit<CardProps, 'variant'>> = (props) => (
  <Card variant="elevated" hoverable {...props} />
);

export const StatsCard: React.FC<Omit<CardProps, 'variant'>> = (props) => (
  <Card variant="outlined" {...props} />
);

export const ActionCard: React.FC<Omit<CardProps, 'variant' | 'hoverable'>> = (props) => (
  <Card variant="default" hoverable {...props} />
);

export const PrimaryCard: React.FC<Omit<CardProps, 'variant'>> = (props) => (
  <Card variant="gradient" {...props} />
);

export default Card;