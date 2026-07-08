import os

for root, _, files in os.walk('src/app'):
    for file in files:
        if file == 'page.tsx':
            filepath = os.path.join(root, file)
            with open(filepath, 'r') as f:
                content = f.read()
            
            # Remove the bad line
            content = content.replace("export const dynamic = 'force-dynamic';\n", "")
            
            # Re-add it correctly
            if "'use client';" in content or '"use client";' in content:
                content = content.replace("'use client';", "'use client';\nexport const dynamic = 'force-dynamic';")
                content = content.replace('"use client";', '"use client";\nexport const dynamic = "force-dynamic";')
            else:
                content = "export const dynamic = 'force-dynamic';\n" + content
                
            # Clean up duplicates
            content = content.replace("export const dynamic = 'force-dynamic';\nexport const dynamic = 'force-dynamic';", "export const dynamic = 'force-dynamic';")
            content = content.replace('export const dynamic = "force-dynamic";\nexport const dynamic = "force-dynamic";', 'export const dynamic = "force-dynamic";')
            
            with open(filepath, 'w') as f:
                f.write(content)
