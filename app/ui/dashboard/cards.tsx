'use client';
import React, { ChangeEvent, useEffect, useState } from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LogarithmicScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

// Registro dos componentes do Chart.js
ChartJS.register(CategoryScale, LogarithmicScale, BarElement, Title, Tooltip, Legend, LinearScale);

interface DataItem {
  'grupo_de_produtos': string;
  'linetotal': number;
  'groupname': string;
}

export default function CardWrapper() {
  const [data, setData] = useState<DataItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<{ message: string; } | null>(null);
  const [startDate, setStartDate] = useState<string>('2024-09-01');
  const [endDate, setEndDate] = useState<string>('2024-09-01');

  const handleDateChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
  
    if (name === 'startDate') {
      setStartDate(value);
    } else if (name === 'endDate') {
      setEndDate(value);
    }
  };

  const fetchData = async () => {
    try {
      const response = await fetch(`http://localhost:8003/api/produtos_clientes?startDate=${startDate}&endDate=${endDate}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao buscar dados');
      }
      const result: DataItem[] = await response.json();
      setData(result);
    } catch (err) {
      if (err instanceof Error) {
        setError({ message: err.message });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [startDate, endDate]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  // Agrupar os dados por grupo_de_produtos
  const groupedByProduct = data.reduce((acc: { [key: string]: number }, item) => {
    acc[item.grupo_de_produtos] = (acc[item.grupo_de_produtos] || 0) + item.linetotal;
    return acc;
  }, {});

  // Agrupar os dados por groupname (grupo de clientes)
  const groupedByClient = data.reduce((acc: { [key: string]: number }, item) => {
    acc[item.groupname] = (acc[item.groupname] || 0) + item.linetotal;
    return acc;
  }, {});

  // Preparar os dados para o gráfico de produtos
  const productChartData = {
    labels: Object.keys(groupedByProduct),
    datasets: [
      {
        label: 'Total por Grupo de Produtos',
        data: Object.values(groupedByProduct),
        backgroundColor: 'rgba(75, 192, 192, 0.7)',
      },
    ],
  };

  // Preparar os dados para o gráfico de clientes
  const clientChartData = {
    labels: Object.keys(groupedByClient),
    datasets: [
      {
        label: 'Total por Grupo de Clientes',
        data: Object.values(groupedByClient),
        backgroundColor: 'rgba(153, 102, 255, 0.7)',
      },
    ],
  };

  // Calcular os totais
  const totalProducts = Object.values(groupedByProduct).reduce((acc, value) => acc + value, 0);
  const totalClients = Object.values(groupedByClient).reduce((acc, value) => acc + value, 0);

  const options = {
    indexAxis: 'y', // Define a orientação como horizontal
    responsive: true,
    maintainAspectRatio: false, // Permite que o gráfico ajuste a altura
    plugins: {
      legend: {
        position: 'top' as const,
      },
      tooltip: {
        callbacks: {
          label: function(tooltipItem: { dataset: { label: string; }; raw: any; }) {
            const label = tooltipItem.dataset.label || '';
            const value = tooltipItem.raw;
            return `${label}: R$ ${value.toLocaleString()}`; // Formatação do tooltip
          },
        },
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Total (R$)',
        },
        grid: {
          display: false, // Remove as linhas do fundo
        },
      },
      y: {
        title: {
          display: true,
          text: 'Grupo de Produtos / Clientes',
        },
        grid: {
          display: false, // Remove as linhas do fundo
        },
        ticks: {
          padding: 20, // Aumenta o espaçamento dos rótulos no eixo Y
        },
      },
    },
  };

  return (
    <div className="p-6 bg-gray-100 rounded-lg shadow-lg font-mono">
      <div className="bg-white rounded-lg shadow-md p-2 mb-6">
        <div className="flex justify-end">
          <input
            type="date"
            name="startDate"
            value={startDate}
            onChange={handleDateChange}
            className="p-2 border border-gray-300 rounded-md mr-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="date"
            name="endDate"
            value={endDate}
            onChange={handleDateChange}
            className="p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="mt-2 ml-2">
          <strong>Faturado: R$ {totalClients.toLocaleString('pt-BR')}</strong>
        </div>
        </div>
        <div style={{ height: '650px' }}>
          <Bar data={productChartData} options={options} />
        </div>
       
      </div>

      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="flex justify-end mb-4">
        </div>
        <div style={{ height: '400px' }}>
          <Bar data={clientChartData} options={options} />
        </div>
        
      </div>
    </div>
  );
}