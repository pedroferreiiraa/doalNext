'use client';

import { useState, useEffect } from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale } from 'chart.js';

// Registrar componentes do Chart.js
ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale);

export default function RevenueChart() {
  const [data, setData] = useState([]);
  const [showComparison, setShowComparison] = useState(false);  // Estado para mostrar/ocultar comparação

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/faturado');
        const result = await response.json();

        // Agrupar os dados por data de expedição e tipo de documento
        const groupedData = result.reduce((acc, curr) => {
          const date = curr['Data de expedição'];
          const tipoDoc = curr['Tipo de doc.'];

          if (!acc[date]) {
            acc[date] = {
              date: date,
              pedidos: 0,
              nf: 0,
            };
          }

          if (tipoDoc === 'Pedidos') {
            acc[date].pedidos += curr['Total Valor'];
          } else if (tipoDoc === 'NF') {
            acc[date].nf += curr['Total Valor'];
          }

          return acc;
        }, {});

        // Transformar o objeto agrupado em um array para usar no gráfico
        const formattedData = Object.values(groupedData);
        setData(formattedData);
        
      } catch (error) {
        console.error('Erro:', error);
      }
    };

    fetchData();
  }, []);

  // Preparar os dados para o gráfico
  const chartData = {
    labels: data.map(d => d.date),
    datasets: [
      {
        label: 'Pedidos',
        data: data.map(d => d.pedidos),
        backgroundColor: 'rgba(255, 162, 235, 0.6)', // Cor azul clara
        borderColor: 'rgba(255, 162, 235, 1)', // Cor azul
        borderWidth: 1,
      },
      {
        label: 'NF',
        data: data.map(d => d.nf),
        backgroundColor: 'rgba(75, 192, 192, 0.6)', // Cor verde clara
        borderColor: 'rgba(75, 192, 192, 1)', // Cor verde
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
      },
      tooltip: {
        callbacks: {
          label: function(tooltipItem) {
            return `${tooltipItem.dataset.label}: R$ ${tooltipItem.raw.toLocaleString()}`;
          },
        },
      },
    },
    scales: {
      x: {
        stacked: true,
      },
      y: {
        stacked: true,
        beginAtZero: true,
        ticks: {
          callback: function(value) {
            return `R$ ${value.toLocaleString()}`;
          },
        },
      },
    },
  };

  return (
    <>
      <div className="w-full h-80 p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Valor Total por Dia - Pedidos e NF
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Visualização do valor total dos pedidos e NF realizados em cada dia.
        </p>
        <Bar data={chartData} options={chartOptions} />
      </div>
    </>
  );
}
