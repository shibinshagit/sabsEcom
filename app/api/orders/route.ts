// app/api/orders/route.ts
import { NextResponse } from "next/server"
import { sql } from "@/lib/database"
import { cookies } from "next/headers"
import { jwtVerify } from "jose"
import { currentUser } from "@clerk/nextjs/server"
import nodemailer from 'nodemailer'

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "your-secret-key-change-in-production")

// Email configuration
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
})

// Function to send order confirmation email
async function sendOrderConfirmationEmail(orderData: any, orderId: number) {
  try {
    const customerEmail = orderData.customerEmail
    if (!customerEmail) {
      console.log('No customer email provided, skipping email notification')
      return
    }

    const currency = orderData.currency || 'AED'
    const currencySymbol = currency === 'AED' ? 'AED' : '₹'

    const subtotal = orderData.originalAmount - (currency === 'AED' ? 20 : 70) || 0
    const deliveryFee = orderData.orderType === 'delivery' ?
      (currency === 'AED' ?
        (subtotal >= 200 ? 0 : (subtotal >= 50 ? 10 : 20)) :
        (subtotal >= 3000 ? 0 : 70)
      ) : 0
    const finalTotal = orderData.totalAmount || (subtotal + deliveryFee - (orderData.discountAmount || 0))

    // Create order items HTML
    let itemsHtml = ''
    orderData.items.forEach((item: any, index: number) => {
      const itemPrice = parseFloat(item.unitPrice) || 0
      const itemTotal = itemPrice * item.quantity
      itemsHtml += `
        <tr style="border-bottom: 1px solid #eee;">
          <td style="padding: 10px; text-align: left;">${index + 1}. ${item.menuItemName}${item.variantName && item.variantName !== 'Default' ? ` - ${item.variantName}` : ''}</td>
          <td style="padding: 10px; text-align: center;">${item.quantity}</td>
          <td style="padding: 10px; text-align: right;">${currencySymbol} ${itemPrice.toFixed(2)}</td>
          <td style="padding: 10px; text-align: right; font-weight: bold;">${currencySymbol} ${itemTotal.toFixed(2)}</td>
        </tr>
      `
    })

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Order Confirmation</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #f97316, #dc2626); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">🎉 Order Confirmed!</h1>
          <p style="color: white; margin: 10px 0 0 0; font-size: 16px;">Thank you for your order with Sabs Online</p>
        </div>

        <div style="background: #fff; padding: 30px; border: 1px solid #ddd; border-top: none; border-radius: 0 0 10px 10px;">
          <h2 style="color: #f97316; margin-bottom: 20px;">Order Details</h2>

          <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
            <p style="margin: 5px 0;"><strong>Order ID:</strong> #${orderId}</p>
            <p style="margin: 5px 0;"><strong>Customer:</strong> ${orderData.customerName}</p>
            <p style="margin: 5px 0;"><strong>Phone:</strong> ${orderData.customerPhone}</p>
            <p style="margin: 5px 0;"><strong>Order Type:</strong> ${orderData.orderType.charAt(0).toUpperCase() + orderData.orderType.slice(1)}</p>
            <p style="margin: 5px 0;"><strong>Payment:</strong> ${orderData.paymentMethod === 'upi' ? 'UPI Payment' : 'Cash on Delivery'}</p>
            ${orderData.deliveryAddress ? `<p style="margin: 5px 0;"><strong>Delivery Address:</strong> ${orderData.deliveryAddress}</p>` : ''}
          </div>

          <h3 style="color: #f97316; margin-bottom: 15px;">Order Items</h3>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <thead>
              <tr style="background: #f8f9fa;">
                <th style="padding: 10px; text-align: left; border-bottom: 2px solid #ddd;">Item</th>
                <th style="padding: 10px; text-align: center; border-bottom: 2px solid #ddd;">Qty</th>
                <th style="padding: 10px; text-align: right; border-bottom: 2px solid #ddd;">Price</th>
                <th style="padding: 10px; text-align: right; border-bottom: 2px solid #ddd;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <div style="border-top: 2px solid #f97316; padding-top: 15px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
              <span>Subtotal:</span>
              <span>${currencySymbol} ${subtotal.toFixed(2)}</span>
            </div>
            ${orderData.orderType === 'delivery' ? `
              <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                <span>Delivery Fee: ${deliveryFee === 0 ? '🎉 FREE!' : ''}</span>
                <span style="${deliveryFee === 0 ? 'color: #10b981; font-weight: bold;' : ''}">${deliveryFee === 0 ? 'FREE' : currencySymbol + ' ' + deliveryFee.toFixed(2)}</span>
              </div>
            ` : ''}
            ${orderData.discountAmount > 0 ? `
              <div style="display: flex; justify-content: space-between; margin-bottom: 10px; color: #10b981;">
                <span>Discount ${orderData.couponCode ? '(' + orderData.couponCode + ')' : ''}:</span>
                <span>-${currencySymbol} ${orderData.discountAmount.toFixed(2)}</span>
              </div>
            ` : ''}
            <div style="display: flex; justify-content: space-between; font-size: 18px; font-weight: bold; color: #f97316; border-top: 1px solid #ddd; padding-top: 10px;">
              <span>Total:</span>
              <span>${currencySymbol} ${finalTotal.toFixed(2)}</span>
            </div>
          </div>

          <div style="background: #e7f3ff; border: 1px solid #b3d9ff; border-radius: 5px; padding: 15px; margin-top: 20px;">
            <h4 style="margin: 0 0 10px 0; color: #0066cc;">📞 Need Help?</h4>
            <p style="margin: 0; font-size: 14px;">Contact us at <a href="tel:+917012975494" style="color: #f97316;">+91 7012975494</a> for any questions about your order.</p>
          </div>

          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
            <p style="margin: 0; color: #666; font-size: 14px;">Thank you for choosing Sabs Online!</p>
            <p style="margin: 5px 0 0 0; color: #666; font-size: 14px;">We'll contact you soon with updates about your order.</p>
          </div>
        </div>
      </body>
      </html>
    `

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: customerEmail,
      subject: `Order Confirmation #${orderId} - Sabs Online`,
      html: emailHtml,
    }

    await transporter.sendMail(mailOptions)
    console.log('Order confirmation email sent successfully to:', customerEmail)
  } catch (error) {
    console.error('Error sending order confirmation email:', error)
    // Don't throw error to avoid breaking order processing
  }
}

