"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import {
  ChevronLeft,
  ChevronRight,
  Check,
  Loader2,
  ChevronsUpDown,
  Store,
  Truck,
  PiggyBank,
  ClipboardPen,
  Trash2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  Command,
  CommandInput,
  CommandList,
  CommandGroup,
  CommandItem,
  CommandEmpty,
} from "@/components/ui/command";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const steps = [
  { id: "client", title: "Cliente" },
  { id: "transport", title: "Transporte" },
  { id: "product", title: "Produto" },
  { id: "review", title: "Revisão" },
];

interface FormData {
  client: string;
  clientCode?: string; // código do cliente selecionado
  driver: string;
  company: string;
  profession: string;
  experience: string;
  industry: string;
  vehicleId: string;
  sanitaryCondition: string;
  vehicleTemperature: string;
  // Etapa 3 - Produto
  invoiceNumber: string;
  productItems: { code: string; quantity: string }[];
  sisOrSisbi: string; // "sim" | "não"
  productTemperature: string;
  deliverDate: string; // ISO date (YYYY-MM-DD)
}

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

const contentVariants = {
  hidden: { opacity: 0, x: 50 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.3 } },
  exit: { opacity: 0, x: -50, transition: { duration: 0.2 } },
};

interface ApiClient {
  code: number;
  legal_name: string;
  fantasy_name: string;
}

interface ApiVehicle {
  id: number;
  model: string;
  plate: string;
  phone: string;
  maximumLoad: number | null;
  description: string | null;
}

interface ApiProduct {
  code: number;
  description: string;
  group: string;
  company: string;
}

// Resposta paginada comum dos endpoints (customers, products, vehicles)
type Paginated<T> = {
  data: T[];
  limit: number;
  offset: number;
  total?: number;
};

