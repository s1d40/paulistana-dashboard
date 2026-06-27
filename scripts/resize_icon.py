from PIL import Image

img = Image.open('dashboard/public/icon.jpg')
print(f"Original size: {img.size}")
img = img.resize((1024, 1024), Image.LANCZOS)
img = img.convert('RGB')
img.save('dashboard/public/icon.png', 'PNG')
print("Saved as 1024x1024 PNG.")