// Function to send admin notification email
async function sendAdminNotificationEmail(orderData: any, orderId: number) {
  try {
    const adminEmail = 'oursouq01@gmail.com'
    const currency = orderData.currency || 'AED'
    const currencySymbol = currency === 'AED' ? 'AED' : '₹'

    const subtotal = orderData.originalAmount - (currency === 'AED' ? 20 : 70) || 0
    const deliveryFee = orderData.orderType === 'delivery' ?
      (currency === 'AED' ?
        (subtotal >= 200 ? 0 : (subtotal >= 50 ? 10 : 20)) :
        (subtotal >= 3000 ? 0 : 70)
      ) : 0
    const finalTotal = orderData.totalAmount || (subtotal + deliveryFee - (orderData.discountAmount || 0))

    // Create order items HTML with images
    let itemsHtml = ''
    orderData.items.forEach((item: any, index: number) => {
      const itemPrice = parseFloat(item.unitPrice) || 0
      const itemTotal = itemPrice * item.quantity
      const imageUrl = item.productImageUrl || 'https://via.placeholder.com/80x80?text=No+Image'

      itemsHtml += `
        <tr style="border-bottom: 1px solid #eee;">
          <td style="padding: 10px; text-align: center;">
            <img src="${imageUrl}" alt="${item.menuItemName}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 8px;">
          </td>
          <td style="padding: 10px; text-align: left;">
            <strong>${item.menuItemName}</strong>
            ${item.variantName && item.variantName !== 'Default' ? `<br><small style="color: #666;">Variant: ${item.variantName}</small>` : ''}
          </td>
          <td style="padding: 10px; text-align: center; font-weight: bold;">${item.quantity}</td>
          <td style="padding: 10px; text-align: right;">${currencySymbol} ${itemPrice.toFixed(2)}</td>
          <td style="padding: 10px; text-align: right; font-weight: bold; color: #dc2626;">${currencySymbol} ${itemTotal.toFixed(2)}</td>
        </tr>
      `
    })

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Order Alert</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 700px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #dc2626, #b91c1c); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">🚨 New Order Alert!</h1>
          <p style="color: white; margin: 10px 0 0 0; font-size: 16px;">Order #${orderId} - Sabs Online</p>
        </div>

        <div style="background: #fff; padding: 30px; border: 1px solid #ddd; border-top: none; border-radius: 0 0 10px 10px;">
          <h2 style="color: #dc2626; margin-bottom: 20px;">Order Details</h2>

          <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
            <p style="margin: 5px 0;"><strong>Order ID:</strong> #${orderId}</p>
            <p style="margin: 5px 0;"><strong>Customer:</strong> ${orderData.customerName}</p>
            <p style="margin: 5px 0;"><strong>Phone:</strong> ${orderData.customerPhone}</p>
            <p style="margin: 5px 0;"><strong>Email:</strong> ${orderData.customerEmail || 'Not provided'}</p>
            <p style="margin: 5px 0;"><strong>Order Type:</strong> ${orderData.orderType.charAt(0).toUpperCase() + orderData.orderType.slice(1)}</p>
            <p style="margin: 5px 0;"><strong>Payment:</strong> ${orderData.paymentMethod === 'upi' ? 'UPI Payment' : 'Cash on Delivery'}</p>
            <p style="margin: 5px 0;"><strong>Currency:</strong> ${currency}</p>
            ${orderData.deliveryAddress ? `<p style="margin: 5px 0;"><strong>Delivery Address:</strong> ${orderData.deliveryAddress}</p>` : ''}
          </div>

          <h3 style="color: #dc2626; margin-bottom: 15px;">Order Items</h3>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; background: #fff; border: 1px solid #ddd; border-radius: 8px; overflow: hidden;">
            <thead>
              <tr style="background: #f8f9fa;">
                <th style="padding: 12px; text-align: center; border-bottom: 2px solid #ddd; font-weight: bold;">Image</th>
                <th style="padding: 12px; text-align: left; border-bottom: 2px solid #ddd; font-weight: bold;">Product</th>
                <th style="padding: 12px; text-align: center; border-bottom: 2px solid #ddd; font-weight: bold;">Qty</th>
                <th style="padding: 12px; text-align: right; border-bottom: 2px solid #ddd; font-weight: bold;">Price</th>
                <th style="padding: 12px; text-align: right; border-bottom: 2px solid #ddd; font-weight: bold;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <div style="border-top: 2px solid #dc2626; padding-top: 15px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
              <span><strong>Subtotal:</strong></span>
              <span><strong>${currencySymbol} ${subtotal.toFixed(2)}</strong></span>
            </div>
            ${orderData.orderType === 'delivery' ? `
              <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                <span><strong>Delivery Fee:</strong></span>
                <span><strong>${deliveryFee === 0 ? 'FREE 🎉' : currencySymbol + ' ' + deliveryFee.toFixed(2)}</strong></span>
              </div>
            ` : ''}
            ${orderData.discountAmount > 0 ? `
              <div style="display: flex; justify-content: space-between; margin-bottom: 10px; color: #10b981;">
                <span><strong>Discount ${orderData.couponCode ? '(' + orderData.couponCode + ')' : ''}:</strong></span>
                <span><strong>-${currencySymbol} ${orderData.discountAmount.toFixed(2)}</strong></span>
              </div>
            ` : ''}
            <div style="display: flex; justify-content: space-between; font-size: 20px; font-weight: bold; color: #dc2626; border-top: 1px solid #ddd; padding-top: 15px; background: #fef2f2; margin: 10px -15px -15px -15px; padding: 15px;">
              <span>TOTAL AMOUNT:</span>
              <span>${currencySymbol} ${finalTotal.toFixed(2)}</span>
            </div>
          </div>

          ${orderData.specialInstructions ? `
          <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 5px; padding: 15px; margin-top: 20px;">
            <h4 style="margin: 0 0 10px 0; color: #856404;">📝 Special Instructions:</h4>
            <p style="margin: 0; font-size: 14px; color: #856404;">${orderData.specialInstructions}</p>
          </div>
          ` : ''}

          <div style="background: #e7f3ff; border: 1px solid #b3d9ff; border-radius: 5px; padding: 15px; margin-top: 20px;">
            <h4 style="margin: 0 0 10px 0; color: #0066cc;">⚠️ Action Required</h4>
            <p style="margin: 0; font-size: 14px;">Please process this order and contact the customer at <strong>${orderData.customerPhone}</strong> to confirm delivery time.</p>
          </div>

          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
            <p style="margin: 0; color: #666; font-size: 14px;">This is an automated notification from Sabs Online</p>
            <p style="margin: 5px 0 0 0; color: #666; font-size: 12px;">Order received on ${new Date().toLocaleString()}</p>
          </div>
        </div>
      </body>
      </html>
    `

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: adminEmail,
      subject: `🚨 New Order #${orderId} - ${currencySymbol} ${finalTotal.toFixed(2)} (${orderData.customerName})`,
      html: emailHtml,
    }

    await transporter.sendMail(mailOptions)
    console.log('Admin notification email sent successfully to:', adminEmail)
  } catch (error) {
    console.error('Error sending admin notification email:', error)
    // Don't throw error to avoid breaking order processing
  }
}

