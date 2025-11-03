"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronDown, ChevronRight, Edit, Trash2, Filter } from "lucide-react";
import { Label } from "@/components/ui/label";

// 1. IMPORTS ADICIONADOS
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";
// Assuma que OnboardingForm.tsx está na mesma pasta
import OnboardingForm from "./multistep-form";

export function ReportsPage() {
  const [activeTab, setActiveTab] = useState("controle");
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
    invoiceNumber: number;
    customerCode: number | string; // pode vir como string se BigInt serializado
    products: Array<{ code: number | string; quantity: number; description?: string }>;
    shipmentDate: string; // ISO
    productionDate?: string; // ISO
    userId: number;
    deliverVehicle?: string | null;
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

  type ReportRow = {
    reportId: number;
    invoiceNumber: number;
    clientName: string;
    productCode: string;
    productName: string;
    shipmentDate: string;
    productionDate: string;
    shipmentDateIso: string;
    productionDateIso: string;
    quantity: number;
    destination: string;
    userId: number;
    userName?: string;
    deliverVehicle?: string | null;
    hasGoodSanitaryCondition: boolean;
    productTemperature: number;
  };

  const [rows, setRows] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedRowKeys, setExpandedRowKeys] = useState<Set<string>>(new Set());

  const formatDate = (input: any) => {
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
    // Tenta parse padrão
    const d1 = new Date(iso);
    if (!isNaN(d1.getTime())) return d1.toLocaleDateString("pt-BR");

    // Fallback para formato YYYY-MM-DD
    const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (m) {
      const d2 = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
      if (!isNaN(d2.getTime())) return d2.toLocaleDateString("pt-BR");
    }

    // Último recurso: retorna string original
    return iso;
  };

  const capitalize = (s: string) => s ? (s.charAt(0).toUpperCase() + s.slice(1)) : s;
  const getMonthKey = (input: any) => {
    let d: Date | null = null;
    if (input instanceof Date) {
      d = input;
    } else if (typeof input === "string") {
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
    } else if (typeof input === "number") {
      const t = new Date(input);
      if (!isNaN(t.getTime())) d = t;
    }
    if (!d) return "N/A";
    const month = (d.toLocaleString("pt-BR", { month: "short" }) || "").replace(/\.$/, "");
    return `${capitalize(month)}-${d.getFullYear()}`;
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const baseURL = process.env.NEXT_PUBLIC_API_URL;
        if (!baseURL) throw new Error("NEXT_PUBLIC_API_URL não definido.");

        const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
        const headers = token ? { Authorization: `Bearer ${token}` } : undefined;

        // Buscar relatórios, clientes e produtos em paralelo
        const [repRes, custRes, prodRes, usersRes] = await Promise.all([
          axios.get<ApiDailyReport[]>(`${baseURL}/daily-report`, { headers }),
          axios.get<{ data: ApiCustomer[], limit: number, offset: number, total?: number }>(`${baseURL}/customers`, { headers }),
          axios.get<{ data: ApiProduct[], limit: number, offset: number, total?: number }>(`${baseURL}/products`, { headers }),
          axios.get<{ data: ApiUser[][], limit: number, offset: number }>(`${baseURL}/usuarios?limit=100`, { headers }),
        ]);

        const customers = Array.isArray(custRes.data)
          ? (custRes.data as unknown as ApiCustomer[])
          : (custRes.data?.data ?? []);
        const products = Array.isArray(prodRes.data)
          ? (prodRes.data as unknown as ApiProduct[])
          : (prodRes.data?.data ?? []);
        const reports = repRes.data || [];
        const users = (usersRes.data?.data?.[0] ?? []) as ApiUser[];

        // Mapas auxiliares
        const customerByCode = new Map<number, ApiCustomer>();
        customers.forEach((c) => customerByCode.set(Number(c.code), c));

        const productByCode = new Map<number, ApiProduct>();
        products.forEach((p) => productByCode.set(Number(p.code), p));

        const userById = new Map<number, ApiUser>();
        users.forEach((u) => userById.set(Number(u.id), u));

        // Para cada relatório, criar uma linha por produto
        const builtRows: ReportRow[] = [];
        for (const r of reports) {
          const invoice = Number(r.invoiceNumber);
          const cust = customerByCode.get(Number(r.customerCode));
          const clientName = cust?.legal_name ?? "N/A";
          const destination = cust?.state ?? "N/A";
          const shipDateIso = String(r.shipmentDate);
          const prodDateIso = String(r.productionDate ?? r.shipmentDate);
          const shipDate = formatDate(shipDateIso);
          const prodDate = formatDate(prodDateIso);

          const items = Array.isArray(r.products) ? r.products : [];
          for (const it of items) {
            const codeNum = Number((it as any)?.code);
            const prod = productByCode.get(codeNum);
            const prodName = prod?.description ?? it?.description ?? "N/A";
            const qty = Number((it as any)?.quantity) || 0;

            builtRows.push({
              reportId: Number(r.id),
              invoiceNumber: invoice,
              clientName,
              productCode: String((it as any)?.code ?? ""),
              productName: prodName,
              shipmentDate: shipDate, // também usado como Data Prod/Lote conforme instrução
              productionDate: prodDate,
              shipmentDateIso: shipDateIso,
              productionDateIso: prodDateIso,
              quantity: qty,
              destination,
              userId: Number(r.userId),
              userName: userById.get(Number(r.userId))?.name ?? "—",
              deliverVehicle: r.deliverVehicle ?? null,
              hasGoodSanitaryCondition: !!r.hasGoodSanitaryCondition,
              productTemperature: Number(r.productTemperature ?? 0),
            });
          }
        }

        setRows(builtRows);
      } catch (e: any) {
        console.error(e);
        const msg = e?.response?.data?.message || e?.message || "Erro ao carregar relatórios.";
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

  // Agrupamento por mês (Data Expe.)
  const groups = rows.reduce<Record<string, ReportRow[]>>((acc, row) => {
    const k = getMonthKey(row.shipmentDateIso);
    if (!acc[k]) acc[k] = [];
    acc[k].push(row);
    return acc;
  }, {});

  const orderedMonthKeys = Object.keys(groups).sort((a, b) => {
    // sort by YYYY-MM behind the scenes
    const parse = (key: string) => {
      const [mon, yr] = key.split("-");
      const months = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
      const idx = months.findIndex((m) => m.toLowerCase() === mon.toLowerCase());
      return Number(yr) * 100 + (idx >= 0 ? idx : 0);
    };
    return parse(b) - parse(a);
  });

  const sumQty = (arr: ReportRow[]) => arr.reduce((s, r) => s + (Number(r.quantity) || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header with New Record Button */}
      <div className="flex justify-between items-center">
        <div className="text-xl font-semibold text-gray-900">Relatórios</div>

        {/* ===== 2. IMPLEMENTAÇÃO DO DIALOG ===== */}
        <Dialog>
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
            <OnboardingForm />
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
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-2">
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
                        <td className="px-4 py-3 text-sm" colSpan={8}>
                          Carregando...
                        </td>
                      </tr>
                    )}
                    {error && !loading && (
                      <tr>
                        <td className="px-4 py-3 text-sm text-red-600" colSpan={8}>
                          {error}
                        </td>
                      </tr>
                    )}
                    {!loading && !error && rows.length === 0 && (
                      <tr>
                        <td className="px-4 py-3 text-sm" colSpan={8}>
                          Nenhum relatório encontrado.
                        </td>
                      </tr>
                    )}
                    {!loading && !error && orderedMonthKeys.map((mk) => {
                      const groupRows = groups[mk] || [];
                      const isExpanded = expandedMonths.includes(mk);
                      const totalExp = groupRows.length;
                      const totalKg = sumQty(groupRows);
                      return (
                        <>
                          {/* Linha de resumo do mês */}
                          <tr key={`sum-${mk}`} className="bg-gray-100 border-b">
                            <td colSpan={8} className="px-4 py-3 text-sm text-gray-900">
                              <div className="flex items-center gap-4">
                                <button
                                  aria-label={isExpanded ? "Recolher" : "Expandir"}
                                  onClick={() => toggleMonth(mk)}
                                  className="rounded-full w-6 h-6 flex items-center justify-center border border-gray-400 text-gray-700"
                                >
                                  {isExpanded ? "−" : "+"}
                                </button>
                                <div className="flex-1 grid grid-cols-1">
                                  <div><span className="font-medium">Mês</span>: {mk}</div>
                                  <div><span className="font-medium">Total Expedições</span>: {totalExp}</div>
                                </div>
                              </div>
                            </td>
                          </tr>

                          {/* Headers por mês, dentro da área expansível */}
                          {isExpanded && (
                            <tr className="bg-gray-50 border-b">
                              <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Nº da NF</th>
                              <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Cliente</th>
                              <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Produto</th>
                              <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Data Expe.</th>
                              <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Quantidade</th>
                              <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Data Prod/Lote</th>
                              <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Destino</th>
                              <th className="px-4 py-3 text-center text-sm font-medium text-gray-900">Ações</th>
                            </tr>
                          )}

                          {/* Linhas detalhadas do mês */}
                          {isExpanded && groupRows.map((row, idx) => {
                            const rkey = `${row.reportId}-${row.productCode}-${idx}`;
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
                                        aria-label={rExpanded ? "Recolher detalhes" : "Expandir detalhes"}
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
                                    <div className="flex items-center gap-2">
                                      <span>{row.productName}</span>
                                    </div>
                                  </td>
                                  <td className="px-4 py-3 text-sm text-gray-900">
                                    {row.shipmentDate}
                                  </td>
                                  <td className="px-4 py-3 text-sm text-gray-900">
                                    {row.quantity}
                                  </td>
                                  <td className="px-4 py-3 text-sm text-gray-900">
                                    {row.productionDate}
                                  </td>
                                  <td className="px-4 py-3 text-sm text-gray-900">
                                    {row.destination}
                                  </td>
                                  <td className="px-4 py-3 text-center">
                                    <div className="flex justify-center space-x-2">
                                      <Button variant="ghost" size="sm" className="h-8 px-2">
                                        <Edit className="h-4 w-4" />
                                      </Button>
                                      <Button variant="ghost" size="sm" className="h-8 px-2">
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </td>
                                </tr>

                                {rExpanded && (
                                  <tr key={`${rkey}-details`} className="bg-gray-50">
                                    <td colSpan={8} className="px-4 py-3 text-sm text-gray-900">
                                      <div className="grid grid-cols-5 gap-6">
                                        <div>
                                          <div className="text-gray-600">Placa do veículo</div>
                                          <div className="font-medium">{row.deliverVehicle ?? "—"}</div>
                                        </div>
                                        <div>
                                          <div className="text-gray-600">Condições sanitárias</div>
                                          {row.hasGoodSanitaryCondition ? (
                                            <span className="inline-flex items-center px-2 py-0.5 rounded border border-green-500 text-green-600">Conforme</span>
                                          ) : (
                                            <span className="inline-flex items-center px-2 py-0.5 rounded border border-red-500 text-red-600">Não conforme</span>
                                          )}
                                        </div>
                                        <div>
                                          <div className="text-gray-600">Temperatura</div>
                                          <div className="font-medium">{Number.isFinite(row.productTemperature) ? `${row.productTemperature}°` : "—"}</div>
                                        </div>
                                        <div>
                                          <div className="text-gray-600">Responsável pelo preenchimento</div>
                                          <div className="font-medium">{/* Nome será resolvido no backend/usuario map se necessário */}</div>
                                        </div>
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
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-100 border-b">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">
                        Mês
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">
                        Total Expedições
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">
                        Total (kg)
                      </th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-900">
                        <div className="flex justify-end space-x-2">
                          <Button
                            onClick={handleExportPDF}
                            variant="outline"
                            size="sm"
                            className="h-8 px-3 text-xs bg-transparent"
                          >
                            Gerar PDF
                          </Button>
                          <Button
                            onClick={handleExportExcel}
                            variant="outline"
                            size="sm"
                            className="h-8 px-3 text-xs bg-transparent"
                          >
                            Gerar Excel
                          </Button>
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200"></tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}