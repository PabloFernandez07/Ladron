// ==========================================
// src/App.jsx
// Dashboard Principal
// ==========================================
import { useEffect, useState } from 'react';
import StatCard from './components/StatCard';
import RobosChart from './components/RobosChart';
import { getStats } from './services/api';
import './App.css';

function App() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const data = await getStats();
        
        // Obtener información de usuarios de Discord
        if (data.topLadrones && data.topLadrones.length > 0) {
          const usuariosConNombres = await Promise.all(
            data.topLadrones.map(async (usuario) => {
              try {
                // Intentar obtener el nombre del usuario desde Discord
                // Esto requiere que el backend tenga acceso al cliente de Discord
                return {
                  ...usuario,
                  username: usuario.username // Por ahora mostramos el ID
                };
              // eslint-disable-next-line no-unused-vars
              } catch (error) {
                return {
                  ...usuario,
                  username: usuario.userId
                };
              }
            })
          );
          data.topLadrones = usuariosConNombres;
        }
        
        setStats(data);
        setError(null);
      } catch (err) {
        console.error('Error cargando estadísticas:', err);
        setError('Error al conectar con el servidor');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
    
    // Actualizar cada 30 segundos
    const interval = setInterval(fetchStats, 30000);
    
    return () => clearInterval(interval);
  }, []);

  if (loading && !stats) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-500 mx-auto mb-4"></div>
          <p className="text-white text-xl">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 text-2xl mb-4">❌ {error}</p>
          <p className="text-gray-400 mb-4">Verifica que el backend esté corriendo en el puerto 3000</p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Header */}
      <header className="bg-gray-800 bg-opacity-50 backdrop-blur-lg border-b border-gray-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="text-4xl">🎯</div>
              <div>
                <h1 className="text-2xl font-bold text-white">Dashboard de Robos</h1>
                <p className="text-gray-400 text-sm">Sistema de estadísticas en tiempo real</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-gray-400 text-sm">En vivo</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">📊 Resumen de la Semana</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Total Robos"
              value={stats?.robos?.total || 0}
              icon="🎯"
              subtitle="Últimos 7 días"
              color="blue"
            />
            
            <StatCard
              title="Tasa de Éxito"
              value={`${stats?.robos?.tasaExito || 0}%`}
              icon="✅"
              subtitle={`${stats?.robos?.exitosos || 0} exitosos`}
              color="green"
            />
            
            <StatCard
              title="Total Ventas"
              value={stats?.ventas?.total || 0}
              icon="💰"
              subtitle="Últimos 7 días"
              color="purple"
            />
            
            <StatCard
              title="Ingresos"
              value={`$${(stats?.ventas?.ingresos || 0).toLocaleString()}`}
              icon="💵"
              subtitle="Total de la semana"
              color="yellow"
            />
          </div>
        </div>

        {/* Charts */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">📈 Tendencias</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <RobosChart dias={30} />
            
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <div className="flex items-center justify-center h-80">
                <div className="text-center">
                  <p className="text-gray-500 text-lg mb-2">📊 Más gráficas próximamente</p>
                  <p className="text-gray-400 text-sm">Ventas, Top usuarios, y más...</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Top Ladrones */}
        {stats?.topLadrones && stats.topLadrones.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-white mb-4">🏆 Top Ladrones de la Semana</h2>
            <div className="bg-gray-800 bg-opacity-50 backdrop-blur-lg rounded-lg shadow-lg overflow-hidden border border-gray-700">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-700">
                  <thead className="bg-gray-900 bg-opacity-50">
                    <tr>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-300 uppercase tracking-wider">
                        #
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Usuario
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Total Robos
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Exitosos
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Tasa de Éxito
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {stats.topLadrones.map((usuario, index) => (
                      <tr key={usuario.userId} className="hover:bg-gray-700 hover:bg-opacity-30 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <div className="text-2xl">
                            {index === 0 && '🥇'}
                            {index === 1 && '🥈'}
                            {index === 2 && '🥉'}
                            {index > 2 && <span className="text-gray-400 font-semibold">{index + 1}</span>}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <div className="text-sm font-medium text-gray-200">
                            {usuario.username || usuario.userId}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <div className="text-sm text-gray-200 font-semibold">
                            {usuario.totalRobos}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-900 bg-opacity-50 text-green-300 border border-green-700">
                            {usuario.exitosos}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <div className="flex items-center justify-center">
                            <div className="text-sm font-medium text-gray-200 mr-2">
                              {usuario.tasaExito}%
                            </div>
                            <div className="w-16 bg-gray-700 rounded-full h-2">
                              <div 
                                className="bg-gradient-to-r from-blue-500 to-blue-400 h-2 rounded-full transition-all duration-500"
                                style={{ width: `${usuario.tasaExito}%` }}
                              ></div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center text-gray-500 text-sm mt-12 pb-8">
          <p>Dashboard de Robos v1.0 • Actualizado en tiempo real</p>
          <p className="mt-2">
            Backend: <span className="text-green-500">●</span> Online • 
            Última actualización: {new Date().toLocaleTimeString('es-ES')}
          </p>
        </div>
      </main>
    </div>
  );
}

export default App;