import { MODULE_ID, OWNERSHIP } from "./constants.mjs";
import { requestOwnershipChange } from "./requests.mjs";
import { generateMemoryDump, renderMemoryDump } from "./memdump.mjs";
import { likeness, pickWords } from "./words.mjs";

export class TerminalHackingApp extends Application {
	constructor({ actorName, targetUuid, config }, options = {}) {
		super(options);
		this.actorName = actorName ?? "Terminal";
		this.targetUuid = targetUuid ?? null;
		this.userId = game.user.id;
		const tries = Math.max(1, Math.min(9, parseInt(config?.tries ?? 5, 10) || 5));
		this.attemptsMax = tries;
		this.attemptsLeft = this.attemptsMax;
		this.wordLength = Math.max(5, Math.min(8, parseInt(config?.wordLength ?? 7, 10) || 7));
		this.wordCount = Math.max(6, Math.min(20, parseInt(config?.wordCount ?? 12, 10) || 12));
		this.maxReplenishes = Math.max(0, Math.min(9, parseInt(config?.maxReplenishes ?? 1, 10) || 1));
		this.replenishesUsed = 0;
		this.words = pickWords({ length: this.wordLength, count: this.wordCount });
		this.password = this.words[Math.floor(Math.random() * this.words.length)];
		this.log = [];
		this.resolved = false;
		this.disabledTokenIds = new Set();
		this.selectedTokenIndex = 0;
		const lineLength = Math.max(12, this.wordLength + 4);
		this.memdump = generateMemoryDump({
			words: this.words,
			rowsPerColumn: 16,
			lineLength,
			baseAddress: 0xF688,
			bracketCount: 10,
		});
		this.log.unshift({ text: "WELCOME." });
	}

	static get defaultOptions() {
		return foundry.utils.mergeObject(super.defaultOptions, {
			id: "fallout-terminal-hacking",
			title: "Terminal Hacking",
			template: `modules/${MODULE_ID}/templates/terminal-hacking.hbs`,
			width: 520,
			height: "auto",
			resizable: true,
			classes: ["fallout-terminal"],
		});
	}

	getData(options = {}) {
		const rendered = renderMemoryDump({
			memdump: this.memdump,
			disabledTokenIds: this.disabledTokenIds,
		});
		return {
			actorName: this.actorName,
			attemptsLeft: this.attemptsLeft,
			attemptsMax: this.attemptsMax,
			attemptBlocks: Array.from({ length: this.attemptsMax }, (_, i) => i < this.attemptsLeft),
			leftLines: rendered.left,
			rightLines: rendered.right,
			log: this.log,
			resolved: this.resolved,
			hasTarget: !!this.targetUuid,
			tokenOrder: this.memdump.tokenOrder,
		};
	}

	activateListeners(html) {
		super.activateListeners(html);
		const root = html.find(".ft-terminal");
		root.attr("tabindex", "0");
		setTimeout(() => root[0]?.focus(), 0);

		html.find(".ft-token").on("mouseenter", ev => {
			const tokenId = ev.currentTarget?.dataset?.tokenId;
			if (!tokenId) return;
			const idx = this.memdump.tokenOrder.indexOf(tokenId);
			if (idx >= 0) {
				this.selectedTokenIndex = idx;
				this._syncSelection();
			}
		});

		html.find(".ft-token").on("click", ev => {
			ev.preventDefault();
			const tokenId = ev.currentTarget?.dataset?.tokenId;
			const tokenType = ev.currentTarget?.dataset?.tokenType;
			if (!tokenId || !tokenType) return;
			this._onTokenSelect({ tokenId, tokenType });
		});

		root.on("keydown", ev => {
			this._onKeyDown(ev);
		});

		this._syncSelection();
	}

