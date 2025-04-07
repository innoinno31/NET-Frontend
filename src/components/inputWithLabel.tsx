import { useId } from 'react'

type InputWithLabelProps = {
  label: string
  name: string
  type?: 'text' | 'email' | 'password' | 'tel' | 'number' | 'date'
  placeholder?: string
  required?: boolean
  className?: string
  defaultValue?: string
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
  error?: string
  touched?: boolean
}

const InputWithLabel = ({
  label,
  name,
  type = 'text',
  placeholder = '',
  required = false,
  className = '',
  defaultValue = '',
  onChange,
  error,
  touched = false
}: InputWithLabelProps) => {
  // Génère un ID unique pour cet input spécifique
  const id = useId() + '-' + name
  
  // Détermine si on doit afficher une erreur
  const showError = error && (touched || type === 'email')
  
  return (
    <div className={className}>
      <label htmlFor={id} className="block text-sm/6 font-medium text-gray-900">
        {label}{required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <div className="mt-2">
        <input
          id={id}
          name={name}
          type={type}
          placeholder={placeholder}
          required={required}
          defaultValue={defaultValue}
          onChange={onChange}
          aria-invalid={!!showError}
          aria-describedby={showError ? `${id}-error` : undefined}
          className={`block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline outline-1 -outline-offset-1 ${
            showError 
              ? 'outline-red-500 focus:outline-red-500' 
              : 'outline-gray-300 focus:outline-indigo-600'
          } placeholder:text-gray-400 focus:outline focus:outline-2 focus:-outline-offset-2 sm:text-sm/6`}
        />
        {showError && (
          <p id={`${id}-error`} className="mt-2 text-sm text-red-600" role="alert">
            {error}
          </p>
        )}
      </div>
    </div>
  )
}

export default InputWithLabel
  