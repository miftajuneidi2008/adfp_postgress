import { getProduct } from "@/lib/data/Product";
import ProductsPageUI from "./ProductsPageUI";

interface Product {
  id: string;
  name: string;
  description: string | null;
  product_code: string | null;
  is_active: boolean;
}

export default async function ProductsPage() {
  const product =  await getProduct()

  return(
    <div>
     <ProductsPageUI product={product} />
    </div>
  )
  
}
