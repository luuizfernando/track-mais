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
  ClipboardPen,
  Trash2,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const steps = [
  { id: "transport", title: "Transporte" },
  { id: "invoice", title: "Nota Fiscal" },
  { id: "client", title: "Cliente" },
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
  // Etapa 1 - Nota Fiscal
  invoiceNumber: string;
  // Estrutura antiga (Produto): mantida para compatibilidade, será desativada
  productItems: { code: string; quantity: string }[];
  sifOrSisbi: "" | "SIF" | "SISBI";
  productTemperature: string;
  deliverDate: string; // ISO date (YYYY-MM-DD)
  // Novo: múltiplos clientes com subform de produtos
  customerGroups: {
    clientCode: string; // código do cliente
    clientName: string; // para exibição
    items: {
      code: string;
      quantity: string;
      sifOrSisbi: "" | "SIF" | "SISBI" | "NA";
      productTemperature: string;
      productionDate: string; // YYYY-MM-DD
    }[];
  }[];
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

type OnboardingFormProps = { onSuccess?: () => void };

const OnboardingForm = ({ onSuccess }: OnboardingFormProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const isMobile = useIsMobile();
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
    sifOrSisbi: "",
    productTemperature: "",
    deliverDate: "",
    customerGroups: [
      {
        clientCode: "",
        clientName: "",
        items: [],
      },
    ],
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

  // Estado do modal de produto (adicionar/editar)
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [productModalGroupIndex, setProductModalGroupIndex] = useState<
    number | null
  >(null);
  const [productEditIndex, setProductEditIndex] = useState<number | null>(null);
  const [productForm, setProductForm] = useState<{
    code: string;
    quantity: string;
    sifOrSisbi: "" | "SIF" | "SISBI" | "NA";
    productTemperature: string;
    productionDate: string;
  }>({
    code: "",
    quantity: "",
    sifOrSisbi: "",
    productTemperature: "",
    productionDate: "",
  });

  // Estado para seleção de cliente (mobile)
  const [clientSheetOpen, setClientSheetOpen] = useState(false);
  const [clientSheetGroupIndex, setClientSheetGroupIndex] = useState<
    number | null
  >(null);

  const resetProductForm = () => {
    setProductForm({
      code: "",
      quantity: "",
      sifOrSisbi: "",
      productTemperature: "",
      productionDate: "",
    });
    setProductEditIndex(null);
  };

  const openAddProduct = (groupIndex: number) => {
    setProductModalGroupIndex(groupIndex);
    resetProductForm();
    setProductModalOpen(true);
  };

  const openEditProduct = (groupIndex: number, itemIndex: number) => {
    const item = formData.customerGroups[groupIndex]?.items[itemIndex];
    if (!item) return;
    setProductModalGroupIndex(groupIndex);
    setProductEditIndex(itemIndex);
    setProductForm({
      code: item.code || "",
      quantity: item.quantity || "",
      sifOrSisbi: (item.sifOrSisbi || "") as any,
      productTemperature: item.productTemperature || "",
      productionDate: item.productionDate || "",
    });
    setProductModalOpen(true);
  };

  const deleteProduct = (groupIndex: number, itemIndex: number) => {
    updateCustomerGroup(groupIndex, (g) => {
      const items = [...(g.items || [])];
      items.splice(itemIndex, 1);
      return { ...g, items };
    });
  };

  const saveProductModal = () => {
    if (productModalGroupIndex == null) return;
    const gIdx = productModalGroupIndex;
    const data = productForm;
    // validações simples
    if (
      !data.code ||
      !data.quantity ||
      !data.productTemperature ||
      !data.productionDate
    ) {
      toast({ title: "Preencha todos os campos do produto." });
      return;
    }
    updateCustomerGroup(gIdx, (g) => {
      const items = [...(g.items || [])];
      const newItem = {
        code: data.code,
        quantity: data.quantity.replace(/\D/g, ""),
        sifOrSisbi: (data.sifOrSisbi || "") as any,
        productTemperature: data.productTemperature,
        productionDate: data.productionDate,
      };
      if (productEditIndex == null) {
        items.push(newItem);
      } else {
        items[productEditIndex] = newItem;
      }
      return { ...g, items };
    });
    setProductModalOpen(false);
    resetProductForm();
  };

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
        },
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
          },
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
          : "Erro ao carregar clientes",
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
          token ? { headers: { Authorization: `Bearer ${token}` } } : undefined,
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
            : "Erro ao carregar veículos.",
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

        const limit = 50;
        let offset = 0;
        let allProducts: ApiProduct[] = [];
        let hasMore = true;

        // Loop para buscar todas as páginas
        while (hasMore) {
          const res = await axios.get<Paginated<ApiProduct> | ApiProduct[]>(
            `${process.env.NEXT_PUBLIC_API_URL}/products`,
            {
              headers: token ? { Authorization: `Bearer ${token}` } : undefined,
              params: { limit, offset },
            },
          );

          const payload = res.data as any;
          const list: ApiProduct[] = Array.isArray(payload)
            ? payload
            : Array.isArray(payload?.data)
              ? payload.data
              : [];

          if (list.length > 0) {
            // Evitar duplicatas caso a paginação falhe e retorne os mesmos itens
            const newItems = list.filter(
              (newItem) =>
                !allProducts.some((existing) => existing.code === newItem.code),
            );

            if (newItems.length === 0) {
              // Se todos os itens retornados já existem, paramos para evitar loop infinito
              hasMore = false;
            } else {
              allProducts = [...allProducts, ...newItems];
              offset += limit;
            }

            // Se veio menos que o limite, é a última página
            // Se veio um array direto (não paginado), também paramos
            if (list.length < limit || Array.isArray(payload)) {
              hasMore = false;
            }
          } else {
            hasMore = false;
          }
        }

        setProducts(allProducts);
      } catch (e: any) {
        console.error(e);
        setProductsError(
          e?.response?.status === 401
            ? "Não autorizado: verifique seu login."
            : "Erro ao carregar produtos.",
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

  const updateCustomerGroup = (
    index: number,
    updater: (
      g: FormData["customerGroups"][number],
    ) => FormData["customerGroups"][number],
  ) => {
    setFormData((prev) => {
      const groups = [...prev.customerGroups];
      groups[index] = updater(groups[index]);
      return { ...prev, customerGroups: groups };
    });
  };

  const addCustomerGroup = () => {
    setFormData((prev) => ({
      ...prev,
      customerGroups: [
        ...prev.customerGroups,
        {
          clientCode: "",
          clientName: "",
          items: [],
        },
      ],
    }));
  };

  const removeCustomerGroup = (index: number) => {
    setFormData((prev) => {
      const groups = [...prev.customerGroups];
      groups.splice(index, 1);
      return {
        ...prev,
        customerGroups:
          groups.length > 0
            ? groups
            : [{ clientCode: "", clientName: "", items: [] }],
      };
    });
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

        const fillingISO = new Date().toISOString();

        const vehicleTemp = Number(
          (formData.vehicleTemperature || "").replace(",", "."),
        );

        const selectedPlate = vehicles.find(
          (v) => String(v.id) === formData.vehicleId,
        )?.plate;

        // Novo payload: customerGroups
        const groupsValid = (formData.customerGroups ?? [])
          .map((g) => {
            const clientCodeNum = Number((g.clientCode || "").trim());
            const items = (g.items ?? [])
              .filter(
                (it) =>
                  (it.code || "").trim() !== "" &&
                  (it.quantity || "").trim() !== "" &&
                  (it.productTemperature || "").trim() !== "" &&
                  (it.productionDate || "").trim() !== "",
              )
              .map((it) => {
                const codeNum = Number(it.code);
                const qtyNum = Number(it.quantity);
                const tempNum = Number(
                  (it.productTemperature || "").replace(",", "."),
                );
                const found = products.find((p) => p.code === codeNum);
                return {
                  code: codeNum,
                  quantity: qtyNum,
                  description: found?.description ?? undefined,
                  sifOrSisbi: it.sifOrSisbi || undefined,
                  productTemperature: tempNum,
                  productionDate: `${it.productionDate}T00:00:00.000Z`,
                };
              });
            return { customerCode: clientCodeNum, items };
          })
          .filter((g) => !!g.customerCode && g.items.length > 0);

        if (groupsValid.length === 0) {
          throw new Error(
            "Adicione ao menos um cliente com produto(s) válido(s).",
          );
        }

        const payload: any = {
          invoiceNumber: formData.invoiceNumber,
          vehicleTemperature: vehicleTemp,
          hasGoodSanitaryCondition: formData.sanitaryCondition === "conforme",
          driver: formData.driver,
          userId,
          fillingDate: fillingISO,
          deliverVehicle: selectedPlate,
          customerGroups: groupsValid,
        };

        const res = await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL}/daily-report`,
          payload,
          { headers: { Authorization: `Bearer ${token}` } },
        );

        toast({ title: "Relatório diário criado com sucesso!" });
        onSuccess?.();
      } catch (err: any) {
        console.error(err);
        let message =
          err?.response?.data?.message ||
          err?.message ||
          "Falha ao enviar o relatório.";
        // Se o ValidationPipe retornar uma lista de mensagens, converter em string legível
        if (Array.isArray(message)) {
          message = message.join("; ");
        }
        toast({
          title: "Falha ao enviar o relatório.",
          description: String(message),
        });
      } finally {
        setIsSubmitting(false);
      }
    })();
  };

  // Check if step is valid for next button
  const isStepValid = () => {
    switch (currentStep) {
      case 0:
        return (
          formData.driver.trim() !== "" &&
          formData.vehicleId.trim() !== "" &&
          formData.sanitaryCondition.trim() !== "" &&
          formData.vehicleTemperature.trim() !== ""
        );
      case 1:
        return formData.invoiceNumber.trim() !== "";
      case 2: {
        // Validar múltiplos clientes com produtos
        const groups = formData.customerGroups ?? [];
        if (groups.length === 0) return false;
        const eachValid = groups.every((g) => {
          const hasClient = (g.clientCode || "").trim() !== "";
          const items = g.items ?? [];
          if (items.length === 0) return false;
          return items.every(
            (it) =>
              (it.code || "").trim() !== "" &&
              (it.quantity || "").trim() !== "" &&
              (it.productTemperature || "").trim() !== "" &&
              (it.productionDate || "").trim() !== "",
          );
        });
        return eachValid;
      }
      case 3:
        // Etapa Produto antiga desativada
        return true;
      case 4:
        return true;
      default:
        return true;
    }
  };

  // Função auxiliar removida - JSX inline

  return (
    <div className="w-full max-w-md sm:max-w-lg md:max-w-3xl lg:max-w-4xl mx-auto p-2 md:p-4 lg:p-6">
      {/* Progress indicator */}
      <motion.div
        className="mb-8"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex justify-between mb-4">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              className="flex flex-col items-center flex-1"
              whileHover={{ scale: 1.05 }}
            >
              {index === 0 ? (
                <motion.div
                  className={cn(
                    "w-10 h-10 flex items-center justify-center rounded-full transition-all duration-300 cursor-pointer",
                    index < currentStep
                      ? "bg-yellow-400 text-black shadow-md"
                      : index === currentStep
                        ? "bg-yellow-400 text-black ring-4 ring-yellow-400/30 shadow-lg"
                        : "bg-gray-200 text-gray-400",
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
              ) : index === 1 ? (
                <motion.div
                  className={cn(
                    "w-10 h-10 flex items-center justify-center rounded-full transition-all duration-300 cursor-pointer",
                    index < currentStep
                      ? "bg-yellow-400 text-black shadow-md"
                      : index === currentStep
                        ? "bg-yellow-400 text-black ring-4 ring-yellow-400/30 shadow-lg"
                        : "bg-gray-200 text-gray-400",
                  )}
                  onClick={() => {
                    if (index <= currentStep) {
                      setCurrentStep(index);
                    }
                  }}
                  whileTap={{ scale: 0.95 }}
                >
                  <FileText className="h-5 w-5" />
                </motion.div>
              ) : index === 2 ? (
                <motion.div
                  className={cn(
                    "w-10 h-10 flex items-center justify-center rounded-full transition-all duration-300 cursor-pointer",
                    index < currentStep
                      ? "bg-yellow-400 text-black shadow-md"
                      : index === currentStep
                        ? "bg-yellow-400 text-black ring-4 ring-yellow-400/30 shadow-lg"
                        : "bg-gray-200 text-gray-400",
                  )}
                  onClick={() => {
                    if (index <= currentStep) {
                      setCurrentStep(index);
                    }
                  }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Store className="h-5 w-5" />
                </motion.div>
              ) : index === 3 ? (
                <motion.div
                  className={cn(
                    "w-10 h-10 flex items-center justify-center rounded-full transition-all duration-300 cursor-pointer",
                    index < currentStep
                      ? "bg-yellow-400 text-black shadow-md"
                      : index === currentStep
                        ? "bg-yellow-400 text-black ring-4 ring-yellow-400/30 shadow-lg"
                        : "bg-gray-200 text-gray-400",
                  )}
                  onClick={() => {
                    if (index <= currentStep) {
                      setCurrentStep(index);
                    }
                  }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Check className="h-5 w-5" />
                </motion.div>
              ) : index === 4 ? (
                <motion.div
                  className={cn(
                    "w-10 h-10 flex items-center justify-center rounded-full transition-all duration-300 cursor-pointer",
                    index < currentStep
                      ? "bg-yellow-400 text-black shadow-md"
                      : index === currentStep
                        ? "bg-yellow-400 text-black ring-4 ring-yellow-400/30 shadow-lg"
                        : "bg-gray-200 text-gray-400",
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
                    "w-10 h-10 rounded-full cursor-pointer transition-all duration-300 flex items-center justify-center",
                    index < currentStep
                      ? "bg-yellow-400 shadow-md"
                      : index === currentStep
                        ? "bg-yellow-400 ring-4 ring-yellow-400/30 shadow-lg"
                        : "bg-gray-200",
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
                  "text-xs mt-2 hidden sm:block text-center font-medium",
                  index === currentStep
                    ? "text-gray-900"
                    : index < currentStep
                      ? "text-gray-700"
                      : "text-gray-400",
                )}
              >
                {step.title}
              </motion.span>
            </motion.div>
          ))}
        </div>
        <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden mt-3">
          <motion.div
            className="h-full bg-linear-to-r from-yellow-400 to-yellow-500 shadow-sm"
            initial={{ width: 0 }}
            animate={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
          />
        </div>
      </motion.div>

      {/* Form card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Card className="border-2 border-gray-100 shadow-xl rounded-2xl overflow-hidden bg-white">
          <div>
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial="hidden"
                animate="visible"
                exit="exit"
                variants={contentVariants}
              >
                {/* Step 2: Transport Information */}
                {currentStep === 0 && (
                  <>
                    <CardHeader className="bg-linear-to-r from-gray-50 to-white border-b border-gray-100 p-3 sm:p-6 pb-4">
                      <CardTitle className="text-2xl font-bold text-gray-900">
                        Informações do Transporte
                      </CardTitle>
                      <p className="text-sm text-gray-500 mt-1">
                        Preencha os dados do transporte e veículo
                      </p>
                    </CardHeader>
                    <CardContent className="space-y-5 p-3 sm:p-6 pt-6 pb-4">
                      <motion.div variants={fadeInUp} className="space-y-2">
                        <Label htmlFor="driver">Motorista</Label>
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
                          onValueChange={(value) =>
                            updateFormData("vehicleId", value)
                          }
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
                            {!vehiclesLoading &&
                              !vehiclesError &&
                              vehicles.length === 0 && (
                                <SelectItem value="__empty" disabled>
                                  Nenhum veículo encontrado
                                </SelectItem>
                              )}
                            {!vehiclesLoading &&
                              !vehiclesError &&
                              vehicles.map((v) => (
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
                          onValueChange={(value) =>
                            updateFormData("sanitaryCondition", value)
                          }
                          className="space-y-2"
                        >
                          <div className="flex items-center space-x-2 rounded-md border p-3 cursor-pointer hover:bg-accent transition-colors">
                            <RadioGroupItem
                              value="conforme"
                              id="sanitary-conforme"
                            />
                            <Label
                              htmlFor="sanitary-conforme"
                              className="cursor-pointer w-full"
                            >
                              Conforme
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2 rounded-md border p-3 cursor-pointer hover:bg-accent transition-colors">
                            <RadioGroupItem
                              value="nao-conforme"
                              id="sanitary-nao-conforme"
                            />
                            <Label
                              htmlFor="sanitary-nao-conforme"
                              className="cursor-pointer w-full"
                            >
                              Não conforme
                            </Label>
                          </div>
                        </RadioGroup>
                      </motion.div>

                      <motion.div variants={fadeInUp} className="space-y-2">
                        <Label htmlFor="vehicleTemperature">
                          Temperatura do veículo (°C)
                        </Label>
                        <Input
                          id="vehicleTemperature"
                          type="number"
                          inputMode="decimal"
                          step="0.1"
                          placeholder="Ex.: 4.5"
                          required
                          value={formData.vehicleTemperature}
                          onChange={(e) => {
                            const v = e.target.value
                              .replace(/[^0-9.,-]/g, "")
                              .replace(",", ".");
                            updateFormData("vehicleTemperature", v);
                          }}
                          className="transition-all duration-300 focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        />
                      </motion.div>
                    </CardContent>
                  </>
                )}

                {/* Step 1: Nota Fiscal */}
                {currentStep === 1 && (
                  <>
                    <CardHeader className="bg-linear-to-r from-gray-50 to-white border-b border-gray-100 p-3 sm:p-6 pb-4">
                      <CardTitle className="text-2xl font-bold text-gray-900">
                        Nota Fiscal
                      </CardTitle>
                      <p className="text-sm text-gray-500 mt-1">
                        Informe o número da Nota Fiscal
                      </p>
                    </CardHeader>
                    <CardContent className="space-y-5 p-3 sm:p-6 pt-6 pb-4">
                      <motion.div variants={fadeInUp} className="space-y-2">
                        <Label htmlFor="invoiceNumber">N° Nota Fiscal</Label>
                        <Input
                          id="invoiceNumber"
                          inputMode="numeric"
                          placeholder="Somente números"
                          value={formData.invoiceNumber}
                          onChange={(e) => {
                            const digits = (e.target.value || "")
                              .replace(/\D/g, "")
                              .slice(0, 18);
                            updateFormData("invoiceNumber", digits);
                          }}
                          className="transition-all duration-300 focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        />
                      </motion.div>
                    </CardContent>
                  </>
                )}

                {/* Step 2: Cliente + Produtos (Accordion + Modal) */}
                {currentStep === 2 && (
                  <>
                    <CardHeader className="bg-linear-to-r from-gray-50 to-white border-b border-gray-100 p-3 sm:p-6 pb-4">
                      <CardTitle className="text-2xl font-bold text-gray-900">
                        Clientes e Produtos
                      </CardTitle>
                      <p className="text-sm text-gray-500 mt-1">
                        Selecione um ou mais clientes e associe seus produtos
                      </p>
                    </CardHeader>
                    <CardContent className="space-y-5 p-3 sm:p-6 pt-6 pb-4">
                      <motion.div variants={fadeInUp} className="space-y-6">
                        <Accordion type="multiple" className="w-full">
                          {formData.customerGroups.map((group, gIdx) => (
                            <AccordionItem
                              key={`group-${gIdx}`}
                              value={`group-${gIdx}`}
                            >
                              <AccordionTrigger>
                                <div className="flex w-full items-center justify-between pr-2">
                                  <span className="font-medium">
                                    {group.clientName
                                      ? `${group.clientName}${group.clientCode ? ` (${group.clientCode})` : ""}`
                                      : `Cliente #${gIdx + 1}`}
                                  </span>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    aria-label="Remover cliente"
                                    onClick={() => removeCustomerGroup(gIdx)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </AccordionTrigger>
                              <AccordionContent>
                                <div className="space-y-4">
                                  {isMobile ? (
                                    <Sheet
                                      open={
                                        clientSheetOpen &&
                                        clientSheetGroupIndex === gIdx
                                      }
                                      onOpenChange={(open) => {
                                        setClientSheetOpen(open);
                                        if (
                                          open &&
                                          !clientsFullyLoaded &&
                                          !clientsLoading
                                        ) {
                                          void fetchAllClients();
                                        }
                                        if (open)
                                          setClientSheetGroupIndex(gIdx);
                                      }}
                                    >
                                      <SheetTrigger asChild>
                                        <Button
                                          variant="outline"
                                          role="combobox"
                                          className="w-full justify-between"
                                        >
                                          {group.clientName
                                            ? group.clientName
                                            : "Selecionar cliente..."}
                                          <ChevronsUpDown className="h-4 w-4 opacity-50" />
                                        </Button>
                                      </SheetTrigger>
                                      <SheetContent
                                        side="bottom"
                                        className="h-[80vh]"
                                      >
                                        <SheetHeader>
                                          <SheetTitle>
                                            Selecionar Cliente
                                          </SheetTitle>
                                        </SheetHeader>
                                        <div className="mt-4">
                                          <Command>
                                            <CommandInput placeholder="Buscar cliente por nome ou código..." />
                                            <CommandEmpty>
                                              Nenhum cliente encontrado.
                                            </CommandEmpty>
                                            <CommandList className="max-h-[200px] sm:max-h-[300px] overflow-y-auto">
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
                                                      value={`${[c.fantasy_name, c.legal_name, String(c.code)].filter(Boolean).join(" ")}`}
                                                      onSelect={() => {
                                                        updateCustomerGroup(
                                                          gIdx,
                                                          (g) => ({
                                                            ...g,
                                                            clientCode: String(
                                                              c.code,
                                                            ),
                                                            clientName:
                                                              c.fantasy_name ||
                                                              c.legal_name,
                                                          }),
                                                        );
                                                        if (isMobile)
                                                          setClientSheetOpen(
                                                            false,
                                                          );
                                                      }}
                                                    >
                                                      <Check
                                                        className={cn(
                                                          "mr-2 h-4 w-4",
                                                          group.clientName ===
                                                            (c.fantasy_name ||
                                                              c.legal_name)
                                                            ? "opacity-100"
                                                            : "opacity-0",
                                                        )}
                                                      />
                                                      <span className="truncate">
                                                        {c.fantasy_name ||
                                                          c.legal_name}
                                                      </span>
                                                      <span className="ml-2 text-xs text-muted-foreground">
                                                        ({c.code})
                                                      </span>
                                                    </CommandItem>
                                                  ))}
                                              </CommandGroup>
                                            </CommandList>
                                          </Command>
                                        </div>
                                      </SheetContent>
                                    </Sheet>
                                  ) : (
                                    <Popover
                                      onOpenChange={(open) => {
                                        if (
                                          open &&
                                          !clientsFullyLoaded &&
                                          !clientsLoading
                                        ) {
                                          void fetchAllClients();
                                        }
                                      }}
                                    >
                                      <PopoverTrigger asChild>
                                        <Button
                                          variant="outline"
                                          role="combobox"
                                          className="w-full justify-between"
                                        >
                                          {group.clientName
                                            ? group.clientName
                                            : "Selecionar cliente..."}
                                          <ChevronsUpDown className="h-4 w-4 opacity-50" />
                                        </Button>
                                      </PopoverTrigger>
                                      <PopoverContent
                                        className="p-0 w-[--radix-popover-trigger-width] max-w-[calc(100vw-2rem)]"
                                        collisionPadding={10}
                                        side="bottom"
                                      >
                                        <Command>
                                          <CommandInput placeholder="Buscar cliente por nome ou código..." />
                                          <CommandEmpty>
                                            Nenhum cliente encontrado.
                                          </CommandEmpty>
                                          <CommandList className="max-h-[200px] sm:max-h-[300px] overflow-y-auto">
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
                                                    value={`${[c.fantasy_name, c.legal_name, String(c.code)].filter(Boolean).join(" ")}`}
                                                    onSelect={() => {
                                                      updateCustomerGroup(
                                                        gIdx,
                                                        (g) => ({
                                                          ...g,
                                                          clientCode: String(
                                                            c.code,
                                                          ),
                                                          clientName:
                                                            c.fantasy_name ||
                                                            c.legal_name,
                                                        }),
                                                      );
                                                      if (isMobile)
                                                        setClientSheetOpen(
                                                          false,
                                                        );
                                                    }}
                                                  >
                                                    <Check
                                                      className={cn(
                                                        "mr-2 h-4 w-4",
                                                        group.clientName ===
                                                          (c.fantasy_name ||
                                                            c.legal_name)
                                                          ? "opacity-100"
                                                          : "opacity-0",
                                                      )}
                                                    />
                                                    <span className="truncate">
                                                      {c.fantasy_name ||
                                                        c.legal_name}
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
                                  )}

                                  {/* Tabela resumo de produtos */}
                                  <div className="space-y-2">
                                    <Label>Produtos do cliente</Label>
                                    {group.items && group.items.length > 0 ? (
                                      <div
                                        className="relative w-full max-w-[calc(100vw-2rem)] sm:max-w-full overflow-x-auto rounded-md border 
min-w-0"
                                      >
                                        <Table>
                                          <TableHeader>
                                            <TableRow>
                                              <TableHead className="text-xs sm:text-sm">
                                                Produto
                                              </TableHead>
                                              <TableHead className="text-xs sm:text-sm">
                                                Quantidade
                                              </TableHead>
                                              <TableHead className="text-xs sm:text-sm">
                                                SIF/SISBI
                                              </TableHead>
                                              <TableHead className="text-xs sm:text-sm">
                                                Temp (°C)
                                              </TableHead>
                                              <TableHead className="text-xs sm:text-sm">
                                                Produção
                                              </TableHead>
                                              <TableHead className="text-xs sm:text-sm">
                                                Ações
                                              </TableHead>
                                            </TableRow>
                                          </TableHeader>
                                          <TableBody>
                                            {group.items.map((item, iIdx) => {
                                              const pDesc =
                                                products.find(
                                                  (p) =>
                                                    String(p.code) ===
                                                    item.code,
                                                )?.description || item.code;
                                              return (
                                                <TableRow
                                                  key={`g${gIdx}-row-${iIdx}`}
                                                >
                                                  <TableCell className="text-xs sm:text-sm">
                                                    {pDesc}
                                                  </TableCell>
                                                  <TableCell className="text-xs sm:text-sm">
                                                    {item.quantity}
                                                  </TableCell>
                                                  <TableCell className="text-xs sm:text-sm">
                                                    {item.sifOrSisbi || ""}
                                                  </TableCell>
                                                  <TableCell className="text-xs sm:text-sm">
                                                    {item.productTemperature}
                                                  </TableCell>
                                                  <TableCell className="text-xs sm:text-sm">
                                                    {item.productionDate
                                                      ? (() => {
                                                          const [y, m, d] =
                                                            item.productionDate
                                                              .split("-")
                                                              .map(Number);
                                                          return new Date(
                                                            y,
                                                            m - 1,
                                                            d,
                                                          ).toLocaleDateString(
                                                            "pt-BR",
                                                          );
                                                        })()
                                                      : ""}
                                                  </TableCell>
                                                  <TableCell className="text-xs sm:text-sm">
                                                    <div className="flex gap-2">
                                                      <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="icon"
                                                        aria-label="Editar"
                                                        onClick={() =>
                                                          openEditProduct(
                                                            gIdx,
                                                            iIdx,
                                                          )
                                                        }
                                                      >
                                                        <ClipboardPen className="h-4 w-4" />
                                                      </Button>
                                                      <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="icon"
                                                        aria-label="Remover"
                                                        onClick={() =>
                                                          deleteProduct(
                                                            gIdx,
                                                            iIdx,
                                                          )
                                                        }
                                                      >
                                                        <Trash2 className="h-4 w-4" />
                                                      </Button>
                                                    </div>
                                                  </TableCell>
                                                </TableRow>
                                              );
                                            })}
                                          </TableBody>
                                        </Table>
                                      </div>
                                    ) : (
                                      <div className="text-sm text-muted-foreground">
                                        Nenhum produto adicionado.
                                      </div>
                                    )}
                                  </div>

                                  <div className="flex justify-end">
                                    <Button
                                      type="button"
                                      variant="secondary"
                                      onClick={() => openAddProduct(gIdx)}
                                    >
                                      Adicionar produto
                                    </Button>
                                  </div>
                                </div>
                              </AccordionContent>
                            </AccordionItem>
                          ))}
                        </Accordion>
                        <Button type="button" onClick={addCustomerGroup}>
                          Adicionar cliente
                        </Button>
                      </motion.div>

                      {/* Modal de produto */}
                      <Dialog
                        open={productModalOpen}
                        onOpenChange={setProductModalOpen}
                      >
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>
                              {productEditIndex == null
                                ? "Adicionar produto"
                                : "Editar produto"}
                            </DialogTitle>
                            <DialogDescription>
                              Preencha os detalhes do produto para o cliente
                              selecionado.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <Label>Produto expedido</Label>
                              <Select
                                value={productForm.code}
                                onValueChange={(val) =>
                                  setProductForm((f) => ({ ...f, code: val }))
                                }
                              >
                                <SelectTrigger className="w-full">
                                  <SelectValue placeholder="Selecione um produto" />
                                </SelectTrigger>
                                <SelectContent>
                                  {products.map((p) => (
                                    <SelectItem
                                      key={p.code}
                                      value={String(p.code)}
                                    >
                                      {p.description}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="space-y-2">
                              <Label>Quantidade</Label>
                              <Input
                                inputMode="numeric"
                                placeholder="Somente números"
                                value={productForm.quantity}
                                onChange={(e) => {
                                  const digits = (e.target.value || "").replace(
                                    /\D/g,
                                    "",
                                  );
                                  setProductForm((f) => ({
                                    ...f,
                                    quantity: digits,
                                  }));
                                }}
                              />
                            </div>

                            <div className="space-y-2">
                              <Label>SIF ou SISBI?</Label>
                              <RadioGroup
                                value={productForm.sifOrSisbi}
                                onValueChange={(v) =>
                                  setProductForm((f) => ({
                                    ...f,
                                    sifOrSisbi: v as any,
                                  }))
                                }
                                className="space-y-2"
                              >
                                {[
                                  { value: "SIF", label: "SIF" },
                                  { value: "SISBI", label: "SISBI" },
                                  { value: "NA", label: "N/A" },
                                ].map((opt, index) => (
                                  <motion.div
                                    key={opt.value}
                                    className="flex items-center space-x-2 rounded-md border p-3 cursor-pointer hover
:bg-accent transition-colors"
                                  >
                                    <RadioGroupItem
                                      value={opt.value}
                                      id={`modal-sis-${index}`}
                                    />
                                    <Label
                                      htmlFor={`modal-sis-${index}`}
                                      className="cursor-pointer w-full"
                                    >
                                      {opt.label}
                                    </Label>
                                  </motion.div>
                                ))}
                              </RadioGroup>
                            </div>

                            <div className="space-y-2">
                              <Label>Temperatura do produto (°C)</Label>
                              <Input
                                inputMode="decimal"
                                placeholder="Ex.: 4,5"
                                value={productForm.productTemperature}
                                onChange={(e) => {
                                  let sanitized = (
                                    e.target.value || ""
                                  ).replace(/[^\d,-]/g, "");
                                  sanitized = sanitized.replace(/(?!^)-/g, "");
                                  setProductForm((f) => ({
                                    ...f,
                                    productTemperature: sanitized,
                                  }));
                                }}
                              />
                            </div>

                            <div className="space-y-2">
                              <Label>Data de produção</Label>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <Button
                                    variant="outline"
                                    className="w-full justify-start text-left font-normal"
                                  >
                                    {productForm.productionDate
                                      ? (() => {
                                          const [y, m, d] =
                                            productForm.productionDate
                                              .split("-")
                                              .map(Number);
                                          return new Date(
                                            y,
                                            m - 1,
                                            d,
                                          ).toLocaleDateString("pt-BR");
                                        })()
                                      : "Selecione uma data"}
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="p-2" align="start">
                                  {/* @ts-ignore */}
                                  <Calendar
                                    mode="single"
                                    selected={
                                      productForm.productionDate
                                        ? (() => {
                                            const [y, m, d] =
                                              productForm.productionDate
                                                .split("-")
                                                .map(Number);
                                            return new Date(y, m - 1, d);
                                          })()
                                        : undefined
                                    }
                                    onSelect={(date: Date | undefined) => {
                                      if (!date) return;
                                      const isoLocal = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
                                      setProductForm((f) => ({
                                        ...f,
                                        productionDate: isoLocal,
                                      }));
                                    }}
                                  />
                                </PopoverContent>
                              </Popover>
                            </div>
                          </div>
                          <DialogFooter>
                            <Button
                              type="button"
                              variant="secondary"
                              onClick={() => setProductModalOpen(false)}
                            >
                              Cancelar
                            </Button>
                            <Button type="button" onClick={saveProductModal}>
                              {productEditIndex == null
                                ? "Adicionar"
                                : "Salvar"}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </CardContent>
                  </>
                )}

                {/* Step 5: Revisão */}
                {currentStep === 3 && (
                  <>
                    <CardHeader className="bg-linear-to-r from-gray-50 to-white border-b border-gray-100 p-3 sm:p-6 pb-4">
                      <CardTitle className="text-2xl font-bold text-gray-900">
                        Revisão
                      </CardTitle>
                      <p className="text-sm text-gray-500 mt-1">
                        Confira todos os dados antes de confirmar
                      </p>
                    </CardHeader>
                    <CardContent className="space-y-6 p-3 sm:p-6 pt-6 pb-4 max-h-[60vh] overflow-y-auto overflow-x-auto">
                      {/* Nota Fiscal */}
                      <motion.div variants={fadeInUp} className="space-y-2">
                        <Label>Nota Fiscal</Label>
                        <Input value={formData.invoiceNumber} readOnly />
                      </motion.div>

                      {/* Clientes e Produtos */}
                      <motion.div variants={fadeInUp} className="space-y-3">
                        <Label>Clientes e produtos</Label>
                        {formData.customerGroups.length === 0 ? (
                          <div className="text-sm text-muted-foreground">
                            Nenhum cliente adicionado.
                          </div>
                        ) : (
                          <Accordion
                            type="single"
                            collapsible
                            defaultValue={`client-0`}
                          >
                            {formData.customerGroups.map((group, gIdx) => (
                              <AccordionItem
                                key={`review-client-${gIdx}`}
                                value={`client-${gIdx}`}
                              >
                                <AccordionTrigger>
                                  {group.clientName || `Cliente ${gIdx + 1}`}
                                </AccordionTrigger>
                                <AccordionContent>
                                  <div className="flex flex-col sm:flex-row justify-end gap-2 mb-3">
                                    <Button
                                      type="button"
                                      variant="outline"
                                      onClick={() => setCurrentStep(2)}
                                    >
                                      <ClipboardPen className="mr-2 h-4 w-4" />{" "}
                                      Editar cliente
                                    </Button>
                                    <Button
                                      type="button"
                                      variant="outline"
                                      onClick={() => removeCustomerGroup(gIdx)}
                                    >
                                      <Trash2 className="mr-2 h-4 w-4" />{" "}
                                      Excluir cliente
                                    </Button>
                                  </div>
                                  {group.items.length === 0 ? (
                                    <div className="text-sm text-muted-foreground">
                                      Nenhum produto adicionado.
                                    </div>
                                  ) : (
                                    <div
                                      className="relative w-full max-w-[calc(100vw-2rem)] sm:max-w-full overflow-x-auto rounded-md border mi
n-w-0"
                                    >
                                      <Table className="min-w-full">
                                        <TableHeader>
                                          <TableRow>
                                            <TableHead className="text-xs sm:text-sm">
                                              Produto
                                            </TableHead>
                                            <TableHead className="text-xs sm:text-sm">
                                              Quantidade
                                            </TableHead>
                                            <TableHead className="text-xs sm:text-sm">
                                              SIF/SISBI
                                            </TableHead>
                                            <TableHead className="text-xs sm:text-sm">
                                              Temperatura (°C)
                                            </TableHead>
                                            <TableHead className="text-xs sm:text-sm">
                                              Data de produção
                                            </TableHead>
                                            <TableHead className="text-xs sm:text-sm">
                                              Ações
                                            </TableHead>
                                          </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                          {group.items.map((it, idx) => {
                                            const desc =
                                              products.find(
                                                (p) =>
                                                  String(p.code) ===
                                                  String(it.code),
                                              )?.description || it.code;
                                            return (
                                              <TableRow
                                                key={`review-row-${gIdx}-${idx}`}
                                              >
                                                <TableCell className="text-xs sm:text-sm">
                                                  {desc}
                                                </TableCell>
                                                <TableCell className="text-xs sm:text-sm">
                                                  {it.quantity}
                                                </TableCell>
                                                <TableCell className="text-xs sm:text-sm">
                                                  {it.sifOrSisbi || "N/A"}
                                                </TableCell>
                                                <TableCell className="text-xs sm:text-sm">
                                                  {it.productTemperature}
                                                </TableCell>
                                                <TableCell className="text-xs sm:text-sm">
                                                  {it.productionDate
                                                    ? (() => {
                                                        const [y, m, d] =
                                                          it.productionDate
                                                            .split("-")
                                                            .map(Number);
                                                        return new Date(
                                                          y,
                                                          m - 1,
                                                          d,
                                                        ).toLocaleDateString(
                                                          "pt-BR",
                                                        );
                                                      })()
                                                    : "—"}
                                                </TableCell>
                                                <TableCell className="text-xs sm:text-sm">
                                                  <div className="flex gap-2">
                                                    <Button
                                                      type="button"
                                                      variant="outline"
                                                      size="icon"
                                                      aria-label="Editar produto"
                                                      onClick={() => {
                                                        setCurrentStep(2);
                                                        openEditProduct(
                                                          gIdx,
                                                          idx,
                                                        );
                                                      }}
                                                    >
                                                      <ClipboardPen className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                      type="button"
                                                      variant="outline"
                                                      size="icon"
                                                      aria-label="Excluir produto"
                                                      onClick={() =>
                                                        deleteProduct(gIdx, idx)
                                                      }
                                                    >
                                                      <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                  </div>
                                                </TableCell>
                                              </TableRow>
                                            );
                                          })}
                                        </TableBody>
                                      </Table>
                                    </div>
                                  )}
                                </AccordionContent>
                              </AccordionItem>
                            ))}
                          </Accordion>
                        )}
                      </motion.div>

                      {/* Motorista */}
                      <motion.div variants={fadeInUp} className="space-y-2">
                        <Label>Motorista</Label>
                        <Input value={formData.driver} readOnly />
                      </motion.div>

                      {/* Veículo */}
                      <motion.div variants={fadeInUp} className="space-y-2">
                        <Label>Veículo</Label>
                        <Input
                          readOnly
                          value={(() => {
                            const v = vehicles.find(
                              (vv) =>
                                String(vv.id) === String(formData.vehicleId),
                            );
                            return v ? `${v.plate} — ${v.model}` : "";
                          })()}
                        />
                      </motion.div>

                      {/* Temperatura do veículo */}
                      <motion.div variants={fadeInUp} className="space-y-2">
                        <Label>Temperatura do veículo (°C)</Label>
                        <Input value={formData.vehicleTemperature} readOnly />
                      </motion.div>
                    </CardContent>
                  </>
                )}
              </motion.div>
            </AnimatePresence>

            <CardFooter className="flex justify-between items-center p-3 sm:p-6 pt-6 pb-6 bg-gray-50 border-t border-gray-100">
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  type="button"
                  variant="outline"
                  onClick={prevStep}
                  disabled={currentStep === 0}
                  className="flex items-center gap-2 transition-all duration-300 rounded-xl border-2 border-gray-300 hover:border-gray-400 hove
r:bg-gray-100 px-6 py-2 h-11 font-medium"
                >
                  <ChevronLeft className="h-4 w-4" /> Voltar
                </Button>
              </motion.div>

              {/* Indicador de etapa no centro */}
              <div className="text-sm font-medium text-gray-500">
                Etapa {currentStep + 1} de {steps.length}
              </div>
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  type="button"
                  onClick={
                    currentStep === steps.length - 1 ? handleSubmit : nextStep
                  }
                  disabled={!isStepValid() || isSubmitting}
                  className={cn(
                    "flex items-center gap-2 transition-all duration-300 rounded-xl px-6 py-2 h-11 font-medium shadow-md hover:shadow-lg",
                    currentStep === steps.length - 1
                      ? "bg-linear-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white"
                      : "bg-linear-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-black",
                  )}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Gerando
                      Relatório...
                    </>
                  ) : (
                    <>
                      {currentStep === steps.length - 1
                        ? "Confirmar"
                        : "Próximo"}
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
    </div>
  );
};

export default OnboardingForm;
