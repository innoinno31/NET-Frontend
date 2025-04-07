import React from 'react'

type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'
type ButtonType = 'button' | 'submit' | 'reset'

type PrimaryButtonProps = {
  children: React.ReactNode
  size?: ButtonSize
  type?: ButtonType
  disabled?: boolean
  className?: string
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void
  form?: string
  fullWidth?: boolean
  icon?: React.ReactNode
}

function PrimaryButton({
  children,
  size = 'md',
  type = 'button',
  disabled = false,
  className = '',
  onClick,
  form,
  fullWidth = false,
  icon
}: PrimaryButtonProps) {
  
  // Définir les classes de taille
  const sizeClasses = {
    xs: "rounded px-2 py-1 text-xs",
    sm: "rounded px-2 py-1 text-sm", 
    md: "rounded-md px-2.5 py-1.5 text-sm",
    lg: "rounded-md px-3 py-2 text-sm",
    xl: "rounded-md px-3.5 py-2.5 text-sm"
  }

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      form={form}
      className={`
        ${sizeClasses[size]} 
        font-semibold text-white shadow-sm 
        ${disabled 
          ? 'bg-indigo-300 cursor-not-allowed' 
          : 'bg-indigo-600 hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600'
        }
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
    >
      <span className="flex items-center justify-center gap-x-2">
        {icon && <span className="flex-shrink-0">{icon}</span>}
        {children}
      </span>
    </button>
  )
}

export default PrimaryButton
  