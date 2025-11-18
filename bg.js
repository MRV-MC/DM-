// bg.js - Интерактивная нейросеть с пульсирующей сеткой
class InteractiveNeuralNetwork {
constructor() {
    this.canvas = null;
    this.gridCanvas = null;
    this.ctx = null;
    this.gridCtx = null;
    this.nodes = [];
    this.connections = [];
    this.particles = [];
    this.mouse = { x: 0, y: 0, isActive: false }; // Добавляем фак активности
    this.activationWave = null;
    this.gridPulse = 0;
    this.gridDistortions = [];
    
    this.init();
}
    
    init() {
        this.createCanvases();
        this.createNodes(35);
        this.createConnections();
        this.initEventListeners();
        this.animate();
        this.createBackgroundParticles(25);
    }
    
    createCanvases() {
        // Основной canvas для нейросети
        this.canvas = document.getElementById('neuralCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Canvas для сетки
        this.gridCanvas = document.getElementById('gridCanvas');
        this.gridCtx = this.gridCanvas.getContext('2d');
        
        this.resizeCanvases();
        window.addEventListener('resize', () => this.resizeCanvases());
    }
    
    resizeCanvases() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.gridCanvas.width = window.innerWidth;
        this.gridCanvas.height = window.innerHeight;
        this.drawGrid();
        this.drawNetwork();
    }
    
