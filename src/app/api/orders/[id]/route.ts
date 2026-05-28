import { NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { refundLoyverseReceipt } from '@/lib/loyverse';
import { serverMockOrders } from '../route';

// Helper to find and update in-memory database
function updateInMemoryOrder(id: string, updates: any) {
  const index = serverMockOrders.findIndex(o => o.id === id);
  if (index !== -1) {
    serverMockOrders[index] = { ...serverMockOrders[index], ...updates };
    return serverMockOrders[index];
  }
  return null;
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        return NextResponse.json({ error: 'Pedido no encontrado.' }, { status: 404 });
      }
      return NextResponse.json({ success: true, order: data });
    } else {
      // Find in-memory
      const order = serverMockOrders.find(o => o.id === id);
      if (!order) {
        return NextResponse.json({ error: 'Pedido no encontrado.' }, { status: 404 });
      }
      return NextResponse.json({ success: true, order });
    }
  } catch (error: any) {
    console.error('Error fetching single order:', error);
    return NextResponse.json(
      { error: error.message || 'Error al obtener el pedido.' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { status } = body;

    if (!status) {
      return NextResponse.json({ error: 'Estado no proporcionado.' }, { status: 400 });
    }

    // 1. Fetch the current order details to check for Loyverse receipt ID
    let currentOrder: any = null;

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('id', id)
        .single();

      if (!error) currentOrder = data;
    } else {
      currentOrder = serverMockOrders.find(o => o.id === id);
    }

    if (!currentOrder) {
      return NextResponse.json({ error: 'Pedido no encontrado.' }, { status: 404 });
    }

    // 2. If status is being updated to 'cancelado' and there's a Loyverse receipt, void it
    if (status === 'cancelado' && currentOrder.loyverse_receipt_id) {
      try {
        await refundLoyverseReceipt(currentOrder.loyverse_receipt_id);
        console.log(`[LOYVERSE] Recibo ${currentOrder.loyverse_receipt_id} anulado con éxito.`);
      } catch (loyverseErr) {
        console.error('Error refunding/voiding receipt in Loyverse POS:', loyverseErr);
        // We continue with updating the DB status even if Loyverse voiding fails
      }
    }

    // 3. Update the order status in database
    let updatedOrder: any = null;

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw error;
      }
      updatedOrder = data;
    } else {
      // Update in-memory
      updatedOrder = updateInMemoryOrder(id, { status });
    }

    return NextResponse.json({ success: true, order: updatedOrder });

  } catch (error: any) {
    console.error('Error updating order status:', error);
    return NextResponse.json(
      { error: error.message || 'Error al actualizar el estado del pedido.' },
      { status: 500 }
    );
  }
}
