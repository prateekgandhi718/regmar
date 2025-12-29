import { AuthForm } from '@/components/auth-form'

const SignupPage = () => {
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-160px)] px-4">
      <AuthForm mode="signup" />
    </div>
  )
}

export default SignupPage
