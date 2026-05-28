import { NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { createLoyverseReceipt } from '@/lib/loyverse';

// Next.js pattern to prevent hot-reload from resetting the database in development
const globalForOrders = global as unknown as { serverMockOrders: any[] };
if (!globalForOrders.serverMockOrders) {
  globalForOrders.serverMockOrders = [];
}
export const serverMockOrders = globalForOrders.serverMockOrders;

export async function POST(req: Request) {
  try {
    const orderData = await req.json();
    const { customer_name, customer_phone, customer_email, items, total, notes } = orderData;

    if (!customer_name || !customer_phone || !items || items.length === 0 || !total) {
      return NextResponse.json(
        { error: 'Información de orden incompleta.' },
        { status: 400 }
      );
    }

    // 1. Create initial order structure
    const initialOrder = {
      customer_name,
      customer_phone,
      customer_email: customer_email || null,
      items,
      total,
      notes: notes || '',
      status: 'en_revision',
      created_at: new Date().toISOString()
    };

    let createdOrder: any = null;

    // 2. Insert into Supabase (if configured)
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('orders')
        .insert([initialOrder])
        .select()
        .single();

      if (error) {
        throw new Error(`Supabase insert error: ${error.message}`);
      }
      createdOrder = data;
    } else {
      // Use Server In-Memory Mock database
      const mockId = 'ord_' + Math.random().toString(36).substring(2, 11);
      createdOrder = {
        id: mockId,
        ...initialOrder
      };
      serverMockOrders.push(createdOrder);
    }

    // 3. Send order to Loyverse kitchen (POST /receipts)
    let loyverseResult = { receipt_id: null as string | null, receipt_number: 'N/A' };
    try {
      const response = await createLoyverseReceipt({
        id: createdOrder.id,
        customer_name: createdOrder.customer_name,
        customer_phone: createdOrder.customer_phone,
        items: createdOrder.items,
        total: createdOrder.total,
        notes: createdOrder.notes
      });
      loyverseResult = response;
    } catch (loyverseErr) {
      console.error('Error synchronizing with Loyverse POS:', loyverseErr);
      // We do not crash the order if Loyverse sync fails, to ensure we don't lose sales
    }

    // 4. Update the order with Loyverse ticket details
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('orders')
        .update({
          loyverse_receipt_id: loyverseResult.receipt_id,
          loyverse_receipt_number: loyverseResult.receipt_number
        })
        .eq('id', createdOrder.id)
        .select()
        .single();

      if (!error && data) {
        createdOrder = data;
      }
    } else {
      // Update in server memory
      const index = serverMockOrders.findIndex(o => o.id === createdOrder.id);
      if (index !== -1) {
        serverMockOrders[index].loyverse_receipt_id = loyverseResult.receipt_id;
        serverMockOrders[index].loyverse_receipt_number = loyverseResult.receipt_number;
        createdOrder = serverMockOrders[index];
      }
    }

    return NextResponse.json({ success: true, order: createdOrder });

  } catch (error: any) {
    console.error('Order creation error:', error);
    return NextResponse.json(
      { error: error.message || 'Error interno al crear el pedido.' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // Returns active orders (under review or preparing)
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .in('status', ['en_revision', 'preparando'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      return NextResponse.json({ success: true, orders: data });
    } else {
      // Fallback in-memory orders
      const activeOrders = serverMockOrders
        .filter(order => ['en_revision', 'preparando'].includes(order.status))
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      return NextResponse.json({ success: true, orders: activeOrders });
    }
  } catch (error: any) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      { error: error.message || 'Error al obtener los pedidos.' },
      { status: 500 }
    );
  }
}
