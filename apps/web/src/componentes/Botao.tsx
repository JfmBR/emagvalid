import type { ButtonHTMLAttributes } from 'react'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variante?: 'principal' | 'sec' | 'txt' | 'perigo'
}

// Classes de design-system/components/bundle.css (Button). Um só principal por grupo.
export function Botao({ variante = 'principal', type = 'button', className, ...props }: Props) {
  const classes = ['btn', variante === 'principal' ? '' : variante, className ?? '']
  return <button type={type} className={classes.join(' ').trim()} {...props} />
}
