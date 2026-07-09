import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');

  return NextResponse.json({
    status: 'completed',
    confirmation_code: code,
    message: 'Todos os dados associados à sua conta do Instagram foram excluídos do nosso sistema.',
  });
}
