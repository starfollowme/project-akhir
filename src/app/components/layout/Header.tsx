'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, User, Menu, X, LogOut, Settings, Package, Home } from 'lucide-react';

export function Header() {
  const { data: session, status } = useSession();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    if (session) {
      fetchCartCount();
    }
  }, [session]);

  const fetchCartCount = async () => {
    try {
      const response = await fetch('/api/cart');
      const data = await response.json();

      if (data.success) {
        const count = data.data.items.reduce((total: number, item: any) => total + item.quantity, 0);
        setCartCount(count);
      }
    } catch (error) {
      console.error('Gagal mengambil jumlah keranjang:', error);
    }
  };

  const handleSignOut = () => {
    signOut({ callbackUrl: '/' });
  };

  const isAdmin = session?.user?.role === 'ADMIN';

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <Link
            href="/"
            className="flex items-center space-x-2"
          >
            <Package className="h-6 w-6" />
            <span className="text-xl font-bold">Ravello</span>
          </Link>

          <nav className="hidden md:flex items-center space-x-6">
            <Link
              href="/"
              className="text-sm font-medium hover:text-primary transition-colors"
            >
              Beranda
            </Link>
            <Link
              href="/products"
              className="text-sm font-medium hover:text-primary transition-colors"
            >
              Produk
            </Link>
            {session && (
              <Link
                href="/orders"
                className="text-sm font-medium hover:text-primary transition-colors"
              >
                Pesanan
              </Link>
            )}
            {isAdmin && (
              <Link
                href="/admin/dashboard"
                className="text-sm font-medium hover:text-primary transition-colors"
              >
                Admin
              </Link>
            )}
          </nav>

          <div className="hidden md:flex items-center space-x-4">
            {session ? (
              <>
                <Link
                  href="/cart"
                  className="relative"
                >
                  <Button
                    variant="ghost"
                    size="icon"
                  >
                    <ShoppingCart className="h-5 w-5" />
                    {cartCount > 0 && (
                      <Badge
                        variant="destructive"
                        className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs"
                      >
                        {cartCount}
                      </Badge>
                    )}
                  </Button>
                </Link>

                <div className="relative group">
                  <Button
                    variant="ghost"
                    size="icon"
                  >
                    <User className="h-5 w-5" />
                  </Button>

                  <div className="absolute right-0 top-full mt-2 w-48 bg-background border rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                    <div className="p-2">
                      <div className="px-2 py-1.5 text-sm font-medium border-b">{session.user.name || session.user.email}</div>

                      <Link
                        href="/profile"
                        className="flex items-center px-2 py-1.5 text-sm hover:bg-accent rounded-sm"
                      >
                        <Settings className="h-4 w-4 mr-2" />
                        Profil
                      </Link>

                      <Link
                        href="/orders"
                        className="flex items-center px-2 py-1.5 text-sm hover:bg-accent rounded-sm"
                      >
                        <Package className="h-4 w-4 mr-2" />
                        Pesanan Saya
                      </Link>

                      {isAdmin && (
                        <Link
                          href="/admin/dashboard"
                          className="flex items-center px-2 py-1.5 text-sm hover:bg-accent rounded-sm"
                        >
                          <Settings className="h-4 w-4 mr-2" />
                          Panel Admin
                        </Link>
                      )}

                      <button
                        onClick={handleSignOut}
                        className="flex items-center w-full px-2 py-1.5 text-sm hover:bg-accent rounded-sm text-red-600"
                      >
                        <LogOut className="h-4 w-4 mr-2" />
                        Keluar
                      </button>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-2">
                <Link href="/auth/login">
                  <Button variant="ghost">Masuk</Button>
                </Link>
                <Link href="/auth/register">
                  <Button>Daftar</Button>
                </Link>
              </div>
            )}
          </div>

          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2"
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {isMenuOpen && (
          <div className="md:hidden border-t py-4">
            <nav className="flex flex-col space-y-4">
              <Link
                href="/"
                className="flex items-center px-2 py-2 text-sm font-medium hover:bg-accent rounded-sm"
                onClick={() => setIsMenuOpen(false)}
              >
                <Home className="h-4 w-4 mr-2" />
                Beranda
              </Link>

              <Link
                href="/products"
                className="flex items-center px-2 py-2 text-sm font-medium hover:bg-accent rounded-sm"
                onClick={() => setIsMenuOpen(false)}
              >
                <Package className="h-4 w-4 mr-2" />
                Produk
              </Link>

              {session ? (
                <>
                  <Link
                    href="/cart"
                    className="flex items-center px-2 py-2 text-sm font-medium hover:bg-accent rounded-sm"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Keranjang {cartCount > 0 && `(${cartCount})`}
                  </Link>

                  <Link
                    href="/orders"
                    className="flex items-center px-2 py-2 text-sm font-medium hover:bg-accent rounded-sm"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Package className="h-4 w-4 mr-2" />
                    Pesanan
                  </Link>

                  {isAdmin && (
                    <Link
                      href="/admin/dashboard"
                      className="flex items-center px-2 py-2 text-sm font-medium hover:bg-accent rounded-sm"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Panel Admin
                    </Link>
                  )}

                  <button
                    onClick={handleSignOut}
                    className="flex items-center px-2 py-2 text-sm font-medium hover:bg-accent rounded-sm text-red-600"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Keluar
                  </button>
                </>
              ) : (
                <div className="flex flex-col space-y-2 px-2">
                  <Link
                    href="/auth/login"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Button
                      variant="ghost"
                      className="w-full justify-start"
                    >
                      Masuk
                    </Button>
                  </Link>
                  <Link
                    href="/auth/register"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Button className="w-full justify-start">Daftar</Button>
                  </Link>
                </div>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