async function getUserFromToken() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("auth-token")?.value

    if (!token) return null

    const { payload } = await jwtVerify(token, JWT_SECRET)
    return { userId: payload.userId as number, email: payload.email as string, isClerkUser: false }
  } catch {
    return null
  }
}

async function getAuthenticatedUser() {
  // First try Clerk authentication
  const clerkUser = await currentUser()
  if (clerkUser) {
    return {
      userId: clerkUser.id, // Clerk user ID is a string
      email: clerkUser.primaryEmailAddress?.emailAddress || clerkUser.emailAddresses[0]?.emailAddress || "",
      isClerkUser: true
    }
  }

  // Fallback to manual authentication
  return await getUserFromToken()
}

async function ensureOrdersTableExists() {
  try {
    console.log('Starting database schema setup...')
    
    // Check if orders table already exists with correct schema
    const tableExists = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'orders'
      )
    `

    if (!tableExists[0].exists) {
      // Create the orders table from scratch
      await sql`
        CREATE TABLE orders (
          id SERIAL PRIMARY KEY,
          user_id TEXT,
          clerk_user_id TEXT,
          customer_name VARCHAR(255) NOT NULL,
          customer_email VARCHAR(255),
          customer_phone VARCHAR(20) NOT NULL,
          order_type VARCHAR(20) DEFAULT 'delivery',
          payment_method VARCHAR(20) DEFAULT 'cod',
          payment_id VARCHAR(255),
          payment_status VARCHAR(20) DEFAULT 'pending',
          table_number INTEGER,
          delivery_address TEXT,
          subtotal DECIMAL(10,2) DEFAULT 0,
          delivery_fee DECIMAL(10,2) DEFAULT 0,
          tax_amount DECIMAL(10,2) DEFAULT 0,
          discount_amount DECIMAL(10,2) DEFAULT 0,
          total_amount DECIMAL(10,2) NOT NULL,
          final_total DECIMAL(10,2) NOT NULL,
          coupon_code VARCHAR(50),
          currency VARCHAR(3) DEFAULT 'AED',
          special_instructions TEXT,
          status VARCHAR(20) DEFAULT 'pending',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `
      console.log('Orders table created successfully')
    } else {
      // Add missing columns to existing table if needed
      const columnsToAdd = [
        { name: 'user_id', definition: 'TEXT', check: 'user_id' },
        { name: 'clerk_user_id', definition: 'TEXT', check: 'clerk_user_id' },
        { name: 'payment_method', definition: 'VARCHAR(20) DEFAULT \'cod\'', check: 'payment_method' },
        { name: 'payment_id', definition: 'VARCHAR(255)', check: 'payment_id' },
        { name: 'payment_status', definition: 'VARCHAR(20) DEFAULT \'pending\'', check: 'payment_status' },
        { name: 'subtotal', definition: 'DECIMAL(10,2) DEFAULT 0', check: 'subtotal' },
        { name: 'delivery_fee', definition: 'DECIMAL(10,2) DEFAULT 0', check: 'delivery_fee' },
        { name: 'tax_amount', definition: 'DECIMAL(10,2) DEFAULT 0', check: 'tax_amount' },
        { name: 'discount_amount', definition: 'DECIMAL(10,2) DEFAULT 0', check: 'discount_amount' },
        { name: 'coupon_code', definition: 'VARCHAR(50)', check: 'coupon_code' },
        { name: 'currency', definition: 'VARCHAR(3) DEFAULT \'AED\'', check: 'currency' },
        { name: 'tracking_url', definition: 'TEXT', check: 'tracking_url' },
        { name: 'tracking_id', definition: 'VARCHAR(100)', check: 'tracking_id' }
      ]

      for (const column of columnsToAdd) {
        try {
          const columnExists = await sql`
            SELECT EXISTS (
              SELECT 1 FROM information_schema.columns 
              WHERE table_name = 'orders' AND column_name = ${column.check}
            )
          `
          
          if (!columnExists[0].exists) {
            await sql.unsafe(`ALTER TABLE orders ADD COLUMN ${column.name} ${column.definition}`)
            console.log(`Added column: ${column.name}`)
          }
        } catch (colError) {
          console.log(`Column ${column.name} might already exist:`, colError)
        }
      }
      
      console.log('Orders table schema updated successfully')
    }
  } catch (error) {
    console.error('Error setting up orders table:', error)
    throw error
  }
}

async function ensureOrderItemsTableExists() {
  try {
    // Check if order_items table exists
    const tableExists = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'order_items'
      )
    `

    if (!tableExists[0].exists) {
      await sql`
        CREATE TABLE order_items (
          id SERIAL PRIMARY KEY,
          order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
          menu_item_id INTEGER,
          variant_id INTEGER,
          menu_item_name VARCHAR(255) NOT NULL,
          variant_name VARCHAR(255),
          quantity INTEGER NOT NULL,
          unit_price DECIMAL(10,2) NOT NULL,
          original_price DECIMAL(10,2),
          total_price DECIMAL(10,2) NOT NULL,
          currency VARCHAR(3) DEFAULT 'AED',
          special_requests TEXT,
          product_image_url TEXT,
          brand VARCHAR(100),
          model VARCHAR(100),
          color VARCHAR(50),
          storage_capacity VARCHAR(50),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `
      console.log('Order items table created successfully')
    } else {
      // Add missing columns to existing table if needed
      const columnsToAdd = [
        { name: 'variant_id', definition: 'INTEGER', check: 'variant_id' },
        { name: 'variant_name', definition: 'VARCHAR(255)', check: 'variant_name' },
        { name: 'original_price', definition: 'DECIMAL(10,2)', check: 'original_price' },
        { name: 'currency', definition: 'VARCHAR(3) DEFAULT \'AED\'', check: 'currency' },
        { name: 'product_image_url', definition: 'TEXT', check: 'product_image_url' },
        { name: 'brand', definition: 'VARCHAR(100)', check: 'brand' },
        { name: 'model', definition: 'VARCHAR(100)', check: 'model' },
        { name: 'color', definition: 'VARCHAR(50)', check: 'color' },
        { name: 'storage_capacity', definition: 'VARCHAR(50)', check: 'storage_capacity' }
      ]

      for (const column of columnsToAdd) {
        try {
          const columnExists = await sql`
            SELECT EXISTS (
              SELECT 1 FROM information_schema.columns 
              WHERE table_name = 'order_items' AND column_name = ${column.check}
            )
          `
          
          if (!columnExists[0].exists) {
            await sql.unsafe(`ALTER TABLE order_items ADD COLUMN ${column.name} ${column.definition}`)
            console.log(`Added column: ${column.name}`)
          }
        } catch (colError) {
          console.log(`Column ${column.name} might already exist:`, colError)
        }
      }
    }
  } catch (error) {
    console.error('Error creating order_items table:', error)
    throw error
  }
}

