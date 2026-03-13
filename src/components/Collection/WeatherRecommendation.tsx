import { useState, useEffect, useMemo } from 'react';
import { useImageFetch } from '@/hooks/useImageFetch';
import type { Fragrance } from '@/lib/types';
import { CloudSun, Thermometer, Droplets, Loader2 } from 'lucide-react';

interface WeatherData {
  temperature: number;
  description: string;
}

function getWeatherDescription(code: number): string {
  if (code === 0) return 'Klar';
  if (code <= 3) return 'Bewölkt';
  if (code <= 48) return 'Neblig';
  if (code <= 67) return 'Regen';
  if (code <= 77) return 'Schnee';
  if (code <= 82) return 'Schauer';
  if (code <= 86) return 'Schneeschauer';
  return 'Gewitter';
}

function suggestForWeather(collection: Fragrance[], temp: number): Fragrance[] {
  return collection
    .map((f) => {
      let score = 0;

      // Temperature-based scoring
      if (temp >= 25) {
        // Hot: fresh, light, citrus
        if (['Fresh', 'Citrus', 'Aquatic'].includes(f.family)) score += 4;
        if (['EdT', 'EdC', 'Cologne'].includes(f.concentration)) score += 2;
        if (['Aromatic', 'Floral'].includes(f.family)) score += 1;
        // Penalize heavy
        if (['Oriental', 'Oud', 'Leather', 'Gourmand'].includes(f.family)) score -= 2;
        if (f.concentration === 'Parfum') score -= 1;
      } else if (temp >= 15) {
        // Mild: versatile
        score += (f.rating?.versatility || 0) * 0.3;
        if (['Fresh', 'Floral', 'Woody', 'Aromatic', 'Fougère'].includes(f.family)) score += 2;
      } else if (temp >= 5) {
        // Cool: warm, woody
        if (['Woody', 'Oriental', 'Leather', 'Fougère', 'Chypre'].includes(f.family)) score += 3;
        if (['EdP', 'Parfum'].includes(f.concentration)) score += 1.5;
      } else {
        // Cold: heavy, sweet, strong
        if (['Oriental', 'Oud', 'Gourmand', 'Leather'].includes(f.family)) score += 4;
        if (f.concentration === 'Parfum') score += 2;
        if (['EdP'].includes(f.concentration)) score += 1;
        // Penalize light
        if (['Fresh', 'Citrus', 'Aquatic'].includes(f.family)) score -= 2;
      }

      // Season match bonus
      const month = new Date().getMonth();
      const currentSeason = month >= 2 && month <= 4 ? 'Frühling' : month >= 5 && month <= 7 ? 'Sommer' : month >= 8 && month <= 10 ? 'Herbst' : 'Winter';
      if (f.season?.includes(currentSeason) || f.season?.includes('Ganzjährig')) score += 2;

      // Rating bonus
      score += (f.rating?.overall || 0) * 0.15;

      // Fill level bonus
      score += (f.fill_level / 100) * 0.5;

      return { fragrance: f, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((r) => r.fragrance);
}

function MiniImage({ fragrance }: { fragrance: Fragrance }) {
  const { resolvedUrl } = useImageFetch(fragrance.name, fragrance.brand, fragrance.image_url, fragrance.id);
  return resolvedUrl ? (
    <img src={resolvedUrl} alt={fragrance.name} className="w-full h-full object-cover" />
  ) : (
    <Droplets size={12} className="text-txt-muted" />
  );
}

interface Props {
  collection: Fragrance[];
  onClick: (f: Fragrance) => void;
}

export function WeatherRecommendation({ collection, onClick }: Props) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    // Try to get cached weather first
    const cached = sessionStorage.getItem('flacon_weather');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (Date.now() - parsed.ts < 30 * 60 * 1000) {
          setWeather(parsed.data);
          setLoading(false);
          return;
        }
      } catch {}
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const res = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code`
          );
          const data = await res.json();
          if (cancelled) return;
          const weatherData: WeatherData = {
            temperature: Math.round(data.current.temperature_2m),
            description: getWeatherDescription(data.current.weather_code),
          };
          setWeather(weatherData);
          sessionStorage.setItem('flacon_weather', JSON.stringify({ data: weatherData, ts: Date.now() }));
        } catch {
          if (!cancelled) setError(true);
        }
        if (!cancelled) setLoading(false);
      },
      () => {
        if (!cancelled) {
          setError(true);
          setLoading(false);
        }
      },
      { timeout: 5000 }
    );

    return () => { cancelled = true; };
  }, []);

  const suggestions = useMemo(() => {
    if (!weather) return [];
    return suggestForWeather(collection, weather.temperature);
  }, [weather, collection]);

  if (error || (!loading && !weather)) return null;

  if (loading) {
    return (
      <div className="mb-6 bg-surface border border-border rounded-lg p-3 flex items-center justify-center gap-2">
        <Loader2 size={14} className="animate-spin text-txt-muted" />
        <span className="text-xs text-txt-muted">Wetter wird geladen...</span>
      </div>
    );
  }

  if (!weather || suggestions.length === 0) return null;

  const tempColor = weather.temperature >= 25 ? 'text-orange-400' : weather.temperature >= 15 ? 'text-yellow-400' : weather.temperature >= 5 ? 'text-blue-300' : 'text-blue-400';

  return (
    <div className="mb-6 bg-gradient-to-r from-surface via-surface to-blue-950/10 border border-border rounded-lg p-4">
      <div className="flex items-center gap-2 mb-3">
        <CloudSun size={14} className="text-txt-muted" />
        <span className="text-[10px] text-txt-muted uppercase tracking-wider font-semibold">Wetter-Empfehlung</span>
        <span className="text-[10px] text-txt-muted">·</span>
        <div className="flex items-center gap-1">
          <Thermometer size={10} className={tempColor} />
          <span className={`text-xs font-semibold ${tempColor}`}>{weather.temperature}°C</span>
        </div>
        <span className="text-[10px] text-txt-muted">{weather.description}</span>
      </div>

      <div className="flex gap-3">
        {suggestions.map((f, idx) => (
          <button
            key={f.id}
            onClick={() => onClick(f)}
            className="flex items-center gap-2.5 p-2 bg-surface border border-border rounded-lg hover:border-gold-dim transition-all text-left flex-1 min-w-0 group"
          >
            <div className="w-8 h-11 rounded-sm bg-surface-2 flex items-center justify-center overflow-hidden shrink-0">
              <MiniImage fragrance={f} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-txt truncate group-hover:text-gold transition-colors">{f.name}</p>
              <p className="text-[10px] text-txt-muted truncate">{f.brand}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
