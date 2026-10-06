import { DrawerSection } from "@shared/components/ui/overlay/detail-drawer/DrawerSection";
import type { SpanAttributes } from "@shared/traces/types/detail";
import { memo } from "react";
import { AttributesTable } from "./AttributesTable";

interface Props {
  readonly spanAttributes: SpanAttributes;
  readonly onAddFilter?: (key: string, value: string) => void;
}

function SpanAttributesSectionComponent({ spanAttributes, onAddFilter }: Props) {
  const attrs = spanAttributes.attributesString;
  const resAttrs = spanAttributes.resourceAttributes;

  return (
    <div className="flex flex-col gap-4">
      <DrawerSection title="Span Attributes">
        <AttributesTable attributes={attrs} onAddFilter={onAddFilter} />
      </DrawerSection>

      {Object.keys(resAttrs).length > 0 && (
        <DrawerSection title="Resource Attributes">
          <AttributesTable attributes={resAttrs} onAddFilter={onAddFilter} />
        </DrawerSection>
      )}
    </div>
  );
}

export const SpanAttributesSection = memo(SpanAttributesSectionComponent);
