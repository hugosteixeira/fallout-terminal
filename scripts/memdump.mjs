const GLYPHS = "!@#$%^&*()-_=+[]{}<>?/\\|;:'\",.`~";

function randInt(min, max) {
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

function choice(str) {
	return str[randInt(0, str.length - 1)];
}

function randomGlyphString(length) {
	let out = "";
	for (let i = 0; i < length; i++) out += choice(GLYPHS);
	return out;
}

function createEmptyLines({ rows, lineLength }) {
	const lines = [];
	for (let r = 0; r < rows; r++) {
		let s = "";
		for (let i = 0; i < lineLength; i++) s += choice(GLYPHS);
		lines.push(s);
	}
	return lines;
}

function canPlace(lines, row, start, length, occupied) {
	const lineLength = lines[row].length;
	if (start < 0 || start + length > lineLength) return false;
	for (let i = start; i < start + length; i++) {
		if (occupied[row][i]) return false;
	}
	return true;
}

function placeToken(lines, row, start, text, occupied) {
	const original = lines[row];
	lines[row] = original.slice(0, start) + text + original.slice(start + text.length);
	for (let i = start; i < start + text.length; i++) occupied[row][i] = true;
}

function makeOccupied(rows, lineLength) {
	const occupied = [];
	for (let r = 0; r < rows; r++) {
		occupied.push(new Array(lineLength).fill(false));
	}
	return occupied;
}

function buildLineHtml({ lineText, rowTokens, disabledTokenIds }) {
	const escape = foundry.utils.escapeHTML;
	const tokens = (rowTokens ?? []).slice().sort((a, b) => a.start - b.start);
	let out = "";
	let idx = 0;
	for (const token of tokens) {
		out += escape(lineText.slice(idx, token.start));
		const isDisabled = disabledTokenIds?.has(token.id);
		const displayText = isDisabled
			? ".".repeat(token.text.length)
			: token.text;
		out += `<span class="ft-token ${isDisabled ? "is-disabled" : ""}" data-token-id="${token.id}" data-token-type="${token.type}">${escape(displayText)}</span>`;
		idx = token.start + token.text.length;
	}
	out += escape(lineText.slice(idx));
	return out;
}

export function generateMemoryDump({
	words,
	rowsPerColumn = 16,
	lineLength = 12,
	baseAddress = 0xF000,
	bracketCount = 10,
}) {
	const leftLines = createEmptyLines({ rows: rowsPerColumn, lineLength });
	const rightLines = createEmptyLines({ rows: rowsPerColumn, lineLength });
	const leftOcc = makeOccupied(rowsPerColumn, lineLength);
	const rightOcc = makeOccupied(rowsPerColumn, lineLength);

	/** @type {Array<{id:string,type:'word'|'bracket',text:string,col:0|1,row:number,start:number}>} */
	const tokens = [];

	let wordId = 0;
	for (const word of words) {
		const col = Math.random() < 0.5 ? 0 : 1;
		const lines = col === 0 ? leftLines : rightLines;
		const occ = col === 0 ? leftOcc : rightOcc;
		let placed = false;
		for (let tries = 0; tries < 250 && !placed; tries++) {
			const row = randInt(0, rowsPerColumn - 1);
			const start = randInt(0, lineLength - word.length);
			if (!canPlace(lines, row, start, word.length, occ)) continue;
			placeToken(lines, row, start, word, occ);
			const id = `w${wordId++}`;
			tokens.push({ id, type: "word", text: word, col, row, start });
			placed = true;
		}
		if (!placed) {
			// If placement fails, skip embedding; the app will still work.
		}
	}

	let bracketId = 0;
	const bracketPairs = [
		["(", ")"],
		["[", "]"],
		["{", "}"],
		["<", ">"],
	];
	for (let i = 0; i < bracketCount; i++) {
		const [open, close] = bracketPairs[randInt(0, bracketPairs.length - 1)];
		const innerLen = randInt(2, 6);
		const text = `${open}${randomGlyphString(innerLen)}${close}`;
		const col = Math.random() < 0.5 ? 0 : 1;
		const lines = col === 0 ? leftLines : rightLines;
		const occ = col === 0 ? leftOcc : rightOcc;
		let placed = false;
		for (let tries = 0; tries < 250 && !placed; tries++) {
			const row = randInt(0, rowsPerColumn - 1);
			const start = randInt(0, lineLength - text.length);
			if (!canPlace(lines, row, start, text.length, occ)) continue;
			placeToken(lines, row, start, text, occ);
			const id = `b${bracketId++}`;
			tokens.push({ id, type: "bracket", text, col, row, start });
			placed = true;
		}
	}

	// Sort token order in reading order.
	const tokenOrder = tokens
		.slice()
		.sort((a, b) => (a.col - b.col) || (a.row - b.row) || (a.start - b.start))
		.map(t => t.id);

	return {
		leftLines,
		rightLines,
		rowsPerColumn,
		lineLength,
		baseAddress,
		tokens,
		tokenOrder,
	};
}

export function renderMemoryDump({ memdump, disabledTokenIds }) {
	const tokenIndex = new Map(memdump.tokens.map(t => [t.id, t]));
	const tokensByColRow = new Map();
	for (const token of memdump.tokens) {
		const key = `${token.col}:${token.row}`;
		const arr = tokensByColRow.get(key) ?? [];
		arr.push(token);
		tokensByColRow.set(key, arr);
	}

	const left = [];
	const right = [];
	for (let r = 0; r < memdump.rowsPerColumn; r++) {
		const leftTokens = tokensByColRow.get(`0:${r}`) ?? [];
		const rightTokens = tokensByColRow.get(`1:${r}`) ?? [];
		left.push({
			addr: `0x${(memdump.baseAddress + (r * memdump.lineLength)).toString(16).toUpperCase().padStart(4, "0")}`,
			html: buildLineHtml({
				lineText: memdump.leftLines[r],
				rowTokens: leftTokens,
				disabledTokenIds,
			}),
		});
		right.push({
			addr: `0x${(memdump.baseAddress + ((r + memdump.rowsPerColumn) * memdump.lineLength)).toString(16).toUpperCase().padStart(4, "0")}`,
			html: buildLineHtml({
				lineText: memdump.rightLines[r],
				rowTokens: rightTokens,
				disabledTokenIds,
			}),
		});
	}

	return {
		left,
		right,
		tokenIndex,
	};
}
