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
    cats: []                            // categorias dos serviços, na ordem do site
  },

  services: [
    { id: 'd1', name: 'Design de sobrancelhas', desc: 'Mapeamento facial e design personalizado.', price: 60, dur: 60, img: '', on: true },
    { id: 'd2', name: 'Design com henna', desc: 'Design com henna para preenchimento natural.', price: 80, dur: 90, img: '', on: true },
    { id: 'd3', name: 'Brow lamination', desc: 'Fios alinhados e efeito volumoso.', price: 150, dur: 90, img: '', on: true }
  ],

  courses: [
    { id: 'c1', name: 'Design Profissional', desc: 'Do mapeamento à finalização.', prog: 'Visagismo\nMapeamento\nTécnicas de design', mode: 'Presencial', dur: '16h', price: 1200, pay: 'Pix ou até 6x no cartão', info: 'Vagas limitadas. Fale pelo WhatsApp.', img: '', on: true, excl: false },
    { id: 'c2', name: 'Henna Avançada', desc: 'Colorimetria e fixação.', prog: 'Colorimetria\nAplicação', mode: 'Presencial', dur: '8h', price: 700, pay: 'Pix ou cartão', info: 'Turmas mensais.', img: '', on: true, excl: true },
    { id: 'c3', name: 'Lamination Pro', desc: 'Técnica completa.', prog: 'Preparo\nLaminação', mode: 'Online', dur: '6h', price: 500, pay: 'Pix ou cartão', info: 'Acesso por 12 meses.', img: '', on: true, excl: false }
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

const isExample = id => /^[bcdf]\d$/.test(id);

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
