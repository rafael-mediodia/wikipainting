document.addEventListener('DOMContentLoaded', () => {
    const fetchButton = document.getElementById('fetchButton');
    const clearButton = document.getElementById('clearButton');
    const imageContainer = document.getElementById('imageContainer');
    const loading = document.getElementById('loading');
    const minScaleInput = document.getElementById('minScale');
    const maxScaleInput = document.getElementById('maxScale');
    const minScaleValue = document.getElementById('minScaleValue');
    const maxScaleValue = document.getElementById('maxScaleValue');

    const NUM_ARTICLES = 5; // Number of articles to fetch at once
    const UI_WIDTH = 400; // Width of the UI panel

    // Update scale value displays
    minScaleInput.addEventListener('input', (e) => {
        minScaleValue.textContent = e.target.value;
        if (parseFloat(e.target.value) > parseFloat(maxScaleInput.value)) {
            maxScaleInput.value = e.target.value;
            maxScaleValue.textContent = e.target.value;
        }
    });

    maxScaleInput.addEventListener('input', (e) => {
        maxScaleValue.textContent = e.target.value;
        if (parseFloat(e.target.value) < parseFloat(minScaleInput.value)) {
            minScaleInput.value = e.target.value;
            minScaleValue.textContent = e.target.value;
        }
    });

    function getRandomColor() {
        // Generate a vibrant color using HSL
        const hue = Math.random() * 360;
        const saturation = 70 + Math.random() * 30; // 70-100%
        const lightness = 40 + Math.random() * 20; // 40-60%
        return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
    }

    function getRandomPosition() {
        const padding = 50;
        return {
            x: UI_WIDTH + padding + Math.random() * (window.innerWidth - UI_WIDTH - 400 - padding * 2),
            y: padding + Math.random() * (window.innerHeight - 400 - padding * 2),
            scale: parseFloat(minScaleInput.value) + Math.random() * (parseFloat(maxScaleInput.value) - parseFloat(minScaleInput.value)),
            rotation: Math.random() * 20 - 10
        };
    }

    function createImageElement(url, position, articleTitle) {
        const wrapper = document.createElement('div');
        wrapper.className = 'wiki-image-wrapper';
        wrapper.style.left = `${position.x}px`;
        wrapper.style.top = `${position.y}px`;
        
        const img = document.createElement('img');
        img.src = url;
        img.className = 'wiki-image';
        img.style.transform = `scale(${position.scale}) rotate(${position.rotation}deg)`;
        img.style.maxWidth = '350px';
        img.style.maxHeight = '350px';
        img.style.setProperty('--gradient-color', getRandomColor());

        // Create tooltip
        const tooltip = document.createElement('div');
        tooltip.className = 'tooltip';
        tooltip.textContent = articleTitle;

        // Add click handler to open article
        wrapper.addEventListener('click', () => {
            const articleUrl = `https://en.wikipedia.org/wiki/${encodeURIComponent(articleTitle)}`;
            window.open(articleUrl, '_blank');
        });

        wrapper.appendChild(img);
        wrapper.appendChild(tooltip);
        return wrapper;
    }

    async function getRandomWikipediaArticles() {
        const response = await fetch(`https://en.wikipedia.org/w/api.php?action=query&format=json&list=random&rnnamespace=0&rnlimit=${NUM_ARTICLES}&origin=*`);
        const data = await response.json();
        return data.query.random.map(article => ({
            title: article.title,
            id: article.id
        }));
    }

    async function getImagesFromArticle(title) {
        const response = await fetch(`https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(title)}&prop=images&format=json&origin=*`);
        const data = await response.json();
        const pages = Object.values(data.query.pages);
        return pages[0].images || [];
    }

    async function getImageUrl(filename) {
        const response = await fetch(`https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(filename)}&prop=imageinfo&iiprop=url&format=json&origin=*`);
        const data = await response.json();
        const pages = Object.values(data.query.pages);
        return pages[0].imageinfo?.[0]?.url;
    }

    async function fetchAndDisplayImages() {
        try {
            loading.classList.remove('hidden');
            
            const articles = await getRandomWikipediaArticles();
            
            for (const article of articles) {
                const images = await getImagesFromArticle(article.title);
                
                const filteredImages = images
                    .filter(img => !img.title.toLowerCase().includes('icon') && 
                                 !img.title.toLowerCase().includes('logo') &&
                                 !img.title.toLowerCase().includes('.svg') &&
                                 !img.title.toLowerCase().includes('commons-') &&
                                 !img.title.toLowerCase().includes('edit-') &&
                                 !img.title.toLowerCase().includes('symbol'));

                const imagePromises = filteredImages
                    .slice(0, 3) // Get up to 3 images per article
                    .map(async (img) => {
                        const url = await getImageUrl(img.title);
                        if (url && !url.endsWith('.svg')) {
                            const position = getRandomPosition();
                            const imageWrapper = createImageElement(url, position, article.title);
                            imageContainer.appendChild(imageWrapper);
                        }
                    });

                await Promise.all(imagePromises);
            }
        } catch (error) {
            console.error('Error:', error);
        } finally {
            loading.classList.add('hidden');
        }
    }

    function clearImages() {
        imageContainer.innerHTML = '';
    }

    fetchButton.addEventListener('click', fetchAndDisplayImages);
    clearButton.addEventListener('click', clearImages);

    // Initial load
    fetchAndDisplayImages();
}); 