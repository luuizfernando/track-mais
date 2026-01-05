import axios from "axios";

const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
const apiUrl = process.env.NEXT_PUBLIC_API_URL;

export interface MostProductsSold {
    id: number
    nome: string
	totalSold: number
    timesSold: number
}

export interface ProductsSoldByState {
    state: string
	totalSold: number
}

export async function getProductsSold(): Promise<MostProductsSold[]> {
    const response = await axios.get<MostProductsSold[]>(
        `${apiUrl}/dashboard/mostProductsSold`,{ 
            headers: { Authorization: `Bearer ${token}` }
        }
    );
    return response.data;
}

export async function getProductsSoldState(): Promise<ProductsSoldByState[]> {
    const response = await axios.get<ProductsSoldByState[]>(
        `${apiUrl}/dashboard/productsSoldByState`,{ 
            headers: { Authorization: `Bearer ${token}` }
        }
    );
    return response.data;
}