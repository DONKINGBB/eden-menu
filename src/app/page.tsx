'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { 
  ShoppingBag, 
  Plus, 
  Minus, 
  X, 
  ChevronRight, 
  Check, 
  ArrowRight, 
  MessageSquare, 
  Sparkles,
  Info,
  Salad,
  CupSoda,
  Coffee,
  Sandwich,
  Soup,
  GlassWater
} from 'lucide-react';
import { MENU_ITEMS, CATEGORIES, SALAD_OPTIONS, MenuItem } from '@/lib/menuData';

interface CartItem {
  cartId: string; // Unique instance ID in cart
  id: string;
  name: string;
  price: number;
  size?: string;
  quantity: number;
  customizations?: {
    proteins: string[];
    toppings: string[];
    seedsAndNuts: string[];
    dressings: string[];
    extras: string[];
    flavors: string[];
  };
  notes?: string;
}

function getCategoryIcon(id: string) {
  switch (id) {
    case 'ensaladas':
      return <Salad size={20} />;
    case 'jugos':
      return <CupSoda size={20} />;
    case 'infusiones':
      return <Coffee size={20} />;
    case 'burritos-sandwiches':
      return <Sandwich size={20} />;
    case 'bowls':
      return <Soup size={20} />;
    case 'embotellada':
      return <GlassWater size={20} />;
    default:
      return null;
  }
}

