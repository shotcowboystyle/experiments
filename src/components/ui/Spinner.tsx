import './spinner.css';
import type { ComponentProps } from 'react';

import type { SpinnerSize } from './types';

export interface SpinnerProps extends ComponentProps<'span'> {
  size?: SpinnerSize;
  /** Accessible label announced to screen readers. */
  label?: string;
}

/** Loading spinner. Inherits color and scales with font-size unless `size` is set. */
export const Spinner = ({ size, label = 'Loading', className, ...rest }: SpinnerProps) => (
  <span
    className={className ? `ui-spinner ${className}` : 'ui-spinner'}
    data-size={size}
    role="status"
    aria-label={label}
    {...rest}
  />
);
