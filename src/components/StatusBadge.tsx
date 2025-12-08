interface StatusBadgeProps {
  status: string;
}

export const StatusBadge = ({ status }: StatusBadgeProps) => {
  const styles: Record<string, string> = {
    ok: 'bg-green-100 text-green-800 border-green-200',
    ativo: 'bg-green-100 text-green-800 border-green-200',
    vencido: 'bg-red-100 text-red-800 border-red-200',
    inativo: 'bg-red-100 text-red-800 border-red-200',
    falha: 'bg-red-100 text-red-800 border-red-200',
    irregular: 'bg-red-100 text-red-800 border-red-200',
    proximo: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    atencao: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    manutencao: 'bg-blue-100 text-blue-800 border-blue-200'
  };
  
  return (
    <span className={`px-2 py-1 rounded text-xs font-bold border uppercase ${styles[status] || 'bg-gray-100'}`}>
      {status}
    </span>
  );
};