const OnboardingForm = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    client: "",
    clientCode: "",
    driver: "",
    company: "",
    profession: "",
    experience: "",
    industry: "",
    vehicleId: "",
    sanitaryCondition: "",
    vehicleTemperature: "",
    // Etapa 3 - Produto
    invoiceNumber: "",
    productItems: [{ code: "", quantity: "" }],
    sisOrSisbi: "",
    productTemperature: "",
    deliverDate: "",
  });

  // Estados para o combobox de clientes
  const [clients, setClients] = useState<ApiClient[]>([]);
  const [clientOpen, setClientOpen] = useState(false);
  const [reviewClientOpen, setReviewClientOpen] = useState(false);
  const [clientsLoading, setClientsLoading] = useState(false);
  const [clientsError, setClientsError] = useState<string | null>(null);
  const [clientsFullyLoaded, setClientsFullyLoaded] = useState(false);

  // Estados para veículos
  const [vehicles, setVehicles] = useState<ApiVehicle[]>([]);
  const [vehiclesLoading, setVehiclesLoading] = useState(false);
  const [vehiclesError, setVehiclesError] = useState<string | null>(null);

  // Estados para produtos
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productsError, setProductsError] = useState<string | null>(null);

  // Buscar todos os clientes paginando até completar a lista
  const fetchAllClients = async () => {
    try {
      setClientsLoading(true);
      setClientsError(null);
      const token =
        typeof window !== "undefined" ? localStorage.getItem("token") : null;

      const limit = 100; // página de 100 para reduzir requisições
      const headers = token ? { Authorization: `Bearer ${token}` } : undefined;

      // Primeira página para descobrir total
      const firstRes = await axios.get<Paginated<ApiClient> | ApiClient[]>(
        `${process.env.NEXT_PUBLIC_API_URL}/customers`,
        {
          headers,
          params: { limit, offset: 0 },
        }
      );

      const firstPayload = firstRes.data as any;
      const firstList: ApiClient[] = Array.isArray(firstPayload)
        ? firstPayload
        : Array.isArray(firstPayload?.data)
        ? firstPayload.data
        : [];
      const total: number = Array.isArray(firstPayload)
        ? firstList.length
        : Number(firstPayload?.total ?? firstList.length);

      let all = [...firstList];

      // Se houver mais páginas, buscar cada uma
      for (let offset = firstList.length; offset < total; offset += limit) {
        const pageRes = await axios.get<Paginated<ApiClient> | ApiClient[]>(
          `${process.env.NEXT_PUBLIC_API_URL}/customers`,
          {
            headers,
            params: { limit, offset },
          }
        );
        const pagePayload = pageRes.data as any;
        const pageList: ApiClient[] = Array.isArray(pagePayload)
          ? pagePayload
          : Array.isArray(pagePayload?.data)
          ? pagePayload.data
          : [];
        all = all.concat(pageList);
      }

      setClients(all);
      setClientsFullyLoaded(true);
    } catch (e: any) {
      console.error(e);
      setClientsError(
        e?.response?.status === 401
          ? "Não autorizado: verifique seu login."
          : "Erro ao carregar clientes"
      );
    } finally {
      setClientsLoading(false);
    }
  };

  // Abrir combobox de clientes: carregar todos se ainda não carregado
  const handleClientOpenChange = (open: boolean) => {
    setClientOpen(open);
    if (open && !clientsFullyLoaded && !clientsLoading) {
      void fetchAllClients();
    }
  };

  // Abrir combobox na revisão: mesma lógica
  const handleReviewClientOpenChange = (open: boolean) => {
    setReviewClientOpen(open);
    if (open && !clientsFullyLoaded && !clientsLoading) {
      void fetchAllClients();
    }
  };

  // Carregar veículos da API
  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        setVehiclesLoading(true);
        setVehiclesError(null);
        const token =
          typeof window !== "undefined" ? localStorage.getItem("token") : null;
        const res = await axios.get<Paginated<ApiVehicle> | ApiVehicle[]>(
          `${process.env.NEXT_PUBLIC_API_URL}/vehicles`,
          token ? { headers: { Authorization: `Bearer ${token}` } } : undefined
        );
        const payload = res.data as any;
        const list: ApiVehicle[] = Array.isArray(payload)
          ? payload
          : Array.isArray(payload?.data)
          ? payload.data
          : [];
        setVehicles(list);
      } catch (e: any) {
        console.error(e);
        setVehiclesError(
          e?.response?.status === 401
            ? "Não autorizado: verifique seu login/token."
            : "Erro ao carregar veículos."
        );
      } finally {
        setVehiclesLoading(false);
      }
    };
    fetchVehicles();
  }, []);

  // Carregar produtos da API
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setProductsLoading(true);
        setProductsError(null);
        const token =
          typeof window !== "undefined" ? localStorage.getItem("token") : null;
        const res = await axios.get<Paginated<ApiProduct> | ApiProduct[]>(
          `${process.env.NEXT_PUBLIC_API_URL}/products`,
          token ? { headers: { Authorization: `Bearer ${token}` } } : undefined
        );
        const payload = res.data as any;
        const list: ApiProduct[] = Array.isArray(payload)
          ? payload
          : Array.isArray(payload?.data)
          ? payload.data
          : [];
        setProducts(list);
      } catch (e: any) {
        console.error(e);
        setProductsError(
          e?.response?.status === 401
            ? "Não autorizado: verifique seu login."
            : "Erro ao carregar produtos."
        );
      } finally {
        setProductsLoading(false);
      }
    };
    fetchProducts();
  }, []);
  const updateFormData = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleSubmit = () => {
    setIsSubmitting(true);

    (async () => {
      try {
        const token =
          typeof window !== "undefined" ? localStorage.getItem("token") : null;

        if (!token) {
          throw new Error("Token de autenticação não encontrado.");
        }

        // Extrair userId do JWT (campo sub)
        let userId = 0;
        try {
          const payloadBase64 = token.split(".")[1];
          const payloadJson = JSON.parse(atob(payloadBase64));
          userId = Number(payloadJson?.sub ?? 0);
        } catch (e) {
          console.warn("Falha ao decodificar JWT:", e);
        }

        if (!userId || Number.isNaN(userId)) {
          throw new Error("Não foi possível identificar o usuário (sub).");
        }

        // Encontrar código do cliente (BigInt em string)
        let customerCodeStr = formData.clientCode || "";
        if (!customerCodeStr) {
          const match = clients.find(
            (c) => (c.fantasy_name || c.legal_name) === formData.client
          );
          if (match?.code) customerCodeStr = String(match.code);
        }

        if (!customerCodeStr) {
          throw new Error(
            "Cliente inválido: selecione novamente para capturar o código."
          );
        }

        // Montar objetos de produtos válidos (exigem código e quantidade)
        const productList = (formData.productItems ?? [])
          .filter((it) => {
            const codeStr = (it.code || "").trim();
            const qtyStr = (it.quantity || "").trim();
            return codeStr !== "" && qtyStr !== "";
          })
          .map((it) => {
            const codeNum = Number(it.code);
            const qtyNum = Number(it.quantity);
            const found = products.find((p) => p.code === codeNum);
            return {
              code: codeNum,
              quantity: qtyNum,
              description: found?.description ?? undefined,
            };
          });

        if (productList.length === 0) {
          throw new Error("Informe ao menos um produto com quantidade.");
        }

        // Somar quantidade total com base apenas nos itens válidos
        const totalQuantity = productList
          .map((p) => Number(p.quantity))
          .reduce((acc, n) => acc + (Number.isFinite(n) ? n : 0), 0);

        if (totalQuantity <= 0) {
          throw new Error("Quantidade total inválida.");
        }

        // Converter datas para ISO (YYYY-MM-DDT00:00:00.000Z)
        const dateISO = `${formData.deliverDate}T00:00:00.000Z`;

        // Temperaturas
        const vehicleTemp = Number((formData.vehicleTemperature || "").replace(",", "."));
        const productTemp = Number((formData.productTemperature || "").replace(",", "."));

        // Placa do veículo (opcional) pela seleção de vehicleId
        const selectedPlate = vehicles.find((v) => String(v.id) === formData.vehicleId)?.plate;

        const payload = {
          quantity: totalQuantity,
          invoiceNumber: Number(formData.invoiceNumber),
          productionDate: dateISO,
          vehicleTemperature: vehicleTemp,
          hasGoodSanitaryCondition: formData.sanitaryCondition === "conforme",
          driver: formData.driver,
          userId,
          products: productList,
          customerCode: customerCodeStr,
          hasSifOrSisbi: formData.sisOrSisbi === "sim",
          productTemperature: productTemp,
          fillingDate: dateISO,
          shipmentDate: dateISO,
          deliverVehicle: selectedPlate,
        };

        const res = await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL}/daily-report`,
          payload,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        toast.success("Relatório diário criado com sucesso!");
      } catch (err: any) {
        console.error(err);
        let message = err?.response?.data?.message || err?.message || "Falha ao enviar o relatório.";
        // Se o ValidationPipe retornar uma lista de mensagens, converter em string legível
        if (Array.isArray(message)) {
          message = message.join("; ");
        }
        toast.error(message);
      } finally {
        setIsSubmitting(false);
      }
    })();
  };

  // Check if step is valid for next button
  const isStepValid = () => {
    switch (currentStep) {
      case 0:
        // Apenas exigir cliente preenchido para prosseguir
        return formData.client.trim() !== "";
      case 1:
        // Exigir motorista e veículo selecionado
        return formData.driver.trim() !== "" && formData.vehicleId.trim() !== "";
      case 2:
        // Validar campos da etapa de Produto
        const items = formData.productItems ?? [];
        const hasItems = items.length > 0;
        const allValid = hasItems && items.every((it) => (it.code || "").trim() !== "" && (it.quantity || "").trim() !== "");
        return (
          formData.invoiceNumber.trim() !== "" &&
          allValid &&
          formData.sisOrSisbi.trim() !== "" &&
          formData.deliverDate.trim() !== ""
        );
      case 3:
        // Revisão não exige preenchimento adicional para prosseguir
        return true;
      default:
        return true;
    }
  };

  const preventDefault = (e: React.MouseEvent) => {
    e.preventDefault();
  };

  return (
    <div className="w-full max-w-md sm:max-w-lg md:max-w-2xl lg:max-w-3xl mx-auto p-5">
      {/* Progress indicator */}
      <motion.div
        className="mb-8"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex justify-between mb-2">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              className="flex flex-col items-center"
              whileHover={{ scale: 1.1 }}
            >
              {index === 0 ? (
                <motion.div
                  className={cn(
                    "w-5 h-5 flex items-center justify-center rounded transition-colors duration-300",
                    index < currentStep
                      ? "text-primary"
                      : index === currentStep
                      ? "text-primary ring-primary/20"
                      : "text-muted-foreground"
                  )}
                  onClick={() => {
                    if (index <= currentStep) {
                      setCurrentStep(index);
                    }
                  }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Store className="h-4 w-4" />
                </motion.div>
              ) : index === 1 ? (
                <motion.div
                  className={cn(
                    "w-5 h-5 flex items-center justify-center rounded transition-colors duration-300",
                    index < currentStep
                      ? "text-primary"
                      : index === currentStep
                      ? "text-primary ring-primary/20"
                      : "text-muted-foreground"
                  )}
                  onClick={() => {
                    if (index <= currentStep) {
                      setCurrentStep(index);
                    }
                  }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Truck className="h-5 w-5" />
                </motion.div>
              ) : index === 2 ? (
                <motion.div
                  className={cn(
                    "w-5 h-5 flex items-center justify-center rounded transition-colors duration-300",
                    index < currentStep
                      ? "text-primary"
                      : index === currentStep
                      ? "text-primary ring-primary/20"
                      : "text-muted-foreground"
                  )}
                  onClick={() => {
                    if (index <= currentStep) {
                      setCurrentStep(index);
                    }
                  }}
                  whileTap={{ scale: 0.95 }}
                >
                  <PiggyBank className="h-5 w-5" />
                </motion.div>
              ) : index === 3 ? (
                <motion.div
                  className={cn(
                    "w-5 h-5 flex items-center justify-center rounded transition-colors duration-300",
                    index < currentStep
                      ? "text-primary"
                      : index === currentStep
                      ? "text-primary ring-primary/20"
                      : "text-muted-foreground"
                  )}
                  onClick={() => {
                    if (index <= currentStep) {
                      setCurrentStep(index);
                    }
                  }}
                  whileTap={{ scale: 0.95 }}
                >
                  <ClipboardPen className="h-5 w-5" />
                </motion.div>
              ) : (
                <motion.div
                  className={cn(
                    "w-4 h-4 rounded-full cursor-pointer transition-colors duration-300",
                    index < currentStep
                      ? "bg-primary"
                      : index === currentStep
                      ? "bg-primary ring-4 ring-primary/20"
                      : "bg-muted"
                  )}
                  onClick={() => {
                    if (index <= currentStep) {
                      setCurrentStep(index);
                    }
                  }}
                  whileTap={{ scale: 0.95 }}
                />
              )}
              <motion.span
                className={cn(
                  "text-xs mt-1.5 hidden sm:block",
                  index === currentStep
                    ? "text-primary font-medium"
                    : "text-muted-foreground"
                )}
              >
                {step.title}
              </motion.span>
            </motion.div>
          ))}
        </div>
        <div className="w-full bg-muted h-1.5 rounded-full overflow-hidden mt-2">
          <motion.div
            className="h-full bg-primary"
            initial={{ width: 0 }}
            animate={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </motion.div>

      {/* Form card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Card className="border shadow-md rounded-3xl overflow-hidden">
          <div>
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial="hidden"
                animate="visible"
                exit="exit"
                variants={contentVariants}
              >
                {/* Step 1: Client Information */}
                {currentStep === 0 && (
                  <>
                    <CardHeader>
                      <CardTitle>Comprador</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <motion.div variants={fadeInUp} className="space-y-2">
                        <Label htmlFor="client"></Label>
                        <Popover open={clientOpen} onOpenChange={handleClientOpenChange}>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              role="combobox"
                              aria-expanded={clientOpen}
                              className="w-full justify-between transition-all duration-300 focus:ring-2 focus:ring-primary/20 focus:border-primary"
                            >
                              {formData.client
                                ? formData.client
                                : "Selecionar comprador..."}
                              <ChevronsUpDown className="h-4 w-4 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="p-0">
                            <Command>
                              <CommandInput placeholder="Buscar cliente por nome ou código..." />
                              <CommandEmpty>
                                Nenhum cliente encontrado.
                              </CommandEmpty>
                              <CommandList>
                                <CommandGroup>
                                  {clientsLoading && (
                                    <div className="p-3 text-sm text-muted-foreground">
                                      Carregando...
                                    </div>
                                  )}
                                  {clientsError && (
                                    <div className="p-3 text-sm text-red-600">
                                      {clientsError}
                                    </div>
                                  )}
                                  {!clientsLoading &&
                                    !clientsError &&
                                    clients.map((c) => (
                                      <CommandItem
                                        key={c.code}
                                        value={`${[
                                          c.fantasy_name,
                                          c.legal_name,
                                          String(c.code),
                                        ]
                                          .filter(Boolean)
                                          .join(" ")}`}
                                        onSelect={() => {
                                          setFormData((prev) => ({
                                            ...prev,
                                            client: c.fantasy_name || c.legal_name,
                                            clientCode: String(c.code),
                                          }));
                                          setClientOpen(false);
                                        }}
                                      >
                                        <Check
                                          className={cn(
                                            "mr-2 h-4 w-4",
                                            formData.client ===
                                              (c.fantasy_name || c.legal_name)
                                              ? "opacity-100"
                                              : "opacity-0"
                                          )}
                                        />
                                        <span className="truncate">
                                          {c.fantasy_name || c.legal_name}
                                        </span>
                                        <span className="ml-2 text-xs text-muted-foreground">
                                          ({c.code})
                                        </span>
                                      </CommandItem>
                                    ))}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                      </motion.div>
                    </CardContent>
                  </>
                )}

                {/* Step 2: Transport Information */}
                {currentStep === 1 && (
                  <>
                    <CardHeader>
                      <CardTitle>Informações do Transporte</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <motion.div variants={fadeInUp} className="space-y-2">
                        <Label htmlFor="driver">
                          Motorista
                        </Label>
                        <Input
                          id="driver"
                          value={formData.driver}
                          onChange={(e) =>
                            updateFormData("driver", e.target.value)
                          }
                          className="transition-all duration-300 focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        />
                      </motion.div>

                      <motion.div variants={fadeInUp} className="space-y-2">
                        <Label htmlFor="vehicleId">Veículo</Label>
                        <Select
                          value={formData.vehicleId}
                          onValueChange={(value) => updateFormData("vehicleId", value)}
                        >
                          <SelectTrigger
                            id="vehicleId"
                            className="transition-all duration-300 focus:ring-2 focus:ring-primary/20 focus:border-primary"
                          >
                            <SelectValue placeholder="Selecione um veículo" />
                          </SelectTrigger>
                          <SelectContent>
                            {vehiclesLoading && (
                              <SelectItem value="__loading" disabled>
                                Carregando veículos…
                              </SelectItem>
                            )}
                            {vehiclesError && (
                              <SelectItem value="__error" disabled>
                                {vehiclesError}
                              </SelectItem>
                            )}
                            {!vehiclesLoading && !vehiclesError && vehicles.length === 0 && (
                              <SelectItem value="__empty" disabled>
                                Nenhum veículo encontrado
                              </SelectItem>
                            )}
                            {!vehiclesLoading && !vehiclesError && vehicles.map((v) => (
                              <SelectItem key={v.id} value={String(v.id)}>
                                {v.plate} — {v.model}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </motion.div>

                      <motion.div variants={fadeInUp} className="space-y-2">
                        <Label>Condições sanitárias do veículo</Label>
                        <RadioGroup
                          value={formData.sanitaryCondition}
                          onValueChange={(value) => updateFormData("sanitaryCondition", value)}
                          className="space-y-2"
                        >
                          <div className="flex items-center space-x-2 rounded-md border p-3 cursor-pointer hover:bg-accent transition-colors">
                            <RadioGroupItem value="conforme" id="sanitary-conforme" />
                            <Label htmlFor="sanitary-conforme" className="cursor-pointer w-full">Conforme</Label>
                          </div>
                          <div className="flex items-center space-x-2 rounded-md border p-3 cursor-pointer hover:bg-accent transition-colors">
                            <RadioGroupItem value="nao-conforme" id="sanitary-nao-conforme" />
                            <Label htmlFor="sanitary-nao-conforme" className="cursor-pointer w-full">Não conforme</Label>
                          </div>
                        </RadioGroup>
                      </motion.div>

                      <motion.div variants={fadeInUp} className="space-y-2">
                        <Label htmlFor="vehicleTemperature">Temperatura do veículo (°C)</Label>
                        <Input
                          id="vehicleTemperature"
                          type="number"
                          inputMode="decimal"
                          step="0.1"
                          placeholder="Ex.: 4.5"
                          value={formData.vehicleTemperature}
                          onChange={(e) => {
                            const v = e.target.value.replace(/[^0-9.,-]/g, "").replace(",", ".");
                            updateFormData("vehicleTemperature", v);
                          }}
                          className="transition-all duration-300 focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        />
                      </motion.div>
                    </CardContent>
                  </>
                )}

                {/* Step 3: Produto */}
                {currentStep === 2 && (
                  <>
                    <CardHeader>
                      <CardTitle>Produto</CardTitle>
                      <CardDescription>
                        Preencha as informações do produto expedido
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* N° Nota Fiscal */}
                      <motion.div variants={fadeInUp} className="space-y-2">
                        <Label htmlFor="invoiceNumber">N° Nota Fiscal</Label>
                        <Input
                          id="invoiceNumber"
                          inputMode="numeric"
                          placeholder="Somente números"
                          value={formData.invoiceNumber}
                          onChange={(e) => {
                            const digits = (e.target.value || "").replace(/\D/g, "");
                            updateFormData("invoiceNumber", digits);
                          }}
                          className="transition-all duration-300 focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        />
                      </motion.div>

                      {/* Produto + Quantidade por linha */}
                      <motion.div variants={fadeInUp} className="space-y-2">
                        {productsLoading ? (
                          <div className="text-sm text-muted-foreground">Carregando produtos…</div>
                        ) : productsError ? (
                          <div className="text-sm text-red-600">{productsError}</div>
                        ) : products.length === 0 ? (
                          <div className="text-sm text-muted-foreground">Nenhum produto cadastrado.</div>
                        ) : (
                          <div className="space-y-3">
                            {(formData.productItems ?? [{ code: "", quantity: "" }]).map((item, idx) => (
                              <div key={`product-row-${idx}`} className="grid grid-cols-5 gap-3">
                                <div className="col-span-3 space-y-2">
                                  <Label>Produto</Label>
                                  <Select
                                    value={item.code || ""}
                                    onValueChange={(val) => {
                                      setFormData((prev) => {
                                        const list = [...(prev.productItems ?? [])];
                                        list[idx] = { ...list[idx], code: val };
                                        return { ...prev, productItems: list };
                                      });
                                    }}
                                  >
                                    <SelectTrigger className="w-full">
                                      <SelectValue placeholder="Selecione um produto" />
                                    </SelectTrigger>
                                  <SelectContent>
                                    {products
                                      .filter((p) => {
                                        const codeStr = String(p.code);
                                        // Ocultar produtos já selecionados em outras linhas
                                        return !((formData.productItems ?? []).some((it, iIdx) => iIdx !== idx && it.code === codeStr));
                                      })
                                      .map((p) => (
                                        <SelectItem key={p.code} value={String(p.code)}>
                                          {p.description}
                                        </SelectItem>
                                      ))}
                                  </SelectContent>
                                  </Select>
                                </div>
                                <div className="col-span-2 space-y-2">
                                  <Label>Quantidade (Unidade)</Label>
                                  <div className="flex items-center gap-2">
                                    <Input
                                      inputMode="numeric"
                                      placeholder="Somente números"
                                      value={item.quantity || ""}
                                      onChange={(e) => {
                                        const digits = (e.target.value || "").replace(/\D/g, "");
                                        setFormData((prev) => {
                                          const list = [...(prev.productItems ?? [])];
                                          list[idx] = { ...list[idx], quantity: digits };
                                          return { ...prev, productItems: list };
                                        });
                                      }}
                                      className="flex-1 transition-all duration-300 focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                    />
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="icon"
                                      aria-label="Remover produto"
                                      onClick={() => {
                                        setFormData((prev) => {
                                          const list = [...(prev.productItems ?? [])];
                                          list.splice(idx, 1);
                                          const next = list.length > 0 ? list : [{ code: "", quantity: "" }];
                                          return { ...prev, productItems: next };
                                        });
                                      }}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            ))}

                            {formData.productItems && formData.productItems[0]?.code &&
                              // Exibir botão apenas se houver algum produto ainda não selecionado
                              products.some((p) => {
                                const codeStr = String(p.code);
                                return !((formData.productItems ?? []).some((it) => it.code === codeStr));
                              }) && (
                              <Button
                                type="button"
                                variant="secondary"
                                onClick={() =>
                                  setFormData((prev) => ({
                                    ...prev,
                                    productItems: [...(prev.productItems ?? []), { code: "", quantity: "" }],
                                  }))
                                }
                              >
                                Adicionar mais produtos
                              </Button>
                            )}
                          </div>
                        )}
                      </motion.div>

                      {/* SIF ou SISBI? */}
                      <motion.div variants={fadeInUp} className="space-y-2">
                        <Label>SIF ou SISBI?</Label>
                        <RadioGroup
                          value={formData.sisOrSisbi}
                          onValueChange={(v) => updateFormData("sisOrSisbi", v)}
                          className="space-y-2"
                        >
                          {[
                            { value: "sim", label: "Sim" },
                            { value: "não", label: "Não" },
                          ].map((opt, index) => (
                            <motion.div
                              key={opt.value}
                              className="flex items-center space-x-2 rounded-md border p-3 cursor-pointer hover:bg-accent transition-colors"
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              transition={{ duration: 0.2 }}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{
                                opacity: 1,
                                x: 0,
                                transition: {
                                  delay: 0.1 * index,
                                  duration: 0.3,
                                },
                              }}
                            >
                              <RadioGroupItem value={opt.value} id={`sis-${index}`} />
                              <Label htmlFor={`sis-${index}`} className="cursor-pointer w-full">
                                {opt.label}
                              </Label>
                            </motion.div>
                          ))}
                        </RadioGroup>
                      </motion.div>

                      {/* Temperatura do produto (Brasil) */}
                      <motion.div variants={fadeInUp} className="space-y-2">
                        <Label htmlFor="productTemperature">Temperatura do produto (°C)</Label>
                        <Input
                          id="productTemperature"
                          inputMode="decimal"
                          placeholder="Ex.: 4,5"
                          value={formData.productTemperature}
                          onChange={(e) => {
                            // Permitir dígitos, vírgula e valores negativos
                            let sanitized = (e.target.value || "").replace(/[^\d,-]/g, "");
                            // Manter apenas um '-' e preferir no início
                            sanitized = sanitized.replace(/(?!^)-/g, "");
                            updateFormData("productTemperature", sanitized);
                          }}
                          className="transition-all duration-300 focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        />
                      </motion.div>

                      {/* Quantidade removida: agora é relativa a cada produto */}

                      {/* Lote - calendário */}
                      <motion.div variants={fadeInUp} className="space-y-2">
                        <Label>Lote</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" className="w-full justify-start text-left font-normal">
                              {formData.deliverDate
                                ? (() => {
                                    const [y, m, d] = formData.deliverDate.split("-").map(Number);
                                    return new Date(y, m - 1, d).toLocaleDateString("pt-BR");
                                  })()
                                : "Selecione uma data"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="p-2" align="start">
                            {/* Calendar importado do UI */}
                            {/* @ts-ignore */}
                            <Calendar
                              mode="single"
                              selected={formData.deliverDate ? (() => { const [y, m, d] = formData.deliverDate.split("-").map(Number); return new Date(y, m - 1, d); })() : undefined}
                              onSelect={(date: Date | undefined) => {
                                if (!date) return;
                                // Salvar como ISO local YYYY-MM-DD para evitar mudança de dia por timezone
                                const isoLocal = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
                                updateFormData("deliverDate", isoLocal);
                              }}
                            />
                          </PopoverContent>
                        </Popover>
                      </motion.div>
                    </CardContent>
                  </>
                )}

                {/* Step 4: Revisão */}
                {currentStep === 3 && (
                  <>
                    <CardHeader>
                      <CardTitle>Revisão</CardTitle>
                      <CardDescription>
                        Revise e ajuste as informações antes de prosseguir
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Comprador */}
                      <motion.div variants={fadeInUp} className="space-y-2">
                        <Label>Comprador</Label>
                        <div className="flex gap-3 items-center">
                          <Input value={formData.client} readOnly className="flex-1" />
                          <Popover open={reviewClientOpen} onOpenChange={handleReviewClientOpenChange}>
                            <PopoverTrigger asChild>
                              <Button type="button" variant="secondary">Trocar</Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[280px] p-0" align="start">
                              <Command>
                                <CommandInput placeholder="Buscar comprador…" />
                                <CommandList>
                                  <CommandEmpty>Nenhum comprador encontrado.</CommandEmpty>
                                  <CommandGroup>
                                    {clientsLoading && (
                                      <div className="p-2 text-sm text-muted-foreground">Carregando…</div>
                                    )}
                                    {clientsError && (
                                      <div className="p-2 text-sm text-red-600">{clientsError}</div>
                                    )}
                                    {!clientsLoading && !clientsError && clients.map((c) => (
                                      <CommandItem
                                        key={c.code}
                                        value={`${[c.fantasy_name, c.legal_name, String(c.code)].filter(Boolean).join(" ")}`}
                                        onSelect={() => {
                                          setFormData((prev) => ({
                                            ...prev,
                                            client: c.fantasy_name || c.legal_name,
                                            clientCode: String(c.code),
                                          }));
                                          setReviewClientOpen(false);
                                        }}
                                      >
                                        <Check
                                          className={cn(
                                            "mr-2 h-4 w-4",
                                            formData.client === (c.fantasy_name || c.legal_name)
                                              ? "opacity-100"
                                              : "opacity-0"
                                          )}
                                        />
                                        {c.fantasy_name || c.legal_name}
                                      </CommandItem>
                                    ))}
                                  </CommandGroup>
                                </CommandList>
                              </Command>
                            </PopoverContent>
                          </Popover>
                        </div>
                      </motion.div>

                      {/* Transporte */}
                      <motion.div variants={fadeInUp} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="driver">Motorista</Label>
                          <Input
                            id="driver"
                            placeholder="e.g. Alex"
                            value={formData.driver}
                            onChange={(e) => updateFormData("driver", e.target.value)}
                            className="transition-all duration-300 focus:ring-2 focus:ring-primary/20 focus:border-primary"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="vehicleId">Veículo</Label>
                          <Select
                            value={formData.vehicleId}
                            onValueChange={(value) => updateFormData("vehicleId", value)}
                          >
                            <SelectTrigger id="vehicleId" className="transition-all duration-300 focus:ring-2 focus:ring-primary/20 focus:border-primary">
                              <SelectValue placeholder="Selecione um veículo" />
                            </SelectTrigger>
                            <SelectContent>
                              {vehiclesLoading && (
                                <SelectItem value="__loading" disabled>
                                  Carregando veículos…
                                </SelectItem>
                              )}
                              {vehiclesError && (
                                <SelectItem value="__error" disabled>
                                  {vehiclesError}
                                </SelectItem>
                              )}
                              {!vehiclesLoading && !vehiclesError && vehicles.length === 0 && (
                                <SelectItem value="__empty" disabled>
                                  Nenhum veículo encontrado
                                </SelectItem>
                              )}
                              {!vehiclesLoading && !vehiclesError && vehicles.map((v) => (
                                <SelectItem key={v.id} value={String(v.id)}>
                                  {v.plate} — {v.model}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="vehicleTemperature">Temperatura do veículo (°C)</Label>
                          <Input
                            id="vehicleTemperature"
                            inputMode="decimal"
                            placeholder="Ex.: 4.5"
                            value={formData.vehicleTemperature}
                            onChange={(e) => {
                              const v = e.target.value.replace(/[^0-9.,-]/g, "").replace(",", ".");
                              updateFormData("vehicleTemperature", v);
                            }}
                            className="transition-all duration-300 focus:ring-2 focus:ring-primary/20 focus:border-primary"
                          />
                        </div>
                      </motion.div>

                      {/* Produtos */}
                      <motion.div variants={fadeInUp} className="space-y-4">
                        <Label>Produtos</Label>
                        <div className="space-y-3">
                          {(formData.productItems ?? [{ code: "", quantity: "" }]).map((item, idx) => (
                            <div key={`review-product-row-${idx}`} className="grid grid-cols-5 gap-3 items-center">
                              <div className="col-span-3">
                                <Select
                                  value={item.code || ""}
                                  onValueChange={(val) => {
                                    setFormData((prev) => {
                                      const list = [...(prev.productItems ?? [])];
                                      list[idx] = { ...list[idx], code: val };
                                      return { ...prev, productItems: list };
                                    });
                                  }}
                                >
                                  <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Selecione um produto" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {products
                                      .filter((p) => {
                                        const codeStr = String(p.code);
                                        return !((formData.productItems ?? []).some((it, iIdx) => iIdx !== idx && it.code === codeStr));
                                      })
                                      .map((p) => (
                                        <SelectItem key={p.code} value={String(p.code)}>
                                          {p.description}
                                        </SelectItem>
                                      ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="col-span-2">
                                <div className="flex items-center gap-2">
                                  <Input
                                    inputMode="numeric"
                                    placeholder="Somente números"
                                    value={item.quantity || ""}
                                    onChange={(e) => {
                                      const digits = (e.target.value || "").replace(/\D/g, "");
                                      setFormData((prev) => {
                                        const list = [...(prev.productItems ?? [])];
                                        list[idx] = { ...list[idx], quantity: digits };
                                        return { ...prev, productItems: list };
                                      });
                                    }}
                                    className="flex-1 transition-all duration-300 focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                  />
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    aria-label="Remover produto"
                                    onClick={() => {
                                      setFormData((prev) => {
                                        const list = [...(prev.productItems ?? [])];
                                        list.splice(idx, 1);
                                        const next = list.length > 0 ? list : [{ code: "", quantity: "" }];
                                        return { ...prev, productItems: next };
                                      });
                                    }}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ))}
                          {formData.productItems && formData.productItems[0]?.code && products.some((p) => {
                            const codeStr = String(p.code);
                            return !((formData.productItems ?? []).some((it) => it.code === codeStr));
                          }) && (
                            <Button
                              type="button"
                              variant="secondary"
                              onClick={() => setFormData((prev) => ({
                                ...prev,
                                productItems: [...(prev.productItems ?? []), { code: "", quantity: "" }],
                              }))}
                            >
                              Adicionar produto
                            </Button>
                          )}
                        </div>

                        {/* Temperatura do produto (permite negativos) */}
                        <div className="space-y-2">
                          <Label htmlFor="reviewProductTemp">Temperatura do produto (°C)</Label>
                          <Input
                            id="reviewProductTemp"
                            inputMode="decimal"
                            placeholder="Ex.: -4,5"
                            value={formData.productTemperature}
                            onChange={(e) => {
                              let sanitized = (e.target.value || "").replace(/[^\d,-]/g, "");
                              sanitized = sanitized.replace(/(?!^)-/g, "");
                              updateFormData("productTemperature", sanitized);
                            }}
                            className="transition-all duration-300 focus:ring-2 focus:ring-primary/20 focus:border-primary"
                          />
                        </div>

                        {/* Lote */}
                        <div className="space-y-2">
                          <Label>Lote</Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button variant="outline" className="w-full justify-start text-left font-normal">
                                {formData.deliverDate
                                  ? (() => {
                                      const [y, m, d] = formData.deliverDate.split("-").map(Number);
                                      return new Date(y, m - 1, d).toLocaleDateString("pt-BR");
                                    })()
                                  : "Selecione uma data"}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="p-2" align="start">
                              <Calendar
                                mode="single"
                                selected={formData.deliverDate ? (() => { const [y, m, d] = formData.deliverDate.split("-").map(Number); return new Date(y, m - 1, d); })() : undefined}
                                onSelect={(date: Date | undefined) => {
                                  if (!date) return;
                                  const isoLocal = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
                                  updateFormData("deliverDate", isoLocal);
                                }}
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                      </motion.div>
                    </CardContent>
                  </>
                )}
              </motion.div>
            </AnimatePresence>

            <CardFooter className="flex justify-between pt-6 pb-4">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  type="button"
                  variant="outline"
                  onClick={prevStep}
                  disabled={currentStep === 0}
                  className="flex items-center gap-1 transition-all duration-300 rounded-2xl"
                >
                  <ChevronLeft className="h-4 w-4" /> Voltar
                </Button>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  type="button"
                  onClick={
                    currentStep === steps.length - 1 ? handleSubmit : nextStep
                  }
                  disabled={!isStepValid() || isSubmitting}
                  className={cn(
                    "flex items-center gap-1 transition-all duration-300 rounded-2xl",
                    currentStep === steps.length - 1 ? "" : ""
                  )}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Gerando Relatório...
                    </>
                  ) : (
                    <>
                      {currentStep === steps.length - 1 ? "Confirmar" : "Próximo"}
                      {currentStep === steps.length - 1 ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </>
                  )}
                </Button>
              </motion.div>
            </CardFooter>
          </div>
        </Card>
      </motion.div>

      {/* Step indicator */}
      <motion.div
        className="mt-4 text-center text-sm text-muted-foreground"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        Step {currentStep + 1} of {steps.length}: {steps[currentStep].title}
      </motion.div>
    </div>
  );
};

export default OnboardingForm;