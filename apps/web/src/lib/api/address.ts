// ─── Address API layer ────────────────────────────────────────────────────────
import api from "@/lib/axios";

export interface Address {
  id: string;
  line1: string;
  city: string;
  pincode: string;
  isDefault: boolean;
  customerId: string;
}

// Naya address banane ke liye input (id/customerId backend deta hai)
export interface CreateAddressInput {
  line1: string;
  city: string;
  pincode: string;
  isDefault?: boolean;
}

type ApiOk<T> = { success: true; data: T };

export async function listAddresses(): Promise<Address[]> {
  const { data } = await api.get<ApiOk<{ addresses: Address[] }>>("/addresses");
  return data.data.addresses;
}

export async function createAddress(input: CreateAddressInput): Promise<Address> {
  const { data } = await api.post<ApiOk<{ address: Address }>>("/addresses", input);
  return data.data.address;
}

export async function setDefaultAddress(id: string): Promise<Address> {
  const { data } = await api.patch<ApiOk<{ address: Address }>>(
    `/addresses/${id}/default`,
    {},
  );
  return data.data.address;
}

export async function deleteAddress(id: string): Promise<void> {
  await api.delete(`/addresses/${id}`);
}
