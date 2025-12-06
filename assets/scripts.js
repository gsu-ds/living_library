
        const canvas = document.getElementById('canvas');
        const ctx = canvas.getContext('2d');
        
        let width = canvas.width = window.innerWidth;
        let height = canvas.height = window.innerHeight;
        
        let offsetX = width / 2;
        let offsetY = height / 2;
        let isDragging = false;
        let dragStartX = 0;
        let dragStartY = 0;
        let pulsePhase = 0;
        
        // Domain data

        const domainCounts = {
            'Artificial Intelligence': 4,
            'Big Data': 3,
            'Computer Vision': 4,
            'Data Engineering': 0,
            'Data Science': 10,
            'Deep Learning': 4,
            'Digital Image Processing': 0,
            'Ethics': 1,
            'Large Language Models': 1,
            'Machine Learning': 12,
            'Math for Machine Learning': 8,
            'NLP': 1,
            'Natural Language Processing': 1,
            'Python': 5,
            'Statistics': 4,
};
        
        // Nodes defined by domain
        const nodes = [
            { 
                id: 'center', 
                x: 0, 
                y: 0, 
                label: 'Living\nLibrary', 
                type: 'center',
                description: 'Central hub for all Data Science learning materials',
                materials: '55+ resources',
                url: '/app/browse.html'
            },
        
            // Core ML/AI cluster
            { 
                id: 'ml', 
                x: 0, 
                y: -200, 
                label: 'Machine\nLearning', 
                type: 'circle',
                description: 'Core ML algorithms, theory, and applications',
                materials: `${domainCounts['Machine Learning']} materials`
            },
            { 
                id: 'ai', 
                x: -180, 
                y: -150, 
                label: 'Artificial\nIntelligence', 
                type: 'circle',
                description: 'AI fundamentals, intelligent systems, and applications',
                materials: `${domainCounts['Artificial Intelligence']} materials`
            },
            { 
                id: 'dl', 
                x: 180, 
                y: -150, 
                label: 'Deep\nLearning', 
                type: 'circle',
                description: 'Neural networks, CNNs, RNNs, and modern architectures',
                materials: `${domainCounts['Deep Learning']} materials`
            },
            
            // Programming cluster (left)
            { 
                id: 'python', 
                x: -280, 
                y: 0, 
                label: 'Python', 
                type: 'square',
                description: 'Python programming, libraries, and best practices',
                materials: `${domainCounts['Python']} materials`
            },
            { 
                id: 'ds', 
                x: -220, 
                y: 120, 
                label: 'Data\nScience', 
                type: 'circle',
                description: 'Data analysis, visualization, and scientific computing',
                materials: `${domainCounts['Data Science']} materials`
            },
            
            // Math/Stats cluster (bottom)
            { 
                id: 'math', 
                x: 0, 
                y: 220, 
                label: 'Math for\nML', 
                type: 'triangle',
                description: 'Linear algebra, calculus, optimization, and probability',
                materials: `${domainCounts['Math for ML']} materials`
            },
            { 
                id: 'stats', 
                x: -120, 
                y: 200, 
                label: 'Statistics', 
                type: 'triangle',
                description: 'Statistical methods and inference',
                materials: `${domainCounts['Statistics']} materials`
            },
            
            // Computer Vision/Image Processing cluster (right)
            { 
                id: 'cv', 
                x: 260, 
                y: 0, 
                label: 'Computer\nVision', 
                type: 'square',
                description: 'Image analysis and visual recognition systems',
                materials: `${domainCounts['Computer Vision']} material`
            },
            { 
                id: 'dip', 
                x: 220, 
                y: 120, 
                label: 'Digital Image\nProcessing', 
                type: 'square',
                description: 'Image manipulation and enhancement techniques',
                materials: `${domainCounts['Digital Image Processing']} materials`
            },
            
            // Specialized domains
            { 
                id: 'nlp', 
                x: 100, 
                y: -230, 
                label: 'NLP', 
                type: 'circle',
                description: 'Natural Language Processing and text analysis',
                materials: `${domainCounts['NLP']} material`
            },
            { 
                id: 'bigdata', 
                x: 120, 
                y: 180, 
                label: 'Big Data', 
                type: 'square',
                description: 'Large-scale data processing and distributed systems',
                materials: `${domainCounts['Big Data']} materials`
            },
            { 
                id: 'de', 
                x: -100, 
                y: -230, 
                label: 'Data\nEngineering', 
                type: 'square',
                description: 'Data pipelines, ETL, and infrastructure',
                materials: `${domainCounts['Data Engineering']} material`
            },
        ];
        
        // Connections representing relationships
        const connections = [

            // Core to primary domains
            { from: 'center', to: 'ml', style: 'solid' },
            { from: 'center', to: 'ai', style: 'solid' },
            { from: 'center', to: 'dl', style: 'solid' },
            { from: 'center', to: 'ds', style: 'solid' },
            { from: 'center', to: 'python', style: 'solid' }, 
            { from: 'center', to: 'math', style: 'solid' },
            { from: 'center', to: 'stats', style: 'solid' },
            { from: 'center', to: 'cv', style: 'solid' },
            { from: 'center', to: 'dip', style: 'solid' },
            { from: 'center', to: 'nlp', style: 'solid' },
            { from: 'center', to: 'bigdata', style: 'solid' },
            { from: 'center', to: 'de', style: 'solid' },
            
            
            // ML ecosystem
            { from: 'ml', to: 'ai', style: 'solid' },
            { from: 'ml', to: 'dl', style: 'solid' },
            { from: 'ml', to: 'nlp', style: 'dashed' },
            { from: 'ml', to: 'cv', style: 'dashed' },
   
            // Math foundations
            { from: 'ml', to: 'math', style: 'solid' },
            { from: 'dl', to: 'math', style: 'solid' },
            { from: 'ds', to: 'stats', style: 'solid' },
            { from: 'math', to: 'stats', style: 'dashed' },
            
            // Programming connections
            { from: 'python', to: 'ds', style: 'solid' },
            { from: 'python', to: 'ml', style: 'dashed' },
            
            // Specialized domains
            { from: 'dl', to: 'cv', style: 'solid' },
            { from: 'cv', to: 'dip', style: 'solid' },
            { from: 'ds', to: 'bigdata', style: 'dashed' },
            { from: 'de', to: 'bigdata', style: 'solid' },
            { from: 'ai', to: 'de', style: 'dashed' },
        ];
        
        let hoveredNode = null;
        let selectedNode = null;
        
        function drawNode(node) {
            const screenX = node.x + offsetX;
            const screenY = node.y + offsetY;
            const isHovered = hoveredNode === node;
            const isSelected = selectedNode === node;
            
            ctx.save();
            ctx.translate(screenX, screenY);
            
            // Special pulsing effect for launch node
            if (node.type === 'launch') {
                const pulse = Math.sin(pulsePhase) * 0.5 + 0.5;
                const scale = 1 + pulse * 0.2;
                ctx.scale(scale, scale);
                
                // Outer glow
                ctx.shadowBlur = 30 + pulse * 20;
                ctx.shadowColor = '#00d4ff';
                
                // Gradient fill
                const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, 18);
                gradient.addColorStop(0, '#00d4ff');
                gradient.addColorStop(1, '#0099ff');
                ctx.fillStyle = gradient;
                
                ctx.beginPath();
                ctx.arc(0, 0, 18, 0, Math.PI * 2);
                ctx.fill();
                
                // Inner ring
                ctx.strokeStyle = '#fff';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(0, 0, 12, 0, Math.PI * 2);
                ctx.stroke();
                
            } else {
                // Glow effect for hover/select
                if (isHovered || isSelected) {
                    ctx.shadowBlur = 20;
                    ctx.shadowColor = '#4a9eff';
                }
                
                // Draw shape
                if (node.type === 'center') {
                    ctx.fillStyle = isHovered ? '#ff8c5a' : '#ff6b35';
                    ctx.beginPath();
                    ctx.arc(0, 0, 15, 0, Math.PI * 2);
                    ctx.fill();
                } else if (node.type === 'circle') {
                    ctx.strokeStyle = isHovered ? '#5ab3ff' : '#4a9eff';
                    ctx.lineWidth = isSelected ? 3 : 2;
                    ctx.beginPath();
                    ctx.arc(0, 0, 10, 0, Math.PI * 2);
                    ctx.stroke();
                    
                    if (isSelected) {
                        ctx.fillStyle = 'rgba(74, 158, 255, 0.2)';
                        ctx.fill();
                    }
                } else if (node.type === 'square') {
                    ctx.strokeStyle = isHovered ? '#5ab3ff' : '#4a9eff';
                    ctx.lineWidth = isSelected ? 3 : 2;
                    ctx.strokeRect(-9, -9, 18, 18);
                    
                    if (isSelected) {
                        ctx.fillStyle = 'rgba(74, 158, 255, 0.2)';
                        ctx.fillRect(-9, -9, 18, 18);
                    }
                } else if (node.type === 'triangle') {
                    ctx.strokeStyle = isHovered ? '#5ab3ff' : '#4a9eff';
                    ctx.lineWidth = isSelected ? 3 : 2;
                    ctx.beginPath();
                    ctx.moveTo(0, -10);
                    ctx.lineTo(9, 9);
                    ctx.lineTo(-9, 9);
                    ctx.closePath();
                    ctx.stroke();
                    
                    if (isSelected) {
                        ctx.fillStyle = 'rgba(74, 158, 255, 0.2)';
                        ctx.fill();
                    }
                }
            }
            
            ctx.shadowBlur = 0;
            
            // Draw label
            if (node.type === 'launch') {
                ctx.fillStyle = isHovered ? '#fff' : '#00d4ff';
                ctx.font = isHovered ? 'bold 14px Monaco' : 'bold 13px Monaco';
            } else {
                ctx.fillStyle = isHovered || isSelected ? '#fff' : '#ccc';
                ctx.font = isHovered || isSelected ? 'bold 12px Monaco' : '11px Monaco';
            }
            
            ctx.textAlign = 'center';
            
            const lines = node.label.split('\n');
            const startY = node.type === 'center' ? 35 : node.type === 'launch' ? 40 : 30;
            lines.forEach((line, i) => {
                ctx.fillText(line, 0, startY + i * 14);
            });
            
            ctx.restore();
        }
        
        function drawConnection(conn) {
            const fromNode = nodes.find(n => n.id === conn.from);
            const toNode = nodes.find(n => n.id === conn.to);
            
            if (!fromNode || !toNode) return;
            
            const x1 = fromNode.x + offsetX;
            const y1 = fromNode.y + offsetY;
            const x2 = toNode.x + offsetX;
            const y2 = toNode.y + offsetY;
            
            const isHighlighted = (hoveredNode === fromNode || hoveredNode === toNode) ||
                                 (selectedNode === fromNode || selectedNode === toNode);
            
            ctx.strokeStyle = conn.color || (isHighlighted ? '#4a9eff' : '#555');
            ctx.lineWidth = isHighlighted ? 2 : 1;
            
            if (conn.style === 'dashed') {
                ctx.setLineDash([5, 5]);
            } else {
                ctx.setLineDash([]);
            }
            
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
            ctx.setLineDash([]);
        }
        
        function render() {
            ctx.clearRect(0, 0, width, height);
            connections.forEach(drawConnection);
            nodes.forEach(drawNode);
        }
        
        function animate() {
            pulsePhase += 0.05;
            render();
            requestAnimationFrame(animate);
        }
        
        function getNodeAtPosition(x, y) {
            for (let node of nodes) {
                const screenX = node.x + offsetX;
                const screenY = node.y + offsetY;
                const hitRadius = node.type === 'launch' ? 45 : 35;
                const dist = Math.sqrt((x - screenX) ** 2 + (y - screenY) ** 2);
                if (dist < hitRadius) return node;
            }
            return null;
        }
        
