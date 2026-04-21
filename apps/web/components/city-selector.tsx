"use client";

import { useOptimistic, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../lib/supabase-browser";
import type { City } from "../lib/types";

type Props = {
  cities: City[];
  selectedCityIds: string[];
  userId: string;
};

export function CitySelector({ cities, selectedCityIds, userId }: Props) {
  const supabase = createClient();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [optimisticIds, updateOptimisticIds] = useOptimistic(
    selectedCityIds,
    (currentIds: string[], nextState: { cityId: string; checked: boolean }) => {
      if (nextState.checked) {
        return Array.from(new Set([...currentIds, nextState.cityId]));
      }

      return currentIds.filter((cityId) => cityId !== nextState.cityId);
    }
  );

  function onToggle(cityId: string, checked: boolean) {
    setErrorMessage(null);

    startTransition(async () => {
      updateOptimisticIds({ cityId, checked });

      let error: { message: string } | null = null;

      if (checked) {
        const result = await supabase.from("user_city_subscriptions").insert({ user_id: userId, city_id: cityId });
        error = result.error;
      } else {
        const result = await supabase
          .from("user_city_subscriptions")
          .delete()
          .eq("user_id", userId)
          .eq("city_id", cityId);
        error = result.error;
      }

      if (error) {
        setErrorMessage(error.message);
      }

      router.refresh();
    });
  }

  return (
    <div className="glass-panel terminal-panel px-6 py-6 md:px-7">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="text-xs uppercase tracking-[0.24em] text-ink/45">Cities</div>
          <h2 className="mt-2 font-display text-4xl leading-none text-ink">Choose your feed</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-ink/60">
            Feed changes now refresh the dashboard immediately, so new cities appear without waiting for the next worker insert.
          </p>
        </div>
        <div className="text-sm text-ink/55">{pending ? "Saving..." : "Realtime updates enabled"}</div>
      </div>
      <div className="mt-6 flex flex-wrap gap-3">
        {cities.map((city) => {
          const checked = optimisticIds.includes(city.id);

          return (
            <label
              key={city.id}
              className={`inline-flex cursor-pointer items-center gap-3 rounded-full border px-4 py-3 text-sm font-semibold transition ${
                checked
                  ? "border-storm/15 bg-storm text-white shadow-lg shadow-storm/15"
                  : "border-storm/10 bg-white/70 text-ink hover:bg-white"
              }`}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={(event) => onToggle(city.id, event.target.checked)}
                disabled={pending}
                className="h-4 w-4 accent-[#ffb35c]"
              />
              <span>
                {city.name} · {city.country_code}
              </span>
            </label>
          );
        })}
      </div>
      {errorMessage ? (
        <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          Feed update failed: {errorMessage}
        </div>
      ) : null}
    </div>
  );
}
