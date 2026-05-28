import { useState } from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { SECTORS } from '@/lib/demographics';

interface SectorComboboxProps {
  value: string;
  onChange: (value: string) => void;
}

export function SectorCombobox({ value, onChange }: SectorComboboxProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-2">
      <label className="text-sm text-muted-foreground">Sector (opcional)</label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              "w-full justify-between font-normal",
              !value && "text-muted-foreground"
            )}
          >
            {value || "Seleccioná tu sector"}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0 bg-popover" align="start">
          <Command>
            <CommandInput placeholder="Buscar sector..." />
            <CommandList>
              <CommandEmpty>No se encontró el sector.</CommandEmpty>
              <CommandGroup>
                {SECTORS.map((sector) => (
                  <CommandItem
                    key={sector}
                    value={sector}
                    onSelect={() => {
                      onChange(sector === value ? '' : sector);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === sector ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {sector}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
