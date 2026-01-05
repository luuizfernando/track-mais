"use client"

import type React from "react"

import axios from 'axios';

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
type FormDataType = {
  code: number | null;
  name: string;
  price: string;
  weight: string;
  unit: string;
  expiration: string;
  expiration_unit: string;
  informacoesAdicionais: string;
};
interface ProdutoFormProps {
  onCancel?: () => void
  onSuccess?: () => void
}

export function ProductForm({ onCancel, onSuccess }: ProdutoFormProps = {}) {
  const { toast } = useToast()
  const [error, setError] = useState("");
  const [formData, setFormData] = useState<FormDataType>({
    code: null,
    name: "",
    price: "",
    weight: "",
    unit: "",
    expiration: "",
    expiration_unit: "",
    informacoesAdicionais: "",
  })

  type FormField = keyof FormDataType;

  const handleInputChange = (field: FormField, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: field === "code" ? Number(value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      // Basic validation
      if (formData.code === null || Number.isNaN(Number(formData.code))) {
        setError("Informe um código numérico válido.");
        return;
      }
      if (!formData.name.trim()) {
        setError("Informe a descrição do produto.");
        return;
      }

      // Normalize decimal strings (accept 10,50 -> 10.50)
      const toDecimal = (v: string) => (v || "").replace(/\./g, "").replace(/,/g, ".");

      const payload = {
        code: Number(formData.code),
        name: formData.name,
        price: toDecimal(formData.price),
        weight: toDecimal(formData.weight),
        unit: formData.unit,
        expiration: toDecimal(formData.expiration),
        expiration_unit: formData.expiration_unit,
      }

      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/products/register-products`,
        payload
      );
      toast?.({ description: "Cadastro realizado com sucesso!", variant: "success" })
      handleRegisterAnother()
      onSuccess?.()
      return response.data;
    } catch (err) {
      let errorMessage = 'Erro ao cadastrar produto';
      if (axios.isAxiosError(err) && err.response) {
        const msg = err.response.data?.message;
        if (Array.isArray(msg)) errorMessage = msg.join("\n");
        else errorMessage = msg || 'Falha no cadastro do produto';
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }

      setError(errorMessage);
    }
  };

  const handleCancel = () => {
    setFormData({
      code: null,
      name: "",
      price: "",
      weight: "",
      unit: "",
      expiration: "",
      expiration_unit: "",
      informacoesAdicionais: "",
    })
  }

  const handleRegisterAnother = () => {
    handleCancel()
    onCancel?.()
  }

  return (
    <Card className="max-w-full h-250 mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-semibold text-gray-900">Cadastrar Produto</CardTitle>
      </CardHeader>
      <CardContent className="p-4 md:p-6 lg:p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* First row */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            <div>
              <Input
                placeholder="Código"
                value={formData.code ?? ""}
                onChange={(e) => handleInputChange("code", e.target.value)}
                className="h-12 text-base border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <Input
                placeholder="Descrição"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                className="h-12 text-base border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <Input
                placeholder="Preço (R$)"
                value={formData.price}
                onChange={(e) => handleInputChange("price", e.target.value)}
                className="h-12 text-base border-gray-300 rounded-lg"
              />
            </div>
          </div>

          {/* Second row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <div>
              <Input
                placeholder="Peso"
                value={formData.weight}
                onChange={(e) => handleInputChange("weight", e.target.value)}
                className="h-12 text-base border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <Select value={formData.unit} onValueChange={(value) => handleInputChange("unit", value)}>
                <SelectTrigger className="h-12 text-base border-gray-300 rounded-lg">
                  <SelectValue placeholder="Unidade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="kg">Quilograma (kg)</SelectItem>
                  <SelectItem value="g">Grama (g)</SelectItem>
                  <SelectItem value="l">Litro (l)</SelectItem>
                  <SelectItem value="ml">Mililitro (ml)</SelectItem>
                  <SelectItem value="un">Unidade</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Third row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <div>
              <Input
                placeholder="Validade"
                value={formData.expiration}
                onChange={(e) => handleInputChange("expiration", e.target.value)}
                className="h-12 text-base border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <Select value={formData.expiration_unit} onValueChange={(value) => handleInputChange("expiration_unit", value)}>
                <SelectTrigger className="h-12 text-base border-gray-300 rounded-lg">
                  <SelectValue placeholder="Unidade de tempo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dias">Dias</SelectItem>
                  <SelectItem value="semanas">Semanas</SelectItem>
                  <SelectItem value="meses">Meses</SelectItem>
                  <SelectItem value="anos">Anos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Additional information */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Informações adicionais</label>
            <Textarea
              placeholder="Digite informações adicionais sobre o produto..."
              value={formData.informacoesAdicionais}
              onChange={(e) => handleInputChange("informacoesAdicionais", e.target.value)}
              className="min-h-[120px] text-base border-gray-300 rounded-lg resize-none"
            />
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
            <Button type="submit" className="px-8 py-2 h-10 bg-yellow-400 hover:bg-yellow-500 text-black font-medium">
              Salvar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
