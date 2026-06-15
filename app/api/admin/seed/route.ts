import { NextResponse } from 'next/server';
import { db } from '@/lib/server/db/client';
import { hashPassword } from '@/lib/server/password';

export async function GET() {
  try {
    const username = 'adamworkcraft';
    const email = 'aizzdevop@gmail.com';
    const fullName = 'Adam Syamil';
    const password = 'admin'; // Using admin as default password for this seed
    
    const hashedPassword = await hashPassword(password);
    
    const user = await db.adminUser.upsert({
      where: { email },
      update: {},
      create: {
        username,
        email,
        fullName,
        passwordHash: hashedPassword,
      },
    });
    
    return NextResponse.json({ success: true, user: { id: user.id, username: user.username, email: user.email } });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
