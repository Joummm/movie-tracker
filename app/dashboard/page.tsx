"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { ContentChart } from "@/components/dashboard/content-chart";
import { RecentContent } from "@/components/dashboard/recent-content";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export default function DashboardPage() {
  const router = useRouter();
  const [selectedYears, setSelectedYears] = useState<string[]>(["all"]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, [selectedYears]);

  async function loadDashboardData() {
    setLoading(true);
    const supabase = createClient();

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      router.push("/auth/login");
      return;
    }

    // Get user profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    // Build query based on selected years
    let query = supabase
      .from("content")
      .select("*, series(*)")
      .eq("user_id", user.id);

    if (!selectedYears.includes("all")) {
      const years = selectedYears.map((y) => Number.parseInt(y));
      query = query.in(
        "watched_date",
        years.map((y) => `${y}-01-01`),
      );
      // Filter by year from watched_date
      const { data: allContent } = await supabase
        .from("content")
        .select("*, series(*)")
        .eq("user_id", user.id)
        .order("watched_date", { ascending: false });

      const filteredContent = allContent?.filter((c) => {
        const year = new Date(c.watched_date).getFullYear();
        return years.includes(year);
      });

      processStats(filteredContent || [], profile);
    } else {
      const { data: allContent } = await query.order("watched_date", {
        ascending: false,
      });
      processStats(allContent || [], profile);
    }

    setLoading(false);
  }

  function processStats(allContent: any[], profile: any) {
    // Calculate stats
    const totalContent = allContent?.length || 0;
    const movies = allContent?.filter((c) => c.type === "movie").length || 0;
    const episodes =
      allContent?.filter((c) => c.type === "episode").length || 0;
    const shorts = allContent?.filter((c) => c.type === "short").length || 0;
    const other = allContent?.filter((c) => c.type === "other").length || 0;

    // Calculate total watch time
    const totalMinutes =
      allContent?.reduce((acc, c) => acc + (c.duration || 0), 0) || 0;
    const totalHours = Math.floor(totalMinutes / 60);

    // Calculate average rating
    const ratedContent = allContent?.filter((c) => c.rating) || [];
    const avgRating =
      ratedContent.length > 0
        ? ratedContent.reduce((acc, c) => acc + (c.rating || 0), 0) /
          ratedContent.length
        : 0;

    // Get unique series count
    const uniqueSeries = new Set(
      allContent?.filter((c) => c.series_id).map((c) => c.series_id),
    );
    const seriesCount = uniqueSeries.size;

    // Get content by month for chart (last 6 months)
    const now = new Date();
    const monthsData = Array.from({ length: 6 }, (_, i) => {
      const date = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      const monthName = date.toLocaleDateString("pt-PT", { month: "short" });
      const year = date.getFullYear();
      const month = date.getMonth() + 1;

      const count =
        allContent?.filter((c) => {
          const watchedDate = new Date(c.watched_date);
          return (
            watchedDate.getMonth() + 1 === month &&
            watchedDate.getFullYear() === year
          );
        }).length || 0;

      return {
        month: monthName,
        count,
      };
    });

    setStats({
      profile,
      totalContent,
      movies,
      episodes,
      shorts,
      other,
      totalHours,
      avgRating,
      seriesCount,
      monthsData,
      recentContent: allContent?.slice(0, 5) || [],
    });
  }

  const toggleYear = (year: string) => {
    if (year === "all") {
      setSelectedYears(["all"]);
    } else {
      const newYears = selectedYears.includes("all")
        ? [year]
        : selectedYears.includes(year)
          ? selectedYears.filter((y) => y !== year)
          : [...selectedYears, year];

      setSelectedYears(newYears.length === 0 ? ["all"] : newYears);
    }
  };

  if (loading || !stats) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        Carregando...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader userName={stats.profile?.display_name || "User"} />
      <main className="container mx-auto p-4 md:p-6 lg:p-8">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <Label>Filtrar por Ano</Label>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={selectedYears.includes("all") ? "default" : "outline"}
                size="sm"
                onClick={() => toggleYear("all")}
              >
                Todos
              </Button>
              <Button
                variant={selectedYears.includes("2025") ? "default" : "outline"}
                size="sm"
                onClick={() => toggleYear("2025")}
              >
                2025
              </Button>
              <Button
                variant={selectedYears.includes("2026") ? "default" : "outline"}
                size="sm"
                onClick={() => toggleYear("2026")}
              >
                2026
              </Button>
            </div>
          </div>

          <StatsCards
            totalContent={stats.totalContent}
            movies={stats.movies}
            episodes={stats.episodes}
            shorts={stats.shorts}
            other={stats.other}
            totalHours={stats.totalHours}
            avgRating={stats.avgRating}
            seriesCount={stats.seriesCount}
          />
          <div className="grid gap-6 lg:grid-cols-2">
            <ContentChart data={stats.monthsData} />
            <RecentContent content={stats.recentContent} />
          </div>
        </div>
      </main>
    </div>
  );
}