function updateNodeDetails(node) {
    const detailsDiv = document.getElementById('node-details');
    if (node) {
        // For demo purposes, you can add sample materials for each domain
        const materialsList = {
            'python': [
                'Python Crash Course',
                'Fluent Python',
                'Effective Python',
                'Python for Data Analysis',
                'Automate the Boring Stuff',
                'Learning Python'
            ],
            'ml': [
                'Hands-On Machine Learning',
                'Pattern Recognition and ML',
                'The Hundred-Page ML Book',
                'ML Yearning',
                // ... add your actual materials
            ],
            'ds': [
                'Data Science from Scratch',
                'Practical Statistics for Data Scientists',
                // ... add more
            ],
            // Add materials for other domains...
        };
        
        const materials = materialsList[node.id] || [];
        const materialsHTML = materials.length > 0 
            ? `<div style="margin-top: 10px;">
                 <strong style="color: #4a9eff;">Materials:</strong>
                 <ul style="margin: 8px 0 0 0; padding-left: 20px; line-height: 1.8;">
                   ${materials.map(m => `<li style="color: #ccc;">${m}</li>`).join('')}
                 </ul>
               </div>`
            : '';
        
        detailsDiv.innerHTML = `
            <div class="node-info">
                <div class="node-title">${node.label.replace(/\n/g, ' ')}</div>
                <div style="margin-top: 8px; line-height: 1.5;">
                    ${node.description}
                </div>
                <div style="margin-top: 10px; color: ${node.type === 'launch' ? '#00d4ff' : '#4a9eff'}; font-size: 11px;">
                    ${node.type === 'launch' ? '🚀' : '📚'} ${node.materials}
                </div>
                ${materialsHTML}
            </div>
        `;
    } else {
        detailsDiv.innerHTML = 'Click on any node to see details';
    }
}
        
