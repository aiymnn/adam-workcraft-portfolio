import { NextResponse } from 'next/server';

const ADMIN_CREDENTIALS = { username: 'admin', password: 'admin123' };

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
      return NextResponse.json({ success: true, message: 'Authenticated' });
    }

    return NextResponse.json(
      { success: false, message: 'Invalid credentials' },
      { status: 401 },
    );
  } catch {
    return NextResponse.json(
      { success: false, message: 'Invalid request' },
      { status: 400 },
    );
  }
}
