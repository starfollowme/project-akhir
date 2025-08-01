'use client'

import { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  User, 
  Mail, 
  Calendar,
  Shield,
  Save,
  Eye,
  EyeOff,
  Lock,
  LogOut,
  Edit
} from 'lucide-react'
import { toast } from 'sonner'

interface UserProfile {
  id: string
  name: string | null
  email: string
  role: 'ADMIN' | 'CUSTOMER'
  createdAt: string
  _count?: {
    orders: number
  }
}

interface PasswordChangeData {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

export default function ProfilePage() {
  const { data: session, status, update } = useSession()
  const router = useRouter()
  
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [activeTab, setActiveTab] = useState('profile')
  
  const [profileData, setProfileData] = useState({
    name: '',
    email: ''
  })
  
  const [passwordData, setPasswordData] = useState<PasswordChangeData>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  })

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login?callbackUrl=/profile')
    }
  }, [status, router])

  useEffect(() => {
    if (session) {
      fetchProfile()
    }
  }, [session])

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/profile')
      const data = await response.json()

      if (data.success) {
        setProfile(data.data)
        setProfileData({
          name: data.data.name || '',
          email: data.data.email
        })
      }
    } catch (error) {
      console.error('Gagal mengambil data profil:', error)
      toast.error('Gagal memuat profil')
    } finally {
      setLoading(false)
    }
  }

  const handleProfileChange = (field: string, value: string) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handlePasswordChange = (field: keyof PasswordChangeData, value: string) => {
    setPasswordData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const saveProfile = async () => {
    if (!profileData.name.trim()) {
      toast.error('Nama wajib diisi')
      return
    }

    setSaving(true)
    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(profileData)
      })

      const data = await response.json()

      if (data.success) {
        setProfile(data.data)
        setIsEditing(false)
        await update({
          ...session,
          user: {
            ...session?.user,
            name: data.data.name
          }
        })
        toast.success('Profil berhasil diperbarui!')
      } else {
        toast.error(data.error || 'Gagal memperbarui profil')
      }
    } catch (error) {
      console.error('Gagal memperbarui profil:', error)
      toast.error('Gagal memperbarui profil')
    } finally {
      setSaving(false)
    }
  }

  const changePassword = async () => {
    if (!passwordData.currentPassword) {
      toast.error('Kata sandi saat ini wajib diisi')
      return
    }
    
    if (passwordData.newPassword.length < 8) {
      toast.error('Kata sandi baru minimal harus 8 karakter')
      return
    }
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Kata sandi baru tidak cocok')
      return
    }

    setSaving(true)
    try {
      const response = await fetch('/api/profile/password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(passwordData)
      })

      const data = await response.json()

      if (data.success) {
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        })
        toast.success('Kata sandi berhasil diubah!')
      } else {
        toast.error(data.error || 'Gagal mengubah kata sandi')
      }
    } catch (error) {
      console.error('Gagal mengubah kata sandi:', error)
      toast.error('Gagal mengubah kata sandi')
    } finally {
      setSaving(false)
    }
  }

  const handleSignOut = () => {
    signOut({ callbackUrl: '/' })
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  if (status === 'loading' || loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
            <div className="h-96 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!session || !profile) {
    return null
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Profil Saya</h1>
            <p className="text-gray-600">Kelola pengaturan akun Anda</p>
          </div>
          <Button variant="outline" onClick={handleSignOut}>
            <LogOut className="w-4 h-4 mr-2" />
            Keluar
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-1">
            <Card>
              <CardContent className="p-4">
                <div className="text-center mb-6">
                  <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                    <User className="w-10 h-10 text-gray-400" />
                  </div>
                  <h3 className="font-semibold">{profile.name || 'Tanpa Nama'}</h3>
                  <p className="text-sm text-gray-600">{profile.email}</p>
                  <Badge 
                    variant={profile.role === 'ADMIN' ? 'default' : 'secondary'}
                    className="mt-2"
                  >
                    <Shield className="w-3 h-3 mr-1" />
                    {profile.role}
                  </Badge>
                </div>

                <nav className="space-y-2">
                  <button
                    onClick={() => setActiveTab('profile')}
                    className={`w-full flex items-center gap-3 px-3 py-2 text-left rounded-lg transition-colors ${
                      activeTab === 'profile'
                        ? 'bg-primary text-white'
                        : 'hover:bg-gray-100'
                    }`}
                  >
                    <User className="w-4 h-4" />
                    Info Profil
                  </button>
                  
                  <button
                    onClick={() => setActiveTab('password')}
                    className={`w-full flex items-center gap-3 px-3 py-2 text-left rounded-lg transition-colors ${
                      activeTab === 'password'
                        ? 'bg-primary text-white'
                        : 'hover:bg-gray-100'
                    }`}
                  >
                    <Lock className="w-4 h-4" />
                    Ubah Kata Sandi
                  </button>
                </nav>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-3">
            {activeTab === 'profile' && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Informasi Profil</CardTitle>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setIsEditing(!isEditing)}
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      {isEditing ? 'Batal' : 'Ubah'}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nama Lengkap</Label>
                      <Input
                        id="name"
                        value={profileData.name}
                        onChange={(e) => handleProfileChange('name', e.target.value)}
                        disabled={!isEditing}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="email">Alamat Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={profileData.email}
                        disabled
                        className="bg-gray-50"
                      />
                      <p className="text-xs text-gray-500">
                        Email tidak dapat diubah
                      </p>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium mb-3">Informasi Akun</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600">Bergabung:</span>
                        <span>{formatDate(profile.createdAt)}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600">Peran:</span>
                        <Badge variant={profile.role === 'ADMIN' ? 'default' : 'secondary'}>
                          {profile.role}
                        </Badge>
                      </div>
                      
                      {profile._count && (
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-600">Total Pesanan:</span>
                          <span>{profile._count.orders}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {isEditing && (
                    <div className="flex gap-4">
                      <Button onClick={saveProfile} disabled={saving}>
                        <Save className="w-4 h-4 mr-2" />
                        {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          setIsEditing(false)
                          setProfileData({
                            name: profile.name || '',
                            email: profile.email
                          })
                        }}
                      >
                        Batal
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {activeTab === 'password' && (
              <Card>
                <CardHeader>
                  <CardTitle>Ubah Kata Sandi</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="currentPassword">Kata Sandi Saat Ini</Label>
                      <div className="relative">
                        <Input
                          id="currentPassword"
                          type={showPasswords.current ? 'text' : 'password'}
                          value={passwordData.currentPassword}
                          onChange={(e) => handlePasswordChange('currentPassword', e.target.value)}
                          placeholder="Masukkan kata sandi Anda saat ini"
                        />
                        <button
                          type="button"
                          className="absolute inset-y-0 right-0 pr-3 flex items-center"
                          onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                        >
                          {showPasswords.current ? (
                            <EyeOff className="h-4 w-4 text-gray-400" />
                          ) : (
                            <Eye className="h-4 w-4 text-gray-400" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="newPassword">Kata Sandi Baru</Label>
                      <div className="relative">
                        <Input
                          id="newPassword"
                          type={showPasswords.new ? 'text' : 'password'}
                          value={passwordData.newPassword}
                          onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                          placeholder="Masukkan kata sandi baru Anda"
                        />
                        <button
                          type="button"
                          className="absolute inset-y-0 right-0 pr-3 flex items-center"
                          onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                        >
                          {showPasswords.new ? (
                            <EyeOff className="h-4 w-4 text-gray-400" />
                          ) : (
                            <Eye className="h-4 w-4 text-gray-400" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Konfirmasi Kata Sandi Baru</Label>
                      <div className="relative">
                        <Input
                          id="confirmPassword"
                          type={showPasswords.confirm ? 'text' : 'password'}
                          value={passwordData.confirmPassword}
                          onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                          placeholder="Konfirmasi kata sandi baru Anda"
                        />
                        <button
                          type="button"
                          className="absolute inset-y-0 right-0 pr-3 flex items-center"
                          onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                        >
                          {showPasswords.confirm ? (
                            <EyeOff className="h-4 w-4 text-gray-400" />
                          ) : (
                            <Eye className="h-4 w-4 text-gray-400" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-2">Persyaratan Kata Sandi:</h4>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• Minimal 8 karakter</li>
                      <li>• Terdiri dari minimal satu huruf besar</li>
                      <li>• Terdiri dari minimal satu huruf kecil</li>
                      <li>• Terdiri dari minimal satu angka</li>
                    </ul>
                  </div>

                  <Button onClick={changePassword} disabled={saving}>
                    <Lock className="w-4 h-4 mr-2" />
                    {saving ? 'Mengubah...' : 'Ubah Kata Sandi'}
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}