// --- THIS IS THE CORRECTED FUNCTION ---
canvas.addEventListener('mousedown', (e) => {
    const node = getNodeAtPosition(e.clientX, e.clientY);
    
    if (node) {
        // --- CASE 1: User clicked the center node ---
        if (node.id === 'center') {
            openTopicSelector(); // Open the modal
        
        } else {
            // --- CASE 2: User clicked ANY OTHER node ---
            // This is the part we were missing!
            selectedNode = node;
            updateNodeDetails(node);
        }
    } else {
        // --- CASE 3: User clicked the empty canvas ---
        isDragging = true;
        dragStartX = e.clientX - offsetX;
        dragStartY = e.clientY - offsetY;
    }
});
        
        canvas.addEventListener('mousemove', (e) => {
            if (isDragging) {
                offsetX = e.clientX - dragStartX;
                offsetY = e.clientY - dragStartY;
            } else {
                const node = getNodeAtPosition(e.clientX, e.clientY);
                if (node !== hoveredNode) {
                    hoveredNode = node;
                    canvas.style.cursor = node ? 'pointer' : 'grab';
                }
            }
        });
        
        canvas.addEventListener('mouseup', () => {
            isDragging = false;
        });
        
        canvas.addEventListener('mouseleave', () => {
            isDragging = false;
        });
        
        window.addEventListener('resize', () => {
            width = canvas.width = window.innerWidth;
            height = canvas.height = window.innerHeight;
            offsetX = width / 2;
            offsetY = height / 2;
        });

        
        // --- Add this new function ---
