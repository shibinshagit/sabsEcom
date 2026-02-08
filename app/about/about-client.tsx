"use client"
import { useSettings } from "@/lib/contexts/settings-context"
import { useShop } from "@/lib/contexts/shop-context"
import { Award, Heart, Shield, Users, Star, Sparkles } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

export default function AboutPageClient() {
  const { settings } = useSettings()
  const { shop } = useShop()
  const theme = shop === "A"
    ? {
        accent: "bg-foreground text-background border-foreground",
        shadow: "shadow-sm",
        heading: "text-foreground",
      }
    : {
        accent: "bg-foreground text-background border-foreground",
        shadow: "shadow-sm",
        heading: "text-foreground",
      }

  // Structured Data for SEO
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": settings.restaurant_name || "Motoclub kottackal",
    "description": "Spare parts and accessories retailer committed to quality and customer satisfaction",
    "url": "https://motoclub.in",
    "logo": settings.restaurant_logo || "https://motoclub.in/logo.png",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "Moto club Kottakkal, Thoppil tower, Parakkori,  Puthoor, Kottakkal, Malappuram dist.Kerala.",
      "addressLocality": "Kottakkal",
      "addressRegion": "Malappuram",
      "postalCode": "676501",
      "addressCountry": "India"
    },
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": "+91-9995442239",
      "contactType": "customer service",
      "email": "contact@motoclub.in"
    },
    "sameAs": [
      settings.social_facebook,
      settings.social_instagram,
      settings.social_twitter
    ].filter(Boolean),
    "foundingDate": "2020",
    "numberOfEmployees": "10-50",
    "slogan": "Your trusted partner for spare parts and accessories",
    "knowsAbout": [
      "Spare Parts",
      "Accessories",
      "Engine Parts",
      "Brake Parts",
      "Suspension Parts",
      "Electrical Parts",
      "Riding Gear"
    ]
  }

  return (
    <>
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      
      <div className="min-h-screen bg-background flex flex-col items-center justify-center py-12 px-2">
        <div className="max-w-6xl w-full mx-auto">
          <div className="border border-border bg-background shadow-sm p-0 relative overflow-hidden">
            
            {/* Header Section with SEO-optimized content */}
            <header className="text-center p-10 border-b border-border">
              <div className="flex flex-col items-center gap-4">
                {settings.restaurant_logo ? (
                  <div className="relative w-24 h-24 mb-2">
                    <Image 
                      src={settings.restaurant_logo || "/logo.png"} 
                      alt={`${settings.restaurant_name} - Spare Parts and Accessories`}
                      fill 
                      className="object-contain border border-border shadow-sm bg-white"
                      priority
                    />
                  </div>
                ) : (
                  <div className="w-24 h-24 bg-foreground flex items-center justify-center mb-2">
                    <span className="text-background font-bold text-4xl" aria-label={settings.restaurant_name}>
                      {settings.restaurant_name.charAt(0)}
                    </span>
                  </div>
                )}
                <h1 className="font-playfair text-5xl md:text-6xl font-bold text-foreground">
                  About {settings.restaurant_name}
                </h1>
                <p className="text-muted-foreground text-xl max-w-2xl animate-fade-in">
                  Discover our story, mission, and commitment to genuine spare parts and reliable accessories.
                </p>
              </div>
            </header>

            {/* Main Content with semantic HTML */}
            <main className="grid grid-cols-1 lg:grid-cols-2 gap-0">
              
              {/* Left: Our Story */}
              <section className="p-10 border-r border-border">
                <div className="space-y-6">
                  <div className="flex items-center gap-3 mb-6">
                    <Heart className="w-8 h-8 text-foreground" aria-hidden="true" />
                    <h2 className="text-3xl font-bold text-foreground">Our Story & Mission</h2>
                  </div>
                  
                  <article className="space-y-4">
                    <p className="text-foreground text-lg leading-relaxed">
                      Founded with a passion for quality and customer satisfaction, <strong className="font-semibold text-foreground">{settings.restaurant_name}</strong> has been your trusted partner in spare parts and accessories. We specialize in genuine parts, reliable replacements, and everyday riding essentials.
                    </p>
                    
                    <p className="text-muted-foreground leading-relaxed">
                      We believe every rider deserves dependable parts and practical accessories. Our curated selection combines trusted brands with local favorites, so you get the right fit at fair prices.
                    </p>

                    <div className="bg-muted p-6 border border-border">
                      <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                        <Sparkles className="w-5 h-5" aria-hidden="true" />
                        Our Mission Statement
                      </h3>
                      <p className="text-muted-foreground">
                        To keep every ride safe and smooth through quality spare parts, reliable accessories, and customer-first support.
                      </p>
                    </div>
                  </article>
                </div>
              </section>

              {/* Right: Why Choose Us */}
              <section className="p-10">
                <div className="space-y-6">
                  <div className="flex items-center gap-3 mb-6">
                    <Award className="w-8 h-8 text-foreground" aria-hidden="true" />
                    <h2 className="text-3xl font-bold text-foreground">Why Choose {settings.restaurant_name}</h2>
                  </div>

                  <div className="space-y-4" role="list">
                    <div className="flex items-start gap-4 p-4 bg-muted border border-border" role="listitem">
                      <Shield className="w-6 h-6 text-foreground mt-1 flex-shrink-0" aria-hidden="true" />
                      <div>
                        <h4 className="font-semibold text-foreground">Genuine Parts Guaranteed</h4>
                        <p className="text-muted-foreground text-sm">All spare parts and accessories are carefully selected, quality-tested, and verified before reaching you.</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4 p-4 bg-muted border border-border" role="listitem">
                      <Users className="w-6 h-6 text-foreground mt-1 flex-shrink-0" aria-hidden="true" />
                      <div>
                        <h4 className="font-semibold text-foreground">Customer-First Support</h4>
                        <p className="text-muted-foreground text-sm">Your satisfaction comes first with fast support, easy returns, and clear part-fit guidance.</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4 p-4 bg-muted border border-border" role="listitem">
                      <Star className="w-6 h-6 text-foreground mt-1 flex-shrink-0" aria-hidden="true" />
                      <div>
                        <h4 className="font-semibold text-foreground">Trusted Experience</h4>
                        <p className="text-muted-foreground text-sm">Years of experience serving riders with dependable parts and accessories.</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 p-6 bg-muted border border-border">
                    <h3 className="font-semibold text-foreground mb-3">Our Commitment to You</h3>
                    <ul className="space-y-2 text-muted-foreground text-sm" role="list">
                      <li role="listitem">• Fast and secure delivery across India</li>
                      <li role="listitem">• Genuine spare parts and reliable accessories</li>
                      <li role="listitem">• Competitive pricing with regular offers</li>
                      <li role="listitem">• Helpful support for part fitment</li>
                      <li role="listitem">• Easy returns and exchanges within 7 days</li>
                      <li role="listitem">• Secure payment options including UPI and COD</li>
                    </ul>
                  </div>
                </div>
              </section>
            </main>

            {/* Call-to-Action Section */}
            <section className="p-10 border-t border-border bg-background">
              <div className="text-center space-y-4">
                <h3 className="text-2xl font-bold text-foreground">Ready to Experience the {settings.restaurant_name} Difference?</h3>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                  Join riders who trust {settings.restaurant_name} for spare parts and accessories. Discover reliable products at fair prices.
                </p>
                <div className="flex flex-wrap justify-center gap-4 mt-6">
                  <Link 
                    href="/products" 
                    className="bg-foreground text-background px-8 py-3 font-semibold transition-all duration-300"
                    aria-label="Browse spare parts and accessories"
                  >
                    Shop Parts & Accessories
                  </Link>
                  <Link 
                    href="/contact" 
                    className="border border-border text-foreground px-8 py-3 font-semibold hover:bg-muted transition-all duration-300"
                    aria-label="Contact us for product inquiries"
                  >
                    Contact Support
                  </Link>
                </div>
              </div>
              
              <footer className="mt-8 text-center text-muted-foreground text-xs">
                © {new Date().getFullYear()} {settings.restaurant_name}. All rights reserved. | Spare Parts & Accessories
              </footer>
            </section>
          </div>
        </div>
      </div>
    </>
  )
}
