import { supabase } from "@/lib/supabase";

interface UserStreaks {
  login_streak_current: number;
  login_streak_best: number;
  last_login_date: string | null;
  seller_streak_current: number;
  last_listing_week: string | null;
  review_streak_current: number;
  review_streak_best: number;
  last_review_date: string | null;
}

const DEFAULT_STREAKS: UserStreaks = {
  login_streak_current: 0,
  login_streak_best: 0,
  last_login_date: null,
  seller_streak_current: 0,
  last_listing_week: null,
  review_streak_current: 0,
  review_streak_best: 0,
  last_review_date: null,
};

/** Returns ISO week string like "2026-W32" */
function getISOWeek(date: Date): string {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const week1 = new Date(d.getFullYear(), 0, 4);
  const weekNum = 1 + Math.round(((d.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7);
  return `${d.getFullYear()}-W${String(weekNum).padStart(2, "0")}`;
}

/** Fetches or creates the streak row for a user. */
export async function getUserStreaks(userId: string): Promise<UserStreaks> {
  try {
    const { data, error } = await supabase
      .from("user_streaks")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) throw error;
    if (!data) return DEFAULT_STREAKS;
    return data as UserStreaks;
  } catch {
    return DEFAULT_STREAKS;
  }
}

/**
 * Called on every app load (AppLayout mount).
 * If this is the first login of the day, increments the login streak.
 * If the user missed a day, resets it to 1.
 */
export async function checkAndUpdateLoginStreak(userId: string): Promise<void> {
  try {
    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

    const { data: existing } = await supabase
      .from("user_streaks")
      .select("login_streak_current, login_streak_best, last_login_date")
      .eq("user_id", userId)
      .maybeSingle();

    if (!existing) {
      // First ever login — create the row
      await supabase.from("user_streaks").insert({
        user_id: userId,
        login_streak_current: 1,
        login_streak_best: 1,
        last_login_date: today,
      });
      return;
    }

    if (existing.last_login_date === today) return; // Already logged in today

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().slice(0, 10);

    const isConsecutive = existing.last_login_date === yesterdayStr;
    const newCurrent = isConsecutive ? existing.login_streak_current + 1 : 1;
    const newBest = Math.max(newCurrent, existing.login_streak_best ?? 0);

    await supabase
      .from("user_streaks")
      .update({
        login_streak_current: newCurrent,
        login_streak_best: newBest,
        last_login_date: today,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId);
  } catch (e) {
    console.warn("[StreakService] login streak error:", e);
  }
}

/**
 * Called when a listing is created successfully.
 * Increments the seller streak if this is the first listing this ISO week.
 */
export async function updateSellerStreak(userId: string): Promise<void> {
  try {
    const thisWeek = getISOWeek(new Date());

    const { data: existing } = await supabase
      .from("user_streaks")
      .select("seller_streak_current, last_listing_week")
      .eq("user_id", userId)
      .maybeSingle();

    if (!existing) {
      await supabase.from("user_streaks").insert({
        user_id: userId,
        seller_streak_current: 1,
        last_listing_week: thisWeek,
      });
      return;
    }

    if (existing.last_listing_week === thisWeek) return; // Already listed this week

    // Check if last week was consecutive
    const lastWeekDate = new Date();
    lastWeekDate.setDate(lastWeekDate.getDate() - 7);
    const lastWeekStr = getISOWeek(lastWeekDate);
    const isConsecutive = existing.last_listing_week === lastWeekStr;
    const newCurrent = isConsecutive ? existing.seller_streak_current + 1 : 1;

    await supabase
      .from("user_streaks")
      .update({
        seller_streak_current: newCurrent,
        last_listing_week: thisWeek,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId);
  } catch (e) {
    console.warn("[StreakService] seller streak error:", e);
  }
}

/**
 * Called after a review is successfully submitted.
 * Increments the review streak (one per day max).
 */
export async function updateReviewStreak(userId: string): Promise<void> {
  try {
    const today = new Date().toISOString().slice(0, 10);

    const { data: existing } = await supabase
      .from("user_streaks")
      .select("review_streak_current, review_streak_best, last_review_date")
      .eq("user_id", userId)
      .maybeSingle();

    if (!existing) {
      await supabase.from("user_streaks").insert({
        user_id: userId,
        review_streak_current: 1,
        review_streak_best: 1,
        last_review_date: today,
      });
      return;
    }

    if (existing.last_review_date === today) return; // Already reviewed today

    const newCurrent = existing.review_streak_current + 1;
    const newBest = Math.max(newCurrent, existing.review_streak_best ?? 0);

    await supabase
      .from("user_streaks")
      .update({
        review_streak_current: newCurrent,
        review_streak_best: newBest,
        last_review_date: today,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId);
  } catch (e) {
    console.warn("[StreakService] review streak error:", e);
  }
}
