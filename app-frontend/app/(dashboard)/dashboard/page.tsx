"use client";

import { useEffect, useState } from "react";
import axios from "axios";

type DashboardStats = {
  products: number;
  customers: number;
  vehicles: number;
};

const initialStats: DashboardStats = {
  products: 0,
  customers: 0,
  vehicles: 0,
};

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>(initialStats);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setError(null);
        setLoading(true);

        const token =
          typeof window !== "undefined" ? localStorage.getItem("token") : null;

        const response = await axios.get<DashboardStats>(
          `${process.env.NEXT_PUBLIC_API_URL}/dashboard/stats`,
          token ? { headers: { Authorization: `Bearer ${token}` } } : undefined
        );

        setStats(response.data ?? initialStats);
      } catch (err: any) {
        console.error(err);
        setError(
          err?.response?.status === 401
            ? "Sessao expirada. Faca login novamente."
            : "Nao foi possivel carregar os dados do dashboard."
        );
        setStats(initialStats);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold text-gray-900 mb-4">Dashboard</h1>
      <div className="bg-white rounded-lg border p-6">
        <p className="text-gray-600">
          Bem-vindo ao sistema de rastreamento de producao de alimentos.
        </p>

        <div className="mt-4 min-h-[1.5rem]">
          {loading ? (
            <span className="text-sm text-gray-500">Carregando dados...</span>
          ) : error ? (
            <span className="text-sm text-red-600">{error}</span>
          ) : null}
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="font-medium text-gray-900">Produtos cadastrados</h3>
            <p className="text-3xl font-bold text-yellow-600 mt-2">
              {stats.products}
            </p>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-medium text-gray-900">Clientes ativos</h3>
            <p className="text-3xl font-bold text-blue-600 mt-2">
              {stats.customers}
            </p>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="font-medium text-gray-900">Veiculos</h3>
            <p className="text-3xl font-bold text-green-600 mt-2">
              {stats.vehicles}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
