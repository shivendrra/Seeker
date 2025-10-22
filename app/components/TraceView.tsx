import React, { useState } from 'react';
import { Trace, Source } from '../types';
import { TraceIcon, SearchIcon, DocumentIcon, SourceIcon, LogoIcon } from './icons';

// A helper to determine which icon to show for a given tool
const ToolIcon: React.FC<{ toolName: string }> = ({ toolName }) => {
    if (toolName.toLowerCase().includes('search')) return <SearchIcon className="w-4 h-4 text-gray-500 dark:text-zinc-400" />;
    if (toolName.toLowerCase().includes('doc')) return <DocumentIcon className="w-4 h-4 text-gray-500 dark:text-zinc-400" />;
    return <TraceIcon className="w-4 h-4 text-gray-500 dark:text-zinc-400" />;
};

const TabButton: React.FC<{ active: boolean; onClick: () => void; children: React.ReactNode }> = ({ active, onClick, children }) => (
    <button
        onClick={onClick}
        className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 text-sm font-semibold transition-all transform hover:scale-105 ${
            active 
                ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300' 
                : 'text-gray-500 dark:text-zinc-400 hover:bg-gray-200 dark:hover:bg-zinc-700'
        }`}
    >
        {children}
    </button>
);


const TraceView: React.FC<{ trace: Trace | null; sources: Source[] | null }> = ({ trace, sources }) => {
    const [view, setView] = useState<'trace' | 'sources'>('trace');

    // If neither trace nor sources are available, show an empty state.
    if (!trace && (!sources || sources.length === 0)) {
        return (
            <aside className="hidden lg:flex w-80 bg-gray-50 dark:bg-zinc-900/50 border-l border-gray-200 dark:border-zinc-800 flex-col p-4">
                <div className="flex items-center gap-2 text-gray-600 dark:text-zinc-300 mb-4">
                    <LogoIcon className="w-5 h-5" />
                    <h2 className="font-semibold">Details</h2>
                </div>
                <div className="flex-1 flex items-center justify-center text-center text-gray-500 dark:text-zinc-400 text-sm">
                    <p>The agent's trace and sources will appear here once a response is generated.</p>
                </div>
            </aside>
        );
    }

    return (
        <aside className="hidden lg:flex w-80 bg-gray-50 dark:bg-zinc-900/50 border-l border-gray-200 dark:border-zinc-800 flex-col">
            <div className="p-3 border-b border-gray-200 dark:border-zinc-800 flex-shrink-0 bg-white dark:bg-zinc-900">
                <div className="flex items-center gap-2 bg-gray-100 dark:bg-black/20 rounded-lg p-1">
                    <TabButton active={view === 'trace'} onClick={() => setView('trace')}>
                        <TraceIcon className="w-4 h-4" />
                        <span>Trace</span>
                    </TabButton>
                    <TabButton active={view === 'sources'} onClick={() => setView('sources')}>
                        <SourceIcon className="w-4 h-4" />
                        <span>Sources</span>
                    </TabButton>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 text-sm">
                {view === 'trace' && (
                    !trace ? (
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
                     !sources || sources.length === 0 ? (
                        <div className="text-center text-gray-500 dark:text-zinc-400 pt-10">No sources available.</div>
                    ) : (
                        <div className="space-y-3">
                            {sources.map((source, index) => (
                                <div key={source.id || index} className="bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg p-3">
                                    <a href={source.url} target="_blank" rel="noopener noreferrer" className="font-semibold text-indigo-700 dark:text-indigo-400 hover:underline">{source.title}</a>
                                    <div className="text-xs text-gray-500 dark:text-zinc-400 mt-1 flex flex-wrap items-center gap-x-2">
                                        <span>ID: {source.id}</span>
                                        <span className="text-gray-300 dark:text-zinc-600">&bull;</span>
                                        <span>{source.type}</span>
                                        <span className="text-gray-300 dark:text-zinc-600">&bull;</span>
                                        <span>{source.date}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )
                )}
            </div>
        </aside>
    );
};

export default TraceView;