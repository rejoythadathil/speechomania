import { Link } from 'react-router'
import { buttonStyles } from '@/components/base/buttons/button'
import { cx } from '@/utils/cx'

export function RouterButton({ to, variant = 'primary', size = 'medium', leadingIcon: Leading, children, className }) {
  return (
    <Link to={to} className={cx(buttonStyles.base, buttonStyles.size[size], buttonStyles.variant[variant], className)}>
      {Leading ? <Leading className={buttonStyles.icon[size]} aria-hidden /> : null}
      <span className={buttonStyles.label[size]}>{children}</span>
    </Link>
  )
}