// Function to link user accounts by email
async function findLinkedUser(email: string, isClerkUser: boolean, userId: string | number) {
  try {
    if (isClerkUser) {
      // For Clerk user, find if there's a manual auth user with same email
      const manualUser = await sql`
        SELECT id FROM users WHERE email = ${email} LIMIT 1
      `
      return manualUser.length > 0 ? manualUser[0].id : null
    } else {
      // For manual user, find if there's a Clerk user with same email
      const clerkOrders = await sql`
        SELECT DISTINCT clerk_user_id FROM orders 
        WHERE customer_email = ${email} AND clerk_user_id IS NOT NULL 
        LIMIT 1
      `
      return clerkOrders.length > 0 ? clerkOrders[0].clerk_user_id : null
    }
  } catch (error) {
    console.error("Error finding linked user:", error)
    return null
  }
}

// Helper function to get currency-specific pricing
function getCurrencySpecificPrice(item: any, currency: string) {
  if (currency === 'AED') {
    return {
      // If discount price exists, use it as the selling price, otherwise use regular price
      unitPrice: item.discount_aed && item.discount_aed > 0 ? item.discount_aed : (item.price_aed || item.price || 0),
      originalPrice: item.price_aed || item.price || 0,
      available: item.available_aed !== false
    }
  } else {
    return {
      // If discount price exists, use it as the selling price, otherwise use regular price
      unitPrice: item.discount_inr && item.discount_inr > 0 ? item.discount_inr : (item.price_inr || item.price || 0),
      originalPrice: item.price_inr || item.price || 0,
      available: item.available_inr !== false
    }
  }
}

