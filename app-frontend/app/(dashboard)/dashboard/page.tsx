"use client";

import { useEffect, useState } from "react";
import { 
	getProductsSold,
	getProductsSoldState,
	MostProductsSold,
	ProductsSoldByState 
} from "./requests";
import axios from "axios";

import { LineChart } from "@mui/x-charts/LineChart";
import { PieChart } from "@mui/x-charts/PieChart";
import { BarChart } from "@mui/x-charts/BarChart";
import { SparkLineChart } from '@mui/x-charts/SparkLineChart';
import Box from '@mui/material/Box';
import { Card, CardContent, Typography } from "@mui/material";

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
	const [mostProductsSold, setMostProductsSold] = useState<MostProductsSold[]>([]);
	const [productsSoldState, setProductsSoldState] = useState<ProductsSoldByState[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	// === Dados fictícios ===
	const faturamentoMensal = [
		{ mes: "Jan", valor: 12000 },
		{ mes: "Fev", valor: 15000 },
		{ mes: "Mar", valor: 13400 },
		{ mes: "Abr", valor: 18000 },
		{ mes: "Mai", valor: 21000 },
		{ mes: "Jun", valor: 25000 },
	];

	const entregasPorEstado = [
		{ estado: "SP", entregas: 820 },
		{ estado: "RJ", entregas: 430 },
		{ estado: "MG", entregas: 350 },
		{ estado: "PR", entregas: 270 },
		{ estado: "BA", entregas: 190 },
	];

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

				
				setMostProductsSold(await getProductsSold());
				setProductsSoldState(await getProductsSoldState());
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

	useEffect(() => {
		console.log("Most Products Sold:", mostProductsSold);
		console.log("Most Products Sold:", productsSoldState);
	}, [mostProductsSold]);

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

				<div className="mt-6 grid grid-cols-1 md:grid-cols-6 gap-6">
					<Card className="shadow-md rounded-2xl">
						<CardContent>
							<h3 className="font-medium text-gray-900">Produtos cadastrados</h3>
							<p className="text-3xl font-bold text-yellow-600 mt-2">
								{stats.products}
							</p>
							<Box flexGrow={1}>
								<SparkLineChart data={[1, 4, 2, 5, 7, 2, 4, 6]} height={100} />
							</Box>
						</CardContent>
					</Card>

					<Card className="shadow-md rounded-2xl">
						<CardContent>
							<h3 className="font-medium text-gray-900">Clientes ativos</h3>
							<p className="text-3xl font-bold text-blue-600 mt-2">
								{stats.customers}
							</p>
							<Box flexGrow={1}>
								<SparkLineChart data={[1, 4, 2, 5, 7, 2, 4, 6]} height={100} />
							</Box>
						</CardContent>
					</Card>

					<Card className="shadow-md rounded-2xl">
						<CardContent>
							<h3 className="font-medium text-gray-900">Veiculos</h3>
							<p className="text-3xl font-bold text-green-600 mt-2">
								{stats.vehicles}
							</p>
							<Box flexGrow={1}>
								<SparkLineChart data={[1, 4, 2, 5, 7, 2, 4, 6]} height={100} />
							</Box>
						</CardContent>
					</Card>

					{/* === Produtos Mais Vendidos === */}
					<Card className="col-span-3 shadow-md rounded-2xl">
						<CardContent>
							<Typography variant="h6" className="mb-4 font-semibold">
								Produtos Mais Vendidos
							</Typography>
							<PieChart
								series={[
									{
										data: mostProductsSold.map((product) => ({
											id: product.id,
											value: product.totalSold,
											label: product.nome,
										})),
										innerRadius: 40,
										outerRadius: 100,
										paddingAngle: 1,
									},
								]}
								height={200}
							/>
						</CardContent>
					</Card>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
					{/* === Faturamento Mensal === */}
					<Card className="shadow-md rounded-2xl">
						<CardContent>
							<Typography variant="h6" className="mb-4 font-semibold">
								Faturamento Mensal
							</Typography>
							<LineChart
								xAxis={[{ scaleType: 'point', data: faturamentoMensal.map((d) => d.mes) }]}
								series={[
									{
										data: faturamentoMensal.map((d) => d.valor),
										label: "Faturamento (R$)",
										color: "#F0CC4F",
									},
								]}
								height={300}
							/>
						</CardContent>
					</Card>

					{/* === Locais de Entrega === */}
					<Card className="shadow-md rounded-2xl col-span-1">
						<CardContent>
							<Typography variant="h6" className="mb-4 font-semibold">
								Entregas por Estado
							</Typography>
							<BarChart
								xAxis={[
									{
										scaleType: "band",
										data: productsSoldState.map((products) => products.state.toUpperCase()),
									},
								]}
								series={[
									{
										data: productsSoldState.map((products) => products.totalSold),
										label: "Qtd de Entregas",
										color: "#F0CC4F",
									},
								]}
								height={300}
							/>
						</CardContent>
					</Card>
				</div>

			</div>
		</div>
	);
}
