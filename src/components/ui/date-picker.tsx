"use client";

import * as React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";

export interface DatePickerProps {
    date?: Date;
    setDate?: (date: Date | undefined) => void;
    onDateChange?: (date: Date | undefined) => void;
    placeholder?: string;
    className?: string;
    disabled?: boolean;
}

export function DatePicker({
    date,
    setDate,
    onDateChange,
    placeholder = "Pick a date",
    className,
    disabled = false,
}: DatePickerProps) {
    const [open, setOpen] = React.useState(false);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger
                render={
                    <Button
                        type="button"
                        variant="outline"
                        disabled={disabled}
                        className={cn(
                            "w-full justify-start text-left font-normal h-10 rounded-xl border-border/80 bg-background text-foreground hover:bg-muted/50 dark:bg-space-950/70 dark:border-border/80 dark:text-starlight-200",
                            !date && "text-muted-foreground dark:text-starlight-400",
                            className
                        )}
                    >
                        <CalendarIcon className="mr-2 size-4 text-gold-500 shrink-0" />
                        {date ? format(date, "PPP") : <span>{placeholder}</span>}
                    </Button>
                }
            />
            <PopoverContent
                className="w-auto p-0 border border-border/80 bg-popover shadow-xl rounded-2xl overflow-hidden"
                align="start"
            >
                <Calendar
                    mode="single"
                    selected={date}
                    onSelect={(d) => {
                        setDate?.(d);
                        onDateChange?.(d);
                        setOpen(false);
                    }}
                    autoFocus
                />
            </PopoverContent>
        </Popover>
    );
}
