'use client'
import React, { useMemo, useState } from 'react'
import { Controller } from 'react-hook-form'
import countryList from 'react-select-country-list'
import { Label } from '@/components/ui/label'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover'
import { Check, ChevronsUpDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CountryListProps {
  name: string
  label: string
  control: any
  error?: any
  required?: boolean
  placeholder?: string
}

const CountryList = ({
  name,
  label,
  control,
  error,
  required = false,
  placeholder = 'Select a country'
}: CountryListProps) => {
  const countries = useMemo(() => countryList().getData(), [])
  const [open, setOpen] = useState(false)

  const getCountryName = (countryValue: string) => {
    const country = countries.find((c) => c.value === countryValue)
    return country?.label || countryValue
  }

  return (
    <div className='space-y-2'>
      <Label htmlFor={name} className='form-label'>
        {label}
      </Label>
      <Controller
        name={name}
        control={control}
        rules={required ? { required: `${label} is required` } : {}}
        render={({ field }) => (
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant='outline'
                role='combobox'
                aria-expanded={open}
                className='w-full justify-between select-trigger'
              >
                {field.value ? (
                  <div className='flex items-center gap-3'>
                    <div className='relative w-6 h-6 rounded-full overflow-hidden flex-shrink-0'>
                      <Image
                        src={`https://flagcdn.com/w40/${field.value.toLowerCase()}.png`}
                        alt={`${getCountryName(field.value)} flag`}
                        fill
                        className='object-cover'
                      />
                    </div>
                    <span>{getCountryName(field.value)}</span>
                  </div>
                ) : (
                  <span className='text-gray-400'>{placeholder}</span>
                )}
                <ChevronsUpDown className='ml-2 h-4 w-4 shrink-0 opacity-50' />
              </Button>
            </PopoverTrigger>
            <PopoverContent className='w-full p-0 bg-gray-800 border-gray-500'>
              <Command className='bg-gray-800 text-white'>
                <CommandInput
                  placeholder='Search country...'
                  className='h-9 text-white'
                />
                <CommandList className='max-h-60 bg-gray-800 scrollbar-hide-default'>
                  <CommandEmpty>No country found.</CommandEmpty>
                  <CommandGroup>
                    {countries.map((country: { value: string; label: string }) => (
                      <CommandItem
                        key={country.value}
                        value={country.label}
                        onSelect={() => {
                          field.onChange(country.value)
                          setOpen(false)
                        }}
                        className='cursor-pointer hover:bg-gray-700'
                      >
                        <div className='flex items-center gap-3 flex-1'>
                          <div className='relative w-6 h-6 rounded-full overflow-hidden flex-shrink-0'>
                            <Image
                              src={`https://flagcdn.com/w40/${country.value.toLowerCase()}.png`}
                              alt={`${country.label} flag`}
                              fill
                              className='object-cover'
                            />
                          </div>
                          <span>{country.label}</span>
                        </div>
                        <Check
                          className={cn(
                            'ml-auto h-4 w-4',
                            field.value === country.value
                              ? 'opacity-100'
                              : 'opacity-0'
                          )}
                        />
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        )}
      />
      {error && <p className='form-error'>{error.message}</p>}
    </div>
  )
}

export default CountryList