export async function POST(request: Request) {
  try {
    const orderData = await request.json()
    const user = await getAuthenticatedUser()

    console.log('Processing order for user:', user)
    console.log('Order data received:', orderData)

    // Validate required fields
    if (!orderData.customerName || !orderData.customerPhone) {
      return NextResponse.json({ error: "Customer name and phone are required" }, { status: 400 })
    }

    if (!orderData.items || orderData.items.length === 0) {
      return NextResponse.json({ error: "Order must contain at least one item" }, { status: 400 })
    }

    // Ensure database tables exist with proper schema
    await ensureOrdersTableExists()
    await ensureOrderItemsTableExists()

    // Calculate subtotal from individual items 
    let subtotal = 0
    for (const item of orderData.items) {
      const pricing = getCurrencySpecificPrice(item, orderData.currency || 'AED')
      const unitPrice = parseFloat(item.unitPrice) || pricing.unitPrice
      subtotal += unitPrice * item.quantity
    }

    // Calculate delivery fee based on currency, order type, and subtotal
    let deliveryFee = 0
    if (orderData.orderType === "delivery") {
      if (orderData.currency === "AED") {
        // AED: free delivery above 200, 10 AED for 50-199, 20 AED for under 50
        if (subtotal >= 200) {
          deliveryFee = 0
        } else if (subtotal >= 50) {
          deliveryFee = 10
        } else {
          deliveryFee = 20
        }
      } else {
        // INR: free delivery above 3000, otherwise 70 INR
        deliveryFee = subtotal >= 3000 ? 0 : 70
      }
    }

    // Calculate totals properly
    const taxAmount = 0 // Set tax amount as needed
    const discountAmount = orderData.discountAmount || 0
    const totalAmount = subtotal + deliveryFee + taxAmount - discountAmount
    const finalTotal = totalAmount

    // Determine payment status
    const paymentStatus = orderData.paymentMethod === 'upi' && orderData.paymentId ? 'paid' : 'pending'

    console.log('Inserting order with calculated totals:', {
      subtotal,
      delivery_fee: deliveryFee,
      tax_amount: taxAmount,
      discount_amount: discountAmount,
      total_amount: totalAmount,
      final_total: finalTotal,
      payment_status: paymentStatus,
      currency: orderData.currency || 'AED'
    })

    // Insert order with ALL required columns including final_total
    const [order] = await sql`
      INSERT INTO orders (
        user_id, clerk_user_id, customer_name, customer_email, customer_phone, 
        order_type, payment_method, payment_id, payment_status,
        table_number, delivery_address, 
        subtotal, delivery_fee, tax_amount, discount_amount, 
        total_amount, final_total,
        coupon_code, currency, special_instructions, status
      ) VALUES (
        ${user?.isClerkUser ? null : user?.userId?.toString() || null},
        ${user?.isClerkUser ? user.userId : null},
        ${orderData.customerName}, 
        ${orderData.customerEmail || user?.email || null}, 
        ${orderData.customerPhone},
        ${orderData.orderType || "delivery"},
        ${orderData.paymentMethod || "cod"},
        ${orderData.paymentId || null},
        ${paymentStatus},
        ${orderData.tableNumber || null}, 
        ${orderData.deliveryAddress || null},
        ${subtotal}, 
        ${deliveryFee}, 
        ${taxAmount},
        ${discountAmount},
        ${totalAmount},
        ${finalTotal},
        ${orderData.couponCode || null},
        ${orderData.currency || 'AED'},
        ${orderData.specialInstructions || null},
        'pending'
      ) RETURNING id
    `

    console.log('Order inserted with ID:', order.id)

    // Insert order items with variant support
    for (const item of orderData.items) {
      // Parse variant information from item name if it contains ' - '
      const itemName = item.menuItemName || "Unknown Item"
      const variantName = item.variantName || null
      
      // Get currency-specific pricing
      const pricing = getCurrencySpecificPrice(item, orderData.currency || 'AED')
      const unitPrice = parseFloat(item.unitPrice) || pricing.unitPrice
      const totalPrice = unitPrice * item.quantity

      await sql`
        INSERT INTO order_items (
          order_id, menu_item_id, variant_id, menu_item_name, variant_name,
          quantity, unit_price, original_price, total_price, currency,
          special_requests, product_image_url, brand, model, color, storage_capacity
        ) VALUES (
          ${order.id}, 
          ${item.menuItemId}, 
          ${item.variantId || null},
          ${itemName},
          ${variantName},
          ${item.quantity}, 
          ${unitPrice}, 
          ${pricing.originalPrice || unitPrice},
          ${totalPrice},
          ${orderData.currency || 'AED'},
          ${item.specialRequests || null},
          ${item.productImageUrl || null},
          ${item.brand || null},
          ${item.model || null},
          ${item.color || null},
          ${item.storageCapacity || null}
        )
      `
    }

    console.log('Order completed successfully')

    // Send order confirmation email and admin notification
    try {
      await Promise.all([
        sendOrderConfirmationEmail(orderData, order.id),
        sendAdminNotificationEmail(orderData, order.id)
      ])
    } catch (emailError) {
      console.error('Email sending failed:', emailError)
      // Continue with order completion even if email fails
    }

    return NextResponse.json({
      success: true,
      orderId: order.id,
      totalAmount: finalTotal,
      paymentStatus,
      currency: orderData.currency || 'AED'
    })
  } catch (error) {
    console.error("Error creating order:", error)
    return NextResponse.json({ 
      error: "Failed to create order", 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    const user = await getAuthenticatedUser()
    
    // If no authenticated user, return unauthorized
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("Authenticated user:", { ...user })

    // Ensure database tables exist with proper schema
    await ensureOrdersTableExists()
    await ensureOrderItemsTableExists()

    // Find linked user
    const linkedUserId = await findLinkedUser(user.email, user.isClerkUser, user.userId)
    console.log("Linked user ID:", linkedUserId)

    // Get orders for the authenticated user AND linked user (by email)
    let orders
    if (user.isClerkUser) {
      // For Clerk users: get orders by clerk_user_id OR by email OR by linked manual user ID
      orders = await sql`
        SELECT 
          o.*,
          COALESCE(
            json_agg(
              CASE WHEN oi.id IS NOT NULL THEN
                json_build_object(
                  'id', oi.id,
                  'menu_item_id', oi.menu_item_id,
                  'variant_id', oi.variant_id,
                  'menu_item_name', oi.menu_item_name,
                  'variant_name', oi.variant_name,
                  'quantity', oi.quantity,
                  'unit_price', oi.unit_price,
                  'original_price', oi.original_price,
                  'total_price', oi.total_price,
                  'currency', oi.currency,
                  'special_requests', oi.special_requests,
                  'product_image_url', oi.product_image_url,
                  'brand', oi.brand,
                  'model', oi.model,
                  'color', oi.color,
                  'storage_capacity', oi.storage_capacity
                )
              END ORDER BY oi.id
            ) FILTER (WHERE oi.id IS NOT NULL), 
            '[]'::json
          ) as items
        FROM orders o
        LEFT JOIN order_items oi ON o.id = oi.order_id
        WHERE o.clerk_user_id = ${user.userId} 
           OR o.customer_email = ${user.email}
           ${linkedUserId ? sql`OR o.user_id = ${linkedUserId.toString()}` : sql``}
        GROUP BY o.id
        ORDER BY o.created_at DESC
        LIMIT 50
      `
    } else {
      // For manual users: get orders by user_id OR by email OR by linked clerk user ID
      orders = await sql`
        SELECT 
          o.*,
          COALESCE(
            json_agg(
              CASE WHEN oi.id IS NOT NULL THEN
                json_build_object(
                  'id', oi.id,
                  'menu_item_id', oi.menu_item_id,
                  'variant_id', oi.variant_id,
                  'menu_item_name', oi.menu_item_name,
                  'variant_name', oi.variant_name,
                  'quantity', oi.quantity,
                  'unit_price', oi.unit_price,
                  'original_price', oi.original_price,
                  'total_price', oi.total_price,
                  'currency', oi.currency,
                  'special_requests', oi.special_requests,
                  'product_image_url', oi.product_image_url,
                  'brand', oi.brand,
                  'model', oi.model,
                  'color', oi.color,
                  'storage_capacity', oi.storage_capacity
                )
              END ORDER BY oi.id
            ) FILTER (WHERE oi.id IS NOT NULL), 
            '[]'::json
          ) as items
        FROM orders o
        LEFT JOIN order_items oi ON o.id = oi.order_id
        WHERE o.user_id = ${user.userId.toString()}
           OR o.customer_email = ${user.email}
           ${linkedUserId ? sql`OR o.clerk_user_id = ${linkedUserId}` : sql``}
        GROUP BY o.id
        ORDER BY o.created_at DESC
        LIMIT 50
      `
    }

    console.log(`Found ${orders.length} orders for user ${user.email}`)
    
    // Clean up the orders data to ensure proper structure
    const cleanOrders = orders.map(order => ({
      ...order,
      // Ensure final_total is available for the frontend - use existing final_total or fallback to total_amount
      final_total: order.final_total || order.total_amount,
      items: Array.isArray(order.items) ? order.items : []
    }))
    
    return NextResponse.json(cleanOrders)
  } catch (error) {
    console.error("Error fetching orders:", error)
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 })
  }
}