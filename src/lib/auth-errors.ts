export const SUPABASE_NOT_CONFIGURED_MESSAGE = "Usługa logowania nie jest skonfigurowana.";

const GENERIC_MESSAGES = {
  signin: "Nie udało się zalogować. Spróbuj ponownie.",
  signup: "Nie udało się utworzyć konta. Spróbuj ponownie.",
} as const;

const KNOWN_MESSAGES: Record<string, string> = {
  invalid_credentials: "Nieprawidłowy e-mail lub hasło.",
  user_already_exists: "Konto z tym adresem e-mail już istnieje.",
  email_exists: "Konto z tym adresem e-mail już istnieje.",
  weak_password: "Hasło jest zbyt słabe. Wybierz dłuższe, trudniejsze do odgadnięcia hasło.",
  over_request_rate_limit: "Zbyt wiele prób. Spróbuj ponownie za chwilę.",
  over_email_send_rate_limit: "Zbyt wiele prób. Spróbuj ponownie za chwilę.",
  email_address_invalid: "Podany adres e-mail jest nieprawidłowy.",
};

export function polishAuthError(error: { code?: string; message: string }, context: "signin" | "signup"): string {
  const known = error.code ? KNOWN_MESSAGES[error.code] : undefined;
  return known ?? GENERIC_MESSAGES[context];
}
