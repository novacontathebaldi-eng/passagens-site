/**
 * Mapeia erros em inglês retornados pelo Supabase Auth para mensagens amigáveis em Português do Brasil (PT-BR).
 * Cobre casos comuns de erro em login, cadastro, recuperação de senha e validação de tokens.
 */
export function translateAuthError(
  error: string | null | undefined,
  support?: { phone?: string; email?: string }
): string {
  if (!error) return "Ocorreu um erro desconhecido. Tente novamente.";
  
  const lowerError = error.toLowerCase();

  // Credenciais
  if (lowerError.includes("invalid login credentials")) {
    return "E-mail ou senha incorretos.";
  }
  if (lowerError.includes("user not found")) {
    return "Usuário não encontrado.";
  }
  if (lowerError.includes("user is banned")) {
    const phone = support?.phone ? support.phone.replace(/ /g, "\u00A0") : "nosso\u00A0WhatsApp";
    const email = support?.email ? support.email.replace(/ /g, "\u00A0") : "nosso\u00A0e-mail";
    return `Sua conta foi suspensa. Por favor, entre em contato com o suporte através do ${phone} ou ${email}.`;
  }
  
  // Cadastro
  if (lowerError.includes("user already registered")) {
    return "Este e-mail já está cadastrado em nosso sistema.";
  }
  if (lowerError.includes("duplicate key value violates unique constraint") && lowerError.includes("cpf")) {
    return "Este CPF já está cadastrado. Verifique os dados e tente novamente.";
  }
  if (lowerError.includes("password should be at least 6 characters") || lowerError.includes("password must be at least 6 characters")) {
    return "A senha deve ter no mínimo 6 caracteres.";
  }

  // Rate Limiting e Segurança
  if (lowerError.includes("email rate limit exceeded")) {
    return "Muitas tentativas de envio. Aguarde alguns minutos e tente novamente.";
  }
  if (lowerError.includes("for security purposes, you can only request this after")) {
    const match = error.match(/after (\d+) seconds/i);
    const seconds = match ? match[1] : "alguns";
    return `Por medidas de segurança, aguarde ${seconds} segundos antes de solicitar novamente.`;
  }

  // Tokens e Confirmações
  if (lowerError.includes("token has expired or is invalid") || lowerError.includes("email link is invalid or has expired")) {
    return "O link utilizado expirou ou é inválido. Por favor, solicite um novo.";
  }
  if (lowerError.includes("email not confirmed")) {
    return "E-mail não confirmado. Verifique sua caixa de entrada.";
  }
  
  // Códigos internos do nosso app
  if (error === "auth_code_error") {
    return "Erro ao validar sua autenticação. Tente fazer login novamente.";
  }

  // Fallback para mensagens que não foram mapeadas
  return error;
}
