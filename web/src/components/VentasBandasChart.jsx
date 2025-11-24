// ==========================================
// web/src/components/VentasBandasChart.jsx
// Gráfica de barras de ventas por banda
// ==========================================
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

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

function VentasBandasChart() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${import.meta.env.VITE_API_URL}/ventas/por-banda`);
        const result = await response.json();
        
        // Asegurarse de que result sea un array
        const dataArray = Array.isArray(result) ? result : [];
        
        setData(dataArray);
        setError(null);
      } catch (err) {
        console.error('Error cargando ventas por banda:', err);
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
        <h3 className="text-lg font-semibold text-white mb-4">📊 Ventas por Banda</h3>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
        </div>
      </div>
    );
  }

  if (error || !data || data.length === 0) {
    return (
      <div className="bg-gray-800 bg-opacity-50 backdrop-blur-lg rounded-lg shadow-lg p-6 border border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-4">📊 Ventas por Banda</h3>
        <div className="flex items-center justify-center h-64 text-gray-400">
          {error || 'No hay datos disponibles'}
        </div>
      </div>
    );
  }

  // Ordenar por ingresos de mayor a menor
  const sortedData = [...data].sort((a, b) => b.ingresos - a.ingresos);

  const chartData = {
    labels: sortedData.map(item => item.banda),
    datasets: [
      {
        label: 'Ingresos ($)',
        data: sortedData.map(item => item.ingresos),
        backgroundColor: 'rgba(34, 197, 94, 0.8)',
        borderColor: 'rgba(34, 197, 94, 1)',
        borderWidth: 2,
        borderRadius: 6,
        borderSkipped: false,
      },
      {
        label: 'Ventas',
        data: sortedData.map(item => item.total),
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
          font: {
            size: 12,
          },
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
            if (this.chart.data.datasets[0].label.includes('Ingresos')) {
              return '$' + value.toLocaleString('es-ES');
            }
            return value;
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
            <div className="text-white font-semibold text-sm">{sortedData[0]?.banda}</div>
            <div className="text-green-400 font-bold">
              ${sortedData[0]?.ingresos.toLocaleString('es-ES')}
            </div>
          </div>
          <div className="text-center">
            <div className="text-gray-400 mb-1">Total Ventas</div>
            <div className="text-white font-semibold text-sm">
              {sortedData.reduce((sum, item) => sum + item.total, 0)}
            </div>
            <div className="text-blue-400 font-bold">
              ${sortedData.reduce((sum, item) => sum + item.ingresos, 0).toLocaleString('es-ES')}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default VentasBandasChart;