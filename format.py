import re
import sys
import os

def extract_supported_languages(frontmatter):
    match = re.search(r'^supportedLanguages:\n((\s+- \w+\n?)+)', frontmatter, re.MULTILINE)
    langs = []
    if match:
        list_str = match.group(1)
        for l in list_str.splitlines():
            l = l.strip()
            if l.startswith('-'):
                langs.append(l.lstrip('- ').strip())
    return langs

def format_file(filepath):
    with open(filepath, 'r') as f:
        text = f.read()

    m = re.match(r'^(---\n.*?\n---\n)(.*)', text, flags=re.DOTALL)
    if m:
        frontmatter = m.group(1)
        rest = m.group(2)
    else:
        frontmatter = ""
        rest = text

    supported_languages = extract_supported_languages(frontmatter)

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
            # headers
            parts[i] = re.sub(r'(?:\n+|^)(#{1,6}[ \t]+[^\n]*)(?:\n+|$)', r'\n\n\1\n\n', parts[i])
            
            # lists
            sub_lines = parts[i].split('\n')
            res_lines = []
            for j, line in enumerate(sub_lines):
                stripped = line.strip()
                is_list_item = bool(re.match(r'^[-*]\s', stripped) or re.match(r'^\d+\.\s', stripped))
                if is_list_item and j > 0:
                    prev_stripped = res_lines[-1].strip()
                    prev_is_list = bool(re.match(r'^[-*]\s', prev_stripped) or re.match(r'^\d+\.\s', prev_stripped))
                    if prev_stripped != '' and not prev_is_list:
                        res_lines.append('')
                res_lines.append(line)
            parts[i] = '\n'.join(res_lines)

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
                
        for uc in unique_contents:
            final_langs = []
            for l in uc['langs']:
                if l not in final_langs:
                    final_langs.append(l)
            if supported_languages:
                final_langs.sort(key=lambda x: supported_languages.index(x) if x in supported_languages else 999)
            uc['langs'] = final_langs

        def block_sort_key(uc):
            if not supported_languages or not uc['langs']:
                return 999
            first_lang = uc['langs'][0]
            if first_lang in supported_languages:
                return supported_languages.index(first_lang)
            return 999
            
        unique_contents.sort(key=block_sort_key)
                
        out_parts = []
        for uc in unique_contents:
            merged_lang = ' '.join(uc['langs'])
            out_parts.append(f"{uc['start_indent']}<Lang lang=\"{merged_lang}\">\n{uc['content']}\n{uc['end_indent']}</Lang>")
            
        return '\n\n'.join(out_parts)

    lang_block_rx = r'[ \t]*<Lang lang="[^"]+">\n.*?\n[ \t]*</Lang>'
    chain_pattern = re.compile(
        rf'(?:{lang_block_rx}(?:\s+{lang_block_rx})+)', 
        re.DOTALL
    )

    text = chain_pattern.sub(consolidate_chain, text)

    def format_standalone_lang(m):
        start_indent = m.group(1)
        lang_str = m.group(2)
        content = m.group(3)
        end_indent = m.group(4)
        
        langs = []
        for l in lang_str.split():
            if l not in langs:
                langs.append(l)
                
        if supported_languages:
            langs.sort(key=lambda x: supported_languages.index(x) if x in supported_languages else 999)
            
        merged_lang = ' '.join(langs)
        return f"{start_indent}<Lang lang=\"{merged_lang}\">\n{content}\n{end_indent}</Lang>"

    single_lang_block_rx = re.compile(r'([ \t]*)<Lang lang="([^"]+)">\n(.*?)\n([ \t]*)</Lang>', re.DOTALL)
    text = single_lang_block_rx.sub(format_standalone_lang, text)

    # Ensure one empty line around Lang blocks
    text = re.sub(r'(?:\n+|^)([ \t]*<Lang[^>]*>)\n', r'\n\n\1\n', text)
    text = re.sub(r'\n([ \t]*</Lang>)(?:\n+|$)', r'\n\1\n\n', text)

    # Tightly wrap admonitions inside
    text = re.sub(r'([ \t]*:::[\w]+(?:\[.*?\])?)\n+', r'\1\n', text)
    text = re.sub(r'\n+([ \t]*:::)(?:\n|$)', r'\n\1\n', text)

    # Ensure empty lines around admonitions (prevent squashing)
    text = re.sub(r'(?:\n+|^)([ \t]*:::[\w]+(?:\[.*?\])?)\n', r'\n\n\1\n', text)
    text = re.sub(r'\n([ \t]*:::)(?:\n|$)', r'\n\1\n\n', text)

    text = re.sub(r'\n{3,}', r'\n\n', text)

    final_text = frontmatter
    if imports:
        final_text += '\n' + '\n'.join(imports) + '\n\n'
    final_text += text.strip() + '\n'

    with open(filepath, 'w') as f:
        f.write(final_text)
    
    print(f"Formatted: {filepath}")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python3 format.py <file1.mdx> [file2.mdx ...]")
        sys.exit(1)
        
    for arg in sys.argv[1:]:
        if os.path.exists(arg):
            format_file(arg)
        else:
            print(f"File not found: {arg}")
