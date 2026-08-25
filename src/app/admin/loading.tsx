import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardHeader, CardContent } from "@/components/ui/card";

export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <Skeleton className="h-10 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-32 rounded-xl" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="bg-[#0e0e11] border-zinc-900 rounded-2xl shadow-sm">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-8 w-8 rounded-xl" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-6 mt-6">
        <Card className="bg-[#0e0e11] border-zinc-900 rounded-2xl">
          <CardHeader>
            <Skeleton className="h-6 w-32 mb-1" />
            <Skeleton className="h-4 w-48" />
          </CardHeader>
          <CardContent className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex justify-between py-3 border-t border-zinc-900/60">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-8 w-8 rounded-lg" />
                  <Skeleton className="h-4 w-40" />
                </div>
                <Skeleton className="h-4 w-8" />
              </div>
            ))}
          </CardContent>
        </Card>
        <Card className="bg-[#0e0e11] border-zinc-900 rounded-2xl">
          <CardHeader>
            <Skeleton className="h-6 w-32 mb-1" />
            <Skeleton className="h-4 w-48" />
          </CardHeader>
          <CardContent className="space-y-6 mt-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex gap-4">
                <Skeleton className="h-8 w-8 rounded-xl shrink-0" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-full max-w-[200px]" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
