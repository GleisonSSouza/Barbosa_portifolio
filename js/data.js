/* ==========================================================================
   Conteúdo padrão do site. Aparece enquanto a Laís não salvar nada no painel.
   Itens com id curto (d1, c1, f1, b1) são exemplos: ao salvar pelo painel,
   viram itens de verdade no banco.
   ========================================================================== */
const HERO = 'assets/img/lais.webp';

const DEF = {
  cfg: {
    name: 'Laís Barbosa',
    tag: 'Realçar o seu olhar é devolver a você a sua melhor versão.',
    bio: 'Sou Laís Barbosa, especialista em extensão de cílios, empreendedora e apaixonada pelo universo da beleza. Meu propósito é realçar a autoestima das mulheres, oferecendo procedimentos de qualidade e compartilhando meus conhecimentos por meio de cursos e capacitações. Acredito no poder da beleza para transformar vidas e ajudar mulheres a conquistarem confiança, independência e novas oportunidades.',
    wa: '5575999999999',
    ig: '@laisbarbosadesigner',
    addr: 'Jaguaquara, BA',
    img: HERO,
    open: '09:00', close: '18:00',      // expediente
    bs: '12:00', be: '13:00',           // intervalo
    days: [2, 3, 4, 5, 6],              // 0 = domingo
    blocked: '',                        // datas sem atendimento, separadas por vírgula
    openMonths: [],                     // meses abertos para agendar, ex.: ['2026-12']
    pf: '', pt: '',                     // período exclusivo para clientes fixas
    phones: '',                         // telefones das clientes fixas
    cats: ['Design de Sobrancelhas', 'Brow Lamination', 'Extensão de Cílios', 'Epilação', 'Micropigmentação']   // ordem no site
  },

  // dur = minutos que o horário ocupa na agenda; durTxt = duração mostrada no site
  services: [
    { id: 'd1', cat: 'Design de Sobrancelhas', name: 'Design Personalizado sem henna', desc: '', price: 40, dur: 40, durTxt: '30 a 40 min', img: 'assets/img/servicos/design-sem-henna.webp', on: true },
    { id: 'd2', cat: 'Design de Sobrancelhas', name: 'Design Personalizado com henna', desc: '', price: 55, dur: 60, durTxt: '45 min a 1h', img: 'assets/img/servicos/design-com-henna.webp', on: true },
    { id: 'd3', cat: 'Brow Lamination', name: 'Brow Lamination sem tintura', desc: '', price: 140, dur: 80, durTxt: '1h a 1h20', img: 'assets/img/servicos/lamination-sem.webp', on: true },
    { id: 'd4', cat: 'Brow Lamination', name: 'Brow Lamination com tintura', desc: '', price: 155, dur: 90, durTxt: '1h15 a 1h30', img: 'assets/img/servicos/lamination-com.webp', on: true },
    { id: 'd5', cat: 'Extensão de Cílios', name: 'Volume Egípcio 5D', desc: 'Manutenção R$ 95 após 20 dias.', price: 150, dur: 90, durTxt: '1h30', img: 'assets/img/servicos/volume-egipcio.webp', on: true },
    { id: 'd6', cat: 'Extensão de Cílios', name: 'Volume Egípcio 5D marrom', desc: 'Manutenção R$ 95 após 20 dias.', price: 150, dur: 90, durTxt: '1h30', img: 'assets/img/servicos/volume-marrom.webp', on: true },
    { id: 'd7', cat: 'Extensão de Cílios', name: 'Volume Fio U', desc: 'Manutenção R$ 95 após 20 dias.', price: 150, dur: 90, durTxt: '1h30', img: 'assets/img/servicos/volume-fio-u.webp', on: true },
    { id: 'd8', cat: 'Extensão de Cílios', name: 'Volume Gringo', desc: 'Manutenção R$ 99 após 20 dias.', price: 170, dur: 90, durTxt: '1h30', img: 'assets/img/servicos/volume-gringo.webp', on: true },
    { id: 'd9', cat: 'Extensão de Cílios', name: 'Fox', desc: 'Manutenção R$ 99 após 20 dias.', price: 180, dur: 120, durTxt: '1h40 a 2h', img: 'assets/img/servicos/fox.webp', on: true },
    { id: 'd10', cat: 'Extensão de Cílios', name: 'Efeito Delineado', desc: 'Manutenção R$ 99 após 20 dias.', price: 180, dur: 120, durTxt: 'a confirmar', img: 'assets/img/servicos/efeito-delineado.webp', on: true },
    { id: 'd11', cat: 'Extensão de Cílios', name: 'Califórnia', desc: 'Técnica tendência natural. Sem manutenção: a durabilidade varia com o ciclo dos fios e os cuidados posteriores.', price: 200, dur: 120, durTxt: '2h', img: 'assets/img/servicos/california.webp', on: true },
    { id: 'd12', cat: 'Extensão de Cílios', name: 'Hiper Fox', desc: 'Técnica tendência natural (visagismo e naturalidade).', price: 200, dur: 120, durTxt: '2h', img: 'assets/img/servicos/hiper-fox.webp', on: true },
    { id: 'd13', cat: 'Epilação', name: 'Buço e queixo (linha)', desc: 'Finaliza com um produto para acalmar a pele.', price: 20, dur: 30, durTxt: 'a confirmar', img: 'assets/img/servicos/buco-queixo.webp', on: true },
    { id: 'd14', cat: 'Epilação', name: 'Epilação facial', desc: 'Finaliza com um produto para acalmar a pele.', price: 35, dur: 30, durTxt: 'a confirmar', img: 'assets/img/servicos/epilacao-facial.webp', on: true },
    { id: 'd15', cat: 'Micropigmentação', name: 'Micropigmentação Shadow', desc: 'Retoque após 45 dias.', price: 450, dur: 120, durTxt: 'a confirmar', img: 'assets/img/servicos/micropigmentacao.webp', on: true }
  ],

  courses: [
    {
      id: 'c1', name: 'Design Personalizado',
      desc: 'Curso de sobrancelhas com teoria e prática. Não precisa ter experiência.',
      prog: 'Visagismo e mapeamento\nDesign com pinça e linha\nHenna\nCertificado e kit iniciante',
      mode: 'Presencial', dur: '1 dia, 8 horas', price: 600,
      pay: 'PIX ou cartão', info: '',
      img: '', on: true, excl: false
    },
    {
      id: 'c2', name: 'Curso de Cílios',
      desc: 'Curso presencial de cílios em dois dias de imersão.',
      prog: '', mode: 'Presencial', dur: '2 dias, 16 horas', price: '',
      pay: '', info: 'Fale pelo WhatsApp para saber valores e próximas turmas.',
      img: '', on: true, excl: false
    }
  ],

  feedbacks: [
    { id: 'f1', handle: '@cliente_exemplo', role: 'Cliente', text: 'Amei o resultado! Super recomendo.', av: '', media: '', mt: '', on: true },
    { id: 'f2', handle: '@aluna_exemplo', role: 'Aluna do curso', text: 'O curso mudou a minha carreira.', av: '', media: '', mt: '', on: true },
    { id: 'f3', handle: '@cliente_exemplo2', role: 'Cliente', text: 'Atendimento impecável, voltarei sempre.', av: '', media: '', mt: '', on: true }
  ],

  banners: [
    { id: 'b1', title: 'Agenda de Dezembro', text: 'Neste mês, nossas clientes fixas terão prioridade na abertura da agenda. Fique atenta às datas de agendamento!', img: '', link: '', from: '', to: '', hi: true, on: true, prio: 1 }
  ]
};

const isExample = id => /^[bcdf]\d+$/.test(id);

/* estado da página */
const S = {
  cfg: { ...DEF.cfg },
  services: DEF.services,
  courses: DEF.courses,
  banners: DEF.banners,
  feedbacks: DEF.feedbacks,
  slots: new Set(),   // horários ocupados (id "data_hora")
  slotSt: {},         // situação de cada horário: 'pre' (pré-agendado) ou 'ok'
  bookings: [],       // só carregado com a Laís logada
  open: 0,            // curso aberto na sanfona
  tab: 'dash',        // aba do painel
  cv: 'month',        // visão do calendário: month | week | day
  cd: today(),        // dia em foco no calendário
  force: false,       // força redesenhar formulários do painel
  edit: null,         // item aberto para edição no painel ('new' = novo)
  dirty: false,       // o formulário aberto tem alterações não salvas
  flash: ''           // aviso rápido no painel ("Serviço criado.")
};
