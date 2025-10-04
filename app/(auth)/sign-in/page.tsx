'use client'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import InputField from '@/components/forms/InputField'
import FooterLinks from '@/components/forms/FooterLinks'
import { signInWithEmail } from '@/lib/actions/auth.actions'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

const SignIn = () => {
  const router = useRouter()
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting }
  } = useForm<SignInFormData>({
    defaultValues: {
      email: '',
      password: ''
    },
    mode: 'onBlur'
  })
  const onSubmit = async (data: SignInFormData) => {
    try {
      const result = await signInWithEmail(data)

      if (result?.success) {
        router.push('/')
        toast.success('Logged in successfully! Welcome back. 🎉')
      }
    } catch (error) {
      console.error(error)
      toast.error('Sign in failed', {
        description:
          error instanceof Error ? error.message : 'Failed to Sign in'
      })
    }
  }
  return (
    <>
      <h1 className='form-title'>Log In Your Account</h1>

      <form onSubmit={handleSubmit(onSubmit)} className='space-y-5'>
        {/* <InputField
          name='fullName'
          label='Full Name'
          placeholder='John Doe'
          register={register}
          error={errors.fullName}
          validation={{ required: 'Full Name is required', minLength: 2 }}
        /> */}
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

        {/* <CountryList
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
        /> */}
        <Button
          type='submit'
          disabled={isSubmitting}
          className='yellow-btn w-full mt-5'
        >
          {isSubmitting ? 'Signing In...' : 'Sign In'}
        </Button>
        <FooterLinks
          text={`Don't have an account?`}
          linkText='Create an account'
          href='/sign-up'
        />
      </form>
    </>
  )
}

export default SignIn
