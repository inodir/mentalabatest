import * as React from "react";
import { Input } from "@/components/ui/input";

export interface DebouncedInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  value: string;
  onDebounceChange: (value: string) => void;
  debounce?: number;
}

export function DebouncedInput({
  value: initialValue,
  onDebounceChange,
  debounce = 300,
  ...props
}: DebouncedInputProps) {
  const [value, setValue] = React.useState(initialValue);

  React.useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  React.useEffect(() => {
    const timeout = setTimeout(() => {
      onDebounceChange(value);
    }, debounce);

    return () => clearTimeout(timeout);
  }, [value, debounce, onDebounceChange]);

  return (
    <Input 
      {...props} 
      value={value} 
      onChange={(e) => setValue(e.target.value)} 
    />
  );
}
