'use client';

import React, { useEffect, useState } from 'react';

interface SalesData {
  docdate: string;
  total_doal: number;
  total_licitacao: number;
  Representantes: number;
  totalPedidos: number;
  acumulado: number;
  metaMensal: number;
  valor: number;
}

const SalesAnalysis: React.FC = () => {
  const [data, setData] = useState<SalesData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<{ message: string; date: string; metaMensal: number; diasUteis: string } | null>(null);
  const [metaMensal, setMetaMensal] = useState(3500000);
  const [metaMensalPadrao, setUserMetaMensal] = useState<number>(3500000);

  const [diasUteis, setDiasUteis] = useState<string>('22');
  const [date, setDate] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [displayDate, setDisplayDate] = useState<string>(() => {
    const today = new Date();
    return today.toLocaleDateString('pt-BR');
  });

  const fetchData = async (date: string) => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:8003/api/pedidos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ date }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao buscar dados');
      }
      const result: SalesData[] = await response.json();
      setData(result);
    } catch (err) {
      if (err instanceof Error) {
        setError({ message: err.message, date, metaMensal, diasUteis });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(date);
  }, []);

  useEffect(() => {
    if (date && metaMensal && diasUteis) {
      fetchData(date);
    }
  }, [date]);

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value.replace(/\D/g, '');
    if (inputValue.length <= 8) {
      const day = inputValue.substring(0, 2);
      const month = inputValue.substring(2, 4);
      const year = inputValue.substring(4, 8);
      let formattedDate = '';
      if (day) {
        formattedDate += day;
      }
      if (month) {
        formattedDate += '/' + month;
      }
      if (year) {
        formattedDate += '/' + year;
      }
      setDisplayDate(formattedDate);
      if (inputValue.length === 8) {
        const localDate = new Date(`${year}-${month}-${day}T00:00:00`);
        localDate.setMinutes(localDate.getMinutes() + localDate.getTimezoneOffset());
        setDate(localDate.toISOString().split('T')[0]);
      }
    }
  };

  const formatarValorEmReais = (valor: number | undefined) => {
    if (typeof valor === 'number') {
      return `R$ ${parseFloat(valor.toString()).toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
    } else {
      return 'R$ 0,00';
    }
  };
  
  const handleMetaMensalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valor = e.target.value;
    setMetaMensal(parseFloat(valor));
  };

  const handleDiasUteisChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDiasUteis(e.target.value);
  };

  const handleBlur = () => {
    if (date && metaMensal && diasUteis) {
      fetchData(date);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  const formatarData = (dataISO: string) => {
    const data = new Date(dataISO);
        
    // Ajusta a data para o fuso horário local
    const localDate = new Date(data.getTime() + (data.getTimezoneOffset() * 60000));
    
    return localDate.toLocaleDateString('pt-BR'); // Formato: DD/MM/AAAA
  };

  const metaDiariaDoal = (metaMensal) / parseFloat(diasUteis) * 0.6;
  const metaDiariaLicitacao = (metaMensal) / parseFloat(diasUteis) * 0.3;
  const metaDiariaRepresentantes = (metaMensal) / parseFloat(diasUteis) * 0.1;
  const metaDiariaTotal = (metaMensal) / parseFloat(diasUteis);

  return (
    <div>
            <div className="grid grid-cols-6 font-mono">
            <div className="mb-4">
                <label htmlFor="data" className="block text-sm font-medium text-gray-700">
                Data:
                </label>
                <input
                type="text"
                id="data"
                value={displayDate}
                onChange={handleDateChange}
                placeholder="dd/mm/aaaa"
                className="mt-1 block w-32 border border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200"
                />
            </div>
            <div className="mb-4">
                <label htmlFor="metaMensal" className="block text-sm font-medium text-gray-700">
                Meta Mensal:
                </label>
                <input
                type="number"
                id="metaMensal"
                placeholder='R$ 3.500.000,00'
                onChange={handleMetaMensalChange}
                className="mt-1 block w-36 border border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200"
                />
            </div>
            <div className="mb-4">
                <label htmlFor="diasUteis" className="block text-sm font-medium text-gray-700">
                Dias Úteis:
                </label>
                <input
                type="text"
                id="diasUteis"
                value={diasUteis}
                onChange={handleDiasUteisChange}
                className="mt-1 block w-20 border border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200"
                />
            </div>
            </div>
           

      <table className="min-w-full bg-white border border-gray-300 mb-5 font-mono">
        <thead> 
            <tr className="bg-blue-600 text-gray-100">
            <th className=" px-4 border-b"></th>
            <th className=" px-4 border-b">DOAL</th>
            <th className=" px-4 border-b">LICITAÇÃO</th>
            <th className=" px-4 border-b">REPRENSENTANTES</th>
            <th className=" px-4 border-b">TOTAL</th>
            <th className=" px-4 border-b">ACUMULADO</th>
            </tr>
            <tr className="bg-gray-100 text-gray-800">
            <th>Data</th>
            <th className=" px-4 border-b">Meta: R$ {metaDiariaDoal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</th>
            <th className=" px-4 border-b">Meta: R$ {metaDiariaLicitacao.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</th>
            <th className=" px-4 border-b">Meta: R$ {metaDiariaRepresentantes.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</th>
            <th className=" px-4 border-b">Meta: R$ {metaDiariaTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</th>
            <th className=" px-4 border-b">Meta: R$ {metaMensal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</th>
            </tr>
        </thead>
        <tbody className='text-center'>
            {data.map((item, index) => {
            const totalDoal = item.total_doal;
            const totalLicitacao = item.total_licitacao;
            const totalRepresentantes = item.Representantes;
            const totalPedidos = totalDoal + totalLicitacao + totalRepresentantes;

            return (
                <tr key={index} className="hover:bg-gray-50">
                <td className=" px-4 border-b">{formatarData(item.docdate)}</td>
                <td className={` px-4 border-b ${totalDoal >= metaDiariaDoal ? 'text-green-600' : 'text-red-600'}`}>
                    R$ {totalDoal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </td>
                <td className={` px-4 border-b ${totalLicitacao >= metaDiariaLicitacao ? 'text-green-600' : 'text-red-600'}`}>
                    R$ {totalLicitacao.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </td>
                <td className={` px-4 border-b ${totalRepresentantes >= metaDiariaRepresentantes ? 'text-green-600' : 'text-red-600'}`}>
                    R$ {totalRepresentantes.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
                <td className={` px-4 border-b ${totalPedidos >= metaDiariaTotal ? 'text-green-600' : 'text-red-600'}`}>
                    R$ {totalPedidos.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </td>
                <td className={` px-4 border-b ${item.acumulado > metaMensal ? 'text-green-600' : 'text-red-600'}`}>
                    R$ {item.acumulado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </td>
                </tr>
            );
            })}
        </tbody>
        </table>
    </div>
  );
};

export default SalesAnalysis;