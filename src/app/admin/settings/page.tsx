'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Save, 
  Settings, 
  Store, 
  Mail, 
  Globe,
  Shield,
  Bell,
  Database,
  Trash2
} from 'lucide-react'
import { toast } from 'sonner'

interface StoreSettings {
  storeName: string
  storeDescription: string
  storeEmail: string
  storePhone: string
  storeAddress: string
  currency: string
  taxRate: number
  shippingFee: number
  freeShippingThreshold: number
}

export default function AdminSettingsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('store')
  
  const [storeSettings, setStoreSettings] = useState<StoreSettings>({
    storeName: 'Ravello',
    storeDescription: 'Tujuan belanja online terpercaya Anda',
    storeEmail: 'admin@example.com',
    storePhone: '+62 812 3456 7890',
    storeAddress: 'Jl. Niaga No. 123, Kota Bisnis, 12345',
    currency: 'USD',
    taxRate: 11,
    shippingFee: 5,
    freeShippingThreshold: 100
  })

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login')
    } else if (status === 'authenticated' && session?.user?.role !== 'ADMIN') {
      router.push('/')
    }
  }, [status, session, router])

  const handleStoreSettingChange = (field: keyof StoreSettings, value: string | number) => {
    setStoreSettings(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const saveStoreSettings = async () => {
    setLoading(true)
    try {
      // Simulasi panggilan API
      await new Promise(resolve => setTimeout(resolve, 1000))
      toast.success('Pengaturan toko berhasil disimpan!')
    } catch (error) {
      toast.error('Gagal menyimpan pengaturan toko')
    } finally {
      setLoading(false)
    }
  }

  const exportData = async () => {
    try {
      toast.info('Mempersiapkan ekspor data...')
      // Simulasi proses ekspor
      await new Promise(resolve => setTimeout(resolve, 2000))
      toast.success('Ekspor data selesai! Periksa unduhan Anda.')
    } catch (error) {
      toast.error('Gagal mengekspor data')
    }
  }

  const clearCache = async () => {
    try {
      toast.info('Membersihkan cache...')
      await new Promise(resolve => setTimeout(resolve, 1000))
      toast.success('Cache berhasil dibersihkan!')
    } catch (error) {
      toast.error('Gagal membersihkan cache')
    }
  }

  if (status === 'loading') {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (!session || session.user.role !== 'ADMIN') {
    return null
  }

  const tabs = [
    { id: 'store', label: 'Pengaturan Toko', icon: Store },
    { id: 'notifications', label: 'Notifikasi', icon: Bell },
    { id: 'security', label: 'Keamanan', icon: Shield },
    { id: 'system', label: 'Sistem', icon: Database }
  ]

  return (
    <div className="p-6">
      <div className="flex items-center gap-4 mb-6">
        <Settings className="w-6 h-6" />
        <div>
          <h1 className="text-2xl font-bold">Pengaturan</h1>
          <p className="text-gray-600">Kelola konfigurasi toko Anda</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <Card>
            <CardContent className="p-4">
              <nav className="space-y-2">
                {tabs.map((tab) => {
                  const Icon = tab.icon
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2 text-left rounded-lg transition-colors ${
                        activeTab === tab.id
                          ? 'bg-primary text-white'
                          : 'hover:bg-gray-100'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {tab.label}
                    </button>
                  )
                })}
              </nav>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-3">
          {activeTab === 'store' && (
            <Card>
              <CardHeader>
                <CardTitle>Informasi Toko</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="storeName">Nama Toko</Label>
                    <Input
                      id="storeName"
                      value={storeSettings.storeName}
                      onChange={(e) => handleStoreSettingChange('storeName', e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="storeEmail">Email Toko</Label>
                    <Input
                      id="storeEmail"
                      type="email"
                      value={storeSettings.storeEmail}
                      onChange={(e) => handleStoreSettingChange('storeEmail', e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="storeDescription">Deskripsi Toko</Label>
                  <Input
                    id="storeDescription"
                    value={storeSettings.storeDescription}
                    onChange={(e) => handleStoreSettingChange('storeDescription', e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="storePhone">Nomor Telepon</Label>
                    <Input
                      id="storePhone"
                      value={storeSettings.storePhone}
                      onChange={(e) => handleStoreSettingChange('storePhone', e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="currency">Mata Uang</Label>
                    <Select 
                      value={storeSettings.currency} 
                      onValueChange={(value) => handleStoreSettingChange('currency', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">USD ($)</SelectItem>
                        <SelectItem value="EUR">EUR (€)</SelectItem>
                        <SelectItem value="GBP">GBP (£)</SelectItem>
                        <SelectItem value="IDR">IDR (Rp)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="storeAddress">Alamat Toko</Label>
                  <Input
                    id="storeAddress"
                    value={storeSettings.storeAddress}
                    onChange={(e) => handleStoreSettingChange('storeAddress', e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="taxRate">Tarif Pajak (%)</Label>
                    <Input
                      id="taxRate"
                      type="number"
                      step="0.1"
                      value={storeSettings.taxRate}
                      onChange={(e) => handleStoreSettingChange('taxRate', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="shippingFee">Biaya Pengiriman ($)</Label>
                    <Input
                      id="shippingFee"
                      type="number"
                      step="0.01"
                      value={storeSettings.shippingFee}
                      onChange={(e) => handleStoreSettingChange('shippingFee', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="freeShippingThreshold">Ambang Batas Gratis Ongkir ($)</Label>
                    <Input
                      id="freeShippingThreshold"
                      type="number"
                      step="0.01"
                      value={storeSettings.freeShippingThreshold}
                      onChange={(e) => handleStoreSettingChange('freeShippingThreshold', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                </div>

                <Button onClick={saveStoreSettings} disabled={loading}>
                  <Save className="w-4 h-4 mr-2" />
                  {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
                </Button>
              </CardContent>
            </Card>
          )}

          {activeTab === 'notifications' && (
            <Card>
              <CardHeader>
                <CardTitle>Pengaturan Notifikasi</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Notifikasi Email</h4>
                      <p className="text-sm text-gray-600">Terima notifikasi email untuk acara penting</p>
                    </div>
                    <input type="checkbox" defaultChecked className="h-4 w-4" />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Peringatan Pesanan Baru</h4>
                      <p className="text-sm text-gray-600">Dapatkan notifikasi saat pesanan baru masuk</p>
                    </div>
                    <input type="checkbox" defaultChecked className="h-4 w-4" />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Peringatan Stok Rendah</h4>
                      <p className="text-sm text-gray-600">Dapatkan notifikasi saat stok produk menipis</p>
                    </div>
                    <input type="checkbox" defaultChecked className="h-4 w-4" />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Pembaruan Sistem</h4>
                      <p className="text-sm text-gray-600">Terima notifikasi tentang pembaruan sistem</p>
                    </div>
                    <input type="checkbox" className="h-4 w-4" />
                  </div>
                </div>

                <Button>
                  <Save className="w-4 h-4 mr-2" />
                  Simpan Pengaturan Notifikasi
                </Button>
              </CardContent>
            </Card>
          )}

          {activeTab === 'security' && (
            <Card>
              <CardHeader>
                <CardTitle>Pengaturan Keamanan</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Persyaratan Kata Sandi</h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Panjang kata sandi minimum</span>
                        <Select defaultValue="8">
                          <SelectTrigger className="w-20">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="6">6</SelectItem>
                            <SelectItem value="8">8</SelectItem>
                            <SelectItem value="10">10</SelectItem>
                            <SelectItem value="12">12</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Wajibkan huruf besar</span>
                        <input type="checkbox" defaultChecked className="h-4 w-4" />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Wajibkan angka</span>
                        <input type="checkbox" defaultChecked className="h-4 w-4" />
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Manajemen Sesi</h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Batas waktu sesi (jam)</span>
                        <Select defaultValue="24">
                          <SelectTrigger className="w-20">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">1</SelectItem>
                            <SelectItem value="8">8</SelectItem>
                            <SelectItem value="24">24</SelectItem>
                            <SelectItem value="168">168</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </div>

                <Button>
                  <Shield className="w-4 h-4 mr-2" />
                  Simpan Pengaturan Keamanan
                </Button>
              </CardContent>
            </Card>
          )}

          {activeTab === 'system' && (
            <Card>
              <CardHeader>
                <CardTitle>Manajemen Sistem</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Manajemen Database</h4>
                    <div className="space-y-3">
                      <Button variant="outline" onClick={exportData}>
                        <Database className="w-4 h-4 mr-2" />
                        Ekspor Database
                      </Button>
                      <p className="text-sm text-gray-600">
                        Ekspor semua data toko Anda termasuk produk, pesanan, dan pelanggan.
                      </p>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Manajemen Cache</h4>
                    <div className="space-y-3">
                      <Button variant="outline" onClick={clearCache}>
                        <Trash2 className="w-4 h-4 mr-2" />
                        Bersihkan Cache
                      </Button>
                      <p className="text-sm text-gray-600">
                        Bersihkan cache aplikasi untuk meningkatkan kinerja dan mengosongkan penyimpanan.
                      </p>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Informasi Sistem</h4>
                    <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Versi Aplikasi:</span>
                        <span className="text-sm font-medium">v1.0.0</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Versi Database:</span>
                        <span className="text-sm font-medium">PostgreSQL 15.0</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Cadangan Terakhir:</span>
                        <span className="text-sm font-medium">15 Jan 2024 10:30</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
