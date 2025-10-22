import React from 'react';
import { Message } from '../types';
import { UserCircleIcon, LogoIcon } from './icons';

const MarkdownLine: React.FC<{ text: string }> = ({ text }) => {
  const regex = /(\*\*(.*?)\*\*)|(\*(.*?)\*)|(`(.*?)`)|(\[(.*?)\]\((.*?)\))|(\[([^\]]+?)\])/g;
  if (!text) return <>{text}</>;

  const elements: React.ReactNode[] = [];
  let lastIndex = 0, match, keyCounter = 0;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) elements.push(text.substring(lastIndex, match.index));

    if (match[1]) {
      elements.push(<strong key={`b-${keyCounter++}-${match.index}`}>{match[2]}</strong>);
    } else if (match[3]) {
      elements.push(<em key={`i-${keyCounter++}-${match.index}`}>{match[4]}</em>);
    } else if (match[5]) {
      elements.push(<code key={`c-${keyCounter++}-${match.index}`} className="bg-gray-100 dark:bg-zinc-800 text-indigo-600 dark:text-indigo-300 text-sm rounded px-1.5 py-0.5 font-mono">{match[6]}</code>);
    } else if (match[7]) {
      elements.push(<a href={match[9]} key={`a-${keyCounter++}-${match.index}`} target="_blank" rel="noopener noreferrer" className="text-indigo-600 dark:text-indigo-400 hover:underline">{match[8]}</a>);
    } else if (match[10]) {
      elements.push(<sup key={`sup-${keyCounter++}-${match.index}`} className="bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 font-semibold px-1 py-0.5 rounded text-xs ml-1 cursor-pointer" title={match[11]}>{match[11]}</sup>);
    }
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) elements.push(text.substring(lastIndex));
  return <>{elements.map((el, i) => <React.Fragment key={i}>{el}</React.Fragment>)}</>;
};

