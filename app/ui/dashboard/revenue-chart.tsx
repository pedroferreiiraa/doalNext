'use client'

import { useState, useEffect, ChangeEvent } from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale, LogarithmicScale, LinearScaleOptions, LineElement} from 'chart.js';

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale, LogarithmicScale, );

interface DataItem {
  'Tipo de doc.': string;
  'Data de expedição': string;
  'Total Valor': number;
}

interface GroupedData {
  date: string;
  pedidos: number;
  nf: number;
  devolucao: number;
}

export default function RevenueChart() {
  const [data, setData] = useState<GroupedData[]>([]);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const handleDateChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
  
    // Validação simples para garantir que o valor esteja no formato correto
    const isValidDate = /^\d{4}-\d{2}-\d{2}$/.test(value);
    if (!isValidDate) {
      console.error("Data inválida fornecida:", value);
      return;
    }
  
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

      const response = await fetch(`http://localhost:3001/api/faturado?startDate=${startDate}&endDate=${endDate}`);
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
            devolucao: 0,
          };
        }

        if (tipoDoc === 'Pedidos') {
          acc[date].pedidos += curr['Total Valor'];
        } else if (tipoDoc === 'NF') {
          acc[date].nf += curr['Total Valor'];
        } else if (tipoDoc === 'Devolução') {
          acc[date].devolucao += curr['Total Valor'];
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
    const [dayA, monthA, yearA] = a.date.split('/').map(Number);
    const [dayB, monthB, yearB] = b.date.split('/').map(Number);
    return new Date(yearA, monthA - 1, dayA).getTime() - new Date(yearB, monthB - 1, dayB).getTime();
  });

  // Filtrar dados, removendo dias sem valores de 'Pedidos', 'NF' e 'Devolução'
  const filteredData = sortedData.filter(d => d.pedidos > 0 || d.nf > 0 || d.devolucao > 0);

  // Preparar os dados para o gráfico
  const chartData = {
    labels: filteredData.map(d => d.date),
    datasets: [
      {
        label: 'Pedidos',
        data: filteredData.map(d => d.pedidos),
        backgroundColor: '#1E90FF', // Azul vibrante
        borderColor: '#1E90FF',
        borderWidth: 1,
      },
      {
        label: 'NF', // Corrigido para NF ao invés de "Expedido"
        data: filteredData.map(d => d.nf),
        backgroundColor: '#00FF00', // Verde vibrante
        borderColor: '#00FF00',
        borderWidth: 1,
      },
      {
        label: 'Devolução',
        data: filteredData.map(d => d.devolucao),
        backgroundColor: '#FF0000', // Vermelho vibrante
        borderColor: '#FF0000',
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
          color: '#4B5563',
        },
      },
      tooltip: {
        backgroundColor: '#1F2937',
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
        padding: 16,
        cornerRadius: 8,
        callbacks: {
          label: function (tooltipItem: any) {
            return `${tooltipItem.dataset.label}: R$ ${tooltipItem.raw.toLocaleString()}`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          font: {
            size: 12,
            family: 'Roboto, sans-serif',
          },
          color: '#6B7280',
          maxRotation: 60,
          minRotation: 60,
        },
      },
      y: {
        type: 'logarithmic', // Escala logarítmica
        beginAtZero: true,
        grid: {
          color: '#E5E7EB',
        },
        ticks: {
          callback: function(value: number) {
            return `R$ ${value.toLocaleString()}`;
          },
          font: {
            size: 12,
            family: 'Roboto, sans-serif',
          },
          color: '#6B7280',
          padding: 0,
        },
      },
    },
  };

  return (
    <div className="w-full bg-white rounded-lg shadow-md">
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
