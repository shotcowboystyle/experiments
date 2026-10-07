import './button.css';
import type { ComponentProps } from 'react';

import type { ButtonSize, ButtonVariant } from './types';

export interface ButtonProps extends ComponentProps<'button'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  /** Icon-only button; pass an aria-label. */
  icon?: boolean;
  block?: boolean;
  /** Skips the scale-on-press where the motion would distract. */
  static?: boolean;
}

/** Shift CSS button. */
export const Button = ({
  variant = 'primary',
  size,
  disabled = false,
  loading = false,
  icon = false,
  block = false,
  static: isStatic = false,
  type = 'button',
  ...rest
}: ButtonProps) => (
  <button
    s-btn={variant}
    s-size={size}
    s-icon={icon ? '' : undefined}
    s-block={block ? '' : undefined}
    s-loading={loading ? '' : undefined}
    data-static={isStatic ? '' : undefined}
    type={type}
    disabled={disabled || loading}
    aria-busy={loading || undefined}
    {...rest}
  />
);
