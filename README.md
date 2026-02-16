# Fallout Terminal Hacking (Foundry VTT)

Módulo para Foundry VTT (v13) que permite o GM solicitar um mini game de hack de terminal (estilo Fallout) para um jogador específico.

Ao vencer, o jogador ganha permissão de leitura (OBSERVADOR) em um JournalEntry escolhido pelo GM. Ao falhar (lockout), o acesso é removido (NONE).

## Como usar (MVP)

1. Instale como módulo local (pasta `fallout-terminal` dentro de `Data/modules`).
2. Ative o módulo no mundo.
3. Como GM, abra a ficha de um personagem (Actor type `character`) e clique em **Solicitar Hack**.
4. Selecione o **Jogador** e a **Nota (JournalEntry)** que será liberada ao sucesso e clique em **Enviar**.
5. O Foundry abrirá automaticamente o minigame no cliente do jogador selecionado.

## Notas

- O desbloqueio/travamento é feito via `game.socket` e executado pelo GM primário.
- O botão só aparece para o GM.
