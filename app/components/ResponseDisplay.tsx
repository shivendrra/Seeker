import React from 'react';
import { Message } from '../types';
import { UserCircleIcon, LogoIcon } from './icons';

// Helper component to parse a single line for inline markdown elements
const MarkdownLine: React.FC<{ text: string }> = ({ text }) => {
  // Regex to match all supported markdown patterns at once
  // Order matters: links must be checked before citations to avoid misinterpretation
  const regex = /(\*\*(.*?)\*\*)|(\*(.*?)\*)|(`(.*?)`)|(\[(.*?)\]\((.*?)\))|(\[([^\]]+?)\])/g;

  if (!text) {
    return <>{text}</>;
  }

  const elements: React.ReactNode[] = [];
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    // Push the text before the match
    if (match.index > lastIndex) {
      elements.push(text.substring(lastIndex, match.index));
    }

    // Determine the type of match and push the corresponding element
    if (match[1]) { // Bold: **text**
      elements.push(<strong key={match.index}>{match[2]}</strong>);
    } else if (match[3]) { // Italic: *text*
      elements.push(<em key={match.index}>{match[4]}</em>);
    } else if (match[5]) { // Code: `text`
      elements.push(<code key={match.index} className="bg-gray-200 dark:bg-zinc-700 text-gray-800 dark:text-zinc-200 text-sm rounded px-1.5 py-1 font-mono">{match[6]}</code>);
    } else if (match[7]) { // Link: [text](url)
      elements.push(<a href={match[9]} key={match.index} target="_blank" rel="noopener noreferrer" className="text-indigo-600 dark:text-indigo-400 hover:underline">{match[8]}</a>);
    } else if (match[10]) { // Citation: [text]
      elements.push(<sup key={match.index} className="bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 font-semibold px-1.5 py-0.5 rounded-md text-xs ml-1 cursor-pointer" title={match[11]}>{match[11]}</sup>);
    }

    lastIndex = regex.lastIndex;
  }

  // Push the remaining text after the last match
  if (lastIndex < text.length) {
    elements.push(text.substring(lastIndex));
  }

  return <>{elements.map((el, i) => <React.Fragment key={i}>{el}</React.Fragment>)}</>;
};

