import * as fs from 'fs';
import * as path from 'path';

function extractSupportedLanguages(frontmatter: string): string[] {
    const match = frontmatter.match(/^supportedLanguages:\n((\s+- \w+\n?)+)/m);
    const langs: string[] = [];
    if (match) {
        const listStr = match[1];
        for (let l of listStr.split('\n')) {
            l = l.trim();
            if (l.startsWith('-')) {
                langs.push(l.replace(/^- /, '').trim());
            }
        }
    }
    return langs;
}

function sentenceCaseString(title?: string): string {
    if (!title) return '';
    const properNouns = [
        "Cloud Functions for Firebase", "Genkit", "Developer UI", "AI", "API", "LLM", "LLMs", "UI", 
        "JSON", "Google", "Firebase", "Cloud", "TypeScript", 
        "JavaScript", "Go", "Dart", "Python", "Node.js", "Next.js", 
        "HTTP", "MCP", "RAG", "Firestore", "GCP", "GKE", "CLI", "Ollama", "Pinecone", "Chroma", "Dev UI",
        "Agent Skills"
    ];
    const parts = title.split(/(`[^`]+`)/);
    let capitalizeNext = true;
    
    for (let i = 0; i < parts.length; i++) {
        if (i % 2 !== 0) {
            capitalizeNext = false;
            continue;
        }
        
        let chunk = parts[i];
        if (!chunk) continue;
        
        chunk = chunk.toLowerCase();
        
        const colonParts = chunk.split(':');
        let processedChunk = colonParts[0];
        
        if (capitalizeNext && processedChunk.trim()) {
            const stripped = processedChunk.trimStart();
            const spaces = processedChunk.substring(0, processedChunk.length - stripped.length);
            processedChunk = spaces + stripped.charAt(0).toUpperCase() + stripped.slice(1);
            capitalizeNext = false;
        }
        
        for (let j = 1; j < colonParts.length; j++) {
            const part = colonParts[j];
            if (part.trim()) {
                const stripped = part.trimStart();
                const spaces = part.substring(0, part.length - stripped.length);
                processedChunk += ':' + spaces + stripped.charAt(0).toUpperCase() + stripped.slice(1);
            } else {
                processedChunk += ':' + part;
            }
        }
        
        if (/:[ \t]*$/.test(chunk)) {
            capitalizeNext = true;
        }
        
        for (const noun of properNouns) {
            const regex = new RegExp(`\\b${escapeRegExp(noun)}\\b`, 'gi');
            processedChunk = processedChunk.replace(regex, noun);
        }
        
        parts[i] = processedChunk;
    }
    
    return parts.join('');
}

function escapeRegExp(string: string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}

function formatFile(filepath: string) {
    let text = fs.readFileSync(filepath, 'utf8');

    let frontmatter = "";
    let rest = text;
    const m = text.match(/^(---\n[\s\S]*?\n---\n)([\s\S]*)/);
    if (m) {
        frontmatter = m[1];
        rest = m[2];
    }

    const supportedLanguages = extractSupportedLanguages(frontmatter);

    const lines = rest.split('\n');
    const imports: string[] = [];
    const otherLines: string[] = [];
    let inImportsZone = true;
    for (const line of lines) {
        const stripped = line.trim();
        if (inImportsZone) {
            if (stripped.startsWith('import ')) {
                imports.push(line);
            } else if (stripped === '') {
                // skip
            } else {
                inImportsZone = false;
                otherLines.push(line);
            }
        } else {
            otherLines.push(line);
        }
    }

    text = otherLines.join('\n');

    text = text.replace(/^([ \t]*<TabItem[^>]*>)[ \t]*\n([\s\S]*?)\n([ \t]*<\/TabItem>)[ \t]*$/gm, (match, openTag, content, closeTag) => {
        const lines = content.split('\n');
        
        let inCodeBlock = false;
        const plainLines = lines.filter((l: string) => {
            if (l.trim().startsWith('```')) {
                inCodeBlock = !inCodeBlock;
                return false;
            }
            if (inCodeBlock) return false;
            return l.trim() !== '';
        });
        
        if (plainLines.length > 0) {
            const indents = plainLines.map((l: string) => {
                const matchInfo = l.match(/^[ \t]*/);
                return matchInfo ? matchInfo[0].length : 0;
            });
            const minIndent = Math.min(...indents);
            
            content = lines.map((l: string) => {
                if (l.trim() === '') return '';
                const matchSpace = l.match(/^[ \t]*/);
                const chop = matchSpace ? Math.min(matchSpace[0].length, minIndent) : 0;
                return l.substring(chop);
            }).join('\n');
        }
        
        return `${openTag}\n${content}\n${closeTag}`;
    });

    text = text.replace(/^[ \t]*(<\/?(Tabs|TabItem)[^>]*>)[ \t]*$/gm, '\n\n$1\n\n');

    const parts = text.split(/([ \t]*```[^\n]*\n[\s\S]*?\n[ \t]*```)/);

    for (let i = 0; i < parts.length; i++) {
        if (i % 2 === 0) {
            // headers
            parts[i] = parts[i].replace(/(?:\n+|^)(#{1,6})[ \t]+([^\n]*)(?:\n+|$)/g, (match, hashes, title) => {
                return `\n\n${hashes} ${sentenceCaseString(title)}\n\n`;
            });
            // admonitions
            parts[i] = parts[i].replace(/(?:\n+|^)([ \t]*:::[\w]+)(?:\[(.*?)\])?(.*)(?:\n+|$)/g, (match, prefix, title, suffix) => {
                let formattedTitle = '';
                if (title) {
                    formattedTitle = '[' + sentenceCaseString(title) + ']';
                }
                return `\n\n${prefix}${formattedTitle}${suffix}\n\n`;
            });
        }
    }

    text = parts.map((part, i) => {
        if (i % 2 !== 0) {
            const repl = part.replace(/^([ \t]*)```([^\n]*)\n([\s\S]*?)\n[ \t]*```$/, (match, startIndent, lang, content) => {
                const lines = content.split('\n');
                const nonEmpty = lines.filter((l: string) => l.trim() !== '');
                
                if (nonEmpty.length > 0) {
                    const indents = nonEmpty.map((l: string) => {
                        const matchInfo = l.match(/^[ \t]*/);
                        return matchInfo ? matchInfo[0].length : 0;
                    });
                    const minIndent = Math.min(...indents);
                    content = lines.map((l: string) => l.trim() === '' ? '' : l.substring(minIndent)).join('\n');
                }
                
                return `\`\`\`${lang}\n${content}\n\`\`\``;
            });
            return '\n\n' + repl.replace(/\n$/, '') + '\n\n';
        }
        return part;
    }).join('');

    // blockquotes
    text = text.replace(/^>\s*\**\b(Note|Tip|Warning|Important|Caution)\b\**[.:]?\s*([\s\S]*?)(?=\n[ \t]*\n|\n[ \t]*<\/Lang>|$)/gmi, (match, btype, content) => {
        const lowerBtype = btype.toLowerCase();
        const cleanedContent = content.trim().replace(/\n>\s*/g, '\n');
        return `:::${lowerBtype}\n${cleanedContent}\n:::`;
    });

    // normalize bash
    text = text.replace(/```(?:bash|sh)\n([\s\S]*?)\n```/g, (match, content) => {
        const lines = content.split('\n');
        const newLines = lines.map((l: string) => l.startsWith('$ ') ? l.substring(2) : l);
        return '```bash\n' + newLines.join('\n') + '\n```';
    });

    // loosely wrap content inside Lang tags
    text = text.replace(/([ \t]*<Lang[^>]*>)\n+/g, '$1\n\n');
    text = text.replace(/\n+([ \t]*<\/Lang>)/g, '\n\n$1');

    // re-indent contents of Lang blocks
    text = text.replace(/([ \t]*)<Lang([^>]*)>\n([\s\S]*?)\n[ \t]*<\/Lang>/g, (match, startIndent, tag, content) => {
        content = content.replace(/^\n+|\n+$/g, '');
        const lines = content.split('\n');
        const nonEmpty = lines.filter((l: string) => l.trim() !== '');
        if (nonEmpty.length > 0) {
            const indents = nonEmpty.map((l: string) => {
                const matchInfo = l.match(/^[ \t]*/);
                return matchInfo ? matchInfo[0].length : 0;
            });
            const minIndent = Math.min(...indents);
            content = lines.map((l: string) => l.trim() === '' ? '' : startIndent + l.substring(minIndent)).join('\n');
        }
        return `${startIndent}<Lang${tag}>\n\n${content}\n\n${startIndent}</Lang>`;
    });

    // consolidate chains
    const langBlockRx = '[ \\t]*<Lang lang="[^"]+">\\n(?:(?!<\\/Lang>)[\\s\\S])*?\\n[ \\t]*<\\/Lang>';
    const chainPattern = new RegExp(`(?:${langBlockRx}(?:\\s+${langBlockRx})*)`, 'g');

    const blockPattern = /([ \t]*)<Lang lang="([^"]+)">\n([\s\S]*?)\n([ \t]*)<\/Lang>/g;

    text = text.replace(chainPattern, (chainText) => {
        const blocks: any[] = [];
        let match;
        // Need to reset the regex if reusing, but we are creating a new one or calling exec in loop.
        // using string.exec isn't available, we use RegExp.exec
        // Make sure to reset lastIndex or create a new inline regex
        const contentBlockPattern = new RegExp(blockPattern);
        while ((match = contentBlockPattern.exec(chainText)) !== null) {
            blocks.push({
                full: match[0],
                startIndent: match[1],
                lang: match[2],
                content: match[3],
                endIndent: match[4]
            });
        }

        const uniqueContents: any[] = [];
        for (const b of blocks) {
            let found = false;
            for (const uc of uniqueContents) {
                if (uc.content === b.content) {
                    uc.langs.push(...b.lang.split(' '));
                    found = true;
                    break;
                }
            }
            if (!found) {
                uniqueContents.push({
                    content: b.content,
                    langs: b.lang.split(' '),
                    startIndent: b.startIndent,
                    endIndent: b.endIndent
                });
            }
        }

        for (const uc of uniqueContents) {
            const finalLangs: string[] = [];
            for (const l of uc.langs) {
                if (!finalLangs.includes(l)) {
                    finalLangs.push(l);
                }
            }
            if (supportedLanguages.length > 0) {
                finalLangs.sort((a, b) => {
                    const idxA = supportedLanguages.includes(a) ? supportedLanguages.indexOf(a) : 999;
                    const idxB = supportedLanguages.includes(b) ? supportedLanguages.indexOf(b) : 999;
                    return idxA - idxB;
                });
            }
            uc.langs = finalLangs;
        }

        uniqueContents.sort((a, b) => {
            if (supportedLanguages.length === 0 || a.langs.length === 0 || b.langs.length === 0) return 0;
            const firstLangA = a.langs[0];
            const firstLangB = b.langs[0];
            const idxA = supportedLanguages.includes(firstLangA) ? supportedLanguages.indexOf(firstLangA) : 999;
            const idxB = supportedLanguages.includes(firstLangB) ? supportedLanguages.indexOf(firstLangB) : 999;
            return idxA - idxB;
        });

        const mergedUniqueContents: any[] = [];
        for (const uc of uniqueContents) {
            if (mergedUniqueContents.length === 0) {
                mergedUniqueContents.push(uc);
            } else {
                const lastUc = mergedUniqueContents[mergedUniqueContents.length - 1];
                if (lastUc.langs.join(' ') === uc.langs.join(' ')) {
                    lastUc.content = lastUc.content.replace(/^\n+|\n+$/g, '') + '\n\n' + uc.content.replace(/^\n+|\n+$/g, '');
                } else {
                    mergedUniqueContents.push(uc);
                }
            }
        }

        const outParts = mergedUniqueContents.map(uc => {
            const mergedLang = uc.langs.join(' ');
            const cleanedContent = uc.content.replace(/^\n+|\n+$/g, '');
            return `${uc.startIndent}<Lang lang="${mergedLang}">\n\n${cleanedContent}\n\n${uc.endIndent}</Lang>`;
        });

        return outParts.join('\n\n');
    });

    // ensure empty lines around Lang blocks
    text = text.replace(/(?:\n+|^)([ \t]*<Lang[^>]*>)\n+/g, '\n\n$1\n\n');
    text = text.replace(/\n+([ \t]*<\/Lang>)(?:\n+|$)/g, '\n\n$1\n\n');

    // admonition formating
    text = text.replace(/([ \t]*:::[\w]+(?:\[.*?\])?)\n+(?!```|[-*]\s|\d+\.\s|<Lang)/g, '$1\n');
    text = text.replace(/([ \t]*:::[\w]+(?:\[.*?\])?)\n+(?=```|[-*]\s|\d+\.\s|<Lang)/g, '$1\n\n');

    text = text.replace(/([^\n]+)\n+([ \t]*:::)(?:\n|$)/gm, (match, prevLine, blockEnd) => {
        prevLine = prevLine.trim();
        if (prevLine.startsWith('```') || /^[-*]\s/.test(prevLine) || /^\d+\.\s/.test(prevLine) || prevLine.startsWith('</Lang>')) {
            return `${match}`;
        }
        return `${match}`;
    });
    // Let's accurately map Python logic:
    // prev_line = m.group(1).strip()
    // if prev_line.startswith('```') or re.match(r'^[-*]\s', prev_line) or re.match(r'^\d+\.\s', prev_line) or prev_line.startswith('</Lang>'):
    //     return f"{m.group(1)}\n\n{m.group(2)}"
    // return f"{m.group(1)}\n{m.group(2)}"
    text = text.replace(/([^\n]+)\n+([ \t]*:::)(?:\n|$)/g, (match, prevLine, blockEnd) => {
        const stripped = prevLine.trim();
        if (stripped.startsWith('```') || /^[-*]\s/.test(stripped) || /^\d+\.\s/.test(stripped) || stripped.startsWith('</Lang>')) {
            return `${prevLine}\n\n${blockEnd}`;
        }
        return `${prevLine}\n${blockEnd}`;
    });

    text = text.replace(/(?:\n+|^)([ \t]*:::[\w]+(?:\[.*?\])?)(?=\n)/g, '\n\n$1');
    text = text.replace(/\n([ \t]*:::)(?:\n+|$)/g, '\n$1\n\n');

    text = text.replace(/\n{3,}/g, '\n\n');

    let finalText = frontmatter;
    if (imports.length > 0) {
        finalText += '\n' + imports.join('\n') + '\n\n';
    }
    finalText += text.trim() + '\n';

    fs.writeFileSync(filepath, finalText, 'utf8');
    console.log(`Formatted: ${filepath}`);
}

const args = process.argv.slice(2);
if (args.length === 0) {
    console.log("Usage: tsx format-docs.ts <file1.mdx> [file2.mdx ...]");
    process.exit(1);
}

for (const arg of args) {
    if (fs.existsSync(arg)) {
        formatFile(arg);
    } else {
        console.log(`File not found: ${arg}`);
    }
}
