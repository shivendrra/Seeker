import { Trace, TraceStep, Source } from '../types';

// Helper to parse a markdown table into a structured array
const parseSourcesTable = (tableText: string): Source[] => {
    const lines = tableText.trim().split('\n').filter(line => line.includes('|'));
    if (lines.length < 2) return [];

    // Extract headers, normalize them to match Source keys
    const headers = lines[0]
        .split('|')
        .map(h => h.trim().toLowerCase().replace(/\s+/g, ''))
        .filter(Boolean);
    
    // Find index for required keys with fallback aliases
    const findIndex = (keys: string[]) => {
        for (const key of keys) {
            const index = headers.indexOf(key);
            if (index !== -1) return index;
        }
        return -1;
    }

    const idIndex = findIndex(['sourceid', 'id']);
    const titleIndex = findIndex(['title']);
    const dateIndex = findIndex(['date']);
    const typeIndex = findIndex(['type']);
    const urlIndex = findIndex(['url', 'link']);
    
    if (idIndex === -1 || titleIndex === -1) return []; // ID and Title are mandatory

    const sources: Source[] = [];
    // Start from line 2 to skip header and separator
    for (let i = 2; i < lines.length; i++) {
        const cells = lines[i].split('|').slice(1).map(c => c.trim());
        if (cells.length < headers.length) continue;

        const source: Source = {
            id: cells[idIndex - 1] || '', // Adjust index because we sliced the first empty cell
            title: cells[titleIndex - 1] || '',
            date: dateIndex > -1 ? cells[dateIndex - 1] : 'N/A',
            type: typeIndex > -1 ? cells[typeIndex - 1] : 'N/A',
            url: urlIndex > -1 ? cells[urlIndex - 1] : undefined,
        };
        sources.push(source);
    }
    return sources;
}


export const extractTraceAndContent = (rawText: string): { content: string; trace: Trace | null; sources: Source[] | null } => {
    const traceBlockRegex = /##\s*Plan[\s\S]*?\*\*END OF TRACE FORMAT\*\*/i;
    const traceBlockMatch = rawText.match(traceBlockRegex);
    
    if (!traceBlockMatch) {
        return { content: rawText, trace: null, sources: null };
    }
    
    const traceBlock = traceBlockMatch[0];
    let content = rawText.replace(traceBlock, '').trim();

    const planRegex = /##\s*Plan\s*\n([\s\S]*?)(?=\n##\s*Execution Steps|$)/i;
    const stepsRegex = /##\s*Execution Steps\s*\n([\s\S]*?)(?=\n##\s*Sources & Provenance|$)/i;
    const sourcesRegex = /##\s*Sources & Provenance\s*\n([\s\S]*?)(?=\n\*\*END OF TRACE FORMAT\*\*|$)/i;
    
    let plan: string[] = [];
    let steps: TraceStep[] = [];
    let sources: Source[] = [];

    // Extract Plan
    const planMatch = traceBlock.match(planRegex);
    if (planMatch && planMatch[1]) {
        plan = planMatch[1]
            .trim()
            .split('\n')
            .map(line => line.replace(/^[-\*\d\.]+\s*/, '').trim())
            .filter(Boolean);
    }

    // Extract Steps
    const stepsMatch = traceBlock.match(stepsRegex);
    if (stepsMatch && stepsMatch[1]) {
        const stepsText = stepsMatch[1].trim();
        
        // Split by the '### tool_name' heading for each step
        const stepBlocks = stepsText.split(/\n?###\s+/).filter(s => s.trim());

        stepBlocks.forEach(block => {
            const toolNameMatch = block.match(/^([^\n]+)/);
            if (!toolNameMatch) return;
            const toolName = toolNameMatch[1].trim();

            const bodyOfBlock = block.substring(toolName.length).trim();
            
            // Match the strict format with code fences
            const structuredMatch = bodyOfBlock.match(/\*\*INPUT\*\*:\s*\n```(?:\w*\n)?([\s\S]*?)\n```\s*\n\*\*OUTPUT\*\*:\s*\n```(?:\w*\n)?([\s\S]*?)\n```/s);

            if (structuredMatch) {
                steps.push({
                    tool: toolName,
                    input: structuredMatch[1].trim(),
                    output: structuredMatch[2].trim(),
                });
            } else {
                // Fallback for variations
                const fallbackMatch = bodyOfBlock.match(/\*\*INPUT\*\*:\s*([\s\S]*?)\s*\*\*OUTPUT\*\*:\s*([\s\S]*)/s);
                if (fallbackMatch) {
                    const clean = (str: string | undefined) => (str || '').trim().replace(/^`{1,3}(?:\w*\n)?|`{1,3}$/g, '').trim();
                    steps.push({
                        tool: toolName,
                        input: clean(fallbackMatch[1]),
                        output: clean(fallbackMatch[2]),
                    });
                }
            }
        });
    }

    // Extract Sources
    const sourcesMatch = traceBlock.match(sourcesRegex);
    if (sourcesMatch && sourcesMatch[1]) {
        const sourcesTableText = sourcesMatch[1].trim();
        sources = parseSourcesTable(sourcesTableText);
    }

    const trace = (plan.length > 0 || steps.length > 0) ? { plan, steps } : null;
    const finalSources = sources.length > 0 ? sources : null;
    
    return { content, trace, sources: finalSources };
}