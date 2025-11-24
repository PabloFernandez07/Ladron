/* eslint-disable no-unused-vars */
// ==========================================
// web/src/components/TiposRobosChart.jsx
// Gráfica circular de distribución de tipos
// ==========================================
import { useEffect, useState } from 'react';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

function TiposRobosChart() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${import.meta.env.VITE_API_URL}/robos/por-tipo`);
        const result = await response.json();
        
        // Asegurarse de que result sea un array
        const dataArray = Array.isArray(result) ? result : [];
        
        setData(dataArray);
        setError(null);
      } catch (err) {
        console.error('Error cargando tipos de robos:', err);
        setError('Error al cargar datos');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    
    // Actualizar cada 30 segundos
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="bg-gray-800 bg-opacity-50 backdrop-blur-lg rounded-lg shadow-lg p-6 border border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-4">🍩 Distribución por Tipo</h3>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (error || !data || data.length === 0) {
    return (
      <div className="bg-gray-800 bg-opacity-50 backdrop-blur-lg rounded-lg shadow-lg p-6 border border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-4">🍩 Distribución por Tipo</h3>
        <div className="flex items-center justify-center h-64 text-gray-400">
          {error || 'No hay datos disponibles'}
        </div>
      </div>
    );
  }

  const chartData = {
    labels: data.map(item => item.tipo.charAt(0).toUpperCase() + item.tipo.slice(1)),
    datasets: [
      {
        label: 'Robos',
        data: data.map(item => item.total),
        backgroundColor: [
          'rgba(34, 197, 94, 0.8)',   // Verde - Bajo
          'rgba(251, 191, 36, 0.8)',  // Amarillo - Medio
          'rgba(239, 68, 68, 0.8)',   // Rojo - Grande
        ],
        borderColor: [
          'rgba(34, 197, 94, 1)',
          'rgba(251, 191, 36, 1)',
          'rgba(239, 68, 68, 1)',
        ],
        borderWidth: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: '#e5e7eb',
          font: {
            size: 12,
          },
          padding: 15,
          usePointStyle: true,
          pointStyle: 'circle',
        },
      },
      tooltip: {
        backgroundColor: 'rgba(17, 24, 39, 0.9)',
        titleColor: '#fff',
        bodyColor: '#e5e7eb',
        borderColor: '#374151',
        borderWidth: 1,
        padding: 12,
        displayColors: true,
        callbacks: {
          label: function(context) {
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = ((context.parsed / total) * 100).toFixed(1);
            return ` ${context.label}: ${context.parsed} (${percentage}%)`;
          }
        }
      },
    },
    cutout: '65%', // Hace el donut más fino
  };

  return (
    <div className="bg-gray-800 bg-opacity-50 backdrop-blur-lg rounded-lg shadow-lg p-6 border border-gray-700 hover:shadow-xl transition-shadow">
      <h3 className="text-lg font-semibold text-white mb-4">🍩 Distribución por Tipo</h3>
      <div style={{ height: '280px' }}>
        <Doughnut data={chartData} options={options} />
      </div>
      
      {/* Resumen debajo de la gráfica */}
      <div className="mt-4 pt-4 border-t border-gray-700">
        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          {data.map((item, index) => (
            <div key={item.tipo} className="space-y-1">
              <div className="text-gray-400 uppercase">{item.tipo}</div>
              <div className="text-white font-semibold text-lg">{item.total}</div>
              <div className="text-gray-500">
                {((item.total / data.reduce((a, b) => a + b.total, 0)) * 100).toFixed(1)}%
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default TiposRobosChart;