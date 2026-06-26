import {
  collection, doc, addDoc, updateDoc, deleteDoc, onSnapshot,
  query, orderBy, serverTimestamp, writeBatch, arrayUnion, type Timestamp,
} from "firebase/firestore"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { db, storage } from "@/lib/firebase/config"
import { logger } from "@/lib/logger"

export const PRODUCT_CATEGORIES = [
  "Películas", "Capas", "Carregadores", "Cabos", "Fones", "Aparelhos",
  "Áudio / Gravação", "Serviços", "Acessórios", "Outros",
] as const

export interface Product {
  id: string
  name: string
  description?: string
  price: number
  category?: string
  sku?: string
  brand?: string
  cost?: number
  stock?: number
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

/** Cria vários produtos de uma vez (importação). Lotes de 450. */
export async function bulkCreateProducts(tenantId: string, inputs: ProductInput[]) {
  logger.info("pdv", "importação em massa", { total: inputs.length })
  try {
    let created = 0
    for (let i = 0; i < inputs.length; i += 450) {
      const batch = writeBatch(db)
      for (const input of inputs.slice(i, i + 450)) {
        batch.set(doc(productsCol(tenantId)), { ...input, createdAt: serverTimestamp() })
        created++
      }
      await batch.commit()
    }
    logger.success("pdv", "produtos importados", { created })
    return created
  } catch (err) {
    logger.error("pdv", "falha na importação em massa", err); throw err
  }
}

/** Adiciona uma categoria personalizada ao tenant. */
export async function addProductCategory(tenantId: string, name: string) {
  const clean = name.trim()
  if (!clean) return
  logger.info("pdv", "adicionando categoria", { name: clean })
  try {
    await updateDoc(doc(db, "tenants", tenantId), { productCategories: arrayUnion(clean) })
    logger.success("pdv", "categoria adicionada", { name: clean })
  } catch (err) {
    logger.error("pdv", "falha ao adicionar categoria", err); throw err
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
