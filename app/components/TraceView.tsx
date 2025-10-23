import React, { useState, useEffect } from 'react';
import { Trace, Source } from '../types';
import { TraceIcon, SearchIcon, DocumentIcon, SourceIcon, LogoIcon, OpenInNewIcon, CloseIcon } from '../icons';

// A helper to determine which icon to show for a given tool
const ToolIcon: React.FC<{ toolName: string }> = ({ toolName }) => {
	if (toolName.toLowerCase().includes('search')) return <SearchIcon className="w-4 h-4 text-gray-500 dark:text-zinc-400" />;
	if (toolName.toLowerCase().includes('doc')) return <DocumentIcon className="w-4 h-4 text-gray-500 dark:text-zinc-400" />;
	return <TraceIcon className="w-4 h-4 text-gray-500 dark:text-zinc-400" />;
};

const TabButton: React.FC<{ active: boolean; onClick: () => void; disabled: boolean; children: React.ReactNode }> = ({ active, onClick, disabled, children }) => (
	<button
		onClick={onClick}
		disabled={disabled}
		className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 text-sm font-semibold transition-all ${active
				? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300'
				: 'text-gray-500 dark:text-zinc-400 hover:bg-gray-200 dark:hover:bg-zinc-700'
			} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
	>
		{children}
	</button>
);

const SourceTypeIcon: React.FC<{ type: string }> = ({ type }) => {
	const lowerType = type.toLowerCase();
	if (lowerType.includes('judgment') || lowerType.includes('doc') || lowerType.includes('paper')) {
		return <DocumentIcon className="w-5 h-5 text-gray-400 dark:text-zinc-500" />;
	}
	if (lowerType.includes('news') || lowerType.includes('web')) {
		return <SearchIcon className="w-5 h-5 text-gray-400 dark:text-zinc-500" />;
	}
	return <SourceIcon className="w-5 h-5 text-gray-400 dark:text-zinc-500" />;
};


const SourceItem: React.FC<{ source: Source }> = ({ source }) => {
	const content = (
		<div className="flex gap-3">
			<div className="flex-shrink-0 pt-1">
				<SourceTypeIcon type={source.type} />
			</div>
			<div className="flex-grow">
				<div className="flex justify-between items-start">
					<p className="font-semibold text-gray-800 dark:text-zinc-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors pr-2">{source.title}</p>
					{source.url && <OpenInNewIcon className="w-4 h-4 text-gray-400 dark:text-zinc-500 flex-shrink-0" />}
				</div>
				<div className="text-xs text-gray-500 dark:text-zinc-400 mt-1 flex flex-wrap items-center gap-x-2">
					<span>ID: {source.id}</span>
					<span className="text-gray-300 dark:text-zinc-600">&bull;</span>
					<span>{source.type}</span>
					<span className="text-gray-300 dark:text-zinc-600">&bull;</span>
					<span>{source.date}</span>
				</div>
			</div>
		</div>
	);

	const baseClasses = "group block bg-white dark:bg-zinc-800/50 border border-gray-200 dark:border-zinc-700 rounded-lg p-3 transition-all duration-200 shadow-sm";

	if (source.url && source.url !== 'internal_doc_id_123') { // Example of non-clickable internal ID
		return (
			<a href={source.url} target="_blank" rel="noopener noreferrer" className={`${baseClasses} hover:border-indigo-400 dark:hover:border-indigo-500 hover:shadow-md hover:-translate-y-0.5`}>
				{content}
			</a>
		);
	}

	return <div className={baseClasses}>{content}</div>;
};


