// web/src/components/TiposRobosChart.jsx
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
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        
        const result = await response.json();
        
        console.log('TiposRobos - Datos recibidos:', result);
        
        // Verificar el formato que recibimos
        if (result && result.labels && result.totales) {
          // Formato: {labels: [], totales: [], exitosos: []}
          setData(result);
          setError(null);
        } else {
          setError('Formato de datos incorrecto');
          setData(null);
        }
      } catch (err) {
        console.error('Error cargando tipos de robos:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading && !data) {
    return (
      <div className="bg-gray-800 bg-opacity-50 backdrop-blur-lg rounded-lg shadow-lg p-6 border border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-4">🍩 Distribución por Tipo</h3>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (error || !data || !data.labels || data.labels.length === 0) {
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
    labels: data.labels.map(label => label.charAt(0).toUpperCase() + label.slice(1)),
    datasets: [
      {
        label: 'Robos',
        data: data.totales,
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
          font: { size: 12 },
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
    cutout: '65%',
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
          {data.labels.map((label, index) => {
            const total = data.totales.reduce((a, b) => a + b, 0);
            const percentage = ((data.totales[index] / total) * 100).toFixed(1);
            return (
              <div key={label} className="space-y-1">
                <div className="text-gray-400 uppercase">{label}</div>
                <div className="text-white font-semibold text-lg">{data.totales[index]}</div>
                <div className="text-gray-500">{percentage}%</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default TiposRobosChart;