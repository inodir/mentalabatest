import * as React from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";

interface MultiSelectProps {
  options: { label: string; value: string }[];
  selected: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  className?: string;
  icon?: React.ComponentType<{ className?: string }>;
}

export function MultiSelect({
  options,
  selected,
  onChange,
  placeholder = "Tanlang...",
  className,
  icon: Icon,
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false);

  const handleSelect = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter((v) => v !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  const selectedLabels = options
    .filter((o) => selected.includes(o.value))
    .map((o) => o.label);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "h-9 justify-between bg-background px-3 font-normal hover:bg-background/80 border-dashed",
            className
          )}
        >
          <div className="flex items-center gap-2 max-w-[200px] truncate">
            {Icon && <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />}
            {selectedLabels.length > 0 ? (
              <div className="flex items-center gap-1 truncate">
                <Badge variant="secondary" className="rounded-sm px-1 font-normal text-xs">
                  {selectedLabels.length} ta
                </Badge>
                <span className="truncate text-xs">
                  {selectedLabels.join(", ")}
                </span>
              </div>
            ) : (
              <span className="text-muted-foreground text-xs">{placeholder}</span>
            )}
          </div>
          <ChevronsUpDown className="ml-2 h-3 w-3 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] min-w-[240px] p-0" align="start">
        <Command>
          <CommandInput placeholder={placeholder} className="h-8 text-xs" />
          <CommandList className="max-h-[200px]">
            <CommandEmpty className="py-2 text-center text-xs">Topilmadi.</CommandEmpty>
            <CommandGroup className="p-1">
              {options.map((option) => {
                const isSelected = selected.includes(option.value);
                return (
                  <CommandItem
                    key={option.value}
                    value={option.value}
                    onSelect={() => handleSelect(option.value)}
                    className="flex items-center gap-2 px-2 py-1 text-xs cursor-pointer"
                  >
                    <div
                      className={cn(
                        "flex h-3.5 w-3.5 items-center justify-center rounded-sm border border-primary",
                        isSelected ? "bg-primary text-primary-foreground" : "opacity-50"
                      )}
                    >
                      {isSelected && <Check className="h-2.5 w-2.5" />}
                    </div>
                    <span className="flex-1 break-words leading-snug">{option.label}</span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