async function loadDynamicSidebar() {
    try {
        const fetchJson = async (url, label) => {
            const response = await fetch(url);
            const rawBody = await response.text();

            if (!response.ok) {
                const preview = rawBody.slice(0, 200) || 'No response body';
                throw new Error(`${label} request failed (${response.status} ${response.statusText}). Received: ${preview}`);
            }

            try {
                return JSON.parse(rawBody);
            } catch (parseError) {
                const preview = rawBody.slice(0, 200) || 'No response body';
                throw new Error(`${label} did not return valid JSON. Received: ${preview}`);
            }
        };

        // Get all materials
        const dataBrowse = await fetchJson('/api/library/browse', 'Browse');
        const materials = dataBrowse.materials;

        // Get all unique topics
        const dataTopics = await fetchJson('/api/library/topics', 'Topics');

        const listContainer = document.getElementById('dynamic-browse-list');
        listContainer.innerHTML = ''; // Clear "Loading..."

        // Build the HTML
        dataTopics.topics.forEach(topic => {
            // Create a header for the topic
            const topicHeader = document.createElement('div');
            topicHeader.className = 'topic-header'; // Add a class for styling
            topicHeader.textContent = topic;

            // Create a list for books under this topic
            const bookList = document.createElement('ul');
            bookList.className = 'book-list';
            bookList.style.display = 'none'; // <-- HIDE THE LIST BY DEFAULT
            bookList.style.paddingLeft = '20px';

            const booksInTopic = materials.filter(m => m.topics && m.topics.includes(topic));
            
            if (booksInTopic.length > 0) {
                // --- ADD THE CLICK EVENT ---
                topicHeader.onclick = () => {
                    // Toggle a class on the header for CSS styling
                    topicHeader.classList.toggle('active');
                    
                    // Toggle the display of the book list
                    if (bookList.style.display === 'none') {
                        bookList.style.display = 'block';
                    } else {
                        bookList.style.display = 'none';
                    }
                };
            } else {
                // Add a class if there are no books, so we can style it differently
                topicHeader.classList.add('empty');
            }

            booksInTopic.forEach(book => {
                const bookItem = document.createElement('li');
                bookItem.style.margin = '5px 0';

                // Add link to the viewer (this logic is unchanged)
                const bookLink = document.createElement('a');
                bookLink.textContent = book.title;
                bookLink.href = `/app/viewer.html?id=${book.material_id}`;
                bookLink.style.color = '#ccc';
                bookLink.style.textDecoration = 'none';
                bookLink.onmouseover = () => bookLink.style.color = '#fff';
                bookLink.onmouseout = () => bookLink.style.color = '#ccc';

                bookItem.appendChild(bookLink);
                bookList.appendChild(bookItem);
            });

            // Add the new elements to the container
            listContainer.appendChild(topicHeader);
            listContainer.appendChild(bookList);
        });

    } catch (error) {
        console.error("Failed to load dynamic sidebar:", error);
        const errorMsg = error.message || "Unknown error";
        document.getElementById('dynamic-browse-list').innerHTML = `<p>Error loading content: ${errorMsg}</p>`;
    }
}
animate();
        
