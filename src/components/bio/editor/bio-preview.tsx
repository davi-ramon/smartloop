"use client"

import { BioPageView } from "@/components/bio/bio-page-view"
import type { BioLink, BioProfile } from "@/lib/data/bio"

/**
 * Preview do editor — reusa BioPageView (mesma JSX do público).
 * Mobile-first: moldura tipo celular (`max-w-[340px]`) com borda fake.
 */
export function BioPreview({ profile, links }: { profile: BioProfile; links: BioLink[] }) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs font-medium text-[--muted-foreground]">
        Visualização em tempo real
      </p>
      <div
        className="mx-auto w-full max-w-[340px] overflow-hidden rounded-[28px] border-[8px] border-[--foreground]/10 bg-[--card] shadow-2xl"
      >
        <BioPageView profile={profile} links={links} />
      </div>
      <p className="text-center text-[10px] text-[--muted-foreground]">
        Salvar no editor reflete em tempo real em smartloop.com.br/bio
      </p>
    </div>
  )
}