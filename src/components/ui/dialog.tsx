"use client"

import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { motion, AnimatePresence } from "motion/react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * Dialog (Radix wrapper) — usado no ExitPopup e BioLinkDialog.
 *
 * Visual: fundo SÓLIDO branco (não herda transparência). Anima entrada/saída
 * via motion (slide-up + fade). Mobile: drawer inferior.
 *
 * IMPORTANTE: não usar `forceMount` no Portal/Overlay. O overlay só é
 * montado enquanto o dialog está aberto (Radix controla via Root.open).
 */

export const Dialog = DialogPrimitive.Root
export const DialogTrigger = DialogPrimitive.Trigger
export const DialogClose = DialogPrimitive.Close

const DialogPortal = DialogPrimitive.Portal

/* Overlay com fade (motion, dentro do AnimatePresence no DialogContent). */
const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    asChild
    forceMount
    {...props}
  >
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      className={cn("fixed inset-0 z-[80] bg-black/55 backdrop-blur-sm", className)}
    />
  </DialogPrimitive.Overlay>
))
DialogOverlay.displayName = "DialogOverlay"

export interface DialogContentProps extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> {
  /** Render como drawer inferior (mobile). Default = card centralizado. */
  drawerOnMobile?: boolean
}

/** Context interno com o estado `open` do Dialog.Root, para a animação
 *  saber quando animar saída também. */
const DialogOpenContext = React.createContext<boolean>(false)

function useDialogOpen(): boolean {
  return React.useContext(DialogOpenContext)
}

/**
 * Wrapper sobre DialogPrimitive.Root que também provê `open` via Context
 * para os filhos (DialogContent) poderem usar AnimatePresence.
 */
export const DialogRoot: React.FC<React.ComponentProps<typeof Dialog>> = (props) => {
  const open = !!props.open
  return (
    <DialogOpenContext.Provider value={open}>
      <DialogPrimitive.Root {...props} />
    </DialogOpenContext.Provider>
  )
}

/**
 * DialogContent com animação motion. Render condicional (só quando open=true),
 * com AnimatePresence envolvendo pra animar saída.
 */
const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  DialogContentProps
>(({ className, children, drawerOnMobile, ...props }, ref) => {
  const open = useDialogOpen()
  return (
    <AnimatePresence>
      {open && (
        <DialogPortal>
          <DialogOverlay />
          <DialogPrimitive.Content
            ref={ref}
            asChild
            forceMount
            {...props}
          >
            <motion.div
              initial={drawerOnMobile ? { y: "100%", opacity: 0.6 } : { opacity: 0, y: 24, scale: 0.96 }}
              animate={drawerOnMobile ? { y: 0, opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
              exit={drawerOnMobile ? { y: "100%", opacity: 0.6 } : { opacity: 0, y: 16, scale: 0.97 }}
              transition={{ type: "spring", stiffness: 360, damping: 32, mass: 0.8 }}
              className={cn(
                "fixed left-1/2 top-1/2 z-[90] w-full max-w-md -translate-x-1/2 -translate-y-1/2 gap-4 rounded-2xl border border-[--border] p-6 shadow-2xl focus:outline-none",
                "bg-white text-[#111827] dark:bg-[#0f172a] dark:text-[#f8fafc]",
                drawerOnMobile && "max-sm:left-0 max-sm:right-0 max-sm:top-auto max-sm:bottom-0 max-sm:max-w-full max-sm:translate-x-0 max-sm:translate-y-0 max-sm:rounded-b-none max-sm:rounded-t-2xl",
                className,
              )}
            >
              {children}
              <DialogPrimitive.Close
                aria-label="Fechar"
                className="absolute right-3 top-3 rounded-md p-1 text-[#6b7280] transition-colors hover:bg-[#f3f4f6] hover:text-[#111827] focus:outline-none dark:text-[#94a3b8] dark:hover:bg-[#1e293b] dark:hover:text-[#f8fafc]"
              >
                <X className="h-4 w-4" />
              </DialogPrimitive.Close>
            </motion.div>
          </DialogPrimitive.Content>
        </DialogPortal>
      )}
    </AnimatePresence>
  )
})
DialogContent.displayName = "DialogContent"

export const DialogHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex flex-col gap-1 text-left", className)} {...props} />
)

export const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn("text-base font-semibold text-[#111827] dark:text-[#f8fafc]", className)}
    {...props}
  />
))
DialogTitle.displayName = "DialogTitle"

export const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-sm text-[#6b7280] dark:text-[#94a3b8]", className)}
    {...props}
  />
))
DialogDescription.displayName = "DialogDescription"

export { DialogOverlay, DialogPortal, DialogContent }