"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, ShoppingCart, Minus, Plus, Info, MessageCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { Product } from "@/lib/types"
import { useCartStore } from "@/store"
import { toast } from "sonner"
import Image from "next/image"
import ProductSelector from "./product-selector"
import { ProductOptionsMultiple } from "./product-options-multiple"
import { Alert, AlertDescription } from "../ui/alert"
import { generateCartItemId } from "@/lib/utils"

interface ProductOptionsModalProps {
  product: Product
  isOpen: boolean
  onClose: () => void
}

export default function ProductOptionsModal({ product, isOpen, onClose }: ProductOptionsModalProps) {
  const [selectedOptionId, setSelectedOptionId] = useState<string>("")
  const [selectedOptionIds, setSelectedOptionIds] = useState<string[]>([])
  const [quantity, setQuantity] = useState<number>(1)
  const { addToCart } = useCartStore()

  const selectedOption = product.options?.find((option) => option.id === selectedOptionId) || null
  const selectedOptions = product.options?.filter((option) => selectedOptionIds.includes(option.id || '')) || []

  const handleAddToCart = () => {
    if (!selectedOption && selectedOptions.length === 0 && !isVariableOnly) return

    const options = [
      ...(selectedOption ? [selectedOption] : []),
      ...(selectedOptions || [])
    ]

    const productWithSelectedOption = {
      ...product,
      options,
    }

    // Add the specified quantity to the cart
    for (let i = 0; i < quantity; i++) {
      addToCart(productWithSelectedOption as Product)
    }

    const quantityText = quantity === 1 ? "" : ` (${quantity} unidades)`
    toast.success(`${product.name} ${quantityText} agregado al carrito`)
    onClose()
    setSelectedOptionId("")
    setSelectedOptionIds([])
    setQuantity(1)
  }

  const handleClose = () => {
    onClose()
    setSelectedOptionId("")
    setSelectedOptionIds([])
    setQuantity(1)
  }

  const handleQuantityChange = (change: number) => {
    const newQuantity = quantity + change
    if (newQuantity >= 1 && newQuantity <= 99) {
      setQuantity(newQuantity)
    }
  };

  const variablePriceOptions = product.groupedOptions?.variable || []
  const sizeOptions = product.groupedOptions?.size || []
  const ingredientOptions = product.groupedOptions?.ingredient || []

  const hasSizeOptions = sizeOptions.length > 0
  const hasIngredientOptions = ingredientOptions.length > 0
  const hasVariableOptions = variablePriceOptions.length > 0

  const isVariableOnly = hasVariableOptions && !hasSizeOptions && !hasIngredientOptions

  const isReadyToAdd =
    isVariableOnly
      ? true
      : hasSizeOptions
        ? !!selectedOption
        : hasIngredientOptions
          ? selectedOptionIds.length > 0
          : true


  const showQuantitySelector = selectedOption || selectedOptionIds.length > 0

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.1 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={handleClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.1 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="bg-muted rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-hidden border">
              {/* Header */}
              <div className="flex justify-between items-center p-4 border-b">
                <h2 className="text-lg font-semibold">{hasVariableOptions ? "Precio Variable" : "Elegir opción"}</h2>
                <button
                  onClick={handleClose}
                  className="p-1 rounded-full hover:bg-muted transition-colors"
                  aria-label="Cerrar modal"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {/* Content */}
              <div className="p-4 max-h-[calc(90vh-140px)] overflow-y-auto">
                {/* Product Info */}
                <div className="flex gap-3 mb-6">
                  <div className="relative h-20 w-20 rounded-md overflow-hidden flex-shrink-0">
                    <Image
                      src={product.image || "/placeholder.svg?height=80&width=80"}
                      alt={product.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium">{product.name}</h3>
                    {product.description && <p className="text-muted-foreground text-sm mt-1">{product.description}</p>}
                    <div className="mt-2">
                      <span className="text-lg font-bold">{`${product.price ? `$ ${product.price}` : ''}`}</span>
                    </div>
                  </div>
                </div>

                {/* Options for variable price */}
                {
                  product.groupedOptions?.variable &&
                  <>
                    <Alert className="mb-6 border-orange-200 bg-orange-50">
                      <Info className="h-4 w-4 text-orange-600" />
                      <AlertDescription className="text-orange-800">
                        <div className="space-y-2">
                          <p className="font-medium">💰 Precio variable según tamaño</p>
                          <p className="text-sm">
                            El precio de este producto varía dependiendo del tamaño y disponibilidad del día.
                          </p>
                        </div>
                      </AlertDescription>
                    </Alert>

                    {/* How it works */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                      <div className="flex items-start gap-3">
                        <MessageCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                        <div className="space-y-2">
                          <h4 className="font-medium text-blue-900">¿Cómo funciona?</h4>
                          <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                            <li>Agrega el producto a tu carrito</li>
                            <li>Realiza tu pedido por WhatsApp</li>
                            <li>Te confirmaremos precio y disponibilidad</li>
                          </ol>
                        </div>
                      </div>
                    </div>
                  </>
                }

                {/* Option Selector for ingredients */}
                <div className="flex flex-col gap-3">
                  {
                    product.groupedOptions?.ingredient &&
                    <ProductOptionsMultiple
                      options={product.groupedOptions?.ingredient}
                      selectedOptionIds={selectedOptionIds}
                      setSelectedOptionIds={setSelectedOptionIds}
                    />
                  }

                  {/* Options Selector for sizes */}
                  {
                    product.groupedOptions?.size &&
                    <ProductSelector
                      options={product.groupedOptions?.size}
                      selectedOptionId={selectedOptionId}
                      setSelectedOptionId={setSelectedOptionId}
                    />
                  }

                  {/* Quantity Selector */}
                  {showQuantitySelector && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-2"
                    >
                      <h4 className="font-medium">Cantidad:</h4>
                      <div className="flex items-center justify-center gap-4 p-3 bg-muted/30 rounded-lg">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleQuantityChange(-1)}
                          disabled={quantity <= 1}
                          className="h-8 w-8"
                        >
                          <Minus className="h-4 w-4" />
                        </Button>

                        <div className="flex items-center justify-center min-w-[3rem]">
                          <span className="text-lg font-semibold">{quantity}</span>
                        </div>

                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleQuantityChange(1)}
                          disabled={quantity >= 99}
                          className="h-8 w-8"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 border-t bg-muted/30">
                <Button
                  onClick={handleAddToCart}
                  disabled={!isReadyToAdd}
                  className="w-full"
                >
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  Agregar al carrito {quantity > 1 && `(${quantity})`}
                </Button>

                {
                  product.groupedOptions?.variable &&
                  <p className="text-xs text-center text-muted-foreground mt-3">
                    El precio final se confirmará por WhatsApp
                  </p>
                }
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