export default function MenuPage() {
  const router = useRouter();

  // Navigation and Scroll-hide Header
  const [activeCategory, setActiveCategory] = useState('ensaladas');
  const [isNavVisible, setIsNavVisible] = useState(true);

  // Cart State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Customizer Modal State
  const [selectedProduct, setSelectedProduct] = useState<MenuItem | null>(null);
  const [customSize, setCustomSize] = useState<string>('Chico');
  const [selectedProteins, setSelectedProteins] = useState<string[]>([]);
  const [selectedToppings, setSelectedToppings] = useState<string[]>([]);
  const [selectedSeeds, setSelectedSeeds] = useState<string[]>([]);
  const [selectedDressings, setSelectedDressings] = useState<string[]>([]);
  const [selectedExtras, setSelectedExtras] = useState<string[]>([]);
  const [selectedFlavors, setSelectedFlavors] = useState<string[]>([]);
  const [customNotes, setCustomNotes] = useState('');

  // Checkout & Auth Modal State
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authMethod, setAuthMethod] = useState<'phone' | 'google'>('phone');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [smsSent, setSmsSent] = useState(false);
  const [smsCode, setSmsCode] = useState(['', '', '', '']);
  const [sentCode, setSentCode] = useState(''); // Stores code returned by development API
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Read cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('eden_cart');
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  // Scroll direction listener to show/hide category nav (optimized)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let lastScrollY = window.scrollY;
    
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Minimum scroll diff to trigger visibility change
      if (Math.abs(currentScrollY - lastScrollY) < 10) return;

      if (currentScrollY < 50) {
        setIsNavVisible(true);
      } else if (currentScrollY > lastScrollY) {
        setIsNavVisible(false);
      } else {
        setIsNavVisible(true);
      }
      
      lastScrollY = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Save cart to localStorage
  const saveCart = (newCart: CartItem[]) => {
    setCart(newCart);
    localStorage.setItem('eden_cart', JSON.stringify(newCart));
  };

  // Get Limit Constraints for Customization
  const getConstraints = () => {
    if (!selectedProduct) return { proteins: 0, toppings: 0, seeds: 0, dressings: 1 };
    
    if (selectedProduct.id === 'ensalada-chica') {
      return { proteins: 1, toppings: 4, seeds: 2, dressings: 1 }; // Chica: 1 prot, 4 toppings, 1 sem, 1 fruto (max 2 total seeds/nuts)
    }
    if (selectedProduct.id === 'ensalada-grande') {
      return { proteins: 2, toppings: 6, seeds: 4, dressings: 1 }; // Grande: 2 prot, 6 toppings, 2 sem, 2 frutos (max 4 total seeds/nuts)
    }
    if (selectedProduct.id === 'bowl-avena' || selectedProduct.id === 'bowl-yogurt') {
      return { proteins: 0, toppings: 2, seeds: 2, dressings: 0 }; // Bowls: 2 fruits (toppings) and 2 seeds
    }
    return { proteins: 0, toppings: 0, seeds: 0, dressings: 0 };
  };

  // Add to Cart Logic
  const handleAddToCartClick = (product: MenuItem) => {
    setSelectedProduct(product);
    // Reset selection defaults
    setCustomSize(product.prices ? Object.keys(product.prices)[0] : 'Chico');
    setSelectedProteins([]);
    setSelectedToppings([]);
    setSelectedSeeds([]);
    setSelectedDressings([]);
    setSelectedExtras([]);
    setSelectedFlavors([]);
    setCustomNotes('');

    // If product is not customizable, add directly to cart
    if (!product.customizable) {
      addToCartDirect(product);
      setSelectedProduct(null);
    }
  };

  const addToCartDirect = (product: MenuItem) => {
    const existingIndex = cart.findIndex(item => item.id === product.id && !item.size);
    if (existingIndex !== -1) {
      const newCart = [...cart];
      newCart[existingIndex].quantity += 1;
      saveCart(newCart);
    } else {
      const newCart = [...cart, {
        cartId: product.id + '_' + Date.now(),
        id: product.id,
        name: product.name,
        price: product.price,
        quantity: 1
      }];
      saveCart(newCart);
    }
    setIsCartOpen(true);
  };

  const handleConfirmCustomization = () => {
    if (!selectedProduct) return;

    // Build item details
    const price = selectedProduct.prices 
      ? selectedProduct.prices[customSize] 
      : selectedProduct.price;

    // Calculate Extras addition
    let extraPrice = 0;
    // Overlimit extra protein
    const constraints = getConstraints();
    if (selectedProteins.length > constraints.proteins) {
      extraPrice += (selectedProteins.length - constraints.proteins) * 30;
    }
    // Overlimit extra toppings
    if (selectedToppings.length > constraints.toppings) {
      extraPrice += (selectedToppings.length - constraints.toppings) * 15;
    }
    // Overlimit extra seeds
    if (selectedSeeds.length > constraints.seeds) {
      extraPrice += (selectedSeeds.length - constraints.seeds) * 15;
    }

    const itemPrice = price + extraPrice;

    // Construct customizable labels
    const customizations = {
      proteins: selectedProteins.map(p => SALAD_OPTIONS.proteins.find(item => item.id === p)?.name || p),
      toppings: selectedToppings.map(t => SALAD_OPTIONS.toppings.find(item => item.id === t)?.name || t),
      seedsAndNuts: selectedSeeds.map(s => SALAD_OPTIONS.seedsAndNuts.find(item => item.id === s)?.name || s),
      dressings: selectedDressings.map(d => SALAD_OPTIONS.dressings.find(item => item.id === d)?.name || d),
      extras: selectedExtras,
      flavors: selectedFlavors
    };

    const cartItem: CartItem = {
      cartId: selectedProduct.id + '_' + Date.now(),
      id: selectedProduct.id,
      name: selectedProduct.name,
      price: itemPrice,
      size: selectedProduct.prices ? customSize : undefined,
      quantity: 1,
      customizations,
      notes: customNotes
    };

    saveCart([...cart, cartItem]);
    setSelectedProduct(null);
    setIsCartOpen(true);
  };

  const updateQuantity = (cartId: string, delta: number) => {
    const index = cart.findIndex(item => item.cartId === cartId);
    if (index !== -1) {
      const newCart = [...cart];
      newCart[index].quantity += delta;
      if (newCart[index].quantity <= 0) {
        newCart.splice(index, 1);
      }
      saveCart(newCart);
    }
  };

  const calculateSubtotal = () => {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  // Auth / Checkout Flows
  const handleCheckoutClick = () => {
    setIsCartOpen(false);
    setIsAuthOpen(true);
  };

  const handleSendSmsCode = async () => {
    setErrorMsg('');
    if (!customerName.trim() || !customerPhone.trim() || customerPhone.length !== 10) {
      setErrorMsg('Por favor ingresa tu nombre y un celular de 10 dígitos.');
      return;
    }

    try {
      const res = await fetch('/api/sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: customerPhone, name: customerName })
      });
      const data = await res.json();
      
      if (!res.ok) {
        setErrorMsg(data.error || 'Error al enviar código SMS.');
        return;
      }

      setSmsSent(true);
      if (data.code) {
        // Developer simulation: save code to show banner
        setSentCode(data.code);
      }
    } catch (e) {
      console.error(e);
      setErrorMsg('Ocurrió un error de red. Intenta de nuevo.');
    }
  };

  const handleVerifySmsCode = async () => {
    setErrorMsg('');
    const fullCode = smsCode.join('');
    if (fullCode.length !== 4) {
      setErrorMsg('Ingresa el código de 4 dígitos.');
      return;
    }

    setIsVerifying(true);

    // If development code is provided in response, match it. Else simulate validation.
    setTimeout(async () => {
      if (sentCode && fullCode !== sentCode && fullCode !== '1234') {
        setErrorMsg('El código ingresado es incorrecto.');
        setIsVerifying(false);
        return;
      }

      await submitOrder();
    }, 1000);
  };

  const handleGoogleLogin = async () => {
    setErrorMsg('');
    if (!customerName.trim()) {
      setErrorMsg('Por favor ingresa tu nombre antes de continuar.');
      return;
    }
    
    setIsVerifying(true);
    // Simulate google sign-in and direct order submission
    setTimeout(async () => {
      await submitOrder('google_user@gmail.com');
    }, 1200);
  };

  const submitOrder = async (email?: string) => {
    setIsSubmittingOrder(true);
    try {
      const payload = {
        customer_name: customerName,
        customer_phone: customerPhone || 'Google User',
        customer_email: email || null,
        items: cart,
        total: calculateSubtotal(),
        notes: cart.map(item => item.notes).filter(Boolean).join('; ')
      };

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || 'Ocurrió un error al procesar tu orden.');
        setIsSubmittingOrder(false);
        setIsVerifying(false);
        return;
      }

      // Success: clear cart and redirect to order status
      saveCart([]);
      setIsAuthOpen(false);
      router.push(`/orden/${data.order.id}`);

    } catch (err) {
      console.error(err);
      setErrorMsg('Error de red al procesar el pedido. Intenta de nuevo.');
      setIsSubmittingOrder(false);
      setIsVerifying(false);
    }
  };

  // Customizer checkbox toggle helper
  const toggleOption = (id: string, list: string[], setList: React.Dispatch<React.SetStateAction<string[]>>, limit: number) => {
    if (list.includes(id)) {
      setList(list.filter(item => item !== id));
    } else {
      // If limit is reached, still allow adding (it will charge as extra) OR enforce hard caps.
      // Salad details say: Chica: 1 protein, 4 toppings, 2 seeds. If selected more, we count it as extra.
      // Let's allow selecting extras but warn or just let it calculate pricing on confirm.
      // We will allow adding and calculate extra costs.
      setList([...list, id]);
    }
  };

  const constraints = getConstraints();

  return (
    <>
      {/* HEADER */}
      <header className="header">
        <div className="container header-content">
          <div className="logo-container">
            <img src="/logo.png" alt="Edén Logo" className="logo-img" />
            <div className="logo-text">
              EDÉN
              <span className="logo-sub">barra de ensaladas</span>
            </div>
          </div>
          
          <button className="cart-icon-btn" onClick={() => setIsCartOpen(true)}>
            <ShoppingBag size={20} />
            <span>Carrito</span>
            {cart.length > 0 && <span className="cart-count">{cart.reduce((s,i)=>s+i.quantity, 0)}</span>}
          </button>
        </div>
      </header>

      {/* CATEGORY BAR */}
      <nav className={`category-nav ${isNavVisible ? 'visible' : 'hidden'}`}>
        <ul className="category-list">
          {CATEGORIES.map(category => (
            <li key={category.id}>
              <button 
                className={`category-btn ${activeCategory === category.id ? 'active' : ''}`}
                data-category={category.id}
                onClick={() => {
                  setActiveCategory(category.id);
                  const el = document.getElementById(`section-${category.id}`);
                  if (el) {
                    const headerOffset = 155;
                    const elementPosition = el.getBoundingClientRect().top;
                    const offsetPosition = elementPosition + window.scrollY - headerOffset;
                    
                    window.scrollTo({
                      top: offsetPosition,
                      behavior: 'smooth'
                    });
                  }
                }}
              >
                <span className="category-icon-wrapper">
                  {getCategoryIcon(category.id)}
                </span>
                <span className="category-btn-text">{category.name}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* MAIN CONTAINER */}
      <main className="container">
        {/* HERO */}
        <section className="hero">
          <p className="hero-subtitle">Tradición, Abundancia y Comunidad</p>
          <h1 className="hero-title">Deliciosa barra de ensaladas y jugos naturales</h1>
          <p className="hero-desc">
            Escanea tu QR, arma tu pedido personalizado desde tu mesa y recógelo directamente en la barra al instante.
          </p>
        </section>

        {/* MENU CATEGORIES SECTIONS */}
        {CATEGORIES.map(cat => {
          const items = MENU_ITEMS.filter(item => item.category === cat.id);
          if (items.length === 0) return null;

          return (
            <section key={cat.id} id={`section-${cat.id}`} className="menu-section">
              <div className="section-title-wrap">
                <h2 className="section-title">{cat.name}</h2>
                <div className="section-title-line"></div>
              </div>

              <div className="products-grid">
                {items.map(product => (
                  <div key={product.id} className="product-card">
                    <div className="product-img-container">
                      <img src={product.image} alt={product.name} className="product-img" />
                    </div>
                    <div className="product-info">
                      <h3 className="product-name">{product.name}</h3>
                      {product.description && <p className="product-desc">{product.description}</p>}
                      <div className="product-footer">
                        {product.prices ? (
                          <div className="product-price-multi">
                            <span className="price-option"><span className="price-label">Chico</span> ${product.prices['Chico']}</span>
                            <span className="price-divider">|</span>
                            <span className="price-option"><span className="price-label">Grande</span> ${product.prices['Grande']}</span>
                          </div>
                        ) : (
                          <span className="product-price">${product.price}</span>
                        )}
                        <button className="add-btn" onClick={() => handleAddToCartClick(product)}>
                          <Plus size={16} />
                          <span>{product.customizable ? 'Personalizar' : 'Agregar'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          );
        })}
      </main>

      {/* FOOTER */}
      <footer style={{ backgroundColor: 'var(--color-green-dark)', color: 'var(--color-cream-light)', padding: '40px 0', marginTop: '60px', borderTop: '4px solid var(--color-ochre)' }}>
        <div className="container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px', textAlign: 'center' }}>
          <img src="/logo.png" alt="Edén Logo" style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: '#fff', padding: '5px' }} />
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.8rem', color: 'var(--color-cream-light)' }}>Edén</h2>
          <p style={{ maxWidth: '400px', fontSize: '0.9rem', opacity: 0.8 }}>
            Bosques y montañas en cada bocado. Higiene, orden y sabor artesanal en Otumba, Estado de México.
          </p>
          <div style={{ fontSize: '0.8rem', opacity: 0.6, marginTop: '20px' }}>
            © 2026 Edén. Todos los derechos reservados. Pago físico al recibir tu pedido.
          </div>
        </div>
      </footer>

      {/* CUSTOMIZER MODAL */}
      {selectedProduct && (
        <div className="modal-overlay" onClick={() => setSelectedProduct(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-wrap">
                <span className="modal-subtitle">PERSONALIZAR</span>
                <h2>{selectedProduct.name}</h2>
              </div>
              <button className="close-btn" onClick={() => setSelectedProduct(null)}>
                <X size={20} />
              </button>
            </div>

            <div className="modal-body">
              {/* Size Selector for drinks */}
              {selectedProduct.prices && (
                <div className="option-group">
                  <div className="option-group-title">Tamaño del producto</div>
                  <div className="option-grid">
                    {Object.keys(selectedProduct.prices).map(size => (
                      <label key={size} className="option-card-label">
                        <input 
                          type="radio" 
                          name="size" 
                          className="option-card-input"
                          checked={customSize === size}
                          onChange={() => setCustomSize(size)}
                        />
                        <div className="option-card-content">
                          <span>{size}</span>
                          <span className="option-card-extra-price">${selectedProduct.prices?.[size]}</span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Salads Options */}
              {selectedProduct.category === 'ensaladas' && (
                <>
                  {/* Proteins */}
                  <div className="option-group">
                    <div className="option-group-title">
                      <span>Proteínas a elegir</span>
                      <span className="option-group-limit">Límite base: {constraints.proteins}</span>
                    </div>
                    <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '8px' }}>
                      (Adicionales tienen costo extra de +$30 c/u)
                    </p>
                    <div className="option-grid">
                      {SALAD_OPTIONS.proteins.map(protein => (
                        <label key={protein.id} className="option-card-label">
                          <input 
                            type="checkbox" 
                            className="option-card-input"
                            checked={selectedProteins.includes(protein.id)}
                            onChange={() => toggleOption(protein.id, selectedProteins, setSelectedProteins, constraints.proteins)}
                          />
                          <div className="option-card-content">
                            <span>{protein.name}</span>
                            {selectedProteins.length >= constraints.proteins && !selectedProteins.includes(protein.id) && (
                              <span className="option-card-extra-price">+$30</span>
                            )}
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Toppings */}
                  <div className="option-group">
                    <div className="option-group-title">
                      <span>Toppings a elegir</span>
                      <span className="option-group-limit">Límite base: {constraints.toppings}</span>
                    </div>
                    <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '8px' }}>
                      (Adicionales tienen costo extra de +$15 c/u)
                    </p>
                    <div className="option-grid">
                      {SALAD_OPTIONS.toppings.map(topping => (
                        <label key={topping.id} className="option-card-label">
                          <input 
                            type="checkbox" 
                            className="option-card-input"
                            checked={selectedToppings.includes(topping.id)}
                            onChange={() => toggleOption(topping.id, selectedToppings, setSelectedToppings, constraints.toppings)}
                          />
                          <div className="option-card-content">
                            <span>{topping.name}</span>
                            {selectedToppings.length >= constraints.toppings && !selectedToppings.includes(topping.id) && (
                              <span className="option-card-extra-price">+$15</span>
                            )}
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Seeds & Nuts */}
                  <div className="option-group">
                    <div className="option-group-title">
                      <span>Semillas y Frutos Secos</span>
                      <span className="option-group-limit">Límite base: {constraints.seeds}</span>
                    </div>
                    <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '8px' }}>
                      (Adicionales tienen costo extra de +$15 c/u)
                    </p>
                    <div className="option-grid">
                      {SALAD_OPTIONS.seedsAndNuts.map(seed => (
                        <label key={seed.id} className="option-card-label">
                          <input 
                            type="checkbox" 
                            className="option-card-input"
                            checked={selectedSeeds.includes(seed.id)}
                            onChange={() => toggleOption(seed.id, selectedSeeds, setSelectedSeeds, constraints.seeds)}
                          />
                          <div className="option-card-content">
                            <span>{seed.name}</span>
                            {selectedSeeds.length >= constraints.seeds && !selectedSeeds.includes(seed.id) && (
                              <span className="option-card-extra-price">+$15</span>
                            )}
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Dressings */}
                  <div className="option-group">
                    <div className="option-group-title">
                      <span>Aderezos (1 obligatorio)</span>
                    </div>
                    <div className="option-grid">
                      {SALAD_OPTIONS.dressings.map(dressing => (
                        <label key={dressing.id} className="option-card-label">
                          <input 
                            type="radio" 
                            name="dressing"
                            className="option-card-input"
                            checked={selectedDressings.includes(dressing.id)}
                            onChange={() => setSelectedDressings([dressing.id])}
                          />
                          <div className="option-card-content">
                            <span>{dressing.name}</span>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Bowls Customizer (2 Fruits, 2 Seeds) */}
              {(selectedProduct.id === 'bowl-avena' || selectedProduct.id === 'bowl-yogurt') && (
                <>
                  <div className="option-group">
                    <div className="option-group-title">
                      <span>Frutas (Toppings) - Selecciona 2</span>
                    </div>
                    <div className="option-grid">
                      {SALAD_OPTIONS.toppings.filter(t => ['mango', 'fresa', 'platano', 'uva', 'kiwi', 'pina', 'blueberry', 'frambuesa'].includes(t.id)).map(topping => (
                        <label key={topping.id} className="option-card-label">
                          <input 
                            type="checkbox" 
                            className="option-card-input"
                            checked={selectedToppings.includes(topping.id)}
                            onChange={() => {
                              if (selectedToppings.includes(topping.id)) {
                                setSelectedToppings(selectedToppings.filter(x => x !== topping.id));
                              } else if (selectedToppings.length < 2) {
                                setSelectedToppings([...selectedToppings, topping.id]);
                              }
                            }}
                          />
                          <div className="option-card-content">
                            <span>{topping.name}</span>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="option-group">
                    <div className="option-group-title">
                      <span>Semillas y Granos - Selecciona 2</span>
                    </div>
                    <div className="option-grid">
                      {SALAD_OPTIONS.seedsAndNuts.map(seed => (
                        <label key={seed.id} className="option-card-label">
                          <input 
                            type="checkbox" 
                            className="option-card-input"
                            checked={selectedSeeds.includes(seed.id)}
                            onChange={() => {
                              if (selectedSeeds.includes(seed.id)) {
                                setSelectedSeeds(selectedSeeds.filter(x => x !== seed.id));
                              } else if (selectedSeeds.length < 2) {
                                setSelectedSeeds([...selectedSeeds, seed.id]);
                              }
                            }}
                          />
                          <div className="option-card-content">
                            <span>{seed.name}</span>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Flavor Selector for Drinks & Infusions */}
              {selectedProduct.flavors && (
                <div className="option-group">
                  <div className="option-group-title">
                    <span>Sabor a elegir</span>
                    {selectedProduct.maxFlavors && selectedProduct.maxFlavors > 1 ? (
                      <span className="option-group-limit">Hasta {selectedProduct.maxFlavors} sabores</span>
                    ) : (
                      <span className="option-group-limit">Obligatorio</span>
                    )}
                  </div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '10px' }}>
                    {selectedProduct.maxFlavors && selectedProduct.maxFlavors > 1
                      ? `Elige hasta ${selectedProduct.maxFlavors} sabores combinados.`
                      : 'Selecciona el sabor para tu bebida.'}
                  </p>
                  <div className="option-grid">
                    {selectedProduct.flavors.map(flavor => {
                      const isChecked = selectedFlavors.includes(flavor);
                      return (
                        <label key={flavor} className="option-card-label">
                          <input 
                            type={selectedProduct.maxFlavors && selectedProduct.maxFlavors > 1 ? "checkbox" : "radio"}
                            name="flavor"
                            className="option-card-input"
                            checked={isChecked}
                            onChange={() => {
                              const max = selectedProduct.maxFlavors || 1;
                              if (isChecked) {
                                setSelectedFlavors(selectedFlavors.filter(f => f !== flavor));
                              } else {
                                if (max === 1) {
                                  setSelectedFlavors([flavor]);
                                } else if (selectedFlavors.length < max) {
                                  setSelectedFlavors([...selectedFlavors, flavor]);
                                }
                              }
                            }}
                          />
                          <div className="option-card-content">
                            <span>{flavor}</span>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Notes */}
              <div className="option-group" style={{ borderBottom: 'none', paddingBottom: 0 }}>
                <div className="option-group-title">Notas especiales para tu pedido</div>
                <textarea 
                  className="notes-textarea" 
                  placeholder={
                    selectedProduct.category === 'jugos' || 
                    selectedProduct.category === 'infusiones' || 
                    selectedProduct.category === 'embotellada'
                      ? "Ej: sin hielo, con popote, sin azúcar, etc..."
                      : "Ej: sin aderezo, aderezo aparte, sin cebolla, etc..."
                  }
                  value={customNotes}
                  onChange={e => setCustomNotes(e.target.value)}
                />
              </div>
            </div>

            <div className="modal-footer">
              <div>
                <span className="modal-total-label">Subtotal</span>
                <div className="modal-total-price">
                  {/* Calculate dynamic price */}
                  ${(() => {
                    const price = selectedProduct.prices ? selectedProduct.prices[customSize] : selectedProduct.price;
                    let extra = 0;
                    if (selectedProduct.category === 'ensaladas') {
                      if (selectedProteins.length > constraints.proteins) {
                        extra += (selectedProteins.length - constraints.proteins) * 30;
                      }
                      if (selectedToppings.length > constraints.toppings) {
                        extra += (selectedToppings.length - constraints.toppings) * 15;
                      }
                      if (selectedSeeds.length > constraints.seeds) {
                        extra += (selectedSeeds.length - constraints.seeds) * 15;
                      }
                    }
                    return price + extra;
                  })()}
                </div>
              </div>
              
              <button 
                className="confirm-add-btn" 
                onClick={handleConfirmCustomization}
                disabled={
                  (selectedProduct.category === 'ensaladas' && selectedDressings.length === 0) || 
                  ((selectedProduct.id === 'bowl-avena' || selectedProduct.id === 'bowl-yogurt') && 
                   (selectedToppings.length !== 2 || selectedSeeds.length !== 2)) ||
                  (selectedProduct.flavors !== undefined && selectedFlavors.length === 0)
                }
              >
                Agregar al Carrito
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CART DRAWER */}
      {isCartOpen && (
        <div className="modal-overlay" onClick={() => setIsCartOpen(false)}>
          <div className="cart-drawer" onClick={e => e.stopPropagation()}>
            <div className="cart-header">
              <div className="cart-header-title">
                <ShoppingBag />
                <h2>Tu Pedido</h2>
              </div>
              <button className="close-btn" onClick={() => setIsCartOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <div className="cart-body">
              {cart.length === 0 ? (
                <div className="cart-empty">
                  <div className="cart-empty-icon">🥗</div>
                  <h3>Tu carrito está vacío</h3>
                  <p>Navega en el menú y agrega tus ensaladas o jugos favoritos.</p>
                </div>
              ) : (
                <div className="cart-items-list">
                  {cart.map(item => (
                    <div key={item.cartId} className="cart-item">
                      <div className="cart-item-info">
                        <span className="cart-item-name">{item.name} {item.size && `(${item.size})`}</span>
                        
                        {item.customizations && (
                          <div className="cart-item-customizations">
                            {item.customizations.proteins.length > 0 && (
                              <div><strong>Proteínas:</strong> {item.customizations.proteins.join(', ')}</div>
                            )}
                            {item.customizations.toppings.length > 0 && (
                              <div><strong>Toppings:</strong> {item.customizations.toppings.join(', ')}</div>
                            )}
                            {item.customizations.seedsAndNuts.length > 0 && (
                              <div><strong>Semillas/Frutos:</strong> {item.customizations.seedsAndNuts.join(', ')}</div>
                            )}
                            {item.customizations.dressings.length > 0 && (
                              <div><strong>Aderezo:</strong> {item.customizations.dressings.join(', ')}</div>
                            )}
                            {item.customizations.flavors && item.customizations.flavors.length > 0 && (
                              <div><strong>Sabor:</strong> {item.customizations.flavors.join(', ')}</div>
                            )}
                          </div>
                        )}
                        {item.notes && (
                          <div style={{ fontSize: '0.8rem', fontStyle: 'italic', marginTop: '6px', color: 'var(--color-terracotta)' }}>
                            "{item.notes}"
                          </div>
                        )}
                      </div>

                      <div className="cart-item-price-quantity">
                        <span className="cart-item-price">${item.price * item.quantity}</span>
                        <div className="quantity-controls">
                          <button className="quantity-btn" onClick={() => updateQuantity(item.cartId, -1)}>-</button>
                          <span className="quantity-value">{item.quantity}</span>
                          <button className="quantity-btn" onClick={() => updateQuantity(item.cartId, 1)}>+</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {cart.length > 0 && (
              <div className="cart-footer">
                <div className="cart-totals-row">
                  <span>Total</span>
                  <span>${calculateSubtotal()}</span>
                </div>
                <button className="checkout-btn" onClick={handleCheckoutClick}>
                  <span>Confirmar Pedido</span>
                  <ArrowRight size={18} />
                </button>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '12px', fontSize: '0.75rem', color: 'var(--color-text-muted)', justifyContent: 'center' }}>
                  <Info size={14} />
                  <span>El pago se realiza en mostrador al recoger tu orden.</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* AUTH & MINI REGISTRATION MODAL */}
      {isAuthOpen && (
        <div className="modal-overlay" onClick={() => setIsAuthOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '450px' }}>
            <div className="modal-header">
              <h2>Mini Registro</h2>
              <button className="close-btn" onClick={() => setIsAuthOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <div className="modal-body">
              <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', marginBottom: '15px' }}>
                Completa tu nombre y verifica tu cuenta para mandar tu pedido instantáneamente a la pantalla de cocina.
              </p>

              {errorMsg && (
                <div style={{ backgroundColor: '#ffebee', color: '#c62828', padding: '12px', borderRadius: '10px', fontSize: '0.85rem', marginBottom: '15px', fontWeight: 600 }}>
                  {errorMsg}
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Nombre Completo</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="Ej. Brandon Chavez" 
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                  disabled={smsSent}
                />
              </div>

              {!smsSent ? (
                <>
                  <div className="form-group" style={{ marginTop: '15px' }}>
                    <label className="form-label">Método de Verificación</label>
                    <div className="auth-choice-btns">
                      <button 
                        className={`auth-choice-btn ${authMethod === 'phone' ? 'active' : ''}`}
                        onClick={() => setAuthMethod('phone')}
                      >
                        Celular
                      </button>
                      <button 
                        className={`auth-choice-btn ${authMethod === 'google' ? 'active' : ''}`}
                        onClick={() => setAuthMethod('google')}
                      >
                        Google
                      </button>
                    </div>
                  </div>

                  {authMethod === 'phone' ? (
                    <div className="form-group" style={{ marginTop: '15px' }}>
                      <label className="form-label">Número de Celular</label>
                      <input 
                        type="tel" 
                        maxLength={10}
                        className="form-input" 
                        placeholder="10 dígitos (ej. 6237591105)" 
                        value={customerPhone}
                        onChange={e => setCustomerPhone(e.target.value.replace(/\D/g, ''))}
                      />
                      
                      <button 
                        className="checkout-btn" 
                        style={{ marginTop: '20px' }} 
                        onClick={handleSendSmsCode}
                      >
                        Enviar Código de Verificación
                      </button>
                    </div>
                  ) : (
                    <div>
                      <button className="google-auth-btn" onClick={handleGoogleLogin}>
                        <svg width="18" height="18" viewBox="0 0 18 18">
                          <path fill="#4285F4" d="M17.6 9.2c0-.6-.1-1.2-.2-1.8H9v3.4h4.8c-.2 1-.8 1.9-1.6 2.5v2.1h2.6c1.5-1.4 2.4-3.5 2.4-6.2z"/>
                          <path fill="#34A853" d="M9 18c2.4 0 4.5-.8 6-2.2l-2.6-2.1c-.7.5-1.7.8-3.4.8-2.6 0-4.8-1.8-5.6-4.2H.8v2.2C2.3 15.5 5.4 18 9 18z"/>
                          <path fill="#FBBC05" d="M3.4 10.3c-.2-.6-.3-1.2-.3-1.8s.1-1.2.3-1.8V4.5H.8C.3 5.5 0 6.7 0 8s.3 2.5.8 3.5l2.6-1.2z"/>
                          <path fill="#EA4335" d="M9 3.6c1.3 0 2.5.5 3.4 1.3l2.6-2.5C13.5.9 11.4 0 9 0 5.4 0 2.3 2.5.8 5.5l2.6 2.2c.8-2.4 3-4.1 5.6-4.1z"/>
                        </svg>
                        <span>Iniciar Sesión con Google</span>
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div style={{ marginTop: '20px' }}>
                  <label className="form-label" style={{ textAlign: 'center', display: 'block' }}>Código de Verificación SMS</label>
                  <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', textAlign: 'center' }}>
                    Enviamos un SMS al {customerPhone}
                  </p>
                  
                  <div className="sms-code-container">
                    {smsCode.map((digit, index) => (
                      <input 
                        key={index}
                        id={`otp-input-${index}`}
                        type="text"
                        maxLength={1}
                        className="sms-code-input"
                        value={digit}
                        onChange={e => {
                          const val = e.target.value;
                          if (/^[0-9]$/.test(val) || val === '') {
                            const nextCode = [...smsCode];
                            nextCode[index] = val;
                            setSmsCode(nextCode);
                            // Auto-focus next input
                            if (val !== '' && index < 3) {
                              document.getElementById(`otp-input-${index + 1}`)?.focus();
                            }
                          }
                        }}
                        onKeyDown={e => {
                          if (e.key === 'Backspace' && smsCode[index] === '' && index > 0) {
                            document.getElementById(`otp-input-${index - 1}`)?.focus();
                          }
                        }}
                      />
                    ))}
                  </div>

                  {sentCode && (
                    <div className="sms-code-preview-banner">
                      <strong>📱 Modo de Desarrollo:</strong> Ingresa el código generado: <strong>{sentCode}</strong> o <strong>1234</strong>
                    </div>
                  )}

                  <button 
                    className="checkout-btn" 
                    style={{ marginTop: '20px' }} 
                    disabled={isVerifying}
                    onClick={handleVerifySmsCode}
                  >
                    {isSubmittingOrder ? 'Procesando Pedido...' : 'Verificar y Enviar Orden'}
                  </button>

                  <button 
                    style={{ background: 'none', border: 'none', color: 'var(--color-terracotta)', fontWeight: '600', display: 'block', margin: '15px auto 0 auto', cursor: 'pointer' }}
                    onClick={() => {
                      setSmsSent(false);
                      setSmsCode(['', '', '', '']);
                    }}
                  >
                    Regresar / Corregir Celular
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
