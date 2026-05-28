import { NextResponse } from 'next/server';

// Simulating Twilio Client setup if credentials exist
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID || '';
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN || '';
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER || '';

const isTwilioConfigured = !!(TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN && TWILIO_PHONE_NUMBER);

export async function POST(req: Request) {
  try {
    const { phone } = await req.json();

    if (!phone || phone.length < 10) {
      return NextResponse.json(
        { error: 'Por favor ingresa un número de celular válido de 10 dígitos.' },
        { status: 400 }
      );
    }

    // Generate a random 4-digit code
    const code = Math.floor(1000 + Math.random() * 9000).toString();

    console.log(`[SMS OTP] Código de verificación para ${phone}: ${code}`);

    if (isTwilioConfigured) {
      try {
        // Dynamic import to avoid errors if twilio package is not installed
        const twilio = require('twilio');
        const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

        await client.messages.create({
          body: `Tu código de verificación para Edén es: ${code}`,
          from: TWILIO_PHONE_NUMBER,
          to: `+52${phone}` // Assuming Mexico (+52) based on 10-digit number 6237591105 in user request
        });

        return NextResponse.json({ success: true, message: 'SMS enviado con éxito.' });
      } catch (smsError: any) {
        console.error('Error sending real SMS through Twilio:', smsError);
        // Fallback to returning code in response for testing
        return NextResponse.json({
          success: true,
          message: 'Error con Twilio. Usando modo de desarrollo.',
          code: code // Exposed only for testing/mocking
        });
      }
    }

    // Development mode response (returns the code directly so frontend can display it in a banner)
    return NextResponse.json({
      success: true,
      message: 'Código generado en modo de desarrollo.',
      code: code
    });

  } catch (error) {
    console.error('SMS API error:', error);
    return NextResponse.json(
      { error: 'Ocurrió un error al procesar el código SMS.' },
      { status: 500 }
    );
  }
}
