import { supabase } from "@/integrations/supabase/client";

export interface StaffMember {
  id: string;
  email: string;
  role: string;
}

export interface StaffAccessResult {
  user: {
    id: string;
    email: string;
  } | null;
  staff: StaffMember | null;
  error: string | null;
}

const NETWORK_ERROR_MESSAGE =
  "Unable to connect to Supabase. Please check your internet connection and try again.";

const normalizeEmail = (email: string) => email.trim().toLowerCase();

const withTimeout = async <T>(
  promise: Promise<T>,
  timeoutMs: number = 8000
): Promise<T> => {
  return await Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      window.setTimeout(() => reject(new Error("Request timed out")), timeoutMs)
    ),
  ]);
};

export const signInStaff = async (
  email: string,
  password: string
): Promise<StaffAccessResult> => {
  const normalizedEmail = normalizeEmail(email);

  const { data, error } = await supabase.auth.signInWithPassword({
    email: normalizedEmail,
    password,
  });

  if (error) {
    return {
      user: null,
      staff: null,
      error: error.message.includes("fetch")
        ? NETWORK_ERROR_MESSAGE
        : error.message,
    };
  }

  const access = await getAuthorizedStaffUser();

  if (!access.staff) {
    await supabase.auth.signOut();
    return {
      user: null,
      staff: null,
      error: access.error || "Unauthorized access",
    };
  }

  return {
    user: data.user?.email
      ? { id: data.user.id, email: data.user.email }
      : null,
    staff: access.staff,
    error: null,
  };
};

export const getAuthorizedStaffUser = async (): Promise<StaffAccessResult> => {
  let user: { id: string; email?: string | null } | null = null;
  let userError: { message: string } | null = null;

  try {
    const {
      data: { session },
    } = await withTimeout(supabase.auth.getSession());

    user = session?.user ?? null;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to verify session";

    return {
      user: null,
      staff: null,
      error:
        message.includes("fetch") || message.includes("timed out")
          ? NETWORK_ERROR_MESSAGE
          : message,
    };
  }

  if (userError) {
    return {
      user: null,
      staff: null,
      error: userError.message.includes("fetch")
        ? NETWORK_ERROR_MESSAGE
        : userError.message,
    };
  }

  if (!user?.email) {
    return { user: null, staff: null, error: null };
  }

  const normalizedEmail = normalizeEmail(user.email);
  let staff: StaffMember | null = null;
  let staffError: { message: string } | null = null;

  try {
    const result = await withTimeout(
      supabase
        .from("staff")
        .select("id, email, role")
        .eq("email", normalizedEmail)
        .maybeSingle()
    );

    staff = result.data;
    staffError = result.error;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to verify staff access";

    return {
      user: null,
      staff: null,
      error:
        message.includes("fetch") || message.includes("timed out")
          ? NETWORK_ERROR_MESSAGE
          : message,
    };
  }

  if (staffError) {
    return {
      user: null,
      staff: null,
      error: staffError.message.includes("fetch")
        ? NETWORK_ERROR_MESSAGE
        : staffError.message,
    };
  }

  if (!staff) {
    return {
      user: null,
      staff: null,
      error: "Unauthorized access",
    };
  }

  return {
    user: {
      id: user.id,
      email: normalizedEmail,
    },
    staff,
    error: null,
  };
};

export const signOutStaff = async () => {
  await supabase.auth.signOut();
};

export const onStaffAuthStateChange = (
  callback: Parameters<typeof supabase.auth.onAuthStateChange>[0]
) => supabase.auth.onAuthStateChange(callback);
