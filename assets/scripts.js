
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
        
        // Domain data based on your spreadsheet
        const domainCounts = {
            'Machine Learning': 16,
            'Artificial Intelligence': 8,
            'Deep Learning': 6,
            'Data Science': 6,
            'Python': 6,
            'Math for ML': 8,
            'Digital Image Processing': 4,
            'Big Data': 3,
            'Statistics': 2,
            'NLP': 1,
            'Data Engineering': 1,
            'Computer Vision': 1,
        };
        
        // Define nodes with your actual domains
        const nodes = [
            { 
                id: 'center', 
                x: 0, 
                y: 0, 
                label: 'Living\nLibrary', 
                type: 'center',
                description: 'Central hub for all Data Science learning materials',
                materials: '50+ resources'
            },
            // LAUNCH APP NODE - positioned prominently at top
            { 
                id: 'launch', 
                x: 0, 
                y: -350, 
                label: 'LAUNCH\nFULL APP', 
                type: 'launch',
                description: 'Access the complete Living Library application with full CRUD operations, vector search, and personalized workspaces',
                materials: 'Click to open app',
                url: 'https://your-app.onrender.com'  // Replace with your actual Render URL
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
            // Launch connects to center
            { from: 'center', to: 'launch', style: 'solid', color: '#00d4ff' },
            
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
            { from: 'ml', to: 'launch', style: 'dashed', color: '#00d4ff' },
            
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
        
        canvas.addEventListener('mousedown', (e) => {
            const node = getNodeAtPosition(e.clientX, e.clientY);
            if (node) {
                if (node.type === 'launch' && node.url) {
                    window.open(node.url, '_blank');
                } else {
                    selectedNode = node;
                    updateNodeDetails(node);
                }
            } else {
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
        
        animate();
        // Sidebar toggle functionality
const sidebar = document.getElementById('sidebar');
const toggleBtn = document.getElementById('toggle-sidebar');
toggleBtn.textContent = '▶ Show Panel';
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
