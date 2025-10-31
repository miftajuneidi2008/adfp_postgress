"use server";
import { getProductName } from "./data/Product";


export async function getProductsAction() {
  try {
    const products = await getProductName();
    return products; // On success, return the data
  } catch (error) {
    console.error("Server Action Error:", error);

    return { error: "Failed to fetch products from the database." };
  }
}