
"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface PartnerModalProps {
  isOpen: boolean
  onClose: () => void
  partner: { _id: string; CODPARC: string; NOMEPARC: string; CGC_CPF: string; CODCID?: string; ATIVO?: string; TIPPESSOA?: string } | null
  onSave: (partnerData: { CODPARC?: string; NOMEPARC: string; CGC_CPF: string; CODCID: string; ATIVO: string; TIPPESSOA: string }) => Promise<void>
}

export function PartnerModal({ isOpen, onClose, partner, onSave }: PartnerModalProps) {
  const [formData, setFormData] = useState({
    CODPARC: "",
    NOMEPARC: "",
    CGC_CPF: "",
    CODCID: "",
    ATIVO: "S",
  })
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (partner) {
      setFormData({
        CODPARC: partner.CODPARC || "",
        NOMEPARC: partner.NOMEPARC || "",
        CGC_CPF: partner.CGC_CPF || "",
        CODCID: partner.CODCID || "",
        ATIVO: partner.ATIVO || "S",
      })
    } else {
      setFormData({
        CODPARC: "",
        NOMEPARC: "",
        CGC_CPF: "",
        CODCID: "",
        ATIVO: "S",
      })
    }
  }, [partner, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    
    try {
      // Remove espaços e caracteres especiais do CPF/CNPJ para detectar o tipo
      const cleanedCpfCnpj = formData.CGC_CPF.replace(/\D/g, '')
      const tippessoa = cleanedCpfCnpj.length > 11 ? "J" : "F"
      
      const dataToSave = partner 
        ? { 
            CODPARC: formData.CODPARC, 
            NOMEPARC: formData.NOMEPARC, 
            CGC_CPF: formData.CGC_CPF,
            CODCID: formData.CODCID,
            ATIVO: formData.ATIVO,
            TIPPESSOA: tippessoa
          }
        : { 
            NOMEPARC: formData.NOMEPARC, 
            CGC_CPF: formData.CGC_CPF,
            CODCID: formData.CODCID,
            ATIVO: formData.ATIVO,
            TIPPESSOA: tippessoa
          }
      
      await onSave(dataToSave)
    } catch (error) {
      console.error("Erro ao salvar:", error)
    } finally {
      setIsSaving(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-card rounded-lg shadow-xl w-full max-w-md mx-4 p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-foreground">
            {partner ? "Editar Parceiro" : "Cadastrar Parceiro"}
          </h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {partner && (
            <div className="space-y-2">
              <Label htmlFor="CODPARC" className="text-sm font-medium text-foreground">
                Código
              </Label>
              <Input
                id="CODPARC"
                type="text"
                value={formData.CODPARC}
                className="bg-background"
                disabled
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="NOMEPARC" className="text-sm font-medium text-foreground">
              Nome do Parceiro
            </Label>
            <Input
              id="NOMEPARC"
              type="text"
              value={formData.NOMEPARC}
              onChange={(e) => setFormData({ ...formData, NOMEPARC: e.target.value })}
              className="bg-background"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="CGC_CPF" className="text-sm font-medium text-foreground">
              CPF ou CNPJ
            </Label>
            <Input
              id="CGC_CPF"
              type="text"
              value={formData.CGC_CPF}
              onChange={(e) => setFormData({ ...formData, CGC_CPF: e.target.value })}
              className="bg-background"
              placeholder="Apenas números"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ATIVO" className="text-sm font-medium text-foreground">
              Ativo
            </Label>
            <select
              id="ATIVO"
              value={formData.ATIVO}
              onChange={(e) => setFormData({ ...formData, ATIVO: e.target.value })}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              required
            >
              <option value="S">S</option>
              <option value="N">N</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="CODCID" className="text-sm font-medium text-foreground">
              Código da Cidade
            </Label>
            <Input
              id="CODCID"
              type="text"
              value={formData.CODCID}
              onChange={(e) => setFormData({ ...formData, CODCID: e.target.value })}
              className="bg-background"
              placeholder="Ex: 1510"
              required
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose} 
              className="flex-1 bg-transparent"
              disabled={isSaving}
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
              disabled={isSaving}
            >
              {isSaving ? "Salvando..." : (partner ? "Salvar" : "Cadastrar")}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
