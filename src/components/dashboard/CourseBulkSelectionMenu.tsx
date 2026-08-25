import { ChevronDown, ListChecks } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface CourseBulkSelectionMenuProps {
  allSelected: boolean;
  allSelectionIndeterminate: boolean;
  incompleteAvailable: boolean;
  incompleteSelected: boolean;
  onToggleAll: () => void;
  onToggleIncomplete: () => void;
}

export function CourseBulkSelectionMenu({
  allSelected,
  allSelectionIndeterminate,
  incompleteAvailable,
  incompleteSelected,
  onToggleAll,
  onToggleIncomplete,
}: CourseBulkSelectionMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" variant="outline" size="sm" className="h-9 gap-1.5 px-2.5 text-xs font-medium shadow-xs">
          <ListChecks className="size-4" aria-hidden="true" />
          批量选择
          <ChevronDown className="size-3.5 text-muted-foreground" aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-44">
        <DropdownMenuCheckboxItem
          checked={allSelectionIndeterminate ? 'indeterminate' : allSelected}
          onSelect={(event) => event.preventDefault()}
          onCheckedChange={onToggleAll}
        >
          所有课程
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          checked={incompleteSelected}
          disabled={!incompleteAvailable}
          onSelect={(event) => event.preventDefault()}
          onCheckedChange={onToggleIncomplete}
        >
          未完成课程
        </DropdownMenuCheckboxItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
