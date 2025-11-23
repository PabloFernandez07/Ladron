// ==========================================
// src/components/StatCard.jsx
// Card para mostrar estadísticas
// ==========================================
import React from 'react';

const StatCard = ({ title, value, icon, subtitle, trend, color = 'blue' }) => {
  const colorClasses = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    red: 'from-red-500 to-red-600',
    yellow: 'from-yellow-500 to-yellow-600',
    purple: 'from-purple-500 to-purple-600',
    indigo: 'from-indigo-500 to-indigo-600',
  };

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
      <div className={`bg-gradient-to-r ${colorClasses[color]} p-4`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white text-opacity-80 text-sm font-medium">
              {title}
            </p>
            <h3 className="text-white text-3xl font-bold mt-1">
              {value}
            </h3>
            {subtitle && (
              <p className="text-white text-opacity-70 text-xs mt-1">
                {subtitle}
              </p>
            )}
          </div>
          <div className="text-white text-4xl opacity-80">
            {icon}
          </div>
        </div>
      </div>
      
      {trend && (
        <div className="px-4 py-2 bg-gray-50">
          <p className={`text-sm ${
            trend.direction === 'up' ? 'text-green-600' : 
            trend.direction === 'down' ? 'text-red-600' : 
            'text-gray-600'
          }`}>
            {trend.direction === 'up' && '↑ '}
            {trend.direction === 'down' && '↓ '}
            {trend.text}
          </p>
        </div>
      )}
    </div>
  );
};

export default StatCard;