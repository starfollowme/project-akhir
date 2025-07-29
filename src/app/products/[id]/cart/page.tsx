'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Minus, Plus, Trash2, ShoppingBag, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { CartWithItems } from '@/types';

type CartItemWithProduct = CartWithItems['items'][number];

export default function CartPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [cart, setCart] = useState<CartWithItems | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login?callbackUrl=/cart');
    }
  }, [status, router]);

 
  useEffect(() => {
    if (session) {
      fetchCart();
    }
  }, [session]);

  const fetchCart = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/cart');
      const data = await response.json();

      if (data.success) {
        setCart(data.data);
      } else {
        toast.error('Gagal memuat keranjang');
      }
    } catch (error) {
      console.error('Error fetching cart:', error);
      toast.error('Gagal memuat keranjang');
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (productId: string, quantity: number) => {
    try {
      const response = await fetch('/api/cart', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ productId, quantity }),
      });

      const data = await response.json();

      if (data.success) {
        await fetchCart(); // Muat ulang keranjang
        toast.success('Keranjang berhasil diperbarui');
      } else {
        toast.error(data.error || 'Gagal memperbarui keranjang');
      }
    } catch (error) {
      console.error('Error updating cart:', error);
      toast.error('Gagal memperbarui keranjang');
    }
  };

  const removeItem = async (productId: string) => {
    await updateQuantity(productId, 0);
  };

  const clearCart = async () => {
   
    if (!confirm('Apakah Anda yakin ingin mengosongkan keranjang?')) return;

    try {
      const response = await fetch('/api/cart', {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        setCart(null);
        toast.success('Keranjang berhasil dikosongkan');
      } else {
        toast.error('Gagal mengosongkan keranjang');
      }
    } catch (error) {
      console.error('Error clearing cart:', error);
      toast.error('Gagal mengosongkan keranjang');
    }
  };

  const checkout = async () => {
    if (!cart || cart.items.length === 0) return;

    setIsCheckingOut(true);
    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Pesanan berhasil dibuat!');
        router.push(`/orders`);
      } else {
        toast.error(data.error || 'Gagal membuat pesanan');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error('Gagal membuat pesanan');
    } finally {
      setIsCheckingOut(false);
    }
  };

  
  const subtotal =
    cart?.items.reduce((sum: number, item: CartItemWithProduct) => {
      return sum + Number(item.product.price) * item.quantity;
    }, 0) || 0;

  const shipping = subtotal > 100 ? 0 : 10; 
  const total = subtotal + shipping;

  if (status === 'loading' || loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="h-24 bg-gray-200 rounded"
              ></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!session) {
    return null; 
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
       
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Keranjang Belanja</h1>
          <Link href="/products">
            <Button variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Lanjutkan Belanja
            </Button>
          </Link>
        </div>

        {cart && cart.items.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Item Keranjang ({cart.items.length})</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearCart}
                  className="text-red-600 hover:text-red-700"
                >
                  Kosongkan Keranjang
                </Button>
              </div>

              {cart.items.map((item: CartItemWithProduct) => (
                <Card key={item.id}>
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-4">
                    
                      <div className="relative w-20 h-20 flex-shrink-0">
                        {item.product.imageUrl ? (
                          <Image
                            src={item.product.imageUrl}
                            alt={item.product.name}
                            fill
                            className="object-cover rounded-lg"
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-200 rounded-lg flex items-center justify-center">
                            <ShoppingBag className="w-8 h-8 text-gray-400" />
                          </div>
                        )}
                      </div>

                      
                      <div className="flex-1 min-w-0">
                        <Link
                          href={`/products/${item.product.id}`}
                          className="text-lg font-medium hover:text-primary transition-colors"
                        >
                          {item.product.name}
                        </Link>
                        <p className="text-sm text-gray-600 mt-1">${Number(item.product.price).toFixed(2)} per buah</p>
                        <p className="text-xs text-gray-500">Stok: {item.product.stock}</p>
                      </div>

                    
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                        >
                          <Minus className="w-4 h-4" />
                        </Button>

                        <Input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => {
                            const qty = parseInt(e.target.value) || 1;
                            if (qty > 0 && qty <= item.product.stock) {
                              updateQuantity(item.productId, qty);
                            }
                          }}
                          className="w-16 text-center"
                          min="1"
                          max={item.product.stock}
                        />

                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                          disabled={item.quantity >= item.product.stock}
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>

                      <div className="text-right">
                        <p className="text-lg font-semibold">${(Number(item.product.price) * item.quantity).toFixed(2)}</p>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeItem(item.productId)}
                          className="text-red-600 hover:text-red-700 mt-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Ringkasan Pesanan */}
            <div className="lg:col-span-1">
              <Card className="sticky top-4">
                <CardHeader>
                  <CardTitle>Ringkasan Pesanan</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span>Subtotal ({cart.items.length} item)</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>

                  <div className="flex justify-between">
                    <span>Ongkos Kirim</span>
                    <span>{shipping === 0 ? <span className="text-green-600">Gratis</span> : `$${shipping.toFixed(2)}`}</span>
                  </div>

                  {subtotal < 100 && <p className="text-sm text-gray-600">Tambah ${(100 - subtotal).toFixed(2)} lagi untuk gratis ongkir</p>}

                  <hr />

                  <div className="flex justify-between text-lg font-semibold">
                    <span>Total</span>
                    <span>${total.toFixed(2)}</span>
                  </div>

                  <Button
                    onClick={checkout}
                    disabled={isCheckingOut}
                    className="w-full"
                    size="lg"
                  >
                    {isCheckingOut ? 'Memproses...' : 'Lanjutkan ke Checkout'}
                  </Button>

                  <p className="text-xs text-gray-600 text-center">Checkout aman dengan enkripsi SSL 256-bit</p>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
         
          <div className="text-center py-12">
            <ShoppingBag className="w-24 h-24 text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold mb-2">Keranjang Anda kosong</h2>
            <p className="text-gray-600 mb-6">Sepertinya Anda belum menambahkan item apa pun ke keranjang.</p>
            <Link href="/products">
              <Button size="lg">Mulai Belanja</Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
