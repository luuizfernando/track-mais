"use client"

import type React from "react"
import { useState } from "react"
import axios from "axios"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"

interface VehicleFormProps {
  onCancel?: () => void
  onSuccess?: () => void
}

export function VehicleForm({ onCancel, onSuccess }: VehicleFormProps = {}) {
  const { toast } = useToast()
  const [formData, setFormData] = useState({
    model: "",
    plate: "",
    phone: "",
    maximumLoad: "",
    description: "",
  })

  const resetForm = () => {
    setFormData({
      model: "",
      plate: "",
      phone: "",
      maximumLoad: "",
      description: "",
    })
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      setIsLoading(true)
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null

      const payload = {
        model: formData.model,
        plate: formData.plate,
        phone: formData.phone,
        maximumLoad: Number(formData.maximumLoad),
        description: formData.description,
      }

      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/vehicles/register-vehicle`,
        payload,
        token
          ? {
            headers: { Authorization: `Bearer ${token}` },
          }
          : undefined,
      )

      resetForm()
      toast?.({ description: "Cadastro realizado com sucesso!", variant: "success" })
      onSuccess?.()
    } catch (error: any) {
      const msg = error?.response?.data?.message || "Erro ao cadastrar veículo"
      toast?.({ description: String(msg) })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    resetForm()
    onCancel?.()
  }

  // Renderização padrão do formulário
  return (
    <Card className="w-full max-w-5xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-semibold text-gray-900">
          Cadastrar Veículo
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 md:p-6 lg:p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <div className="flex flex-col space-y-1">
              <Label htmlFor="model" className="text-sm font-medium text-gray-700">Modelo</Label>
              <Input
                id="model"
                placeholder="Ex.: Volvo FH 540"
                value={formData.model}
                onChange={(e) => handleInputChange("model", e.target.value)}
                className="h-12 text-base border-gray-300 rounded-lg"
                required
              />
            </div>
            <div className="flex flex-col space-y-1">
              <Label htmlFor="plate" className="text-sm font-medium text-gray-700">Placa</Label>
              <Input
                id="plate"
                placeholder="Ex.: ABC-1234"
                value={formData.plate}
                onChange={(e) => handleInputChange("plate", e.target.value)}
                className="h-12 text-base border-gray-300 rounded-lg"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            <div className="flex flex-col space-y-1">
              <Label htmlFor="phone" className="text-sm font-medium text-gray-700">Telefone para contato</Label>
              <Input
                id="phone"
                placeholder="Ex.: 61 99999-9999"
                value={formData.phone}
                onChange={(e) => handleInputChange("phone", e.target.value)}
                className="h-12 text-base border-gray-300 rounded-lg"
                required
              />
            </div>
            <div className="flex flex-col space-y-1">
              <Label htmlFor="maximumLoad" className="text-sm font-medium text-gray-700">Carga Máxima de transporte</Label>
              <Input
                id="maximumLoad"
                type="number"
                placeholder="Ex.: 5000"
                value={formData.maximumLoad}
                onChange={(e) => handleInputChange("maximumLoad", e.target.value)}
                className="h-12 text-base border-gray-300 rounded-lg"
              />
            </div>
            <div className="flex flex-col space-y-1">
              <Label htmlFor="description" className="text-sm font-medium text-gray-700">Observações</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                className="h-12 text-base border-gray-300 rounded-lg"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-4 pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              className="px-8 py-2 h-10 border-yellow-300 text-gray-700 hover:bg-gray-50 bg-transparent"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="px-8 py-2 h-10 bg-yellow-400 hover:bg-yellow-500 text-black font-medium"
              disabled={isLoading}
            >
              {isLoading ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}