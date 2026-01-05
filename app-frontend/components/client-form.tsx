"use client";

import type React from "react";
import { useState } from "react";
import InputMask from "react-input-mask";
import axios from "axios";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ClientFormProps {
  onCancel?: () => void;
  onSuccess?: () => void;
}

export function ClientForm({ onCancel, onSuccess }: ClientFormProps = {}) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    code: "",
    legal_name: "",
    fantasy_name: "",
    cnpj_cpf: "",
    state_subscrition: "",
    email: "",
    phone: "",
    state: "",
    neighborhood: "",
    address: "",
    cep: "",
    corporate_network: "",
    payment_method: "",
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const resetForm = () => {
    setFormData({
      code: "",
      legal_name: "",
      fantasy_name: "",
      cnpj_cpf: "",
      state_subscrition: "",
      email: "",
      phone: "",
      state: "",
      neighborhood: "",
      address: "",
      cep: "",
      corporate_network: "",
      payment_method: "",
    });
    setErrors({});
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    // Limpa o erro ao digitar
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const toDigits = (value: string) => (value || "").replace(/\D/g, "");

  const validate = () => {
    const errs: { [k: string]: string } = {};
    if (!formData.code?.trim()) errs.code = "Informe o código do cliente";
    if (!formData.legal_name?.trim()) errs.legal_name = "Informe a razão social";
    if (!formData.fantasy_name?.trim()) errs.fantasy_name = "Informe o nome fantasia";
    if (!formData.cnpj_cpf?.trim()) errs.cnpj_cpf = "Informe o CNPJ/CPF";
    if (!formData.email?.trim()) errs.email = "Informe o email";
    if (!formData.phone?.trim()) errs.phone = "Informe o telefone";
    if (!formData.state?.trim()) errs.state = "Informe o estado";
    if (!formData.neighborhood?.trim()) errs.neighborhood = "Informe o bairro";
    if (!formData.address?.trim()) errs.address = "Informe o endereço";
    if (!formData.cep?.trim()) errs.cep = "Informe o CEP";
    if (!formData.corporate_network?.trim()) errs.corporate_network = "Informe a rede";
    if (!formData.payment_method?.trim()) errs.payment_method = "Informe a forma de pagamento";

    // Numéricos
    if (formData.code && !/^\d+$/.test(formData.code)) errs.code = "Código deve conter apenas números";
    if (formData.cnpj_cpf && !/^\d+$/.test(toDigits(formData.cnpj_cpf))) errs.cnpj_cpf = "CNPJ/CPF deve conter apenas números";
    if (formData.phone && !/^\d+$/.test(toDigits(formData.phone))) errs.phone = "Telefone deve conter apenas números";
    if (formData.cep && !/^\d+$/.test(toDigits(formData.cep))) errs.cep = "CEP deve conter apenas números";

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      code: formData.code,
      legal_name: formData.legal_name,
      fantasy_name: formData.fantasy_name,
      cnpj_cpf: toDigits(formData.cnpj_cpf),
      state_subscrition: formData.state_subscrition,
      email: formData.email,
      phone: toDigits(formData.phone),
      state: formData.state,
      neighborhood: formData.neighborhood,
      address: formData.address,
      cep: toDigits(formData.cep),
      corporate_network: formData.corporate_network,
      payment_method: formData.payment_method,
    };

    try {
      if (!validate()) {
        toast?.({ description: "Preencha os campos obrigatórios.", variant: "destructive" });
        return;
      }
      const token = localStorage.getItem("token");
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/customers/register-customer`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast?.({
        description: "Cadastro realizado com sucesso!",
        variant: "success",
      });
      resetForm();
      onSuccess?.();
    } catch (error: any) {
      const errMessages: { [key: string]: string } = {};

      const msg = error.response?.data?.message;

      const mapMsg = (m: string) => {
        if (/CNPJ\/CPF/i.test(m)) errMessages.cnpj_cpf = m;
        else if (/Telefone/i.test(m)) errMessages.phone = m;
        else if (/Email/i.test(m)) errMessages.email = m;
        else if (/c[oó]digo|code/i.test(m)) errMessages.code = m;
        else if (/raz[aã]o social|legal_name/i.test(m)) errMessages.legal_name = m;
        else if (/nome fantasia|fantasy_name/i.test(m)) errMessages.fantasy_name = m;
        else if (/state_subscrition|inscri[cç][aã]o/i.test(m)) errMessages.state_subscrition = m;
        else if (/endere[cç]o|address/i.test(m)) errMessages.address = m;
        else if (/bairro|neighborhood/i.test(m)) errMessages.neighborhood = m;
        else if (/estado\b|state\b/i.test(m)) errMessages.state = m;
        else if (/cep/i.test(m)) errMessages.cep = m;
        else if (/rede|corporate_network/i.test(m)) errMessages.corporate_network = m;
        else if (/forma de pagamento|payment_method/i.test(m)) errMessages.payment_method = m;
      };

      if (Array.isArray(msg)) {
        msg.forEach((m: string) => mapMsg(String(m)));
      } else if (typeof msg === "string") {
        mapMsg(msg);
        if (Object.keys(errMessages).length === 0) errMessages.geral = msg;
      } else {
        errMessages.geral = "Ocorreu um erro ao cadastrar o cliente.";
      }

      setErrors(errMessages);
    }
  };

  const handleCancel = () => {
    resetForm();
    onCancel?.();
  };

  const showError = (field: string) => {
    return errors[field] ? (
      <span className="text-red-600 text-sm mt-1">{errors[field]}</span>
    ) : null;
  };

  return (
    <Card className="max-w-full h-250 mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-semibold text-gray-900">
          Cadastrar Cliente
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 md:p-6 lg:p-8">
        {errors.geral && (
          <div className="mb-4 text-red-600 font-medium">{errors.geral}</div>
        )}
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            <div className="flex flex-col space-y-1">
              <label
                htmlFor="code"
                className="text-sm font-medium text-gray-700"
              >
                Código Do Cliente
              </label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) => handleInputChange("code", e.target.value)}
                className="h-12 text-base border-gray-300 rounded-lg"
              />
              {showError("code")}
            </div>

            <div className="flex flex-col space-y-1">
              <label
                htmlFor="legal_name"
                className="text-sm font-medium text-gray-700"
              >
                Razão Social
              </label>
              <Input
                id="legal_name"
                value={formData.legal_name}
                onChange={(e) =>
                  handleInputChange("legal_name", e.target.value)
                }
                className="h-12 text-base border-gray-300 rounded-lg"
              />
              {showError("legal_name")}
            </div>

            <div className="flex flex-col space-y-1">
              <label
                htmlFor="fantasy_name"
                className="text-sm font-medium text-gray-700"
              >
                Nome Fantasia
              </label>
              <Input
                id="fantasy_name"
                value={formData.fantasy_name}
                onChange={(e) =>
                  handleInputChange("fantasy_name", e.target.value)
                }
                className="h-12 text-base border-gray-300 rounded-lg"
              />
              {showError("nofantasy_nameme")}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            <div className="flex flex-col space-y-1">
              <label
                htmlFor="cnpj_cpf"
                className="text-sm font-medium text-gray-700"
              >
                CNPJ/CPF
              </label>
              <Input
                id="cnpj_cpf"
                value={formData.cnpj_cpf}
                onChange={(e) => handleInputChange("cnpj_cpf", e.target.value)}
                className="h-12 text-base border-gray-300 rounded-lg"
              />
              {showError("cnpj_cpf")}
            </div>

            <div className="flex flex-col space-y-1">
              <label
                htmlFor="state_subscrition"
                className="text-sm font-medium text-gray-700"
              >
                Inscrição Estadual
              </label>
              <Input
                id="state_subscrition"
                value={formData.state_subscrition}
                onChange={(e) =>
                  handleInputChange("state_subscrition", e.target.value)
                }
                className="h-12 text-base border-gray-300 rounded-lg"
              />
              {showError("state_subscrition")}
            </div>
            <div className="flex flex-col space-y-1">
              <label
                htmlFor="corporate_network"
                className="text-sm font-medium text-gray-700"
              >
                Rede
              </label>
              <Input
                id="corporate_network"
                placeholder="Ex.: Rede Cerramix"
                value={formData.corporate_network}
                onChange={(e) =>
                  handleInputChange("corporate_network", e.target.value)
                }
                className="h-12 text-base border-gray-300 rounded-lg"
              />
              {showError("corporate_network")}
            </div>
          </div>

          {/* Contact Section */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Contato</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <div className="flex flex-col space-y-1">
                <label
                  htmlFor="email"
                  className="text-sm font-medium text-gray-700"
                >
                  Email
                </label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  className="h-12 text-base border-gray-300 rounded-lg"
                />
                {showError("email")}
              </div>
              <div className="flex flex-col space-y-1">
                <label
                  htmlFor="phone"
                  className="text-sm font-medium text-gray-700"
                >
                  Telefone
                </label>
                <InputMask
                  mask="(99) 9999-9999"
                  maskPlaceholder={null}
                  value={formData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                >
                  {(inputProps: React.ComponentProps<"input">) => (
                    <Input
                      {...inputProps}
                      id="phone"
                      placeholder="(99) 99999-9999"
                      className="h-12 text-base border-gray-300 rounded-lg"
                    />
                  )}
                </InputMask>
                {showError("phone")}
              </div>
            </div>
          </div>

          {/* Address Section */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Endereço</h3>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <div className="flex flex-col space-y-1">
                  <label
                    htmlFor="state"
                    className="text-sm font-medium text-gray-700"
                  >
                    Estado
                  </label>
                  <Input
                    id="state"
                    placeholder="Ex.: DF"
                    value={formData.state}
                    onChange={(e) => handleInputChange("state", e.target.value)}
                    className="h-12 text-base border-gray-300 rounded-lg"
                  />
                  {showError("state")}
                </div>
                <div className="flex flex-col space-y-1">
                  <label
                    htmlFor="logadouro"
                    className="text-sm font-medium text-gray-700"
                  >
                    Bairro
                  </label>
                  <Input
                    id="neighborhood"
                    placeholder="Ex.: Asa sul"
                    value={formData.neighborhood}
                    onChange={(e) =>
                      handleInputChange("neighborhood", e.target.value)
                    }
                    className="h-12 text-base border-gray-300 rounded-lg"
                  />
                  {showError("neighborhood")}
                </div>
                <div className="flex flex-col space-y-1">
                  <label
                    htmlFor="address"
                    className="text-sm font-medium text-gray-700"
                  >
                    Endereço
                  </label>
                  <Input
                    id="address"
                    placeholder="Ex.: QS 14 CONJUNTO 07 LOTE 03/04"
                    value={formData.address}
                    onChange={(e) =>
                      handleInputChange("address", e.target.value)
                    }
                    className="h-12 text-base border-gray-300 rounded-lg"
                  />
                  {showError("address")}
                </div>
                <div className="flex flex-col space-y-1">
                  <label
                    htmlFor="cep"
                    className="text-sm font-medium text-gray-700"
                  >
                    CEP
                  </label>
                  <InputMask
                    mask="99999-999"
                    maskPlaceholder={null}
                    value={formData.cep}
                    onChange={(e) => handleInputChange("cep", e.target.value)}
                  >
                    {(inputProps: React.ComponentProps<"input">) => (
                      <Input
                        {...inputProps}
                        id="cep"
                        placeholder="12345-678"
                        className="h-12 text-base border-gray-300 rounded-lg"
                      />
                    )}
                  </InputMask>
                  {showError("cep")}
                </div>
              </div>
            </div>
          </div>

          {/* Payment Section */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Pagamento
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <div className="flex flex-col space-y-1">
                <label
                  htmlFor="payment_method"
                  className="text-sm font-medium text-gray-700"
                >
                  Forma de pagamento
                </label>
                <Input
                  id="payment_method"
                  placeholder="Ex.: Boleto Santander"
                  value={formData.payment_method}
                  onChange={(e) =>
                    handleInputChange("payment_method", e.target.value)
                  }
                  className="h-12 text-base border-gray-300 rounded-lg"
                />
                {showError("payment_method")}
              </div>
            </div>
          </div>

          {/* Actions */}
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
            >
              Salvar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
