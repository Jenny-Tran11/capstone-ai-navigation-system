import * as React from 'react';
import { IconTrendingDown, IconTrendingUp } from '@tabler/icons-react';

import { Badge } from '../primitives/badge';
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '../primitives/card';
import { cn } from '../lib/utils';

export type SectionCardTrend = {
  direction: 'up' | 'down' | 'flat';
  label?: React.ReactNode;
};

export type SectionCardData = {
  description: React.ReactNode;
  title: React.ReactNode;
  trend?: SectionCardTrend;
  footerTitle?: React.ReactNode;
  footerDescription?: React.ReactNode;
};

export interface SectionCardsProps
  extends React.HTMLAttributes<HTMLDivElement> {
  items: SectionCardData[];
}

function TrendIcon({ direction }: { direction: SectionCardTrend['direction'] }) {
  if (direction === 'down') return <IconTrendingDown />;
  if (direction === 'up') return <IconTrendingUp />;
  return null;
}

export function SectionCards({ items, className, ...props }: SectionCardsProps) {
  return (
    <div
      className={cn(
        '*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4',
        className,
      )}
      {...props}
    >
      {items.map((item, index) => (
        <Card
          // eslint-disable-next-line react/no-array-index-key
          key={index}
          className="@container/card"
        >
          <CardHeader>
            <CardDescription>{item.description}</CardDescription>
            <CardTitle className="font-semibold text-2xl tabular-nums @[250px]/card:text-3xl">
              {item.title}
            </CardTitle>
            {item.trend ? (
              <CardAction>
                <Badge variant="outline">
                  <TrendIcon direction={item.trend.direction} />
                  {item.trend.label}
                </Badge>
              </CardAction>
            ) : null}
          </CardHeader>
          {(item.footerTitle || item.footerDescription) && (
            <CardFooter className="flex-col items-start gap-1.5 text-sm">
              {item.footerTitle ? (
                <div className="flex gap-2 font-medium line-clamp-1">
                  {item.footerTitle}
                </div>
              ) : null}
              {item.footerDescription ? (
                <div className="text-muted-foreground">
                  {item.footerDescription}
                </div>
              ) : null}
            </CardFooter>
          )}
        </Card>
      ))}
    </div>
  );
}
