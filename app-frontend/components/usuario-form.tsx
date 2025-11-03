"use client"

import type React from "react"
import { useState } from "react"
import axios from "axios"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface UsuarioFormProps {
  onCancel?: () => void
  onSuccess?: () => void
}

export function UsuarioForm({ onCancel, onSuccess }: UsuarioFormProps = {}) {
  const { toast } = useToast()
  const [formData, setFormData] = useState({
    nome: "",
    username: "",
    perfil: "",
    senha: "",
    confirmarSenha: "",
  })

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const { nome, username, perfil, senha, confirmarSenha } = formData

    if (senha !== confirmarSenha) {
      toast?.({
        title: "Erro",
        description: "As senhas nao coincidem!",
      })
      return
    }

    try {
      const token = localStorage.getItem("token")

      if (!token) {
        toast?.({
          title: "Token nao encontrado",
          description: "Faça login novamente.",
        })
        return
      }

      await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/usuarios/cadastrar-usuario`,
        {
          name: nome,
          username,
          password: senha,
          role: perfil,
        }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
      )

      toast?.({
        description: "Cadastro realizado com sucesso!",
        variant: "success",
      })

      setFormData({
        nome: "",
        username: "",
        perfil: "",
        senha: "",
        confirmarSenha: "",
      })
      onSuccess?.()
    } catch (error: any) {
      console.error("Erro ao cadastrar usuario:", error.response?.data || error)
      const msg = error.response?.data?.message || "Erro ao cadastrar usuario"
      toast?.({
        title: "Erro",
        description: msg,
      })
    }
  }

  const handleCancel = () => {
    setFormData({
      nome: "",
      username: "",
      perfil: "",
      senha: "",
      confirmarSenha: "",
    })
    onCancel?.()
  }

  return (
    <Card className="max-w-full h-250 mx-auto">
      <CardHeader className="pb-4">
        <CardTitle className="text-2xl font-semibold text-gray-900">Cadastrar Usuario</CardTitle>
      </CardHeader>
      <CardContent className="p-6 md:p-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="nome" className="text-sm font-medium text-gray-600">Nome</Label>
              <Input
                id="nome"
                placeholder="Digite o nome"
                value={formData.nome}
                onChange={(e) => handleInputChange("nome", e.target.value)}
                className="h-12 rounded-2xl border border-gray-300 bg-white px-4 text-base text-gray-900 placeholder:text-gray-400"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="username" className="text-sm font-medium text-gray-600">Username</Label>
              <Input
                id="username"
                placeholder="Digite o username"
                value={formData.username}
                onChange={(e) => handleInputChange("username", e.target.value)}
                className="h-12 rounded-2xl border border-gray-300 bg-white px-4 text-base text-gray-900 placeholder:text-gray-400"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="perfil" className="text-sm font-medium text-gray-600">Cargo</Label>
              <Select
                onValueChange={(value) => handleInputChange("perfil", value)}
                value={formData.perfil}
              >
                <SelectTrigger id="perfil" className="h-12 rounded-2xl border border-gray-300 bg-white px-4 text-base text-gray-900 placeholder:text-gray-400">
                  <SelectValue placeholder="Perfil" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border border-gray-200 bg-white shadow-md">
                  <SelectItem value="admin">Administrador</SelectItem>
                  <SelectItem value="user">Usuario comum</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="senha" className="text-sm font-medium text-gray-600">Senha</Label>
              <Input
                id="senha"
                type="password"
                placeholder="Digite a senha"
                value={formData.senha}
                onChange={(e) => handleInputChange("senha", e.target.value)}
                className="h-12 rounded-2xl border border-gray-300 bg-white px-4 text-base text-gray-900 placeholder:text-gray-400"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="confirmarSenha" className="text-sm font-medium text-gray-600">Confirmar senha</Label>
              <Input
                id="confirmarSenha"
                type="password"
                placeholder="Repita a senha"
                value={formData.confirmarSenha}
                onChange={(e) => handleInputChange("confirmarSenha", e.target.value)}
                className="h-12 rounded-2xl border border-gray-300 bg-white px-4 text-base text-gray-900 placeholder:text-gray-400"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-4">
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
            >
              Salvar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
