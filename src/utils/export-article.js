export async function exportArticle(title, slug, content) {
  const base64Regex = /!\[([^\]]*)\]\((data:[^;]+;base64,[^)]+)\)/g;
  const images = [];
  let match;
  while ((match = base64Regex.exec(content)) !== null) {
    images.push({ alt: match[1], dataUri: match[2] });
  }

  if (images.length === 0) {
    const { default: FileSaver } = await import('file-saver');
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    const filename = (slug || title || 'article').replace(/[/\\?%*:|"<>]/g, '-');
    FileSaver.saveAs(blob, `${filename}.md`);
    return;
  }

  const { default: JSZip } = await import('jszip');
  const { default: FileSaver } = await import('file-saver');
  const zip = new JSZip();
  const imgFolder = zip.folder('images');

  let mdContent = content;
  images.forEach((img, i) => {
    const extMatch = img.dataUri.match(/^data:image\/(\w+)/);
    const ext = extMatch ? extMatch[1] : 'png';
    const base64Data = img.dataUri.replace(/^data:[^;]+;base64,/, '');
    const imgName = `img_${String(i + 1).padStart(3, '0')}.${ext}`;
    imgFolder.file(imgName, base64Data, { base64: true });
    mdContent = mdContent.replace(img.dataUri, `images/${imgName}`);
  });

  const filename = (slug || title || 'article').replace(/[/\\?%*:|"<>]/g, '-');
  zip.file(`${filename}.md`, mdContent);

  const blob = await zip.generateAsync({ type: 'blob' });
  FileSaver.saveAs(blob, `${filename}.zip`);
}
