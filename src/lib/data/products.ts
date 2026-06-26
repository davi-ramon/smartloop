import {
  collection, doc, addDoc, updateDoc, deleteDoc, onSnapshot,
  query, orderBy, serverTimestamp, type Timestamp,
} from "firebase/firestore"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { db, storage } from "@/lib/firebase/config"
import { logger } from "@/lib/logger"

export const PRODUCT_CATEGORIES = [
  "Películas", "Capas", "Carregadores", "Cabos", "Fones", "Serviços", "Acessórios", "Outros",
] as const

export interface Product {
  id: string
  name: string
  description?: string
  price: number
  category?: string
  imageUrl?: string
  createdAt?: Timestamp | null
}

export type ProductInput = Omit<Product, "id" | "createdAt">

function productsCol(tenantId: string) {
  return collection(db, "tenants", tenantId, "products")
}

export function watchProducts(
  tenantId: string,
  onData: (products: Product[]) => void,
  onError: (err: Error) => void
) {
  const q = query(productsCol(tenantId), orderBy("name"))
  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Product, "id">) }))
      logger.info("pdv", "snapshot de produtos recebido", { total: list.length })
      onData(list)
    },
    (err) => { logger.error("pdv", "falha no watch de produtos", err); onError(err) }
  )
}

export async function createProduct(tenantId: string, data: ProductInput) {
  logger.info("pdv", "criando produto", { name: data.name })
  try {
    const refDoc = await addDoc(productsCol(tenantId), { ...data, createdAt: serverTimestamp() })
    logger.success("pdv", "produto criado", { id: refDoc.id })
    return refDoc.id
  } catch (err) {
    logger.error("pdv", "falha ao criar produto", err); throw err
  }
}

export async function updateProduct(tenantId: string, id: string, data: Partial<ProductInput>) {
  logger.info("pdv", "atualizando produto", { id })
  try {
    await updateDoc(doc(db, "tenants", tenantId, "products", id), data)
    logger.success("pdv", "produto atualizado", { id })
  } catch (err) {
    logger.error("pdv", "falha ao atualizar produto", err); throw err
  }
}

export async function deleteProduct(tenantId: string, id: string) {
  logger.info("pdv", "removendo produto", { id })
  try {
    await deleteDoc(doc(db, "tenants", tenantId, "products", id))
    logger.success("pdv", "produto removido", { id })
  } catch (err) {
    logger.error("pdv", "falha ao remover produto", err); throw err
  }
}

export async function uploadProductImage(tenantId: string, file: File): Promise<string> {
  logger.info("pdv", "enviando imagem de produto", { size: file.size })
  try {
    const ext = file.name.split(".").pop() || "png"
    const path = `tenants/${tenantId}/products/${Date.now()}.${ext}`
    const storageRef = ref(storage, path)
    await uploadBytes(storageRef, file)
    const url = await getDownloadURL(storageRef)
    logger.success("pdv", "imagem de produto enviada")
    return url
  } catch (err) {
    logger.error("pdv", "falha ao enviar imagem de produto", err); throw err
  }
}
