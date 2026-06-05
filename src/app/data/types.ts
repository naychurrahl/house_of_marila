export interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  description: string;
  images: string[];
  sizes: string[];
  colors: string[];
  inStock: boolean;
  tags: string[];
  collectionId?: string;
}

export interface Collection {
  id: string;
  name: string;
  description: string;
  season: string;
  year: string;
  coverImage: string;
  images: string[];
  story: string;
  productIds: string[];
}

export interface Article {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  author: string;
  date: string;
  category: string;
  coverImage: string;
  images: string[];
}

export interface CartItem {
  productId: string;
  size: string;
  color: string;
  quantity: number;
}

export interface Order {
  id: string;
  date: string;
  status: 'processing' | 'shipped' | 'delivered';
  total: number;
  items: CartItem[];
}

export interface Address {
  id: string;
  name: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  isDefault: boolean;
}

export interface Location {
  id: string;
  name: string;
  address: string;
  city: string;
  hours: string;
  phone: string;
}