const TraceView: React.FC<{ trace: Trace | null; sources: Source[] | null; onClose: () => void; }> = ({ trace, sources, onClose }) => {
	const [view, setView] = useState<'trace' | 'sources'>('trace');

	const hasTrace = trace && (trace.plan?.length > 0 || trace.steps?.length > 0);
	const hasSources = sources && sources.length > 0;

	useEffect(() => {
		if (hasTrace) {
			setView('trace');
		} else if (hasSources) {
			setView('sources');
		} else {
			setView('trace'); // Default back to trace if both are empty
		}
	}, [hasTrace, hasSources]);

	if (!hasTrace && !hasSources) {
		return (
			<div className="w-full h-full bg-gray-50 dark:bg-zinc-900 flex-col p-4 flex border-l border-gray-200 dark:border-zinc-800">
				<div className="flex items-center gap-2 text-gray-600 dark:text-zinc-300 mb-4">
					<LogoIcon className="w-5 h-5" />
					<h2 className="font-semibold">Details</h2>
				</div>
				<div className="flex-1 flex items-center justify-center text-center text-gray-500 dark:text-zinc-400 text-sm">
					<p>The agent's trace and sources will appear here once a response is generated.</p>
				</div>
			</div>
		);
	}

	return (
		<div className="h-full w-full bg-gray-50 dark:bg-zinc-900 border-l border-gray-200 dark:border-zinc-800 flex flex-col">
			<div className="flex-shrink-0 border-b border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-3 space-y-3">
				{/* Title and Close button for mobile/tablet */}
				<div className="flex items-center justify-between xl:hidden">
					<h2 className="font-semibold text-lg text-gray-800 dark:text-zinc-100">Details</h2>
					<button
						onClick={onClose}
						className="p-1.5 rounded-full text-gray-500 dark:text-zinc-400 hover:bg-gray-200 dark:hover:bg-zinc-700"
						aria-label="Close details"
					>
						<CloseIcon className="w-5 h-5" />
					</button>
				</div>
				<div className="flex items-center gap-2 bg-gray-100 dark:bg-black/20 rounded-lg p-1">
					<TabButton active={view === 'trace'} onClick={() => setView('trace')} disabled={!hasTrace}>
						<TraceIcon className="w-4 h-4" />
						<span>Trace</span>
					</TabButton>
					<TabButton active={view === 'sources'} onClick={() => setView('sources')} disabled={!hasSources}>
						<SourceIcon className="w-4 h-4" />
						<span>Sources {hasSources ? `(${sources.length})` : ''}</span>
					</TabButton>
				</div>
			</div>

			<div className="flex-1 overflow-y-auto p-4 text-sm">
				{view === 'trace' && (
					!hasTrace ? (
						<div className="text-center text-gray-500 dark:text-zinc-400 pt-10">No trace available.</div>
					) : (
						<div className="space-y-6">
							{trace.plan && trace.plan.length > 0 && (
								<section>
									<h3 className="font-bold text-gray-700 dark:text-zinc-200 mb-2">Plan</h3>
									<ul className="list-decimal list-inside space-y-1 text-gray-600 dark:text-zinc-400">
										{trace.plan.map((step, index) => <li key={index}>{step}</li>)}
									</ul>
								</section>
							)}
							{trace.steps && trace.steps.length > 0 && (
								<section>
									<h3 className="font-bold text-gray-700 dark:text-zinc-200 mb-3">Execution Steps</h3>
									<div className="space-y-4">
										{trace.steps.map((step, index) => (
											<div key={index} className="bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg p-3">
												<div className="flex items-center gap-2 font-semibold text-gray-800 dark:text-zinc-200 mb-2">
													<ToolIcon toolName={step.tool} />
													<span>{step.tool}</span>
												</div>
												<div className="space-y-2">
													<div>
														<h4 className="text-xs font-semibold text-gray-500 dark:text-zinc-400">INPUT</h4>
														<pre className="whitespace-pre-wrap bg-gray-100 dark:bg-black/20 p-2 text-xs font-mono text-gray-700 dark:text-zinc-300 mt-1 max-h-40 overflow-auto">{step.input}</pre>
													</div>
													<div>
														<h4 className="text-xs font-semibold text-gray-500 dark:text-zinc-400">OUTPUT</h4>
														<pre className="whitespace-pre-wrap bg-gray-100 dark:bg-black/20 p-2 text-xs font-mono text-gray-700 dark:text-zinc-300 mt-1 max-h-40 overflow-auto">{step.output}</pre>
													</div>
												</div>
											</div>
										))}
									</div>
								</section>
							)}
						</div>
					)
				)}

				{view === 'sources' && (
					!hasSources ? (
						<div className="text-center text-gray-500 dark:text-zinc-400 pt-10">No sources available.</div>
					) : (
						<div className="space-y-3">
							{sources.map((source, index) => (
								<SourceItem key={source.id || index} source={source} />
							))}
						</div>
					)
				)}
			</div>
		</div>
	);
};

export default TraceView;