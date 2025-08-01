'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Eye, EyeOff, User, Mail, Lock, Check, X } from 'lucide-react'
import { toast } from 'sonner'

interface RegisterFormProps {
  className?: string
}

interface FormData {
  name: string
  email: string
  password: string
  confirmPassword: string
}

interface FormErrors {
  name?: string
  email?: string
  password?: string
  confirmPassword?: string
  general?: string
}

export function RegisterForm({ className }: RegisterFormProps) {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})

  const router = useRouter()

  const passwordRequirements = [
    { regex: /.{8,}/, text: 'Minimal 8 karakter' },
    { regex: /[A-Z]/, text: 'Satu huruf besar' },
    { regex: /[a-z]/, text: 'Satu huruf kecil' },
    { regex: /\d/, text: 'Satu angka' }
  ]

  const isPasswordValid = passwordRequirements.every(req =>
    req.regex.test(formData.password)
  )

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))

    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }))
    }
  }

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Nama lengkap wajib diisi'
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Nama harus terdiri dari minimal 2 karakter'
    }

    if (!formData.email) {
      newErrors.email = 'Email wajib diisi'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Silakan masukkan alamat email yang valid'
    }

    if (!formData.password) {
      newErrors.password = 'Kata sandi wajib diisi'
    } else if (!isPasswordValid) {
      newErrors.password = 'Kata sandi tidak memenuhi persyaratan'
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Harap konfirmasi kata sandi Anda'
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Kata sandi tidak cocok'
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
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.toLowerCase(),
          password: formData.password
        })
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Akun berhasil dibuat! Silakan masuk.')
        router.push('/auth/login')
      } else {
        if (response.status === 400 && data.error.includes('sudah ada')) {
          setErrors({ email: 'Akun dengan email ini sudah ada' })
        } else {
          setErrors({ general: data.error || 'Pendaftaran gagal' })
        }
        toast.error(data.error || 'Pendaftaran gagal')
      }
    } catch (error) {
      console.error('Kesalahan pendaftaran:', error)
      setErrors({ general: 'Terjadi kesalahan. Silakan coba lagi.' })
      toast.error('Terjadi kesalahan. Silakan coba lagi.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className={className}>
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl">Buat Akun</CardTitle>
        <CardDescription>
          Masukkan informasi Anda untuk membuat akun Anda
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
            <Label htmlFor="name">Nama Lengkap</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="Masukkan nama lengkap Anda"
                className={`pl-10 ${errors.name ? 'border-red-500' : ''}`}
                disabled={isLoading}
              />
            </div>
            {errors.name && (
              <p className="text-sm text-red-600">{errors.name}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Alamat Email</Label>
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
                autoComplete="new-password"
                value={formData.password}
                onChange={(e) => handleChange('password', e.target.value)}
                placeholder="Buat kata sandi"
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

            {formData.password && (
              <div className="mt-2 space-y-1">
                {passwordRequirements.map((req, index) => {
                  const isMet = req.regex.test(formData.password)
                  return (
                    <div
                      key={index}
                      className={`flex items-center text-xs ${isMet ? 'text-green-600' : 'text-gray-500'
                        }`}
                    >
                      {isMet ? (
                        <Check className="h-3 w-3 mr-1" />
                      ) : (
                        <X className="h-3 w-3 mr-1" />
                      )}
                      {req.text}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Konfirmasi Kata Sandi</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                autoComplete="new-password"
                value={formData.confirmPassword}
                onChange={(e) => handleChange('confirmPassword', e.target.value)}
                placeholder="Konfirmasi kata sandi Anda"
                className={`pl-10 pr-10 ${errors.confirmPassword ? 'border-red-500' : ''}`}
                disabled={isLoading}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                disabled={isLoading}
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4 text-gray-400" />
                ) : (
                  <Eye className="h-4 w-4 text-gray-400" />
                )}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-sm text-red-600">{errors.confirmPassword}</p>
            )}

            {formData.confirmPassword && (
              <div className={`flex items-center text-xs ${formData.password === formData.confirmPassword
                  ? 'text-green-600'
                  : 'text-red-600'
                }`}>
                {formData.password === formData.confirmPassword ? (
                  <>
                    <Check className="h-3 w-3 mr-1" />
                    Kata sandi cocok
                  </>
                ) : (
                  <>
                    <X className="h-3 w-3 mr-1" />
                    Kata sandi tidak cocok
                  </>
                )}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-start space-x-2">
              <input
                id="terms"
                name="terms"
                type="checkbox"
                required
                className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded mt-0.5"
                disabled={isLoading}
              />
              <Label htmlFor="terms" className="text-sm leading-5">
                Saya setuju dengan{' '}
                <Link href="/terms" className="text-primary hover:underline">
                  Ketentuan Layanan
                </Link>{' '}
                dan{' '}
                <Link href="/privacy" className="text-primary hover:underline">
                  Kebijakan Privasi
                </Link>
              </Label>
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col space-y-4">
          <Button
            type="submit"
            className="w-full"
            disabled={isLoading || !isPasswordValid || formData.password !== formData.confirmPassword}
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Membuat akun...
              </>
            ) : (
              'Buat Akun'
            )}
          </Button>

          <p className="text-center text-sm text-gray-600">
            Sudah punya akun?{' '}
            <Link href="/auth/login" className="font-medium text-primary hover:underline">
              Masuk
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  )
}
