import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Film, Tv, Video, MoreHorizontal, Star } from "lucide-react";
import type { ContentWithSeries } from "@/lib/types/database";
import Image from "next/image";

interface RecentContentProps {
  content: ContentWithSeries[];
}

export function RecentContent({ content }: RecentContentProps) {
  const getIcon = (type: string) => {
    switch (type) {
      case "movie":
        return <Film className="h-4 w-4" />;
      case "episode":
        return <Tv className="h-4 w-4" />;
      case "short":
        return <Video className="h-4 w-4" />;
      default:
        return <MoreHorizontal className="h-4 w-4" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "movie":
        return "Filme";
      case "episode":
        return "Episódio";
      case "short":
        return "Short";
      default:
        return "Outro";
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Recentemente Assistido</CardTitle>
        <CardDescription>Seus últimos 5 conteúdos</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {content.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Nenhum conteúdo ainda
            </p>
          ) : (
            content.map((item) => (
              <div key={item.id} className="flex items-center gap-3">
                <div className="relative h-14 w-10 flex-shrink-0 overflow-hidden rounded bg-muted sm:h-16 sm:w-12">
                  {item.cover_image || item.series?.cover_image ? (
                    <Image
                      src={item.cover_image || item.series?.cover_image || ""}
                      alt={item.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      {getIcon(item.type)}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{item.name}</p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <Badge variant="secondary" className="text-xs">
                      {getTypeLabel(item.type)}
                    </Badge>
                    {item.series && (
                      <span className="text-xs text-muted-foreground truncate">
                        {item.series.name} - S{item.season}E{item.episode}
                      </span>
                    )}
                  </div>
                </div>
                {item.rating && (
                  <div className="flex items-center gap-1 text-sm flex-shrink-0">
                    <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                    <span className="font-medium">
                      {item.rating.toFixed(1)}
                    </span>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
