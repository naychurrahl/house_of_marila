import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  CartItem, Product, Collection, Article, Location, Order, User, Address,
  SiteSettings, Staff, ChatMessage, ChatConversationSummary, Review, ReviewSubjectType,
} from '@/app/data/types';
import { ApiRequest, baseUrl, setToken, clearToken } from '@/app/context/ApiRequest';

type NewAddress = Omit<Address, 'id'>;
type NewProduct = Omit<Product, 'id'>;
type NewCollection = Omit<Collection, 'id' | 'productIds'>;
type NewArticle = Omit<Article, 'id'>;
type NewLocation = Omit<Location, 'id'>;
type UploadFolder = 'products' | 'collections' | 'articles' | 'site';

interface AppContextType {
  // catalog
  products: Product[];
  collections: Collection[];
  articles: Article[];
  locations: Location[];
  categories: string[];
  settings: SiteSettings | null;
  paystackPublicKey: string | null;
  catalogReady: boolean;

  // auth
  user: User | null;
  authReady: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: { name?: string }) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  forgotPassword: (email: string) => Promise<{ message: string; devCode?: string }>;
  resetPassword: (email: string, code: string, newPassword: string) => Promise<void>;

  // cart
  cartItems: CartItem[];
  addToCart: (item: CartItem) => Promise<void>;
  removeFromCart: (productId: string, size: string, color: string) => Promise<void>;
  updateQuantity: (productId: string, size: string, color: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  cartCount: number;
  cartTotal: number;

  // wishlist - persisted server-side once logged in, local-only for guests
  wishlist: string[];
  toggleWishlist: (productId: string) => void;

  // addresses
  addresses: Address[];
  addAddress: (data: NewAddress) => Promise<Address>;
  updateAddress: (id: string, data: Partial<NewAddress>) => Promise<void>;
  deleteAddress: (id: string) => Promise<void>;

  // orders / payment
  orders: Order[];
  placeOrder: (addressId?: string) => Promise<Order>;
  verifyPayment: (reference: string) => Promise<Order & { gatewayStatus: string }>;

  // chat (customer support - polling based)
  chatMessages: ChatMessage[];
  chatConversationId: string | null;
  chatUnreadCount: number;
  chatQueue: ChatConversationSummary[];
  chatMine: ChatConversationSummary[];
  fetchChat: (markRead?: boolean) => Promise<void>;
  fetchChatThread: (conversationId: string) => Promise<void>;
  fetchChatQueue: () => Promise<void>;
  sendChatMessage: (body: string) => Promise<void>;
  sendStaffReply: (conversationId: string, body: string) => Promise<void>;

  // reviews - fetched on demand per subject, not held as global state
  fetchReviews: (subjectType: ReviewSubjectType, subjectId?: string) => Promise<{ average: number; count: number; reviews: Review[] }>;
  addReview: (data: { subjectType: ReviewSubjectType; subjectId?: string; rating: number; comment: string }) => Promise<Review>;
  deleteReview: (id: string) => Promise<void>;
  allReviews: Review[];
  fetchAllReviews: () => Promise<void>;

  // admin/staff only
  staff: Staff[];
  uploadImage: (file: File, folder: UploadFolder) => Promise<string>;
  addProductAdmin: (data: NewProduct) => Promise<Product>;
  updateProductAdmin: (id: string, data: Partial<NewProduct>) => Promise<void>;
  deleteProductAdmin: (id: string) => Promise<void>;
  addCategory: (name: string) => Promise<void>;
  deleteCategory: (name: string) => Promise<void>;
  addCollectionAdmin: (data: NewCollection) => Promise<Collection>;
  updateCollectionAdmin: (id: string, data: Partial<NewCollection>) => Promise<void>;
  deleteCollectionAdmin: (id: string) => Promise<void>;
  addArticleAdmin: (data: NewArticle) => Promise<Article>;
  updateArticleAdmin: (id: string, data: Partial<NewArticle>) => Promise<void>;
  deleteArticleAdmin: (id: string) => Promise<void>;
  addLocationAdmin: (data: NewLocation) => Promise<Location>;
  updateLocationAdmin: (id: string, data: Partial<NewLocation>) => Promise<void>;
  deleteLocationAdmin: (id: string) => Promise<void>;
  updateSettings: (data: Partial<SiteSettings>) => Promise<void>;
  addStaff: (data: { email: string; name?: string; password: string; role: 'admin' | 'staff' }) => Promise<void>;
  deleteStaff: (id: string) => Promise<void>;
  updateOrderStatus: (id: string, status: Order['status']) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [paystackPublicKey, setPaystackPublicKey] = useState<string | null>(null);
  const [catalogReady, setCatalogReady] = useState(false);

  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);

  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatConversationId, setChatConversationId] = useState<string | null>(null);
  const [chatUnreadCount, setChatUnreadCount] = useState(0);
  const [chatQueue, setChatQueue] = useState<ChatConversationSummary[]>([]);
  const [chatMine, setChatMine] = useState<ChatConversationSummary[]>([]);
  const [allReviews, setAllReviews] = useState<Review[]>([]);

  const fetchProducts = () => ApiRequest({ url: `${baseUrl}/product` }).then((data: Product[]) => setProducts(data));
  const fetchCollections = () => ApiRequest({ url: `${baseUrl}/collection` }).then((data: Collection[]) => setCollections(data));
  const fetchArticles = () => ApiRequest({ url: `${baseUrl}/article` }).then((data: Article[]) => setArticles(data));
  const fetchLocations = () => ApiRequest({ url: `${baseUrl}/location` }).then((data: Location[]) => setLocations(data));
  const fetchCategories = () => ApiRequest({ url: `${baseUrl}/category` }).then((data: string[]) => setCategories(data));
  const fetchSettings = () => ApiRequest({ url: `${baseUrl}/settings` }).then((data: SiteSettings) => setSettings(data));
  const fetchPaystackKey = () =>
    ApiRequest({ url: `${baseUrl}/paystack-key` }).then((data: { key: string }) => setPaystackPublicKey(data.key));

  // Public catalog/settings data doesn't depend on auth, so it loads unconditionally.
  useEffect(() => {
    Promise.all([
      fetchProducts(), fetchCollections(), fetchArticles(), fetchLocations(),
      fetchCategories(), fetchSettings(), fetchPaystackKey(),
    ])
      .catch(console.error)
      .finally(() => setCatalogReady(true));
  }, []);

  // Restores the session from the stored bearer token on load.
  useEffect(() => {
    ApiRequest({ url: `${baseUrl}/ping` })
      .then((data: { user?: User }) => {
        if (data.user) setUser(data.user);
      })
      .catch(err => {
        console.error(err);
        // Token was rejected (expired/revoked/deactivated) - stop sending it.
        clearToken();
      })
      .finally(() => setAuthReady(true));
  }, []);

  const fetchCart = () => {
    ApiRequest({ url: `${baseUrl}/cart` })
      .then((data: CartItem[]) => setCartItems(data))
      .catch(console.error);
  };

  const fetchOrders = () => {
    ApiRequest({ url: `${baseUrl}/orders` })
      .then((data: Order[]) => setOrders(data))
      .catch(console.error);
  };

  const fetchAddresses = () => {
    ApiRequest({ url: `${baseUrl}/address` })
      .then((data: Address[]) => setAddresses(data))
      .catch(console.error);
  };

  const fetchWishlist = () => {
    ApiRequest({ url: `${baseUrl}/wishlist` })
      .then((data: string[]) => setWishlist(data))
      .catch(console.error);
  };

  const fetchStaff = () => {
    ApiRequest({ url: `${baseUrl}/staff` })
      .then((data: Staff[]) => setStaff(data))
      .catch(console.error);
  };

  // Customer-shaped endpoint call: GET /chat (no id) returns the caller's own
  // conversation for a customer, but {queue, mine} for staff/admin - only
  // ever call this for customers (see fetchChatQueue for the staff shape).
  const fetchChat = (markRead = true) => {
    return ApiRequest({ url: `${baseUrl}/chat?markRead=${markRead ? '1' : '0'}` })
      .then((data: { conversationId?: string; unreadCount?: number; messages?: ChatMessage[] }) => {
        setChatConversationId(data.conversationId ?? null);
        setChatUnreadCount(data.unreadCount ?? 0);
        setChatMessages(data.messages ?? []);
      })
      .catch(console.error);
  };

  const fetchChatThread = (conversationId: string) => {
    return ApiRequest({ url: `${baseUrl}/chat/${conversationId}` })
      .then((data: { conversationId: string; messages: ChatMessage[] }) => {
        setChatConversationId(data.conversationId);
        setChatMessages(data.messages);
      })
      .catch(console.error);
  };

  const fetchChatQueue = () => {
    return ApiRequest({ url: `${baseUrl}/chat` })
      .then((data: { queue: ChatConversationSummary[]; mine: ChatConversationSummary[] }) => {
        setChatQueue(data.queue);
        setChatMine(data.mine);
      })
      .catch(console.error);
  };

  const sendChatMessage = async (body: string) => {
    await ApiRequest({ url: `${baseUrl}/chat`, method: 'POST', body: { body } });
    await fetchChat(true);
  };

  const sendStaffReply = async (conversationId: string, body: string) => {
    await ApiRequest({ url: `${baseUrl}/chat`, method: 'POST', body: { conversationId, body } });
    await Promise.all([fetchChatThread(conversationId), fetchChatQueue()]);
  };

  const fetchReviews = (subjectType: ReviewSubjectType, subjectId?: string) => {
    const path = subjectType === 'site' ? 'site' : `${subjectType}/${subjectId}`;
    return ApiRequest({ url: `${baseUrl}/review/${path}` }) as Promise<{
      average: number; count: number; reviews: Review[];
    }>;
  };

  const addReview = async (data: { subjectType: ReviewSubjectType; subjectId?: string; rating: number; comment: string }) => {
    return (await ApiRequest({ url: `${baseUrl}/review`, method: 'POST', body: data })) as Review;
  };

  const deleteReview = async (id: string) => {
    await ApiRequest({ url: `${baseUrl}/review/${id}`, method: 'DELETE' });
  };

  const fetchAllReviews = () => {
    return ApiRequest({ url: `${baseUrl}/review/all` })
      .then((data: Review[]) => setAllReviews(data))
      .catch(console.error);
  };

  // Cart/orders/addresses/wishlist are per-account, so (re)load them whenever
  // the session changes. Wishlist stays as-is (local) for guests instead of
  // clearing, so browsing before logging in isn't lost.
  useEffect(() => {
    if (user) {
      fetchCart();
      fetchOrders();
      fetchAddresses();
      fetchWishlist();
      if (user.role === 'admin' || user.role === 'staff') {
        fetchChatQueue();
        fetchAllReviews();
        if (user.role === 'admin') fetchStaff();
      } else {
        fetchChat(false); // badge-only; the chat panel marks read once actually opened
      }
    } else {
      setCartItems([]);
      setOrders([]);
      setAddresses([]);
      setStaff([]);
      setChatMessages([]);
      setChatConversationId(null);
      setChatUnreadCount(0);
      setChatQueue([]);
      setChatMine([]);
      setAllReviews([]);
    }
  }, [user]);

  const login = async (email: string, password: string) => {
    const data = await ApiRequest({
      url: `${baseUrl}/auth`,
      method: 'POST',
      body: { email, password },
    });
    setToken(data.token);
    setUser(data.user as User);
  };

  const register = async (name: string, email: string, password: string) => {
    const data = await ApiRequest({
      url: `${baseUrl}/user`,
      method: 'POST',
      body: { name, email, password },
    });
    setToken(data.token);
    setUser(data.user as User);
  };

  const logout = async () => {
    try {
      await ApiRequest({ url: `${baseUrl}/auth`, method: 'DELETE' });
    } finally {
      clearToken();
    }
    setUser(null);
  };

  const updateProfile = async (data: { name?: string }) => {
    await ApiRequest({ url: `${baseUrl}/profile`, method: 'PUT', body: data });
    setUser(prev => (prev ? { ...prev, ...data } : prev));
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    await ApiRequest({ url: `${baseUrl}/password`, method: 'PUT', body: { currentPassword, newPassword } });
  };

  const forgotPassword = async (email: string) => {
    return (await ApiRequest({
      url: `${baseUrl}/forgot`,
      method: 'POST',
      body: { email },
    })) as { message: string; devCode?: string };
  };

  const resetPassword = async (email: string, code: string, newPassword: string) => {
    await ApiRequest({
      url: `${baseUrl}/reset`,
      method: 'POST',
      body: { email, code, newPassword },
    });
  };

  const addToCart = async (item: CartItem) => {
    if (!user) throw new Error('Please log in to add items to your cart');
    await ApiRequest({ url: `${baseUrl}/cart`, method: 'POST', body: item });
    fetchCart();
  };

  const removeFromCart = async (productId: string, size: string, color: string) => {
    await ApiRequest({ url: `${baseUrl}/cart`, method: 'DELETE', body: { productId, size, color } });
    fetchCart();
  };

  const updateQuantity = async (productId: string, size: string, color: string, quantity: number) => {
    await ApiRequest({ url: `${baseUrl}/cart`, method: 'PUT', body: { productId, size, color, quantity } });
    fetchCart();
  };

  const clearCart = async () => {
    await ApiRequest({ url: `${baseUrl}/cart`, method: 'DELETE', body: {} });
    setCartItems([]);
  };

  const toggleWishlist = (productId: string) => {
    const isWishlisted = wishlist.includes(productId);

    // Optimistic local update either way; guests stop here since there's
    // nowhere to persist it without an account.
    setWishlist(prev =>
      isWishlisted ? prev.filter(id => id !== productId) : [...prev, productId]
    );

    if (!user) return;

    const request = isWishlisted
      ? ApiRequest({ url: `${baseUrl}/wishlist`, method: 'DELETE', body: { productId } })
      : ApiRequest({ url: `${baseUrl}/wishlist`, method: 'POST', body: { productId } });

    request.catch(err => {
      console.error(err);
      // Roll back the optimistic update if the server call failed.
      setWishlist(prev =>
        isWishlisted ? [...prev, productId] : prev.filter(id => id !== productId)
      );
    });
  };

  const addAddress = async (data: NewAddress) => {
    const address = (await ApiRequest({ url: `${baseUrl}/address`, method: 'POST', body: data })) as Address;
    fetchAddresses();
    return address;
  };

  const updateAddress = async (id: string, data: Partial<NewAddress>) => {
    await ApiRequest({ url: `${baseUrl}/address`, method: 'PUT', body: { id, ...data } });
    fetchAddresses();
  };

  const deleteAddress = async (id: string) => {
    await ApiRequest({ url: `${baseUrl}/address/${id}`, method: 'DELETE' });
    fetchAddresses();
  };

  const placeOrder = async (addressId?: string) => {
    const order = await ApiRequest({
      url: `${baseUrl}/orders`,
      method: 'POST',
      body: addressId ? { addressId } : {},
    });
    setOrders(prev => [order as Order, ...prev]);
    setCartItems([]);
    return order as Order;
  };

  const verifyPayment = async (reference: string) => {
    const order = (await ApiRequest({ url: `${baseUrl}/payment/${reference}` })) as Order & { gatewayStatus: string };
    setOrders(prev => prev.map(o => (o.id === order.id ? order : o)));
    return order;
  };

  const updateOrderStatus = async (id: string, status: Order['status']) => {
    await ApiRequest({ url: `${baseUrl}/orders`, method: 'PUT', body: { id, status } });
    setOrders(prev => prev.map(o => (o.id === id ? { ...o, status } : o)));
  };

  // == ADMIN ==
  const uploadImage = async (file: File, folder: UploadFolder) => {
    const body = new FormData();
    body.append('folder', folder);
    body.append('image', file);

    const result = await ApiRequest({ url: `${baseUrl}/upload`, method: 'POST', body });
    return (result as { url: string }).url;
  };

  const addProductAdmin = async (data: NewProduct) => {
    const product = (await ApiRequest({ url: `${baseUrl}/product`, method: 'POST', body: data })) as Product;
    fetchProducts();
    return product;
  };

  const updateProductAdmin = async (id: string, data: Partial<NewProduct>) => {
    await ApiRequest({ url: `${baseUrl}/product`, method: 'PUT', body: { id, ...data } });
    fetchProducts();
  };

  const deleteProductAdmin = async (id: string) => {
    await ApiRequest({ url: `${baseUrl}/product/${id}`, method: 'DELETE' });
    fetchProducts();
  };

  const addCategory = async (name: string) => {
    await ApiRequest({ url: `${baseUrl}/category`, method: 'POST', body: { name } });
    fetchCategories();
  };

  const deleteCategory = async (name: string) => {
    await ApiRequest({ url: `${baseUrl}/category/${name}`, method: 'DELETE' });
    fetchCategories();
  };

  const addCollectionAdmin = async (data: NewCollection) => {
    const collection = (await ApiRequest({ url: `${baseUrl}/collection`, method: 'POST', body: data })) as Collection;
    fetchCollections();
    return collection;
  };

  const updateCollectionAdmin = async (id: string, data: Partial<NewCollection>) => {
    await ApiRequest({ url: `${baseUrl}/collection`, method: 'PUT', body: { id, ...data } });
    fetchCollections();
  };

  const deleteCollectionAdmin = async (id: string) => {
    await ApiRequest({ url: `${baseUrl}/collection/${id}`, method: 'DELETE' });
    fetchCollections();
    fetchProducts(); // products in the deleted collection lose their collectionId
  };

  const addArticleAdmin = async (data: NewArticle) => {
    const article = (await ApiRequest({ url: `${baseUrl}/article`, method: 'POST', body: data })) as Article;
    fetchArticles();
    return article;
  };

  const updateArticleAdmin = async (id: string, data: Partial<NewArticle>) => {
    await ApiRequest({ url: `${baseUrl}/article`, method: 'PUT', body: { id, ...data } });
    fetchArticles();
  };

  const deleteArticleAdmin = async (id: string) => {
    await ApiRequest({ url: `${baseUrl}/article/${id}`, method: 'DELETE' });
    fetchArticles();
  };

  const addLocationAdmin = async (data: NewLocation) => {
    const location = (await ApiRequest({ url: `${baseUrl}/location`, method: 'POST', body: data })) as Location;
    fetchLocations();
    return location;
  };

  const updateLocationAdmin = async (id: string, data: Partial<NewLocation>) => {
    await ApiRequest({ url: `${baseUrl}/location`, method: 'PUT', body: { id, ...data } });
    fetchLocations();
  };

  const deleteLocationAdmin = async (id: string) => {
    await ApiRequest({ url: `${baseUrl}/location/${id}`, method: 'DELETE' });
    fetchLocations();
  };

  const updateSettings = async (data: Partial<SiteSettings>) => {
    await ApiRequest({ url: `${baseUrl}/settings`, method: 'PUT', body: data });
    fetchSettings();
  };

  const addStaff = async (data: { email: string; name?: string; password: string; role: 'admin' | 'staff' }) => {
    await ApiRequest({ url: `${baseUrl}/staff`, method: 'POST', body: data });
    fetchStaff();
  };

  const deleteStaff = async (id: string) => {
    await ApiRequest({ url: `${baseUrl}/staff/${id}`, method: 'DELETE' });
    fetchStaff();
  };
  // == ADMIN ==

  const cartCount = cartItems.reduce((total, item) => total + item.quantity, 0);
  const cartTotal = cartItems.reduce((sum, item) => {
    const product = products.find(p => p.id === item.productId);
    return sum + (product?.price || 0) * item.quantity;
  }, 0);

  return (
    <AppContext.Provider
      value={{
        products,
        collections,
        articles,
        locations,
        categories,
        settings,
        paystackPublicKey,
        catalogReady,
        user,
        authReady,
        login,
        register,
        logout,
        updateProfile,
        changePassword,
        forgotPassword,
        resetPassword,
        cartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        cartCount,
        cartTotal,
        wishlist,
        toggleWishlist,
        addresses,
        addAddress,
        updateAddress,
        deleteAddress,
        orders,
        placeOrder,
        verifyPayment,
        chatMessages,
        chatConversationId,
        chatUnreadCount,
        chatQueue,
        chatMine,
        fetchChat,
        fetchChatThread,
        fetchChatQueue,
        sendChatMessage,
        sendStaffReply,
        fetchReviews,
        addReview,
        deleteReview,
        allReviews,
        fetchAllReviews,
        staff,
        uploadImage,
        addProductAdmin,
        updateProductAdmin,
        deleteProductAdmin,
        addCategory,
        deleteCategory,
        addCollectionAdmin,
        updateCollectionAdmin,
        deleteCollectionAdmin,
        addArticleAdmin,
        updateArticleAdmin,
        deleteArticleAdmin,
        addLocationAdmin,
        updateLocationAdmin,
        deleteLocationAdmin,
        updateSettings,
        addStaff,
        deleteStaff,
        updateOrderStatus,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
}
