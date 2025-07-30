// src/app/admin/settings/page.tsx
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
    storeName: 'E-Shop',
    storeDescription: 'Your trusted online shopping destination',
    storeEmail: 'admin@example.com',
    storePhone: '+1 (555) 123-4567',
    storeAddress: '123 Commerce St, Business City, BC 12345',
    currency: 'USD',
    taxRate: 8.5,
    shippingFee: 10,
    freeShippingThreshold: 100
  })

  // Check if user is admin
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
      // Simulate API call - in real app, save to database
      await new Promise(resolve => setTimeout(resolve, 1000))
      toast.success('Store settings saved successfully!')
    } catch (error) {
      toast.error('Failed to save store settings')
    } finally {
      setLoading(false)
    }
  }

  const exportData = async () => {
    try {
      toast.info('Preparing data export...')
      // Simulate export process
      await new Promise(resolve => setTimeout(resolve, 2000))
      toast.success('Data export completed! Check your downloads.')
    } catch (error) {
      toast.error('Failed to export data')
    }
  }

  const clearCache = async () => {
    try {
      toast.info('Clearing cache...')
      await new Promise(resolve => setTimeout(resolve, 1000))
      toast.success('Cache cleared successfully!')
    } catch (error) {
      toast.error('Failed to clear cache')
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
    { id: 'store', label: 'Store Settings', icon: Store },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'system', label: 'System', icon: Database }
  ]

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Settings className="w-6 h-6" />
        <div>
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-gray-600">Manage your store configuration</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Navigation */}
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

        {/* Main Content */}
        <div className="lg:col-span-3">
          {activeTab === 'store' && (
            <Card>
              <CardHeader>
                <CardTitle>Store Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="storeName">Store Name</Label>
                    <Input
                      id="storeName"
                      value={storeSettings.storeName}
                      onChange={(e) => handleStoreSettingChange('storeName', e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="storeEmail">Store Email</Label>
                    <Input
                      id="storeEmail"
                      type="email"
                      value={storeSettings.storeEmail}
                      onChange={(e) => handleStoreSettingChange('storeEmail', e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="storeDescription">Store Description</Label>
                  <Input
                    id="storeDescription"
                    value={storeSettings.storeDescription}
                    onChange={(e) => handleStoreSettingChange('storeDescription', e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="storePhone">Phone Number</Label>
                    <Input
                      id="storePhone"
                      value={storeSettings.storePhone}
                      onChange={(e) => handleStoreSettingChange('storePhone', e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="currency">Currency</Label>
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
                  <Label htmlFor="storeAddress">Store Address</Label>
                  <Input
                    id="storeAddress"
                    value={storeSettings.storeAddress}
                    onChange={(e) => handleStoreSettingChange('storeAddress', e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="taxRate">Tax Rate (%)</Label>
                    <Input
                      id="taxRate"
                      type="number"
                      step="0.1"
                      value={storeSettings.taxRate}
                      onChange={(e) => handleStoreSettingChange('taxRate', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="shippingFee">Shipping Fee ($)</Label>
                    <Input
                      id="shippingFee"
                      type="number"
                      step="0.01"
                      value={storeSettings.shippingFee}
                      onChange={(e) => handleStoreSettingChange('shippingFee', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="freeShippingThreshold">Free Shipping Threshold ($)</Label>
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
                  {loading ? 'Saving...' : 'Save Changes'}
                </Button>
              </CardContent>
            </Card>
          )}

          {activeTab === 'notifications' && (
            <Card>
              <CardHeader>
                <CardTitle>Notification Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Email Notifications</h4>
                      <p className="text-sm text-gray-600">Receive email notifications for important events</p>
                    </div>
                    <input type="checkbox" defaultChecked className="h-4 w-4" />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">New Order Alerts</h4>
                      <p className="text-sm text-gray-600">Get notified when new orders are placed</p>
                    </div>
                    <input type="checkbox" defaultChecked className="h-4 w-4" />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Low Stock Alerts</h4>
                      <p className="text-sm text-gray-600">Get notified when products are running low</p>
                    </div>
                    <input type="checkbox" defaultChecked className="h-4 w-4" />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">System Updates</h4>
                      <p className="text-sm text-gray-600">Receive notifications about system updates</p>
                    </div>
                    <input type="checkbox" className="h-4 w-4" />
                  </div>
                </div>

                <Button>
                  <Save className="w-4 h-4 mr-2" />
                  Save Notification Settings
                </Button>
              </CardContent>
            </Card>
          )}

          {activeTab === 'security' && (
            <Card>
              <CardHeader>
                <CardTitle>Security Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Password Requirements</h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Minimum password length</span>
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
                        <span className="text-sm">Require uppercase letters</span>
                        <input type="checkbox" defaultChecked className="h-4 w-4" />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Require numbers</span>
                        <input type="checkbox" defaultChecked className="h-4 w-4" />
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Session Management</h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Session timeout (hours)</span>
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
                  Save Security Settings
                </Button>
              </CardContent>
            </Card>
          )}

          {activeTab === 'system' && (
            <Card>
              <CardHeader>
                <CardTitle>System Management</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Database Management</h4>
                    <div className="space-y-3">
                      <Button variant="outline" onClick={exportData}>
                        <Database className="w-4 h-4 mr-2" />
                        Export Database
                      </Button>
                      <p className="text-sm text-gray-600">
                        Export all your store data including products, orders, and customers.
                      </p>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Cache Management</h4>
                    <div className="space-y-3">
                      <Button variant="outline" onClick={clearCache}>
                        <Trash2 className="w-4 h-4 mr-2" />
                        Clear Cache
                      </Button>
                      <p className="text-sm text-gray-600">
                        Clear application cache to improve performance and free up storage.
                      </p>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">System Information</h4>
                    <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Application Version:</span>
                        <span className="text-sm font-medium">v1.0.0</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Database Version:</span>
                        <span className="text-sm font-medium">PostgreSQL 15.0</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Last Backup:</span>
                        <span className="text-sm font-medium">2024-01-15 10:30 AM</span>
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