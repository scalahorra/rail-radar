import type { ButtonHTMLAttributes } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../../lib/utils'

const buttonStyles = cva(
  'inline-flex shrink-0 items-center justify-center gap-2 font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-[#14201f] text-[#f3f5ef] hover:bg-[#263635] focus-visible:outline-[#52d6bd]',
        dark: 'bg-[#263635] text-white hover:bg-[#344543] focus-visible:outline-[#52d6bd]',
        ghost: 'text-[#43504e] hover:bg-black/5 focus-visible:outline-[#087e70]',
      },
      size: {
        default: 'h-10 rounded-md px-4 text-sm',
        sm: 'h-8 rounded px-3 text-xs',
        icon: 'size-9 rounded-md',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof buttonStyles>

export function Button({ className, size, variant, ...props }: ButtonProps) {
  return <button className={cn(buttonStyles({ className, size, variant }))} {...props} />
}
