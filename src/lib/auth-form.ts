export interface Credentials {
  email: string;
  password: string;
}

/**
 * Reads email and password from a form POST. Returns null when the body is not a form
 * or when a field is missing, not a string, or empty.
 */
export async function readCredentials(request: Request): Promise<Credentials | null> {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return null;
  }

  const email = form.get("email");
  const password = form.get("password");
  if (typeof email !== "string" || typeof password !== "string" || !email.trim() || !password) {
    return null;
  }

  return { email: email.trim(), password };
}
