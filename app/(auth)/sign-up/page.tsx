'use client'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import InputField from '@/components/forms/InputField'
import SelectField from '@/components/forms/SelectField'
import CountryList from '@/components/forms/CountryList'
import {
  INVESTMENT_GOALS,
  PREFERRED_INDUSTRIES,
  RISK_TOLERANCE_OPTIONS
} from '@/lib/contants'
import FooterLinks from '@/components/forms/FooterLinks'
const SignUp = () => {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting }
  } = useForm<SignUpFormData>({
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      country: 'US',
      investmentGoals: 'Growth',
      riskTolerance: 'Medium',
      preferredIndustry: 'Technology'
    },
    mode: 'onBlur'
  })
  const onSubmit = async (data: SignUpFormData) => {
    try {
      // TODO: wire to API/auth action; show toast/redirect on success
    } catch (error) {
      // TODO: show user-friendly error
    }
  }
  return (
    <>
      <h1 className='form-title'>Sign Up & Personalize</h1>

      <form onSubmit={handleSubmit(onSubmit)} className='space-y-5'>
        <InputField
          name='fullName'
          label='Full Name'
          placeholder='John Doe'
          register={register}
          error={errors.fullName}
          validation={{ required: 'Full Name is required', minLength: { value: 2, message: 'Must be at least 2 characters' } }}
        />
        <InputField
          name='email'
          label='Email'
          placeholder='john.doe@example.com'
          register={register}
          error={errors.email}
          validation={{
            required: 'Email is required',
            pattern: { value: /^\S+@\S+$/, message: 'Invalid email address' }
          }}
        />

        <InputField
          name='password'
          label='Password'
          placeholder='Enter a strong password'
          register={register}
          type='password'
          error={errors.password}
          validation={{ required: 'Password is required', minLength: 8 }}
        />

        <CountryList
          name='country'
          label='Country'
          control={control}
          error={errors.country}
          required
          placeholder='Select your country'
        />

        <SelectField
          name='investmentGoals'
          label='Investment Goals'
          placeholder='Select your investment goal'
          options={INVESTMENT_GOALS}
          control={control}
          error={errors.investmentGoals}
          required
        />

        <SelectField
          name='riskTolerance'
          label='Risk Tolerance'
          placeholder='Select your risk tolerance'
          options={RISK_TOLERANCE_OPTIONS}
          control={control}
          error={errors.riskTolerance}
          required
        />

        <SelectField
          name='preferredIndustry'
          label='Preferred Industry'
          placeholder='Select your preferred industry'
          options={PREFERRED_INDUSTRIES}
          control={control}
          error={errors.preferredIndustry}
          required
        />
        <Button
          type='submit'
          disabled={isSubmitting}
          className='yellow-btn w-full mt-5'
        >
          {isSubmitting
            ? 'Creating Account...'
            : 'Start Your Investing Journey'}
        </Button>
        <FooterLinks
          text='Already have an account?'
          linkText='Log In'
          href='/sign-in'
        />
      </form>
    </>
  )
}

export default SignUp
