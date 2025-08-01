'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Eye, EyeOff, Package, Check, X } from 'lucide-react'
import { toast } from 'sonner'

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  
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

  const isFormValid = 
    formData.name.trim() &&
    formData.email &&
    isPasswordValid &&
    formData.password === formData.confirmPassword

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!isFormValid) {
      toast.error('Harap isi semua bidang dengan benar')
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password
        })
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Akun berhasil dibuat! Silakan masuk.')
        router.push('/auth/login')
      } else {
        toast.error(data.error || 'Pendaftaran gagal')
      }
    } catch (error) {
      console.error('Kesalahan pendaftaran:', error)
      toast.error('Terjadi kesalahan. Silakan coba lagi.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <Link href="/" className="inline-flex items-center space-x-2 text-2xl font-bold">
            <Package className="h-8 w-8" />
            <span>Ravello</span>
          </Link>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Buat akun Anda
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Atau{' '}
            <Link href="/auth/login" className="font-medium text-primary hover:underline">
              masuk ke akun yang sudah ada
            </Link>
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Mulai</CardTitle>
            <CardDescription>
              Buat akun Anda untuk mulai berbelanja
            </CardDescription>
          </CardHeader>
          
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nama Lengkap</Label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Masukkan nama lengkap Anda"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Alamat Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Masukkan email Anda"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Kata Sandi</Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Buat kata sandi"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
                
                {formData.password && (
                  <div className="mt-2 space-y-1">
                    {passwordRequirements.map((req, index) => {
                      const isMet = req.regex.test(formData.password)
                      return (
                        <div 
                          key={index} 
                          className={`flex items-center text-xs ${
                            isMet ? 'text-green-600' : 'text-gray-500'
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
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Konfirmasi kata sandi Anda"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
                
                {formData.confirmPassword && (
                  <div className={`flex items-center text-xs ${
                    formData.password === formData.confirmPassword
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

              <div className="text-xs text-gray-600">
                Dengan membuat akun, Anda menyetujui{' '}
                <Link href="/terms" className="text-primary hover:underline">
                  Ketentuan Layanan
                </Link>{' '}
                dan{' '}
                <Link href="/privacy" className="text-primary hover:underline">
                  Kebijakan Privasi
                </Link>
                {' '}kami
              </div>
            </CardContent>

            <CardFooter>
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading || !isFormValid}
              >
                {isLoading ? 'Membuat akun...' : 'Buat Akun'}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  )
}
