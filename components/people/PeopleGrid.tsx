// components/people/people-grid.tsx
"use client";

import { Person } from "@/lib/types/person";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { User, Film, Mic, Star, Calendar } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useState, useEffect } from "react";

interface PeopleGridProps {
  people: Person[];
}

export function PeopleGrid({ people }: PeopleGridProps) {
  const [creditsCount, setCreditsCount] = useState<Record<string, number>>({});
  const supabase = createClient();

  useEffect(() => {
    loadCreditsCount();
  }, [people]);

  const loadCreditsCount = async () => {
    try {
      const counts: Record<string, number> = {};

      // Para cada pessoa, contar as produções
      for (const person of people) {
        const { count, error } = await supabase
          .from("content_actors")
          .select("*", { count: "exact", head: true })
          .eq("actor_id", person.id);

        if (!error && count !== null) {
          counts[person.id] = count;
        } else {
          counts[person.id] = 0;
        }
      }

      setCreditsCount(counts);
    } catch (error) {
      console.error("Error loading credits count:", error);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "actor":
        return <User className="h-3 w-3" />;
      case "director":
        return <Film className="h-3 w-3" />;
      case "writer":
        return <span className="text-xs">✍️</span>;
      case "producer":
        return <span className="text-xs">🎬</span>;
      case "host":
        return <Mic className="h-3 w-3" />;
      default:
        return <User className="h-3 w-3" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "actor":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      case "director":
        return "bg-purple-500/10 text-purple-500 border-purple-500/20";
      case "writer":
        return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
      case "producer":
        return "bg-amber-500/10 text-amber-500 border-amber-500/20";
      case "host":
        return "bg-pink-500/10 text-pink-500 border-pink-500/20";
      default:
        return "bg-gray-500/10 text-gray-500 border-gray-500/20";
    }
  };

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("pt-PT", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const calculateAge = (
    birthDate?: string | null,
    deathDate?: string | null,
  ) => {
    if (!birthDate) return null;

    const birth = new Date(birthDate);
    const end = deathDate ? new Date(deathDate) : new Date();
    let age = end.getFullYear() - birth.getFullYear();
    const monthDiff = end.getMonth() - birth.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && end.getDate() < birth.getDate())) {
      age--;
    }

    return age;
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {people.map((person) => {
        const age = calculateAge(person.birth_date, person.death_date);
        const totalCredits =
          creditsCount[person.id] || person.total_credits || 0;

        return (
          <Link key={person.id} href={`/people/${person.id}`}>
            <Card className="group hover:shadow-xl transition-all duration-300 hover:scale-[1.02] cursor-pointer border-border/50 overflow-hidden h-full">
              <CardContent className="p-0">
                <div className="relative">
                  {/* Imagem/avatar */}
                  <div className="h-48 bg-linear-to-br from-primary/20 to-blue-500/20 flex items-center justify-center relative overflow-hidden">
                    {person.photo_url ? (
                      <Avatar className="h-32 w-32 border-4 border-background shadow-xl">
                        <AvatarImage src={person.photo_url} alt={person.name} />
                        <AvatarFallback className="text-lg font-bold bg-linear-to-br from-primary to-blue-500 text-white">
                          {getInitials(person.name)}
                        </AvatarFallback>
                      </Avatar>
                    ) : (
                      <div className="h-32 w-32 rounded-full bg-linear-to-br from-primary to-blue-500 flex items-center justify-center text-white text-2xl font-bold border-4 border-background shadow-xl">
                        {getInitials(person.name)}
                      </div>
                    )}

                    {/* Badge de papel principal */}
                    {person.is_main_person && (
                      <Badge className="absolute top-3 right-3 bg-linear-to-r from-amber-500 to-orange-500 text-white border-none shadow-md">
                        <Star className="h-3 w-3 mr-1" />
                        Principal
                      </Badge>
                    )}
                  </div>

                  {/* Informações */}
                  <div className="p-4">
                    <h3 className="font-bold text-lg mb-2 line-clamp-1 group-hover:text-primary transition-colors">
                      {person.name}
                    </h3>

                    {/* Badge do papel */}
                    <div className="flex items-center gap-2 mb-3">
                      <Badge
                        variant="outline"
                        className={`${getRoleColor(person.role)} text-xs`}
                      >
                        <span className="mr-1">{getRoleIcon(person.role)}</span>
                        {person.role.charAt(0).toUpperCase() +
                          person.role.slice(1)}
                      </Badge>

                      {person.gender && (
                        <Badge variant="outline" className="text-xs">
                          {person.gender}
                        </Badge>
                      )}
                    </div>

                    {/* Informações demográficas */}
                    <div className="space-y-2 text-sm text-muted-foreground">
                      {person.birth_date && (
                        <div className="flex items-center gap-2">
                          <Calendar className="h-3 w-3" />
                          <span>
                            {formatDate(person.birth_date)}
                            {age && ` (${age} anos)`}
                            {person.death_date &&
                              ` - ${formatDate(person.death_date)}`}
                          </span>
                        </div>
                      )}

                      {person.nationality && (
                        <div className="flex items-center gap-2">
                          <span className="text-xs">📍</span>
                          <span>{person.nationality}</span>
                        </div>
                      )}

                      {person.place_of_birth && (
                        <div className="flex items-center gap-2">
                          <span className="text-xs">🏠</span>
                          <span className="line-clamp-1">
                            {person.place_of_birth}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>

              <CardFooter className="border-t border-border/50 p-4 bg-linear-to-r from-card to-card/50">
                <div className="flex items-center justify-between w-full text-sm">
                  <div className="flex items-center gap-4">
                    {/* Contadores de produções */}
                    {totalCredits > 0 && (
                      <div className="flex items-center gap-1">
                        <Film className="h-4 w-4 text-primary" />
                        <span className="font-semibold">{totalCredits}</span>
                        <span className="text-muted-foreground">produções</span>
                      </div>
                    )}
                  </div>

                  {/* Link para mais detalhes */}
                  <div className="text-primary font-medium text-sm group-hover:translate-x-1 transition-transform">
                    Ver detalhes →
                  </div>
                </div>
              </CardFooter>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
