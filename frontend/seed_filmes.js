const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const envFile = fs.readFileSync('.env.production', 'utf-8');
const env = {};
envFile.split('\n').forEach(line => {
  if (line.includes('=')) {
    const [key, ...value] = line.split('=');
    env[key.trim()] = value.join('=').trim();
  }
});

const supabase = createClient(env['NEXT_PUBLIC_SUPABASE_URL'], env['NEXT_PUBLIC_SUPABASE_ANON_KEY']);

const dummyMovies = [
  { title: "O Resgate Final", desc: "Uma missão impossível que vai testar os limites da coragem humana." },
  { title: "Sombras da Noite", desc: "Um detetive investiga um mistério que transcende a realidade." },
  { title: "Além da Fronteira", desc: "Uma jornada épica de descobrimento em terras inexploradas." },
  { title: "A Última Esperança", desc: "Quando o mundo está em colapso, um grupo de heróis se levanta." },
  { title: "Velocidade Máxima", desc: "Adrenalina pura nas ruas de uma metrópole caótica." },
  { title: "O Código Secreto", desc: "Um hacker descobre uma conspiração que ameaça o governo global." },
  { title: "Amor em Paris", desc: "Um romance que desafia o tempo e o espaço na cidade luz." },
  { title: "Heróis do Passado", desc: "Guerreiros antigos despertam no mundo moderno." },
  { title: "A Caverna Perdida", desc: "Exploradores encontram um segredo guardado por milênios." },
  { title: "Voo 707", desc: "Um suspense de tirar o fôlego a 30 mil pés de altitude." },
  { title: "O Último Samurai", desc: "A saga de um guerreiro em busca de redenção." },
  { title: "Planeta Distante", desc: "A primeira missão tripulada a uma galáxia desconhecida." },
  { title: "O Ilusionista", desc: "Um mágico de rua cruza o caminho de uma perigosa máfia." },
  { title: "Lágrimas do Sol", desc: "Um drama emocionante sobre sobrevivência no deserto." },
  { title: "Operação Falcão", desc: "Forças especiais em uma missão de resgate de alto risco." },
  { title: "Enigma do Tempo", desc: "Cientistas descobrem como voltar no tempo, mas com consequências fatais." },
  { title: "O Rei da Montanha", desc: "A incrível história real de um alpinista lendário." },
  { title: "Vingança Silenciosa", desc: "Um ex-agente busca justiça com as próprias mãos." },
  { title: "Coração de Aço", desc: "A biografia inspiradora de um inventor revolucionário." },
  { title: "Fuga Prisional", desc: "A mais engenhosa fuga de prisão já orquestrada." },
  { title: "O Mistério do Oceano", desc: "Uma equipe de mergulho encontra algo assustador nas profundezas." },
  { title: "Destino Cruzado", desc: "Três histórias que se conectam de forma surpreendente." },
  { title: "A Ilha dos Esquecidos", desc: "Um náufrago tenta sobreviver em um paraíso mortal." },
  { title: "Ruptura Total", desc: "Um terremoto catastrófico muda a geografia mundial." },
  { title: "Os Invasores", desc: "A Terra enfrenta seu maior desafio com uma ameaça alienígena." },
  { title: "Noite de Terror", desc: "Adolescentes em uma cabana isolada enfrentam o desconhecido." },
  { title: "A Grande Aposta", desc: "Jogadores profissionais em um torneio de alto risco em Las Vegas." },
  { title: "Sinfonia Final", desc: "Um maestro genial e sua última e mais importante composição." }
];

const unsplashIds = [
  "1489599849927-2ee91cede3ba", "1536440136628-849c177e76a1", "1507924538820-e4481665a38b", 
  "1440404653325-ab127d49abc1", "1505686994751-f9b927ac1715", "1478720568478-8843c08cb136",
  "1448375240586-882707db888b", "1518770660439-4636190af475", "1505228395891-9a51e7e86dce",
  "1485846234645-a62644f84728", "1535016120720-40c746a6580c", "1478479405421-ce83c92fb3ba",
  "1460881682782-3e2b20fb551a", "1492684223066-81342ee5ff30", "1515630278258-407f6ce22299",
  "1494959764136-6fc9c15867f6", "1533167616982-0cc674da3862", "1497515114629-f71d768fd07c",
  "1493246507139-91e8fad9978e", "1500462918059-b1a0cb512f1d", "1495020336402-4605f75605d3",
  "1497215858022-77764f26038c", "1502134241126-9a547def0750", "1497034825429-c343d706a68f",
  "1518837695005-2083093ee354", "1503142277632-a521cedb43d4", "1497800725547-0b15b5f6368d",
  "1512404111300-3665bc7c191a"
];

async function seed() {
  console.log("Iniciando inserção de 28 filmes...");
  for (let i = 0; i < 28; i++) {
    const movie = dummyMovies[i];
    const imageId = unsplashIds[i % unsplashIds.length];
    const coverUrl = `https://images.unsplash.com/photo-${imageId}?w=400&h=600&fit=crop&q=80`;
    
    // Using a generic open-source video URL as fallback for all movies
    const videoUrl = "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8";

    const { error } = await supabase.from('filmes').insert([{
      title: movie.title,
      description: movie.desc,
      cover_url: coverUrl,
      video_url: videoUrl
    }]);

    if (error) {
      console.error(`Erro ao inserir filme ${i+1}:`, error.message);
    } else {
      console.log(`Filme ${i+1}/${28} inserido: ${movie.title}`);
    }
  }
  console.log("Processo concluído com sucesso!");
}

seed();
