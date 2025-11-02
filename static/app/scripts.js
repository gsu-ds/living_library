function openBook(material_id) {
    console.log("Opening book viewer for material ID:", material_id);
    
    // This will redirect the browser to a new page,
    // passing the material_id in the URL
    window.location.href = `/app/viewer.html?id=${material_id}`;
}

// Function to get a consistent color for a topic
function getTopicColor(topicStr) {
    if (!topicStr) {
        return '#555'; // Default gray
    }
    
    // Use the first topic in the list
    const topic = topicStr.split(',')[0].trim();
    
    let hash = 0;
    for (let i = 0; i < topic.length; i++) {
        hash = topic.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    let color = '#';
    for (let i = 0; i < 3; i++) {
        const value = (hash >> (i * 8)) & 0xFF;
        color += ('00' + value.toString(16)).substr(-2);
    }
    
    // Simple check to make color not too dark
    const r = parseInt(color.substr(1, 2), 16);
    const g = parseInt(color.substr(3, 2), 16);
    const b = parseInt(color.substr(5, 2), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    
    // If too dark, use a fallback
    if (brightness < 50) {
        return '#4a9eff'; // A nice blue fallback
    }
    
    return color;
}

async function loadLibrary(topic = 'all', includeLocal = false) {
    try {
        const response = await fetch(
            `/api/library/browse?topic=${topic !== 'all' ? topic : ''}`
        );
        const data = await response.json();
        
        const grid = document.getElementById('bookGrid');
        grid.innerHTML = '';
        
        if (data.materials && data.materials.length > 0) {
            data.materials.forEach(material => {
                const card = createBookCard(material);
                grid.appendChild(card);
            });
        } else {
            grid.innerHTML = '<p>No materials found</p>';
        }
    } catch (error) {
        console.error('Error loading library:', error);
        document.getElementById('bookGrid').innerHTML = 
            '<p>Error loading materials. Please try again.</p>';
    }
}

function createBookCard(material) {
    const isAccessible = material.is_accessible;
    const div = document.createElement('div');
    div.className = `book-card ${isAccessible ? 'available' : 'local-only'}`;
    
    // Get the first topic for the color, or use 'Uncategorized'
    const firstTopic = material.topics ? material.topics.split(',')[0].trim() : 'Uncategorized';
    
    div.innerHTML = `
        <div class="book-cover">
            <div class="book-spine" style="background: ${getTopicColor(firstTopic)}">
                <h3>${material.title}</h3>
            </div>
        </div>
        
        <div class="book-info">
            <h4>${material.title}</h4>
            <p class="author">${material.authors || 'Unknown'}</p>
            <p class="topic">${material.topics || 'Uncategorized'}</p>
            
            <div class="book-meta">
                <span class="year">${material.year || 'N/A'}</span>
                <span class="pages">${material.pages || '?'} pages</span>
            </div>
            
            ${isAccessible 
                ? `<button onclick="openBook(${material.material_id})" class="btn-primary">
                      📖 Read Now
                  </button>`
                : `<span class="badge local-only">
                      💾 Local Only
                  </span>`
            }
        </div>
    `;
    
    return div;
}