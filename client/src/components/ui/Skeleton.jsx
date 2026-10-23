// imports for react below this code block
import React from 'react';

// base animated pulse skeleton box below this code block
export const Skeleton = ({ className = '', ...props }) => {
  return (
    <div
      className={`animate-pulse rounded-md bg-app-border/60 ${className}`}
      {...props}
    />
  );
};

// skeleton placeholder for kpi stat cards below this code block
export const SkeletonStatCard = () => {
  return (
    <div className="card-surface p-5 space-y-3">
      <Skeleton className="h-3 w-28" />
      <Skeleton className="h-8 w-20" />
      <Skeleton className="h-3 w-36" />
    </div>
  );
};

// skeleton placeholder for charts below this code block
export const SkeletonChart = ({ height = 'h-64' }) => {
  return (
    <div className={`card-surface p-6 space-y-4 ${height} flex flex-col justify-between`}>
      <div className="space-y-2">
        <Skeleton className="h-4 w-44" />
        <Skeleton className="h-3 w-64" />
      </div>
      <div className="flex items-end gap-3 h-36 pt-4">
        <Skeleton className="h-20 flex-1" />
        <Skeleton className="h-28 flex-1" />
        <Skeleton className="h-24 flex-1" />
        <Skeleton className="h-32 flex-1" />
        <Skeleton className="h-16 flex-1" />
      </div>
    </div>
  );
};

// skeleton placeholder for table rows below this code block
export const SkeletonTableRow = () => {
  return (
    <tr className="border-b border-app-border">
      <td className="p-4"><Skeleton className="h-4 w-48" /></td>
      <td className="p-4"><Skeleton className="h-4 w-20" /></td>
      <td className="p-4"><Skeleton className="h-4 w-24" /></td>
      <td className="p-4"><Skeleton className="h-4 w-16" /></td>
      <td className="p-4"><Skeleton className="h-4 w-20" /></td>
      <td className="p-4 text-right"><Skeleton className="h-7 w-24 ml-auto" /></td>
    </tr>
  );
};
