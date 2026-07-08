import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: NextRequest) {
  try {
    const { nome, email, password } = await request.json();

    if (!nome || !email || !password) {
      return NextResponse.json(
        { error: "Nome, email e senha são obrigatórios." },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "A senha deve ter pelo menos 6 caracteres." },
        { status: 400 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // 1. Criar usuário no Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { nome },
      email_confirm: true, // Auto-confirma o email (sem necessidade de verificação)
    });

    if (authError) {
      // Trata erros comuns
      if (authError.message.includes("already been registered") || authError.message.includes("already exists")) {
        return NextResponse.json(
          { error: "Este email já está cadastrado. Faça login." },
          { status: 409 }
        );
      }
      console.error("Supabase Auth createUser error:", authError);
      return NextResponse.json(
        { error: authError.message },
        { status: 500 }
      );
    }

    // 2. Criar registro na tabela 'clientes' vinculado ao novo usuário
    const { error: clientError } = await supabase
      .from("clientes")
      .insert({
        nome_cliente: nome,
        auth_user_id: authData.user.id,
        email: email,
      });

    if (clientError) {
      console.error("Error creating client record:", clientError);
      // Não retorna erro ao usuário — o login funcionará mesmo sem o registro em clientes
    }

    return NextResponse.json(
      { message: "Conta criada com sucesso! Faça login para continuar." },
      { status: 201 }
    );
  } catch (err) {
    console.error("Register API error:", err);
    return NextResponse.json(
      { error: "Erro interno do servidor." },
      { status: 500 }
    );
  }
}
