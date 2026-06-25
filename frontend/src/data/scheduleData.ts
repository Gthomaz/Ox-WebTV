export interface Program {
  id: string;
  title: string;
  startTime: string; // formato "HH:mm"
  endTime: string;   // formato "HH:mm"
  description: string;
  days: number[]; // 0 = Domingo, 1 = Segunda ... 6 = Sábado
}

export const scheduleData: Program[] = [
  { 
    id: '1', 
    title: 'Manhã OX', 
    startTime: '06:00', 
    endTime: '09:00', 
    description: 'Inicie seu dia com as melhores energias e muita informação.',
    days: [1, 2, 3, 4, 5] 
  },
  { 
    id: '2', 
    title: 'Notícias da Região', 
    startTime: '09:00', 
    endTime: '12:00', 
    description: 'Fique por dentro das atualidades de Quissamã e arredores.',
    days: [1, 2, 3, 4, 5] 
  },
  { 
    id: '3', 
    title: 'Esporte Total', 
    startTime: '12:00', 
    endTime: '13:00', 
    description: 'O melhor do esporte local e nacional.',
    days: [1, 2, 3, 4, 5] 
  },
  { 
    id: '4', 
    title: 'Tarde de Entretenimento', 
    startTime: '13:00', 
    endTime: '17:00', 
    description: 'Programação diversificada com filmes, séries e muita música.',
    days: [1, 2, 3, 4, 5] 
  },
  { 
    id: '5', 
    title: 'Jornal OX', 
    startTime: '17:00', 
    endTime: '19:00', 
    description: 'As notícias mais impactantes do seu final de tarde.',
    days: [1, 2, 3, 4, 5] 
  },
  { 
    id: '6', 
    title: 'Sessão Pipoca', 
    startTime: '19:00', 
    endTime: '22:00', 
    description: 'Os melhores filmes para acompanhar com a família.',
    days: [1, 2, 3, 4, 5] 
  },
  { 
    id: '7', 
    title: 'OX Night Show', 
    startTime: '22:00', 
    endTime: '23:59', 
    description: 'Talk show com entrevistas e conteúdos exclusivos.',
    days: [1, 2, 3, 4, 5] 
  },
  { 
    id: '8', 
    title: 'Madrugada OX', 
    startTime: '00:00', 
    endTime: '06:00', 
    description: 'Reprises e seleções musicais imperdíveis.',
    days: [0, 1, 2, 3, 4, 5, 6] 
  },
];
