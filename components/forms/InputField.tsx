import React from 'react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

const InputField = ({
  name,
  label,
  placeholder,
  type = 'text',
  register,
  error,
  validation,
  disabled
}: FormInputProps) => {
  return (
    <div className='space-y-2'>
      <Label htmlFor={name} className='form-label'>
        {label}
      </Label>
      <Input
        id={name}
        type={type}
        placeholder={placeholder}
        {...register(name, validation)}
        disabled={disabled}
        autoComplete={type === 'password' ? 'new-password' : 'off'}
        className={cn('form-input w-full', {
          'opacity-50 cursor-not-allowed': disabled
        })}
      />
      {error && <p className='text-sm text-red-500'>{error.message}</p>}
    </div>
  )
}

export default InputField
