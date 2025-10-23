import { Trace, TraceStep, Source } from '../types';

const parseSourcesTable = (tableText: string): Source[] => {
	const lines = tableText.trim().split('\n').filter(l => l.trim().startsWith('|') && l.trim().endsWith('|'));
	if (lines.length < 2) return []; // Header and separator line are required.

	// Helper to parse a table row into cells
	const parseRow = (row: string): string[] => row.trim().slice(1, -1).split('|').map(cell => cell.trim());

	const headers = parseRow(lines[0]).map(h => h.toLowerCase().replace(/\s+/g, ''));
	const separator = lines[1];

	if (!separator.match(/^[|\s-:]+$/)) return []; // Not a valid markdown table separator line

	const findIndex = (keys: string[]) => keys.map(k => headers.indexOf(k)).find(i => i !== -1) ?? -1;

	const idIndex = findIndex(['sourceid', 'id']);
	const titleIndex = findIndex(['title']);
	const dateIndex = findIndex(['date']);
	const typeIndex = findIndex(['type']);
	const urlIndex = findIndex(['url', 'link']);

	// Title and ID are considered mandatory for a valid source.
	if (idIndex === -1 || titleIndex === -1) return [];

	const dataRows = lines.slice(2);
	return dataRows.map((row): Source | null => {
		const cells = parseRow(row);
		if (cells.length < headers.length) return null;
		
		return {
			id: cells[idIndex] ?? 'N/A',
			title: cells[titleIndex] ?? 'N/A',
			date: dateIndex !== -1 ? (cells[dateIndex] || 'N/A') : 'N/A',
			type: typeIndex !== -1 ? (cells[typeIndex] || 'N/A') : 'N/A',
			url: urlIndex !== -1 ? cells[urlIndex]?.replace(/[`"']/g, '') : undefined
		};
	}).filter((s): s is Source => s !== null);
};

const sanitizeAndParseJson = (jsonString: string): any => {
    // 1. Remove markdown fences and trim
    let cleanedString = jsonString.replace(/^```json\s*/, '').replace(/```\s*$/, '').trim();

    // 2. Escape unescaped newlines within string literals.
    let sanitized = '';
    let inString = false;
    for (let i = 0; i < cleanedString.length; i++) {
        const char = cleanedString[i];

        if (char === '"') {
            let backslashCount = 0;
            let j = i - 1;
            while (j >= 0 && cleanedString[j] === '\\') {
                backslashCount++;
                j--;
            }
            if (backslashCount % 2 === 0) {
                inString = !inString;
            }
        }
        
        if (inString && char === '\n') {
            sanitized += '\\n';
        } else if (char !== '\r') { // Also remove carriage returns for cleanliness
            sanitized += char;
        }
    }
    cleanedString = sanitized;
    
    // 3. Attempt to remove trailing commas from arrays and objects
    cleanedString = cleanedString.replace(/,\s*([}\]])/g, '$1');

    return JSON.parse(cleanedString);
};


export const extractTraceAndContent = (raw: string): { content: string; trace: Trace | null; sources: Source[] | null; } => {
    if (!raw) {
        return { content: '', trace: null, sources: null };
    }

    const separator = '---JSON_TRACE_START---';
    const separatorIndex = raw.lastIndexOf(separator);

    if (separatorIndex !== -1) {
        const content = raw.substring(0, separatorIndex).trim();
        const jsonString = raw.substring(separatorIndex + separator.length);

        try {
            const data = sanitizeAndParseJson(jsonString);
            
            const trace = data.trace || null;
            const sources = data.sources || null;
            
            if (trace && (!Array.isArray(trace.plan) || !Array.isArray(trace.steps))) {
                 console.warn("Parsed trace object has incorrect structure.", trace);
                 return { content, trace: null, sources };
            }
            if (sources && !Array.isArray(sources)) {
                console.warn("Parsed sources object is not an array.", sources);
                return { content, trace, sources: null };
            }

            return { content, trace, sources };
        } catch (error) {
            console.error("Failed to parse JSON trace, returning full raw content.", error);
            console.error("Original string that failed parsing:", jsonString);
            // Fallback to showing everything if JSON is broken, so user doesn't see a blank screen
            return { content: raw, trace: null, sources: null };
        }
    }
    
    // --- Fallback Regex Logic ---
    console.warn("JSON trace separator not found. Falling back to regex parsing.");
    let content = raw;
    let traceBlockText = '';
    
    const fullTraceRegex = /(\*\*TRACE FORMAT \(MANDATORY\)\*\*[\s\S]*?\*\*END OF TRACE FORMAT\*\*)/i;
    const fullTraceMatch = content.match(fullTraceRegex);
    
    if (fullTraceMatch) {
        traceBlockText = fullTraceMatch[0];
        content = content.replace(fullTraceRegex, '');
    }

    const textToParseTraceFrom = traceBlockText || content;
    
    let plan: string[] = [];
	const steps: TraceStep[] = [];
	let sources: Source[] | null = null;

	// 1. Parse Plan
	const planRegex = /(##\s*Plan\s*\n[\s\S]*?)(?=\n##\s*\w+|$)/i;
	const planMatch = textToParseTraceFrom.match(planRegex);
	if (planMatch) {
        const planText = planMatch[0].replace(/##\s*Plan\s*\n/i, '');
		plan = planText
			.trim()
			.split('\n')
			.map(l => l.replace(/^[-*•]\s*(?:Step \d+:\s*)?/i, '').trim())
			.filter(Boolean);
        
        if (!fullTraceMatch) {
            content = content.replace(planMatch[0], '');
        }
	}

	// 2. Parse Execution Steps
	const execStepsHeaderRegex = /##\s*Execution Steps\s*\n/i;
	const toolBlockRegex = /(###?\s*[\w_]+\s*\n\*\*INPUT\*\*:\s*```[\s\S]*?```\s*\*\*OUTPUT\*\*:\s*```[\s\S]*?```)/g;
    const toolBlocks = textToParseTraceFrom.match(toolBlockRegex);

    if (toolBlocks) {
        const stepDetailRegex = /###?\s*([\w_]+)\s*\n\*\*INPUT\*\*:\s*```(?:[\s\S]*?\n)?([\s\S]*?)```\s*\*\*OUTPUT\*\*:\s*```(?:[\s\S]*?\n)?([\s\S]*?)```/;
        for (const block of toolBlocks) {
            const stepMatch = block.match(stepDetailRegex);
            if (stepMatch) {
                 steps.push({
                    tool: stepMatch[1]?.trim() ?? 'unknown_tool',
                    input: stepMatch[2]?.trim() ?? '',
                    output: stepMatch[3]?.trim() ?? ''
                });
            }
        }
        if (!fullTraceMatch) {
            content = content.replace(toolBlockRegex, '');
            content = content.replace(execStepsHeaderRegex, ''); // Also remove the header
        }
    }

	// 3. Parse Sources
	const sourcesRegex = /(##\s*(?:Sources?|References|Bibliography)(?:\s*&?\s*Provenance)?\s*\n[\s\S]*?)(?=\n##\s*\w+|$)/i;
	const sourcesMatch = textToParseTraceFrom.match(sourcesRegex);
	if (sourcesMatch) {
        const tableContent = sourcesMatch[0].replace(/##\s*(?:Sources?|References|Bibliography)(?:\s*&?\s*Provenance)?\s*\n/i, '');
		const parsedSources = parseSourcesTable(tableContent);
		if (parsedSources.length > 0) {
			sources = parsedSources;
		}
        if (!fullTraceMatch) {
            content = content.replace(sourcesMatch[0], '');
        }
	}

	// 4. Final Cleanup
	content = content.replace(/\*\*TRACE FORMAT \(MANDATORY\)\*\*/i, '').replace(/\*\*END OF TRACE FORMAT\*\*/i, '');
	content = content.replace(/\n{3,}/g, '\n\n').trim();

	const trace: Trace | null = (plan.length > 0 || steps.length > 0) ? { plan, steps } : null;

	return { content, trace, sources };
}