const SimpleMarkdown: React.FC<{ text: string }> = ({ text }) => {
  if (!text) return null;

  const lines = text.split('\n'), elements: React.ReactNode[] = [];
  let listItems: string[] = [], tableHeaders: string[] = [], tableRows: string[][] = [];
  let inTable = false, inCodeBlock = false, codeBlockLines: string[] = [], codeBlockLang = '';

  const flushList = () => {
    if (listItems.length > 0) {
      elements.push(<ul key={`ul-${elements.length}`} className="list-disc list-inside ml-6 my-2 space-y-1 text-base leading-relaxed">{listItems.map((item, i) => <li key={i}><MarkdownLine text={item} /></li>)}</ul>);
      listItems = [];
    }
  };

  const flushTable = () => {
    if (tableRows.length > 0) {
      elements.push(
        <div key={`table-${elements.length}`} className="overflow-x-auto my-4 border dark:border-zinc-700 rounded-lg">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-zinc-700 text-base">
            <thead className="bg-gray-50 dark:bg-zinc-800/60">
              <tr>{tableHeaders.map((header, i) => <th key={i} scope="col" className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-zinc-200 uppercase tracking-wider">{header.trim()}</th>)}</tr>
            </thead>
            <tbody className="bg-white dark:bg-zinc-800 divide-y divide-gray-200 dark:divide-zinc-700">{tableRows.map((row, i) => <tr key={i}>{row.map((cell, j) => <td key={j} className="px-6 py-3 text-gray-800 dark:text-zinc-300 text-base"><MarkdownLine text={cell.trim()} /></td>)}</tr>)}</tbody>
          </table>
        </div>
      );
      tableHeaders = []; tableRows = []; inTable = false;
    }
  };

  const flushCodeBlock = () => {
    if (codeBlockLines.length > 0) {
      elements.push(
        <div key={`code-${elements.length}`} className="bg-zinc-900 text-white rounded-lg my-4 text-sm overflow-hidden">
          <div className="bg-zinc-800 px-4 py-2 text-xs text-zinc-400 font-mono flex justify-between items-center"><span>{codeBlockLang || 'code'}</span></div>
          <pre className="p-4 overflow-x-auto text-sm leading-relaxed"><code className={`language-${codeBlockLang}`}>{codeBlockLines.join('\n')}</code></pre>
        </div>
      );
      codeBlockLines = []; inCodeBlock = false; codeBlockLang = '';
    }
  };

  lines.forEach((line, lineIdx) => {
    const trimmed = line.trim();

    if (trimmed.startsWith('```')) {
      if (inCodeBlock) flushCodeBlock();
      else { flushList(); flushTable(); inCodeBlock = true; codeBlockLang = trimmed.substring(3).trim(); }
      return;
    }

    if (inCodeBlock) { codeBlockLines.push(line); return; }
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) { listItems.push(trimmed.replace(/^(\*|-)\s/, '')); return; }
    flushList();

    const headingMatch = trimmed.match(/^(#{1,6})\s+(.*)$/);
    if (headingMatch) {
      const level = headingMatch[1].length, content = headingMatch[2];
      const className = `${level === 1 ? 'text-2xl font-extrabold mt-8 mb-4' : level === 2 ? 'text-xl font-bold mt-6 mb-3 border-b dark:border-zinc-700 pb-1' : level === 3 ? 'text-lg font-semibold mt-4 mb-2' : 'text-base font-semibold mt-3 mb-1'} text-gray-900 dark:text-zinc-100 poppins`;
      elements.push(React.createElement(`h${level}`, { key: `h${level}-${lineIdx}`, className }, <MarkdownLine text={content} />));
      return;
    }

    if (trimmed.startsWith('> ')) {
      elements.push(<blockquote key={`bq-${lineIdx}`} className="border-l-4 poppins border-gray-300 dark:border-zinc-600 pl-4 italic text-gray-600 dark:text-zinc-400 my-2 text-base leading-relaxed"><MarkdownLine text={trimmed.replace(/^>\s/, '')} /></blockquote>);
      return;
    }

    if (trimmed === '---') {
      elements.push(<hr key={`hr-${elements.length}`} className="border-gray-300 dark:border-zinc-600 my-4" />);
      return;
    }

    if (trimmed !== '') elements.push(<p key={`p-${lineIdx}`} className="text-base leading-relaxed text-gray-800 dark:text-zinc-300"><MarkdownLine text={line} /></p>);
  });

  flushList(); flushTable(); flushCodeBlock();
  return <div className="space-y-4">{elements}</div>;
};

const WelcomeScreen: React.FC = () => (
  <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 dark:text-zinc-400 p-4">
    <div className="flex items-center justify-center w-20 h-20 mb-5 rounded-full bg-indigo-50 dark:bg-indigo-900/40"><LogoIcon className="w-12 h-12 text-indigo-500 dark:text-indigo-400" /></div>
    <h2 className="text-2xl font-bold text-gray-800 dark:text-zinc-100 leading-snug">Start Your Research</h2>
    <p className="max-w-md mt-2 text-base leading-relaxed">Ask a question, request a summary, or specify the information you need.<br />Seeker will plan and execute the research for you.</p>
  </div>
);

const ResponseDisplay: React.FC<{ messages: Message[] }> = ({ messages }) => {
  if (!messages || messages.length === 0) return <div className="flex-1 overflow-y-auto"><WelcomeScreen /></div>;

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 poppins">
      <div className="max-w-4xl mx-auto space-y-8">
        {messages.map(message => (
          <div key={message.id} className="flex items-start gap-4">
            {message.sender === 'bot' ? (
              <div className="w-8 h-8 flex-shrink-0 bg-indigo-100 dark:bg-zinc-700 rounded-full flex items-center justify-center"><LogoIcon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" /></div>
            ) : (
              <div className="w-8 h-8 flex-shrink-0 bg-gray-200 dark:bg-zinc-600 rounded-full flex items-center justify-center"><UserCircleIcon className="w-6 h-6 text-gray-600 dark:text-zinc-300" /></div>
            )}
            <div className="flex-1 text-base leading-relaxed">
              <div className="font-bold text-gray-800 dark:text-zinc-100 mb-1">{message.sender === 'user' ? 'You' : 'Seeker'}</div>
              <div className="prose prose-sm max-w-none text-gray-800 dark:text-zinc-300">
                {message.sender === 'user' ? (
                  <p className="whitespace-pre-wrap">{message.text}</p>
                ) : message.text ? (
                  <SimpleMarkdown text={message.text} />
                ) : (
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-zinc-600 rounded-full animate-pulse"></div>
                    <div className="w-2 h-2 bg-zinc-600 rounded-full animate-pulse delay-75"></div>
                    <div className="w-2 h-2 bg-zinc-600 rounded-full animate-pulse delay-150"></div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ResponseDisplay;