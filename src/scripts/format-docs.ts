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

function outdentText(content: string, prefix: string = ''): string {
    const lines = content.split('\n');
    const nonEmpty = lines.filter((l: string) => l.trim() !== '');
    if (nonEmpty.length > 0) {
        const minIndent = Math.min(...nonEmpty.map((l: string) => {
            const matchInfo = l.match(/^[ \t]*/);
            return matchInfo ? matchInfo[0].length : 0;
        }));
        return lines.map((l: string) => l.trim() === '' ? '' : prefix + l.substring(minIndent)).join('\n');
    }
    return content;
}


function formatFile(filepath: string) {
    let text = fs.readFileSync(filepath, 'utf8');

    let frontmatter = "";
    let rest = text;
    // ------------------------------------------------------------------------
    // 1. EXTRACT FRONTMATTER
    // ------------------------------------------------------------------------
    const m = text.match(/^(---\n[\s\S]*?\n---\n)([\s\S]*)/);
    if (m) {
        frontmatter = m[1];
        rest = m[2];
    }

    const supportedLanguages = extractSupportedLanguages(frontmatter);

    // ------------------------------------------------------------------------
    // 2. ISOLATE IMPORTS
    // ------------------------------------------------------------------------
    // Prettier can scramble import placements inside MDX if they aren't contiguous.
    // We isolate imports and re-inject them cleanly below the frontmatter.
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

    // ------------------------------------------------------------------------
    // 3. <TabItem> / <Tabs> NORMALIZATION
    // ------------------------------------------------------------------------
    // Prettier does not handle multi-line indentation correctly for nested MD text.
    // We calculate the minimum indent of text/code inside a TabItem and outdent.
    // This stops tools like MDX parsers treating leading indents as raw <pre> sections.
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

    // Split at code boundaries so we don't accidentally format text inside code fences
    const parts = text.split(/([ \t]*```[^\n]*\n[\s\S]*?\n[ \t]*```)/);

    // ------------------------------------------------------------------------
    // 4. CODEBLOCK INDENTATION NORMALIZATION
    // ------------------------------------------------------------------------
    // Fixes over-indented code blocks that sit globally in the document.
    // This allows authors to quickly paste copied code (with generic indentation)
    // while standardizing it to be completely left-justified.
    text = parts.map((part, i) => {
        if (i % 2 !== 0) {
            const repl = part.replace(/^([ \t]*)```([^\n]*)\n([\s\S]*?)\n[ \t]*```$/, (match, startIndent, lang, content) => {
                return `\`\`\`${lang}\n${outdentText(content)}\n\`\`\``;
            });
            return '\n\n' + repl.replace(/\n$/, '') + '\n\n';
        }
        return part;
    }).join('');

    // ------------------------------------------------------------------------
    // 5. BLOCKQUOTES -> ADMONITION CONVERSION
    // ------------------------------------------------------------------------
    // Converts classic GitHub/Markdown blockquotes into Starlight active admonitions/asides.
    text = text.replace(/^>\s*\**\b(Note|Tip|Warning|Important|Caution)\b\**[.:]?\s*([\s\S]*?)(?=\n[ \t]*\n|\n[ \t]*<\/Lang>|$)/gmi, (match, btype, content) => {
        const lowerBtype = btype.toLowerCase();
        const cleanedContent = content.trim().replace(/\n>\s*/g, '\n');
        return `:::${lowerBtype}\n${cleanedContent}\n:::`;
    });

    // ------------------------------------------------------------------------
    // 6. BASH COMMAND CLEANUP
    // ------------------------------------------------------------------------
    // Developers usually copy-paste shell commands beginning with `$ `. To ensure clean 
    // copying within codeblocks, we recursively strip the prefix from all bash blocks.
    text = text.replace(/```(?:bash|sh)\n([\s\S]*?)\n```/g, (match, content) => {
        const lines = content.split('\n');
        const newLines = lines.map((l: string) => l.startsWith('$ ') ? l.substring(2) : l);
        return '```bash\n' + newLines.join('\n') + '\n```';
    });

    // ------------------------------------------------------------------------
    // 7. MULTI-LANGUAGE (<Lang>) BLOCK FORMATTING AND MERGING
    // ------------------------------------------------------------------------
    // loosely wrap content inside Lang tags with empty lines 
    text = text.replace(/([ \t]*<Lang[^>]*>)\n+/g, '$1\n\n');
    text = text.replace(/\n+([ \t]*<\/Lang>)/g, '\n\n$1');

    // Re-indent contents of individual Lang blocks back to column 0 to prevent issues.
    text = text.replace(/([ \t]*)<Lang([^>]*)>\n([\s\S]*?)\n[ \t]*<\/Lang>/g, (match, startIndent, tag, content) => {
        content = outdentText(content.replace(/^\n+|\n+$/g, ''), startIndent);
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

        const langPrecedence = ['js', 'go', 'dart', 'python'];
        const getPrecedence = (langs: string[]) => {
            let minIdx = 999;
            for (const l of langs) {
                const idx = supportedLanguages.includes(l) ? supportedLanguages.indexOf(l) : langPrecedence.includes(l) ? langPrecedence.indexOf(l) : 999;
                if (idx < minIdx) {
                    minIdx = idx;
                }
            }
            return minIdx;
        };

        const numNodes = uniqueContents.length;
        const adj: number[][] = Array.from({ length: numNodes }, () => []);
        const inDegree: number[] = Array(numNodes).fill(0);
        
        const allLangs = new Set<string>();
        for (const uc of uniqueContents) {
            for (const l of uc.langs) allLangs.add(l);
        }

        for (const lang of allLangs) {
            let prevIdx = -1;
            for (let i = 0; i < numNodes; i++) {
                if (uniqueContents[i].langs.includes(lang)) {
                    if (prevIdx !== -1) {
                        adj[prevIdx].push(i);
                        inDegree[i]++;
                    }
                    prevIdx = i;
                }
            }
        }

        const sorted: any[] = [];
        const available: number[] = [];
        for (let i = 0; i < numNodes; i++) {
            if (inDegree[i] === 0) available.push(i);
        }

        while (available.length > 0) {
            let bestAvailIdx = 0;
            let bestPrec = getPrecedence(uniqueContents[available[0]].langs);
            let bestOrigIdx = available[0];

            for (let i = 1; i < available.length; i++) {
                const idx = available[i];
                const prec = getPrecedence(uniqueContents[idx].langs);
                if (prec < bestPrec || (prec === bestPrec && idx < bestOrigIdx)) {
                    bestPrec = prec;
                    bestAvailIdx = i;
                    bestOrigIdx = idx;
                }
            }

            const u = available.splice(bestAvailIdx, 1)[0];
            sorted.push(uniqueContents[u]);

            for (const v of adj[u]) {
                inDegree[v]--;
                if (inDegree[v] === 0) {
                    available.push(v);
                }
            }
        }

        const mergedUniqueContents: any[] = [];
        for (const uc of sorted) {
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

    // Ensure there is spacing before an admonition block if the previous line
    // wasn't a code block or list item, to prevent the admonition from breaking formatting.
    text = text.replace(/([^\n]+)\n+([ \t]*:::)(?:\n|$)/g, (match, prevLine, blockEnd) => {
        const stripped = prevLine.trim();
        if (stripped.startsWith('```') || /^[-*]\s/.test(stripped) || /^\d+\.\s/.test(stripped) || stripped.startsWith('</Lang>')) {
            return `${prevLine}\n\n${blockEnd}`;
        }
        return `${prevLine}\n${blockEnd}`;
    });

    // Make sure we have proper blank lines isolating the start/end of admonitions.
    text = text.replace(/(?:\n+|^)([ \t]*:::[\w]+(?:\[.*?\])?)(?=\n)/g, '\n\n$1');
    text = text.replace(/\n([ \t]*:::)(?:\n+|$)/g, '\n$1\n\n');

    // Note: Compacting \n{3,} to \n\n was removed since Prettier does it natively.

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
