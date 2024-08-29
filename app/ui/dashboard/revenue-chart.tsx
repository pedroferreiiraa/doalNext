'use client'

import { useState, useEffect, ChangeEvent } from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, Title, Tooltip, Legend, BarElement, CategoryScale, LogarithmicScale } from 'chart.js';

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LogarithmicScale);

interface DataItem {
  'Tipo de doc.': string;
  'Data de expedição': string;
  'Total Valor': number;
}

interface GroupedData {
  date: string;
  pedidos: number;
  nf: number;
  nf_e_devolucao: number;
  pedido_primeira_data: number;
  pedido_reprogramado: number;
}

export default function RevenueChart() {
  const [data, setData] = useState<GroupedData[]>([]);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

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
      if (!startDate || !endDate) {
        console.warn('Datas não fornecidas para o fetch');
        return;
      }

      const response = await fetch(`http://localhost:3001/api/teste2?startDate=${startDate}&endDate=${endDate}`);
      if (!response.ok) {
        console.error('Erro na resposta da API:', response.statusText);
        return;
      }

      const result: DataItem[] = await response.json();
      const groupedData: { [key: string]: GroupedData } = result.reduce((acc, curr) => {
        const date = curr['Data de expedição'];
        const tipoDoc = curr['Tipo de doc.'];

        if (!acc[date]) {
          acc[date] = {
            date: date,
            pedidos: 0,
            nf: 0,
            nf_e_devolucao: 0,
            pedido_primeira_data: 0,
            pedido_reprogramado: 0,
          };
        }

        if (tipoDoc === 'pedido_primeira_data') {
          acc[date].pedido_primeira_data += curr['Total Valor'];
        } else if (tipoDoc === 'nf_e_devolucao') {
          acc[date].nf_e_devolucao += curr['Total Valor'];
        } else if (tipoDoc === 'pedido_reprogramado') {
          acc[date].pedido_reprogramado += curr['Total Valor'];
        }

        return acc;
      }, {} as { [key: string]: GroupedData });

      const formattedData = Object.values(groupedData);
      setData(formattedData);
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
    }
  };

  useEffect(() => {
    fetchData();
  }, [startDate, endDate]);

  const sortedData = data.sort((a, b) => {
    const [yearA, dayA, monthA] = a.date.split('-').map(Number);
    const [yearB, dayB, monthB] = b.date.split('-').map(Number);
    
    return new Date(yearA, monthA, dayA).getTime() - new Date(yearB, monthB, dayB).getTime();
  });

  // Filtrar dados, removendo dias sem valores de 'Pedidos', 'NF' e 'Devolução'
  const filteredData = sortedData.filter(d => d.pedidos > 0 || d.nf_e_devolucao > 0 || d.pedido_primeira_data > 0 || d.pedido_reprogramado > 0);

  // Preparar os dados para o gráfico
  const chartData = {
    labels: filteredData.map(d => d.date),
    datasets: [
      {
        label: 'Pedido primeira data',
        data: filteredData.map(d => d.pedido_primeira_data),
        backgroundColor: '#2196F3', // Azul Material Design
        borderColor: '#1E88E5',
        borderWidth: 1,
      },
      {
        label: 'Faturado',
        data: filteredData.map(d => d.nf_e_devolucao),
        backgroundColor: '#4CAF50', // Verde Material Design
        borderColor: '#43A047',
        borderWidth: 1,
      },
      {
        label: 'Pedido reprogramado',
        data: filteredData.map(d => d.pedido_reprogramado),
        backgroundColor: '#FF9800', // Laranja Material Design
        borderColor: '#FB8C00',
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          font: {
            size: 16,
            family: 'Roboto, sans-serif',
            weight: '500',
          },
          color: '#000',
        },
      },
      tooltip: {
        backgroundColor: '#333',
        titleFont: {
          size: 18,
          family: 'Roboto, sans-serif',
          weight: '600',
        },
        bodyFont: {
          size: 16,
          family: 'Roboto, sans-serif',
          weight: '400',
        },
        padding: 12,
        cornerRadius: 4,
        callbacks: {
          label: function (tooltipItem: any) {
            return `${tooltipItem.dataset.label}: R$ ${tooltipItem.raw.toLocaleString()}`;
          },
        },
      },
    },
    scales: {
      x: {
        type: 'category',
        grid: {
          display: false,
        },
        ticks: {
          font: {
            size: 12,
            family: 'Roboto, sans-serif',
          },
          color: '#000',
          maxRotation: 60,
          minRotation: 60,
        },
      },
      y: {
        type: 'logarithmic',
        beginAtZero: true,
        grid: {
          color: '#E0E0E0',
        },
        ticks: {
          callback: function(value: number) {
            return `R$ ${value.toLocaleString()}`;
          },
          font: {
            size: 12,
            family: 'Roboto, sans-serif',
          },
          color: '#000',
        },
      },
    },
  };

  return (
    <div className="w-full bg-white rounded-lg shadow-lg p-4">
      <div className="flex justify-end mb-4">
        <input
          type="date"
          name="startDate"
          value={startDate}
          onChange={handleDateChange}
          className="p-2 border border-gray-300 rounded-md mr-4"
        />
        <input
          type="date"
          name="endDate"
          value={endDate}
          onChange={handleDateChange}
          className="p-2 border border-gray-300 rounded-md"
        />
      </div>
      <div style={{ height: '600px' }}>
        <Bar data={chartData} options={chartOptions} />
      </div>
    </div>
  );
}
