import ProductPageClient from "./product-page-client"
import { getProductById } from "@/lib/products/get-product"

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const product = await getProductById(id)
  return <ProductPageClient initialProduct={product} />
}
