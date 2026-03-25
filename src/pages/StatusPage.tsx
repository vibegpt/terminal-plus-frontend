import { useQuery } from '@tanstack/react-query';
import { CheckCircle, AlertCircle, XCircle } from 'lucide-react';
import { config } from '@/config/environment';

export function StatusPage() {
  const { data: health } = useQuery({
    queryKey: ['health'],
    queryFn: async () => {
      const checks = await Promise.allSettled([
        fetch('/api/health').then(r => ({ api: r.ok })),
        fetch(`${config.supabaseUrl}/rest/v1/`).then(r => ({ database: r.ok })),
        // Check CDN
        fetch(`${config.cdnUrl}/health.txt`).then(r => ({ cdn: r.ok })),
      ]);
      
      return checks.map((result, i) => {
        const services = ['API', 'Database', 'CDN'];
        return {
          service: services[i],
          status: result.status === 'fulfilled' ? 'operational' : 'down',
        };
      });
    },
    refetchInterval: 30000, // Check every 30 seconds
  });

  return (
    <div className="p-6">
      <h1>System Status</h1>
      {health?.map(service => (
        <div key={service.service} className="flex items-center gap-2">
          {service.status === 'operational' ? 
            <CheckCircle className="text-green-500" /> :
            <XCircle className="text-red-500" />
          }
          <span>{service.service}: {service.status}</span>
        </div>
      ))}
    </div>
  );
}
