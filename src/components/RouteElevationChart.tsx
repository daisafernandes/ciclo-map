import { Loader2 } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { ElevationProfilePoint } from "@/services/elevation";

interface RouteElevationChartProps {
  data: ElevationProfilePoint[] | null;
  loading: boolean;
  error: string | null;
}

export default function RouteElevationChart({ data, loading, error }: RouteElevationChartProps) {
  if (loading) {
    return (
      <div className="flex items-center gap-2 text-[11px] text-muted-foreground pt-1">
        <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
        Carregando perfil de elevação…
      </div>
    );
  }

  if (error) {
    return <p className="text-[11px] text-destructive leading-snug pt-1">{error}</p>;
  }

  if (!data?.length) {
    return null;
  }

  const minEl = Math.min(...data.map((d) => d.elevationM));
  const maxEl = Math.max(...data.map((d) => d.elevationM));
  const pad = Math.max(2, (maxEl - minEl) * 0.08);

  return (
    <div className="space-y-1.5 pt-1">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Elevação (SRTM)</p>
      <div className="h-28 w-full -mx-1">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 4, right: 4, left: -18, bottom: 0 }}>
            <defs>
              <linearGradient id="routeElevFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.35} />
                <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="distanceKm"
              tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }}
              tickFormatter={(v: number) => `${v.toFixed(1)}`}
              label={{ value: "km", position: "insideBottomRight", offset: -2, fontSize: 9, fill: "hsl(var(--muted-foreground))" }}
            />
            <YAxis
              domain={[minEl - pad, maxEl + pad]}
              tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }}
              tickFormatter={(v: number) => `${Math.round(v)}`}
              width={36}
            />
            <Tooltip
              contentStyle={{
                fontSize: 11,
                borderRadius: 8,
                border: "1px solid hsl(var(--border) / 0.6)",
                background: "hsl(var(--card) / 0.95)",
              }}
              formatter={(value: number) => [`${Math.round(value)} m`, "Elevação"]}
              labelFormatter={(label: number) => `≈ ${label.toFixed(2)} km ao longo da rota`}
            />
            <Area
              type="monotone"
              dataKey="elevationM"
              stroke="hsl(var(--primary))"
              strokeWidth={1.5}
              fill="url(#routeElevFill)"
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <p className="text-[9px] text-muted-foreground/90 leading-snug">
        Dados aproximados (Open-Elevation / SRTM). Pode diferir do relevo real.
      </p>
    </div>
  );
}
