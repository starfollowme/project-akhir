'use client'

import { useState } from 'react'
import { signIn, getSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Eye, EyeOff, Mail, Lock } from 'lucide-react'
import { toast } from 'sonner'

interface LoginFormProps {
  callbackUrl?: string
  className?: string
}

export function LoginForm({ callbackUrl = '/', className }: LoginFormProps) {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<{
    email?: string
    password?: string
    general?: string
  }>({})

  const router = useRouter()

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    
    if (errors[field as keyof typeof errors]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }))
    }
  }

  const validateForm = (): boolean => {
    const newErrors: typeof errors = {}

    if (!formData.email) {
      newErrors.email = 'Email wajib diisi'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Harap masukkan alamat email yang valid'
    }

    if (!formData.password) {
      newErrors.password = 'Kata sandi wajib diisi'
    } else if (formData.password.length < 6) {
      newErrors.password = 'Kata sandi minimal 6 karakter'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setIsLoading(true)
    setErrors({})

    try {
      const result = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        redirect: false
      })

      if (result?.error) {
        setErrors({ general: 'Email atau kata sandi tidak valid' })
        toast.error('Email atau kata sandi tidak valid')
      } else if (result?.ok) {
        toast.success('Login berhasil!')
        
        const session = await getSession()
        
        if (session?.user?.role === 'ADMIN') {
          router.push('/admin/dashboard')
        } else {
          router.push(callbackUrl)
        }
      }
    } catch (error) {
      console.error('Kesalahan login:', error)
      setErrors({ general: 'Terjadi kesalahan. Silakan coba lagi.' })
      toast.error('Terjadi kesalahan. Silakan coba lagi.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDemoLogin = async (role: 'admin' | 'customer') => {
    const credentials = {
      admin: { email: 'admin@example.com', password: 'admin123' },
      customer: { email: 'user@example.com', password: 'user123' }
    }

    setFormData(credentials[role])
    
    setTimeout(() => {
      handleSubmit(new Event('submit') as any)
    }, 100)
  }

  return (
    <Card className={className}>
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl">Masuk</CardTitle>
        <CardDescription>
          Masukkan email dan kata sandi Anda untuk mengakses akun
        </CardDescription>
      </CardHeader>
      
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {errors.general && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
              {errors.general}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Alamat email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder="Masukkan email Anda"
                className={`pl-10 ${errors.email ? 'border-red-500' : ''}`}
                disabled={isLoading}
              />
            </div>
            {errors.email && (
              <p className="text-sm text-red-600">{errors.email}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Kata Sandi</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={formData.password}
                onChange={(e) => handleChange('password', e.target.value)}
                placeholder="Masukkan kata sandi Anda"
                className={`pl-10 pr-10 ${errors.password ? 'border-red-500' : ''}`}
                disabled={isLoading}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isLoading}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4 text-gray-400" />
                ) : (
                  <Eye className="h-4 w-4 text-gray-400" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="text-sm text-red-600">{errors.password}</p>
            )}
          </div>

          <div className="bg-blue-50 border border-blue-200 p-3 rounded-md">
            <p className="font-medium text-blue-900 text-sm mb-2">Akun Demo:</p>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleDemoLogin('admin')}
                disabled={isLoading}
                className="text-xs"
              >
                Login Admin
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleDemoLogin('customer')}
                disabled={isLoading}
                className="text-xs"
              >
                Login Pelanggan
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <input
                id="remember"
                name="remember"
                type="checkbox"
                className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
              />
              <Label htmlFor="remember" className="text-sm">
                Ingat saya
              </Label>
            </div>
            <Link 
              href="/auth/forgot-password" 
              className="text-sm text-primary hover:underline"
            >
              Lupa kata sandi?
            </Link>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col space-y-4">
          <Button 
            type="submit" 
            className="w-full" 
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Masuk...
              </>
            ) : (
              'Masuk'
            )}
          </Button>
          
          <p className="text-center text-sm text-gray-600">
            Belum punya akun?{' '}
            <Link href="/auth/register" className="font-medium text-primary hover:underline">
              Daftar
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  )
}
