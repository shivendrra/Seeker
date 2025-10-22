import { Trace, TraceStep, Source } from '../types';

const parseSourcesTable = (tableText: string): Source[] => {
	const lines = tableText.trim().split('\n').filter(l => l.includes('|'));
	if (lines.length < 3) return [];

	const headers = lines[0].split('|').map(h => h.trim().toLowerCase().replace(/\s+/g, ''));
	const findIndex = (keys: string[]) => keys.map(k => headers.indexOf(k)).find(i => i !== -1) ?? -1;
	const idIndex = findIndex(['id', 'sourceid']), titleIndex = findIndex(['title']);
	const dateIndex = findIndex(['date']), typeIndex = findIndex(['type']), urlIndex = findIndex(['url', 'link']);

	if (idIndex === -1 || titleIndex === -1) return [];

	const dataRows = lines.slice(2);
	return dataRows.map(row => {
		const cells = row.split('|').map(c => c.trim());
		return {
			id: cells[idIndex],
			title: cells[titleIndex],
			date: dateIndex >= 0 ? cells[dateIndex] : 'N/A',
			type: typeIndex >= 0 ? cells[typeIndex] : 'N/A',
			url: urlIndex >= 0 ? cells[urlIndex]?.replace(/[`"']/g, '') : undefined
		};
	});
};

export const extractTraceAndContent = (raw: string): { content: string; trace: Trace | null; sources: Source[] | null; } => {
	let sources: Source[] | null = null, content = raw, plan: string[] = [];
	const steps: TraceStep[] = [];

	const planMatch = content.match(/##\s*Plan\s*\n([\s\S]*?)(?=##\s*Execution Steps|##\s*\w+\s*\n\*\*INPUT\*\*|$)/i);
	if (planMatch) {
		plan = planMatch[1]
			.trim()
			.split('\n')
			.map(l => l.replace(/^[-*•]\s*/, '').replace(/^Step \d+:\s*/i, '').trim())
			.filter(Boolean);
		content = content.replace(planMatch[0], '').trim();
	}

	const toolBlockRegex = /##\s+(\w+)\s*\n\*\*INPUT\*\*:\s*```[\s\S]*?```\s*\*\*OUTPUT\*\*:\s*```[\s\S]*?```/g;
	let match;

	while ((match = toolBlockRegex.exec(raw)) !== null) {
		const fullBlock = match[0];
		const toolName = match[1];

		const inputMatch = fullBlock.match(/\*\*INPUT\*\*:\s*```(?:\w*\n)?([\s\S]*?)```/i);
		const outputMatch = fullBlock.match(/\*\*OUTPUT\*\*:\s*```(?:\w*\n)?([\s\S]*?)```/i);

		if (toolName) {
			steps.push({
				tool: toolName,
				input: inputMatch?.[1]?.trim() ?? '',
				output: outputMatch?.[1]?.trim() ?? ''
			});
		}
	}

	content = content.replace(toolBlockRegex, '').trim();

	content = content.replace(/##\s*Execution Steps\s*\n*/gi, '').replace(/^#+\s*\n*/gm, '').replace(/^---+\s*\n*/gm, '').trim();

	const sourcesRegex = /#+\s*Sources?(?:\s*&?\s*Provenance)?[\s\S]*?(?=\n#{1,}|$)/gi;
	const sourcesMatch = raw.match(sourcesRegex);

	if (sourcesMatch) {
		console.log("matttvhhhc!!");
		const parsedSources = parseSourcesTable(sourcesMatch[0]);
		if (parsedSources.length > 0) sources = parsedSources;
		content = content.replace(sourcesRegex, '').trim();
	}

	content = content.replace(sourcesRegex, '').trim();
	content = content.replace(/\n{3,}/g, '\n\n').trim();

	const trace = (plan.length > 0 || steps.length > 0) ? { plan, steps } : null;

	return { content, trace, sources: sources && sources.length ? sources : null };
}