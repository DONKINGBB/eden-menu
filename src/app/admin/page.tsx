'use client';

import React, { useState, useEffect } from 'react';
import { 
  Check, 
  X, 
  Clock, 
  ChefHat, 
  AlertCircle, 
  MessageCircle, 
  RefreshCw, 
  Unlock,
  ClipboardList
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

interface Order {
  id: string;
  created_at: string;
  customer_name: string;
  customer_phone: string;
  items: any[];
  total: number;
  notes?: string;
  status: 'en_revision' | 'preparando' | 'listo' | 'cancelado';
  loyverse_receipt_number?: string;
}

export default function AdminPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authError, setAuthError] = useState('');

  // Access Code check
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const adminSession = localStorage.getItem('eden_admin_auth');
      if (adminSession === 'true') {
        setIsAuthenticated(true);
      }
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'eden2026') {
      setIsAuthenticated(true);
      localStorage.setItem('eden_admin_auth', 'true');
      setAuthError('');
    } else {
      setAuthError('Código de acceso incorrecto.');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('eden_admin_auth');
  };

  // Fetch active orders from API
  const fetchOrders = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch('/api/orders');
      const data = await res.json();
      if (res.ok) {
        setOrders(data.orders);
      }
    } catch (e) {
      console.error('Error fetching admin orders:', e);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  // Setup Realtime or Polling
  useEffect(() => {
    if (!isAuthenticated) return;
    fetchOrders();

    if (isSupabaseConfigured && supabase) {
      const channel = supabase
        .channel('admin-orders-feed')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'orders'
          },
          (payload) => {
            console.log('Realtime change in admin panel:', payload);
            fetchOrders(); // Refresh whole list to maintain order sorted by date
          }
        )
        .subscribe();

      return () => {
        if (supabase) supabase.removeChannel(channel);
      };
    } else {
      // Polling fallback every 3 seconds
      const interval = setInterval(() => {
        fetchOrders();
      }, 3000);

      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  // Update order status via PATCH API
  const updateStatus = async (id: string, newStatus: 'preparando' | 'listo' | 'cancelado') => {
    try {
      const res = await fetch(`/api/orders/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      if (res.ok) {
        // Optimistic UI update
        setOrders(prev => prev.map(o => o.id === id ? { ...o, status: newStatus } : o).filter(o => o.status !== 'listo' && o.status !== 'cancelado'));
        fetchOrders();
      }
    } catch (error) {
      console.error('Error updating order status:', error);
    }
  };

  // Generate WhatsApp Message Link for cancellation
  const getWhatsAppCancelLink = (order: Order) => {
    const formattedPhone = order.customer_phone.startsWith('52') ? order.customer_phone : `52${order.customer_phone}`;
    const text = encodeURIComponent(
      `Hola ${order.customer_name}, vimos tu pedido de Edén (Ticket ${order.loyverse_receipt_number || ''}) pero nos quedamos sin un ingrediente. ¿Te lo cambiamos por otra opción o prefieres cancelar el pedido?`
    );
    return `https://wa.me/${formattedPhone}?text=${text}`;
  };

  if (!isAuthenticated) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', padding: '20px' }}>
        <div className="status-container" style={{ maxWidth: '400px', margin: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
            <Unlock size={40} color="var(--color-terracotta)" />
          </div>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', marginBottom: '15px' }}>
            Administrador Edén
          </h2>
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div className="form-group" style={{ textAlign: 'left' }}>
              <label className="form-label">Código de Acceso</label>
              <input 
                type="password" 
                className="form-input" 
                placeholder="Ingresa el código"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>
            {authError && (
              <span style={{ fontSize: '0.8rem', color: '#c62828', fontWeight: 600 }}>{authError}</span>
            )}
            <button type="submit" className="checkout-btn">
              Entrar al Panel
            </button>
          </form>
        </div>
      </div>
    );
  }

  const pendingOrders = orders.filter(o => o.status === 'en_revision');
  const preparingOrders = orders.filter(o => o.status === 'preparando');

  return (
    <>
      {/* HEADER */}
      <header className="header">
        <div className="container header-content">
          <div className="logo-container">
            <img src="/logo.png" alt="Edén Logo" className="logo-img" />
            <div className="logo-text">
              EDÉN PANEL
              <span className="logo-sub">caja y cocina</span>
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <button 
              className="cart-icon-btn" 
              onClick={fetchOrders} 
              style={{ background: 'none', border: '1px solid var(--color-ochre)', color: 'var(--color-text-dark)', display: 'flex', gap: '4px' }}
              disabled={isRefreshing}
            >
              <RefreshCw size={16} className={isRefreshing ? 'status-animation-ring active' : ''} />
              <span>Sincronizar</span>
            </button>
            <button className="cart-icon-btn" onClick={handleLogout} style={{ backgroundColor: 'var(--color-terracotta)' }}>
              Salir
            </button>
          </div>
        </div>
      </header>

      <main className="container" style={{ padding: '40px 0 60px 0' }}>
        <div className="admin-header">
          <div>
            <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '2.2rem', color: 'var(--color-green-dark)' }}>
              Monitoreo de Órdenes Web
            </h1>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
              Gestiona los pedidos de los clientes en tiempo real. Se sincronizan directamente con Loyverse POS.
            </p>
          </div>
          
          <div style={{ display: 'flex', gap: '20px', fontSize: '0.9rem', backgroundColor: 'var(--color-cream-light)', padding: '10px 20px', borderRadius: '15px', border: '1px solid var(--color-ochre-light)' }}>
            <div>
              <span style={{ fontWeight: 600 }}>En Revisión: </span>
              <strong style={{ color: 'var(--color-terracotta)', fontSize: '1.1rem' }}>{pendingOrders.length}</strong>
            </div>
            <div style={{ width: '1px', backgroundColor: 'var(--color-ochre)' }}></div>
            <div>
              <span style={{ fontWeight: 600 }}>Preparando: </span>
              <strong style={{ color: 'var(--color-green-dark)', fontSize: '1.1rem' }}>{preparingOrders.length}</strong>
            </div>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <div className="status-animation-ring active" style={{ margin: '0 auto 20px auto', width: '50px', height: '50px' }}></div>
            <p>Cargando pedidos activos...</p>
          </div>
        ) : (
          <div className="admin-grid">
            {/* COLUMN 1: ORDERS LIST */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
              
              {/* ORDERS EN REVISIÓN */}
              <div className="admin-panel-section" style={{ borderLeft: '5px solid var(--color-terracotta)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '15px' }}>
                  <Clock color="var(--color-terracotta)" />
                  <h2 style={{ fontSize: '1.4rem', color: 'var(--color-green-dark)' }}>Pedidos Recibidos (En Revisión)</h2>
                </div>

                {pendingOrders.length === 0 ? (
                  <p style={{ color: 'var(--color-text-muted)', fontStyle: 'italic', padding: '20px 0' }}>
                    No hay nuevos pedidos en espera. ¡Todo al día!
                  </p>
                ) : (
                  <div className="admin-orders-list">
                    {pendingOrders.map(order => (
                      <div key={order.id} className="admin-order-card en_revision">
                        <div className="admin-order-header">
                          <div className="admin-order-meta">
                            <span className="admin-order-id">Orden #{order.id.slice(-4).toUpperCase()}</span>
                            <span className="admin-order-client">
                              Cliente: <strong>{order.customer_name}</strong> | Tel: {order.customer_phone}
                            </span>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                              Recibido: {new Date(order.created_at).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            <span style={{ fontWeight: 700, color: 'var(--color-terracotta)', fontSize: '0.9rem' }}>
                              Loyverse Ticket: {order.loyverse_receipt_number || 'Enviando...'}
                            </span>
                          </div>
                        </div>

                        {/* ITEMS BREAKDOWN */}
                        <div style={{ margin: '12px 0', padding: '12px', backgroundColor: 'var(--color-cream-dark)', borderRadius: '8px' }}>
                          <h4 style={{ fontSize: '0.85rem', textTransform: 'uppercase', color: 'var(--color-text-muted)', marginBottom: '8px', display: 'flex', gap: '6px', alignItems: 'center' }}>
                            <ClipboardList size={14} />
                            <span>Productos a preparar</span>
                          </h4>
                          {order.items.map((item, idx) => (
                            <div key={idx} style={{ fontSize: '0.9rem', marginBottom: '8px', borderBottom: idx < order.items.length - 1 ? '1px dashed rgba(0,0,0,0.05)' : 'none', paddingBottom: '4px' }}>
                              <strong>{item.quantity}x {item.name}</strong> {item.size && `(${item.size})`}
                              {item.customizations && (
                                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginLeft: '12px', marginTop: '2px' }}>
                                  {item.customizations.proteins.length > 0 && <div>• Prot: {item.customizations.proteins.join(', ')}</div>}
                                  {item.customizations.toppings.length > 0 && <div>• Toppings: {item.customizations.toppings.join(', ')}</div>}
                                  {item.customizations.seedsAndNuts.length > 0 && <div>• Semillas/Frutos: {item.customizations.seedsAndNuts.join(', ')}</div>}
                                  {item.customizations.dressings.length > 0 && <div>• Aderezo: {item.customizations.dressings.join(', ')}</div>}
                                </div>
                              )}
                            </div>
                          ))}
                          
                          {order.notes && (
                            <div style={{ marginTop: '10px', fontSize: '0.8rem', borderLeft: '2px solid var(--color-terracotta)', paddingLeft: '8px', color: 'var(--color-terracotta)' }}>
                              <strong>Notas:</strong> "{order.notes}"
                            </div>
                          )}
                        </div>

                        <div className="admin-order-actions">
                          <button className="admin-btn admin-btn-accept" onClick={() => updateStatus(order.id, 'preparando')}>
                            Aceptar Pedido
                          </button>
                          <button className="admin-btn admin-btn-cancel" onClick={() => updateStatus(order.id, 'cancelado')}>
                            Rechazar / Falta Ingrediente
                          </button>
                          <a 
                            href={getWhatsAppCancelLink(order)} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="admin-btn"
                            style={{ display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: '#e0f2f1', color: '#00796b' }}
                          >
                            <MessageCircle size={14} />
                            <span>Mandar WhatsApp</span>
                          </a>
                          <span style={{ marginLeft: 'auto', fontWeight: 700, color: 'var(--color-green-dark)' }}>
                            Total: ${order.total}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* ORDERS PREPARANDO */}
              <div className="admin-panel-section" style={{ borderLeft: '5px solid var(--color-green-dark)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '15px' }}>
                  <ChefHat color="var(--color-green-dark)" />
                  <h2 style={{ fontSize: '1.4rem', color: 'var(--color-green-dark)' }}>Pedidos en Cocina (Preparando)</h2>
                </div>

                {preparingOrders.length === 0 ? (
                  <p style={{ color: 'var(--color-text-muted)', fontStyle: 'italic', padding: '20px 0' }}>
                    No hay pedidos en preparación actualmente.
                  </p>
                ) : (
                  <div className="admin-orders-list">
                    {preparingOrders.map(order => (
                      <div key={order.id} className="admin-order-card preparando">
                        <div className="admin-order-header">
                          <div className="admin-order-meta">
                            <span className="admin-order-id">Orden #{order.id.slice(-4).toUpperCase()}</span>
                            <span className="admin-order-client">
                              Cliente: <strong>{order.customer_name}</strong> | Tel: {order.customer_phone}
                            </span>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                              En preparación...
                            </span>
                            <span style={{ fontWeight: 700, color: 'var(--color-green-dark)', fontSize: '0.9rem' }}>
                              Ticket: {order.loyverse_receipt_number}
                            </span>
                          </div>
                        </div>

                        {/* ITEMS BREAKDOWN */}
                        <div style={{ margin: '12px 0', padding: '12px', backgroundColor: 'var(--color-cream-dark)', borderRadius: '8px' }}>
                          {order.items.map((item, idx) => (
                            <div key={idx} style={{ fontSize: '0.9rem', marginBottom: '6px' }}>
                              <strong>{item.quantity}x {item.name}</strong> {item.size && `(${item.size})`}
                              {item.customizations && (
                                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginLeft: '12px' }}>
                                  {item.customizations.proteins.length > 0 && <span>Prot: {item.customizations.proteins.join(', ')} | </span>}
                                  {item.customizations.toppings.length > 0 && <span>Toppings: {item.customizations.toppings.join(', ')} | </span>}
                                  {item.customizations.seedsAndNuts.length > 0 && <span>Semillas: {item.customizations.seedsAndNuts.join(', ')} | </span>}
                                  {item.customizations.dressings.length > 0 && <span>Aderezo: {item.customizations.dressings.join(', ')}</span>}
                                </div>
                              )}
                            </div>
                          ))}
                          {order.notes && (
                            <div style={{ marginTop: '10px', fontSize: '0.8rem', color: 'var(--color-terracotta)' }}>
                              <strong>Notas:</strong> "{order.notes}"
                            </div>
                          )}
                        </div>

                        <div className="admin-order-actions">
                          <button className="admin-btn admin-btn-ready" onClick={() => updateStatus(order.id, 'listo')}>
                            Marcar como Listo / Notificar Cliente
                          </button>
                          <button className="admin-btn admin-btn-cancel" onClick={() => updateStatus(order.id, 'cancelado')}>
                            Cancelar Pedido
                          </button>
                          <span style={{ marginLeft: 'auto', fontWeight: 700, color: 'var(--color-green-dark)' }}>
                            Total: ${order.total}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* COLUMN 2: OPERATIONS INFO & SETTINGS */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="admin-panel-section">
                <h3 style={{ fontSize: '1.2rem', marginBottom: '12px', color: 'var(--color-green-dark)' }}>Guía de Operaciones</h3>
                <ul style={{ paddingLeft: '18px', fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '10px', color: 'var(--color-text-dark)' }}>
                  <li>
                    <strong>Paso 1:</strong> El cliente hace el pedido. Aparecerá en **En Revisión** y viajará automáticamente a la impresora/KDS de Loyverse.
                  </li>
                  <li>
                    <strong>Paso 2:</strong> Verifica los ingredientes físicos en tu cocina.
                  </li>
                  <li>
                    <strong>Paso 3 (Aceptar):</strong> Si tienes todo, presiona **Aceptar Pedido**. El cliente verá "Preparando Orden" en su celular en tiempo real.
                  </li>
                  <li>
                    <strong>Paso 3 (Rechazar):</strong> Si falta algún ingrediente crucial (ej. espinaca), presiona **Rechazar**. Se reembolsará el ticket en Loyverse de inmediato y podrás mandarles un mensaje pre-llenado de WhatsApp en un clic.
                  </li>
                  <li>
                    <strong>Paso 4:</strong> Una vez lista la comida, presiona **Marcar como Listo**. El cliente recibirá la alerta de recoger y realizar su cobro en la caja física.
                  </li>
                </ul>
              </div>

              <div className="admin-panel-section" style={{ backgroundColor: 'var(--color-ochre-light)', borderColor: 'var(--color-ochre)' }}>
                <h3 style={{ fontSize: '1.2rem', marginBottom: '8px', color: 'var(--color-green-dark)' }}>
                  <AlertCircle size={18} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'text-bottom' }} />
                  Información Técnica
                </h3>
                <p style={{ fontSize: '0.8rem', lineHeight: '1.4' }}>
                  El sistema está operando en <strong>Modo Sincronizado Completo</strong>. Si hay variables de Supabase configuradas, actualizará mediante WebSockets. De lo contrario, opera en modo de sondeo optimizado localmente para garantizar el servicio continuo.
                </p>
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
