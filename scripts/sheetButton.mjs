import { requestHackStartWithConfig } from "./requests.mjs";

function getRootElement(app, html) {
	if (app?.element) {
		// app.element may be a jQuery object in AppV1
		if (app.element instanceof HTMLElement) return app.element;
		if (app.element?.[0] instanceof HTMLElement) return app.element[0];
	}
	if (html instanceof HTMLElement) return html;
	if (html?.[0] instanceof HTMLElement) return html[0];
	return null;
}

export function registerSheetButton() {
	Hooks.on("renderActorSheet", (app, html) => {
		try {
			if (!game.user.isGM) return;
			const actor = app?.actor;
			if (!actor) return;
			// "Ficha do jogador" no Fallout normalmente é Actor type "character".
			if (actor.type && actor.type !== "character") return;

			const root = getRootElement(app, html);
			if (!root) return;
			const header = root.querySelector("header.window-header");
			if (!header) return;
			if (header.querySelector(".fallout-terminal-btn")) return;

			const button = document.createElement("a");
			button.classList.add("header-button", "fallout-terminal-btn");
			button.innerHTML = `<i class="fas fa-terminal"></i> Solicitar Hack`;
			button.addEventListener("click", ev => {
				ev.preventDefault();
				openGmRequestDialog(actor);
			});

			header.appendChild(button);
		}
		catch (err) {
			console.error("fallout-terminal | failed to add sheet button", err);
		}
	});
}

function openGmRequestDialog(actor) {
	const activePlayers = (game.users?.contents ?? []).filter(u => u.active && !u.isGM);
	const allPlayers = (game.users?.contents ?? []).filter(u => !u.isGM);
	const players = activePlayers.length ? activePlayers : allPlayers;

	if (players.length === 0) {
		ui.notifications?.warn("Nenhum jogador (não-GM) encontrado.");
		return;
	}

	const journals = game.journal?.contents ?? [];
	if (journals.length === 0) {
		ui.notifications?.warn("Nenhum JournalEntry encontrado no mundo.");
		return;
	}

	const playerOptions = players
		.slice()
		.sort((a, b) => (a.name ?? "").localeCompare(b.name ?? ""))
		.map(u => `<option value="${u.id}">${foundry.utils.escapeHTML(u.name)}</option>`)
		.join("\n");

	const journalOptions = journals
		.slice()
		.sort((a, b) => (a.name ?? "").localeCompare(b.name ?? ""))
		.map(j => `<option value="${j.uuid}">${foundry.utils.escapeHTML(j.name)}</option>`)
		.join("\n");

	Dialog.prompt({
		title: "Solicitar Hack",
		content: `
			<form class="flexcol">
				<div class="form-group">
					<label>Jogador</label>
					<select name="targetUserId">${playerOptions}</select>
				</div>
				<div class="form-group">
					<label>Nota (JournalEntry) para liberar ao sucesso</label>
					<select name="targetUuid">${journalOptions}</select>
				</div>
				<hr/>
				<div class="form-group">
					<label>Tentativas (tries)</label>
					<input type="number" name="tries" value="5" min="1" max="9" step="1"/>
				</div>
				<div class="form-group">
					<label>Tamanho da palavra</label>
					<select name="wordLength">
						<option value="5">5</option>
						<option value="6">6</option>
						<option value="7" selected>7</option>
						<option value="8">8</option>
					</select>
				</div>
				<div class="form-group">
					<label>Número de palavras</label>
					<input type="number" name="wordCount" value="12" min="6" max="20" step="1"/>
				</div>
				<div class="form-group">
					<label>Máximo de "ALLOWANCE REPLENISHED"</label>
					<input type="number" name="maxReplenishes" value="1" min="0" max="9" step="1"/>
				</div>
			</form>
		`,
		label: "Enviar",
		callback: html => {
			const targetUserId = html.find("select[name='targetUserId']").val();
			const targetUuid = html.find("select[name='targetUuid']").val();
			if (!targetUserId || !targetUuid) return;
			const tries = parseInt(html.find("input[name='tries']").val(), 10);
			const wordLength = parseInt(html.find("select[name='wordLength']").val(), 10);
			const wordCount = parseInt(html.find("input[name='wordCount']").val(), 10);
			const maxReplenishes = parseInt(html.find("input[name='maxReplenishes']").val(), 10);

			requestHackStartWithConfig({
				targetUserId,
				targetUuid,
				actorName: actor?.name ?? "Terminal",
				config: {
					tries: Number.isFinite(tries) ? tries : 5,
					wordLength: Number.isFinite(wordLength) ? wordLength : 7,
					wordCount: Number.isFinite(wordCount) ? wordCount : 12,
					maxReplenishes: Number.isFinite(maxReplenishes) ? maxReplenishes : 1,
				},
			});
			ui.notifications?.info("Solicitação de hack enviada ao jogador.");
		},
	});
}

