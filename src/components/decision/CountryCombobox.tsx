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
import { COUNTRIES } from '@/lib/countries';

interface CountryComboboxProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

export function CountryCombobox({ value, onChange, error }: CountryComboboxProps) {
  const [open, setOpen] = useState(false);
  const selectedCountry = COUNTRIES.find((c) => c.code === value);

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">País</label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              "w-full justify-between font-normal",
              !value && "text-muted-foreground",
              error && "border-destructive"
            )}
          >
            {selectedCountry?.name || "Seleccioná tu país"}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0 bg-popover" align="start">
          <Command>
            <CommandInput placeholder="Buscar país..." />
            <CommandList>
              {isLoading ? (
                <div className="py-6 text-center text-sm text-muted-foreground">
                  Cargando...
                </div>
              ) : (
                <>
                  <CommandEmpty>No se encontró el país.</CommandEmpty>
                  <CommandGroup>
                    {countries.map((country) => (
                      <CommandItem
                        key={country.code}
                        value={country.name}
                        onSelect={() => {
                          onChange(country.code);
                          setOpen(false);
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            value === country.code ? "opacity-100" : "opacity-0"
                          )}
                        />
                        {country.name}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  );
}
