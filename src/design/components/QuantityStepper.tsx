/**
 * QuantityStepper - Increment/decrement with constraints
 */

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Minus, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuantityStepperProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  className?: string;
}

export function QuantityStepper({ 
  value, 
  onChange, 
  min = 1, 
  max = 999,
  className 
}: QuantityStepperProps) {
  const increment = () => {
    if (value < max) onChange(value + 1);
  };

  const decrement = () => {
    if (value > min) onChange(value - 1);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const num = parseInt(e.target.value) || min;
    onChange(Math.max(min, Math.min(max, num)));
  };

  return (
    <div className={cn('inline-flex items-center gap-2', className)}>
      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={decrement}
        disabled={value <= min}
        className="h-8 w-8"
      >
        <Minus className="h-3 w-3" />
      </Button>
      
      <Input
        type="number"
        value={value}
        onChange={handleInputChange}
        min={min}
        max={max}
        className="w-16 h-8 text-center"
      />
      
      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={increment}
        disabled={value >= max}
        className="h-8 w-8"
      >
        <Plus className="h-3 w-3" />
      </Button>
    </div>
  );
}