    createNodes(count) {
        for (let i = 0; i < count; i++) {
            this.nodes.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                size: Math.random() * 4 + 2,
                baseSize: Math.random() * 4 + 2,
                pulse: Math.random() * Math.PI * 2,
                activation: 0,
                connections: []
            });
        }
    }
    
    createConnections() {
        for (let i = 0; i < this.nodes.length; i++) {
            for (let j = i + 1; j < this.nodes.length; j++) {
                const nodeA = this.nodes[i];
                const nodeB = this.nodes[j];
                const distance = this.getDistance(nodeA, nodeB);
                
                if (distance < 250) {
                    const connection = {
                        nodeA: nodeA,
                        nodeB: nodeB,
                        distance: distance,
                        strength: 1 - (distance / 250),
                        active: false,
                        progress: 0
                    };
                    
                    this.connections.push(connection);
                    nodeA.connections.push(connection);
                    nodeB.connections.push(connection);
                }
            }
        }
    }
    
    createBackgroundParticles(count) {
        const container = document.querySelector('.particles-container');
        
        for (let i = 0; i < count; i++) {
            const particle = document.createElement('div');
            particle.className = `particle type-${Math.floor(Math.random() * 3) + 1}`;
            
            const left = Math.random() * 100;
            const top = Math.random() * 100;
            const delay = Math.random() * 20;
            const duration = 15 + Math.random() * 15;
            
            particle.style.left = `${left}%`;
            particle.style.top = `${top}%`;
            particle.style.animationDelay = `${delay}s`;
            particle.style.animationDuration = `${duration}s`;
            
            container.appendChild(particle);
        }
    }
    
  initEventListeners() {
    // Взаимодействие с мышью
    this.canvas.addEventListener('mousemove', (e) => {
        const rect = this.canvas.getBoundingClientRect();
        this.mouse.x = e.clientX - rect.left;
        this.mouse.y = e.clientY - rect.top;
        this.handleMouseMove();
    });
        
        this.canvas.addEventListener('click', (e) => {
            this.createActivationWave(e.clientX, e.clientY);
            this.activateNearbyNodes(e.clientX, e.clientY, 150);
            this.createGridDistortion(e.clientX, e.clientY);
        });
        
        // Скрываем эффект когда мышь ушла с canvas
        this.canvas.addEventListener('mouseleave', () => {
            this.mouse.x = -100;
            this.mouse.y = -100;
        });
        
        // Касание для мобильных устройств
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            this.mouse.x = e.touches[0].clientX;
            this.mouse.y = e.touches[0].clientY;
            this.handleMouseMove();
        });
        
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.createActivationWave(e.touches[0].clientX, e.touches[0].clientY);
            this.activateNearbyNodes(e.touches[0].clientX, e.touches[0].clientY, 150);
            this.createGridDistortion(e.touches[0].clientX, e.touches[0].clientY);
        });
    }
    
    handleMouseMove() {
        // Активация узлов при наведении
        this.nodes.forEach(node => {
            const distance = this.getDistance(node, this.mouse);
            if (distance < 80) {
                node.activation = Math.min(node.activation + 0.3, 1);
            }
        });
        
        // Создаем легкое искажение сетки под курсором
        this.createGridDistortion(this.mouse.x, this.mouse.y, 0.3);
    }
    
    createActivationWave(x, y) {
        this.activationWave = {
            x: x,
            y: y,
            radius: 0,
            maxRadius: 300,
            speed: 8
        };
        
        this.createVisualPulse(x, y);
    }
    
    createVisualPulse(x, y) {
        const pulse = document.createElement('div');
        pulse.className = 'neural-pulse';
        pulse.style.left = `${x}px`;
        pulse.style.top = `${y}px`;
        document.querySelector('.background-container').appendChild(pulse);
        
        setTimeout(() => {
            pulse.remove();
        }, 2000);
    }
    
    createGridDistortion(x, y, intensity = 0.5) {
        // Добавляем искажение сетки
        this.gridDistortions.push({
            x: x,
            y: y,
            radius: 0,
            maxRadius: 150,
            intensity: intensity,
            speed: 4
        });
    }
    
    activateNearbyNodes(x, y, radius) {
        this.nodes.forEach(node => {
            const distance = this.getDistance(node, {x, y});
            if (distance < radius) {
                node.activation = 1;
                
                node.connections.forEach(conn => {
                    conn.active = true;
                    conn.progress = 0;
                    
                    setTimeout(() => {
                        conn.active = false;
                    }, 1000);
                });
            }
        });
    }
    
    getDistance(point1, point2) {
        const dx = point1.x - point2.x;
        const dy = point1.y - point2.y;
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    drawGrid() {
    const ctx = this.gridCtx;
    const width = this.gridCanvas.width;
    const height = this.gridCanvas.height;
    
    ctx.clearRect(0, 0, width, height);
    
    // Отладочная информация
    
    // Рисуем простую сетку сначала
    this.drawSimpleGrid();
    
    // Если мышь активна, применяем distortion
    if (this.mouse.isActive) {
        this.applyMouseDistortion();
    }
    
    this.applyGridDistortions();
}

drawSimpleGrid() {
    const ctx = this.gridCtx;
    const width = this.gridCanvas.width;
    const height = this.gridCanvas.height;
    const cellSize = 80;
    
    // Вертикальные линии
    ctx.strokeStyle = 'rgba(107, 97, 255, 0.2)';
    ctx.lineWidth = 1;
    for (let x = 0; x <= width; x += cellSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
    }
    
    // Горизонтальные линии
    for (let y = 0; y <= height; y += cellSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
    }
    
    // Точки пересечений
    ctx.fillStyle = 'rgba(107, 97, 255, 0.4)';
    for (let x = 0; x <= width; x += cellSize) {
        for (let y = 0; y <= height; y += cellSize) {
            ctx.beginPath();
            ctx.arc(x, y, 2, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}

applyMouseDistortion() {
    const ctx = this.gridCtx;
    const width = this.gridCanvas.width;
    const height = this.gridCanvas.height;
    const cellSize = 80;
    const mouseX = this.mouse.x;
    const mouseY = this.mouse.y;
    
    const distortionRadius = 120;
    const maxDistortion = 20;
    
    // Рисуем эффект distortion поверх сетки
    ctx.fillStyle = 'rgba(107, 97, 255, 0.1)';
    ctx.beginPath();
    ctx.arc(mouseX, mouseY, distortionRadius, 0, Math.PI * 2);
    ctx.fill();
    
    // Искажаем точки вблизи курсора
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    for (let x = 0; x <= width; x += cellSize) {
        for (let y = 0; y <= height; y += cellSize) {
            const dist = Math.sqrt(Math.pow(x - mouseX, 2) + Math.pow(y - mouseY, 2));
            
            if (dist < distortionRadius) {
                const strength = 1 - (dist / distortionRadius);
                const angle = Math.atan2(y - mouseY, x - mouseX);
                const newX = x + Math.cos(angle) * maxDistortion * strength;
                const newY = y + Math.sin(angle) * maxDistortion * strength;
                
                ctx.beginPath();
                ctx.arc(newX, newY, 3 + strength * 2, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }
    
    // Рисуем круг вокруг курсора для визуализации
    ctx.strokeStyle = 'rgba(107, 97, 255, 0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(mouseX, mouseY, distortionRadius, 0, Math.PI * 2);
    ctx.stroke();
}
    
    applyGridDistortions() {
        const ctx = this.gridCtx;
        
        this.gridDistortions.forEach((distortion, index) => {
            const progress = distortion.radius / distortion.maxRadius;
            const intensity = distortion.intensity * (1 - progress);
            
            // Создаем градиент для искажения
            const gradient = ctx.createRadialGradient(
                distortion.x, distortion.y, 0,
                distortion.x, distortion.y, distortion.radius
            );
            
            gradient.addColorStop(0, `rgba(107, 97, 255, ${intensity * 0.3})`);
            gradient.addColorStop(0.5, `rgba(107, 97, 255, ${intensity * 0.1})`);
            gradient.addColorStop(1, 'rgba(107, 97, 255, 0)');
            
            // Рисуем эффект искажения
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(distortion.x, distortion.y, distortion.radius, 0, Math.PI * 2);
            ctx.fill();
            
            // Увеличиваем радиус
            distortion.radius += distortion.speed;
            
            // Удаляем завершенные искажения
            if (distortion.radius > distortion.maxRadius) {
                this.gridDistortions.splice(index, 1);
            }
        });
    }
    
    animate() {
        this.update();
        this.drawGrid();
        this.drawNetwork();
        requestAnimationFrame(() => this.animate());
    }
    
    update() {
        // Обновляем пульсацию сетки
        this.gridPulse += 0.02;
        
        // Обновляем узлы
        this.nodes.forEach(node => {
            node.pulse += 0.05;
            node.size = node.baseSize + Math.sin(node.pulse) * 1.5;
            
            if (node.activation > 0) {
                node.activation -= 0.02;
            }
            
            if (Math.random() < 0.002) {
                node.activation = 1;
                this.activateNodeConnections(node);
            }
        });
        
        // Обновляем волну активации
        if (this.activationWave) {
            this.activationWave.radius += this.activationWave.speed;
            
            if (this.activationWave.radius > this.activationWave.maxRadius) {
                this.activationWave = null;
            }
        }
        
        // Обновляем соединения
        this.connections.forEach(conn => {
            if (conn.active) {
                conn.progress += 0.03;
                if (conn.progress >= 1) {
                    conn.progress = 0;
                }
            }
        });
    }
    
    activateNodeConnections(node) {
        node.connections.forEach(conn => {
            conn.active = true;
            conn.progress = 0;
            
            setTimeout(() => {
                conn.active = false;
            }, 800);
        });
    }
    
    drawNetwork() {
        // Очищаем canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Рисуем соединения
        this.drawConnections();
        
        // Рисуем узлы
        this.drawNodes();
        
        // Рисуем волну активации
        if (this.activationWave) {
            this.drawActivationWave();
        }
    }
    
    drawConnections() {
        this.connections.forEach(conn => {
            const alpha = conn.strength * 0.3;
            
            // Основная линия соединения
            this.ctx.beginPath();
            this.ctx.moveTo(conn.nodeA.x, conn.nodeA.y);
            this.ctx.lineTo(conn.nodeB.x, conn.nodeB.y);
            this.ctx.strokeStyle = `rgba(107, 97, 255, ${alpha})`;
            this.ctx.lineWidth = 0.8;
            this.ctx.stroke();
            
            // Активный сигнал
            if (conn.active) {
                const progressX = conn.nodeA.x + (conn.nodeB.x - conn.nodeA.x) * conn.progress;
                const progressY = conn.nodeA.y + (conn.nodeB.y - conn.nodeA.y) * conn.progress;
                
                // Сигнал бегущий по соединению
                this.ctx.beginPath();
                this.ctx.arc(progressX, progressY, 2, 0, Math.PI * 2);
                this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
                this.ctx.fill();
                
                // Свечение сигнала
                this.ctx.beginPath();
                this.ctx.arc(progressX, progressY, 6, 0, Math.PI * 2);
                const gradient = this.ctx.createRadialGradient(
                    progressX, progressY, 0,
                    progressX, progressY, 6
                );
                gradient.addColorStop(0, 'rgba(107, 97, 255, 0.8)');
                gradient.addColorStop(1, 'rgba(107, 97, 255, 0)');
                this.ctx.fillStyle = gradient;
                this.ctx.fill();
            }
        });
    }
    
    drawNodes() {
        this.nodes.forEach(node => {
            const activation = node.activation;
            
            // Внешнее свечение при активации
            if (activation > 0) {
                this.ctx.beginPath();
                this.ctx.arc(node.x, node.y, node.size * 3, 0, Math.PI * 2);
                const gradient = this.ctx.createRadialGradient(
                    node.x, node.y, 0,
                    node.x, node.y, node.size * 3
                );
                gradient.addColorStop(0, `rgba(107, 97, 255, ${activation * 0.4})`);
                gradient.addColorStop(1, 'rgba(107, 97, 255, 0)');
                this.ctx.fillStyle = gradient;
                this.ctx.fill();
            }
            
            // Основной узел
            this.ctx.beginPath();
            this.ctx.arc(node.x, node.y, node.size, 0, Math.PI * 2);
            this.ctx.fillStyle = `rgba(107, 97, 255, ${0.5 + activation * 0.5})`;
            this.ctx.fill();
            
            // Внутреннее ядро
            if (activation > 0) {
                this.ctx.beginPath();
                this.ctx.arc(node.x, node.y, node.size * 0.6, 0, Math.PI * 2);
                this.ctx.fillStyle = `rgba(255, 255, 255, ${activation})`;
                this.ctx.fill();
            }
        });
    }
    
    drawActivationWave() {
        const wave = this.activationWave;
        this.ctx.beginPath();
        this.ctx.arc(wave.x, wave.y, wave.radius, 0, Math.PI * 2);
        this.ctx.strokeStyle = `rgba(107, 97, 255, ${1 - wave.radius / wave.maxRadius})`;
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
    }
    
    destroy() {
        window.removeEventListener('resize', () => this.resizeCanvases());
    }
}

// Инициализация
let neuralNetwork = null;

function initNeuralBackground() {
    if (!neuralNetwork) {
        neuralNetwork = new InteractiveNeuralNetwork();
    }
}

// Автоматический запуск
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initNeuralBackground);
} else {
    initNeuralBackground();
}
