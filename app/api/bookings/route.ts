import { NextResponse } from 'next/server';

interface BookingData {
  id: string;
  date: string;
  time: string;
  name: string;
  email: string;
  phone: string;
  service: string;
  status: string;
  notes: string;
}

let bookings: BookingData[] = [];

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export async function GET() {
  return NextResponse.json({ bookings });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const booking: BookingData = {
      id: generateId(),
      date: body.date || '',
      time: body.time || '',
      name: body.name || '',
      email: body.email || '',
      phone: body.phone || '',
      service: body.service || '',
      status: body.status || 'pending',
      notes: body.notes || '',
    };
    bookings.push(booking);
    return NextResponse.json({ success: true, booking }, { status: 201 });
  } catch {
    return NextResponse.json(
      { success: false, message: 'Invalid request' },
      { status: 400 },
    );
  }
}
