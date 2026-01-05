"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Edit, Trash2, Filter } from "lucide-react";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import OnboardingForm from "./multistep-form";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";

export function ReportsPage() {
  const [activeTab, setActiveTab] = useState("controle");
  const [createOpen, setCreateOpen] = useState(false);
  const [filters, setFilters] = useState({
    nomeProduto: "",
    lote: "",
    cliente: "",
    dataRange: "01-08-2025 a 30-08-2025",
  });
  const [expandedMonths, setExpandedMonths] = useState<string[]>(["Jul-2025"]);

  // Estado para tabela de relatórios
  type ApiDailyReport = {
    id: number;
    invoiceNumber: string | number;
    customerCode: number | string; // pode vir como string se BigInt serializado
    products: Array<{
      code: number | string;
      quantity: number;
      description?: string;
      sifOrSisbi?: string;
      productTemperature?: number;
      productionDate?: string;
    }>;
    shipmentDate: string; // legado
    productionDate?: string; // ISO (agregado)
    fillingDate?: string; // ISO (momento do preenchimento)
    userId: number;
    deliverVehicle?: string | null;
    driver?: string;
    hasGoodSanitaryCondition: boolean;
    productTemperature: number;
  };

  type ApiCustomer = {
    code: number;
    legal_name: string | null;
    state: string | null;
  };

  type ApiProduct = {
    code: number | string;
    description: string | null;
  };

  type ApiUser = {
    id: number;
    name: string;
    username: string;
  };

  // Registros mensais (DIPOVA)
  type ApiMonthlyReport = {
    id: number;
    quantity: string | number; // Decimal vem como string
    destination: string;
    temperature: string | number;
    deliverer: string;
    productionDate: string; // ISO
    shipmentDate: string; // ISO
    productId: number; // código do produto
    customersId: number;
  };

  type ReportRow = {
    reportId: number;
    invoiceNumber: string;
    customerCode?: number;
    clientName: string;
    destination: string;
    userId: number;
    userName?: string;
    deliverVehicle?: string | null;
    driver?: string;
    hasGoodSanitaryCondition: boolean;
    productTemperature: number;
    fillingDate: string;
    fillingDateIso: string;
    products: Array<{
      productCode: string;
      productName: string;
      quantity: number;
      productionDate: string;
      productTemperature?: number;
      sifOrSisbi?: string;
    }>;
  };

  const [rows, setRows] = useState<ReportRow[]>([]);
  const [monthly, setMonthly] = useState<ApiMonthlyReport[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedRowKeys, setExpandedRowKeys] = useState<Set<string>>(
    new Set()
  );

  const formatDate = (
    input: Date | string | number | null | undefined | object
  ) => {
    if (!input) return "N/A";
    let iso: string | null = null;
    if (input instanceof Date) {
      iso = input.toISOString();
    } else if (typeof input === "string") {
      iso = input;
    } else if (typeof input === "number") {
      const d = new Date(input);
      if (!isNaN(d.getTime())) return d.toLocaleDateString("pt-BR");
      return String(input);
    } else if (typeof input === "object") {
      // Caso legado: objeto vazio vindo do backend
      return "N/A";
    }

    if (!iso) return "N/A";

    // Prioriza o parse de AAAA-MM-DD (com ou sem parte de horário), evitando shift por timezone
    const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T\s].*)?$/);
    if (m) {
      const dLocal = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
      if (!isNaN(dLocal.getTime())) return dLocal.toLocaleDateString("pt-BR");
    }

    // Fallback: tenta parse padrão
    const d1 = new Date(iso);
    if (!isNaN(d1.getTime())) return d1.toLocaleDateString("pt-BR");

    // Último recurso: retorna string original
    return iso;
  };

  const formatToDayMonth = (dateStr: string) => {
    if (!dateStr || dateStr === "N/A") return dateStr;
    const parts = dateStr.split("/");
    if (parts.length >= 2) return `${parts[0]}/${parts[1]}`;
    return dateStr;
  };

  const capitalize = (s: string) =>
    s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
  const getMonthKey = (input: Date | string | number | null | undefined) => {
    let d: Date | null = null;
    if (input instanceof Date) {
      d = input;
    } else if (typeof input === "string") {
      // Prioriza AAAA-MM-DD (com ou sem horário) para evitar timezone
      const m = input.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T\s].*)?$/);
      if (m) {
        d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
      } else {
        const tryIso = new Date(input);
        if (!isNaN(tryIso.getTime())) {
          d = tryIso;
        } else {
          const m1 = input.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
          if (m1) {
            d = new Date(Number(m1[3]), Number(m1[2]) - 1, Number(m1[1]));
          } else {
            const m2 = input.match(/^(\d{4})-(\d{2})-(\d{2})/);
            if (m2) {
              d = new Date(Number(m2[1]), Number(m2[2]) - 1, Number(m2[3]));
            }
          }
        }
      }
    } else if (typeof input === "number") {
      const t = new Date(input);
      if (!isNaN(t.getTime())) d = t;
    }
    if (!d) return "N/A";
    const month = (d.toLocaleString("pt-BR", { month: "short" }) || "").replace(
      /\.$/,
      ""
    );
    return `${capitalize(month)}-${d.getFullYear()}`;
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const baseURL = process.env.NEXT_PUBLIC_API_URL;
        if (!baseURL) throw new Error("NEXT_PUBLIC_API_URL não definido.");

        const token =
          typeof window !== "undefined" ? localStorage.getItem("token") : null;
        const headers = token
          ? { Authorization: `Bearer ${token}` }
          : undefined;

        // Buscar relatórios, clientes e produtos em paralelo
        const [repRes, custRes, prodRes, usersRes, monthlyRes] =
          await Promise.all([
            axios.get<ApiDailyReport[]>(`${baseURL}/daily-report`, { headers }),
            axios.get<{
              data: ApiCustomer[];
              limit: number;
              offset: number;
              total?: number;
            }>(`${baseURL}/customers`, { headers }),
            axios.get<{
              data: ApiProduct[];
              limit: number;
              offset: number;
              total?: number;
            }>(`${baseURL}/products`, { headers }),
            axios.get<{ data: ApiUser[][]; limit: number; offset: number }>(
              `${baseURL}/usuarios?limit=100`,
              { headers }
            ),
            axios.get<ApiMonthlyReport[]>(`${baseURL}/monthly-report`, {
              headers,
            }),
          ]);

        const customers = Array.isArray(custRes.data)
          ? (custRes.data as unknown as ApiCustomer[])
          : custRes.data?.data ?? [];
        const products = Array.isArray(prodRes.data)
          ? (prodRes.data as unknown as ApiProduct[])
          : prodRes.data?.data ?? [];
        const reports = repRes.data || [];
        const users = (usersRes.data?.data?.[0] ?? []) as ApiUser[];
        const monthlyReports = Array.isArray(monthlyRes.data)
          ? monthlyRes.data
          : [];

        // Mapas auxiliares
        const customerByCode = new Map<number, ApiCustomer>();
        customers.forEach((c) => customerByCode.set(Number(c.code), c));

        const productByCode = new Map<number, ApiProduct>();
        products.forEach((p) => productByCode.set(Number(p.code), p));

        const userById = new Map<number, ApiUser>();
        users.forEach((u) => userById.set(Number(u.id), u));

        // Para cada relatório, criar UMA linha agregada por cliente no dia (fillingDate)
        const builtRows: ReportRow[] = [];
        for (const r of reports) {
          const invoice = String(r.invoiceNumber);
          const cust = customerByCode.get(Number(r.customerCode));
          const clientName = cust?.legal_name ?? "N/A";
          const destination = cust?.state ?? "N/A";
          const fillingIso = String(
            r.fillingDate ?? r.productionDate ?? r.shipmentDate
          );
          const items = Array.isArray(r.products) ? r.products : [];

          const productRows: ReportRow["products"] = [];
          for (const it of items) {
            const codeNum = Number(it?.code);
            const prod = productByCode.get(codeNum);
            const prodName = prod?.description ?? it?.description ?? "N/A";
            const qty = Number(it?.quantity) || 0;
            const prodDateIso = String(
              it?.productionDate ?? r.productionDate ?? r.shipmentDate
            );
            productRows.push({
              productCode: String(it?.code ?? ""),
              productName: prodName,
              quantity: qty,
              productionDate: formatDate(prodDateIso),
              productTemperature: Number(it?.productTemperature ?? 0),
              sifOrSisbi: String(it?.sifOrSisbi ?? "") || undefined,
            });
          }

          builtRows.push({
            reportId: Number(r.id),
            invoiceNumber: invoice,
            customerCode: Number(r.customerCode),
            clientName,
            destination,
            userId: Number(r.userId),
            userName: userById.get(Number(r.userId))?.name ?? "—",
            deliverVehicle: r.deliverVehicle ?? null,
            driver: r.driver,
            hasGoodSanitaryCondition: !!r.hasGoodSanitaryCondition,
            productTemperature: Number(r.productTemperature ?? 0),
            fillingDate: formatDate(fillingIso),
            fillingDateIso: fillingIso,
            products: productRows,
          });
        }

        setRows(builtRows);
        setMonthly(monthlyReports);
      } catch (e: unknown) {
        console.error(e);
        let msg = "Erro ao carregar relatórios.";
        if (axios.isAxiosError(e)) {
          msg = e.response?.data?.message || e.message;
        } else if (e instanceof Error) {
          msg = e.message;
        }
        setError(msg);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleFilterChange = (field: string, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const toggleMonth = (month: string) => {
    setExpandedMonths((prev) =>
      prev.includes(month) ? prev.filter((m) => m !== month) : [...prev, month]
    );
  };

  const handleExportPDF = () => {
    console.log("Exporting PDF...");
    // Implement PDF export logic
  };

  const handleExportExcel = () => {
    console.log("Exporting Excel...");
    // Implement Excel export logic
  };

  const toggleRow = (key: string) => {
    setExpandedRowKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  // ====== Edição/Exclusão ======
  const [editOpen, setEditOpen] = useState(false);
  const [editRow, setEditRow] = useState<ReportRow | null>(null);
  const [customersState, setCustomersState] = useState<ApiCustomer[]>([]);
  const [productsState, setProductsState] = useState<ApiProduct[]>([]);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);
  const { toast } = useToast();

  // Armazenar clientes/produtos carregados para o modal
  useEffect(() => {
    (async () => {
      try {
        const baseURL = process.env.NEXT_PUBLIC_API_URL;
        const token =
          typeof window !== "undefined" ? localStorage.getItem("token") : null;
        const headers = token
          ? { Authorization: `Bearer ${token}` }
          : undefined;
        const [custRes, prodRes] = await Promise.all([
          axios.get<{ data: ApiCustomer[] }>(`${baseURL}/customers?limit=20`, {
            headers,
          }),
          axios.get<{ data: ApiProduct[] }>(`${baseURL}/products?limit=20`, {
            headers,
          }),
        ]);
        setCustomersState(custRes.data?.data ?? []);
        setProductsState(prodRes.data?.data ?? []);
      } catch (_) {
        // silencioso; não bloquear a página
      }
    })();
  }, []);

  const parsePtBrToISO = (d: string) => {
    const m = d.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (!m) return d; // retornar como veio se já está ISO
    return `${m[3]}-${m[2]}-${m[1]}`;
  };

  const openEdit = (row: ReportRow) => {
    setEditRow({ ...row });
    setEditOpen(true);
  };

  const handleEditSave = async () => {
    if (!editRow) return;
    try {
      const baseURL = process.env.NEXT_PUBLIC_API_URL;
      const token =
        typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const headers = token ? { Authorization: `Bearer ${token}` } : undefined;

      const payload = {
        invoiceNumber: editRow.invoiceNumber,
        customerGroups: [
          {
            customerCode: Number(editRow.customerCode || 0),
            items: editRow.products.map((p) => ({
              code: Number(p.productCode),
              quantity: Number(p.quantity),
              description: p.productName,
              sifOrSisbi: p.sifOrSisbi ?? "NA",
              productTemperature: Number(p.productTemperature ?? 0),
              productionDate: parsePtBrToISO(p.productionDate),
            })),
          },
        ],
      };

      await axios.patch(
        `${baseURL}/daily-report/${editRow.reportId}`,
        payload,
        { headers }
      );

      // Atualizar estado local
      setRows((prev) =>
        prev.map((r) => (r.reportId === editRow.reportId ? { ...editRow } : r))
      );
      setEditOpen(false);
    } catch (e: unknown) {
      let msg = "Falha ao atualizar relatório.";
      if (axios.isAxiosError(e)) {
        msg = e.response?.data?.message || e.message;
      } else if (e instanceof Error) {
        msg = e.message;
      }
      alert(msg);
    }
  };

  const handleDelete = async (reportId: number) => {
    // Abre modal de confirmação
    setPendingDeleteId(reportId);
    setDeleteOpen(true);
  };

  // Agrupamento por mês (Data de preenchimento)
  const groups = rows.reduce<Record<string, ReportRow[]>>((acc, row) => {
    const k = getMonthKey(row.fillingDateIso);
    if (!acc[k]) acc[k] = [];
    acc[k].push(row);
    return acc;
  }, {});

  const orderedMonthKeys = Object.keys(groups).sort((a, b) => {
    // sort by YYYY-MM behind the scenes
    const parse = (key: string) => {
      const [mon, yr] = key.split("-");
      const months = [
        "Jan",
        "Fev",
        "Mar",
        "Abr",
        "Mai",
        "Jun",
        "Jul",
        "Ago",
        "Set",
        "Out",
        "Nov",
        "Dez",
      ];
      const idx = months.findIndex(
        (m) => m.toLowerCase() === mon.toLowerCase()
      );
      return Number(yr) * 100 + (idx >= 0 ? idx : 0);
    };
    return parse(b) - parse(a);
  });

  // Estado de mês selecionado para DIPOVA, baseado na data de preenchimento
  const [dipovaMonth, setDipovaMonth] = useState<string | null>(null);
  useEffect(() => {
    if (!dipovaMonth && orderedMonthKeys.length > 0) {
      setDipovaMonth(orderedMonthKeys[0]);
    }
  }, [orderedMonthKeys, dipovaMonth]);

  const sumQty = (arr: ReportRow[]) =>
    arr.reduce(
      (s, r) =>
        s + r.products.reduce((sp, p) => sp + (Number(p.quantity) || 0), 0),
      0
    );

  const monthAbbr = [
    "jan",
    "fev",
    "mar",
    "abr",
    "mai",
    "jun",
    "jul",
    "ago",
    "set",
    "out",
    "nov",
    "dez",
  ];
  const formatMonthBr = (iso: string) => {
    const m = iso.match(/^([0-9]{4})-([0-9]{2})-([0-9]{2})(?:[T\s].*)?$/);
    let d: Date | null = null;
    if (m) d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
    else {
      const tryD = new Date(iso);
      if (!isNaN(tryD.getTime())) d = tryD;
      else return iso;
    }
    const mm = d.getMonth();
    const yy = d.getFullYear() % 100;
    return `${monthAbbr[mm]}-${yy}`;
  };

  // Formata a label exibida nas tabs de mês (Mon-YY)
  const formatChipLabel = (key: string) => {
    const [mon, yr] = key.split("-");
    const yr2 = String(yr).slice(-2);
    return `${mon}-${yr2}`;
  };
  const isSameMonthYear = (iso: string, ref: Date) => {
    const m = iso.match(/^([0-9]{4})-([0-9]{2})-([0-9]{2})(?:[T\s].*)?$/);
    let d: Date | null = null;
    if (m) d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
    else {
      const tryD = new Date(iso);
      if (!isNaN(tryD.getTime())) d = tryD;
      else return false;
    }
    return (
      d.getMonth() === ref.getMonth() && d.getFullYear() === ref.getFullYear()
    );
  };

  return (
    <div className="space-y-6">
      {/* Header with New Record Button */}
      <div className="flex justify-between items-center">
        <div className="text-xl font-semibold text-gray-900">Relatórios</div>

        {/* ===== 2. IMPLEMENTAÇÃO DO DIALOG ===== */}
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-yellow-400 hover:bg-yellow-500 text-black font-medium px-6">
              + Novo Registro
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg p-0">
            {/* p-0 é adicionado para remover o padding padrão do Dialog,
              pois o OnboardingForm já tem seu próprio padding (py-8).
              max-w-lg é para corresponder ao estilo do formulário.
              O DialogContent já tem scroll automático.
            */}
            <OnboardingForm onSuccess={() => setCreateOpen(false)} />
          </DialogContent>
        </Dialog>
        {/* ===== FIM DA IMPLEMENTAÇÃO ===== */}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger
            value="controle"
            className="data-[state=active]:bg-yellow-400 data-[state=active]:text-black"
          >
            Controle de expedição
          </TabsTrigger>
          <TabsTrigger
            value="dipova"
            className="data-[state=active]:bg-yellow-400 data-[state=active]:text-black"
          >
            DIPOVA
          </TabsTrigger>
        </TabsList>

        {/* Filters */}
        <div className="mt-6 flex items-center gap-2 text-sm text-gray-600">
          <Filter className="h-4 w-4 text-gray-500" />
          <span>Filtros</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-2">
          <div className="flex flex-col gap-1">
            <Label
              htmlFor="filtro-nome-produto"
              className="text-sm text-gray-700"
            >
              Nome do produto
            </Label>
            <Input
              id="filtro-nome-produto"
              placeholder="Nome do Produto"
              value={filters.nomeProduto}
              onChange={(e) =>
                handleFilterChange("nomeProduto", e.target.value)
              }
              className="h-10 border-gray-300"
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="filtro-cliente" className="text-sm text-gray-700">
              Cliente
            </Label>
            <Input
              id="filtro-cliente"
              placeholder="Cliente"
              value={filters.cliente}
              onChange={(e) => handleFilterChange("cliente", e.target.value)}
              className="h-10 border-gray-300"
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="filtro-data" className="text-sm text-gray-700">
              Data
            </Label>
            <Input
              id="filtro-data"
              placeholder="01-08-2025 a 30-08-2025"
              value={filters.dataRange}
              onChange={(e) => handleFilterChange("dataRange", e.target.value)}
              className="h-10 border-gray-300"
            />
          </div>
        </div>

        {/* Controle de Expedição Tab */}
        <TabsContent value="controle" className="mt-6">
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <tbody className="divide-y divide-gray-200">
                    {loading && (
                      <tr>
                        <td className="px-4 py-3 text-sm" colSpan={4}>
                          Carregando...
                        </td>
                      </tr>
                    )}
                    {error && !loading && (
                      <tr>
                        <td
                          className="px-4 py-3 text-sm text-red-600"
                          colSpan={4}
                        >
                          {error}
                        </td>
                      </tr>
                    )}
                    {!loading && !error && rows.length === 0 && (
                      <tr>
                        <td className="px-4 py-3 text-sm" colSpan={4}>
                          Nenhum relatório encontrado.
                        </td>
                      </tr>
                    )}
                    {!loading &&
                      !error &&
                      orderedMonthKeys.map((mk) => {
                        const groupRows = groups[mk] || [];
                        const isExpanded = expandedMonths.includes(mk);
                        const totalExp = groupRows.length;
                        const totalKg = sumQty(groupRows);
                        return (
                          <>
                            {/* Linha de resumo do mês */}
                            <tr
                              key={`sum-${mk}`}
                              className="bg-gray-100 border-b"
                            >
                              <td
                                colSpan={4}
                                className="px-4 py-3 text-sm text-gray-900"
                              >
                                <div className="flex items-center gap-4">
                                  <button
                                    aria-label={
                                      isExpanded ? "Recolher" : "Expandir"
                                    }
                                    onClick={() => toggleMonth(mk)}
                                    className="rounded-full w-6 h-6 flex items-center justify-center border border-gray-400 text-gray-700"
                                  >
                                    {isExpanded ? "−" : "+"}
                                  </button>
                                  <div className="flex-1 grid grid-cols-1">
                                    <div>
                                      <span className="font-medium">Mês</span>:{" "}
                                      {mk}
                                    </div>
                                    <div>
                                      <span className="font-medium">
                                        Total Expedições
                                      </span>
                                      : {totalExp}
                                    </div>
                                  </div>
                                </div>
                              </td>
                            </tr>

                            {/* Headers por mês, dentro da área expansível */}
                            {isExpanded && (
                              <tr className="bg-gray-50 border-b">
                                <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">
                                  Nº da NF
                                </th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">
                                  Cliente
                                </th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">
                                  Destino
                                </th>
                                <th className="px-4 py-3 text-center text-sm font-medium text-gray-900">
                                  Ações
                                </th>
                              </tr>
                            )}

                            {/* Linhas detalhadas do mês */}
                            {isExpanded &&
                              groupRows.map((row, idx) => {
                                const rkey = `${row.reportId}-${idx}`;
                                const rExpanded = expandedRowKeys.has(rkey);
                                const userName = row.userName ?? "—";
                                return (
                                  <>
                                    <tr key={rkey} className="hover:bg-gray-50">
                                      <td className="px-4 py-3 text-sm text-gray-900">
                                        <div className="flex items-center gap-2">
                                          <button
                                            onClick={() => toggleRow(rkey)}
                                            className="rounded-full w-6 h-6 flex items-center justify-center border border-gray-300"
                                            aria-label={
                                              rExpanded
                                                ? "Recolher detalhes"
                                                : "Expandir detalhes"
                                            }
                                          >
                                            {rExpanded ? "−" : "+"}
                                          </button>
                                          <span>{row.invoiceNumber}</span>
                                        </div>
                                      </td>
                                      <td className="px-4 py-3 text-sm text-gray-900">
                                        {row.clientName}
                                      </td>
                                      <td className="px-4 py-3 text-sm text-gray-900">
                                        {row.destination}
                                      </td>
                                      <td className="px-4 py-3 text-center">
                                        <div className="flex justify-center space-x-2">
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 px-2"
                                            onClick={() => openEdit(row)}
                                            aria-label="Editar relatório"
                                          >
                                            <Edit className="h-4 w-4" />
                                          </Button>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 px-2"
                                            onClick={() =>
                                              handleDelete(row.reportId)
                                            }
                                            aria-label="Excluir relatório"
                                          >
                                            <Trash2 className="h-4 w-4" />
                                          </Button>
                                        </div>
                                      </td>
                                    </tr>

                                    {rExpanded && (
                                      <tr
                                        key={`${rkey}-details`}
                                        className="bg-gray-50"
                                      >
                                        <td
                                          colSpan={4}
                                          className="px-4 py-3 text-sm text-gray-900"
                                        >
                                          <div className="mb-3 grid md:grid-cols-2 gap-4 md:gap-6">
                                            <div>
                                              <div className="text-gray-600">
                                                Data de preenchimento
                                              </div>
                                              <div className="font-medium">
                                                {row.fillingDate ?? "—"}
                                              </div>
                                            </div>
                                            <div>
                                              <div className="text-gray-600">
                                                Placa do veículo
                                              </div>
                                              <div className="font-medium">
                                                {row.deliverVehicle ?? "—"}
                                              </div>
                                            </div>
                                            <div>
                                              <div className="text-gray-600">
                                                Temperatura do caminhão
                                              </div>
                                              <div className="font-medium">
                                                {row.productTemperature ?? 0} °C
                                              </div>
                                            </div>
                                            <div>
                                              <div className="text-gray-600">
                                                Condições sanitárias
                                              </div>
                                              {row.hasGoodSanitaryCondition ? (
                                                <span className="inline-flex items-center px-2 py-0.5 rounded border border-green-500 text-green-600">
                                                  Conforme
                                                </span>
                                              ) : (
                                                <span className="inline-flex items-center px-2 py-0.5 rounded border border-red-500 text-red-600">
                                                  Não conforme
                                                </span>
                                              )}
                                            </div>
                                          </div>

                                          <div className="overflow-x-auto">
                                            <table className="w-full">
                                              <thead className="bg-gray-100 border">
                                                <tr>
                                                  <th className="px-3 py-2 text-left text-sm font-medium text-gray-900">
                                                    Produto
                                                  </th>
                                                  <th className="px-3 py-2 text-left text-sm font-medium text-gray-900">
                                                    Quantidade
                                                  </th>
                                                  <th className="px-3 py-2 text-left text-sm font-medium text-gray-900">
                                                    SIF/SISBI
                                                  </th>
                                                  <th className="px-3 py-2 text-left text-sm font-medium text-gray-900">
                                                    Temperatura (°C)
                                                  </th>
                                                  <th className="px-3 py-2 text-left text-sm font-medium text-gray-900">
                                                    Data Prod/Lote
                                                  </th>
                                                </tr>
                                              </thead>
                                              <tbody className="divide-y">
                                                {row.products.map((p, i) => (
                                                  <tr key={`${rkey}-prod-${i}`}>
                                                    <td className="px-3 py-2">
                                                      {p.productName}
                                                    </td>
                                                    <td className="px-3 py-2">
                                                      {p.quantity}
                                                    </td>
                                                    <td className="px-3 py-2">
                                                      {p.sifOrSisbi ?? "—"}
                                                    </td>
                                                    <td className="px-3 py-2">
                                                      {typeof p.productTemperature ===
                                                      "number"
                                                        ? p.productTemperature
                                                        : "—"}
                                                    </td>
                                                    <td className="px-3 py-2">
                                                      {p.productionDate}
                                                    </td>
                                                  </tr>
                                                ))}
                                              </tbody>
                                            </table>
                                          </div>
                                        </td>
                                      </tr>
                                    )}
                                  </>
                                );
                              })}
                          </>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* DIPOVA Tab */}
        <TabsContent value="dipova" className="mt-6">
          <Card>
            <CardContent className="p-0">
              {/* Seleção de mês da DIPOVA */}
              <div className="px-4 py-3 border-b">
                <Tabs
                  value={dipovaMonth ?? ""}
                  onValueChange={(v) => setDipovaMonth(v)}
                >
                  <TabsList className="flex flex-wrap gap-2">
                    {orderedMonthKeys.map((key) => (
                      <TabsTrigger
                        key={key}
                        value={key}
                        className="rounded-full"
                      >
                        {formatChipLabel(key)}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </Tabs>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-100 border-b">
                    <tr>
                      <th className="px-3 py-2 text-left text-sm font-medium text-gray-900">
                        Produto
                      </th>
                      <th className="px-3 py-2 text-left text-sm font-medium text-gray-900">
                        Data de produção
                      </th>
                      <th className="px-3 py-2 text-left text-sm font-medium text-gray-900">
                        Data da expedição
                      </th>
                      <th className="px-3 py-2 text-left text-sm font-medium text-gray-900">
                        Quant.
                      </th>
                      <th className="px-3 py-2 text-left text-sm font-medium text-gray-900">
                        Destino
                      </th>
                      <th className="px-3 py-2 text-left text-sm font-medium text-gray-900">
                        Temp.
                      </th>
                      <th className="px-3 py-2 text-left text-sm font-medium text-gray-900">
                        Entregador/caminhão
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {(() => {
                      if (loading) {
                        return (
                          <tr>
                            <td className="px-3 py-2 text-sm" colSpan={7}>
                              Carregando...
                            </td>
                          </tr>
                        );
                      }
                      if (error) {
                        return (
                          <tr>
                            <td
                              className="px-3 py-2 text-sm text-red-600"
                              colSpan={7}
                            >
                              {error}
                            </td>
                          </tr>
                        );
                      }

                      type DipovaItem = {
                        productCode: number;
                        productName: string;
                        clientName: string;
                        quantity: number;
                        truckTemperature: number;
                        productionDate: string;
                        expeditionDate: string;
                        driver: string;
                        vehicle: string;
                      };
                      const dipovaMap = new Map<string, DipovaItem>();

                      const selectedMonthKey =
                        dipovaMonth ??
                        orderedMonthKeys[0] ??
                        getMonthKey(new Date());

                      for (const r of rows) {
                        if (getMonthKey(r.fillingDateIso) !== selectedMonthKey)
                          continue;

                        const destination = r.clientName || "N/A";
                        const truckTemp = r.productTemperature ?? 0;
                        const expDate = r.fillingDate; // DD/MM/YYYY
                        const driver = r.driver || "—";
                        const vehicle = r.deliverVehicle || "—";

                        for (const p of r.products) {
                          const pCode = Number(p.productCode);
                          const qty = Number(p.quantity) || 0;
                          if (qty <= 0) continue;

                          const prodDate = p.productionDate; // DD/MM/YYYY
                          const key = `${pCode}|${destination}|${prodDate}|${expDate}|${driver}|${vehicle}`;
                          const existing = dipovaMap.get(key);

                          if (existing) {
                            existing.quantity += qty;
                            existing.truckTemperature = truckTemp;
                          } else {
                            dipovaMap.set(key, {
                              productCode: pCode,
                              productName: p.productName,
                              clientName: destination,
                              quantity: qty,
                              truckTemperature: truckTemp,
                              productionDate: prodDate,
                              expeditionDate: expDate,
                              driver,
                              vehicle,
                            });
                          }
                        }
                      }

                      const sortedItems = Array.from(dipovaMap.values()).sort(
                        (a, b) =>
                          a.productName.localeCompare(b.productName) ||
                          a.clientName.localeCompare(b.clientName)
                      );

                      if (sortedItems.length === 0) {
                        return (
                          <tr>
                            <td className="px-3 py-2 text-sm" colSpan={7}>
                              Nenhum registro encontrado para este mês.
                            </td>
                          </tr>
                        );
                      }

                      const tableRows = sortedItems.map((item, idx) => {
                        return (
                          <tr key={`dipova-item-${idx}`}>
                            <td className="px-3 py-2">{item.productName}</td>
                            <td className="px-3 py-2">
                              {formatToDayMonth(item.productionDate)}
                            </td>
                            <td className="px-3 py-2">
                              {formatToDayMonth(item.expeditionDate)}
                            </td>
                            <td className="px-3 py-2">
                              {item.quantity.toLocaleString("pt-BR", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </td>
                            <td className="px-3 py-2">{item.clientName}</td>
                            <td className="px-3 py-2">
                              {item.truckTemperature} °C
                            </td>
                            <td className="px-3 py-2">
                              {item.driver} / {item.vehicle}
                            </td>
                          </tr>
                        );
                      });

                      // Soma total das quantidades exibidas
                      const totalQty = sortedItems.reduce(
                        (acc, item) => acc + item.quantity,
                        0
                      );

                      // Linha de rodapé com valor apenas em Quant.
                      const footerRow = (
                        <tr key="dipova-total" className="bg-gray-50">
                          <td className="px-3 py-2"></td>
                          <td className="px-3 py-2"></td>
                          <td className="px-3 py-2"></td>
                          <td className="px-3 py-2 font-semibold">
                            {totalQty.toLocaleString("pt-BR", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </td>
                          <td className="px-3 py-2"></td>
                          <td className="px-3 py-2"></td>
                          <td className="px-3 py-2"></td>
                        </tr>
                      );

                      return [...tableRows, footerRow];
                    })()}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal de edição */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-2xl">
          {editRow && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm">Nº da NF</Label>
                  <Input
                    value={String(editRow.invoiceNumber)}
                    onChange={(e) =>
                      setEditRow((prev) => {
                        const digits = (e.target.value || "")
                          .replace(/\D/g, "")
                          .slice(0, 18);
                        return prev ? { ...prev, invoiceNumber: digits } : prev;
                      })
                    }
                  />
                </div>
                <div>
                  <Label className="text-sm">Cliente</Label>
                  <select
                    className="h-10 w-full border rounded px-2"
                    value={String(editRow.customerCode ?? "")}
                    onChange={(e) => {
                      const code = Number(e.target.value);
                      const cust = customersState.find(
                        (c) => Number(c.code) === code
                      );
                      setEditRow((prev) =>
                        prev
                          ? {
                              ...prev,
                              customerCode: code,
                              clientName: cust?.legal_name ?? prev.clientName,
                            }
                          : prev
                      );
                    }}
                  >
                    <option value="">Selecione...</option>
                    {customersState.map((c) => (
                      <option key={c.code} value={Number(c.code)}>
                        {c.legal_name ?? "Cliente"} ({c.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-100 border">
                    <tr>
                      <th className="px-3 py-2 text-left text-sm font-medium text-gray-900">
                        Produto
                      </th>
                      <th className="px-3 py-2 text-left text-sm font-medium text-gray-900">
                        Quantidade
                      </th>
                      <th className="px-3 py-2 text-left text-sm font-medium text-gray-900">
                        SIF/SISBI
                      </th>
                      <th className="px-3 py-2 text-left text-sm font-medium text-gray-900">
                        Temperatura (°C)
                      </th>
                      <th className="px-3 py-2 text-left text-sm font-medium text-gray-900">
                        Data Prod/Lote
                      </th>
                      <th className="px-3 py-2"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {editRow.products.map((p, i) => (
                      <tr key={`edit-prod-${i}`}>
                        <td className="px-3 py-2">
                          <select
                            className="h-10 w-full border rounded px-2"
                            value={String(p.productCode)}
                            onChange={(e) => {
                              const code = e.target.value;
                              const prod = productsState.find(
                                (pr) => String(pr.code) === String(code)
                              );
                              setEditRow((prev) => {
                                if (!prev) return prev;
                                const next = [...prev.products];
                                next[i] = {
                                  ...next[i],
                                  productCode: String(code),
                                  productName:
                                    prod?.description ?? next[i].productName,
                                };
                                return { ...prev, products: next };
                              });
                            }}
                          >
                            {productsState.map((pr) => (
                              <option
                                key={String(pr.code)}
                                value={String(pr.code)}
                              >
                                {pr.description ?? pr.code}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-3 py-2">
                          <Input
                            value={String(p.quantity)}
                            onChange={(e) => {
                              const val = Number(e.target.value) || 0;
                              setEditRow((prev) => {
                                if (!prev) return prev;
                                const next = [...prev.products];
                                next[i] = { ...next[i], quantity: val };
                                return { ...prev, products: next };
                              });
                            }}
                          />
                        </td>
                        <td className="px-3 py-2">
                          <select
                            className="h-10 w-full border rounded px-2"
                            value={p.sifOrSisbi ?? "NA"}
                            onChange={(e) => {
                              const val = e.target.value;
                              setEditRow((prev) => {
                                if (!prev) return prev;
                                const next = [...prev.products];
                                next[i] = { ...next[i], sifOrSisbi: val };
                                return { ...prev, products: next };
                              });
                            }}
                          >
                            <option value="NA">N/A</option>
                            <option value="SIF">SIF</option>
                            <option value="SISBI">SISBI</option>
                          </select>
                        </td>
                        <td className="px-3 py-2">
                          <Input
                            value={String(p.productTemperature ?? 0)}
                            onChange={(e) => {
                              const val = Number(e.target.value) || 0;
                              setEditRow((prev) => {
                                if (!prev) return prev;
                                const next = [...prev.products];
                                next[i] = {
                                  ...next[i],
                                  productTemperature: val,
                                };
                                return { ...prev, products: next };
                              });
                            }}
                          />
                        </td>
                        <td className="px-3 py-2">
                          <Input
                            placeholder="dd/mm/aaaa"
                            value={p.productionDate}
                            onChange={(e) => {
                              const val = e.target.value;
                              setEditRow((prev) => {
                                if (!prev) return prev;
                                const next = [...prev.products];
                                next[i] = { ...next[i], productionDate: val };
                                return { ...prev, products: next };
                              });
                            }}
                          />
                        </td>
                        <td className="px-3 py-2 text-right">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditRow((prev) => {
                                if (!prev) return prev;
                                const next = prev.products.filter(
                                  (_, idx) => idx !== i
                                );
                                return { ...prev, products: next };
                              });
                            }}
                          >
                            Remover
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="mt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditRow((prev) => {
                        if (!prev) return prev;
                        const firstProd = productsState[0];
                        const next = [
                          ...prev.products,
                          {
                            productCode: String(firstProd?.code ?? ""),
                            productName: firstProd?.description ?? "Produto",
                            quantity: 0,
                            productionDate: formatDate(new Date()),
                            productTemperature: 0,
                            sifOrSisbi: "NA",
                          },
                        ];
                        return { ...prev, products: next };
                      });
                    }}
                  >
                    Adicionar produto
                  </Button>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setEditOpen(false)}>
                  Cancelar
                </Button>
                <Button
                  className="bg-yellow-400 hover:bg-yellow-500 text-black"
                  onClick={handleEditSave}
                >
                  Salvar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de confirmação de exclusão */}
      <AlertDialog
        open={deleteOpen}
        onOpenChange={(open) => setDeleteOpen(open)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão?</AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteOpen(false)}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={async () => {
                if (pendingDeleteId == null) return;
                try {
                  const baseURL = process.env.NEXT_PUBLIC_API_URL;
                  const token =
                    typeof window !== "undefined"
                      ? localStorage.getItem("token")
                      : null;
                  const headers = token
                    ? { Authorization: `Bearer ${token}` }
                    : undefined;
                  await axios.delete(
                    `${baseURL}/daily-report/${pendingDeleteId}`,
                    { headers }
                  );
                  setRows((prev) =>
                    prev.filter((r) => r.reportId !== pendingDeleteId)
                  );
                  setDeleteOpen(false);
                  setPendingDeleteId(null);
                  toast({
                    title: "Exclusão efetuada com sucesso",
                    description: "O relatório foi excluído.",
                  });
                } catch (e: unknown) {
                  let msg = "Falha ao excluir relatório.";
                  if (axios.isAxiosError(e)) {
                    msg = e.response?.data?.message || e.message;
                  } else if (e instanceof Error) {
                    msg = e.message;
                  }
                  setDeleteOpen(false);
                  setPendingDeleteId(null);
                  alert(msg);
                }
              }}
            >
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}