import re
import sys

with open('/Users/chgill/Projects/docsite/src/content/docs/docs/get-started.mdx', 'r') as f:
    text = f.read()

m = re.match(r'^(---\n.*?\n---\n)(.*)', text, flags=re.DOTALL)
if m:
    frontmatter = m.group(1)
    rest = m.group(2)
else:
    frontmatter = ""
    rest = text

lines = rest.splitlines()
imports = []
other_lines = []
in_imports_zone = True
for line in lines:
    stripped = line.strip()
    if in_imports_zone:
        if stripped.startswith('import '):
            imports.append(line)
        elif stripped == '':
            pass
        else:
            in_imports_zone = False
            other_lines.append(line)
    else:
        other_lines.append(line)

text = '\n'.join(other_lines)

parts = re.split(r'([ \t]*```[^\n]*\n.*?\n[ \t]*```)', text, flags=re.DOTALL)

for i in range(len(parts)):
    if i % 2 == 0:
        parts[i] = re.sub(r'(?:\n+|^)(#{1,6}[ \t]+[^\n]*)(?:\n+|$)', r'\n\n\1\n\n', parts[i])

new_parts = []
for i in range(len(parts)):
    part = parts[i]
    if i % 2 != 0:
        new_parts.append('\n\n' + part.strip('\n') + '\n\n')
    else:
        new_parts.append(part)

text = ''.join(new_parts)
text = re.sub(r'\n{3,}', r'\n\n', text)

# Tightly wrap content inside Lang tags
text = re.sub(r'([ \t]*<Lang[^>]*>)\n+', r'\1\n', text)
text = re.sub(r'\n+([ \t]*</Lang>)', r'\n\1', text)

def consolidate_chain(m):
    chain_text = m.group(0)
    block_pattern = re.compile(
        r'([ \t]*)<Lang lang="([^"]+)">\n(.*?)\n([ \t]*)</Lang>',
        re.DOTALL
    )
    blocks = []
    for match in block_pattern.finditer(chain_text):
        blocks.append({
            'full': match.group(0),
            'start_indent': match.group(1),
            'lang': match.group(2),
            'content': match.group(3),
            'end_indent': match.group(4)
        })
    
    unique_contents = []
    for b in blocks:
        found = False
        for uc in unique_contents:
            if uc['content'] == b['content']:
                uc['langs'].extend(b['lang'].split())
                found = True
                break
        if not found:
            unique_contents.append({
                'content': b['content'],
                'langs': b['lang'].split(),
                'start_indent': b['start_indent'],
                'end_indent': b['end_indent']
            })
            
    out_parts = []
    for uc in unique_contents:
        final_langs = []
        for l in uc['langs']:
            if l not in final_langs:
                final_langs.append(l)
                
        merged_lang = ' '.join(final_langs)
        out_parts.append(f"{uc['start_indent']}<Lang lang=\"{merged_lang}\">\n{uc['content']}\n{uc['end_indent']}</Lang>")
        
    # Re-assemble chain exactly where it was.
    # Use '\n\n' except we want to maintain matching structure but it's simpler to just return
    return '\n\n'.join(out_parts)

lang_block_rx = r'[ \t]*<Lang lang="[^"]+">\n.*?\n[ \t]*</Lang>'
chain_pattern = re.compile(
    rf'(?:{lang_block_rx}(?:\s+{lang_block_rx})+)', 
    re.DOTALL
)

text = chain_pattern.sub(consolidate_chain, text)

# Ensure one empty line around Lang blocks
text = re.sub(r'(?:\n+|^)([ \t]*<Lang[^>]*>)\n', r'\n\n\1\n', text)
text = re.sub(r'\n([ \t]*</Lang>)(?:\n+|$)', r'\n\1\n\n', text)

text = re.sub(r'\n{3,}', r'\n\n', text)

final_text = frontmatter
if imports:
    final_text += '\n' + '\n'.join(imports) + '\n\n'
final_text += text.strip() + '\n'

with open('/Users/chgill/Projects/docsite/src/content/docs/docs/get-started.mdx', 'w') as f:
    f.write(final_text)
