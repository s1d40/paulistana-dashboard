import os

for root, _, files in os.walk('src/app'):
    for file in files:
        if file == 'page.tsx':
            filepath = os.path.join(root, file)
            with open(filepath, 'r') as f:
                content = f.read()
            
            new_content = content.replace("export const dynamic = 'force-dynamic';\n", "")
            new_content = new_content.replace('export const dynamic = "force-dynamic";\n', '')
            
            if new_content != content:
                with open(filepath, 'w') as f:
                    f.write(new_content)
