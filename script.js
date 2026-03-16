let canvas, ctx;
let image = null;
let rectangles = [];
let isDrawing = false;
let startX, startY;
let currentRect = null;
let selectedRect = null;
let imageName = '';

function init() {
    canvas = document.getElementById('labeling-canvas');
    ctx = canvas.getContext('2d');
    
    document.getElementById('image-upload').addEventListener('change', handleImageUpload);
    document.getElementById('clear-btn').addEventListener('click', clearAll);
    document.getElementById('download-btn').addEventListener('click', downloadYOLO);
    document.getElementById('class-id').addEventListener('input', updateClassIds);
    
    canvas.addEventListener('mousedown', startDrawing);
    document.addEventListener('mousemove', draw);
    document.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('click', selectRect);
}

function updateClassIds() {
    const classId = Math.max(0, parseInt(document.getElementById('class-id').value) || 0);
    if (currentRect) {
        currentRect.classId = classId;
        drawImage();
    }
    if (selectedRect) {
        selectedRect.classId = classId;
        drawImage();
    }
}

function selectRect(e) {
    if (!image) return;
    
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const clickX = (e.clientX - rect.left) * scaleX;
    const clickY = (e.clientY - rect.top) * scaleY;
    
    // 检查是否点击在某个矩形内
    let clickedRect = null;
    for (let i = rectangles.length - 1; i >= 0; i--) {
        const rect = rectangles[i];
        if (clickX >= rect.x && clickX <= rect.x + rect.width && clickY >= rect.y && clickY <= rect.y + rect.height) {
            clickedRect = rect;
            break;
        }
    }
    
    if (clickedRect) {
        selectedRect = clickedRect;
        document.getElementById('class-id').value = clickedRect.classId;
    } else {
        selectedRect = null;
    }
    
    drawImage();
}

function handleImageUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    imageName = file.name.replace(/\.[^/.]+$/, '');
    
    const reader = new FileReader();
    reader.onload = function(e) {
        image = new Image();
        image.onload = function() {
            canvas.width = image.width;
            canvas.height = image.height;
            rectangles = [];
            selectedRect = null;
            currentRect = null;
            drawImage();
        };
        image.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

function drawImage() {
    if (image) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(image, 0, 0);
        drawRectangles();
    }
}

function drawRectangles() {
    rectangles.forEach(rect => {
        if (rect === selectedRect) {
            ctx.strokeStyle = 'blue';
            ctx.lineWidth = 3;
        } else {
            ctx.strokeStyle = 'red';
            ctx.lineWidth = 2;
        }
        ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);
        ctx.fillStyle = rect === selectedRect ? 'rgba(0, 0, 255, 0.2)' : 'rgba(255, 0, 0, 0.2)';
        ctx.fillRect(rect.x, rect.y, rect.width, rect.height);
        ctx.fillStyle = rect === selectedRect ? 'blue' : 'red';
        ctx.font = '12px Arial';
        ctx.fillText(`Class: ${rect.classId}`, rect.x + 5, rect.y - 5);
    });
}

function startDrawing(e) {
    if (!image) return;
    
    isDrawing = true;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    startX = (e.clientX - rect.left) * scaleX;
    startY = (e.clientY - rect.top) * scaleY;
    currentRect = { x: startX, y: startY, width: 0, height: 0, classId: Math.max(0, parseInt(document.getElementById('class-id').value) || 0) };
}

function draw(e) {
    if (!isDrawing || !image) return;
    
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    let currentX = (e.clientX - rect.left) * scaleX;
    let currentY = (e.clientY - rect.top) * scaleY;
    
    // 边界检查，确保坐标在图片范围内
    currentX = Math.max(0, Math.min(currentX, canvas.width));
    currentY = Math.max(0, Math.min(currentY, canvas.height));
    
    currentRect.width = currentX - startX;
    currentRect.height = currentY - startY;
    
    drawImage();
    ctx.strokeStyle = 'red';
    ctx.lineWidth = 2;
    ctx.strokeRect(currentRect.x, currentRect.y, currentRect.width, currentRect.height);
    ctx.fillStyle = 'rgba(255, 0, 0, 0.2)';
    ctx.fillRect(currentRect.x, currentRect.y, currentRect.width, currentRect.height);
}

function stopDrawing() {
    if (!isDrawing || !currentRect) return;
    
    isDrawing = false;
    
    if (Math.abs(currentRect.width) > 5 && Math.abs(currentRect.height) > 5) {
        if (currentRect.width < 0) {
            currentRect.x += currentRect.width;
            currentRect.width = Math.abs(currentRect.width);
        }
        if (currentRect.height < 0) {
            currentRect.y += currentRect.height;
            currentRect.height = Math.abs(currentRect.height);
        }
        rectangles.push(currentRect);
        drawImage();
    }
    
    currentRect = null;
}

function clearAll() {
    rectangles = [];
    drawImage();
}

function downloadYOLO() {
    if (!image || rectangles.length === 0) {
        alert('Please upload an image and draw some rectangles first!');
        return;
    }
    
    let yoloContent = '';
    rectangles.forEach(rect => {
        const centerX = (rect.x + rect.width / 2) / canvas.width;
        const centerY = (rect.y + rect.height / 2) / canvas.height;
        const width = rect.width / canvas.width;
        const height = rect.height / canvas.height;
        yoloContent += `${rect.classId} ${centerX.toFixed(6)} ${centerY.toFixed(6)} ${width.toFixed(6)} ${height.toFixed(6)}\n`;
    });
    
    const blob = new Blob([yoloContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${imageName}.txt`;
    a.click();
    URL.revokeObjectURL(url);
}

window.onload = init;