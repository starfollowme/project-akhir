import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Create admin user
  const hashedAdminPassword = await bcrypt.hash('admin123', 12)
  const hashedUserPassword = await bcrypt.hash('user123', 12)
  
  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      name: 'Admin User',
      password: hashedAdminPassword,
      role: 'ADMIN'
    }
  })

  const user = await prisma.user.upsert({
    where: { email: 'user@example.com' },
    update: {},
    create: {
      email: 'user@example.com',
      name: 'Regular User',
      password: hashedUserPassword,
      role: 'CUSTOMER'
    }
  })

  // Create categories
  const electronics = await prisma.category.upsert({
    where: { slug: 'electronics' },
    update: {},
    create: {
      name: 'Electronics',
      slug: 'electronics'
    }
  })

  const clothing = await prisma.category.upsert({
    where: { slug: 'clothing' },
    update: {},
    create: {
      name: 'Clothing',
      slug: 'clothing'
    }
  })

  const books = await prisma.category.upsert({
    where: { slug: 'books' },
    update: {},
    create: {
      name: 'Books',
      slug: 'books'
    }
  })

  // Create sample products
  await prisma.product.createMany({
    data: [
      {
        name: 'iPhone 15 Pro',
        description: 'Latest iPhone with A17 Pro chip and titanium design',
        price: 999.99,
        stock: 50,
        categoryId: electronics.id,
        imageUrl: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400'
      },
      {
        name: 'MacBook Pro M3',
        description: 'Powerful laptop for professionals with M3 chip',
        price: 1999.99,
        stock: 25,
        categoryId: electronics.id,
        imageUrl: 'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=400'
      },
      {
        name: 'AirPods Pro',
        description: 'Wireless earbuds with active noise cancellation',
        price: 249.99,
        stock: 100,
        categoryId: electronics.id,
        imageUrl: 'https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=400'
      },
      {
        name: 'Premium T-Shirt',
        description: 'Comfortable cotton t-shirt with premium quality',
        price: 29.99,
        stock: 200,
        categoryId: clothing.id,
        imageUrl: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400'
      },
      {
        name: 'Denim Jacket',
        description: 'Classic denim jacket for casual wear',
        price: 79.99,
        stock: 75,
        categoryId: clothing.id,
        imageUrl: 'https://images.unsplash.com/photo-1544966503-7cc5ac882d5d?w=400'
      },
      {
        name: 'JavaScript: The Good Parts',
        description: 'Essential guide to JavaScript programming',
        price: 39.99,
        stock: 150,
        categoryId: books.id,
        imageUrl: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=400'
      },
      {
        name: 'Clean Code',
        description: 'A handbook of agile software craftsmanship',
        price: 45.99,
        stock: 120,
        categoryId: books.id,
        imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400'
      },
      {
        name: 'React: Up & Running',
        description: 'Building web applications with React',
        price: 49.99,
        stock: 90,
        categoryId: books.id,
        imageUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400'
      }
    ]
  })

  console.log('✅ Database seeded successfully!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })