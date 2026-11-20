/* ==========================================================================
   Conteúdo do site. Para mudar textos, preços, horários ou contatos,
   edite só este arquivo.
   ========================================================================== */
window.SITE_DATA = {
  cfg: {
    name: 'Laís Barbosa',
    tag: 'Realçar o seu olhar é devolver a você a sua melhor versão.',
    bio: 'Sou Laís Barbosa, especialista em extensão de cílios, empreendedora e apaixonada pelo universo da beleza. Meu propósito é realçar a autoestima das mulheres, oferecendo procedimentos de qualidade e compartilhando meus conhecimentos por meio de cursos e capacitações. Acredito no poder da beleza para transformar vidas e ajudar mulheres a conquistarem confiança, independência e novas oportunidades.',
    wa: '5571999999999',            // WhatsApp com DDI + DDD (número provisório)
    ig: '@laisbarbosadesigner',
    addr: 'Itaparica, BA',
    // agenda: dias da semana (0 = domingo), horário de abertura e fechamento, pausa do almoço
    open: '09:00', close: '18:00', days: [2, 3, 4, 5, 6], bs: '12:00', be: '13:00'
  },

  services: [
    { id: 'd1', name: 'Design de sobrancelhas', desc: 'Mapeamento facial e design personalizado.', price: 60, dur: 60 },
    { id: 'd2', name: 'Design com henna', desc: 'Design com henna para preenchimento natural.', price: 80, dur: 90 },
    { id: 'd3', name: 'Brow lamination', desc: 'Fios alinhados e efeito volumoso.', price: 150, dur: 90 }
  ],

  courses: [
    { id: 'c1', name: 'Design Profissional', desc: 'Do mapeamento à finalização.', prog: ['Visagismo', 'Mapeamento', 'Técnicas de design'], mode: 'Presencial', dur: '16h', price: 1200, pay: 'Pix ou até 6x no cartão', info: 'Vagas limitadas. Fale pelo WhatsApp.', excl: false },
    { id: 'c2', name: 'Henna Avançada', desc: 'Colorimetria e fixação.', prog: ['Colorimetria', 'Aplicação'], mode: 'Presencial', dur: '8h', price: 700, pay: 'Pix ou cartão', info: 'Turmas mensais.', excl: true },
    { id: 'c3', name: 'Lamination Pro', desc: 'Técnica completa.', prog: ['Preparo', 'Laminação'], mode: 'Online', dur: '6h', price: 500, pay: 'Pix ou cartão', info: 'Acesso por 12 meses.', excl: false }
  ],

  // EXEMPLOS PROVISÓRIOS: trocar pelos depoimentos reais das clientes (com autorização) antes de publicar.
  reviews: [
    { name: 'Ana Paula S.', what: 'Design com henna', text: 'Saí com a sobrancelha que eu sempre quis e ninguém acreditou que era henna. A Laís explica cada passo antes de começar.' },
    { name: 'Juliana M.', what: 'Brow lamination', text: 'Meus fios eram rebeldes e hoje acordo com a sobrancelha pronta. Atendimento pontual e muito caprichado.' },
    { name: 'Débora L.', what: 'Design de sobrancelhas', text: 'Tenho o rosto assimétrico e ela acertou de primeira com o mapeamento. Virei cliente fixa.' },
    { name: 'Camila R.', what: 'Curso Design Profissional', text: 'Fiz o curso sem nunca ter pegado numa pinça. A Laís tem paciência e mostra tudo na prática, com modelo.' },
    { name: 'Rafaela T.', what: 'Curso Henna Avançada', text: 'A parte de colorimetria mudou meu trabalho. Hoje acerto o tom da henna em qualquer cor de pele.' }
  ],

  banner: {
    title: 'Agenda de dezembro',
    text: 'Neste mês, as clientes fixas têm prioridade na abertura da agenda. Fique de olho nas datas de agendamento.'
  }
};
