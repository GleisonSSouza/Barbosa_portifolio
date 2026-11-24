/* ==========================================================================
   Configuração do painel (modo demonstração).

   Tudo o que a Laís edita no painel, e os agendamentos feitos pelo site,
   ficam salvos SÓ no navegador onde foram feitos (IndexedDB).
   Serve para apresentar; não substitui um banco de dados online.

   Login de demonstração:  usuário  lais   senha  barbosa2026
   Para trocar a senha, gere o hash de "usuario:senha" em SHA-256
   (ex.: no terminal:  printf 'lais:novasenha' | shasum -a 256)
   e cole em ADMIN.hash.
   ========================================================================== */
const CONFIG = {
  ADMIN: {
    user: 'lais',
    hash: 'e7d4ed478316a0450346b684d34faee39cf190b40c2d7c9dba178a19926495b4'
  },
  DB_NAME: 'lais-barbosa-demo',   // nome do banco local no navegador
  MAX_VIDEO_MB: 20,               // limite de vídeo nos feedbacks
  MAX_IMG_PX: 1600                // fotos enviadas são reduzidas para no máximo isso
};
