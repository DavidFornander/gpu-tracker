// src/app/api/products/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const brand = searchParams.get('brand') || undefined;
    const minPrice = searchParams.get('minPrice') ? parseFloat(searchParams.get('minPrice')!) : undefined;
    const maxPrice = searchParams.get('maxPrice') ? parseFloat(searchParams.get('maxPrice')!) : undefined;
    const inStock = searchParams.get('inStock') ? searchParams.get('inStock') === 'true' : undefined;
    const search = searchParams.get('search') || undefined;
    const sortBy = searchParams.get('sortBy') || 'price';
    const sortOrder = searchParams.get('sortOrder') || 'asc';
    
    // Build query filters
    const where: any = {};
    
    if (brand && brand !== 'all') {
      where.brand = brand;
    }
    
    if (minPrice !== undefined || maxPrice !== undefined) {
      where.price = {};
      if (minPrice !== undefined) where.price.gte = minPrice;
      if (maxPrice !== undefined) where.price.lte = maxPrice;
    }
    
    if (inStock !== undefined) {
      where.inStock = inStock;
    }
    
    if (search) {
      where.OR = [
        { brand: { contains: search, mode: 'insensitive' } },
        { model: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Handle sorting
    let orderBy: any = {};
    if (sortBy === 'price') {
      orderBy.price = sortOrder;
    } else if (sortBy === 'dateAdded') {
      orderBy.dateAdded = sortOrder;
    }
    
    // Execute query
    const products = await prisma.product.findMany({
      where,
      orderBy,
    });
    
    // Get distinct brands for filter options
    const brands = await prisma.product.findMany({
      select: {
        brand: true,
      },
      distinct: ['brand'],
      orderBy: {
        brand: 'asc',
      },
    });

    // Get price range for filter context
    const priceRange = await prisma.$queryRaw`
      SELECT MIN(price) as minPrice, MAX(price) as maxPrice FROM Product
    `;
    
    return NextResponse.json({
      products,
      meta: {
        count: products.length,
        brands: brands.map(b => b.brand),
      }
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}