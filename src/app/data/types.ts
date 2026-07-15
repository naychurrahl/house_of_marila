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
  userId: string;
  date: string;
  status: 'processing' | 'shipped' | 'delivered';
  paymentStatus: 'pending' | 'success' | 'failed';
  subtotal: number;
  shipping: number;
  tax: number;
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

export interface User {
  id: string;
  name: string | null;
  email: string;
  role: 'guest' | 'customer' | 'staff' | 'admin';
}

export interface SiteSettings {
  name: string;
  tagline: string | null;
  logo: string | null;
  instagram: string | null;
  twitter: string | null;
  pinterest: string | null;
}

export interface Staff {
  id: string;
  name: string | null;
  email: string;
  role: 'admin' | 'staff';
  active: 'active' | 'inactive';
}
