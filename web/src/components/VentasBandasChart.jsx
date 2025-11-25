// web/src/components/VentasBandasChart.jsx
import { useEffect, useState } from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

function VentasBandasChart() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${import.meta.env.VITE_API_URL}/ventas/por-banda`);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        
        const result = await response.json();
        
        console.log('VentasBandas - Datos recibidos:', result);
        
        // Verificar el formato que recibimos
        if (result && result.labels && result.ingresos) {
          // Formato: {labels: [], ventas: [], ingresos: []}
          setData(result);
          setError(null);
        } else {
          setError('Formato de datos incorrecto');
          setData(null);
        }
      } catch (err) {
        console.error('Error cargando ventas por banda:', err);
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
        <h3 className="text-lg font-semibold text-white mb-4">📊 Ventas por Banda</h3>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
        </div>
      </div>
    );
  }

  if (error || !data || !data.labels || data.labels.length === 0) {
    return (
      <div className="bg-gray-800 bg-opacity-50 backdrop-blur-lg rounded-lg shadow-lg p-6 border border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-4">📊 Ventas por Banda</h3>
        <div className="flex items-center justify-center h-64 text-gray-400">
          {error || 'No hay datos disponibles'}
        </div>
      </div>
    );
  }

  const chartData = {
    labels: data.labels,
    datasets: [
      {
        label: 'Ingresos ($)',
        data: data.ingresos,
        backgroundColor: 'rgba(34, 197, 94, 0.8)',
        borderColor: 'rgba(34, 197, 94, 1)',
        borderWidth: 2,
        borderRadius: 6,
        borderSkipped: false,
      },
      {
        label: 'Ventas',
        data: data.ventas,
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 2,
        borderRadius: 6,
        borderSkipped: false,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: '#e5e7eb',
          font: { size: 12 },
          padding: 15,
          usePointStyle: true,
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
            const label = context.dataset.label || '';
            const value = context.parsed.y;
            if (label.includes('Ingresos')) {
              return ` ${label}: $${value.toLocaleString('es-ES')}`;
            }
            return ` ${label}: ${value}`;
          }
        }
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(75, 85, 99, 0.3)',
        },
        ticks: {
          color: '#9ca3af',
          callback: function(value) {
            return '$' + value.toLocaleString('es-ES');
          }
        },
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: '#9ca3af',
        },
      },
    },
  };

  return (
    <div className="bg-gray-800 bg-opacity-50 backdrop-blur-lg rounded-lg shadow-lg p-6 border border-gray-700 hover:shadow-xl transition-shadow">
      <h3 className="text-lg font-semibold text-white mb-4">📊 Ventas por Banda</h3>
      <div style={{ height: '280px' }}>
        <Bar data={chartData} options={options} />
      </div>
      
      {/* Resumen debajo de la gráfica */}
      <div className="mt-4 pt-4 border-t border-gray-700">
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div className="text-center">
            <div className="text-gray-400 mb-1">Top Banda</div>
            <div className="text-white font-semibold text-sm">{data.labels[0]}</div>
            <div className="text-green-400 font-bold">
              ${data.ingresos[0]?.toLocaleString('es-ES')}
            </div>
          </div>
          <div className="text-center">
            <div className="text-gray-400 mb-1">Total Ventas</div>
            <div className="text-white font-semibold text-sm">
              {data.ventas.reduce((sum, val) => sum + val, 0)} ventas
            </div>
            <div className="text-blue-400 font-bold">
              ${data.ingresos.reduce((sum, val) => sum + val, 0).toLocaleString('es-ES')}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default VentasBandasChart;