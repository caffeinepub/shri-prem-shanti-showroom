export interface Product {
  id: bigint;
  name: string;
  description: string;
  price: bigint;
  category: string;
  image: string;
}

export interface Order {
  id: bigint;
  customerName: string;
  phone: string;
  address: string;
  productId: bigint;
  productName: string;
  price: bigint;
  timestamp: bigint;
}

export declare const backend: {
  getProducts: () => Promise<Product[]>;
  placeOrder: (customerName: string, phone: string, address: string, productId: bigint, productName: string, price: bigint) => Promise<bigint>;
  getOrders: () => Promise<Order[]>;
};
