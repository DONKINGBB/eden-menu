const LOYVERSE_API_URL = 'https://api.loyverse.com/v1.0';
const LOYVERSE_ACCESS_TOKEN = process.env.LOYVERSE_ACCESS_TOKEN || '';
const LOYVERSE_STORE_ID = process.env.LOYVERSE_STORE_ID || '';

export const isLoyverseConfigured = !!(LOYVERSE_ACCESS_TOKEN && LOYVERSE_STORE_ID);

export interface LoyverseItem {
  variant_id?: string;
  name: string;
  quantity: number;
  price: number;
}

export interface LoyverseReceiptPayload {
  store_id: string;
  note?: string;
  line_items: Array<{
    variant_id?: string;
    quantity: number;
    price: number;
    name?: string; // Standard API uses variant_id but we can send names for custom items if supported
  }>;
  payments: Array<{
    payment_type_id?: string;
    type?: 'CASH' | 'CARD' | 'OTHER';
    amount: number;
  }>;
}

/**
 * Creates a receipt in Loyverse POS.
 * Since this is paid at the counter, it records the order as unpaid/pending payment
 * using a generic payment type or Cash to trigger it in Loyverse KDS.
 */
export async function createLoyverseReceipt(order: {
  id: string;
  customer_name: string;
  customer_phone: string;
  items: any[];
  total: number;
  notes?: string;
}) {
  const lineItems = order.items.map(item => {
    // Try to construct standard item properties
    // If they have set up variant_ids in menuData, we send them. Otherwise we send generic item fields
    return {
      name: `${item.name}${item.size ? ` (${item.size})` : ''}`,
      quantity: item.quantity,
      price: item.price,
      // variant_id: item.variantId || undefined
    };
  });

  const payload: LoyverseReceiptPayload = {
    store_id: LOYVERSE_STORE_ID,
    note: `Pedído Web #${order.id.slice(-4).toUpperCase()}\nCliente: ${order.customer_name} (${order.customer_phone})\nNotas: ${order.notes || 'Ninguna'}`,
    line_items: lineItems,
    payments: [
      {
        type: 'OTHER', // Marks as other payment method (i.e. to be charged at cashier counter)
        amount: order.total
      }
    ]
  };

  if (!isLoyverseConfigured) {
    console.log('[MOCK LOYVERSE] Creando recibo en Loyverse:', JSON.stringify(payload, null, 2));
    // Return a mock Loyverse receipt ID and number
    return {
      receipt_id: `loyverse_rec_${Math.random().toString(36).substring(2, 11)}`,
      receipt_number: `T-${Math.floor(1000 + Math.random() * 9000)}`
    };
  }

  try {
    const res = await fetch(`${LOYVERSE_API_URL}/receipts`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOYVERSE_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Loyverse API error: ${res.status} - ${errText}`);
    }

    const data = await res.json();
    return {
      receipt_id: data.receipt_id,
      receipt_number: data.receipt_number
    };
  } catch (error) {
    console.error('Error creating Loyverse receipt:', error);
    // If the API call fails in production, log it but return mock or let the system proceed
    throw error;
  }
}

/**
 * Refunds / voids a receipt in Loyverse POS.
 * Used when the administrator cancels the order.
 */
export async function refundLoyverseReceipt(receiptId: string) {
  if (!isLoyverseConfigured) {
    console.log(`[MOCK LOYVERSE] Reembolsando recibo ${receiptId} en Loyverse`);
    return true;
  }

  try {
    // First, fetch the receipt to get its details for the refund
    const fetchRes = await fetch(`${LOYVERSE_API_URL}/receipts/${receiptId}`, {
      headers: {
        'Authorization': `Bearer ${LOYVERSE_ACCESS_TOKEN}`
      }
    });

    if (!fetchRes.ok) {
      throw new Error(`Failed to fetch Loyverse receipt for refund: ${fetchRes.status}`);
    }

    const receipt = await fetchRes.json();

    // Prepare refund payload
    const refundPayload = {
      store_id: LOYVERSE_STORE_ID,
      receipt_type: 'REFUND',
      refund_for_receipt_id: receiptId,
      line_items: receipt.line_items.map((item: any) => ({
        variant_id: item.variant_id,
        quantity: item.quantity,
        price: item.price
      })),
      payments: receipt.payments.map((payment: any) => ({
        type: payment.type,
        payment_type_id: payment.payment_type_id,
        amount: -payment.amount // Negative amount for refund
      }))
    };

    const res = await fetch(`${LOYVERSE_API_URL}/receipts`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOYVERSE_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(refundPayload)
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Loyverse API refund error: ${res.status} - ${errText}`);
    }

    return true;
  } catch (error) {
    console.error('Error refunding Loyverse receipt:', error);
    throw error;
  }
}
