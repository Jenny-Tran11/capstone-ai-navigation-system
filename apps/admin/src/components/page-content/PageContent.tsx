import React from 'react';
import { Link } from 'react-router-dom';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@baseline/ui/primitives/breadcrumb';

export type PageBreadcrumbItem = {
  label: string;
  href?: string;
};

interface Props {
  children: React.ReactNode;
  breadcrumbs?: PageBreadcrumbItem[];
}

const PageContent = ({ children, breadcrumbs }: Props) => {
  return (
    <div className="flex w-full flex-1 flex-col gap-5 px-4 py-4 md:gap-6 md:px-6 md:py-6">
      {breadcrumbs?.length ? (
        <div className="rounded-lg border border-border/70 bg-muted/30 px-3 py-2">
          <Breadcrumb>
            <BreadcrumbList>
              {breadcrumbs.map((item, i) => (
                <React.Fragment key={`${item.label}-${i}`}>
                  <BreadcrumbItem>
                    {item.href ? (
                      <BreadcrumbLink asChild>
                        <Link to={item.href}>{item.label}</Link>
                      </BreadcrumbLink>
                    ) : (
                      <BreadcrumbPage>{item.label}</BreadcrumbPage>
                    )}
                  </BreadcrumbItem>
                  {i < breadcrumbs.length - 1 ? <BreadcrumbSeparator /> : null}
                </React.Fragment>
              ))}
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      ) : null}
      <div className="flex min-h-0 flex-1 flex-col gap-4 md:gap-6">
        {children}
      </div>
    </div>
  );
};

export default PageContent;
