import { useState, type ComponentProps } from 'react';

export function CollapsiblePanel({
  open,
  className,
  children,
  ...props
}: ComponentProps<'div'> & { open: boolean }) {
  const [hasOpened, setHasOpened] = useState(open);
  if (open && !hasOpened) setHasOpened(true);

  return (
    <div className="t-acc" data-open={open} aria-hidden={!open} inert={!open} {...props}>
      <div className="t-acc-panel">
        <div className="t-acc-panel-inner min-h-0">
          {(open || hasOpened) && <div className={className}>{children}</div>}
        </div>
      </div>
    </div>
  );
}