loadDynamicSidebar(); // <-- Add this call

// --- Semantic Search Functionality ---
const searchForm = document.getElementById('search-form');
const searchInput = document.getElementById('search-input');
const searchResults = document.getElementById('search-results');

searchForm.addEventListener('submit', async (e) => {
    e.preventDefault(); // Stop the form from reloading the page
    const query = searchInput.value;
    if (!query) return;

    searchResults.innerHTML = '<p>Searching...</p>';

    try {
        const response = await fetch('/api/search/semantic', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                query: query,
                limit: 5 // Get top 5 results
            })
        });

        if (!response.ok) {
            throw new Error('Search request failed.');
        }

        const data = await response.json();
        
        if (!data.results || data.results.length === 0) {
            searchResults.innerHTML = '<p>No results found.</p>';
            return;
        }

        // Build the results HTML
        searchResults.innerHTML = ''; // Clear "Searching..."
        data.results.forEach(result => {
            const item = document.createElement('div');
            item.className = 'search-result-item';
            
            // Truncate the chunk text for a snippet
            const snippet = result.chunk_text.length > 150 
                ? result.chunk_text.substring(0, 150) + '...' 
                : result.chunk_text;

            item.innerHTML = `
                <span class="title">
                    <a href="/app/viewer.html?id=${result.material_id}" target="_blank">
                        ${result.title}
                    </a>
                </span>
                <div class="page">Page: ${result.page_number}</div>
                <div class="snippet">"...${snippet}..."</div>
            `;
            searchResults.appendChild(item);
        });

    } catch (error) {
        console.error('Search error:', error);
        searchResults.innerHTML = '<p>Error during search. Please try again.</p>';
    }
});
// --- End Semantic Search ---