	_onKeyDown(ev) {
		if (this.resolved) {
			if (ev.key === "Escape") this.close();
			return;
		}

		const max = this.memdump.tokenOrder.length;
		if (!max) return;

		if (ev.key === "ArrowDown" || ev.key === "ArrowRight") {
			ev.preventDefault();
			this.selectedTokenIndex = (this.selectedTokenIndex + 1) % max;
			this._syncSelection();
			return;
		}
		if (ev.key === "ArrowUp" || ev.key === "ArrowLeft") {
			ev.preventDefault();
			this.selectedTokenIndex = (this.selectedTokenIndex - 1 + max) % max;
			this._syncSelection();
			return;
		}
		if (ev.key === "Enter" || ev.key === " ") {
			ev.preventDefault();
			const tokenId = this.memdump.tokenOrder[this.selectedTokenIndex];
			const el = this.element?.find(`.ft-token[data-token-id='${tokenId}']`)?.[0];
			const tokenType = el?.dataset?.tokenType;
			if (tokenId && tokenType) this._onTokenSelect({ tokenId, tokenType });
			return;
		}
		if (ev.key === "Escape") {
			ev.preventDefault();
			this.close();
		}
	}

	_syncSelection() {
		const tokenId = this.memdump.tokenOrder[this.selectedTokenIndex];
		if (!tokenId) return;
		const nodes = this.element?.find(".ft-token") ?? [];
		for (const node of nodes) node.classList?.remove("is-selected");
		const current = this.element?.find(`.ft-token[data-token-id='${tokenId}']`)?.[0];
		if (current) {
			current.classList.add("is-selected");
			current.scrollIntoView({ block: "nearest" });
		}
	}

	_onTokenSelect({ tokenId, tokenType }) {
		if (this.resolved) return;
		if (this.disabledTokenIds.has(tokenId)) return;
		const token = this.memdump.tokens.find(t => t.id === tokenId);
		if (!token) return;

		if (tokenType === "word") {
			this.disabledTokenIds.add(tokenId);
			this._onGuess(token.text);
			return;
		}

		if (tokenType === "bracket") {
			this.disabledTokenIds.add(tokenId);
			this._onBracketEffect();
			this.render();
			return;
		}
	}

	_onBracketEffect() {
		if (this.resolved) return;
		const dudIds = this.memdump.tokens
			.filter(t => t.type === "word" && t.text !== this.password)
			.map(t => t.id)
			.filter(id => !this.disabledTokenIds.has(id));

		const canReplenish = this.replenishesUsed < this.maxReplenishes;
		const shouldRemove = dudIds.length > 0 && (!canReplenish || Math.random() < 0.65);

		if (shouldRemove) {
			const dudId = dudIds[Math.floor(Math.random() * dudIds.length)];
			this.disabledTokenIds.add(dudId);
			this.log.unshift({ text: "DUD REMOVED." });
			return;
		}

		if (canReplenish) {
			this.attemptsLeft = this.attemptsMax;
			this.replenishesUsed += 1;
			this.log.unshift({ text: "ALLOWANCE REPLENISHED." });
			return;
		}

		this.log.unshift({ text: "NO EFFECT." });
	}

	async _onGuess(guess) {
		if (this.resolved) return;
		if (this.attemptsLeft <= 0) return;

		if (guess === this.password) {
			this.resolved = true;
			this.log.unshift({ text: `${guess}  -> ACCESS GRANTED` });
			await this._unlock();
			this.render();
			return;
		}

		this.attemptsLeft -= 1;
		const like = likeness(guess, this.password);
		this.log.unshift({ text: `${guess}  -> LIKENESS ${like}/${this.password.length}` });

		if (this.attemptsLeft <= 0) {
			this.resolved = true;
			this.log.unshift({ text: `LOCKOUT  -> ACCESS DENIED` });
			await this._lock();
		}

		this.render();
	}

	async _unlock() {
		const targetUuid = this.targetUuid;
		if (!targetUuid) return;
		requestOwnershipChange({
			action: "unlock",
			targetUuid,
			userId: this.userId,
			level: OWNERSHIP.OBSERVER,
		});
		ui.notifications?.info("Acesso liberado.");
	}

	async _lock() {
		const targetUuid = this.targetUuid;
		if (!targetUuid) return;
		requestOwnershipChange({
			action: "lock",
			targetUuid,
			userId: this.userId,
			level: OWNERSHIP.NONE,
		});
		ui.notifications?.warn("LOCKOUT. Acesso negado.");
	}
}