// Main component to parse a block of text into markdown elements
const SimpleMarkdown: React.FC<{ text: string }> = ({ text }) => {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  
  let listItems: string[] = [];
  let tableHeaders: string[] = [];
  let tableRows: string[][] = [];
  let inTable = false;
  let inCodeBlock = false;
  let codeBlockLines: string[] = [];
  let codeBlockLang = '';

  const flushList = () => {
    if (listItems.length > 0) {
      elements.push(
        <ul key={`ul-${elements.length}`} className="list-disc list-inside ml-4 my-2 space-y-1">
          {listItems.map((item, i) => <li key={i}><MarkdownLine text={item} /></li>)}
        </ul>
      );
      listItems = [];
    }
  };

  const flushTable = () => {
    if (tableRows.length > 0) {
      elements.push(
        <div key={`table-${elements.length}`} className="overflow-x-auto my-4 border dark:border-zinc-700 rounded-lg">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-zinc-700">
            <thead className="bg-gray-50 dark:bg-zinc-800/50">
              <tr>
                {tableHeaders.map((header, i) => (
                  <th key={i} scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-zinc-400 uppercase tracking-wider">
                    {header.trim()}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-zinc-800 divide-y divide-gray-200 dark:divide-zinc-700">
              {tableRows.map((row, i) => (
                <tr key={i}>
                  {row.map((cell, j) => (
                    <td key={j} className="px-6 py-4 text-sm text-gray-700 dark:text-zinc-300">
                      <MarkdownLine text={cell.trim()} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      tableHeaders = [];
      tableRows = [];
      inTable = false;
    }
  };

  const flushCodeBlock = () => {
    if (codeBlockLines.length > 0) {
        elements.push(
            <div key={`code-${elements.length}`} className="bg-zinc-900 text-white rounded-lg my-4">
                <div className="bg-zinc-700 px-4 py-2 rounded-t-lg text-xs text-zinc-300 font-sans flex justify-between items-center">
                    <span>{codeBlockLang || 'code'}</span>
                </div>
                <pre className="p-4 text-sm overflow-x-auto"><code className={`language-${codeBlockLang}`}>{codeBlockLines.join('\n')}</code></pre>
            </div>
        );
        codeBlockLines = [];
        inCodeBlock = false;
        codeBlockLang = '';
    }
  };


  lines.forEach((line, i) => {
    if (line.startsWith('```')) {
      if (inCodeBlock) {
        flushCodeBlock();
      } else {
        flushList();
        flushTable();
        inCodeBlock = true;
        codeBlockLang = line.substring(3).trim();
      }
      return;
    }

    if (inCodeBlock) {
      codeBlockLines.push(line);
      return;
    }

    const isTableLine = line.trim().startsWith('|') && line.trim().endsWith('|');
    if (isTableLine) {
        flushList();
        const cells = line.split('|').slice(1, -1);
        if (!inTable) {
            inTable = true;
            tableHeaders = cells;
        } else if (!cells.every(cell => cell.trim().match(/^-+$/))) {
            tableRows.push(cells);
        }
    } else {
        flushList();
        flushTable();
        
        if (line.match(/^###\s/)) {
            elements.push(<h3 key={i} className="text-lg font-semibold mt-4 mb-2"><MarkdownLine text={line.replace(/^###\s/, '')} /></h3>);
        } else if (line.match(/^##\s/)) {
            elements.push(<h2 key={i} className="text-xl font-bold mt-6 mb-3 border-b dark:border-zinc-700 pb-2"><MarkdownLine text={line.replace(/^##\s/, '')} /></h2>);
        } else if (line.match(/^#\s/)) {
            elements.push(<h1 key={i} className="text-2xl font-extrabold mt-8 mb-4"><MarkdownLine text={line.replace(/^#\s/, '')} /></h1>);
        } else if (line.match(/^>\s/)) {
            elements.push(<blockquote key={i} className="border-l-4 border-gray-300 dark:border-zinc-600 pl-4 italic text-gray-600 dark:text-zinc-400 my-2"><MarkdownLine text={line.replace(/^>\s/, '')} /></blockquote>);
        } else if (line.match(/^(\*|-)\s/)) {
            listItems.push(line.replace(/^(\*|-)\s/, ''));
        } else if (line.trim() !== '') {
            elements.push(<p key={i}><MarkdownLine text={line} /></p>);
        }
    }
  });
  
  flushList();
  flushTable();
  flushCodeBlock();

  return <div className="space-y-4">{elements}</div>;
};


const WelcomeScreen: React.FC = () => {
    return (
        <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 dark:text-zinc-400">
            <LogoIcon className="w-16 h-16 text-indigo-500 dark:text-indigo-400 mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 dark:text-zinc-100">Start Your Research</h2>
            <p className="max-w-md mt-2">
                Ask a question, request a summary, or specify the information you need.
                Seeker will plan and execute the research for you.
            </p>
        </div>
    );
}

const ResponseDisplay: React.FC<{ messages: Message[] }> = ({ messages }) => {
  if (messages.length === 0) {
      return (
          <div className="flex-1 overflow-y-auto p-6">
              <WelcomeScreen />
          </div>
      );
  }

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-4xl mx-auto space-y-8">
      {messages.map((message) => (
        <div
          key={message.id}
          className={`flex items-start gap-4`}
        >
          {message.sender === 'bot' && (
            <div className="w-8 h-8 flex-shrink-0 bg-indigo-100 dark:bg-zinc-700 rounded-full flex items-center justify-center">
              <LogoIcon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
          )}
           {message.sender === 'user' && (
             <div className="w-8 h-8 flex-shrink-0 bg-gray-200 dark:bg-zinc-600 rounded-full flex items-center justify-center">
              <UserCircleIcon className="w-6 h-6 text-gray-600 dark:text-zinc-300" />
            </div>
          )}

          <div className="flex-1">
            <div className="font-bold text-gray-800 dark:text-zinc-100 mb-1">
              {message.sender === 'user' ? 'You' : 'Seeker'}
            </div>
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