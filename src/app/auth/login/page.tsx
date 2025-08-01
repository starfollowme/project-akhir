'use client'

import { useState } from 'react'
import { signIn, getSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Eye, EyeOff, Package } from 'lucide-react'
import { toast } from 'sonner'

export default function LoginPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') || '/'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const result = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        redirect: false
      })

      if (result?.error) {
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
            Masuk ke akun Anda
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Atau{' '}
            <Link href="/auth/register" className="font-medium text-primary hover:underline">
              buat akun baru
            </Link>
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Selamat datang kembali</CardTitle>
            <CardDescription>
              Masukkan kredensial Anda untuk mengakses akun
            </CardDescription>
          </CardHeader>
          
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Alamat email</Label>
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
                    autoComplete="current-password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Masukkan kata sandi Anda"
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
              </div>

              <div className="bg-blue-50 p-3 rounded-md text-sm">
                <p className="font-medium text-blue-900 mb-1">Akun Demo:</p>
                <p className="text-blue-700">Admin: admin@example.com / admin123</p>
                <p className="text-blue-700">Pelanggan: user@example.com / user123</p>
              </div>
            </CardContent>

            <CardFooter>
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading}
              >
                {isLoading ? 'Masuk...' : 'Masuk'}
              </Button>
            </CardFooter>
          </form>
        </Card>

        <div className="text-center text-sm">
          <Link href="/auth/forgot-password" className="text-primary hover:underline">
            Lupa kata sandi Anda?
          </Link>
        </div>
      </div>
    </div>
  )
}
