import { Metadata } from 'next'

interface ProductMetadataProps {
  params: { id: string }
}

export async function generateMetadata({ params }: ProductMetadataProps): Promise<Metadata> {
  try {
    // Fetch product data for metadata
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'https://motoclub.in'}/api/admin/products/${params.id}`, {
      cache: 'no-store' // Ensure fresh data for metadata
    })
    
    if (!response.ok) {
      return {
        title: 'Product Not Found - Motoclub Kottakkal',
        description: 'The requested product could not be found.',
      }
    }

    const product = await response.json()
    
    // Get the first image or fallback
    const productImage = product.image_urls?.[0] || '/logo.png'
    const productName = product.name || 'Product'
    const productDescription = product.description || 'Quality products from Motoclub Kottakkal'
    const shopName = product.shop_category === 'A' ? 'Spare Parts' : product.shop_category === 'B' ? 'Accessories' : 'Parts & Accessories'
    
    // Format price for display
    const formatPrice = (price: number, currency: string) => {
      if (currency === 'AED') {
        return `AED ${price.toFixed(2)}`
      } else {
        return `₹${price.toFixed(2)}`
      }
    }
    // // Get price info
    // let priceText = ''
    // if (product.variants && product.variants.length > 0) {
    //   const variant = product.variants[0]
    //   if (variant.price_aed && variant.price_aed > 0) {
    //     priceText = ` - Starting from ${formatPrice(variant.price_aed, 'AED')}`
    //   } else if (variant.price_inr && variant.price_inr > 0) {
    //     priceText = ` - Starting from ${formatPrice(variant.price_inr, 'INR')}`
    //   }
    // }

    const title = `${productName} | Motoclub Kottakkal ${shopName}`
    const description = `${productDescription} | Available at Motoclub Kottakkal ${shopName}. Reliable products with fast delivery.`
    
    return {
      title,
      description,
      openGraph: {
        title,
        description,
        type: 'website',
        url: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://motoclub.in'}/product/${params.id}`,
        siteName: 'Motoclub Kottakkal',
        images: [
          {
            url: productImage.startsWith('http') ? productImage : `${process.env.NEXT_PUBLIC_BASE_URL || 'https://motoclub.in'}${productImage}`,
            width: 800,
            height: 600,
            alt: productName,
          }
        ],
        locale: 'en_US',
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: [productImage.startsWith('http') ? productImage : `${process.env.NEXT_PUBLIC_BASE_URL || 'https://motoclub.in'}${productImage}`],
        creator: '@motoclubkottakkal',
        site: '@motoclubkottakkal',
      },
      other: {
        // WhatsApp specific meta tags
        'og:image:width': '800',
        'og:image:height': '600',
            'og:image:type': 'image/jpeg',
    // Additional meta tags for better sharing
        // 'product:price:amount': product.variants?.[0]?.price_aed || product.variants?.[0]?.price_inr || '',
        // 'product:price:currency': product.variants?.[0]?.price_aed ? 'AED' : 'INR',
        // Product metadata without specific pricing
        'product:availability': product.is_available ? 'in stock' : 'out of stock',
        'product:brand': 'Motoclub Kottakkal',
        'product:category': product.category_name || 'Products',
      }
    }
  } catch (error) {
    console.error('Error generating metadata:', error)
    return {
      title: 'Motoclub Kottakkal - Spare Parts & Accessories',
      description: 'Discover spare parts and accessories at Motoclub Kottakkal with fast delivery.',
    }
  }
}
