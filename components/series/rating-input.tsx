// components/series/rating-input.tsx
"use client";

import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";

interface RatingInputProps {
  value: number;
  onChange: (value: number) => void;
  max?: number;
  step?: number;
}

export function RatingInput({
  value,
  onChange,
  max = 10,
  step = 0.5,
}: RatingInputProps) {
  const handleStarClick = (starValue: number) => {
    onChange(starValue);
  };

  const handleButtonClick = (buttonValue: number) => {
    onChange(buttonValue);
  };

  return (
    <div className="space-y-4">
      {/* Star Rating */}
      <div className="flex items-center justify-center gap-1">
        {[...Array(10)].map((_, index) => {
          const starValue = index + 1;
          const isFilled = value >= starValue;
          const isHalfFilled = value >= starValue - 0.5 && value < starValue;

          return (
            <button
              key={index}
              type="button"
              onClick={() => handleStarClick(starValue)}
              className="relative focus:outline-none"
              aria-label={`Rate ${starValue} out of ${max}`}
            >
              <Star
                className={`h-10 w-10 transition-all ${
                  isFilled
                    ? "fill-yellow-500 text-yellow-500"
                    : isHalfFilled
                      ? "fill-yellow-300 text-yellow-300"
                      : "text-gray-300"
                } hover:scale-110`}
              />
            </button>
          );
        })}
      </div>

      {/* Current Rating */}
      <div className="text-center">
        <div className="text-4xl font-bold mb-2">{value.toFixed(1)}</div>
        <div className="text-sm text-muted-foreground">de {max}</div>
      </div>

      {/* Quick Rating Buttons */}
      <div className="flex flex-wrap justify-center gap-2">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
          <Button
            key={num}
            type="button"
            variant={value === num ? "default" : "outline"}
            size="sm"
            onClick={() => handleButtonClick(num)}
            className="min-w-[40px]"
          >
            {num}
          </Button>
        ))}
      </div>

      {/* Half Steps */}
      <div className="flex flex-wrap justify-center gap-2">
        {[0.5, 1.5, 2.5, 3.5, 4.5, 5.5, 6.5, 7.5, 8.5, 9.5].map((num) => (
          <Button
            key={num}
            type="button"
            variant={value === num ? "default" : "outline"}
            size="sm"
            onClick={() => handleButtonClick(num)}
            className="min-w-[60px]"
          >
            {num.toFixed(1)}
          </Button>
        ))}
      </div>
    </div>
  );
}
