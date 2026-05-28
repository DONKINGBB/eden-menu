import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Mock Realtime Database for testing without Supabase credentials
class MockDatabase {
  private listeners: { [key: string]: Function[] } = {};

  constructor() {
    if (typeof window !== 'undefined') {
      // Initialize mock orders if not present
      if (!localStorage.getItem('eden_mock_orders')) {
        localStorage.setItem('eden_mock_orders', JSON.stringify([]));
      }
      
      // Listen to storage events to simulate realtime between tabs
      window.addEventListener('storage', (e) => {
        if (e.key === 'eden_mock_orders') {
          this.trigger('orders_changed', JSON.parse(e.newValue || '[]'));
        }
      });
    }
  }

  getOrders(): any[] {
    if (typeof window === 'undefined') return [];
    return JSON.parse(localStorage.getItem('eden_mock_orders') || '[]');
  }

  saveOrders(orders: any[]) {
    if (typeof window === 'undefined') return;
    localStorage.setItem('eden_mock_orders', JSON.stringify(orders));
    this.trigger('orders_changed', orders);
  }

  createOrder(order: any): any {
    const orders = this.getOrders();
    const newOrder = {
      id: Math.random().toString(36).substring(2, 11),
      created_at: new Date().toISOString(),
      status: 'en_revision',
      ...order
    };
    orders.push(newOrder);
    this.saveOrders(orders);
    return newOrder;
  }

  updateOrder(id: string, updates: any): any {
    const orders = this.getOrders();
    const index = orders.findIndex(o => o.id === id);
    if (index !== -1) {
      orders[index] = { ...orders[index], ...updates };
      this.saveOrders(orders);
      return orders[index];
    }
    return null;
  }

  subscribe(event: string, callback: Function) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
    
    // Return unsubscribe function
    return () => {
      this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    };
  }

  private trigger(event: string, data: any) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(callback => callback(data));
    }
  }
}

export const mockDb = typeof window !== 'undefined' ? new MockDatabase() : null;
