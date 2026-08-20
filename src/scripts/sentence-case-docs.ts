import * as fs from 'fs';
import * as path from 'path';

function sentenceCaseString(title?: string): string {
    if (!title) return '';
    const properNouns = [
        "Cloud Functions for Firebase", "Genkit", "Developer UI", "AI", "API", "LLM", "LLMs", "UI", 
        "JSON", "Google", "Firebase", "Cloud", "TypeScript", 
        "JavaScript", "Go", "Dart", "Python", "Node.js", "Next.js", 
        "HTTP", "MCP", "RAG", "Firestore", "GCP", "GKE", "CLI", "Ollama", "Pinecone", "Chroma", "Dev UI",
        "Agent Skills"
    ];

    const localProperNouns = [...properNouns];
    const words = title.split(/[^a-zA-Z0-9_-]+/);
    for (const w of words) {
        // preserve pure acronyms (e.g. AST, JSON)
        if (w.length > 1 && w === w.toUpperCase() && /[A-Z]/.test(w)) {
            localProperNouns.push(w);
        }
        // preserve words with internal capitalization (camelCase, PascalCase) e.g InMemoryStreamManager
        else if (w.length > 1 && /[a-z]/.test(w) && /[A-Z]/.test(w.substring(1))) {
            localProperNouns.push(w);
        }
    }
    
    // Sort descending by length so longer multi-word nouns don't get partially matched
    localProperNouns.sort((a, b) => b.length - a.length);

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
        
        for (const noun of localProperNouns) {
            const regex = new RegExp(`\\b${escapeRegExp(noun)}\\b`, 'gi');
            processedChunk = processedChunk.replace(regex, noun);
        }
        
        parts[i] = processedChunk;
    }
    
    return parts.join('');
}

function escapeRegExp(string: string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function formatFile(filepath: string) {
    let text = fs.readFileSync(filepath, 'utf8');

    // To safely ignore formatting inside code blocks, split by them:
    const parts = text.split(/([ \t]*```[^\n]*\n[\s\S]*?\n[ \t]*```)/);

    for (let i = 0; i < parts.length; i++) {
        if (i % 2 === 0) {
            // Apply casing logic ONLY to markdown prose (even indices, meaning outside of code blocks)
            
            // headers
            parts[i] = parts[i].replace(/(?:\n+|^)(#{1,6})[ \t]+([^\n]*)(?:\n+|$)/g, (match, hashes, title) => {
                return `\n\n${hashes} ${sentenceCaseString(title)}\n\n`;
            });
            
            // admonitions
            parts[i] = parts[i].replace(/^([ \t]*:::[\w]+)(?:\[(.*?)\])?(.*)$/gm, (match, prefix, title, suffix) => {
                let formattedTitle = '';
                if (title) {
                    formattedTitle = '[' + sentenceCaseString(title) + ']';
                }
                return `${prefix}${formattedTitle}${suffix}`;
            });
        }
    }

    text = parts.join('');

    // Clean up excessive newlines simply caused by replacing \n\n multiple times:
    text = text.replace(/\n{3,}/g, '\n\n');

    fs.writeFileSync(filepath, text, 'utf8');
    console.log(`Sentence-cased: ${filepath}`);
}

const args = process.argv.slice(2);
if (args.length === 0) {
    console.log("Usage: tsx sentence-case-docs.ts <file1.mdx> [file2.mdx ...]");
    process.exit(1);
}

for (const arg of args) {
    if (fs.existsSync(arg)) {
        formatFile(arg);
    } else {
        console.log(`File not found: ${arg}`);
    }
}
