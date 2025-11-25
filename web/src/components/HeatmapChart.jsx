// web/src/components/HeatmapChart.jsx
import { useEffect, useState } from 'react';

function HeatmapChart() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const dias = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
  const horas = ['00', '04', '08', '12', '16', '20'];

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${import.meta.env.VITE_API_URL}/robos/heatmap`);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        
        const result = await response.json();
        
        console.log('Heatmap - Datos recibidos:', result);
        
        // Verificar que sea un array
        if (Array.isArray(result) && result.length > 0) {
          setData(result);
          setError(null);
        } else {
          setError('No hay datos disponibles');
          setData(null);
        }
      } catch (err) {
        console.error('Error cargando heatmap:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const getColor = (count, max) => {
    if (count === 0) return 'bg-gray-700';
    
    const intensity = count / max;
    
    if (intensity > 0.8) return 'bg-red-500';
    if (intensity > 0.6) return 'bg-orange-500';
    if (intensity > 0.4) return 'bg-yellow-500';
    if (intensity > 0.2) return 'bg-green-500';
    return 'bg-blue-500';
  };

  if (loading && !data) {
    return (
      <div className="bg-gray-800 bg-opacity-50 backdrop-blur-lg rounded-lg shadow-lg p-6 border border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-4">🔥 Actividad por Hora</h3>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
        </div>
      </div>
    );
  }

  if (error || !data || data.length === 0) {
    return (
      <div className="bg-gray-800 bg-opacity-50 backdrop-blur-lg rounded-lg shadow-lg p-6 border border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-4">🔥 Actividad por Hora</h3>
        <div className="flex items-center justify-center h-64 text-gray-400">
          {error || 'No hay datos disponibles'}
        </div>
      </div>
    );
  }

  // Encontrar el máximo valor para normalizar colores
  const maxCount = Math.max(...data.map(item => item.total));

  // Crear matriz de datos
  const matrix = {};
  data.forEach(item => {
    if (!matrix[item.hora]) {
      matrix[item.hora] = {};
    }
    // Usar diaSemana en lugar de dia
    matrix[item.hora][item.diaSemana] = item.total;
  });

  return (
    <div className="bg-gray-800 bg-opacity-50 backdrop-blur-lg rounded-lg shadow-lg p-6 border border-gray-700 hover:shadow-xl transition-shadow">
      <h3 className="text-lg font-semibold text-white mb-4">🔥 Actividad por Hora</h3>
      
      <div className="overflow-x-auto">
        <div className="min-w-max">
          {/* Encabezados de días */}
          <div className="flex mb-2">
            <div className="w-12"></div>
            {dias.map(dia => (
              <div key={dia} className="w-14 text-center text-xs text-gray-400 font-medium">
                {dia}
              </div>
            ))}
          </div>

          {/* Filas de horas */}
          {horas.map(hora => (
            <div key={hora} className="flex items-center mb-1">
              <div className="w-12 text-xs text-gray-400 font-medium text-right pr-2">
                {hora}h
              </div>
              {dias.map((dia, diaIndex) => {
                const count = matrix[parseInt(hora)]?.[diaIndex + 1] || 0;
                const color = getColor(count, maxCount);
                
                return (
                  <div
                    key={`${hora}-${dia}`}
                    className={`w-14 h-8 m-0.5 rounded ${color} flex items-center justify-center text-xs font-semibold text-white transition-all hover:scale-110 hover:shadow-lg cursor-pointer`}
                    title={`${dia} ${hora}:00 - ${count} robos`}
                  >
                    {count > 0 ? count : ''}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Leyenda */}
      <div className="mt-4 pt-4 border-t border-gray-700">
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-400">Menos actividad</span>
          <div className="flex gap-1">
            <div className="w-6 h-6 rounded bg-gray-700"></div>
            <div className="w-6 h-6 rounded bg-blue-500"></div>
            <div className="w-6 h-6 rounded bg-green-500"></div>
            <div className="w-6 h-6 rounded bg-yellow-500"></div>
            <div className="w-6 h-6 rounded bg-orange-500"></div>
            <div className="w-6 h-6 rounded bg-red-500"></div>
          </div>
          <span className="text-gray-400">Más actividad</span>
        </div>
        
        {/* Estadísticas */}
        <div className="mt-3 grid grid-cols-2 gap-4 text-center">
          <div>
            <div className="text-gray-400 text-xs mb-1">Hora más activa</div>
            <div className="text-white font-semibold">
              {(() => {
                const hourCounts = {};
                data.forEach(item => {
                  hourCounts[item.hora] = (hourCounts[item.hora] || 0) + item.total;
                });
                const maxHour = Object.keys(hourCounts).reduce((a, b) => 
                  hourCounts[a] > hourCounts[b] ? a : b
                );
                return `${maxHour}:00`;
              })()}
            </div>
          </div>
          <div>
            <div className="text-gray-400 text-xs mb-1">Día más activo</div>
            <div className="text-white font-semibold">
              {(() => {
                const dayCounts = {};
                data.forEach(item => {
                  dayCounts[item.diaSemana] = (dayCounts[item.diaSemana] || 0) + item.total;
                });
                const maxDay = Object.keys(dayCounts).reduce((a, b) => 
                  dayCounts[a] > dayCounts[b] ? a : b
                );
                return dias[parseInt(maxDay) - 1];
              })()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HeatmapChart;