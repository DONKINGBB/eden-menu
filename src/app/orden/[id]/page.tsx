'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  Clock, 
  ChefHat, 
  CheckCircle, 
  XCircle, 
  ArrowLeft, 
  MessageCircle, 
  ShoppingBag,
  Phone,
  HelpCircle,
  FileText
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

export default function OrderStatusPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch Order Details
  const fetchOrder = async () => {
    try {
      const res = await fetch(`/api/orders/${id}`);
      const data = await res.json();
      
      if (!res.ok) {
        setError(data.error || 'No pudimos cargar los detalles del pedido.');
        setLoading(false);
        return;
      }

      setOrder(data.order);
      setLoading(false);
    } catch (e) {
      console.error('Error fetching order:', e);
      setError('Error al conectar con el servidor.');
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!id) return;
    fetchOrder();

    // 1. If Supabase is configured, use Realtime
    if (isSupabaseConfigured && supabase) {
      const channel = supabase
        .channel(`order-status-${id}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'orders',
            filter: `id=eq.${id}`
          },
          (payload) => {
            console.log('Realtime order update received:', payload.new);
            setOrder(payload.new as Order);
          }
        )
        .subscribe();

      return () => {
        if (supabase) supabase.removeChannel(channel);
      };
    } else {
      // 2. If not, fallback to polling every 3 seconds
      const interval = setInterval(() => {
        fetchOrder();
      }, 3000);

      return () => clearInterval(interval);
    }
  }, [id]);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: '15px' }}>
        <div className="status-animation-ring active" style={{ width: '60px', height: '60px' }}></div>
        <p style={{ fontFamily: 'var(--font-serif)', fontSize: '1.2rem', color: 'var(--color-green-dark)' }}>
          Cargando tu orden...
        </p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="container" style={{ padding: '60px 20px', textAlign: 'center' }}>
        <XCircle size={60} color="#c62828" style={{ margin: '0 auto 20px auto' }} />
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '2rem', marginBottom: '15px' }}>Hubo un error</h2>
        <p style={{ color: 'var(--color-text-muted)', marginBottom: '30px' }}>{error || 'El pedido solicitado no existe.'}</p>
        <button className="cart-icon-btn" onClick={() => router.push('/')} style={{ margin: '0 auto' }}>
          <ArrowLeft size={18} />
          <span>Volver al Menú</span>
        </button>
      </div>
    );
  }

  // Visual layout configurations based on current status
  const getStatusConfig = () => {
    switch (order.status) {
      case 'en_revision':
        return {
          title: 'Pedido en Revisión',
          description: 'Tu orden fue enviada a cocina. Estamos revisando que todos los ingredientes frescos estén disponibles.',
          colorClass: 'en_revision',
          icon: <Clock size={40} color="#f57f17" />,
          animationClass: 'active'
        };
      case 'preparando':
        return {
          title: 'Preparando tu orden',
          description: '¡Todo listo! Nuestro equipo está preparando tu ensalada y jugos con la máxima higiene y cuidado.',
          colorClass: 'preparando',
          icon: <ChefHat size={40} color="var(--color-green-dark)" />,
          animationClass: 'active'
        };
      case 'listo':
        return {
          title: '¡Tu orden está lista!',
          description: 'Puedes pasar a recoger tu pedido en la barra del local. Recuerda realizar el pago en el mostrador.',
          colorClass: 'listo',
          icon: <CheckCircle size={40} color="#2e7d32" />,
          animationClass: ''
        };
      case 'cancelado':
        default:
        return {
          title: 'Pedido Cancelado',
          description: 'Lo sentimos, tuvimos que anular tu pedido. Te contactaremos vía WhatsApp para ofrecerte una alternativa o cambio.',
          colorClass: 'cancelado',
          icon: <XCircle size={40} color="#c62828" />,
          animationClass: ''
        };
    }
  };

  const statusConfig = getStatusConfig();
  const formattedDate = new Date(order.created_at).toLocaleTimeString('es-MX', {
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <>
      {/* HEADER */}
      <header className="header">
        <div className="container header-content">
          <div className="logo-container" style={{ cursor: 'pointer' }} onClick={() => router.push('/')}>
            <img src="/logo.png" alt="Edén Logo" className="logo-img" />
            <div className="logo-text">
              EDÉN
              <span className="logo-sub">barra de ensaladas</span>
            </div>
          </div>
          
          <button className="cart-icon-btn" onClick={() => router.push('/')} style={{ background: 'none', border: '1px solid var(--color-green-dark)', color: 'var(--color-green-dark)' }}>
            <ArrowLeft size={16} />
            <span>Ver el Menú</span>
          </button>
        </div>
      </header>

      <main className="container" style={{ padding: '20px 0 60px 0' }}>
        <div className="status-container">
          <div className="status-header">
            <span className={`status-badge-tracking ${statusConfig.colorClass}`}>
              {order.status === 'en_revision' && 'En Revisión'}
              {order.status === 'preparando' && 'Preparando'}
              {order.status === 'listo' && 'Listo para Entregar'}
              {order.status === 'cancelado' && 'Cancelado'}
            </span>
            
            <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '2.2rem', marginTop: '15px', color: 'var(--color-green-dark)' }}>
              {statusConfig.title}
            </h1>
            <p style={{ color: 'var(--color-text-muted)', marginTop: '10px', fontSize: '1rem', lineHeight: '1.5' }}>
              {statusConfig.description}
            </p>
          </div>

          <div className="status-visual">
            <div className={`status-animation-ring ${statusConfig.animationClass} ${statusConfig.colorClass}`}>
              {statusConfig.icon}
            </div>
          </div>

          <div style={{ padding: '15px', backgroundColor: 'var(--color-cream-dark)', borderRadius: '15px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.9rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: 600 }}>Ticket POS:</span>
              <span style={{ fontWeight: 700, color: 'var(--color-terracotta)' }}>
                {order.loyverse_receipt_number || 'Sincronizando...'}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: 600 }}>Hora del Pedido:</span>
              <span>{formattedDate} hs</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: 600 }}>Cliente:</span>
              <span>{order.customer_name}</span>
            </div>
          </div>

          {order.status === 'cancelado' && (
            <a 
              href={`https://wa.me/526237591105?text=Hola,%20tuve%20un%20inconveniente%20con%20mi%20pedido%20Ed%C3%A9n%20#${order.id.slice(-4).toUpperCase()}`}
              target="_blank"
              rel="noopener noreferrer"
              className="whatsapp-btn"
            >
              <MessageCircle size={20} />
              <span>Contactar por WhatsApp</span>
            </a>
          )}

          {order.status === 'listo' && (
            <div style={{ marginTop: '25px', padding: '15px', border: '1px solid #c8e6c9', backgroundColor: '#e8f5e9', borderRadius: '15px', textAlign: 'left', display: 'flex', gap: '10px' }}>
              <CheckCircle color="#2e7d32" style={{ flexShrink: 0 }} />
              <div>
                <strong style={{ color: '#2e7d32', display: 'block' }}>¡Paso final!</strong>
                <span style={{ fontSize: '0.85rem', color: '#1b5e20' }}>
                  Acércate a la caja, menciona tu nombre: <strong>{order.customer_name}</strong> o ticket <strong>{order.loyverse_receipt_number}</strong>, realiza tu pago (efectivo o terminal) y llévate tu comida recién preparada.
                </span>
              </div>
            </div>
          )}

          <div className="status-details">
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', borderBottom: '1px solid var(--color-ochre-light)', paddingBottom: '8px', color: 'var(--color-green-dark)' }}>
              Detalle del Pedido
            </h3>
            
            <div className="status-items-list">
              {order.items.map((item, index) => (
                <div key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', fontSize: '0.9rem', padding: '8px 0', borderBottom: '1px dashed var(--color-ochre-light)' }}>
                  <div>
                    <span style={{ fontWeight: 700 }}>{item.quantity}x</span> {item.name} {item.size && `(${item.size})`}
                    {item.customizations && (
                      <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                        {item.customizations.proteins.length > 0 && <div>• Prot: {item.customizations.proteins.join(', ')}</div>}
                        {item.customizations.toppings.length > 0 && <div>• Toppings: {item.customizations.toppings.join(', ')}</div>}
                        {item.customizations.seedsAndNuts.length > 0 && <div>• Semillas/Frutos: {item.customizations.seedsAndNuts.join(', ')}</div>}
                        {item.customizations.dressings.length > 0 && <div>• Aderezo: {item.customizations.dressings.join(', ')}</div>}
                        {item.customizations.flavors && item.customizations.flavors.length > 0 && <div>• Sabor: {item.customizations.flavors.join(', ')}</div>}
                      </div>
                    )}
                  </div>
                  <span style={{ fontWeight: 600 }}>${item.price * item.quantity}</span>
                </div>
              ))}
            </div>

            {order.notes && (
              <div style={{ marginTop: '15px', padding: '12px', backgroundColor: 'rgba(192, 90, 62, 0.05)', borderLeft: '3px solid var(--color-terracotta)', borderRadius: '0 8px 8px 0', fontSize: '0.85rem' }}>
                <strong>Notas de cocina:</strong> "{order.notes}"
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.1rem', fontWeight: 700, marginTop: '20px', color: 'var(--color-green-dark)' }}>
              <span>Total pagado en caja</span>
              <span>${order.total}</span>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
