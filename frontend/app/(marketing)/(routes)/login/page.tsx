import { AuthForm } from '@/components/auth-form'

const LoginPage = () => {
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-160px)] px-4">
      <AuthForm mode="login" />
    </div>
  )
}

export default LoginPage