// --- Sidebar toggle functionality ---
const sidebar = document.getElementById('sidebar');
const toggleBtn = document.getElementById('toggle-sidebar');
toggleBtn.textContent = '◀ Hide Panel';
const resizeHandle = document.getElementById('resize-handle');

let isResizing = false;
let sidebarWidth = 350;

toggleBtn.addEventListener('click', () => {
    sidebar.classList.toggle('collapsed');
    toggleBtn.classList.toggle('collapsed');
    
    if (sidebar.classList.contains('collapsed')) {
        toggleBtn.textContent = '▶ Show Panel';
    } else {
        toggleBtn.textContent = '◀ Hide Panel';
    }
});

// Resize functionality
resizeHandle.addEventListener('mousedown', (e) => {
    isResizing = true;
    resizeHandle.classList.add('dragging');
    canvas.style.cursor = 'ew-resize';
    e.preventDefault();
});

document.addEventListener('mousemove', (e) => {
    if (!isResizing) return;
    
    const newWidth = window.innerWidth - e.clientX;
    if (newWidth >= 250 && newWidth <= 600) {
        sidebarWidth = newWidth;
        sidebar.style.width = `${newWidth}px`;
        toggleBtn.style.right = `${newWidth + 10}px`;
    }
});

document.addEventListener('mouseup', () => {
    if (isResizing) {
        isResizing = false;
        resizeHandle.classList.remove('dragging');
        canvas.style.cursor = 'grab';
    }
});

const topicModal = document.getElementById('topic-modal');
const topicGrid = document.getElementById('topic-grid');
const closeModalBtn = document.getElementById('close-modal');

// This function opens the modal and populates it
async function openTopicSelector() {
    topicGrid.innerHTML = 'Loading topics...'; // Clear old topics
    topicModal.style.display = 'flex'; // Show the modal

    try {
        const resTopics = await fetch('/api/library/topics');
        const dataTopics = await resTopics.json();
        topicGrid.innerHTML = ''; // Clear "Loading..."

        dataTopics.topics.forEach(topic => {
            const topicCard = document.createElement('div');
            topicCard.className = 'topic-card';
            topicCard.textContent = topic;

            // Add click event to select a topic
            topicCard.onclick = () => selectTopic(topic); 

            topicGrid.appendChild(topicCard);
        });
    } catch (error) {
        topicGrid.innerHTML = 'Error loading topics.';
    }
}

// This function closes the modal
closeModalBtn.onclick = () => {
    topicModal.style.display = 'none';
};

// This is the "magic" function
function selectTopic(topicName) {
    // Find the node on the graph that matches the topic name
    // This is a simple text match, you can make it more robust
    const targetNode = nodes.find(n => 
        n.label.toLowerCase().replace('\n', ' ') === topicName.toLowerCase()
    );

    if (targetNode) {
        // Set this as the selected node
        selectedNode = targetNode;
        updateNodeDetails(targetNode); // This updates the sidebar

        // This is the pan/animation part
        // We just set the offset to center the node
        offsetX = (width / 2) - targetNode.x;
        offsetY = (height / 2) - targetNode.y;

        // If the sidebar was collapsed, open it
        if (sidebar.classList.contains('collapsed')) {
            toggleBtn.click();
        }

    } else {
        console.warn(`No node found for topic: ${topicName}`);
    }

    // Close the modal
    topicModal.style.display = 'none';
}